const pool = require("./db");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function seed() {
  try {
    // ── Wipe all existing data (order matters for foreign keys) ──
    console.log("[seed] Wiping existing data...");
    await pool.query("DELETE FROM reservations");
    await pool.query("DELETE FROM guests");
    await pool.query("DELETE FROM items");
    await pool.query("DELETE FROM sessions");
    await pool.query("DELETE FROM admins");
    console.log("[seed] All tables cleared.");

    // Create default admin
    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO admins (username, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (username) DO NOTHING`,
      [username, hash],
    );
    console.log(`Admin user "${username}" created (or already exists)`);

    // Create sample sessions
    const session1 = await pool.query(
      `INSERT INTO sessions (name, description, event_date, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        "Friends Housewarming",
        "Housewarming party with our amazing friends!",
        "2026-04-15",
        true,
      ],
    );

    const session2 = await pool.query(
      `INSERT INTO sessions (name, description, event_date, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        "Family Housewarming",
        "Housewarming celebration with family",
        "2026-04-22",
        false,
      ],
    );

    const s1Id = session1.rows[0].id;
    const s2Id = session2.rows[0].id;

    // Sample items for session 1
    const items1 = [
      ["Wine Glasses Set", "Set of 6 crystal wine glasses", "Kitchen", 2, s1Id],
      [
        "Dinner Plates",
        "White ceramic dinner plates (set of 4)",
        "Kitchen",
        3,
        s1Id,
      ],
      ["Bath Towel Set", "Luxury cotton bath towels", "Bathroom", 4, s1Id],
      [
        "Throw Pillows",
        "Decorative throw pillows for the living room",
        "Living Room",
        6,
        s1Id,
      ],
      ["Scented Candles", "Assorted premium scented candles", "Decor", 5, s1Id],
      ["Cutting Board Set", "Bamboo cutting board set", "Kitchen", 2, s1Id],
      ["Door Mat", "Welcome door mat", "Entrance", 1, s1Id],
      ["Indoor Plant", "Low-maintenance indoor plants", "Decor", 4, s1Id],
      ["Picture Frames", "Modern picture frame set", "Decor", 3, s1Id],
      ["Coffee Maker", "Drip coffee maker", "Kitchen", 1, s1Id],
    ];

    // Sample items for session 2
    const items2 = [
      [
        "Cookware Set",
        "Non-stick cookware set (10 pieces)",
        "Kitchen",
        1,
        s2Id,
      ],
      ["Bedding Set", "Queen size bedding set", "Bedroom", 2, s2Id],
      ["Vacuum Cleaner", "Cordless stick vacuum", "Cleaning", 1, s2Id],
      ["Spice Rack", "Revolving spice rack with spices", "Kitchen", 1, s2Id],
      ["Wall Clock", "Modern minimalist wall clock", "Decor", 2, s2Id],
      ["Laundry Basket", "Woven laundry basket", "Bathroom", 2, s2Id],
    ];

    for (const item of [...items1, ...items2]) {
      await pool.query(
        `INSERT INTO items (name, description, category, quantity, session_id)
         VALUES ($1, $2, $3, $4, $5)`,
        item,
      );
    }

    console.log("Sample data seeded successfully");
  } catch (err) {
    console.error("Error seeding database:", err);
  } finally {
    await pool.end();
  }
}

seed();
