import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel
from db import get_client

app = FastAPI()

# Allow CORS since frontend is on different origin during dev, 
# and same origin in prod but it doesn't hurt.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SwipeRequest(BaseModel):
    id: str
    action: str 
    session_id: str

@app.get("/api/profiles")
def get_profiles(session_id: str = "default"):
    client = get_client()
    try:
        # Fetch 5 random profiles that THIS session hasn't seen yet
        # Uses a subquery to exclude IDs present in the swipes table for this session_id
        query = """
            SELECT id, data, image_url 
            FROM profiles 
            WHERE id NOT IN (
                SELECT profile_id FROM swipes WHERE session_id = ?
            )
            ORDER BY RANDOM() 
            LIMIT 5
        """
        result = client.execute(query, [session_id])
        
        profiles = []
        for row in result.rows:
            profiles.append({
                "id": row[0],
                "data": json.loads(row[1]), 
                "image_url": row[2]
            })
            
        return profiles
    except Exception as e:
        print(f"Error fetching profiles: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        client.close()

@app.post("/api/swipe")
def swipe_profile(req: SwipeRequest):
    client = get_client()
    try:
        # Record the swipe for this specific session
        # Use INSERT OR IGNORE to handle potential duplicate swipes gracefully
        client.execute(
            "INSERT OR IGNORE INTO swipes (session_id, profile_id, action) VALUES (?, ?, ?)", 
            [req.session_id, req.id, req.action]
        )
        return {"status": "success"}
    except Exception as e:
        print(f"Error swiping: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        client.close()

# Netlify entry point
handler = Mangum(app, api_gateway_base_path="/.netlify/functions")
