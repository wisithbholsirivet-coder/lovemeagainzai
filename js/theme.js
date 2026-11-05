/* ════════════════════════════════════════════════════
   ChaeCheck · js/theme.js
   Dark / Light mode management with localStorage
   ════════════════════════════════════════════════════ */

const ThemeManager = (() => {
  const STORAGE_KEY = 'chaecheck_theme';
  const DEFAULT     = 'dark';

  let _current = DEFAULT;

  function _applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    _current = theme;

    // Update desktop theme toggle button
    const thumb = document.getElementById('theme-thumb');
    if (thumb) thumb.textContent = theme === 'dark' ? '🌙' : '☀️';

    // Update mobile toggle switch
    const mobileSwitch = document.getElementById('theme-switch-mobile');
    if (mobileSwitch) mobileSwitch.checked = theme === 'dark';

    // Update meta theme-color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.content = theme === 'dark' ? '#0a0a0a' : '#ffffff';

    // Persist
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) {}
  }

  function init() {
    // Restore from storage, or detect system preference
    let saved;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (_) {}
    const theme = saved || (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    _applyTheme(theme);

    // Desktop toggle button
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggle);
    }

    // Mobile switch
    const mobileSwitch = document.getElementById('theme-switch-mobile');
    if (mobileSwitch) {
      mobileSwitch.addEventListener('change', () => {
        set(mobileSwitch.checked ? 'dark' : 'light');
      });
    }

    // Watch system preference changes
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        // Only auto-switch if no user preference saved
        let saved;
        try { saved = localStorage.getItem(STORAGE_KEY); } catch (_) {}
        if (!saved) _applyTheme(e.matches ? 'dark' : 'light');
      });
    } catch (_) {}
  }

  function toggle() {
    set(_current === 'dark' ? 'light' : 'dark');
  }

  function set(theme) {
    if (theme !== 'dark' && theme !== 'light') return;
    _applyTheme(theme);
  }

  function get() { return _current; }

  return { init, toggle, set, get };
})();
