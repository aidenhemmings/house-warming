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

    // Registry items per category
    const registryItems = [
      // Kitchen
      ["Cutting Boards", "Cutting boards for kitchen prep", "Kitchen", 3],
      ["Knives Set", "Kitchen knives set", "Kitchen", 3],
      ["Glasses", "Packs of drinking glasses", "Kitchen", 2],
      ["Cups", "Packs of cups", "Kitchen", 2],
      ["Cutlery", "Packs of cutlery (forks, knives, spoons)", "Kitchen", 2],
      [
        "Cutlery Organizer",
        "Organizer for kitchen cutlery drawer",
        "Kitchen",
        2,
      ],
      [
        "Kitchen Utensils",
        "Kitchen utensils pack (spatula, etc.)",
        "Kitchen",
        2,
      ],
      [
        "Baking Equipment",
        "Baking equipment (measuring cups, etc.)",
        "Kitchen",
        2,
      ],
      ["Tupperware", "Food storage container set", "Kitchen", 1],
      ["Pots", "Cooking pots", "Kitchen", 1],
      ["Pans", "Cooking pans", "Kitchen", 1],
      ["Toaster", "Toaster", "Kitchen", 1],

      // Bathroom
      ["Towels", "Bath towels", "Bathroom", 1],
      ["Shower Caddy", "Shower caddy for storage", "Bathroom", 2],
      ["Shower Curtain", "Shower curtain", "Bathroom", 2],
      ["Bath Mats", "Bath mats", "Bathroom", 2],
      [
        "Bathroom Utensils",
        "Bathroom accessories (toothbrush holder, etc.)",
        "Bathroom",
        2,
      ],
      ["Iron", "Clothes iron", "Bathroom", 1],
      ["Ironing Board", "Ironing board", "Bathroom", 1],
      ["Clothing Baskets", "Laundry / clothing baskets", "Bathroom", 2],

      // Bedroom / Lounge
      ["Lamps", "Lamps for bedroom or lounge", "Bedroom / Lounge", 3],
      ["Blankets", "Cozy blankets", "Bedroom / Lounge", 3],
      ["Bedding Set (Queen)", "Queen size bedding set", "Bedroom / Lounge", 3],
      ["Picture Frames", "Picture frames", "Bedroom / Lounge", 1],
      ["Carpets", "Carpets (bedroom, lounge, etc.)", "Bedroom / Lounge", 1],

      // Gift Cards
      [
        "Cash or Gift Card",
        "Cash or gift cards — PEP Home or Mr Price Home would be greatly appreciated",
        "Gift Cards",
        1,
      ],
    ];

    // Seed both sessions with the same registry items
    for (const sessionId of [s1Id, s2Id]) {
      for (const [name, description, category, quantity] of registryItems) {
        await pool.query(
          `INSERT INTO items (name, description, category, quantity, session_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [name, description, category, quantity, sessionId],
        );
      }
    }

    console.log("Sample data seeded successfully");
  } catch (err) {
    console.error("Error seeding database:", err);
  } finally {
    await pool.end();
  }
}

seed();
