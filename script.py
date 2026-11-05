import json
import os

existing_file = r"C:\Users\Wisithbhol S\.gemini\antigravity\scratch\chaecheck\data\ingredients_s_z.json"

with open(existing_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

existing_ids = set(item['id'] for item in data)

new_ingredients = []

def add_item(inc_id, names, risk, category, purpose, concerns, kids, preg, en, th):
    if inc_id not in existing_ids:
        new_ingredients.append({
            "id": inc_id,
            "names": names,
            "risk": risk,
            "category": category,
            "purpose": purpose,
            "concerns": concerns,
            "kidsUnsafe": kids,
            "pregnancyWarning": preg,
            "description_en": en,
            "description_th": th
        })
        existing_ids.add(inc_id)

# Adding Sodium Compounds (50 items)
sodium_compounds = [
    ("sodium-acetate", ["SODIUM ACETATE"], "green", "pH Adjuster", "Buffering agent.", [], False, False, "Used to maintain pH.", "ใช้ปรับสมดุล pH ในสูตรเครื่องสำอาง"),
    ("sodium-acrylate-copolymer", ["SODIUM ACRYLATE/SODIUM ACRYLOYLDIMETHYL TAURATE COPOLYMER"], "green", "Thickener", "Viscosity controller.", [], False, False, "Used to thicken and stabilize emulsions.", "ใช้เพิ่มความหนืดและทำให้เนื้อครีมคงตัว"),
    ("sodium-anisate", ["SODIUM ANISATE"], "green", "Preservative", "Natural preservative.", [], False, False, "Antimicrobial derived from fennel.", "สารกันเสียธรรมชาติสกัดจากยี่หร่า"),
    ("sodium-ascorbate", ["SODIUM ASCORBATE"], "green", "Antioxidant", "Vitamin C derivative.", [], False, False, "Water-soluble vitamin C.", "อนุพันธ์วิตามินซีที่ละลายน้ำได้"),
    ("sodium-ascorbyl-phosphate", ["SODIUM ASCORBYL PHOSPHATE", "SAP"], "green", "Antioxidant", "Stable Vitamin C.", [], False, False, "Brightens skin and fights acne.", "วิตามินซีที่มีความเสถียร ช่วยให้ผิวกระจ่างใสและลดสิว"),
    ("sodium-benzoate", ["SODIUM BENZOATE"], "yellow", "Preservative", "Prevents fungal growth.", ["Can cause irritation"], False, False, "Common preservative.", "สารกันเสียที่ใช้กันอย่างแพร่หลาย แต่อาจระคายเคืองในบางคน"),
    ("sodium-bicarbonate", ["SODIUM BICARBONATE"], "yellow", "pH Adjuster", "Baking soda.", ["High pH can disrupt skin barrier"], False, False, "Can be too alkaline for skin.", "เบกกิ้งโซดา อาจมีความเป็นด่างสูงเกินไปสำหรับผิว"),
    ("sodium-borate", ["SODIUM BORATE"], "red", "pH Adjuster", "Borax.", ["Banned in EU cosmetics for skin"], True, True, "Restricted cosmetic ingredient.", "สารที่ถูกควบคุมและห้ามใช้ในบางประเทศ"),
    ("sodium-carbomer", ["SODIUM CARBOMER"], "green", "Thickener", "Creates clear gels.", [], False, False, "Pre-neutralized carbomer.", "สารสร้างเนื้อเจลใส"),
    ("sodium-carbonate", ["SODIUM CARBONATE"], "yellow", "pH Adjuster", "Soda ash.", ["High pH"], False, False, "Adjusts pH levels.", "ใช้ปรับค่า pH แต่มีความเป็นด่างสูง"),
    ("sodium-cetearyl-sulfate", ["SODIUM CETEARYL SULFATE"], "yellow", "Surfactant", "Cleansing agent.", ["Potential irritant"], False, False, "Sulfate-based cleanser.", "สารทำความสะอาดกลุ่มซัลเฟตที่อาจก่อให้เกิดการระคายเคือง"),
    ("sodium-chloride", ["SODIUM CHLORIDE"], "green", "Thickener", "Table salt.", [], False, False, "Thickens aqueous solutions.", "เกลือแกง ใช้เพิ่มความหนืดในแชมพูหรือคลีนเซอร์"),
    ("sodium-chondroitin-sulfate", ["SODIUM CHONDROITIN SULFATE"], "green", "Skin Conditioner", "Hydrating agent.", [], False, False, "Skin conditioning and moisturizing.", "สารบำรุงผิวที่ช่วยให้ความชุ่มชื้น"),
    ("sodium-citrate", ["SODIUM CITRATE"], "green", "pH Adjuster", "Buffering agent.", [], False, False, "Neutralizes pH.", "ใช้ปรับสมดุลความเป็นกรดด่างในผลิตภัณฑ์"),
    ("sodium-cocoyl-alaninate", ["SODIUM COCOYL ALANINATE"], "green", "Surfactant", "Mild cleanser.", [], False, False, "Amino acid based surfactant.", "สารทำความสะอาดที่อ่อนโยนจากกรดอะมิโน"),
    ("sodium-cocoyl-glutamate", ["SODIUM COCOYL GLUTAMATE"], "green", "Surfactant", "Very gentle cleanser.", [], False, False, "Derived from coconut oil and glutamate.", "สารทำความสะอาดที่อ่อนโยนมาก สกัดจากน้ำมันมะพร้าว"),
    ("sodium-cocoyl-glycinate", ["SODIUM COCOYL GLYCINATE"], "green", "Surfactant", "Mild cleanser.", [], False, False, "Leaves skin soft.", "สารทำความสะอาดอ่อนโยน ไม่ทำให้ผิวแห้งตึง"),
    ("sodium-cocoyl-isethionate", ["SODIUM COCOYL ISETHIONATE", "SCI"], "green", "Surfactant", "Baby foam.", [], False, False, "Extremely mild coconut-derived cleanser.", "สารทำความสะอาดที่อ่อนโยนมาก มักใช้ในผลิตภัณฑ์สำหรับเด็ก"),
    ("sodium-cocoyl-sarcosinate", ["SODIUM COCOYL SARCOSINATE"], "green", "Surfactant", "Cleanser.", [], False, False, "Amino acid derived surfactant.", "สารทำความสะอาดกลุ่มกรดอะมิโน"),
    ("sodium-dehydroacetate", ["SODIUM DEHYDROACETATE"], "green", "Preservative", "Antimicrobial.", [], False, False, "Preservative effective against fungi.", "สารกันเสียที่มีประสิทธิภาพในการยับยั้งเชื้อรา"),
    ("sodium-dna", ["SODIUM DNA"], "green", "Skin Conditioner", "Skin regenerating.", [], False, False, "Used in anti-aging products.", "ใช้ในผลิตภัณฑ์ต่อต้านริ้วรอย ช่วยฟื้นฟูผิว"),
    ("sodium-dodecylbenzenesulfonate", ["SODIUM DODECYLBENZENESULFONATE"], "red", "Surfactant", "Harsh detergent.", ["High irritation"], False, False, "Very harsh cleanser, usually for laundry.", "สารทำความสะอาดที่รุนแรงมาก มักใช้ในผงซักฟอก"),
    ("sodium-gluconate", ["SODIUM GLUCONATE"], "green", "Chelating Agent", "Binds metal ions.", [], False, False, "Improves stability.", "ช่วยจับประจุโลหะเพื่อเพิ่มความคงตัวของผลิตภัณฑ์"),
    ("sodium-hexametaphosphate", ["SODIUM HEXAMETAPHOSPHATE"], "green", "Chelating Agent", "Water softener.", [], False, False, "Chelating agent.", "สารช่วยปรับสภาพน้ำ"),
    ("sodium-hyaluronate", ["SODIUM HYALURONATE"], "green", "Humectant", "Salt form of Hyaluronic Acid.", [], False, False, "Deeply hydrating.", "เกลือของไฮยาลูรอนิกแอซิด ช่วยเติมความชุ่มชื้นให้ผิวอย่างล้ำลึก"),
    ("sodium-hyaluronate-crosspolymer", ["SODIUM HYALURONATE CROSSPOLYMER"], "green", "Humectant", "3D hydration.", [], False, False, "Forms a hydrating mesh on the skin.", "ไฮยาลูรอนแบบตาข่ายที่ช่วยกักเก็บความชุ่มชื้นได้ยาวนานขึ้น"),
    ("sodium-hydroxide", ["SODIUM HYDROXIDE", "Lye"], "yellow", "pH Adjuster", "Alkaline adjuster.", ["Highly corrosive in pure form"], False, False, "Used in tiny amounts to adjust pH.", "โซดาไฟ ใช้ในปริมาณน้อยมากเพื่อปรับค่า pH"),
    ("sodium-hydroxymethylglycinate", ["SODIUM HYDROXYMETHYLGLYCINATE"], "yellow", "Preservative", "Formaldehyde releaser.", ["Potential sensitization"], False, False, "Can release formaldehyde.", "สารกันเสียที่อาจปล่อยฟอร์มาลดีไฮด์ได้"),
    ("sodium-lactate", ["SODIUM LACTATE"], "green", "Humectant", "Natural moisturizing factor.", [], False, False, "Hydrates and gently exfoliates.", "สารให้ความชุ่มชื้นตามธรรมชาติ และช่วยผลัดเซลล์ผิวอ่อนๆ"),
    ("sodium-laureth-sulfate", ["SODIUM LAURETH SULFATE", "SLES"], "yellow", "Surfactant", "Cleansing agent.", ["Irritation", "Stripping"], False, False, "Common detergent, milder than SLS.", "สารทำความสะอาดที่พบได้บ่อย อ่อนโยนกว่า SLS แต่ยังอาจทำให้ผิวแห้ง"),
    ("sodium-lauryl-sulfate", ["SODIUM LAURYL SULFATE", "SLS"], "red", "Surfactant", "Harsh cleansing agent.", ["Highly irritating", "Stripping"], False, False, "Known skin irritant used in cleansers.", "สารทำความสะอาดที่รุนแรงและทำให้ผิวระคายเคืองได้ง่าย"),
    ("sodium-lauroamphoacetate", ["SODIUM LAUROAMPHOACETATE"], "green", "Surfactant", "Gentle cleanser.", [], False, False, "Very mild amphoteric surfactant.", "สารทำความสะอาดที่อ่อนโยนมาก มักใช้คู่กับสารอื่นลดการระคายเคือง"),
    ("sodium-lauroyl-glutamate", ["SODIUM LAUROYL GLUTAMATE"], "green", "Surfactant", "Amino acid cleanser.", [], False, False, "Leaves a moisturized feel.", "สารทำความสะอาดจากกรดอะมิโนที่ให้ความรู้สึกชุ่มชื้นหลังล้าง"),
    ("sodium-lauroyl-lactylate", ["SODIUM LAUROYL LACTYLATE"], "green", "Emulsifier", "Penetration enhancer.", [], False, False, "Helps ceramides penetrate skin.", "ช่วยเพิ่มการซึมผ่านของเซราไมด์เข้าสู่ผิว"),
    ("sodium-lauroyl-methyl-isethionate", ["SODIUM LAUROYL METHYL ISETHIONATE"], "green", "Surfactant", "Mild sulfate-free cleanser.", [], False, False, "Produces dense foam.", "สารทำความสะอาดปราศจากซัลเฟตที่ให้ฟองหนานุ่ม"),
    ("sodium-lauroyl-oat-amino-acids", ["SODIUM LAUROYL OAT AMINO ACIDS"], "green", "Surfactant", "Oat derived cleanser.", [], False, False, "Extremely gentle, soothing cleanser.", "สารทำความสะอาดจากข้าวโอ๊ต อ่อนโยนและปลอบประโลมผิว"),
    ("sodium-lauroyl-sarcosinate", ["SODIUM LAUROYL SARCOSINATE"], "green", "Surfactant", "Mild cleanser.", [], False, False, "Good foaming amino acid surfactant.", "สารทำความสะอาดที่ให้ฟองดีและอ่อนโยนต่อผิว"),
    ("sodium-levulinate", ["SODIUM LEVULINATE"], "green", "Preservative", "Skin conditioning antimicrobial.", [], False, False, "Derived from starch.", "สารกันเสียที่ได้จากพืช ช่วยบำรุงผิวไปในตัว"),
    ("sodium-metabisulfite", ["SODIUM METABISULFITE"], "yellow", "Antioxidant", "Preservative.", ["Allergies"], False, False, "Used in hair dye and some cosmetics.", "สารกันเสียที่อาจก่อให้เกิดอาการแพ้ในบางคน"),
    ("sodium-methyl-cocoyl-taurate", ["SODIUM METHYL COCOYL TAURATE"], "green", "Surfactant", "Gentle cleanser.", [], False, False, "Derived from coconut and taurine.", "สารทำความสะอาดอ่อนโยนจากมะพร้าวและทอรีน"),
    ("sodium-myristoyl-glutamate", ["SODIUM MYRISTOYL GLUTAMATE"], "green", "Surfactant", "Amino acid cleanser.", [], False, False, "Mild cleansing agent.", "สารทำความสะอาดกลุ่มกรดอะมิโนที่อ่อนโยน"),
    ("sodium-palmate", ["SODIUM PALMATE"], "yellow", "Surfactant", "Soap base.", ["High pH can strip skin"], False, False, "Saponified palm oil.", "เบสสบู่ก้อนที่ได้จากน้ำมันปาล์ม อาจทำให้ผิวแห้งตึง"),
    ("sodium-palm-kernelate", ["SODIUM PALM KERNELATE"], "yellow", "Surfactant", "Soap base.", ["High pH"], False, False, "Saponified palm kernel oil.", "เบสสบู่จากน้ำมันเมล็ดปาล์ม มักมีค่า pH สูง"),
    ("sodium-pca", ["SODIUM PCA"], "green", "Humectant", "Natural moisturizing factor.", [], False, False, "Excellent skin hydrator.", "สารให้ความชุ่มชื้นที่เป็นองค์ประกอบตามธรรมชาติของผิว"),
    ("sodium-phytate", ["SODIUM PHYTATE"], "green", "Chelating Agent", "Natural chelator.", [], False, False, "Derived from rice bran.", "สารจับประจุโลหะจากธรรมชาติ สกัดจากรำข้าว"),
    ("sodium-polyacrylate", ["SODIUM POLYACRYLATE"], "green", "Thickener", "Superabsorbent polymer.", [], False, False, "Creates elegant gel textures.", "โพลิเมอร์ที่ช่วยสร้างเนื้อเจลให้สัมผัสที่นุ่มละมุน"),
    ("sodium-polystyrene-sulfonate", ["SODIUM POLYSTYRENE SULFONATE"], "green", "Film Former", "Hair styling agent.", [], False, False, "Used to protect against heat.", "สารสร้างฟิล์มที่ช่วยปกป้องเส้นผมจากความร้อน"),
    ("sodium-propionate", ["SODIUM PROPIONATE"], "green", "Preservative", "Antimicrobial.", [], False, False, "Prevents mold.", "สารกันเสียที่ช่วยป้องกันการเจริญเติบโตของเชื้อรา"),
    ("sodium-salicylate", ["SODIUM SALICYLATE"], "yellow", "Preservative", "Salicylic acid salt.", ["Irritation"], False, False, "Has some exfoliating properties.", "เกลือของกรดซาลิไซลิก มีฤทธิ์ผลัดเซลล์ผิวอ่อนๆ"),
    ("sodium-stearate", ["SODIUM STEARATE"], "green", "Emulsifier", "Soap base.", [], False, False, "Used in deodorant sticks and soaps.", "เบสสบู่ที่มักใช้ทำผลิตภัณฑ์รูปแบบแท่ง เช่น โรลออน"),
    ("sodium-stearoyl-glutamate", ["SODIUM STEAROYL GLUTAMATE"], "green", "Emulsifier", "Amino acid emulsifier.", [], False, False, "Skin friendly emulsifier.", "สารผสานน้ำและน้ำมันที่เป็นมิตรต่อผิว"),
    ("sodium-stearoyl-lactylate", ["SODIUM STEAROYL LACTYLATE"], "green", "Emulsifier", "Food grade emulsifier.", [], False, False, "Moisturizing emulsifier.", "สารผสานน้ำและน้ำมันที่ช่วยเพิ่มความชุ่มชื้น"),
    ("sodium-sulfite", ["SODIUM SULFITE"], "yellow", "Antioxidant", "Preservative.", ["Allergies"], False, False, "Can be sensitizing.", "สารกันเสียที่อาจทำให้ผิวระคายเคืองหรือแพ้ได้"),
    ("sodium-tallowate", ["SODIUM TALLOWATE"], "yellow", "Surfactant", "Animal fat soap.", ["High pH"], False, False, "Traditional soap base.", "เบสสบู่ที่ทำจากไขมันสัตว์ มักมีค่า pH สูงทำให้ผิวแห้ง")
]

# Adding Sorbitan Esters & Squalane/Squalene (20 items)
sorbitan_squalane = [
    ("sorbitan-caprylate", ["SORBITAN CAPRYLATE"], "green", "Emulsifier", "Thickener and emulsifier.", [], False, False, "Boosts preservative efficacy.", "สารเสริมประสิทธิภาพสารกันเสียและช่วยผสานส่วนผสม"),
    ("sorbitan-isostearate", ["SORBITAN ISOSTEARATE"], "green", "Emulsifier", "Water-in-oil emulsifier.", [], False, False, "Creates rich creams.", "ช่วยสร้างเนื้อครีมที่เข้มข้น"),
    ("sorbitan-laurate", ["SORBITAN LAURATE"], "green", "Emulsifier", "Solubilizer.", [], False, False, "Helps mix oil into water.", "ช่วยให้น้ำมันละลายเข้ากับน้ำได้ดีขึ้น"),
    ("sorbitan-olivate", ["SORBITAN OLIVATE"], "green", "Emulsifier", "Olive-derived emulsifier.", [], False, False, "Forms liquid crystal structures.", "สารผสานน้ำและน้ำมันจากมะกอก ช่วยสร้างโครงสร้างที่คล้ายเกราะป้องกันผิว"),
    ("sorbitan-oleate", ["SORBITAN OLEATE"], "green", "Emulsifier", "Emulsifier.", [], False, False, "Common in skincare.", "สารผสานส่วนผสมที่พบได้บ่อยในสกินแคร์"),
    ("sorbitan-palmitate", ["SORBITAN PALMITATE"], "green", "Emulsifier", "Emulsifier.", [], False, False, "Provides good texture.", "ช่วยให้ผลิตภัณฑ์มีเนื้อสัมผัสที่ดี"),
    ("sorbitan-sesquioleate", ["SORBITAN SESQUIOLEATE"], "yellow", "Emulsifier", "Emulsifier.", ["Contact dermatitis"], False, False, "Known to cause allergies in some.", "อาจก่อให้เกิดอาการแพ้จากการสัมผัสในบางคน"),
    ("sorbitan-stearate", ["SORBITAN STEARATE"], "green", "Emulsifier", "Thickener.", [], False, False, "Used in lotions.", "ใช้เพิ่มความหนืดในโลชั่น"),
    ("sorbitan-trioleate", ["SORBITAN TRIOLEATE"], "green", "Emulsifier", "Emulsifier.", [], False, False, "Dispersing agent.", "สารช่วยกระจายตัวของส่วนผสม"),
    ("sorbitan-tristearate", ["SORBITAN TRISTEARATE"], "green", "Emulsifier", "Emulsifier.", [], False, False, "Thickener.", "สารเพิ่มความหนืด"),
    ("sorbitol", ["SORBITOL"], "green", "Humectant", "Sugar alcohol.", [], False, False, "Hydrates the skin.", "น้ำตาลแอลกอฮอล์ที่ช่วยดึงดูดความชุ่มชื้นเข้าสู่ผิว"),
    ("soybean-oil", ["SOYBEAN OIL", "GLYCINE SOJA OIL"], "green", "Emollient", "Plant oil.", [], False, False, "Rich in antioxidants and fatty acids.", "น้ำมันถั่วเหลืองที่อุดมไปด้วยสารต้านอนุมูลอิสระ"),
    ("soybean-extract", ["SOYBEAN EXTRACT", "GLYCINE SOJA SEED EXTRACT"], "green", "Antioxidant", "Plant extract.", [], False, False, "Contains genistein, an antioxidant.", "สารสกัดจากถั่วเหลืองที่ช่วยต่อต้านอนุมูลอิสระ"),
    ("spearmint-oil", ["SPEARMINT OIL", "MENTHA VIRIDIS LEAF OIL"], "yellow", "Fragrance", "Essential oil.", ["Irritant"], False, False, "Used for fragrance, can irritate skin.", "น้ำมันหอมระเหยสเปียร์มินต์ อาจทำให้ผิวระคายเคืองได้"),
    ("sphingolipids", ["SPHINGOLIPIDS"], "green", "Skin Conditioner", "Skin identical ingredient.", [], False, False, "Repairs skin barrier.", "สารที่ช่วยซ่อมแซมและเสริมสร้างเกราะป้องกันผิว"),
    ("squalane", ["SQUALANE"], "green", "Emollient", "Stable hydrocarbon.", [], False, False, "Non-comedogenic, lightweight oil-like moisturizer.", "สารให้ความชุ่มชื้นที่บางเบา ไม่ทำให้อุดตันรูขุมขน"),
    ("squalene", ["SQUALENE"], "green", "Emollient", "Sebum component.", [], False, False, "Less stable than squalane, very moisturizing.", "สารให้ความชุ่มชื้นตามธรรมชาติของผิว แต่มักเสื่อมสภาพเร็วกว่า Squalane"),
    ("star-anise-extract", ["STAR ANISE EXTRACT", "ILLICIUM VERUM EXTRACT"], "green", "Fragrance", "Plant extract.", [], False, False, "Used for its scent and antioxidant properties.", "สารสกัดจากโป๊ยกั๊ก ช่วยต่อต้านอนุมูลอิสระ"),
    ("stearalkonium-chloride", ["STEARALKONIUM CHLORIDE"], "yellow", "Preservative", "Antistatic agent.", ["Irritation"], False, False, "Used in hair conditioners.", "สารลดไฟฟ้าสถิตที่มักใช้ในครีมนวดผม"),
    ("stearalkonium-hectorite", ["STEARALKONIUM HECTORITE"], "green", "Thickener", "Suspending agent.", [], False, False, "Thickens oil-based formulas.", "ใช้เพิ่มความหนืดในผลิตภัณฑ์ที่มีน้ำมันเป็นหลัก")
]

# Stearic & Steareth Variants (20 items)
stearic_variants = [
    ("stearamide-amp", ["STEARAMIDE AMP"], "green", "Emulsifier", "Opacifying agent.", [], False, False, "Used in cleansers.", "สารที่ทำให้ผลิตภัณฑ์มีความขุ่น"),
    ("stearamidopropyl-dimethylamine", ["STEARAMIDOPROPYL DIMETHYLAMINE"], "green", "Conditioner", "Hair conditioner.", [], False, False, "Silicone alternative for hair.", "สารบำรุงผมที่ใช้แทนซิลิโคน"),
    ("steareth-2", ["STEARETH-2"], "green", "Emulsifier", "Emulsifier.", [], False, False, "Commonly used with Steareth-21.", "สารผสานน้ำและน้ำมัน มักใช้คู่กับ Steareth-21"),
    ("steareth-4", ["STEARETH-4"], "green", "Emulsifier", "Emulsifier.", [], False, False, "Cleansing and emulsifying.", "สารช่วยทำความสะอาดและผสานส่วนผสม"),
    ("steareth-10", ["STEARETH-10"], "green", "Emulsifier", "Emulsifier.", [], False, False, "Texture enhancer.", "ช่วยปรับเนื้อสัมผัสของครีม"),
    ("steareth-20", ["STEARETH-20"], "green", "Emulsifier", "Emulsifier.", [], False, False, "High HLB emulsifier.", "สารผสานน้ำและน้ำมันที่ละลายน้ำได้ดี"),
    ("steareth-21", ["STEARETH-21"], "green", "Emulsifier", "Emulsifier.", [], False, False, "Used to stabilize formulas.", "ช่วยให้สูตรเครื่องสำอางมีความคงตัว"),
    ("steareth-100", ["STEARETH-100"], "green", "Emulsifier", "Emulsifier.", [], False, False, "Solubilizer.", "สารช่วยละลายส่วนผสม"),
    ("stearic-acid", ["STEARIC ACID"], "green", "Emollient", "Fatty acid.", [], False, False, "Thickens and stabilizes formulas.", "กรดไขมันที่ช่วยเพิ่มความหนืดและบำรุงผิว"),
    ("stearyl-alcohol", ["STEARYL ALCOHOL"], "green", "Emollient", "Fatty alcohol.", [], False, False, "Non-drying alcohol that softens skin.", "แอลกอฮอล์ไขมันที่ไม่ทำให้ผิวแห้ง ช่วยให้ผิวเนียนนุ่ม"),
    ("stearyl-glycyrrhetinate", ["STEARYL GLYCYRRHETINATE"], "green", "Soothing", "Licorice derivative.", [], False, False, "Potent anti-inflammatory agent.", "อนุพันธ์จากชะเอมเทศ มีฤทธิ์ลดการอักเสบได้อย่างดี"),
    ("stearyl-heptanoate", ["STEARYL HEPTANOATE"], "green", "Emollient", "Skin conditioning.", [], False, False, "Leaves a velvety finish.", "ให้สัมผัสที่เนียนนุ่มดุจกำมะหยี่บนผิว"),
    ("stearyl-stearate", ["STEARYL STEARATE"], "green", "Emollient", "Skin conditioning.", [], False, False, "Wax-like ester.", "เอสเทอร์ที่มีลักษณะคล้ายแว็กซ์ ช่วยเคลือบผิว"),
    ("strawberry-extract", ["STRAWBERRY EXTRACT", "FRAGARIA CHILOENSIS EXTRACT"], "green", "Antioxidant", "Plant extract.", [], False, False, "Contains Vitamin C.", "สารสกัดจากสตรอว์เบอร์รี อุดมไปด้วยวิตามินซี"),
    ("sucrose", ["SUCROSE"], "green", "Humectant", "Sugar.", [], False, False, "Hydrates and gently exfoliates.", "น้ำตาลทราย ช่วยให้ความชุ่มชื้นและผลัดเซลล์ผิวอ่อนๆ"),
    ("sucrose-cocoate", ["SUCROSE COCOATE"], "green", "Emulsifier", "Mild surfactant.", [], False, False, "Gentle cleansing and moisturizing.", "สารทำความสะอาดที่อ่อนโยนและให้ความชุ่มชื้น"),
    ("sucrose-laurate", ["SUCROSE LAURATE"], "green", "Emulsifier", "Emulsifier.", [], False, False, "Used to make gel-to-milk cleansers.", "สารที่ช่วยเปลี่ยนเนื้อเจลเป็นน้ำนมเมื่อโดนน้ำ"),
    ("sucrose-stearate", ["SUCROSE STEARATE"], "green", "Emulsifier", "Emulsifier.", [], False, False, "Skin conditioning emulsifier.", "สารผสานน้ำและน้ำมันที่ช่วยบำรุงผิวไปในตัว"),
    ("sunflower-seed-oil", ["SUNFLOWER SEED OIL", "HELIANTHUS ANNUUS SEED OIL"], "green", "Emollient", "Plant oil.", [], False, False, "Rich in linoleic acid, good for barrier repair.", "น้ำมันเมล็ดทานตะวัน อุดมด้วยกรดไลโนเลอิก ช่วยเสริมเกราะป้องกันผิว"),
    ("sweet-almond-oil", ["SWEET ALMOND OIL", "PRUNUS AMYGDALUS DULCIS OIL"], "green", "Emollient", "Plant oil.", [], False, False, "Nourishing plant oil.", "น้ำมันสวีทอัลมอนด์ที่ช่วยบำรุงผิวให้เนียนนุ่ม")
]

# T section (40 items)
t_items = [
    ("talc", ["TALC"], "yellow", "Absorbent", "Mineral powder.", ["Asbestos contamination risk"], False, False, "Absorbs moisture and oil.", "ผงทัลค์ ช่วยดูดซับความมัน แต่มีความกังวลเรื่องการปนเปื้อนแร่ใยหิน"),
    ("tamanu-oil", ["TAMANU OIL", "CALOPHYLLUM INOPHYLLUM SEED OIL"], "green", "Emollient", "Healing oil.", [], False, False, "Used for wound healing and acne scars.", "น้ำมันทามานู ช่วยสมานแผลและลดรอยสิว"),
    ("tamarind-extract", ["TAMARIND EXTRACT", "TAMARINDUS INDICA SEED EXTRACT"], "green", "Humectant", "Hydrating extract.", [], False, False, "Enhances skin hydration similar to hyaluronic acid.", "สารสกัดจากมะขาม ช่วยเติมความชุ่มชื้นให้ผิวได้ดีคล้ายไฮยาลูรอน"),
    ("tangerine-peel-oil", ["TANGERINE PEEL OIL", "CITRUS RETICULATA PEEL OIL"], "yellow", "Fragrance", "Citrus oil.", ["Photosensitivity", "Irritation"], False, False, "Smells great but can irritate skin in sun.", "น้ำมันเปลือกส้มเขียวหวาน อาจทำให้ผิวไวต่อแสงแดด"),
    ("tapioca-starch", ["TAPIOCA STARCH"], "green", "Absorbent", "Texture enhancer.", [], False, False, "Absorbs oil and reduces greasiness.", "แป้งมันสำปะหลัง ช่วยดูดซับความมันและลดความเหนอะหนะของครีม"),
    ("tartaric-acid", ["TARTARIC ACID"], "green", "Exfoliant", "AHA.", [], False, False, "Alpha hydroxy acid from grapes.", "กรดผลไม้ (AHA) ที่สกัดจากองุ่น ช่วยผลัดเซลล์ผิว"),
    ("tea-tree-oil", ["TEA TREE OIL", "MELALEUCA ALTERNIFOLIA LEAF OIL"], "yellow", "Antimicrobial", "Acne treatment.", ["Sensitization if oxidized"], False, False, "Antibacterial essential oil used for acne.", "น้ำมันทีทรี มีฤทธิ์ต้านเชื้อแบคทีเรียและช่วยรักษาสิว แต่อาจทำให้ระคายเคืองหากเสื่อมสภาพ"),
    ("tea-lauryl-sulfate", ["TEA-LAURYL SULFATE"], "yellow", "Surfactant", "Cleanser.", ["Irritating"], False, False, "Strong cleansing agent.", "สารทำความสะอาดที่ค่อนข้างรุนแรง"),
    ("tetradecyl-aminobutyroylvalylaminobutyric-urea-trifluoroacetate", ["TETRADECYL AMINOBUTYROYLVALYLAMINOBUTYRIC UREA TRIFLUOROACETATE"], "green", "Peptide", "Syn-Hycan.", [], False, False, "Peptide that boosts hyaluronic acid production.", "เปปไทด์ที่ช่วยกระตุ้นการสร้างไฮยาลูรอนิกแอซิดในผิว"),
    ("tetrahexyldecyl-ascorbate", ["TETRAHEXYLDECYL ASCORBATE", "THD ASCORBATE"], "green", "Antioxidant", "Oil-soluble Vitamin C.", [], False, False, "Highly stable and penetrative vitamin C derivative.", "อนุพันธ์วิตามินซีที่ละลายในน้ำมัน มีความเสถียรสูงและซึมซาบดี"),
    ("tetrasodium-edta", ["TETRASODIUM EDTA"], "green", "Chelating Agent", "Stabilizer.", [], False, False, "Binds metal ions to keep products stable.", "สารจับประจุโลหะที่ช่วยให้เครื่องสำอางไม่เสื่อมสภาพ"),
    ("tetrasodium-glutamate-diacetate", ["TETRASODIUM GLUTAMATE DIACETATE"], "green", "Chelating Agent", "Eco-friendly chelator.", [], False, False, "Biodegradable alternative to EDTA.", "สารจับประจุโลหะที่เป็นมิตรต่อสิ่งแวดล้อม ใช้แทน EDTA"),
    ("theobroma-cacao-seed-butter", ["THEOBROMA CACAO (COCOA) SEED BUTTER", "COCOA BUTTER"], "green", "Emollient", "Rich plant butter.", ["Comedogenic"], False, False, "Very rich and moisturizing, but can clog pores.", "โกโก้บัตเตอร์ ช่วยเพิ่มความชุ่มชื้นอย่างล้ำลึก แต่อาจอุดตันรูขุมขนในคนผิวมัน"),
    ("thiotaurine", ["THIOTAURINE"], "green", "Antioxidant", "Amino acid derivative.", [], False, False, "Protects against pollution.", "สารต้านอนุมูลอิสระที่ช่วยปกป้องผิวจากมลภาวะ"),
    ("threonine", ["THREONINE"], "green", "Amino Acid", "Protein building block.", [], False, False, "Helps maintain skin's moisture balance.", "กรดอะมิโนที่ช่วยรักษาสมดุลความชุ่มชื้นของผิว"),
    ("thyme-extract", ["THYME EXTRACT", "THYMUS VULGARIS EXTRACT"], "green", "Antioxidant", "Plant extract.", [], False, False, "Has antimicrobial properties.", "สารสกัดจากไทม์ มีคุณสมบัติต้านเชื้อแบคทีเรีย"),
    ("tiger-grass-extract", ["TIGER GRASS EXTRACT", "CENTELLA ASIATICA EXTRACT"], "green", "Soothing", "Healing extract.", [], False, False, "Famous for soothing irritated skin (Cica).", "สารสกัดจากใบบัวบก หรือ Cica ช่วยปลอบประโลมผิวที่อักเสบ"),
    ("tilia-cordata-flower-extract", ["TILIA CORDATA FLOWER EXTRACT", "LINDEN BLOSSOM EXTRACT"], "green", "Soothing", "Plant extract.", [], False, False, "Calms and soothes the skin.", "สารสกัดจากดอกลินเดน ช่วยลดอาการระคายเคือง"),
    ("tin-oxide", ["TIN OXIDE"], "green", "Colorant", "Opacity agent.", [], False, False, "Adds shimmer and opacity to cosmetics.", "สารที่ช่วยเพิ่มประกายและทำให้เครื่องสำอางทึบแสง"),
    ("titanium-dioxide", ["TITANIUM DIOXIDE"], "green", "UV Filter", "Mineral sunscreen.", [], False, False, "Broad spectrum physical UV filter.", "สารกันแดดแบบฟิสิคัลที่ช่วยสะท้อนรังสียูวี"),
    ("tocopherol", ["TOCOPHEROL", "VITAMIN E"], "green", "Antioxidant", "Vitamin E.", [], False, False, "Fat-soluble antioxidant that protects skin.", "วิตามินอี สารต้านอนุมูลอิสระที่ช่วยปกป้องผิวและเก็บความชุ่มชื้น"),
    ("tocopheryl-acetate", ["TOCOPHERYL ACETATE"], "green", "Antioxidant", "Vitamin E derivative.", [], False, False, "More stable form of Vitamin E.", "อนุพันธ์ของวิตามินอีที่มีความเสถียรสูงกว่า"),
    ("tocopheryl-linoleate", ["TOCOPHERYL LINOLEATE"], "green", "Antioxidant", "Vitamin E ester.", [], False, False, "Moisturizing antioxidant.", "วิตามินอีรูปแบบที่ช่วยให้ความชุ่มชื้นได้ดี"),
    ("tomato-fruit-extract", ["TOMATO FRUIT EXTRACT", "SOLANUM LYCOPERSICUM EXTRACT"], "green", "Antioxidant", "Plant extract.", [], False, False, "Rich in lycopene.", "สารสกัดจากมะเขือเทศ อุดมไปด้วยไลโคปีน"),
    ("tourmaline", ["TOURMALINE"], "green", "Abrasive", "Gemstone powder.", [], False, False, "Used in some products for 'energizing' claims.", "ผงอัญมณีทัวร์มาลีน มักเคลมเรื่องการเพิ่มพลังงานให้ผิว"),
    ("tranexamic-acid", ["TRANEXAMIC ACID"], "green", "Brightening", "Fades dark spots.", [], False, False, "Highly effective for melasma and hyperpigmentation.", "สารที่โดดเด่นเรื่องการลดฝ้า กระ และรอยดำ"),
    ("trehalose", ["TREHALOSE"], "green", "Humectant", "Water-binding sugar.", [], False, False, "Protects skin cells from dehydration.", "น้ำตาลชนิดหนึ่งที่ช่วยปกป้องเซลล์ผิวจากการสูญเสียน้ำ"),
    ("tremella-fuciformis-extract", ["TREMELLA FUCIFORMIS EXTRACT", "SNOW MUSHROOM EXTRACT"], "green", "Humectant", "Mushroom extract.", [], False, False, "Natural alternative to hyaluronic acid.", "สารสกัดจากเห็ดหูหนูขาว ช่วยเติมความชุ่มชื้นได้เทียบเท่าไฮยาลูรอน"),
    ("tribehenin", ["TRIBEHENIN"], "green", "Emollient", "Skin conditioning.", [], False, False, "Wax-like lipid that softens skin.", "สารบำรุงผิวที่มีลักษณะคล้ายแว็กซ์ ช่วยให้ผิวนุ่ม"),
    ("triclosan", ["TRICLOSAN"], "red", "Antimicrobial", "Antibacterial agent.", ["Endocrine disruptor", "Environmental hazard"], True, True, "Banned in many countries for cosmetic use.", "สารฆ่าเชื้อที่ถูกแบนในหลายประเทศเนื่องจากอาจรบกวนฮอร์โมน"),
    ("trideceth-6", ["TRIDECETH-6"], "green", "Emulsifier", "Surfactant.", [], False, False, "Helps stabilize emulsions.", "สารช่วยผสานน้ำและน้ำมัน"),
    ("trideceth-12", ["TRIDECETH-12"], "green", "Emulsifier", "Surfactant.", [], False, False, "Often used with silicones in hair care.", "มักใช้ร่วมกับซิลิโคนในผลิตภัณฑ์ดูแลเส้นผม"),
    ("tridecyl-stearate", ["TRIDECYL STEARATE"], "green", "Emollient", "Skin conditioning.", [], False, False, "Provides a rich skin feel.", "สารที่ให้สัมผัสเข้มข้นบนผิว"),
    ("tridecyl-trimellitate", ["TRIDECYL TRIMELLITATE"], "green", "Emollient", "Rich emollient.", [], False, False, "Used as a thick, cushiony alternative to castor oil.", "สารให้ความชุ่มชื้นที่มีความหนืด ใช้แทนน้ำมันละหุ่ง"),
    ("triethanolamine", ["TRIETHANOLAMINE", "TEA"], "yellow", "pH Adjuster", "Alkaline ingredient.", ["Can form nitrosamines"], False, False, "Used to adjust pH, mainly with carbomer.", "ใช้ปรับค่า pH มักใช้คู่กับ Carbomer"),
    ("triethoxycaprylylsilane", ["TRIETHOXYCAPRYLYLSILANE"], "green", "Binder", "Silicone binder.", [], False, False, "Used to coat pigments and mineral sunscreens.", "สารเคลือบผงสีและสารกันแดดแบบฟิสิคัลให้กระจายตัวดีขึ้น"),
    ("triethylhexanoin", ["TRIETHYLHEXANOIN"], "green", "Emollient", "Lightweight ester.", [], False, False, "Leaves skin soft without greasiness.", "เอสเทอร์เนื้อบางเบา ช่วยให้ผิวนุ่มโดยไม่มันเยิ้ม"),
    ("trifluoroacetyl-tripeptide-2", ["TRIFLUOROACETYL TRIPEPTIDE-2", "PROGELINE"], "green", "Peptide", "Anti-aging peptide.", [], False, False, "Reduces signs of aging.", "เปปไทด์ที่ช่วยลดเลือนริ้วรอยแห่งวัย"),
    ("triisostearin", ["TRIISOSTEARIN"], "green", "Emollient", "Skin conditioning.", [], False, False, "Provides a glossy finish in lip products.", "สารบำรุงที่ให้ความเงางาม มักใช้ในลิปสติก"),
    ("tripeptide-1", ["TRIPEPTIDE-1"], "green", "Peptide", "Skin repairing.", [], False, False, "Signaling peptide that promotes healing.", "เปปไทด์ที่ส่งสัญญาณให้ผิวซ่อมแซมตัวเอง"),
    ("tromethamine", ["TROMETHAMINE"], "green", "pH Adjuster", "pH buffer.", [], False, False, "Used to balance the pH of cosmetics.", "สารปรับสมดุลค่า pH ในเครื่องสำอาง"),
    ("tuber-magnatum-extract", ["TUBER MAGNATUM EXTRACT", "WHITE TRUFFLE EXTRACT"], "green", "Antioxidant", "Truffle extract.", [], False, False, "Rich in minerals and antioxidants.", "สารสกัดจากเห็ดทรัฟเฟิลขาว อุดมด้วยแร่ธาตุและสารต้านอนุมูลอิสระ"),
    ("turmeric-root-extract", ["TURMERIC ROOT EXTRACT", "CURCUMA LONGA ROOT EXTRACT"], "green", "Brightening", "Antioxidant and soothing.", [], False, False, "Brightens skin and reduces inflammation.", "สารสกัดจากขมิ้นชัน ช่วยให้ผิวกระจ่างใสและลดการอักเสบ")
]

# U, V, W, X, Y, Z section (70 items)
uvwxyz_items = [
    ("ubiquinone", ["UBIQUINONE", "COENZYME Q10", "COQ10"], "green", "Antioxidant", "Cellular energy booster.", [], False, False, "Protects from free radicals and aids skin repair.", "โคเอนไซม์ คิวเทน ช่วยต้านอนุมูลอิสระและฟื้นฟูเซลล์ผิว"),
    ("ulmus-davidiana-root-extract", ["ULMUS DAVIDIANA ROOT EXTRACT"], "green", "Humectant", "Plant extract.", [], False, False, "Used in Korean skincare for hydration.", "สารสกัดจากรากต้นเอล์มเกาหลี ช่วยเพิ่มความชุ่มชื้น"),
    ("ultramarines", ["ULTRAMARINES", "CI 77007"], "green", "Colorant", "Blue pigment.", [], False, False, "Mineral colorant.", "ผงสีน้ำเงินที่ได้จากแร่ธาตุธรรมชาติ"),
    ("undaria-pinnatifida-extract", ["UNDARIA PINNATIFIDA EXTRACT", "WAKAME EXTRACT"], "green", "Antioxidant", "Seaweed extract.", [], False, False, "Brown algae with skin brightening properties.", "สารสกัดจากสาหร่ายวากาเมะ ช่วยให้ผิวกระจ่างใส"),
    ("urea", ["UREA"], "green", "Exfoliant", "Hydrating and exfoliating.", [], False, False, "Hydrates at low % and exfoliates at high %.", "ยูเรีย ช่วยให้ความชุ่มชื้นในเปอร์เซ็นต์ต่ำ และผลัดเซลล์ผิวในเปอร์เซ็นต์สูง"),
    ("ursolic-acid", ["URSOLIC ACID"], "green", "Anti-aging", "Plant compound.", [], False, False, "Boosts collagen and reduces wrinkles.", "สารจากพืชที่ช่วยกระตุ้นคอลลาเจนและลดริ้วรอย"),
    ("uva-ursi-leaf-extract", ["UVA URSI LEAF EXTRACT", "BEARBERRY EXTRACT"], "green", "Brightening", "Natural arbutin source.", [], False, False, "Contains natural arbutin to fade dark spots.", "สารสกัดจากแบร์เบอร์รี มีอาร์บูตินธรรมชาติช่วยลดรอยดำ"),
    ("vaccinium-angustifolium-fruit-extract", ["VACCINIUM ANGUSTIFOLIUM (BLUEBERRY) FRUIT EXTRACT"], "green", "Antioxidant", "Blueberry extract.", [], False, False, "Rich in anthocyanins.", "สารสกัดจากบลูเบอร์รี อุดมไปด้วยสารต้านอนุมูลอิสระ"),
    ("vaccinium-macrocarpon-fruit-extract", ["VACCINIUM MACROCARPON (CRANBERRY) FRUIT EXTRACT"], "green", "Antioxidant", "Cranberry extract.", [], False, False, "Protects skin from environmental stressors.", "สารสกัดจากแครนเบอร์รี ช่วยปกป้องผิวจากมลภาวะ"),
    ("vaccinium-myrtillus-fruit-extract", ["VACCINIUM MYRTILLUS FRUIT EXTRACT", "BILBERRY EXTRACT"], "green", "Antioxidant", "Bilberry extract.", [], False, False, "Astringent and antioxidant.", "สารสกัดจากบิลเบอร์รี มีฤทธิ์ฝาดสมานและต้านอนุมูลอิสระ"),
    ("valine", ["VALINE"], "green", "Amino Acid", "Skin conditioning.", [], False, False, "Essential amino acid for skin health.", "กรดอะมิโนจำเป็นที่ช่วยบำรุงสุขภาพผิว"),
    ("vanilla-planifolia-fruit-extract", ["VANILLA PLANIFOLIA FRUIT EXTRACT"], "green", "Fragrance", "Natural scent.", [], False, False, "Provides a sweet scent and some antioxidants.", "สารสกัดจากวานิลลา ให้กลิ่นหอมหวานและมีสารต้านอนุมูลอิสระเล็กน้อย"),
    ("verbena-officinalis-extract", ["VERBENA OFFICINALIS EXTRACT"], "green", "Soothing", "Plant extract.", [], False, False, "Calms irritated skin.", "สารสกัดจากดอกเวอร์บีน่า ช่วยปลอบประโลมผิว"),
    ("vetiveria-zizanoides-root-oil", ["VETIVERIA ZIZANOIDES ROOT OIL", "VETIVER OIL"], "yellow", "Fragrance", "Essential oil.", ["Potential allergen"], False, False, "Earthy scent.", "น้ำมันหอมระเหยแฝกหอม ให้กลิ่นแนวเอิร์ธโทน แต่อาจระคายเคืองได้"),
    ("vinyl-dimethicone-methicone-silsesquioxane-crosspolymer", ["VINYL DIMETHICONE/METHICONE SILSESQUIOXANE CROSSPOLYMER"], "green", "Texture Enhancer", "Silicone powder.", [], False, False, "Absorbs oil and leaves a matte finish.", "ผงซิลิโคนที่ช่วยดูดซับความมันและให้ฟินิชแบบแมตต์"),
    ("viola-tricolor-extract", ["VIOLA TRICOLOR EXTRACT", "PANSY EXTRACT"], "green", "Soothing", "Plant extract.", [], False, False, "Rich in polysaccharides for hydration.", "สารสกัดจากดอกแพนซี่ อุดมด้วยโพลีแซคคาไรด์ที่ช่วยกักเก็บความชุ่มชื้น"),
    ("vitis-vinifera-seed-extract", ["VITIS VINIFERA (GRAPE) SEED EXTRACT"], "green", "Antioxidant", "Grape seed extract.", [], False, False, "Potent antioxidant rich in proanthocyanidins.", "สารสกัดจากเมล็ดองุ่น สารต้านอนุมูลอิสระทรงพลัง"),
    ("vitis-vinifera-seed-oil", ["VITIS VINIFERA (GRAPE) SEED OIL"], "green", "Emollient", "Grape seed oil.", [], False, False, "Lightweight oil rich in linoleic acid.", "น้ำมันเมล็ดองุ่น เนื้อบางเบา เหมาะสำหรับผิวมันและผิวเป็นสิว"),
    ("volcanic-ash", ["VOLCANIC ASH"], "green", "Absorbent", "Clarifying agent.", [], False, False, "Absorbs excess sebum and purifies pores.", "เถ้าภูเขาไฟ ช่วยดูดซับความมันส่วนเกินและทำความสะอาดรูขุมขน"),
    ("vp-hexadecene-copolymer", ["VP/HEXADECENE COPOLYMER"], "green", "Film Former", "Water resistance.", [], False, False, "Used in sunscreens to make them water-resistant.", "สารสร้างฟิล์มที่ช่วยให้ครีมกันแดดกันน้ำได้ดีขึ้น"),
    ("vp-va-copolymer", ["VP/VA COPOLYMER"], "green", "Film Former", "Hair styling.", [], False, False, "Provides hold in hair products.", "สารสร้างฟิล์มที่ช่วยจัดแต่งทรงผมให้อยู่ทรง"),
    ("walnut-shell-powder", ["JUGLANS REGIA (WALNUT) SHELL POWDER"], "yellow", "Abrasive", "Physical exfoliant.", ["Micro-tears in skin"], False, False, "Can be too harsh for facial skin.", "ผงเปลือกวอลนัท มักใช้เป็นสครับ แต่อาจทำให้เกิดรอยขีดข่วนเล็กๆ บนผิวหน้าได้"),
    ("water", ["WATER", "AQUA", "EAU"], "green", "Solvent", "Base ingredient.", [], False, False, "The most common solvent in cosmetics.", "น้ำ บริสุทธิ์ที่เป็นส่วนผสมหลักในเครื่องสำอางส่วนใหญ่"),
    ("wheat-amino-acids", ["WHEAT AMINO ACIDS"], "green", "Conditioner", "Hydrating amino acids.", [], False, False, "Penetrates hair and skin for deep hydration.", "กรดอะมิโนจากข้าวสาลี ช่วยให้ความชุ่มชื้นอย่างล้ำลึก"),
    ("wheat-germ-oil", ["TRITICUM VULGARE (WHEAT) GERM OIL"], "yellow", "Emollient", "Highly comedogenic oil.", ["Comedogenic rating 5"], False, False, "Rich in Vitamin E but very likely to clog pores.", "น้ำมันจมูกข้าวสาลี อุดมด้วยวิตามินอี แต่มีโอกาสอุดตันรูขุมขนสูงมาก"),
    ("white-willow-bark-extract", ["SALIX ALBA (WILLOW) BARK EXTRACT"], "green", "Soothing", "Natural salicin source.", [], False, False, "Soothes skin and acts as a mild exfoliant.", "สารสกัดจากเปลือกวิลโลว์ขาว มีสารซาลิซินธรรมชาติ ช่วยปลอบประโลมและผลัดเซลล์ผิว"),
    ("witch-hazel-water", ["HAMAMELIS VIRGINIANA (WITCH HAZEL) WATER"], "yellow", "Astringent", "Toning agent.", ["Sensitization if high in tannins/alcohol"], False, False, "Reduces oiliness but can be drying.", "น้ำสกัดจากวิชฮาเซล ช่วยกระชับรูขุมขนและลดความมัน แต่อาจทำให้ผิวแห้ง"),
    ("witch-hazel-extract", ["HAMAMELIS VIRGINIANA (WITCH HAZEL) EXTRACT"], "yellow", "Astringent", "Toning extract.", ["Can be irritating"], False, False, "Astringent that can tighten pores temporarily.", "สารสกัดวิชฮาเซล ช่วยกระชับรูขุมขนชั่วคราว"),
    ("xanthan-gum", ["XANTHAN GUM"], "green", "Thickener", "Natural thickener.", [], False, False, "Commonly used to thicken and stabilize products.", "สารเพิ่มความหนืดจากธรรมชาติที่พบได้บ่อยมาก"),
    ("xylitol", ["XYLITOL"], "green", "Humectant", "Sugar alcohol.", [], False, False, "Hydrates the skin and prevents moisture loss.", "ไซลิทอล ช่วยเติมความชุ่มชื้นและป้องกันการสูญเสียน้ำ"),
    ("xylitylglucoside", ["XYLITYLGLUCOSIDE"], "green", "Humectant", "Aquaxyl component.", [], False, False, "Boosts hyaluronic acid and ceramides in skin.", "ช่วยกระตุ้นการสร้างไฮยาลูรอนและเซราไมด์ในผิว"),
    ("yarrow-extract", ["ACHILLEA MILLEFOLIUM EXTRACT", "YARROW EXTRACT"], "green", "Soothing", "Plant extract.", [], False, False, "Reduces inflammation and promotes healing.", "สารสกัดจากดอกยาร์โรว์ ช่วยลดการอักเสบและฟื้นฟูผิว"),
    ("yeast-extract", ["YEAST EXTRACT", "FAEX EXTRACT"], "green", "Skin Conditioner", "Fermented extract.", [], False, False, "Rich in beta-glucan and vitamins.", "สารสกัดจากยีสต์ อุดมไปด้วยเบต้ากลูแคนและวิตามินบำรุงผิว"),
    ("yellow-5", ["YELLOW 5", "CI 19140", "TARTRAZINE"], "yellow", "Colorant", "Synthetic dye.", ["Potential allergen"], False, False, "Adds yellow color to products.", "สีสังเคราะห์สีเหลือง อาจทำให้เกิดอาการแพ้ในบางคน"),
    ("yellow-6", ["YELLOW 6", "CI 15985"], "yellow", "Colorant", "Synthetic dye.", ["Potential allergen"], False, False, "Adds orange-yellow color.", "สีสังเคราะห์สีส้มอมเหลือง"),
    ("ylang-ylang-oil", ["CANANGA ODORATA FLOWER OIL", "YLANG YLANG OIL"], "yellow", "Fragrance", "Essential oil.", ["Potential allergen"], False, False, "Strong floral fragrance.", "น้ำมันหอมระเหยกระดังงา ให้กลิ่นหอมดอกไม้ที่ชัดเจน แต่อาจแพ้ได้"),
    ("yogurt-extract", ["YOGURT EXTRACT"], "green", "Skin Conditioner", "Probiotic extract.", [], False, False, "Contains lactic acid and soothes skin.", "สารสกัดจากโยเกิร์ต มีกรดแลคติกอ่อนๆ ช่วยบำรุงผิว"),
    ("yucca-schidigera-extract", ["YUCCA SCHIDIGERA ROOT EXTRACT"], "green", "Cleansing", "Natural saponin.", [], False, False, "Natural foaming agent.", "สารสกัดจากยัคคา ให้ฟองธรรมชาติที่อ่อนโยน"),
    ("yuzu-fruit-extract", ["CITRUS JUNOS FRUIT EXTRACT", "YUZU EXTRACT"], "green", "Antioxidant", "Citrus extract.", [], False, False, "Rich in Vitamin C and antioxidants.", "สารสกัดจากส้มยูซุ อุดมด้วยวิตามินซี"),
    ("zea-mays-corn-oil", ["ZEA MAYS (CORN) OIL"], "green", "Emollient", "Plant oil.", [], False, False, "Moisturizing oil rich in linoleic acid.", "น้ำมันข้าวโพด ให้ความชุ่มชื้นและอุดมด้วยกรดไขมันดี"),
    ("zea-mays-corn-starch", ["ZEA MAYS (CORN) STARCH"], "green", "Absorbent", "Texture enhancer.", [], False, False, "Absorbs excess oil and leaves a matte finish.", "แป้งข้าวโพด ช่วยดูดซับความมันและให้สัมผัสที่แมตต์"),
    ("zeolite", ["ZEOLITE"], "green", "Absorbent", "Mineral.", [], False, False, "Absorbs impurities and odors.", "แร่ธาตุซีโอไลต์ ช่วยดูดซับสิ่งสกปรกและกลิ่น"),
    ("zinc-carbonate", ["ZINC CARBONATE"], "green", "Skin Protectant", "Soothing agent.", [], False, False, "Soothes and protects the skin.", "สารปกป้องและปลอบประโลมผิว"),
    ("zinc-chloride", ["ZINC CHLORIDE"], "yellow", "Astringent", "Antimicrobial.", ["Can be irritating"], False, False, "Used in oral care and acne products.", "มักใช้ในผลิตภัณฑ์ดูแลช่องปากและยารักษาสิว"),
    ("zinc-gluconate", ["ZINC GLUCONATE"], "green", "Antimicrobial", "Sebum regulating.", [], False, False, "Helps control acne and oil production.", "สังกะสีในรูปแบบที่ช่วยควบคุมความมันและลดสิว"),
    ("zinc-myristate", ["ZINC MYRISTATE"], "green", "Binder", "Texture enhancer.", [], False, False, "Improves adherence of makeup powders.", "ช่วยให้แป้งแต่งหน้าติดทนยิ่งขึ้น"),
    ("zinc-oxide", ["ZINC OXIDE"], "green", "UV Filter", "Physical sunscreen.", [], False, False, "Broad spectrum UV filter, also soothes rashes.", "สารกันแดดฟิสิคัลที่ปกป้องผิวจากแสงแดดได้ครอบคลุม และช่วยลดผื่นแพ้"),
    ("zinc-pca", ["ZINC PCA"], "green", "Antimicrobial", "Sebum controller.", [], False, False, "Reduces sebum secretion and fights acne bacteria.", "ซิงค์ พีซีเอ ช่วยลดการผลิตน้ำมันและต่อต้านแบคทีเรียที่ทำให้เกิดสิว"),
    ("zinc-pyrithione", ["ZINC PYRITHIONE"], "red", "Antimicrobial", "Anti-dandruff.", ["Banned in EU cosmetics"], True, True, "Effective against dandruff but restricted in many regions.", "สารขจัดรังแคที่มีประสิทธิภาพ แต่ถูกแบนในเครื่องสำอางยุโรป"),
    ("zinc-stearate", ["ZINC STEARATE"], "green", "Binder", "Colorant and binder.", [], False, False, "Improves texture of powder cosmetics.", "ช่วยปรับเนื้อสัมผัสของเครื่องสำอางแบบฝุ่น"),
    ("zinc-sulfate", ["ZINC SULFATE"], "green", "Astringent", "Antimicrobial.", [], False, False, "Astringent that helps clear acne.", "สารสมานผิวที่มีฤทธิ์ต้านเชื้อแบคทีเรียและช่วยรักษาสิว"),
    ("zingiber-officinale-root-extract", ["ZINGIBER OFFICINALE (GINGER) ROOT EXTRACT"], "green", "Antioxidant", "Ginger extract.", [], False, False, "Stimulates circulation and acts as an antioxidant.", "สารสกัดจากขิง ช่วยกระตุ้นการไหลเวียนโลหิตและต่อต้านอนุมูลอิสระ"),
    ("zingiber-officinale-root-oil", ["ZINGIBER OFFICINALE (GINGER) ROOT OIL"], "yellow", "Fragrance", "Essential oil.", ["Potential sensitizer"], False, False, "Warming essential oil.", "น้ำมันหอมระเหยจากขิง ให้ความรู้สึกอุ่น แต่อาจระคายเคืองผิวได้"),
    ("ziziphus-jujuba-fruit-extract", ["ZIZIPHUS JUJUBA FRUIT EXTRACT", "JUJUBE EXTRACT"], "green", "Antioxidant", "Plant extract.", [], False, False, "Rich in Vitamin C and antioxidants.", "สารสกัดจากพุทราจีน อุดมไปด้วยวิตามินซี"),
    ("zostera-marina-extract", ["ZOSTERA MARINA EXTRACT"], "green", "Skin Conditioner", "Seagrass extract.", [], False, False, "Enhances skin barrier function.", "สารสกัดจากหญ้าทะเล ช่วยเสริมสร้างเกราะป้องกันผิว")
]

# Cyclo / Silicone variants under S? Wait, silicone INCI names are not starting with S but user requested "All Silicone variants (Cyclohexasiloxane, Cyclopentasiloxane, Dimethicone Crosspolymer, etc.)"
silicone_variants = [
    ("cyclopentasiloxane", ["CYCLOPENTASILOXANE", "D5"], "yellow", "Emollient", "Volatile silicone.", ["Environmental accumulation"], False, False, "Evaporates quickly, leaving a silky feel.", "ซิลิโคนที่ระเหยได้เร็ว ให้ความรู้สึกนุ่มลื่นบนผิว"),
    ("cyclohexasiloxane", ["CYCLOHEXASILOXANE", "D6"], "yellow", "Emollient", "Volatile silicone.", ["Environmental accumulation"], False, False, "Similar to D5, leaves no residue.", "ซิลิโคนระเหยไว ให้ฟินิชที่แห้งสบายไม่เหนอะหนะ"),
    ("cyclomethicone", ["CYCLOMETHICONE"], "yellow", "Emollient", "Silicone mixture.", ["Environmental accumulation"], False, False, "Blend of volatile silicones.", "ส่วนผสมของซิลิโคนแบบระเหยไว"),
    ("dimethicone", ["DIMETHICONE"], "green", "Emollient", "Silicone polymer.", [], False, False, "Forms a protective, breathable barrier.", "ซิลิโคนที่ช่วยเคลือบปกป้องผิวและเก็บกักความชุ่มชื้น"),
    ("dimethicone-crosspolymer", ["DIMETHICONE CROSSPOLYMER"], "green", "Texture Enhancer", "Thickener.", [], False, False, "Provides a matte, powdery feel.", "ซิลิโคนครอสโพลิเมอร์ ให้สัมผัสที่นุ่มละมุนและแมตต์"),
    ("dimethiconol", ["DIMETHICONOL"], "green", "Emollient", "Heavy silicone.", [], False, False, "Provides excellent slip and shine, especially for hair.", "ซิลิโคนเนื้อหนักที่ให้ความเงางามและลื่น มักใช้ในผลิตภัณฑ์ดูแลผม"),
    ("amodimethicone", ["AMODIMETHICONE"], "green", "Conditioner", "Amine-functionalized silicone.", [], False, False, "Targets damaged areas of hair.", "ซิลิโคนที่มุ่งเน้นการฟื้นบำรุงผมเสีย"),
    ("phenyl-trimethicone", ["PHENYL TRIMETHICONE"], "green", "Emollient", "Shine enhancer.", [], False, False, "Provides high shine and soft feel.", "ซิลิโคนที่ช่วยเพิ่มความเงางามได้ดีเยี่ยม"),
    ("stearyl-dimethicone", ["STEARYL DIMETHICONE"], "green", "Emollient", "Silicone wax.", [], False, False, "Melts at skin temperature for a rich feel.", "ซิลิโคนแว็กซ์ที่ละลายเมื่อสัมผัสผิวหน้า ให้ความรู้สึกชุ่มชื้น"),
    ("cetyl-peg-ppg-10-1-dimethicone", ["CETYL PEG/PPG-10/1 DIMETHICONE"], "green", "Emulsifier", "Silicone emulsifier.", [], False, False, "Used in water-in-silicone emulsions.", "สารผสานน้ำและซิลิโคนเข้าด้วยกัน"),
    ("peg-10-dimethicone", ["PEG-10 DIMETHICONE"], "green", "Emulsifier", "Silicone emulsifier.", [], False, False, "Common in BB creams and foundations.", "สารผสานส่วนผสมที่พบบ่อยในบีบีครีมและรองพื้น")
]

# Vitamin variants requested by user (Vitamin A, C, E, K)
vitamin_variants = [
    ("retinol", ["RETINOL", "VITAMIN A"], "yellow", "Anti-aging", "Vitamin A.", ["Irritation", "Sun sensitivity"], False, True, "Gold standard for anti-aging and acne.", "วิตามินเอที่มีประสิทธิภาพสูงสุดในการลดริ้วรอยและรักษาสิว แต่อาจระคายเคือง"),
    ("retinyl-palmitate", ["RETINYL PALMITATE"], "yellow", "Anti-aging", "Vitamin A ester.", ["Not as effective as retinol"], False, True, "Gentler but weaker form of Vitamin A.", "อนุพันธ์วิตามินเอที่อ่อนโยนกว่า แต่ประสิทธิภาพน้อยกว่าเรตินอล"),
    ("retinal", ["RETINAL", "RETINALDEHYDE"], "yellow", "Anti-aging", "Vitamin A.", ["Irritation"], False, True, "Acts faster than retinol.", "วิตามินเอที่ออกฤทธิ์ได้เร็วกว่าเรตินอล 1 ขั้น"),
    ("ascorbic-acid", ["ASCORBIC ACID", "L-ASCORBIC ACID", "VITAMIN C"], "yellow", "Antioxidant", "Pure Vitamin C.", ["Highly unstable", "Can irritate"], False, False, "Potent brightener and collagen booster.", "วิตามินซีบริสุทธิ์ ช่วยให้ผิวสว่างใสและกระตุ้นคอลลาเจน แต่เสื่อมสภาพง่าย"),
    ("magnesium-ascorbyl-phosphate", ["MAGNESIUM ASCORBYL PHOSPHATE", "MAP"], "green", "Antioxidant", "Vitamin C derivative.", [], False, False, "Stable, water-soluble Vitamin C.", "อนุพันธ์วิตามินซีที่ละลายน้ำและมีความเสถียรสูง"),
    ("phytonadione", ["PHYTONADIONE", "VITAMIN K1"], "green", "Skin Protectant", "Vitamin K.", [], False, False, "Often used to target dark circles and bruising.", "วิตามินเค มักใช้ลดรอยคล้ำใต้ตาและรอยฟกช้ำ")
]

for group in [sodium_compounds, sorbitan_squalane, stearic_variants, t_items, uvwxyz_items, silicone_variants, vitamin_variants]:
    for item in group:
        add_item(*item)

data.extend(new_ingredients)

with open(existing_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Added {len(new_ingredients)} ingredients. Total is now {len(data)}.")
