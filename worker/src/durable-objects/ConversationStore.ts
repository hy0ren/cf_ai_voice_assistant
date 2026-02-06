import { DurableObject } from 'cloudflare:workers';

export interface StoredMessage {
  id: number;
  role: string;
  content: string;
  timestamp: number;
  audio_duration: number | null;
}

export interface ConversationMetadata {
  created_at: number;
  updated_at: number;
  message_count: number;
  summary?: string;
}

export class ConversationStore extends DurableObject {
  private initialized = false;

  private ensureInitialized(): void {
    if (this.initialized) return;

    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        audio_duration REAL
      )
    `);

    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    this.initialized = true;
  }

  async addMessage(
    role: string,
    content: string,
    audioDuration?: number
  ): Promise<StoredMessage> {
    this.ensureInitialized();
    const timestamp = Date.now();

    this.ctx.storage.sql.exec(
      `INSERT INTO messages (role, content, timestamp, audio_duration) VALUES (?, ?, ?, ?)`,
      role,
      content,
      timestamp,
      audioDuration ?? null
    );

    // Get the inserted row
    const cursor = this.ctx.storage.sql.exec(
      `SELECT * FROM messages ORDER BY id DESC LIMIT 1`
    );
    const row = [...cursor][0] as unknown as StoredMessage;

    // Update metadata
    this.ctx.storage.sql.exec(
      `INSERT OR REPLACE INTO metadata (key, value) VALUES ('updated_at', ?)`,
      String(timestamp)
    );

    // Set created_at if not set
    this.ctx.storage.sql.exec(
      `INSERT OR IGNORE INTO metadata (key, value) VALUES ('created_at', ?)`,
      String(timestamp)
    );

    return row;
  }

  async getMessages(limit: number = 100): Promise<StoredMessage[]> {
    this.ensureInitialized();

    const cursor = this.ctx.storage.sql.exec(
      `SELECT * FROM messages ORDER BY timestamp ASC LIMIT ?`,
      limit
    );

    return [...cursor] as unknown as StoredMessage[];
  }

  async getRecentContext(
    maxMessages: number = 20
  ): Promise<{ role: string; content: string }[]> {
    this.ensureInitialized();

    const cursor = this.ctx.storage.sql.exec(
      `SELECT role, content FROM messages ORDER BY timestamp DESC LIMIT ?`,
      maxMessages
    );

    const rows = [...cursor] as unknown as { role: string; content: string }[];
    return rows.reverse();
  }

  async getMetadata(): Promise<ConversationMetadata> {
    this.ensureInitialized();

    const countCursor = this.ctx.storage.sql.exec(
      `SELECT COUNT(*) as count FROM messages`
    );
    const countRow = [...countCursor][0] as unknown as { count: number };

    const metaCursor = this.ctx.storage.sql.exec(
      `SELECT key, value FROM metadata`
    );
    const metaRows = [...metaCursor] as unknown as { key: string; value: string }[];

    const meta: Record<string, string> = {};
    for (const row of metaRows) {
      meta[row.key] = row.value;
    }

    return {
      created_at: parseInt(meta['created_at'] || String(Date.now())),
      updated_at: parseInt(meta['updated_at'] || String(Date.now())),
      message_count: countRow.count,
      summary: meta['summary'],
    };
  }

  async clearMessages(): Promise<void> {
    this.ensureInitialized();
    this.ctx.storage.sql.exec(`DELETE FROM messages`);
    this.ctx.storage.sql.exec(`DELETE FROM metadata`);
  }

  async setSummary(summary: string): Promise<void> {
    this.ensureInitialized();
    this.ctx.storage.sql.exec(
      `INSERT OR REPLACE INTO metadata (key, value) VALUES ('summary', ?)`,
      summary
    );
  }
}
