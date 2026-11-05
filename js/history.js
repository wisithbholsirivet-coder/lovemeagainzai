/* ════════════════════════════════════════════════════
   ChaeCheck · js/history.js
   Scan History — localStorage (max 50 entries)
   ════════════════════════════════════════════════════ */

const HistoryManager = (() => {
  const STORAGE_KEY = 'chaecheck_history';
  const MAX_ENTRIES = 50;

  let _entries = [];

  function _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      _entries = raw ? JSON.parse(raw) : [];
    } catch (_) { _entries = []; }
  }

  function _save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_entries)); } catch (_) {}
  }

  function _renderEntry(entry) {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.setAttribute('role', 'listitem');

    const date = new Date(entry.timestamp);
    const dateStr = date.toLocaleDateString(I18n.getLang() === 'th' ? 'th-TH' : 'en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const counts = { green: 0, yellow: 0, red: 0, unknown: 0 };
    (entry.results || []).forEach(r => { counts[r.risk] = (counts[r.risk] || 0) + 1; });

    const chips = Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([risk, count]) => {
        const emoji = { green: '🟢', yellow: '🟡', red: '🔴', unknown: '❓' }[risk] || '❓';
        return `<span class="summary-chip summary-chip--${risk}">${emoji} ${count}</span>`;
      }).join('');

    const label = entry.label || `${(entry.results || []).length} ${I18n.t('nav.search', 'ingredients')}`;

    item.innerHTML = `
      <div class="history-item-header">
        <span class="history-item-name">${escapeHtml(label)}</span>
        <span class="history-item-date">${escapeHtml(dateStr)}</span>
      </div>
      <div class="history-item-chips">${chips}</div>
      <div class="history-item-actions">
        <button class="btn btn-ghost btn-sm view-history-btn" data-id="${entry.id}"
          data-i18n="nav.search">View Results</button>
        <button class="btn btn-ghost btn-sm btn-danger remove-history-btn" data-id="${entry.id}">
          🗑️ Remove
        </button>
      </div>
    `;

    item.querySelector('.view-history-btn').addEventListener('click', () => {
      if (Scanner && entry.results) {
        Scanner.restoreResults(entry.results, entry.rawText || '');
        Router.navigate('scanner');
      }
    });
    item.querySelector('.remove-history-btn').addEventListener('click', () => {
      remove(entry.id);
    });

    return item;
  }

  function renderList() {
    const listEl   = document.getElementById('history-list');
    const emptyEl  = document.getElementById('history-empty');
    if (!listEl) return;

    // Clear existing items (but not #history-empty)
    listEl.querySelectorAll('.history-item').forEach(el => el.remove());

    if (_entries.length === 0) {
      if (emptyEl) emptyEl.hidden = false;
      return;
    }

    if (emptyEl) emptyEl.hidden = true;

    // Newest first
    [..._entries].reverse().forEach(entry => {
      listEl.insertBefore(_renderEntry(entry), emptyEl);
    });
  }

  function add(results, rawText, label) {
    if (!results || results.length === 0) return;

    const entry = {
      id:        Date.now().toString(36) + Math.random().toString(36).slice(2),
      timestamp: Date.now(),
      label:     label || rawText?.slice(0, 40) || 'Scan',
      rawText:   rawText || '',
      results:   results,
    };

    _entries.push(entry);

    // Cap at max
    if (_entries.length > MAX_ENTRIES) _entries = _entries.slice(-MAX_ENTRIES);

    _save();
    renderList();
    return entry.id;
  }

  function remove(id) {
    _entries = _entries.filter(e => e.id !== id);
    _save();
    renderList();
  }

  function clear() {
    _entries = [];
    _save();
    renderList();
  }

  function getAll() { return [..._entries]; }

  function init() {
    _load();
    renderList();

    const clearBtn = document.getElementById('clear-history-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm(I18n.t('confirm.clear.history', 'Clear all history?'))) {
          clear();
          showToast(I18n.t('toast.history.cleared', 'History cleared'));
        }
      });
    }

    // Re-render on language change (dates format)
    document.addEventListener('chaecheck:langchange', renderList);
  }

  return { init, add, remove, clear, getAll, renderList };
})();
