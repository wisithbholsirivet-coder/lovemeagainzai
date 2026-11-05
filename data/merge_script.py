import json
import os

base_path = r"C:\Users\Wisithbhol S\.gemini\antigravity\scratch\chaecheck\data"
main_file = os.path.join(base_path, "ingredients_a_f.json")
batch_files = [
    "new_ingredients.json",
    "batch2.json",
    "batch3.json",
    "batch4.json",
    "batch5.json",
    "batch6.json",
    "batch7.json",
    "batch8.json"
]

with open(main_file, "r", encoding="utf-8") as f:
    existing_ingredients = json.load(f)

existing_ids = set(item["id"] for item in existing_ingredients)
print(f"Loaded {len(existing_ingredients)} existing ingredients.")

added_count = 0
for b_file in batch_files:
    b_path = os.path.join(base_path, b_file)
    if os.path.exists(b_path):
        with open(b_path, "r", encoding="utf-8") as f:
            batch = json.load(f)
            for item in batch:
                if item["id"] not in existing_ids:
                    existing_ingredients.append(item)
                    existing_ids.add(item["id"])
                    added_count += 1
                else:
                    print(f"Skipping duplicate ID: {item['id']}")
    else:
        print(f"File not found: {b_file}")

with open(main_file, "w", encoding="utf-8") as f:
    json.dump(existing_ingredients, f, indent=2, ensure_ascii=False)

print(f"Successfully added {added_count} new ingredients.")
print(f"Total ingredients now: {len(existing_ingredients)}")
