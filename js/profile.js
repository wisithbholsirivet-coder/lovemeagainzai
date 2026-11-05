/* ════════════════════════════════════════════════════
   ChaeCheck · js/profile.js
   User Profile (Name + Age) — localStorage persistence
   ════════════════════════════════════════════════════ */

const ProfileManager = (() => {
  const STORAGE_KEY = 'chaecheck_profile';
  const defaults = { name: '', age: null };
  let _profile = { ...defaults };

  function _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) _profile = { ...defaults, ...JSON.parse(raw) };
    } catch (_) { _profile = { ...defaults }; }
  }

  function _save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_profile)); } catch (_) {}
  }

  function _populateForms() {
    const nameInput = document.getElementById('profile-name');
    const ageInput  = document.getElementById('profile-age');
    if (nameInput) nameInput.value = _profile.name || '';
    if (ageInput)  ageInput.value  = _profile.age  || '';

    const usernameEl = document.getElementById('sidebar-username');
    if (usernameEl) usernameEl.textContent = _profile.name || I18n.t('sidebar.guest');

    const avatarEl = document.getElementById('sidebar-avatar');
    if (avatarEl) avatarEl.textContent = _profile.name ? _profile.name[0].toUpperCase() : '👤';
  }

  function init() {
    _load();
    _populateForms();

    const saveBtn = document.getElementById('save-profile-btn');
    if (saveBtn) saveBtn.addEventListener('click', saveFromForm);

    // Refresh guest label on language change
    document.addEventListener('chaecheck:langchange', () => {
      const usernameEl = document.getElementById('sidebar-username');
      if (usernameEl && !_profile.name) usernameEl.textContent = I18n.t('sidebar.guest');
    });
  }

  function saveFromForm() {
    const name   = document.getElementById('profile-name')?.value.trim() || '';
    const ageRaw = document.getElementById('profile-age')?.value;
    const age    = ageRaw ? parseInt(ageRaw, 10) : null;
    _profile.name = name;
    _profile.age  = age && !isNaN(age) ? age : null;
    _save();
    _populateForms();
    showToast(I18n.t('toast.profile.saved', 'Profile saved!'));
  }

  function getAge()     { return _profile.age; }
  function getName()    { return _profile.name; }
  function isKid()      { const a = _profile.age; return a !== null && a < 13; }
  function getProfile() { return { ..._profile }; }

  return { init, saveFromForm, getAge, getName, isKid, getProfile };
})();
