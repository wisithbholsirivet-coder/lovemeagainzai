/* ════════════════════════════════════════════════════
   ChaeCheck · js/routine.js
   Daily Product Routine Tracker
   ════════════════════════════════════════════════════ */

const RoutineManager = (() => {
  const STORAGE_KEY = 'chaecheck_routine';

  let _items = [];

  function _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      _items = raw ? JSON.parse(raw) : [];
    } catch (_) { _items = []; }
  }

  function _save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_items)); } catch (_) {}
  }

  function _renderItem(item) {
    const el = document.createElement('div');
    el.className = 'routine-item';
    el.setAttribute('role', 'listitem');
    el.dataset.id = item.id;

    const date = new Date(item.addedAt);
    const dateStr = date.toLocaleDateString(I18n.getLang() === 'th' ? 'th-TH' : 'en-US', {
      month: 'short', day: 'numeric'
    });

    el.innerHTML = `
      <div class="routine-item-text">
        <span class="routine-item-name">${escapeHtml(item.name)}</span>
        <span class="routine-item-date">${escapeHtml(dateStr)}</span>
      </div>
      <button class="routine-remove-btn" aria-label="Remove ${escapeHtml(item.name)}" title="Remove">✕</button>
    `;

    el.querySelector('.routine-remove-btn').addEventListener('click', () => remove(item.id));
    return el;
  }

  function renderList() {
    const listEl  = document.getElementById('routine-list');
    const emptyEl = document.getElementById('routine-empty');
    if (!listEl) return;

    listEl.querySelectorAll('.routine-item').forEach(el => el.remove());

    if (_items.length === 0) {
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;

    [..._items].reverse().forEach(item => {
      listEl.insertBefore(_renderItem(item), emptyEl);
    });
  }

  function add(name) {
    if (!name || !name.trim()) return;
    name = name.trim();

    // Prevent exact duplicates
    if (_items.some(i => i.name.toLowerCase() === name.toLowerCase())) {
      showToast(`"${name}" already in routine`);
      return;
    }

    _items.push({
      id:      Date.now().toString(36),
      name,
      addedAt: Date.now()
    });

    _save();
    renderList();
  }

  function remove(id) {
    _items = _items.filter(i => i.id !== id);
    _save();
    renderList();
  }

  function getAll() { return [..._items]; }

  function init() {
    _load();
    renderList();

    const addBtn   = document.getElementById('add-routine-btn');
    const inputEl  = document.getElementById('routine-product-input');

    if (addBtn && inputEl) {
      const doAdd = () => {
        const val = inputEl.value.trim();
        if (!val) return;
        add(val);
        inputEl.value = '';
        inputEl.focus();
        showToast(I18n.t('toast.routine.added', 'Added to daily routine'));
      };

      addBtn.addEventListener('click', doAdd);
      inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') doAdd(); });
    }

    // Wire up the "Add to Routine" button from scan results
    const addRoutineScanBtn = document.getElementById('add-to-routine-scan-btn');
    if (addRoutineScanBtn) {
      addRoutineScanBtn.addEventListener('click', () => {
        const rawText = document.getElementById('manual-input')?.value?.trim();
        const name = rawText ? rawText.slice(0, 40) : 'Scanned Product';
        add(name);
        showToast(I18n.t('toast.routine.added', 'Added to daily routine'));
        Router.navigate('settings');
      });
    }

    document.addEventListener('chaecheck:langchange', renderList);
  }

  return { init, add, remove, getAll, renderList };
})();
