const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/auth");
const { getIO } = require("../socket");

const router = express.Router();

// GET /api/items?session_id=X - Get items with availability
router.get("/", async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: "session_id is required" });
    }

    const result = await pool.query(
      `SELECT i.*,
        COALESCE(SUM(r.quantity), 0)::int as reserved_quantity,
        CASE WHEN i.quantity IS NULL THEN NULL
             ELSE (i.quantity - COALESCE(SUM(r.quantity), 0))::int END as available_quantity
       FROM items i
       LEFT JOIN reservations r ON i.id = r.item_id
       WHERE i.session_id = $1
       GROUP BY i.id
       ORDER BY i.category, i.name`,
      [session_id],
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get items error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/items/:id - Get single item with availability
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*,
        COALESCE(SUM(r.quantity), 0)::int as reserved_quantity,
        CASE WHEN i.quantity IS NULL THEN NULL
             ELSE (i.quantity - COALESCE(SUM(r.quantity), 0))::int END as available_quantity
       FROM items i
       LEFT JOIN reservations r ON i.id = r.item_id
       WHERE i.id = $1
       GROUP BY i.id`,
      [req.params.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get item error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/items - Admin only
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      session_id,
      name,
      description,
      category,
      quantity,
      icon,
      image_url,
    } = req.body;

    if (!session_id || !name) {
      return res
        .status(400)
        .json({ error: "session_id and name are required" });
    }

    const result = await pool.query(
      `INSERT INTO items (session_id, name, description, category, quantity, icon, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        session_id,
        name,
        description || null,
        category || null,
        quantity || 1,
        icon || null,
        image_url || null,
      ],
    );

    const item = result.rows[0];
    item.reserved_quantity = 0;
    item.available_quantity = item.quantity; // null means unlimited

    const io = getIO();
    io.to(`session-${session_id}`).emit("item-created", item);

    res.status(201).json(item);
  } catch (err) {
    console.error("Create item error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/items/:id - Admin only
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, description, category, quantity, icon, image_url } = req.body;

    const result = await pool.query(
      `UPDATE items
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           quantity = COALESCE($4, quantity),
           icon = $5,
           image_url = COALESCE($6, image_url),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        name,
        description,
        category,
        quantity,
        icon || null,
        image_url,
        req.params.id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Fetch full item with availability
    const fullItem = await pool.query(
      `SELECT i.*,
        COALESCE(SUM(r.quantity), 0)::int as reserved_quantity,
        CASE WHEN i.quantity IS NULL THEN NULL
             ELSE (i.quantity - COALESCE(SUM(r.quantity), 0))::int END as available_quantity
       FROM items i
       LEFT JOIN reservations r ON i.id = r.item_id
       WHERE i.id = $1
       GROUP BY i.id`,
      [req.params.id],
    );

    const io = getIO();
    io.to(`session-${fullItem.rows[0].session_id}`).emit(
      "item-updated",
      fullItem.rows[0],
    );

    res.json(fullItem.rows[0]);
  } catch (err) {
    console.error("Update item error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/items/:id - Admin only
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    // Get item info before deletion for socket notification
    const itemInfo = await pool.query("SELECT * FROM items WHERE id = $1", [
      req.params.id,
    ]);

    if (itemInfo.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    await pool.query("DELETE FROM items WHERE id = $1", [req.params.id]);

    const io = getIO();
    io.to(`session-${itemInfo.rows[0].session_id}`).emit("item-deleted", {
      id: parseInt(req.params.id),
      session_id: itemInfo.rows[0].session_id,
    });

    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error("Delete item error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
