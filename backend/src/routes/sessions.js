const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/auth");
const { getIO } = require("../socket");

const router = express.Router();

// GET /api/sessions - Public: active sessions, Admin: all sessions
router.get("/", async (req, res) => {
  try {
    const isAdmin = req.headers.authorization;
    let query;

    if (isAdmin) {
      query = "SELECT * FROM sessions ORDER BY created_at DESC";
    } else {
      query =
        "SELECT * FROM sessions WHERE is_active = true ORDER BY event_date ASC";
    }

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Get sessions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/sessions/:id
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM sessions WHERE id = $1", [
      req.params.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get session error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/sessions - Admin only
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, description, event_date, is_active } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Session name is required" });
    }

    const result = await pool.query(
      `INSERT INTO sessions (name, description, event_date, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        name,
        description || null,
        event_date || null,
        is_active !== undefined ? is_active : true,
      ],
    );

    const io = getIO();
    io.emit("session-created", result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create session error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/sessions/:id - Admin only
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, description, event_date, is_active } = req.body;

    const result = await pool.query(
      `UPDATE sessions
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           event_date = COALESCE($3, event_date),
           is_active = COALESCE($4, is_active),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, description, event_date, is_active, req.params.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    const io = getIO();
    io.emit("session-updated", result.rows[0]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update session error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/sessions/:id - Admin only
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM sessions WHERE id = $1 RETURNING *",
      [req.params.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    const io = getIO();
    io.emit("session-deleted", { id: parseInt(req.params.id) });

    res.json({ message: "Session deleted successfully" });
  } catch (err) {
    console.error("Delete session error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/sessions/:id/stats - Admin: session statistics
router.get("/:id/stats", authMiddleware, async (req, res) => {
  try {
    const sessionId = req.params.id;

    const stats = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM items WHERE session_id = $1) as total_items,
        (SELECT COALESCE(SUM(quantity), 0) FROM items WHERE session_id = $1) as total_quantity,
        (SELECT COALESCE(SUM(r.quantity), 0) FROM reservations r
         JOIN items i ON r.item_id = i.id WHERE i.session_id = $1) as reserved_quantity,
        (SELECT COUNT(DISTINCT g.id) FROM guests g WHERE g.session_id = $1) as total_guests`,
      [sessionId],
    );

    res.json(stats.rows[0]);
  } catch (err) {
    console.error("Get session stats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
