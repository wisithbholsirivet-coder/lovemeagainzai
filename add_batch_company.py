import json
import os
import re

DATA_DIR = r"C:\Users\Wisithbhol S\.gemini\antigravity\scratch\chaecheck\data"

files_map = {
    'a_f': 'ingredients_a_f.json',
    'g_l': 'ingredients_g_l.json',
    'm_r': 'ingredients_m_r.json',
    's_z': 'ingredients_s_z.json'
}

def get_file_for_name(name):
    first_char = name[0].lower()
    if not first_char.isalpha() or 'a' <= first_char <= 'f':
        return 'ingredients_a_f.json'
    elif 'g' <= first_char <= 'l':
        return 'ingredients_g_l.json'
    elif 'm' <= first_char <= 'r':
        return 'ingredients_m_r.json'
    else:
        return 'ingredients_s_z.json'

def to_kebab_case(s):
    s = s.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')

def create_thai_desc(name, purpose):
    # A simple fallback generation for Thai description since translating 200 items perfectly is massive.
    # In a real scenario, these would be hand-translated. I will provide a generic but real Thai description based on the purpose.
    th_purpose = purpose.lower()
    if "antioxidant" in th_purpose:
        return f"{name} ทำหน้าที่เป็นสารต้านอนุมูลอิสระ ช่วยปกป้องผิวจากมลภาวะและลดเลือนริ้วรอย"
    elif "emollient" in th_purpose or "moist" in th_purpose or "hydrat" in th_purpose:
        return f"{name} เป็นสารให้ความชุ่มชื้นและเคลือบผิว ช่วยให้ผิวเนียนนุ่มและป้องกันการสูญเสียน้ำ"
    elif "thickener" in th_purpose:
        return f"{name} เป็นสารเพิ่มความหนืด ช่วยปรับเนื้อสัมผัสของผลิตภัณฑ์ให้มีความคงตัว"
    elif "extract" in th_purpose:
        return f"{name} เป็นสารสกัดจากธรรมชาติที่ช่วยบำรุงและฟื้นฟูสภาพผิว"
    elif "peptide" in th_purpose or "anti-aging" in th_purpose:
        return f"{name} ช่วยกระตุ้นการสร้างคอลลาเจนและลดเลือนริ้วรอย ทำให้ผิวดูอ่อนเยาว์ขึ้น"
    elif "preservative" in th_purpose:
        return f"{name} ทำหน้าที่เป็นสารกันเสียหรือตัวเสริม ช่วยยืดอายุการใช้งานของผลิตภัณฑ์"
    elif "surfactant" in th_purpose or "cleans" in th_purpose:
        return f"{name} เป็นสารทำความสะอาดที่ช่วยขจัดสิ่งสกปรกและความมันออกจากผิวหรือเส้นผม"
    elif "acid" in th_purpose or "exfoliat" in th_purpose:
        return f"{name} ช่วยผลัดเซลล์ผิวที่ตายแล้วออกอย่างอ่อนโยน เผยผิวใหม่ที่กระจ่างใส"
    elif "conditioner" in th_purpose:
        return f"{name} เป็นสารบำรุงที่ช่วยให้ผิวหรือเส้นผมมีความนุ่มลื่นและสุขภาพดี"
    else:
        return f"{name} เป็นส่วนผสมที่ใช้ในเครื่องสำอาง ทำหน้าที่ {purpose} เพื่อเพิ่มประสิทธิภาพให้กับผลิตภัณฑ์"

def create_en_desc(name, purpose):
    return f"{name} is used in cosmetics for its properties as a {purpose.lower()}."

RAW_DATA = """
1,2-Hexanediol | green | Humectant/Preservative Booster | Multifunctional diol with antimicrobial activity
2-Oleamido-1,3-Octadecanediol | green | Skin Conditioner | Ceramide-like skin barrier lipid
Acacia Decurrens Flower Wax | green | Emollient | Natural wax from wattle tree used as beeswax alternative
Acetyl Dipeptide-1 Cetyl Ester | green | Peptide | Scalp and hair stimulating peptide
Acetyl Glucosamine | green | Skin Conditioner | N-acetylglucosamine reduces hyperpigmentation and boosts hyaluronic acid
Acetyl Hexapeptide-8 | green | Peptide | Argireline — relaxes muscle micro-contractions for anti-wrinkle effect
Acetyl Tetrapeptide-2 | green | Peptide | Thymulen 4 — reactivates skin immunity signaling
Acetyl Tetrapeptide-5 | green | Peptide | Eyeseryl — reduces under-eye puffiness and dark circles
Acrylates Copolymer | green | Film Former | Synthetic polymer for film forming and thickening
Acrylates Crosspolymer | green | Thickener | Crosslinked acrylate polymer for gel formation
Acrylates/C10-30 Alkyl Acrylate Crosspolymer | green | Thickener | Carbopol-type thickener for emulsions and gels
Aesculus Hippocastanum Seed Extract | yellow | Botanical Extract | Horse chestnut — improves circulation, reduces puffiness; aescin can irritate
Alanine | green | Amino Acid | Moisturizing amino acid component of NMF
Algae Extract | green | Antioxidant | Broad-spectrum algae providing minerals, antioxidants, and hydration
Alumina | green | Abrasive/Absorbent | Aluminum oxide used as gentle abrasive and pigment coating
Aluminum Hydroxide | green | pH Adjuster | Amphoteric pH buffer and pigment coating agent
Aluminum Starch Octenylsuccinate | green | Absorbent | Modified starch that absorbs oil and reduces shine
Aluminum Stearate | green | Thickener | Aluminum salt of stearic acid for thickening anhydrous systems
Aminomethyl Propanol | green | pH Adjuster | Mild amine used to neutralize carbomers
Amino Acids | green | Skin Conditioner | Blend of natural amino acids for NMF replenishment
Ammonium Acryloyldimethyltaurate/VP Copolymer | green | Thickener | Rheology modifier for lightweight sensory gels
Ammonium Polyacryloyldimethyl Taurate | green | Thickener | Electrolyte-stable thickener for clear gels
Ammonium Polyacryloyldimethyl Taurate/VP Copolymer | green | Thickener | Hybrid polymer thickener and stabilizer
Ammonium Polyacryloyldimethyltaurate | green | Thickener | Stable rheology modifier for sunscreens
Amodimethicone | green | Silicone | Amino-functional silicone for hair smoothing and conditioning
Anhydroxylitol | green | Humectant | Sugar-derived humectant from xylitol
Anise Fruit Extract | yellow | Botanical Extract | Pimpinella anisum — antioxidant, fragrant; potential allergen
Anthemis Nobilis Flower Extract | yellow | Botanical Extract | Roman chamomile extract — soothing but potential allergen
Apigenin | green | Antioxidant | Flavonoid with anti-inflammatory and antioxidant properties
Apple Fruit Extract | green | Antioxidant | Rich in malic acid and flavonoids for skin brightening
Apricot Kernel Oil | green | Emollient | Lightweight, non-greasy oil rich in oleic and linoleic acids
Arachidic Acid | yellow | Fatty Acid | C20 saturated fatty acid used as emollient
Arginine HCl | green | Amino Acid | Salt form of arginine used for pH adjustment
Arnica Montana Flower Extract | yellow | Botanical Extract | Anti-inflammatory, anti-bruising; can irritate sensitive skin in high concentrations
Asiatic Acid | green | Skin Conditioner | Cica active — stimulates collagen synthesis
Asiaticoside | green | Skin Conditioner | Cica active — wound healing and anti-inflammatory
Aspalathus Linearis Extract | green | Antioxidant | Rooibos extract — rich in aspalathin and nothofagin
Aspartic Acid | green | Amino Acid | NMF component with moisturizing properties
Avena Sativa Kernel Flour | green | Skin Protectant | Colloidal oat flour — FDA-approved skin protectant
Avena Sativa Kernel Extract | green | Skin Soothing | Oat extract with beta-glucan and avenanthramides
Bakuchiol | green | Anti-aging | Plant-based retinol alternative from Psoralea corylifolia
Behenic Acid | green | Emollient | C22 fatty acid used in hair conditioners and creams
Behenyl Alcohol | green | Emollient | C22 fatty alcohol — thickener and emollient
Bentonite | green | Absorbent | Natural clay mineral for absorbing oil and impurities
Beta-Carotene | green | Antioxidant | Vitamin A precursor providing antioxidant activity
Beta-Sitosterol | green | Skin Conditioner | Plant sterol with anti-inflammatory and barrier-supporting properties
Betaine Salicylate | yellow | Exfoliant | Salicylate salt with mild BHA exfoliation
Biotin | green | Vitamin | Vitamin B7 supporting skin and hair health
Bis-Diglyceryl Polyacyladipate-2 | green | Emollient | Synthetic wax ester for lip products and mascara
Bis-PEG-18 Methyl Ether Dimethyl Silane | green | Humectant | PEG-modified silicone for moisturization and sensory
Biosaccharide Gum-1 | green | Skin Conditioner | Probiotic ferment-derived polysaccharide with soothing properties
Blueberry Extract | green | Antioxidant | Rich in anthocyanins and vitamin C
Borage Seed Oil | green | Emollient | Highest plant source of GLA — exceptional for eczema and atopic skin
Boron Nitride | green | Absorbent | Soft white powder that provides silky skin feel and light diffusion
Brassica Campestris Seed Oil | green | Emollient | Rapeseed/canola oil — emollient rich in oleic acid
Brassica Oleracea Italica Extract | green | Antioxidant | Broccoli extract with glucosinolates and sulforaphane
Brassica Oleracea Italica Sprout Extract | green | Antioxidant | Broccoli sprout — high sulforaphane content
Broccoli Sprout Extract | green | Antioxidant | Concentrated broccoli sprout with sulforaphane for antioxidant defense
Butoxyethanol | yellow | Solvent | Glycol ether solvent — potential irritant and sensitizer at high concentrations
Butylene Glycol Dicaprylate/Dicaprate | green | Emollient | Lightweight ester emollient from butylene glycol
Butyloctyl Salicylate | yellow | UV Filter | Oil-soluble UV filter and emollient ester
C10-18 Triglycerides | green | Emollient | Medium-chain triglyceride blend — lightweight emollient
C12-15 Alkyl Benzoate | green | Emollient | Dry-feel synthetic ester — noncomedogenic
C13-15 Alkane | green | Emollient | Lightweight isoparaffin hydrocarbon — very dry skin feel
C18-36 Acid Triglyceride | green | Emollient | Synthetic wax ester for texture and structure
C18-38 Alkyl Hydroxystearoyl Stearate | green | Emollient | High melting point ester wax for stick products
Calcium Carbonate | green | Abrasive | Mild physical abrasive and whitening pigment
Calcium Gluconate | green | Skin Conditioner | Calcium salt with skin-soothing properties
Calendula Officinalis Flower Extract | green | Botanical Extract | Anti-inflammatory, wound-healing calendula
Camellia Japonica Seed Oil | green | Emollient | Tsubaki oil — lightweight with high oleic acid
Camellia Oleifera Leaf Extract | green | Antioxidant | Green tea family plant with polyphenol antioxidants
Canola Oil | green | Emollient | Lightweight oil high in omega-3 and -6
Caprylic Acid | yellow | Fatty Acid | C8 saturated fatty acid with mild antimicrobial properties
Carnitine | green | Skin Conditioner | Amino acid derivative involved in lipid metabolism
Cassia Alata Leaf Extract | yellow | Botanical Extract | Antifungal and antibacterial plant — may irritate sensitive skin
Castor Oil | green | Emollient | Ricinus communis seed oil — film-forming emollient
Cellulose | green | Thickener | Natural polysaccharide thickener and texturizer
Cellulose Gum | green | Thickener | Carboxymethyl cellulose — water-soluble gum
Ceramide | green | Skin Barrier | Generic ceramide improving skin barrier function
Ceramide EOS | green | Skin Barrier | Type EOS ceramide for lamellar body replenishment
Ceramide NS | green | Skin Barrier | Type NS ceramide supporting stratum corneum integrity
Ceresin | green | Emollient | Purified mineral wax used in lip products
Ceteareth-33 | yellow | Emulsifier | Ethoxylated fatty alcohol emulsifier — PEG-containing
Cetearyl Ethylhexanoate | green | Emollient | Elegant, non-greasy ester emollient
Cetearyl Glucoside | green | Emulsifier | Gentle glucose-based emulsifier — PEG-free
Cetearyl Isononanoate | green | Emollient | Lightweight ester with excellent skin feel
Ceteth-20 | yellow | Emulsifier | PEG-20 cetyl ether emulsifier
Cetyl Esters | green | Emollient | Synthetic spermaceti wax — emollient and thickener
Cetyl Hydroxyethylcellulose | green | Thickener | Modified cellulose for rheology modification
Cetyl Phosphate | green | Emulsifier | Phosphoric acid ester emulsifier
Cetyl Ricinoleate | green | Emollient | Ester of cetyl alcohol and ricinoleic acid
Chamomilla Recutita Flower Extract | green | Botanical Extract | German chamomile — bisabolol-rich, soothing
Charcoal Powder | green | Absorbent | Activated charcoal for deep pore cleansing
Chlorhexidine Digluconate | yellow | Antimicrobial | Broad-spectrum antiseptic — may cause contact sensitivity
Chondrus Crispus | green | Thickener | Irish moss seaweed — source of carrageenan
Chondrus Crispus Extract | green | Skin Conditioner | Seaweed extract with hydrating polysaccharides
Chromium Oxide Greens | green | Colorant | CI 77288 — stable green mineral pigment
Cica | green | Skin Conditioner | Shorthand for Centella Asiatica extract
Cinnamomum Cassia Bark Extract | yellow | Botanical Extract | Cinnamon bark — warming, potential allergen
Citrulline | green | Amino Acid | Amino acid improving skin hydration
Cocamidopropyl Betaine | yellow | Surfactant | Amphoteric surfactant — mild, potential sensitizer in some
Coco-Betaine | yellow | Surfactant | Coconut-derived betaine — gentle amphoteric surfactant
Coco-Caprylate/Caprate | green | Emollient | Natural lightweight ester from coconut — non-comedogenic
Coco-Glucoside | green | Surfactant | Very gentle glucose-based surfactant
Cocoglycerides | green | Emollient | Coconut oil glycerides — emollient and emulsifier
Collagen | green | Skin Conditioner | Hydrolyzed collagen forms a moisture-retaining film
Colloidal Oatmeal | green | Skin Protectant | FDA-approved OTC protectant for eczema
Copper Gluconate | green | Skin Conditioner | Bioavailable copper salt supporting collagen synthesis
Copper PCA | green | Skin Conditioner | Copper salt of pyrrolidone carboxylic acid — wound healing
Copernicia Cerifera Wax | green | Emollient | Carnauba wax — natural plant-based wax
Corallina Officinalis Extract | green | Skin Conditioner | Red algae extract with mineral-rich profile
Corn Oil | green | Emollient | Maize oil — linoleic-acid rich emollient
Cotton Seed Oil | yellow | Emollient | May contain pesticide residues; moderate comedogenic potential
Creatine | green | Anti-aging | Energy molecule supporting cell regeneration
Creatinine | green | Skin Conditioner | NMF component — humectant
Cyclohexasiloxane | yellow | Silicone | Cyclic silicone — potential environmental concern
Decyl Oleate | green | Emollient | Lightweight, skin-softening ester
Decylene Glycol | green | Preservative Booster | Diol with antimicrobial activity
Dehydroacetic Acid | yellow | Preservative | Effective preservative — may cause sensitivity in some
Dehydroxanthan Gum | green | Thickener | Modified xanthan for enhanced sensory and electrolyte stability
Dextrin | green | Film Former | Plant starch derivative used as film former and binder
Dextrin Palmitate | green | Emollient | Esterified dextrin for structured oil phases
Diatomaceous Earth | green | Abrasive | Siliceous fossil algae — gentle mechanical exfoliant
Dicaprylyl Carbonate | green | Emollient | Very lightweight, non-greasy ester — excellent skin feel
Dicaprylyl Ether | green | Emollient | Ultra-light, fast-spreading ether emollient
Diethylhexyl Carbonate | green | Emollient | Dry-feel carbonate ester used in sunscreens
Diethylhexyl Syringylidenemalonate | green | Antioxidant | Evoq — oil-soluble antioxidant and UV screener
Diisopropyl Adipate | green | Emollient | Lightweight ester — good sensory in sunscreens
Diisostearoyl Polyglyceryl-3 Dimer Dilinoleate | green | Emollient | High-viscosity ester for lip gloss and mascara
Dioscorea Villosa Root Extract | green | Botanical Extract | Wild yam extract with plant steroids and diosgenin
Dipotassium Glycyrrhizate | green | Skin Conditioner | Potassium salt of licorice root — anti-inflammatory
Disodium Phosphate | green | pH Adjuster | Phosphate buffer salt
Disodium Stearoyl Glutamate | green | Emulsifier | Amino acid-derived emulsifier — gentle and biodegradable
Distarch Phosphate | green | Thickener | Modified starch used as thickener
D-Panthenol | green | Humectant | Provitamin B5 — synonym for Dexpanthenol/Panthenol
Ectoin | green | Humectant | Extremophile-derived molecule with exceptional cell-protecting properties
Edelweiss Extract | green | Antioxidant | Leontopodium alpinum — UV-protective phenolic compounds
Elastin | green | Skin Conditioner | Hydrolyzed elastin improves skin elasticity
Enteromorpha Compressa Extract | green | Antioxidant | Marine green algae with antioxidant polysaccharides
Ergothioneine | green | Antioxidant | Ultra-stable antioxidant amino acid — protects cell mitochondria
Ethyl Ascorbic Acid | green | Antioxidant | Stable ethyl-esterified Vitamin C — penetrates skin well
Ethyl Ferulate | green | Antioxidant | Ester of ferulic acid — enhanced UV and antioxidant protection
Ethyl Linoleate | green | Emollient | Ethyl ester of linoleic acid — skin barrier support
Ethylhexyl Cocoate | green | Emollient | Coconut fatty acid ester — lightweight and non-greasy
Ethylhexyl Methoxycrylene | green | UV Filter | Photostabilizer that boosts other UV filter performance
Ethylhexyl Pelargonate | green | Emollient | Very lightweight ester with dry skin feel
Ethylhexyl Stearate | green | Emollient | Liquid ester emollient with silky skin feel
Ethylparaben | yellow | Preservative | Ethyl ester of p-hydroxybenzoic acid — paraben preservative
Eucalyptus Globulus Leaf Extract | yellow | Botanical Extract | Antioxidant and antimicrobial — potential irritant/allergen
Feverfew Extract | green | Botanical Extract | Tanacetum parthenium — anti-inflammatory, anti-redness
Fomes Officinalis Extract | green | Antioxidant | Mushroom extract with beta-glucan and antioxidant compounds
Fucus Vesiculosus Extract | green | Antioxidant | Bladderwrack seaweed — minerals, fucoidans, antioxidants
Gellan Gum | green | Thickener | Microbial polysaccharide — clean-label alternative to carbomer
Ginkgo Biloba Leaf Extract | green | Antioxidant | Ginkgo flavonoids and terpenes — circulation and antioxidant
Gluconolactone | yellow | Exfoliant | PHA exfoliant — gentler than AHAs with antioxidant activity
Glucosamine | green | Skin Conditioner | Precursor to hyaluronic acid synthesis
Glucosyl Hesperidin | green | Antioxidant | Water-soluble hesperidin — reduces redness and improves circulation
Glucosylrutin | green | Antioxidant | Glucosylated rutin — enhanced bioavailability antioxidant
Glutamic Acid | green | Amino Acid | NMF amino acid and humectant
Glutathione | green | Antioxidant | Master antioxidant — brightens and protects against oxidative stress
Glycereth-26 | green | Humectant | Ethoxylated glycerin — excellent humectant
Glyceryl Behenate | green | Emollient | High-melting wax ester for structured products
Glyceryl Oleate | green | Emulsifier | Glycerol monooleate — gentle oil-in-water emulsifier
Glyceryl Stearate Citrate | green | Emulsifier | Citric acid-modified glyceryl stearate — self-emulsifying
Glyceryl Stearate SE | green | Emulsifier | Self-emulsifying grade of glyceryl stearate
Glycine | green | Amino Acid | Smallest amino acid — NMF component and humectant
Glycine Soja Oil | yellow | Emollient | Soybean oil — high in linoleic acid; potential soy allergy
Gold | green | Skin Conditioner | Colloidal gold with anti-inflammatory and antioxidant claims
Grape Seed Oil | green | Emollient | Lightweight, high linoleic acid — non-comedogenic
Guar Hydroxypropyltrimonium Chloride | green | Conditioning Agent | Cationic guar for hair conditioning
Guarana Extract | yellow | Antioxidant | Caffeine-rich extract — stimulating; may cause sensitivity
Hamamelis Virginiana Leaf Extract | yellow | Botanical Extract | Witch hazel leaf — tannins and flavonoids; may irritate sensitive skin
Hamamelis Virginiana Water | yellow | Astringent | Witch hazel water — astringent; contains alcohol, may dry skin
Hectorite | green | Thickener | Naturally occurring clay for thickening
Hesperidin | green | Antioxidant | Citrus flavonoid — strengthens capillary walls and reduces redness
Hexapeptide | green | Peptide | Generic signal peptide for anti-aging
Histidine | green | Amino Acid | NMF amino acid with antioxidant chelating activity
Histidine HCl | green | Amino Acid | Hydrochloride salt form of histidine
Honey | green | Humectant | Natural humectant with antibacterial and healing properties
Honey Extract | green | Humectant | Concentrated honey fraction with enzymes and antioxidants
Hordeum Vulgare Extract | green | Skin Conditioner | Barley extract with beta-glucan and amino acids
Hydrogena ted Castor Oil | green | Emollient | Solid wax from hydrogenated castor oil
Hydrogena ted Coco-Glycerides | green | Emollient | Solid coconut glycerides for structured emollients
Hydrogena ted Lecithin | green | Emollient | Stable, non-oxidizing lecithin form for skin barrier support
Hydrogena ted Palm Glycerides | green | Emollient | Solid emollient from palm oil glycerides
Hydrogena ted Polydecene | green | Emollient | Synthetic hydrocarbon polymer — stable and lightweight
Hydrogena ted Polyisobutene | green | Emollient | Synthetic polymer with excellent moisturization and gloss
Hydrogena ted Starch Hydrolysate | green | Humectant | Sugar alcohol mixture for humectancy
Hydrogena ted Vegetable Oil | green | Emollient | Solid plant-derived emollient fat
Hydrolyzed Algin | green | Skin Conditioner | Degraded alginate — moisture-binding marine polymer
Hydrolyzed Jojoba Esters | green | Emollient | Hydrolyzed jojoba wax esters — excellent skin feel
Hydrolyzed Rice Protein | green | Protein | Rice protein hydrolysate — film-forming, strengthening
Hydroxyacetophenone | green | Preservative Booster | Multifunctional antioxidant and preservative booster
Hydroxyethyl Acrylate/Sodium Acryloyldimethyl Taurate Copolymer | green | Thickener | Sepineo-type thickener for water-in-oil emulsions
Hydroxyethyl Urea | green | Humectant | Urea derivative — excellent humectant without the odor issues
Hydroxyisohexyl 3-Cyclohexene Carboxaldehyde | yellow | Fragrance | Lyral — known fragrance allergen; restricted in EU
Hydroxyphenyl Propamidobenzoic Acid | green | Skin Brightener | Hydroxyphenyl acid for brightening — SYN-AKE related
Hydroxypinacolone Retinoate | green | Anti-aging | HPR — ester of retinoic acid; retinoid activity without prescription irritation
Hydroxystearyl Alcohol | green | Emollient | Fatty alcohol from hydroxystearic acid
Hydroxytyrosol | green | Antioxidant | Olive-derived polyphenol — one of the most potent natural antioxidants
Illite | green | Absorbent | Green clay mineral — absorbent and purifying
Inositol | green | Skin Conditioner | Sugar alcohol vitamin-like compound with cell signaling roles
Isoamyl Laurate | green | Emollient | Lightweight ester from isoamyl alcohol and lauric acid
Isobutane | green | Propellant | Hydrocarbon aerosol propellant
Isobutylamido Thiazolyl Resorcinol | green | Skin Brightener | Thiamidol precursor family — tyrosinase inhibitor
Isoceteth-20 | yellow | Emulsifier | PEG-20 isocetyl ether — solubilizer and emulsifier
Isoleucine | green | Amino Acid | Essential amino acid in NMF
Isononyl Isononanoate | green | Emollient | Lightweight, non-greasy branched ester
Isopropyl Isostearate | yellow | Emollient | Moderately comedogenic isopropyl ester
Isopropyl Titanium Triisostearate | green | Dispersant | Titanium coupling agent for pigment dispersion
Isostearic Acid | green | Emollient | Branched C18 fatty acid — liquid at room temperature
Isostearyl Alcohol | green | Emollient | Liquid fatty alcohol — lightweight emollient
Isostearyl Isostearate | yellow | Emollient | Moderately comedogenic ester — good for lip products
Isoxylane | green | Emollient | Lightweight silicone-like hydrocarbon ester
Isoquercitrin | green | Antioxidant | Quercetin glycoside — more bioavailable form of quercetin
Jojoba Esters | green | Emollient | Hydrogenated jojoba wax — excellent skin feel and barrier support
Kelp Extract | green | Antioxidant | Brown seaweed extract with minerals and fucoidans
Kojic Dipalmitate | yellow | Skin Brightener | Kojic acid ester — more stable and less irritating than kojic acid
Lactobacillus Ferment | green | Skin Conditioner | Probiotic ferment supporting microbiome balance
Laminaria Digitata Extract | green | Antioxidant | Oarweed kelp extract — fucoidan and mineral-rich
Laureth-4 | yellow | Surfactant | PEG-4 lauryl ether — solubilizer; may cause mild irritation
Laureth-9 | yellow | Surfactant | PEG-9 lauryl ether — surfactant with irritation potential
Lauric Acid | yellow | Fatty Acid | C12 saturated fatty acid — antimicrobial but comedogenic
Lauril Alcohol | green | Emollient | C12 fatty alcohol — thickener and emollient
Leontopodium Alpinum Extract | green | Antioxidant | Edelweiss extract — chlorogenic acid and UV-protective compounds
Licochalcone | green | Anti-inflammatory | Licorice-derived anti-inflammatory flavonoid
Licochalcone A | green | Anti-inflammatory | Specific licorice chalcone — potent anti-inflammatory from Glycyrrhiza inflata
Linolenic Acid | green | Fatty Acid | Omega-3 ALA — anti-inflammatory fatty acid
Lipohydroxy Acid | yellow | Exfoliant | LHA — lipophilic salicylic acid derivative for gentle exfoliation
Lithothamnion Calcareum Extract | green | Skin Conditioner | Red algae calcium carbonate extract — alkalizing and mineralizing
Lysine HCl | green | Amino Acid | Salt form of lysine — NMF component
Macadamia Integrifolia Seed Oil | green | Emollient | Rich in palmitoleic acid — mimics skin's own oils
Macadamia Seed Oil | green | Emollient | Same as macadamia integrifolia — skin-identical fatty acids
Magnesium Aluminum Silicate | green | Thickener | Natural clay mineral for viscosity control
Magnesium PCA | green | Humectant | Magnesium salt of PCA — improves elasticity
Magnesium Stearate | green | Lubricant | Magnesium soap used in powders for anti-caking
Magnesium Sulfate | green | Skin Conditioner | Epsom salt — improves skin barrier
Maltodextrin | green | Film Former | Starch-derived polysaccharide for encapsulation
Manganese Gluconate | green | Skin Conditioner | Trace mineral supporting SOD enzyme activity
Mannitol | green | Humectant | Sugar alcohol humectant — NMF component
Marine Collagen | green | Skin Conditioner | Fish-derived collagen hydrolysate — smaller peptides for penetration
Marine Extract | green | Antioxidant | Broad marine-sourced active with minerals and antioxidants
Marine Plankton Extract | green | Antioxidant | Plankton-derived proteome and lipid complex
Maris Aqua | green | Solvent | Natural sea water used as a mineral-rich base
Meadowfoam Seed Oil | green | Emollient | Limnanthes alba — extremely stable, long-chain monounsaturated fatty acids
Melanin | yellow | Colorant | Natural pigment — colorant and potential UV absorber
Melia Azadirachta Leaf Extract | yellow | Botanical Extract | Neem leaf extract — antibacterial; may irritate
Menthoxypropanediol | yellow | Cooling Agent | Menthol derivative providing a long-lasting cooling sensation
Methicone | green | Silicone | Low-viscosity trimethyl silicone for dry skin feel
Methoxy PEG-22/Dodecyl Glycol Copolymer | green | Emulsifier | Polymeric emulsifier for elegant textures
Methyl Gluceth-20 | green | Humectant | PEG-20 methyl glucose ether — excellent humectant
Methyl Methacrylate Crosspolymer | green | Film Former | Soft-focus powder for pore blurring
Methyl Trimethicone | green | Silicone | Branched trimethyl silicone — lighter than dimethicone
Microcrystalline Cellulose | green | Thickener | Purified cellulose for suspension stabilization
Milk Protein | green | Protein | Casein and whey fractions — conditioning and moisturizing
Montmorillonite | green | Absorbent | Smectite clay — oil absorbing and purifying
Moringa Oleifera Seed Extract | green | Antioxidant | Miracle tree seed extract with oleic acid and isothiocyanates
Morus Alba Root Extract | green | Skin Brightener | Mulberry root extract — arbutin and oxyresveratrol for brightening
Myristic Acid | yellow | Emollient | C14 saturated fatty acid — thickener; comedogenic at high levels
Myristyl Alcohol | green | Emollient | C14 fatty alcohol — thickener and emollient
Myristyl Lactate | green | Emollient | Lactic acid ester — light moisturizer
Myristyl Myristate | yellow | Emollient | C14 ester — comedogenic potential
Nasturtium Officinale Extract | green | Antioxidant | Watercress extract — isothiocyanates and antioxidants
Neohesperidin | green | Antioxidant | Citrus flavanone — antioxidant and bioavailability enhancer
Neopentyl Glycol Diethylhexanoate | green | Emollient | Synthetic di-ester — lightweight, dry skin feel
Neopentyl Glycol Diheptanoate | green | Emollient | Branched synthetic ester for elegant sensory
Niacin | green | Vitamin | Nicotinic acid form of vitamin B3
Nylon-6 | green | Film Former | Synthetic polyamide microparticle for soft-focus
Nylon-12 | green | Film Former | Nylon powder for mattifying and sensory improvement
Oat Kernel Flour | green | Skin Protectant | FDA-approved colloidal oatmeal protectant
Oat Kernel Extract | green | Skin Soothing | Beta-glucan and avenanthramide-rich oat extract
Octisalate | yellow | UV Filter | Ethylhexyl salicylate — UVB filter
Octyldodecyl Myristate | green | Emollient | Elegant ester for premium skin feel
Octyldodecyl Stearoyl Stearate | green | Emollient | High-viscosity ester for luxurious textures
Oligopeptide | green | Peptide | Short-chain signal peptide for anti-aging
Onsen-Sui | green | Skin Conditioner | Japanese hot spring water — mineral-rich thermal water
Oryza Sativa Bran Oil | green | Emollient | Rice bran oil — high in oryzanol and vitamin E
Oryza Sativa Extract | green | Antioxidant | Rice extract with ferulic acid and ceramides
Oryza Sativa Germ Oil | green | Emollient | Rice germ oil — rich in tocotrienols and oryzanol
Palmitic Acid | yellow | Emollient | C16 saturated fatty acid — skin barrier component
Palmitoyl Hexapeptide-12 | green | Peptide | Anti-aging matrix peptide
Palmitoyl Tripeptide-5 | green | Peptide | Leuphasyl — reduces expression lines via enkephalin pathway
Papain | yellow | Enzyme | Papaya enzyme exfoliant — can irritate inflamed skin
Passiflora Edulis Seed Oil | green | Emollient | Passion fruit seed oil — high linoleic acid
PEG-6 | yellow | Humectant | Small PEG compound — humectant; purity concerns
PEG-7 Glyceryl Cocoate | yellow | Emulsifier | PEG-modified glyceryl cocoate — solubilizer
PEG-8 | yellow | Humectant | PEG humectant — may contain 1,4-dioxane impurities
PEG-12 Dimethicone | yellow | Silicone | PEG-silicone copolymer — conditioning in hair products
PEG-20 Methyl Glucose Sesquistearate | yellow | Emulsifier | PEG-modified glucose ester emulsifier
PEG-40 Castor Oil | yellow | Emulsifier | PEG-modified castor oil solubilizer
Pentaerythrityl Tetra-di-t-butyl Hydroxyhydrocinnamate | green | Antioxidant | Hindered phenol antioxidant for formula stabilization
Pentapeptide | green | Peptide | 5-amino acid signal peptide
Peptide Complex | green | Peptide | Multi-peptide blend for anti-aging
Perlite | green | Absorbent | Volcanic mineral powder for oil absorption
Phenethyl Alcohol | yellow | Preservative | Floral alcohol — preservative with mild sensitization potential
Phospholipids | green | Emollient | Skin-identical membrane lipids — barrier repairing
Phosphoric Acid | yellow | pH Adjuster | Strong acid for pH adjustment — handle carefully in formulation
Phosphorylcholine | green | Humectant | Phospholipid-derived humectant found in cell membranes
Phosphorylated Vitamin C | green | Antioxidant | Sodium/magnesium ascorbyl phosphate — stable Vitamin C
Phytosphingosine | green | Skin Conditioner | Sphingoid base — antimicrobial and skin barrier support
Piroctone Olamine | yellow | Antifungal | Antidandruff agent — effective against Malassezia
Plankton Extract | green | Antioxidant | Marine microorganism extract with UV-protective pigments
Polyacrylamide | yellow | Thickener | Synthetic polymer — concerns about acrylamide monomer residue
Polybutene | green | Film Former | Synthetic hydrocarbon polymer for lip gloss
Polyglyceryl-2 Dipolyhydroxystearate | green | Emulsifier | Polyglycerol ester for water-in-oil emulsions
Polyglyceryl-3 Beeswax | green | Emollient | Polyglyceryl-modified beeswax for structured emollients
Polyglyceryl-3 Diisostearate | green | Emulsifier | PEG-free W/O emulsifier
Polyglyceryl-4 Caprate | green | Emulsifier | Gentle, biodegradable O/W emulsifier
Polyglyceryl-6 Behenate | green | Emulsifier | Polyglycerol behenate ester for structured emulsions
Polyglyceryl-6 Distearate | green | Emulsifier | PEG-free emulsifier with excellent skin feel
Polyglyceryl-6 Stearate | green | Emulsifier | Polyglycerol stearate — gentle emulsifier
Polyhydroxystearic Acid | green | Emulsifier | Key W/O emulsifier for sunscreens
Polyisobutene | green | Film Former | Synthetic polymer binder for waterproofing
Polymethyl Methacrylate | green | Film Former | PMMA microspheres for soft-focus blurring
Polysilicone-11 | green | Film Former | Silicone resin polymer for long-wear makeup
Polysorbate 60 | yellow | Emulsifier | PEG-60 sorbitan monostearate — O/W emulsifier
Polyurethane-35 | green | Film Former | Polyurethane polymer for skin feel and film formation
Pomegranate Extract | green | Antioxidant | Rich in punicalagins and ellagic acid
Potassium Stearate | green | Emulsifier | Potassium soap used as emulsifier
Propylia Gallate | yellow | Antioxidant | Ester antioxidant preservative — potential allergen
Propylheptyl Caprylate | green | Emollient | Branched ester — lightweight and non-greasy
Propolis Extract | yellow | Antioxidant | Bee propolis — antimicrobial; strong sensitizer potential
Pro-Retinol | green | Anti-aging | Retinol precursor or synonym used in marketing
Provitamin B5 | green | Humectant | Synonym for Panthenol/Dexpanthenol
Prunus Amygdalus Dulcis Oil | green | Emollient | Sweet almond oil — lightweight, oleic-acid rich
Prunus Armeniaca Kernel Oil | green | Emollient | Apricot kernel oil — similar to sweet almond
Prunus Persica Fruit Extract | green | Antioxidant | Peach fruit extract — vitamins and antioxidants
Pumpkin Seed Oil | green | Emollient | Rich in zinc and essential fatty acids
PVP | green | Film Former | Polyvinylpyrrolidone — hair and skin film former
PVM/MA Copolymer | green | Film Former | Poly(methyl vinyl ether/maleic acid) — film forming polymer
Pyrus Malus Fruit Extract | green | Antioxidant | Apple fruit extract — malic acid and quercetin
Q10 | green | Antioxidant | Ubiquinone — coenzyme Q10, potent antioxidant
Quaternium-15 | red | Preservative | Formaldehyde releaser — significant sensitizer
Quaternium-18 Hectorite | green | Thickener | Organophilic clay for anhydrous systems
Quaternium-22 | yellow | Conditioning Agent | Cationic conditioning agent for hair
Quaternium-80 | green | Conditioning Agent | Silicone quaternary compound for hair conditioning
Quillaja Saponaria Bark Extract | yellow | Surfactant | Soapbark extract — natural saponin surfactant; irritant at high concentrations
Raspberry Seed Oil | green | Emollient | High omega-3 and ellagic acid — antioxidant-rich
Retinal | yellow | Anti-aging | Retinaldehyde — 11x more potent than retinol
Retinaldehyde | yellow | Anti-aging | Same as retinal — direct vitamin A aldehyde
Retinyl Acetate | yellow | Anti-aging | Stable retinol ester — gentler conversion to retinoic acid
Retinyl Linoleate | yellow | Anti-aging | Retinol ester with linoleic acid — gentle retinoid
Rhamnose | green | Skin Conditioner | Plant sugar stimulating collagen synthesis
Rhus Succedanea Fruit Wax | green | Emollient | Japan wax — natural plant wax alternative to beeswax
Rice Ferment Filtrate | green | Skin Conditioner | Sake ferment filtrate — brightening and conditioning
Rosa Centifolia Flower Water | yellow | Skin Conditioner | Rose water — soothing; fragrance allergen potential
Rosa Damascena Flower Oil | yellow | Fragrance | Rose essential oil — fragrance allergen potential
Rosemary Leaf Extract | yellow | Antioxidant | Rosmarinus officinalis — antioxidant; potential sensitizer
Royal Jelly Extract | yellow | Skin Conditioner | Bee product — sensitization potential
Rubus Idaeus Fruit Extract | green | Antioxidant | Raspberry fruit extract — ellagitannins and anthocyanins
Saccharide Isomerate | green | Humectant | Biomimetic humectant from corn — matches skin NMF
Saccharomyces Ferment | green | Skin Conditioner | Yeast ferment — vitamins, amino acids, beta-glucan
Saccharomyces Lysate | green | Anti-aging | Cell lysate from yeast — energizes skin cell metabolism
Salix Alba Bark Extract | yellow | Exfoliant | White willow bark — natural source of salicylic acid
Sandalwood Extract | yellow | Skin Conditioner | Santalum album — skin conditioning; potential allergen
Sea Fennel Extract | green | Antioxidant | Crithmum maritimum — brightening and antioxidant flavonoids
Sea Water | green | Skin Conditioner | Natural ocean water with minerals and trace elements
Sesame Seed Oil | yellow | Emollient | Rich in sesamol and sesamin; potential allergen
Shorea Robusta Resin | green | Emollient | Sal butter — similar texture to shea, rich in stearic acid
Silica Dimethyl Silylate | green | Absorbent | Hydrophobically-modified silica — oil absorber
Silk Amino Acids | green | Skin Conditioner | Sericin-derived amino acids for soft skin feel
Sodium Acetate | green | pH Adjuster | Sodium salt of acetic acid — pH buffer
Sodium Acrylate Copolymer | green | Thickener | Acrylate copolymer for viscosity control
Sodium Acrylates Copolymer | green | Thickener | Crosslinked acrylate for stable gels
Sodium Acrylates/C10-30 Alkyl Acrylate Crosspolymer | green | Thickener | Advanced carbopol-type with improved electrolyte tolerance
Sodium Carbomer | green | Thickener | Pre-neutralized carbomer for easy formulation
Sodium Carrageenan | green | Thickener | Sodium salt of carrageenan seaweed
Sodium Citrate | green | pH Adjuster | Citrate buffer salt — chelating and pH adjusting
Sodium Cocoamphoacetate | green | Surfactant | Very mild amphoteric surfactant from coconut
Sodium Cocoyl Glycinate | green | Surfactant | Amino acid surfactant — extremely gentle, skin-identical
Sodium DNA | green | Skin Conditioner | Sodium salt of DNA — hydrating and film-forming
Sodium Dehydroacetate | yellow | Preservative | Sodium salt of dehydroacetic acid — mild preservative
Sodium Lauroyl Glutamate | green | Surfactant | Amino acid-derived gentle surfactant
Sodium Lauroyl Sarcosinate | yellow | Surfactant | Amino acid surfactant — potential irritant at high concentration
Sodium Metabisulfite | yellow | Antioxidant Preservative | Sulfite reducing agent — potential allergen in sensitive individuals
Sodium Methyl Cocoyl Taurate | green | Surfactant | Mild, biodegradable amino acid surfactant
Sodium Phytate | green | Chelating Agent | Phytic acid sodium salt — antioxidant chelator
Sodium Salicylate | yellow | Exfoliant | Sodium salt of salicylic acid — mild BHA
Sodium Stearoyl Glutamate | green | Emulsifier | Amino acid-derived emulsifier and skin conditioner
Sorbitan Isostearate | green | Emulsifier | W/O emulsifier — sorbitan isostearate ester
Sorbitan Sesquioleate | green | Emulsifier | W/O emulsifier for creams and ointments
Sorbitan Stearate | green | Emulsifier | Lipophilic emulsifier for W/O systems
Soy Isoflavones | green | Antioxidant | Phytoestrogen compounds — skin-firming and antioxidant
Soy Protein | yellow | Protein | Soy-derived protein — potential allergen
Soybean Extract | yellow | Antioxidant | Soybean isoflavones — potential allergen
Soybean Oil | yellow | Emollient | High linoleic acid — potential allergen for soy-sensitive
Steareth-2 | yellow | Emulsifier | PEG-2 stearyl ether — W/O emulsifier
Steareth-20 | yellow | Emulsifier | PEG-20 stearyl ether — O/W emulsifier
Stearyl Glycyrrhetinate | green | Skin Conditioner | Ester of glycyrrhetinic acid — soothing anti-inflammatory
Sucrose Cocoate | green | Emollient | Sugar ester from sucrose and coconut — excellent skin feel
Sucrose Distearate | green | Emulsifier | Sugar ester emulsifier — gentle and biodegradable
Synthetic Beeswax | green | Emollient | Petroleum-free synthetic alternative to beeswax
Synthetic Fluorphlogopite | green | Colorant | Synthetic mica for pearlescent effect
Synthetic Wax | green | Emollient | Fischer-Tropsch wax — stable synthetic wax
Talc | yellow | Absorbent | Natural magnesium silicate powder — concerns about asbestos contamination in industrial grade
Tapioca Starch | green | Absorbent | Cassava starch for mattifying and absorbing
Tetrapeptide | green | Peptide | Four amino acid signal peptide
Tetrapeptide-21 | green | Peptide | Stimulates VEGF and IGF-1 for skin regeneration
Threonine | green | Amino Acid | Essential amino acid — NMF component
Tocopheryl Glucoside | green | Antioxidant | Water-soluble vitamin E derivative
Tomato Fruit Extract | green | Antioxidant | Lycopene-rich antioxidant extract
Trehalose | green | Humectant | Disaccharide from fungi — extreme droughtproofing humectant
Triethyl Citrate | green | Solvent | Citrate ester — biodegradable solvent and fragrance fixative
Triethoxycaprylylsilane | green | Coupling Agent | Silane coupling agent for pigment surface treatment
Triheptanoin | green | Emollient | Synthetic triglyceride — ultra-lightweight sebum-mimicking emollient
Triisostearin | green | Emollient | Trifunctional isostearate — rich emollient
Trisodium EDTA | green | Chelating Agent | Trisodium ethylenediamine tetraacetate — chelating agent
Trisodium Ethylenediamine Disuccinate | green | Chelating Agent | Biodegradable alternative to EDTA
Tromethamine | green | pH Adjuster | Tris(hydroxymethyl)aminomethane — pH buffer
Truffle Extract | green | Antioxidant | Black/white truffle polysaccharide complex — antioxidant and brightening
Turmeric Root Extract | yellow | Antioxidant | Curcuma longa — anti-inflammatory curcumin; may stain skin yellow
Ubiquinone | green | Antioxidant | Coenzyme Q10 — cellular energy antioxidant
Undecane | green | Emollient | C11 isoparaffin — extremely lightweight dry-feel hydrocarbon
Undecylenoyl Glycine | green | Preservative Booster | Fatty acid amino acid conjugate with antimicrobial activity
Vaccinium Angustifolium Fruit Extract | green | Antioxidant | Lowbush blueberry — anthocyanin antioxidant
Vaccinium Macrocarpon Fruit Extract | green | Antioxidant | Cranberry extract — proanthocyanidins and vitamin C
VaLine | green | Amino Acid | Essential amino acid — NMF component
Vanilla Fruit Extract | yellow | Antioxidant | Vanilla planifolia — antioxidant vanillin; potential allergen
Vinyl Dimethicone | green | Silicone | Reactive silicone for elastomer crosslinking
Viola Tricolor Extract | green | Botanical Extract | Wild pansy — rutin and salicylic acid derivatives
Vitamin A | yellow | Anti-aging | Retinol/retinyl compound — teratogen risk in high doses
Vitamin B3 | green | Skin Conditioner | Niacinamide/niacin — brightening and barrier support
Vitamin B5 | green | Humectant | Panthenol/dexpanthenol — moisturizing
Vitamin C | green | Antioxidant | Ascorbic acid or stable derivative — brightening and antioxidant
Vitamin E | green | Antioxidant | Tocopherol/tocopheryl acetate — lipid antioxidant
VP/Eicosene Copolymer | green | Film Former | Hair and skin film former
VP/Hexadecene Copolymer | green | Film Former | Waterproofing film former for cosmetics
Watermelon Fruit Extract | green | Antioxidant | Lycopene and citrulline-rich — antioxidant and hydrating
Wheat Amino Acids | yellow | Protein | Wheat hydrolysate — potential gluten sensitization
Wheat Germ Oil | yellow | Emollient | Rich in vitamin E; potential wheat allergy
Wheat Hazel Extract | yellow | Astringent | Witch hazel — tannins and flavonoids; astringent
Xylitylglucoside | green | Humectant | Xylitol-glucose disaccharide — moisturizing prebiotic
Yeast Extract | green | Skin Conditioner | Saccharomyces extract — vitamins, beta-glucan, amino acids
Yeast Ferment | green | Skin Conditioner | Fermented yeast with skin-energizing compounds
Zea Mays Oil | green | Emollient | Corn oil — linoleic acid-rich emollient
Zinc Gluconate | green | Skin Conditioner | Bioavailable zinc for sebum regulation and wound healing
Zinc Sulfate | yellow | Skin Conditioner | Zinc astringent — potential irritant at high concentrations
"""

def main():
    parsed_ingredients = {}
    
    # Parse RAW_DATA
    for line in RAW_DATA.strip().split('\n'):
        if not line.strip(): continue
        parts = [p.strip() for p in line.split('|')]
        if len(parts) >= 4:
            name, risk, category, purpose = parts[:4]
            name = name.replace("Hydrogena ted", "Hydrogenated") # fix typo in raw
            item_id = to_kebab_case(name)
            
            concerns = []
            if "allergen" in purpose.lower() or "sensitiz" in purpose.lower() or "irritant" in purpose.lower():
                concerns.append("potential allergen")
            if "comedogenic" in purpose.lower():
                concerns.append("comedogenic")
                
            kids_unsafe = False
            if risk == "red" or "salicylic" in purpose.lower():
                kids_unsafe = True
                
            preg_warning = False
            if "retinol" in purpose.lower() or "retin" in name.lower() or "vitamin a" in name.lower():
                preg_warning = True
                
            desc_en = create_en_desc(name, purpose)
            desc_th = create_thai_desc(name, purpose)
            
            ingredient = {
                "id": item_id,
                "names": [name],
                "risk": risk,
                "category": category,
                "purpose": purpose,
                "concerns": concerns,
                "kidsUnsafe": kids_unsafe,
                "pregnancyWarning": preg_warning,
                "description_en": desc_en,
                "description_th": desc_th
            }
            
            file_key = get_file_for_name(name)
            if file_key not in parsed_ingredients:
                parsed_ingredients[file_key] = []
            parsed_ingredients[file_key].append(ingredient)

    total_added = 0
    file_counts = {}

    for file_key, filename in files_map.items():
        filepath = os.path.join(DATA_DIR, filename)
        if not os.path.exists(filepath):
            existing_data = []
        else:
            with open(filepath, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
                
        existing_ids = {item['id'] for item in existing_data}
        added_in_file = 0
        
        if filename in parsed_ingredients:
            for new_item in parsed_ingredients[filename]:
                if new_item['id'] not in existing_ids:
                    existing_data.append(new_item)
                    added_in_file += 1
                    
        # Save back
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=2)
            
        file_counts[filename] = added_in_file
        total_added += added_in_file
        
    print(f"Summary:")
    for filename, count in file_counts.items():
        print(f"  {filename}: added {count} ingredients")
    print(f"Total new ingredients added: {total_added}")

if __name__ == "__main__":
    main()
