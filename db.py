import os
import resource
import libsql_client
from dotenv import load_dotenv

load_dotenv()

TURSO_URL = os.getenv("TURSO_DATABASE_URL")
TURSO_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

def get_client():
    if not TURSO_URL:
        raise ValueError("TURSO_DATABASE_URL is not set")
    
    # If using a local file (for dev), no token needed.
    # If remote, token is needed.
    config = {"url": TURSO_URL}
    if TURSO_TOKEN:
        config["auth_token"] = TURSO_TOKEN
        
    return libsql_client.create_client_sync(**config)

def init_db():
    client = get_client()
    try:
        client.execute("""
            CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL,  -- JSON string of name, age, bio, etc
                image_url TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # New table for session-based swiping
        client.execute("""
            CREATE TABLE IF NOT EXISTS swipes (
                session_id TEXT NOT NULL,
                profile_id TEXT NOT NULL,
                action TEXT NOT NULL, -- 'like' or 'pass'
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (session_id, profile_id)
            )
        """)
        # Index for faster filtering
        client.execute("CREATE INDEX IF NOT EXISTS idx_swipes_session ON swipes(session_id)")
    finally:
        client.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized.")
