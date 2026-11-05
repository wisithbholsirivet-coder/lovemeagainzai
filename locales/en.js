// ChaeCheck – English Locale Strings
window.ChaeCheck = window.ChaeCheck || {};
window.ChaeCheck.locales = window.ChaeCheck.locales || {};
window.ChaeCheck.locales.en = {
  // Navigation
  nav_search: 'Search',
  nav_history: 'History',
  nav_settings: 'Settings',

  // Search View
  search_title: 'Ingredient Checker',
  search_subtitle: 'Upload a label photo or type ingredients to check safety',
  upload_text: 'Drag & drop or click to upload',
  upload_subtext: 'Supports JPG, PNG, WEBP',
  upload_btn: 'Upload Image',
  ocr_processing: 'Reading text from image...',
  ocr_done: 'Text extracted! Review below.',
  or: 'or',
  manual_label: 'Type ingredients manually',
  manual_placeholder: 'e.g. Aqua, Glycerin, Niacinamide, Parfum...',
  analyze_btn: 'Analyze Ingredients',
  analyzing: 'Analyzing...',

  // Results
  results_title: 'Scan Results',
  results_safe: 'Safe',
  results_moderate: 'Caution',
  results_danger: 'Danger',
  results_unknown: 'Unknown',
  results_count_safe: '{{n}} Safe',
  results_count_moderate: '{{n}} Caution',
  results_count_danger: '{{n}} Danger',
  results_count_unknown: '{{n}} Unknown',
  expand_detail: 'Details',
  age_warning: '⚠️ Not recommended for children under 12',
  elderly_warning: '⚠️ Use caution for those over 60',
  save_scan: 'Save to History',
  scan_saved: 'Saved!',
  
  // Fallback error — must match spec exactly
  error_not_found: 'The search is failed or we don\'t have database. Please try again',

  // History View
  history_title: 'Search History',
  clear_history: 'Clear All',
  history_empty: 'No search history yet',
  history_item_label: 'Scan',
  history_delete: 'Delete',
  history_cleared: 'History cleared',

  // Settings View
  settings_title: 'Settings',

  // Profile
  profile_title: 'Profile',
  profile_name: 'Your Name',
  profile_name_placeholder: 'Enter name...',
  profile_age: 'Age',
  age_hint: 'Used to flag age-specific safety warnings (e.g. children under 12)',
  save_profile: 'Save Profile',
  profile_saved: 'Profile saved!',

  // Appearance
  appearance_title: 'Appearance',
  theme_label: 'Theme',
  theme_sublabel: 'Toggle between dark and light mode',
  theme_dark: 'Dark',
  theme_light: 'Light',
  lang_label: 'Language',
  lang_sublabel: 'Choose your preferred language',

  // Daily Routine
  routine_title: 'Daily Routine',
  routine_subtitle: 'Track cosmetic products you use daily',
  routine_placeholder: 'Product name...',
  routine_add: 'Add',
  routine_empty: 'No products in your routine yet',
  routine_added: 'Added to routine!',
  routine_removed: 'Removed from routine',

  // Toast
  toast_error: 'Something went wrong. Please try again.',
  toast_ocr_fail: 'Could not read image text. Please type ingredients manually.',
  
  // Risk levels (full label)
  risk_safe: 'Safe',
  risk_moderate: 'Caution',
  risk_danger: 'Dangerous',
  risk_unknown: 'Not in database',

  // Misc
  app_name: 'chaecheck',
  tagline: 'Know what\'s in your cosmetics.',
  no_ingredients: 'Please enter at least one ingredient.',
  
  // Routine Times
  time_morning: 'Morning',
  time_noon: 'Noon',
  time_evening: 'Evening',
  time_night: 'Night',

  // Informational Context
  purpose_label: 'Purpose:',
  allergy_label: 'Allergy Warning:',
  allergy_global_warning: '⚠️ If an allergic reaction occurs (redness, swelling, or itching), wash the area immediately with water and stop use. Consult a doctor if symptoms persist.',
};
