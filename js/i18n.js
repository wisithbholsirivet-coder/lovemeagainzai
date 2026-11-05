/* ════════════════════════════════════════════════════
   ChaeCheck · js/i18n.js
   Thai / English Localization Engine
   ════════════════════════════════════════════════════ */

const I18n = (() => {
  const STORAGE_KEY = 'chaecheck_lang';
  const DEFAULT_LANG = 'en';

  // ── Locale strings ──────────────────────────────
  const locales = {
    en: {
      'brand.tagline':                 'Ingredient Safety',
      'nav.search':                    'Search',
      'nav.history':                   'History',
      'nav.settings':                  'Settings',
      'sidebar.guest':                 'Guest',
      'scanner.badge':                 '✨ AI-Powered Safety Check',
      'scanner.title':                 'What\'s Really in the Bottle?',
      'scanner.hero.title':            'Decode Your Products',
      'scanner.hero.desc':             'Snap a photo of any label and we\'ll instantly decode the chemistry into plain, friendly English. Upload a product label photo or paste ingredient text to check safety.',
      'tip.curved.title':              'Tips for curved packaging',
      'warning.kids':                  'Not safe for children',
      'warning.pregnancy':             'Caution during pregnancy',
      'scanner.upload.title':          'Upload Label Photo',
      'scanner.upload.hint':           'Drag & drop or click to browse',
      'scanner.ocr.processing':        'Extracting text from image...',
      'scanner.ocr.recognizing':       'Recognizing text...',
      'scanner.ocr.done':              'Text extraction complete!',
      'scanner.or':                    'OR',
      'scanner.manual.label':          'Paste Ingredient List',
      'scanner.manual.hint':           'Paste the full ingredient list, separated by commas',
      'scanner.btn.scan':              'Analyze Ingredients',
      'scanner.analyzing':             'Analyzing ingredients...',
      'scanner.results.title':         'Analysis Results',
      'scanner.results.save':          'Save',
      'scanner.results.addRoutine':    'Add to Routine',
      'scanner.kid.warning':           '⚠️ Some ingredients may not be safe for children under 13. Consult a dermatologist.',
      'scanner.pregnancy.warning':     '🤰 Some ingredients may not be recommended during pregnancy. Consult your doctor.',
      'filter.all':                    'All',
      'filter.dangerous':              'Danger',
      'filter.moderate':               'Moderate',
      'filter.safe':                   'Safe',
      'filter.unknown':                'Unknown',
      'history.title':                 'Scan History',
      'history.clear':                 'Clear All',
      'history.empty':                 'No scans yet. Start by analyzing a product!',
      'history.confirm.clear':         'Clear all scan history?',
      'settings.title':                'Settings',
      'settings.profile.title':        'Profile',
      'settings.profile.name':         'Your Name',
      'settings.profile.name.placeholder': 'Enter your name',
      'settings.profile.age':          'Age',
      'settings.profile.age.hint':     'Used to flag ingredients unsafe for children under 13',
      'settings.profile.save':         'Save Profile',
      'settings.profile.saved':        'Profile saved!',
      'settings.language.title':       'Language',
      'settings.theme.title':          'Appearance',
      'settings.theme.darkMode':       'Dark Mode',
      'settings.routine.title':        'Daily Routine',
      'settings.routine.placeholder':  'e.g. CeraVe Moisturizer',
      'settings.routine.add':          'Add',
      'settings.routine.empty':        'No products in your routine yet',
      'settings.about.title':          'About',
      'settings.about.text':           'ChaeCheck uses a local database of cosmetic INCI ingredients to assess safety. For medical advice, always consult a qualified dermatologist.',
      'modal.purpose':                 'Purpose',
      'modal.description':             'What is it?',
      'modal.concerns':                'Safety Concerns',
      'modal.kids.unsafe':             '⚠️ Not recommended for children',
      'modal.pregnancy.warning':       '🤰 Use caution during pregnancy',
      'toast.saved':                   'Scan saved to history',
      'toast.routine.added':           'Added to daily routine',
      'toast.profile.saved':           'Profile saved!',
      'toast.history.cleared':         'History cleared',
      'toast.no.results':              'No ingredients to save',
      'db.loading':                    'Loading ingredient database...',
      'db.ready':                      'Database ready',
      'db.error':                      'Failed to load database',
      'risk.label.green':              'Safe',
      'risk.label.yellow':             'Moderate',
      'risk.label.red':                'Danger',
      'risk.label.unknown':            'Unknown',
      'error.notfound':                'The search is failed or we don\'t have database. Please try again',
      'card.learn.more':               'Details →',
      'confirm.clear.history':         'Are you sure you want to clear all history?',
      // Allergy
      'allergy.title':                 'Select your allergens',
      'allergy.hint':                  'Matching ingredients will be flagged in results',
      'allergy.fragrance':             'Fragrance',
      'allergy.essential_oil':         'Essential Oils',
      'allergy.paraben':               'Parabens',
      'allergy.sulfate':               'Sulfates',
      'allergy.alcohol':               'Alcohol (Drying)',
      'allergy.preservative':          'Preservatives',
      'warning.allergen':              'Your allergen',
      // Upload mini
      'scanner.upload.uploaded':       'Image uploaded',
      'scanner.upload.change':         'Change',
      'scanner.ocr.review':            'Text extracted! Review and click Analyze.',
      // Ollama OCR
      'ocr.ollama.connecting':         'Connecting to local AI model...',
      'ocr.ollama.sending':            'Sending to AI model...',
      'ocr.ollama.analyzing':          'AI model analyzing label...',
      'ocr.ollama.unreachable':        'Local OCR server is currently unreachable. Please paste ingredients manually.',
      'ocr.ollama.fallback':           'Local AI unavailable, using backup OCR...',
    },
    th: {
      'brand.tagline':                 'ความปลอดภัยของส่วนผสม',
      'nav.search':                    'ค้นหา',
      'nav.history':                   'ประวัติ',
      'nav.settings':                  'ตั้งค่า',
      'sidebar.guest':                 'ผู้เยี่ยมชม',
      'scanner.badge':                 '✨ ตรวจสอบความปลอดภัยด้วย AI',
      'scanner.title':                 'เช็กให้ชัวร์ มันมีอะไรอยู่!',
      'scanner.hero.title':            'เช็กให้ชัวร์ มันมีอะไรอยู่!',
      'scanner.hero.desc':             'อะไรอยู่ข้างในขวดนี้บ้าง มาดูกันเถอะ! อัปโหลดรูปภาพฉลากผลิตภัณฑ์หรือวางข้อความส่วนผสมเพื่อตรวจสอบความปลอดภัย',
      'tip.curved.title':              'เคล็ดลับสำหรับบรรจุภัณฑ์โค้ง',
      'warning.kids':                  'ไม่เหมาะสำหรับเด็ก',
      'warning.pregnancy':             'ระวังในระหว่างตั้งครรภ์',
      'scanner.upload.title':          'อัปโหลดรูปฉลาก',
      'scanner.upload.hint':           'ลากวาง หรือคลิกเพื่อเลือกไฟล์',
      'scanner.ocr.processing':        'กำลังดึงข้อความจากรูปภาพ...',
      'scanner.ocr.recognizing':       'กำลังอ่านข้อความ...',
      'scanner.ocr.done':              'ดึงข้อความเสร็จแล้ว!',
      'scanner.or':                    'หรือ',
      'scanner.manual.label':          'วางรายการส่วนผสม',
      'scanner.manual.hint':           'วางรายการส่วนผสมจากฉลากสินค้า คั่นด้วยเครื่องหมายจุลภาค',
      'scanner.btn.scan':              'วิเคราะห์ส่วนผสม',
      'scanner.analyzing':             'กำลังวิเคราะห์ส่วนผสม...',
      'scanner.results.title':         'ผลการวิเคราะห์',
      'scanner.results.save':          'บันทึก',
      'scanner.results.addRoutine':    'เพิ่มในรูทีน',
      'scanner.kid.warning':           '⚠️ ส่วนผสมบางอย่างอาจไม่ปลอดภัยสำหรับเด็กอายุต่ำกว่า 13 ปี กรุณาปรึกษาแพทย์',
      'scanner.pregnancy.warning':     '🤰 ส่วนผสมบางอย่างอาจไม่แนะนำในระหว่างตั้งครรภ์ กรุณาปรึกษาแพทย์',
      'filter.all':                    'ทั้งหมด',
      'filter.dangerous':              'อันตราย',
      'filter.moderate':               'ระวัง',
      'filter.safe':                   'ปลอดภัย',
      'filter.unknown':                'ไม่ทราบ',
      'history.title':                 'ประวัติการสแกน',
      'history.clear':                 'ล้างทั้งหมด',
      'history.empty':                 'ยังไม่มีการสแกน เริ่มต้นโดยวิเคราะห์ผลิตภัณฑ์!',
      'history.confirm.clear':         'ล้างประวัติการสแกนทั้งหมดใช่ไหม?',
      'settings.title':                'ตั้งค่า',
      'settings.profile.title':        'โปรไฟล์',
      'settings.profile.name':         'ชื่อของคุณ',
      'settings.profile.name.placeholder': 'กรอกชื่อของคุณ',
      'settings.profile.age':          'อายุ',
      'settings.profile.age.hint':     'ใช้สำหรับแจ้งเตือนส่วนผสมที่ไม่ปลอดภัยสำหรับเด็กอายุต่ำกว่า 13 ปี',
      'settings.profile.save':         'บันทึกโปรไฟล์',
      'settings.profile.saved':        'บันทึกโปรไฟล์แล้ว!',
      'settings.language.title':       'ภาษา',
      'settings.theme.title':          'รูปลักษณ์',
      'settings.theme.darkMode':       'โหมดมืด',
      'settings.routine.title':        'รูทีนประจำวัน',
      'settings.routine.placeholder':  'เช่น CeraVe Moisturizer',
      'settings.routine.add':          'เพิ่ม',
      'settings.routine.empty':        'ยังไม่มีสินค้าในรูทีนของคุณ',
      'settings.about.title':          'เกี่ยวกับ',
      'settings.about.text':           'ChaeCheck ใช้ฐานข้อมูลส่วนผสมเครื่องสำอาง INCI แบบออฟไลน์ เพื่อประเมินความปลอดภัย สำหรับคำแนะนำทางการแพทย์ กรุณาปรึกษาแพทย์ผิวหนัง',
      'modal.purpose':                 'วัตถุประสงค์',
      'modal.description':             'คืออะไร?',
      'modal.concerns':                'ข้อกังวลด้านความปลอดภัย',
      'modal.kids.unsafe':             '⚠️ ไม่แนะนำสำหรับเด็ก',
      'modal.pregnancy.warning':       '🤰 ควรระวังในระหว่างตั้งครรภ์',
      'toast.saved':                   'บันทึกการสแกนแล้ว',
      'toast.routine.added':           'เพิ่มในรูทีนประจำวันแล้ว',
      'toast.profile.saved':           'บันทึกโปรไฟล์แล้ว!',
      'toast.history.cleared':         'ล้างประวัติแล้ว',
      'toast.no.results':              'ไม่มีผลการวิเคราะห์ที่จะบันทึก',
      'db.loading':                    'กำลังโหลดฐานข้อมูลส่วนผสม...',
      'db.ready':                      'ฐานข้อมูลพร้อมใช้งาน',
      'db.error':                      'โหลดฐานข้อมูลไม่สำเร็จ',
      'risk.label.green':              'ปลอดภัย',
      'risk.label.yellow':             'ระวัง',
      'risk.label.red':                'อันตราย',
      'risk.label.unknown':            'ไม่ทราบ',
      'error.notfound':                'การค้นหาล้มเหลว หรือไม่มีข้อมูลในฐานข้อมูล กรุณาลองใหม่อีกครั้ง',
      'card.learn.more':               'รายละเอียด →',
      'confirm.clear.history':         'ต้องการล้างประวัติทั้งหมดหรือไม่?',
      // Allergy
      'allergy.title':                 'เลือกสารที่คุณแพ้',
      'allergy.hint':                  'ส่วนผสมที่ตรงกันจะถูกทำเครื่องหมายในผลลัพธ์',
      'allergy.fragrance':             'น้ำหอม',
      'allergy.essential_oil':         'น้ำมันหอมระเหย',
      'allergy.paraben':               'พาราเบน',
      'allergy.sulfate':               'ซัลเฟต',
      'allergy.alcohol':               'แอลกอฮอล์ (ทำให้แห้ง)',
      'allergy.preservative':          'สารกันเสีย',
      'warning.allergen':              'สารก่อภูมิแพ้ของคุณ',
      // Upload mini
      'scanner.upload.uploaded':       'อัปโหลดรูปแล้ว',
      'scanner.upload.change':         'เปลี่ยนรูป',
      'scanner.ocr.review':            'ดึงข้อความแล้ว! ตรวจสอบแล้วกด วิเคราะห์',
      // Ollama OCR
      'ocr.ollama.connecting':         'กำลังเชื่อมต่อ AI ในเครื่อง...',
      'ocr.ollama.sending':            'กำลังส่งรูปให้ AI...',
      'ocr.ollama.analyzing':          'AI กำลังวิเคราะห์ฉลาก...',
      'ocr.ollama.unreachable':        'เซิร์ฟเวอร์ OCR ในเครื่องไม่ตอบสนอง กรุณาวางข้อความส่วนผสมเอง',
      'ocr.ollama.fallback':           'AI ในเครื่องใช้ไม่ได้ ใช้ OCR สำรองแทน...',
    }
  };

  let _lang = DEFAULT_LANG;

  function t(key, fallback) {
    return locales[_lang]?.[key] ?? locales['en']?.[key] ?? fallback ?? key;
  }

  function _updateDOM() {
    // Update all data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translated = t(key);
      if (translated !== key) el.textContent = translated;
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const translated = t(key);
      if (translated !== key) el.placeholder = translated;
    });

    // Update lang button states
    document.querySelectorAll('.lang-btn').forEach(btn => {
      const active = btn.dataset.lang === _lang;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    // Update <html> lang attribute
    document.documentElement.lang = _lang === 'th' ? 'th' : 'en';
  }

  function init() {
    let saved;
    try { saved = localStorage.getItem('chaecheck_lang'); } catch (_) {}
    _lang = saved || DEFAULT_LANG;
    _updateDOM();

    // Language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });
  }

  function setLang(lang) {
    if (!locales[lang]) return;
    _lang = lang;
    try { localStorage.setItem('chaecheck_lang', lang); } catch (_) {}
    _updateDOM();
    // Notify app to re-render dynamic content
    document.dispatchEvent(new CustomEvent('chaecheck:langchange', { detail: { lang } }));
  }

  function getLang() { return _lang; }

  // Re-apply translations to dynamically added elements
  function applyTo(element) {
    if (!element) return;
    element.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translated = t(key);
      if (translated !== key) el.textContent = translated;
    });
  }

  return { init, t, setLang, getLang, applyTo };
})();

