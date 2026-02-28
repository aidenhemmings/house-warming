const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/auth");
const { getIO } = require("../socket");

const router = express.Router();

// POST /api/guests - Register a guest with item reservations
router.post("/", async (req, res) => {
  const client = await pool.connect();

  try {
    const { session_id, first_name, last_name, email, reservations } = req.body;

    if (!session_id || !first_name || !last_name || !email) {
      return res
        .status(400)
        .json({
          error: "session_id, first_name, last_name, and email are required",
        });
    }

    if (
      !reservations ||
      !Array.isArray(reservations) ||
      reservations.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "At least one item reservation is required" });
    }

    await client.query("BEGIN");

    // Verify session exists and is active
    const sessionCheck = await client.query(
      "SELECT id FROM sessions WHERE id = $1 AND is_active = true",
      [session_id],
    );

    if (sessionCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Session not found or not active" });
    }

    // Check availability for all items
    for (const reservation of reservations) {
      const availCheck = await client.query(
        `SELECT i.quantity - COALESCE(SUM(r.quantity), 0) as available
         FROM items i
         LEFT JOIN reservations r ON i.id = r.item_id
         WHERE i.id = $1 AND i.session_id = $2
         GROUP BY i.id, i.quantity`,
        [reservation.item_id, session_id],
      );

      if (availCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({
            error: `Item ${reservation.item_id} not found in this session`,
          });
      }

      if (availCheck.rows[0].available < (reservation.quantity || 1)) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: `Not enough availability for item ${reservation.item_id}. Available: ${availCheck.rows[0].available}`,
        });
      }
    }

    // Create guest
    const guestResult = await client.query(
      `INSERT INTO guests (session_id, first_name, last_name, email)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [session_id, first_name, last_name, email],
    );

    const guest = guestResult.rows[0];

    // Create reservations
    const createdReservations = [];
    for (const reservation of reservations) {
      const resResult = await client.query(
        `INSERT INTO reservations (guest_id, item_id, quantity)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [guest.id, reservation.item_id, reservation.quantity || 1],
      );
      createdReservations.push(resResult.rows[0]);
    }

    await client.query("COMMIT");

    // Fetch updated items for real-time notification
    const updatedItems = await pool.query(
      `SELECT i.*,
        COALESCE(SUM(r.quantity), 0)::int as reserved_quantity,
        (i.quantity - COALESCE(SUM(r.quantity), 0))::int as available_quantity
       FROM items i
       LEFT JOIN reservations r ON i.id = r.item_id
       WHERE i.session_id = $1
       GROUP BY i.id
       ORDER BY i.category, i.name`,
      [session_id],
    );

    // Emit real-time update
    const io = getIO();
    io.to(`session-${session_id}`).emit("items-updated", updatedItems.rows);
    io.to(`session-${session_id}`).emit("guest-registered", {
      guest,
      reservations: createdReservations,
    });

    res.status(201).json({
      guest,
      reservations: createdReservations,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Register guest error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

// GET /api/guests?session_id=X - Admin only: list guests with their reservations
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: "session_id is required" });
    }

    const guests = await pool.query(
      `SELECT g.*,
        json_agg(
          json_build_object(
            'reservation_id', r.id,
            'item_id', r.item_id,
            'item_name', i.name,
            'item_category', i.category,
            'quantity', r.quantity
          )
        ) FILTER (WHERE r.id IS NOT NULL) as reservations
       FROM guests g
       LEFT JOIN reservations r ON g.id = r.guest_id
       LEFT JOIN items i ON r.item_id = i.id
       WHERE g.session_id = $1
       GROUP BY g.id
       ORDER BY g.created_at DESC`,
      [session_id],
    );

    res.json(guests.rows);
  } catch (err) {
    console.error("Get guests error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/guests/:id - Admin only
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    // Get guest info for socket notification
    const guestInfo = await pool.query("SELECT * FROM guests WHERE id = $1", [
      req.params.id,
    ]);

    if (guestInfo.rows.length === 0) {
      return res.status(404).json({ error: "Guest not found" });
    }

    const sessionId = guestInfo.rows[0].session_id;

    await pool.query("DELETE FROM guests WHERE id = $1", [req.params.id]);

    // Fetch updated items
    const updatedItems = await pool.query(
      `SELECT i.*,
        COALESCE(SUM(r.quantity), 0)::int as reserved_quantity,
        (i.quantity - COALESCE(SUM(r.quantity), 0))::int as available_quantity
       FROM items i
       LEFT JOIN reservations r ON i.id = r.item_id
       WHERE i.session_id = $1
       GROUP BY i.id
       ORDER BY i.category, i.name`,
      [sessionId],
    );

    const io = getIO();
    io.to(`session-${sessionId}`).emit("items-updated", updatedItems.rows);
    io.to(`session-${sessionId}`).emit("guest-removed", {
      id: parseInt(req.params.id),
    });

    res.json({ message: "Guest and their reservations deleted successfully" });
  } catch (err) {
    console.error("Delete guest error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
