/**
 * electron-main/db.ts
 * SQLite initialization and migration runner
 * Dependencies: better-sqlite3, fs, path
 */

import Database from 'better-sqlite3';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { app } from 'electron';

export let db: Database.Database;

/**
 * Initialize database with schema
 */
export async function initDB(): Promise<void> {
  let dbDir = join(process.cwd(), 'user-data');
  if (app && typeof app.getPath === 'function') {
    try {
      dbDir = app.getPath('userData');
    } catch {
      dbDir = join(process.cwd(), 'user-data');
    }
  }

  const dbPath = join(dbDir, 'ai-browser.db');
  mkdirSync(dirname(dbPath), { recursive: true });

  db = new Database(dbPath);

  // Enable WAL mode for concurrent reads
  db.pragma('journal_mode = WAL');

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Locate schema.sql dynamically
  let schemaPath = join(__dirname, 'schema.sql');
  if (!existsSync(schemaPath)) {
    schemaPath = join(__dirname, '..', 'db', 'schema.sql');
  }
  if (!existsSync(schemaPath)) {
    schemaPath = join(__dirname, '..', 'shared', 'schema.sql');
  }
  if (!existsSync(schemaPath)) {
    schemaPath = join(__dirname, '..', '..', 'shared', 'schema.sql');
  }
  if (!existsSync(schemaPath)) {
    schemaPath = join(__dirname, '..', '..', '..', 'shared', 'schema.sql');
  }
  if (!existsSync(schemaPath)) {
    schemaPath = join(__dirname, '..', '..', '..', '..', 'shared', 'schema.sql');
  }

  let schema = '';
  if (existsSync(schemaPath)) {
    schema = readFileSync(schemaPath, 'utf-8');
  } else {
    schema = `
      CREATE TABLE IF NOT EXISTS domain_memory (
        domain TEXT PRIMARY KEY,
        last_visited INTEGER NOT NULL,
        form_inputs TEXT DEFAULT '{}',
        preferences TEXT DEFAULT '{}',
        task_history TEXT DEFAULT '[]'
      );
      CREATE TABLE IF NOT EXISTS user_profile (
        id TEXT PRIMARY KEY,
        first_name TEXT,
        last_name TEXT,
        email TEXT,
        phone TEXT,
        address_json TEXT,
        custom_json TEXT
      );
      CREATE TABLE IF NOT EXISTS workflow_recordings (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        trigger TEXT NOT NULL,
        steps_json TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_used INTEGER,
        run_count INTEGER DEFAULT 0
      );
    `;
  }

  // Split by semicolon and execute each statement
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    db.exec(stmt);
  }

  seedIfEmpty(db);

  console.log('[DB] Initialized at:', dbPath);
}

function seedIfEmpty(database: Database.Database): void {
  try {
    const profileCount = (database.prepare('SELECT count(*) as count FROM user_profile').get() as any)?.count || 0;
    if (profileCount === 0) {
      console.log('[DB] Auto-seeding initial profile and domain memories...');
      database.prepare(`
        INSERT INTO user_profile (id, first_name, last_name, email, phone, address_json, custom_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        'user-001',
        'Alex',
        'Chen',
        'alex.chen@example.com',
        '+1 (555) 019-2834',
        JSON.stringify({
          street: '742 Evergreen Terrace',
          city: 'Springfield',
          state: 'OR',
          zip: '97477',
          country: 'USA',
        }),
        JSON.stringify({
          timezone: 'America/Los_Angeles',
          language: 'en',
          theme: 'dark',
        })
      );

      const demoPreferences = {
        favorite_airline: 'United Airlines',
        frequent_flyer_number: 'UA123456789',
        preferred_seat: 'aisle',
        home_airport: 'SFO',
        passport_expiry: '2028-06-15',
        dietary_preference: 'vegetarian',
        credit_card_last4: '4242',
      };

      database.prepare(`
        INSERT OR REPLACE INTO domain_memory (domain, last_visited, form_inputs, preferences, task_history)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        'kayak.com',
        Date.now(),
        JSON.stringify({
          email: 'alex.chen@example.com',
          phone: '+1 (555) 019-2834',
          frequent_flyer: 'UA123456789',
        }),
        JSON.stringify(demoPreferences),
        JSON.stringify(['Book flight SFO to NYC', 'Search Paris hotels'])
      );

      database.prepare(`
        INSERT OR REPLACE INTO domain_memory (domain, last_visited, form_inputs, preferences, task_history)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        'general',
        Date.now(),
        '{}',
        JSON.stringify(demoPreferences),
        '[]'
      );
      console.log('[DB] Auto-seed completed successfully.');
    }
  } catch (err) {
    console.error('[DB] Auto-seed failed:', err);
  }
}

/**
 * Close database connection
 */
export function closeDB(): void {
  if (db) {
    db.close();
  }
}
