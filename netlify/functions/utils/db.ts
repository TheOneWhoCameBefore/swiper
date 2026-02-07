import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

export function getClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
        throw new Error("TURSO_DATABASE_URL is not set");
    }

    return createClient({
        url,
        authToken,
    });
}

export async function initDB() {
    const client = getClient();
    try {
        await client.execute(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        image_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await client.execute(`
      CREATE TABLE IF NOT EXISTS swipes (
        session_id TEXT NOT NULL,
        profile_id TEXT NOT NULL,
        action TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (session_id, profile_id)
      )
    `);

        await client.execute("CREATE INDEX IF NOT EXISTS idx_swipes_session ON swipes(session_id)");
        console.log("Database initialized.");
    } finally {
        client.close();
    }
}
