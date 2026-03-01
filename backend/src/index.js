const express = require("express");
const http = require("http");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");
const { initSocket } = require("./socket");
const authRoutes = require("./routes/auth");
const sessionRoutes = require("./routes/sessions");
const itemRoutes = require("./routes/items");
const guestRoutes = require("./routes/guests");

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/guests", guestRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // Auto-migrate: ensure categories column exists on sessions
  try {
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE sessions ADD COLUMN categories JSONB DEFAULT '[]'::jsonb;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE items ADD COLUMN icon VARCHAR(100);
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    // Merge duplicate guest rows (same email + session) into the earliest one
    const { rows: dupGroups } = await pool.query(`
      SELECT LOWER(email) as email, session_id, MIN(id) as keeper_id, array_agg(id ORDER BY id) as all_ids
      FROM guests GROUP BY LOWER(email), session_id HAVING COUNT(*) > 1
    `);
    for (const grp of dupGroups) {
      const dupIds = grp.all_ids.filter((id) => id !== grp.keeper_id);
      const { rows: dupRes } = await pool.query(
        "SELECT guest_id, item_id, quantity FROM reservations WHERE guest_id = ANY($1)",
        [dupIds],
      );
      for (const dr of dupRes) {
        const { rowCount } = await pool.query(
          "UPDATE reservations SET quantity = quantity + $1 WHERE guest_id = $2 AND item_id = $3",
          [dr.quantity, grp.keeper_id, dr.item_id],
        );
        if (rowCount === 0) {
          await pool.query(
            "UPDATE reservations SET guest_id = $1 WHERE guest_id = $2 AND item_id = $3",
            [grp.keeper_id, dr.guest_id, dr.item_id],
          );
        } else {
          await pool.query(
            "DELETE FROM reservations WHERE guest_id = $1 AND item_id = $2",
            [dr.guest_id, dr.item_id],
          );
        }
      }
      await pool.query("DELETE FROM guests WHERE id = ANY($1)", [dupIds]);
    }
  } catch (err) {
    console.error("Migration warning:", err.message);
  }
});
