import { getClient } from "./utils/db.js";

interface SwipeRequest {
    id: string;
    action: string;
    session_id: string;
}

export default async (req: Request, context: any) => {
    const url = new URL(req.url);
    const path = url.pathname.replace("/.netlify/functions", "");
    // Netlify might preserve the original path or the rewritten one depending on context,
    // but usually it's best to check multiple segments or just endswith.

    // CORS Headers
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") {
        return new Response(null, { headers });
    }

    const client = getClient();

    try {
        // GET /api/profiles
        if (path.endsWith("/api/profiles") || path.endsWith("/profiles")) {
            const sessionId = url.searchParams.get("session_id") || "default";

            // Fetch 5 random profiles not swipes by this session
            const result = await client.execute({
                sql: `
                SELECT id, data, image_url 
                FROM profiles 
                WHERE id NOT IN (
                    SELECT profile_id FROM swipes WHERE session_id = ?
                )
                ORDER BY RANDOM() 
                LIMIT 5
            `,
                args: [sessionId]
            });

            const profiles = result.rows.map(row => ({
                id: row[0],
                data: JSON.parse(row[1] as string),
                image_url: row[2]
            }));

            return new Response(JSON.stringify(profiles), { headers });
        }

        // POST /api/swipe
        if ((path.endsWith("/api/swipe") || path.endsWith("/swipe")) && req.method === "POST") {
            const body = await req.json() as SwipeRequest;

            if (!body.session_id || !body.id || !body.action) {
                return new Response("Missing required fields", { status: 400, headers });
            }

            await client.execute({
                sql: "INSERT OR IGNORE INTO swipes (session_id, profile_id, action) VALUES (?, ?, ?)",
                args: [body.session_id, body.id, body.action]
            });

            return new Response(JSON.stringify({ status: "success" }), { headers });
        }

        return new Response("Not Found", { status: 404, headers });

    } catch (error) {
        console.error("API Error:", error);
        return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers });
    } finally {
        client.close();
    }
};
