// ChaeCheck – Thai Locale Strings (ภาษาไทย)
window.ChaeCheck = window.ChaeCheck || {};
window.ChaeCheck.locales = window.ChaeCheck.locales || {};
window.ChaeCheck.locales.th = {
  // Navigation
  nav_search: 'ค้นหา',
  nav_history: 'ประวัติ',
  nav_settings: 'ตั้งค่า',

  // Search View
  search_title: 'ตรวจสอบส่วนผสม',
  search_subtitle: 'อัปโหลดรูปฉลากหรือพิมพ์ส่วนผสมเพื่อตรวจสอบความปลอดภัย',
  upload_text: 'ลากรูปมาวาง หรือคลิกเพื่ออัปโหลด',
  upload_subtext: 'รองรับ JPG, PNG, WEBP',
  upload_btn: 'อัปโหลดรูปภาพ',
  ocr_processing: 'กำลังอ่านข้อความจากรูป...',
  ocr_done: 'อ่านข้อความสำเร็จ! ตรวจสอบด้านล่าง',
  or: 'หรือ',
  manual_label: 'พิมพ์ส่วนผสมด้วยตนเอง',
  manual_placeholder: 'เช่น Aqua, Glycerin, Niacinamide, Parfum...',
  analyze_btn: 'วิเคราะห์ส่วนผสม',
  analyzing: 'กำลังวิเคราะห์...',

  // Results
  results_title: 'ผลการตรวจสอบ',
  results_safe: 'ปลอดภัย',
  results_moderate: 'ควรระวัง',
  results_danger: 'อันตราย',
  results_unknown: 'ไม่พบข้อมูล',
  results_count_safe: '{{n}} ปลอดภัย',
  results_count_moderate: '{{n}} ควรระวัง',
  results_count_danger: '{{n}} อันตราย',
  results_count_unknown: '{{n}} ไม่พบ',
  expand_detail: 'รายละเอียด',
  age_warning: '⚠️ ไม่แนะนำสำหรับเด็กอายุต่ำกว่า 12 ปี',
  elderly_warning: '⚠️ ควรระวังสำหรับผู้สูงอายุเกิน 60 ปี',
  save_scan: 'บันทึกลงประวัติ',
  scan_saved: 'บันทึกแล้ว!',

  // Fallback error — exact message per spec (ภาษาไทย)
  error_not_found: 'การค้นหาล้มเหลวหรือเราไม่มีฐานข้อมูล กรุณาลองใหม่อีกครั้ง',

  // History View
  history_title: 'ประวัติการค้นหา',
  clear_history: 'ล้างทั้งหมด',
  history_empty: 'ยังไม่มีประวัติการค้นหา',
  history_item_label: 'การสแกน',
  history_delete: 'ลบ',
  history_cleared: 'ล้างประวัติแล้ว',

  // Settings View
  settings_title: 'ตั้งค่า',

  // Profile
  profile_title: 'โปรไฟล์',
  profile_name: 'ชื่อของคุณ',
  profile_name_placeholder: 'ใส่ชื่อ...',
  profile_age: 'อายุ',
  age_hint: 'ใช้สำหรับแจ้งเตือนความปลอดภัยตามช่วงอายุ (เช่น เด็กอายุต่ำกว่า 12 ปี)',
  save_profile: 'บันทึกโปรไฟล์',
  profile_saved: 'บันทึกโปรไฟล์แล้ว!',

  // Appearance
  appearance_title: 'การแสดงผล',
  theme_label: 'ธีม',
  theme_sublabel: 'สลับระหว่างโหมดมืดและโหมดสว่าง',
  theme_dark: 'มืด',
  theme_light: 'สว่าง',
  lang_label: 'ภาษา',
  lang_sublabel: 'เลือกภาษาที่ต้องการใช้',

  // Daily Routine
  routine_title: 'กิจวัตรประจำวัน',
  routine_subtitle: 'บันทึกผลิตภัณฑ์เครื่องสำอางที่ใช้ประจำ',
  routine_placeholder: 'ชื่อผลิตภัณฑ์...',
  routine_add: 'เพิ่ม',
  routine_empty: 'ยังไม่มีผลิตภัณฑ์ในกิจวัตร',
  routine_added: 'เพิ่มลงกิจวัตรแล้ว!',
  routine_removed: 'ลบออกจากกิจวัตรแล้ว',

  // Toast
  toast_error: 'เกิดข้อผิดพลาด กรุณาลองใหม่',
  toast_ocr_fail: 'ไม่สามารถอ่านข้อความจากรูปได้ กรุณาพิมพ์ส่วนผสมด้วยตนเอง',

  // Risk levels
  risk_safe: 'ปลอดภัย',
  risk_moderate: 'ควรระวัง',
  risk_danger: 'อันตราย',
  risk_unknown: 'ไม่พบในฐานข้อมูล',

  // Misc
  app_name: 'แชเช็ค',
  tagline: 'รู้จักส่วนผสมในเครื่องสำอางของคุณ',
  no_ingredients: 'กรุณาใส่ส่วนผสมอย่างน้อยหนึ่งรายการ',

  // Routine Times
  time_morning: 'เช้า',
  time_noon: 'กลางวัน',
  time_evening: 'เย็น',
  time_night: 'ก่อนนอน',

  // Informational Context
  purpose_label: 'สรรพคุณ/หน้าที่:',
  allergy_label: 'คำเตือนการแพ้:',
  allergy_global_warning: '⚠️ หากเกิดอาการแพ้ (รอยแดง บวม หรือคัน) ให้ล้างด้วยน้ำสะอาดและหยุดใช้ทันที ปรึกษาแพทย์หากอาการไม่ดีขึ้น',
};
