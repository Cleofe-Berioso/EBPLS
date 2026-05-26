/**
 * Safe additive migration: adds businessStatus, closedAt, closureApplicationId
 * to the BusinessRecord table without touching any other tables or columns.
 * Uses LibSQL (the same driver the project uses) for direct SQLite access.
 */
const { createClient } = require('@libsql/client');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = createClient({ url: `file:${dbPath}` });

async function main() {
  // Check existing columns
  const result = await db.execute("PRAGMA table_info(BusinessRecord)");
  const existingCols = result.rows.map((r) => r[1]);
  console.log('Current BusinessRecord columns:', existingCols.join(', '));

  let changed = false;

  if (!existingCols.includes('businessStatus')) {
    await db.execute(
      "ALTER TABLE BusinessRecord ADD COLUMN businessStatus TEXT NOT NULL DEFAULT 'ACTIVE'"
    );
    console.log('✓ Added businessStatus column (default: ACTIVE)');
    changed = true;
  } else {
    console.log('  businessStatus already exists — skipped');
  }

  if (!existingCols.includes('closedAt')) {
    await db.execute("ALTER TABLE BusinessRecord ADD COLUMN closedAt DATETIME");
    console.log('✓ Added closedAt column (nullable)');
    changed = true;
  } else {
    console.log('  closedAt already exists — skipped');
  }

  if (!existingCols.includes('closureApplicationId')) {
    await db.execute(
      "ALTER TABLE BusinessRecord ADD COLUMN closureApplicationId TEXT"
    );
    console.log('✓ Added closureApplicationId column (nullable)');
    changed = true;
  } else {
    console.log('  closureApplicationId already exists — skipped');
  }

  if (changed) {
    const verify = await db.execute("PRAGMA table_info(BusinessRecord)");
    const newCols = verify.rows.map((r) => r[1]);
    console.log('\nUpdated BusinessRecord columns:', newCols.join(', '));
  }

  db.close();
  console.log('\nDone. Migration applied safely — no existing data modified.');
}

main().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
