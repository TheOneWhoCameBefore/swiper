import sys
import time
# Add current directory to path so we can import from netlify.functions
sys.path.append('.')
from netlify.functions.producer import handler

print("Starting LOCAL producer loop (Dev Only)...")
print("Press Ctrl+C to stop.")

try:            
    while True:
        print(f"--- Triggering Producer ---")
        handler(None, None)
        # Sleep 10s for dev
        time.sleep(10)
except KeyboardInterrupt:
    print("\nStopped.")
