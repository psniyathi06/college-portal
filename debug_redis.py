import redis
import json

r = redis.Redis(host='localhost', port=6379, decode_responses=True)
roll_no = "102" # Based on screenshot
key = f"risk:{roll_no}"

data = r.get(key)
print(f"--- Data for {key} ---")
if data:
    print(data)
    parsed = json.loads(data)
    print("\nParsed Marks Risks:")
    for risk in parsed.get("marks_risks", []):
        print(f"- {risk}")
else:
    print("No data found in Redis for this key.")

# Also check 101 just in case
roll_no_101 = "101"
key_101 = f"risk:{roll_no_101}"
data_101 = r.get(key_101)
if data_101:
    print(f"\n--- Data for {key_101} ---")
    print(data_101)
