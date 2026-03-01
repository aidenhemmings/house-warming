const pool = require("./src/db");

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Find groups of duplicate guests (same email + session)
    const { rows: groups } = await client.query(`
      SELECT LOWER(email) as email, session_id, MIN(id) as keeper_id, array_agg(id ORDER BY id) as all_ids
      FROM guests
      GROUP BY LOWER(email), session_id
      HAVING COUNT(*) > 1
    `);

    let mergedCount = 0;
    for (const grp of groups) {
      const dupIds = grp.all_ids.filter((id) => id !== grp.keeper_id);

      // Get all reservations from duplicate guests
      const { rows: dupReservations } = await client.query(
        "SELECT guest_id, item_id, quantity FROM reservations WHERE guest_id = ANY($1)",
        [dupIds],
      );

      for (const dr of dupReservations) {
        // Try to add quantity to keeper's existing reservation for same item
        const { rowCount } = await client.query(
          "UPDATE reservations SET quantity = quantity + $1 WHERE guest_id = $2 AND item_id = $3",
          [dr.quantity, grp.keeper_id, dr.item_id],
        );
        if (rowCount === 0) {
          // Keeper doesn't have this item yet — reassign the reservation
          await client.query(
            "UPDATE reservations SET guest_id = $1 WHERE guest_id = $2 AND item_id = $3",
            [grp.keeper_id, dr.guest_id, dr.item_id],
          );
        } else {
          // Keeper already had it, delete the duplicate reservation
          await client.query(
            "DELETE FROM reservations WHERE guest_id = $1 AND item_id = $2",
            [dr.guest_id, dr.item_id],
          );
        }
      }

      // Delete the duplicate guest rows
      await client.query("DELETE FROM guests WHERE id = ANY($1)", [dupIds]);
      mergedCount += dupIds.length;
    }

    await client.query("COMMIT");
    console.log(
      "Merged",
      groups.length,
      "duplicate groups, deleted",
      mergedCount,
      "guest rows",
    );
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
