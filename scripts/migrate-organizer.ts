import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log('Running organizer_profile migration...');

  try {
    // Create enum type if not exists
    await sql`
      DO $$ BEGIN
        CREATE TYPE organizer_status AS ENUM('pending', 'approved', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log('✓ Enum type created or already exists');

    // Create table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS organizer_profile (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
        organization_name TEXT NOT NULL,
        website TEXT,
        role TEXT NOT NULL,
        status organizer_status DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        approved_at TIMESTAMP,
        rejected_at TIMESTAMP,
        rejection_reason TEXT
      );
    `;
    console.log('✓ organizer_profile table created or already exists');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
