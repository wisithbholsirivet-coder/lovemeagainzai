import json
import os

MAIN_FILE = r"C:\Users\Wisithbhol S\.gemini\antigravity\scratch\chaecheck\data\ingredients_g_l.json"
NEW_FILES = [
    r"C:\Users\Wisithbhol S\.gemini\antigravity\scratch\chaecheck\data\new_g_1.json",
    r"C:\Users\Wisithbhol S\.gemini\antigravity\scratch\chaecheck\data\new_g_2.json"
]

def main():
    # Load main file
    with open(MAIN_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    existing_ids = {item['id'] for item in data}
    added_count = 0
    
    # Load and merge new files
    for new_file in NEW_FILES:
        if os.path.exists(new_file):
            with open(new_file, 'r', encoding='utf-8') as f:
                new_data = json.load(f)
                for item in new_data:
                    if item['id'] not in existing_ids:
                        data.append(item)
                        existing_ids.add(item['id'])
                        added_count += 1
                        
    # Sort data by ID for consistency
    data.sort(key=lambda x: x['id'])
    
    # Write back to main file
    with open(MAIN_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully added {added_count} new ingredients. Total ingredients: {len(data)}")

if __name__ == "__main__":
    main()
