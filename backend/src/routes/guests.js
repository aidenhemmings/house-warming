const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/auth");
const { getIO } = require("../socket");

const router = express.Router();

// GET /api/guests/lookup?email=X&session_id=Y - Public: look up a guest's reservations
router.get("/lookup", async (req, res) => {
  try {
    const { email, session_id } = req.query;

    if (!email || !session_id) {
      return res
        .status(400)
        .json({ error: "email and session_id are required" });
    }

    const result = await pool.query(
      `SELECT g.id as guest_id, g.first_name, g.last_name, g.email,
        json_agg(
          json_build_object(
            'reservation_id', r.id,
            'item_id', r.item_id,
            'item_name', i.name,
            'item_category', i.category,
            'quantity', r.quantity
          ) ORDER BY r.created_at DESC
        ) FILTER (WHERE r.id IS NOT NULL) as reservations
       FROM guests g
       LEFT JOIN reservations r ON g.id = r.guest_id
       LEFT JOIN items i ON r.item_id = i.id
       WHERE LOWER(g.email) = LOWER($1) AND g.session_id = $2
       GROUP BY g.id
       ORDER BY g.created_at DESC`,
      [email, session_id],
    );

    // Merge all reservations from all guest entries (same person may have registered multiple times)
    const allReservations = [];
    for (const row of result.rows) {
      if (row.reservations) {
        allReservations.push(...row.reservations);
      }
    }

    res.json({
      guest:
        result.rows.length > 0
          ? {
              first_name: result.rows[0].first_name,
              last_name: result.rows[0].last_name,
              email: result.rows[0].email,
            }
          : null,
      reservations: allReservations,
    });
  } catch (err) {
    console.error("Guest lookup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/guests/reservations/:id - Public: cancel a specific reservation (verified by email)
router.delete("/reservations/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const { email } = req.query;
    const reservationId = req.params.id;

    if (!email) {
      return res
        .status(400)
        .json({ error: "email query param is required for verification" });
    }

    // Verify the reservation belongs to a guest with this email
    const check = await client.query(
      `SELECT r.id, r.item_id, r.quantity, g.session_id, g.email
       FROM reservations r
       JOIN guests g ON r.guest_id = g.id
       WHERE r.id = $1 AND LOWER(g.email) = LOWER($2)`,
      [reservationId, email],
    );

    if (check.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Reservation not found or email does not match" });
    }

    const { session_id } = check.rows[0];

    await client.query("BEGIN");
    await client.query("DELETE FROM reservations WHERE id = $1", [
      reservationId,
    ]);
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
    io.to(`session-${session_id}`).emit("reservation-cancelled", {
      reservation_id: parseInt(reservationId),
      session_id,
    });

    res.json({ message: "Reservation cancelled successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Cancel reservation error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

// POST /api/guests - Register a guest with item reservations
router.post("/", async (req, res) => {
  const client = await pool.connect();

  try {
    const { session_id, first_name, last_name, email, reservations } = req.body;

    if (!session_id || !first_name || !last_name || !email) {
      return res.status(400).json({
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
        return res.status(400).json({
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

    // Find existing guest or create new one
    const existingGuest = await client.query(
      `SELECT * FROM guests
       WHERE LOWER(email) = LOWER($1) AND session_id = $2
       LIMIT 1`,
      [email, session_id],
    );

    let guest;
    if (existingGuest.rows.length > 0) {
      guest = existingGuest.rows[0];
      // Update name in case it changed
      await client.query(
        `UPDATE guests SET first_name = $1, last_name = $2 WHERE id = $3`,
        [first_name, last_name, guest.id],
      );
    } else {
      const guestResult = await client.query(
        `INSERT INTO guests (session_id, first_name, last_name, email)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [session_id, first_name, last_name, email],
      );
      guest = guestResult.rows[0];
    }

    // Create reservations (upsert: add quantity if already reserved)
    const createdReservations = [];
    for (const reservation of reservations) {
      const resResult = await client.query(
        `INSERT INTO reservations (guest_id, item_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (guest_id, item_id)
         DO UPDATE SET quantity = reservations.quantity + EXCLUDED.quantity
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
      `SELECT
        MIN(g.id) as id,
        g.session_id,
        g.first_name,
        g.last_name,
        LOWER(g.email) as email,
        MIN(g.created_at) as created_at,
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
       GROUP BY g.session_id, g.first_name, g.last_name, LOWER(g.email)
       ORDER BY MIN(g.created_at) DESC`,
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
