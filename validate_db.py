import json, os

base = r'C:\Users\Wisithbhol S\.gemini\antigravity\scratch\chaecheck\data'
files = ['ingredients_a_f.json','ingredients_g_l.json','ingredients_m_r.json','ingredients_s_z.json']
required = ['id','names','risk','category','purpose','concerns','kidsUnsafe','pregnancyWarning','description_en','description_th']

total = 0
errors = 0
for f in files:
    path = os.path.join(base, f)
    with open(path, encoding='utf-8') as fp:
        data = json.load(fp)
    print(f + ': ' + str(len(data)) + ' ingredients')
    total += len(data)
    for item in data:
        item_id = item.get('id', 'UNKNOWN')
        for field in required:
            if field not in item:
                print('  MISSING FIELD: ' + field + ' in ' + item_id)
                errors += 1

print('TOTAL: ' + str(total) + ' ingredients')
if errors == 0:
    print('All fields valid!')
else:
    print(str(errors) + ' field errors found')
