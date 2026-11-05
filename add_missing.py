import json, os

base = r'C:\Users\Wisithbhol S\.gemini\antigravity\scratch\chaecheck\data'

# ── 3 Missing ingredients ─────────────────────────────────────────────────────
# Caprylyl Glycol → C → goes in a_f.json
# 4-t-Butylcyclohexanol → B/4 → goes in a_f.json
# Pantolactone → P → goes in m_r.json

additions_af = [
    {
        "id": "caprylyl-glycol",
        "names": ["Caprylyl Glycol", "1,2-Octanediol", "Octylene Glycol"],
        "risk": "green",
        "category": "Humectant / Preservative Booster",
        "purpose": "Multifunctional skin conditioner derived from coconut oil that also boosts preservative efficacy and provides antimicrobial activity.",
        "concerns": ["Can cause irritation at high concentrations (>2%)", "May cause eye irritation"],
        "kidsUnsafe": False,
        "pregnancyWarning": False,
        "description_en": "Caprylyl Glycol is a 1,2-diol derived from caprylic acid (found in coconut and palm oil). It functions as a humectant, emollient, and effective preservative booster with direct antimicrobial activity against bacteria and fungi. It is widely used in natural and clean-beauty formulas as a gentle alternative to traditional preservatives. Considered safe at typical use concentrations of 0.1–2%.",
        "description_th": "แคปริลิล ไกลคอลเป็นไดออล 1,2 ที่ได้จากกรดแคปริลิก (พบในน้ำมันมะพร้าวและปาล์ม) ทำหน้าที่เป็นสารดึงดูดความชื้น สารทำให้ผิวนวล และสารเสริมสารกันเสียที่มีประสิทธิภาพพร้อมฤทธิ์ต้านเชื้อโรคโดยตรง นิยมใช้ในสูตรความงามธรรมชาติ ถือว่าปลอดภัยในความเข้มข้นปกติ 0.1–2%"
    },
    {
        "id": "4-t-butylcyclohexanol",
        "names": ["4-t-Butylcyclohexanol", "4-tert-Butylcyclohexanol", "p-tert-Butylcyclohexanol"],
        "risk": "yellow",
        "category": "Fragrance",
        "purpose": "Synthetic fragrance compound with a woody, floral, slightly musky scent used in perfumes and scented cosmetics.",
        "concerns": [
            "Potential skin sensitizer",
            "Reported contact allergy cases",
            "May cross-react with other cyclohexanol fragrances"
        ],
        "kidsUnsafe": False,
        "pregnancyWarning": False,
        "description_en": "4-tert-Butylcyclohexanol is a synthetic fragrance alcohol with a clean, woody-floral scent reminiscent of lily-of-the-valley. It is widely used in fine fragrances, deodorants, and scented cosmetics. While generally considered safe at cosmetic concentrations, it has been reported as a contact allergen in fragrance-sensitive individuals and is subject to industry self-restriction guidelines.",
        "description_th": "4-เทิร์ต-บิวทิลไซโคลเฮกซานอลเป็นสารน้ำหอมแอลกอฮอล์สังเคราะห์ที่มีกลิ่นสะอาด ไม้-ดอกไม้ คล้ายลิลี่ออฟเดอะวัลลีย์ ใช้กันแพร่หลายในน้ำหอมชั้นเลิศ ดับกลิ่น และเครื่องสำอางมีกลิ่น แม้ว่าโดยทั่วไปจะถือว่าปลอดภัยในความเข้มข้นเครื่องสำอาง แต่มีรายงานว่าเป็นสารก่อภูมิแพ้จากการสัมผัสในบุคคลที่ไวต่อน้ำหอม"
    }
]

additions_mr = [
    {
        "id": "pantolactone",
        "names": ["Pantolactone", "alpha-Methylene-gamma-Butyrolactone", "DL-Pantolactone", "Pantolactone NF"],
        "risk": "yellow",
        "category": "Skin Conditioner / Fragrance",
        "purpose": "Cyclic ester (lactone) related to pantothenic acid, used as a skin conditioner and fragrance ingredient.",
        "concerns": [
            "Known fragrance sensitizer",
            "Contact allergy reported",
            "Avoid in products for sensitive skin"
        ],
        "kidsUnsafe": False,
        "pregnancyWarning": False,
        "description_en": "Pantolactone is the cyclic ester (lactone) of pantoic acid, a compound closely related to pantothenic acid (Vitamin B5). It is used in cosmetics as both a skin conditioning agent and fragrance ingredient. However, it is a known contact allergen and has been identified as a sensitizer in patch test studies. Individuals with fragrance sensitivity should approach products containing pantolactone with caution.",
        "description_th": "แพนโตแลคโทนเป็นเอสเตอร์วงแหวน (แลคโทน) ของกรดแพนโตอิก สารประกอบที่เกี่ยวข้องอย่างใกล้ชิดกับกรดแพนโทธีนิก (วิตามิน B5) ใช้ในเครื่องสำอางทั้งเป็นสารปรับสภาพผิวและส่วนผสมน้ำหอม อย่างไรก็ตาม เป็นสารก่อภูมิแพ้จากการสัมผัสที่ทราบกันดีและถูกระบุว่าเป็นสารกระตุ้นในการศึกษาการทดสอบทางผิวหนัง ผู้ที่ไวต่อน้ำหอมควรระมัดระวัง"
    }
]

# ── Append to files ───────────────────────────────────────────────────────────
for filename, new_items in [('ingredients_a_f.json', additions_af),
                             ('ingredients_m_r.json', additions_mr)]:
    path = os.path.join(base, filename)
    with open(path, encoding='utf-8') as f:
        existing = json.load(f)

    existing_ids = {item['id'] for item in existing}
    to_add = [item for item in new_items if item['id'] not in existing_ids]
    combined = existing + to_add

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)

    print(filename + ': added ' + str(len(to_add)) + ' new ingredient(s) (total: ' + str(len(combined)) + ')')

print('Done.')
