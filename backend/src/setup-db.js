const { Client } = require("pg");
require("dotenv").config();

/**
 * Setup script that:
 * 1. Connects to the default 'postgres' database
 * 2. Creates the application database if it doesn't exist
 * 3. Connects to the application database
 * 4. Runs the schema (tables + indexes)
 * 5. Seeds the admin user (idempotent)
 */
async function setupDatabase() {
  const dbName = process.env.DB_NAME || "housewarming";
  const connectionConfig = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
  };

  // --- Step 1: Create the database if it doesn't exist ---
  console.log(`[setup-db] Checking if database "${dbName}" exists...`);

  const adminClient = new Client({ ...connectionConfig, database: "postgres" });

  try {
    await adminClient.connect();

    const result = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName],
    );

    if (result.rows.length === 0) {
      console.log(`[setup-db] Database "${dbName}" not found. Creating...`);
      // Can't use parameterized queries for CREATE DATABASE
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[setup-db] Database "${dbName}" created successfully.`);
    } else {
      console.log(`[setup-db] Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error("[setup-db] Error checking/creating database:", err.message);
    process.exit(1);
  } finally {
    await adminClient.end();
  }

  // --- Step 2: Run schema migrations ---
  console.log("[setup-db] Running schema...");

  const appClient = new Client({ ...connectionConfig, database: dbName });

  try {
    await appClient.connect();

    const schema = `
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        event_date DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        quantity INTEGER DEFAULT 1,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS guests (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(200) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        guest_id INTEGER REFERENCES guests(id) ON DELETE CASCADE,
        item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(guest_id, item_id)
      );

      CREATE INDEX IF NOT EXISTS idx_items_session_id ON items(session_id);
      CREATE INDEX IF NOT EXISTS idx_guests_session_id ON guests(session_id);
      CREATE INDEX IF NOT EXISTS idx_reservations_guest_id ON reservations(guest_id);
      CREATE INDEX IF NOT EXISTS idx_reservations_item_id ON reservations(item_id);
    `;

    await appClient.query(schema);
    console.log("[setup-db] Schema applied successfully.");

    // --- Step 3: Seed admin user (idempotent) ---
    console.log("[setup-db] Ensuring admin user exists...");

    const bcrypt = require("bcryptjs");
    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const hash = await bcrypt.hash(password, 10);

    await appClient.query(
      `INSERT INTO admins (username, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (username) DO NOTHING`,
      [username, hash],
    );

    console.log(`[setup-db] Admin user "${username}" ready.`);
    console.log("[setup-db] Database setup complete!");
  } catch (err) {
    console.error("[setup-db] Error running schema:", err.message);
    process.exit(1);
  } finally {
    await appClient.end();
  }
}

setupDatabase();
