// ChaeCheck – Database Index
// Merges safe/moderate/danger arrays into one fast lookup Map
// Also applies age-gate escalation logic
window.ChaeCheck = window.ChaeCheck || {};
window.ChaeCheck.data = window.ChaeCheck.data || {};

window.ChaeCheck.data.buildIndex = function () {
  const all = [
    ...(window.ChaeCheck.data.safe    || []).map(i => ({ ...i, risk: 'safe'     })),
    ...(window.ChaeCheck.data.moderate|| []).map(i => ({ ...i, risk: 'moderate' })),
    ...(window.ChaeCheck.data.danger  || []).map(i => ({ ...i, risk: 'danger'   })),
  ];

  const index = new Map();
  all.forEach(ing => {
    (ing.names || []).forEach(name => {
      const key = name.toLowerCase().trim();
      if (!index.has(key)) index.set(key, ing);
    });
  });
  return index;
};

window.ChaeCheck.data.parseRawText = function (raw) {
  return raw
    .split(/[,;\n\r\/|]+/)
    .map(s => {
       // Remove leading bullets or numbers
       let clean = s.replace(/^[\d\.\-\*•]+\s*/, '');
       // Remove special characters, keep letters, numbers, spaces, and hyphens
       clean = clean.replace(/[^a-zA-Zก-๙0-9\s\-]/g, ' ').trim();
       // Collapse multiple spaces
       clean = clean.replace(/\s+/g, ' ');
       return clean;
    })
    .filter(s => {
       if (!s || s.length <= 2) return false;
       // Must contain at least 2 consecutive letters (filters out "3----", "1.2", etc)
       if (!/[a-zA-Zก-๙]{2,}/.test(s)) return false;
       return true;
    });
};
