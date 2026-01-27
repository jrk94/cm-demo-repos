import * as Database from "better-sqlite3";

/**
 * SQLite database for storing MQTT topic values.
 */
export class CacheDatabase {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS mqtt_values (
        topic TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT
      )
    `);
  }

  /**
   * Store a topic value in the database.
   */
  storeValue(topic: string, value: string): void {
    const timestamp = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO mqtt_values (topic, value, updated_at)
      VALUES (?, ?, ?)
    `);
    stmt.run(topic, value, timestamp);
  }

  /**
   * Get a topic value from the database.
   */
  getValue(topic: string): string | null {
    const stmt = this.db.prepare('SELECT value FROM mqtt_values WHERE topic = ?');
    const row = stmt.get(topic) as { value: string } | undefined;
    return row ? row.value : null;
  }

  /**
   * Get a topic value and its timestamp from the database.
   */
  getValueWithTimestamp(topic: string): { value: string; updatedAt: string } | null {
    const stmt = this.db.prepare('SELECT value, updated_at FROM mqtt_values WHERE topic = ?');
    const row = stmt.get(topic) as { value: string; updated_at: string } | undefined;
    return row ? { value: row.value, updatedAt: row.updated_at } : null;
  }

  /**
   * Close the database connection.
   */
  close(): void {
    this.db.close();
  }
}
