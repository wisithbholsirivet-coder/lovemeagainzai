/* ════════════════════════════════════════════════════
   ChaeCheck · js/app.js
   Application Bootstrap · Router · Global Utilities
   ════════════════════════════════════════════════════ */

/* ── Global HTML escape utility ─────────────────── */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ── Global Toast utility ───────────────────────── */
let _toastTimer = null;
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  if (_toastTimer) clearTimeout(_toastTimer);
  toast.classList.remove('toast-exit');
  toast.textContent = message;
  toast.hidden = false;

  _toastTimer = setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => { toast.hidden = true; toast.classList.remove('toast-exit'); }, 220);
  }, duration);
}

/* ── Router ─────────────────────────────────────── */
const Router = (() => {
  const VIEW_TITLES = {
    scanner:  'nav.search',
    history:  'nav.history',
    settings: 'nav.settings',
  };

  let _current = 'scanner';

  function navigate(viewName) {
    if (!VIEW_TITLES[viewName]) return;

    // Hide all views by removing active class (CSS sets display:none)
    document.querySelectorAll('.view').forEach(v => {
      v.classList.remove('active');
    });

    // Show target view by adding active class (CSS sets display:flex)
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
      target.classList.add('active');
    }

    _current = viewName;

    // Update nav active state — desktop sidebar
    document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
      const active = btn.dataset.view === viewName;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-current', active ? 'page' : 'false');
    });

    // Update nav active state — mobile bottom nav
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
      const active = btn.dataset.view === viewName;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-current', active ? 'page' : 'false');
    });

    // Update topbar title
    const titleEl = document.getElementById('topbar-title');
    if (titleEl) titleEl.textContent = I18n.t(VIEW_TITLES[viewName], viewName);
  }

  function getCurrent() { return _current; }

  function init() {
    // Wire up all nav buttons (sidebar + bottom nav)
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.view));
    });
  }

  return { init, navigate, getCurrent };
})();

/* ── App Bootstrap ───────────────────────────────── */
(async function initApp() {
  // 1. Theme first (prevents flash of wrong theme)
  ThemeManager.init();

  // 2. i18n (translate static DOM)
  I18n.init();

  // 3. Router
  Router.init();

  // 4. Profile
  ProfileManager.init();

  // 5. History
  HistoryManager.init();

  // 6. Routine
  RoutineManager.init();

  // 7. Scanner (register events)
  Scanner.init();

  // 8. Load database asynchronously
  try {
    await DB.load();
  } catch (err) {
    showToast(I18n.t('db.error', 'Failed to load ingredient database'));
  }

  // 9. Re-translate topbar title after i18n ready
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = I18n.t('nav.search', 'Search');

  // 10. Listen for language changes to update topbar
  document.addEventListener('chaecheck:langchange', () => {
    const titleEl = document.getElementById('topbar-title');
    if (titleEl) titleEl.textContent = I18n.t(
      { scanner: 'nav.search', history: 'nav.history', settings: 'nav.settings' }[Router.getCurrent()],
      Router.getCurrent()
    );
  });

  console.log('[ChaeCheck] App initialized ✓');
})();
