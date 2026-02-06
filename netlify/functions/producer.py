from db import get_client
from generator import create_full_profile
import time

def handler(event, context):
    """
    Scheduled function to replenish the profile buffer.
    Run this every 5-10 minutes.
    """
    client = get_client()
    try:
        # 1. Check Total Profiles
        result_total = client.execute("SELECT COUNT(*) FROM profiles")
        total_profiles = result_total.rows[0][0]
        
        # 2. Check "Most Swipes by a Single User"
        # We need to know if anyone is running out of profiles.
        # IF swipes table is empty, max_swipes is 0.
        result_swipes = client.execute("""
            SELECT MAX(swipe_count) FROM (
                SELECT COUNT(*) as swipe_count 
                FROM swipes 
                GROUP BY session_id
            )
        """)
        
        max_user_swipes = 0
        if result_swipes.rows and result_swipes.rows[0][0] is not None:
            max_user_swipes = result_swipes.rows[0][0]
            
        # 3. Calculate Buffer
        # How many unseen profiles does the most active user have left?
        buffer_remaining = total_profiles - max_user_swipes
        
        print(f"Stats: Total Profiles={total_profiles}, Max User Swipes={max_user_swipes}, Buffer={buffer_remaining}")
        
        # 4. Refill Logic
        # New Requirement: Cap at 500. Recycle old profiles if needed.
        MIN_BUFFER_NEEDED = 50
        HARD_CAP = 500
        BATCH_SIZE = 5      # Slightly larger batch to keep up with deletion
        
        # If the active user is running low, we MUST generate more.
        # Even if we are at the Hard Cap, we generate new ones and delete old ones.
        should_generate = (buffer_remaining < MIN_BUFFER_NEEDED)
        
        if should_generate:
            print(f"Buffer {buffer_remaining} < {MIN_BUFFER_NEEDED}. Generating batch of {BATCH_SIZE}...")
            
            # A. Generate New
            for i in range(BATCH_SIZE):
                try:
                    profile = create_full_profile()
                    client.execute(
                        "INSERT INTO profiles (id, data, image_url) VALUES (?, ?, ?)", 
                        [profile["id"], profile["data"], profile["image_url"]]
                    )
                    # profile['data'] is a string, so we can't access ['name'] directly without parsing.
                    # Just logging ID is safer and sufficient.
                    print(f"[{i+1}/{BATCH_SIZE}] Generated ID: {profile['id']}")
                    time.sleep(1) 
                except Exception as e:
                    print(f"Generation failed: {e}")
            
            # B. Recycle (Delete Oldest) if over cap
            # Check new total
            result_new_total = client.execute("SELECT COUNT(*) FROM profiles")
            new_total = result_new_total.rows[0][0]
            
            if new_total > HARD_CAP:
                excess = new_total - HARD_CAP
                print(f"Total {new_total} exceeds cap {HARD_CAP}. Deleting {excess} oldest profiles...")
                
                # Delete the specific number of oldest profiles
                # SQLite supports LIMIT in DELETE if enabled, but standard SQL does not.
                # Safer to use subquery with rowid or id.
                client.execute(f"""
                    DELETE FROM profiles 
                    WHERE id IN (
                        SELECT id FROM profiles 
                        ORDER BY created_at ASC 
                        LIMIT {excess}
                    )
                """)
                print("Recycling complete.")
                
            return {"statusCode": 200, "body": f"Generated {BATCH_SIZE} profiles (Recycled if needed)"}
        else:
            print("Buffer sufficient. Skipping.")
            return {"statusCode": 200, "body": "Skipped"}
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error in producer: {e!r}")
        return {"statusCode": 500, "body": str(e)}
    finally:
        client.close()
