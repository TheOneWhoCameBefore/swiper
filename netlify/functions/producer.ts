import { getClient } from "./utils/db.js";
import { createFullProfile } from "./utils/generator.js";

// Verify if @netlify/functions is available for types, 
// otherwise use any or just standard export.
// The user installed it.

export default async (req: Request) => {
    // Scheduled functions in Netlify are triggered by an event, 
    // but the standard handler signature can vary. 
    // For scheduled functions, we often just do the work and return.

    console.log("Producer triggered");
    const client = getClient();

    try {
        // 1. Check Total Profiles
        const resultTotal = await client.execute("SELECT COUNT(*) FROM profiles");
        const totalProfiles = resultTotal.rows[0][0] as number;

        // 2. Check "Most Swipes by a Single User"
        const resultSwipes = await client.execute(`
            SELECT MAX(swipe_count) FROM (
                SELECT COUNT(*) as swipe_count 
                FROM swipes 
                GROUP BY session_id
            )
        `);

        let maxUserSwipes = 0;
        if (resultSwipes.rows.length > 0 && resultSwipes.rows[0][0] !== null) {
            maxUserSwipes = resultSwipes.rows[0][0] as number;
        }

        // 3. Calculate Buffer
        const bufferRemaining = totalProfiles - maxUserSwipes;
        console.log(`Stats: Total Profiles=${totalProfiles}, Max User Swipes=${maxUserSwipes}, Buffer=${bufferRemaining}`);

        // 4. Refill Logic
        const MIN_BUFFER_NEEDED = 50;
        const HARD_CAP = 500;
        const BATCH_SIZE = 5;

        if (bufferRemaining < MIN_BUFFER_NEEDED) {
            console.log(`Buffer ${bufferRemaining} < ${MIN_BUFFER_NEEDED}. Generating batch of ${BATCH_SIZE}...`);

            // A. Generate New
            for (let i = 0; i < BATCH_SIZE; i++) {
                try {
                    const profile = await createFullProfile();
                    await client.execute({
                        sql: "INSERT INTO profiles (id, data, image_url) VALUES (?, ?, ?)",
                        args: [profile.id, profile.data, profile.image_url]
                    });
                    console.log(`[${i + 1}/${BATCH_SIZE}] Generated ID: ${profile.id}`);
                    // Small delay to be nice to APIs not strictly needed but good practice
                    await new Promise(r => setTimeout(r, 1000));
                } catch (e) {
                    console.error(`Generation failed:`, e);
                }
            }

            // B. Recycle (Delete Oldest) if over cap
            const resultNewTotal = await client.execute("SELECT COUNT(*) FROM profiles");
            const newTotal = resultNewTotal.rows[0][0] as number;

            if (newTotal > HARD_CAP) {
                const excess = newTotal - HARD_CAP;
                console.log(`Total ${newTotal} exceeds cap ${HARD_CAP}. Deleting ${excess} oldest profiles...`);

                await client.execute({
                    sql: `
                        DELETE FROM profiles 
                        WHERE id IN (
                            SELECT id FROM profiles 
                            ORDER BY created_at ASC 
                            LIMIT ?
                        )
                     `,
                    args: [excess]
                });
                console.log("Recycling complete.");
            }

            return new Response(`Generated ${BATCH_SIZE} profiles`, { status: 200 });
        } else {
            console.log("Buffer sufficient. Skipping.");
            return new Response("Skipped", { status: 200 });
        }

    } catch (e) {
        console.error("Error in producer:", e);
        return new Response(String(e), { status: 500 });
    } finally {
        client.close();
    }
};

export const config = {
    schedule: "*/10 * * * *"
};
