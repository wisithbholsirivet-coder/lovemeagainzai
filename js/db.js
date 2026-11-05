/* ════════════════════════════════════════════════════
   ChaeCheck · js/db.js  v4
   Ingredient Database — Loader + Smart Search Engine
   ════════════════════════════════════════════════════ */

const DB = (() => {
  // Version bump this string whenever any data file is updated — forces browser cache refresh
  const DB_VERSION = '20261018-1';
  const DB_FILES = [
    'data/ingredients_a_f.json?v=' + DB_VERSION,
    'data/ingredients_g_l.json?v=' + DB_VERSION,
    'data/ingredients_m_r.json?v=' + DB_VERSION,
    'data/ingredients_s_z.json?v=' + DB_VERSION,
  ];

  let _ingredients = [];
  let _loaded      = false;
  let _loadError   = false;

  // ── Status indicator ────────────────────────────
  function _setStatus(state) {
    const dot = document.getElementById('db-status-dot');
    if (!dot) return;
    dot.className = `db-status-dot ${state}`;
    dot.title = I18n.t(`db.${state}`, state);
    dot.setAttribute('aria-label', I18n.t(`db.${state}`, state));
  }

  // ── Normalize text for matching ─────────────────
  function _normalize(str) {
    return (str || '')
      .toLowerCase()
      // expand common OCR ligatures
      .replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl')
      // remove non-alphanumeric except hyphens and spaces
      .replace(/[^a-z0-9\s\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ── Sanitize token for matching ─────────────────
  // Delegates to js/inci-cleaner.js: strips only percentages, standalone
  // periods and non-INCI parentheses. Keeps PEG-100, 1,2-Hexanediol, (Water).
  function _sanitizeForMatch(str) {
    if (typeof InciCleaner !== 'undefined') return InciCleaner.cleanToken(str);
    return (str || '')
      .replace(/\b\d+(\.\d+)?\s*%/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ── Tokenise a raw ingredient string ───────────
  function _tokenize(str) {
    return _normalize(str).split(/\s+/).filter(t => t.length > 1);
  }

  // ── Simple Levenshtein distance ─────────────────
  function _levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
    for (let j = 1; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i-1] === b[j-1]
          ? dp[i-1][j-1]
          : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
      }
    }
    return dp[m][n];
  }

  // ── OCR-tolerant similarity (Stage 3 tier 2) ────
  // Plain Levenshtein punishes scrambled OCR hard: "lisohexdacne" vs
  // "isohexadecane" = 4 edits (69%). Blend three views of similarity:
  //   OSA   — Levenshtein + adjacent swaps ("ae"↔"ea")
  //   Jaro  — same letters in roughly the same order
  //   Bag   — same letter multiset (scrambles, dropped/duplicated letters)
  function _osa(a, b) {
    const m = a.length, n = b.length;
    const d = Array.from({ length: m + 1 }, (_, i) => { const r = new Array(n + 1).fill(0); r[0] = i; return r; });
    for (let j = 0; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i-1] === b[j-1] ? 0 : 1;
        d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + cost);
        if (i > 1 && j > 1 && a[i-1] === b[j-2] && a[i-2] === b[j-1]) d[i][j] = Math.min(d[i][j], d[i-2][j-2] + 1);
      }
    }
    return d[m][n];
  }

  function _jaro(a, b) {
    if (a === b) return 1;
    const win = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
    const aM = new Array(a.length).fill(false), bM = new Array(b.length).fill(false);
    let m = 0;
    for (let i = 0; i < a.length; i++) {
      for (let j = Math.max(0, i - win); j < Math.min(b.length, i + win + 1); j++) {
        if (!bM[j] && a[i] === b[j]) { aM[i] = bM[j] = true; m++; break; }
      }
    }
    if (!m) return 0;
    let t = 0, k = 0;
    for (let i = 0; i < a.length; i++) {
      if (!aM[i]) continue;
      while (!bM[k]) k++;
      if (a[i] !== b[k]) t++;
      k++;
    }
    return (m / a.length + m / b.length + (m - t / 2) / m) / 3;
  }

  function _bagDice(a, b) {
    const cnt = {};
    for (const ch of a) cnt[ch] = (cnt[ch] || 0) + 1;
    let common = 0;
    for (const ch of b) if (cnt[ch] > 0) { cnt[ch]--; common++; }
    return (2 * common) / (a.length + b.length);
  }

  function _ocrScore(a, b) {
    const lev = 1 - _osa(a, b) / Math.max(a.length, b.length);
    return 0.4 * lev + 0.3 * _jaro(a, b) + 0.3 * _bagDice(a, b);
  }

  // ── Token-overlap score (Jaccard) ───────────────
  function _jaccardScore(tokA, tokB) {
    const setA = new Set(tokA);
    const setB = new Set(tokB);
    const intersection = [...setA].filter(t => setB.has(t)).length;
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 0 : intersection / union;
  }

  // ═══════════════════════════════════════════════════
  // Compact index: lowercase, letters+digits only.
  // "Sodium HyALuronate", "sodium-hyaluronate", "SODIUMHYALURONATE"
  // all map to "sodiumhyaluronate". Built once on load.
  // ═══════════════════════════════════════════════════
  let _compactMap = new Map();   // compact name -> ingredient
  let _maxKeyLen  = 0;

  function _compact(str) {
    return (str || '').toLowerCase()
      .replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl')
      .replace(/[^a-z0-9]/g, '');
  }

  function _buildIndex() {
    _compactMap = new Map();
    _maxKeyLen = 0;
    for (const ing of _ingredients) {
      for (const name of ing.names) {
        const k = _compact(name);
        if (k.length < 3) continue;
        if (!_compactMap.has(k)) _compactMap.set(k, ing);
        if (k.length > _maxKeyLen) _maxKeyLen = k.length;
      }
    }
  }

  // Exact compact lookup with plural fallback (Hyaluronates, Dioxides, Oxides)
  function _lookupCompact(k) {
    if (!k || k.length < 3) return null;
    return _compactMap.get(k)
      || (k.endsWith('es') && _compactMap.get(k.slice(0, -2)))
      || (k.endsWith('s')  && _compactMap.get(k.slice(0, -1)))
      || null;
  }

  // Readable name: Title Case form of the primary INCI name, else any
  // non-ALL-CAPS alias, else the primary name.
  function _displayName(ing) {
    const primary = _compact(ing.names[0]);
    return ing.names.find(n => n !== n.toUpperCase() && _compact(n) === primary)
      || ing.names.find(n => n !== n.toUpperCase())
      || ing.names[0];
  }

  // Key that _lookupCompact actually hit (handles plural fallback)
  function _lookupKey(k) {
    if (!k || k.length < 3) return null;
    if (_compactMap.has(k)) return k;
    if (k.endsWith('es') && _compactMap.has(k.slice(0, -2))) return k.slice(0, -2);
    if (k.endsWith('s')  && _compactMap.has(k.slice(0, -1))) return k.slice(0, -1);
    return null;
  }

  // DB spelling of the alias matching `key`: "SilICA" → "Silica",
  // "Phenylbenzmidiazole…" → the INCI alias, not USAN "Ensulizole".
  // Prefers proper-case alias, then primary name, then ALL-CAPS alias.
  function _canonicalName(ing, key) {
    const same = (ing.names || []).filter(n => _compact(n) === key);
    const disp = _displayName(ing);
    return same.find(n => n !== n.toUpperCase())
      || (_compact(disp) === key ? disp : null)
      || same[0] || disp;
  }

  // ── Glued-word segmentation ─────────────────────
  // OCR often drops separators: "SodiumHYDROXIDETitaniumDIOXIDES".
  // DP over compact string: split into fewest known ingredient names.
  // Allows skipping up to 3 junk chars (stray OCR marks, "eau").
  // Returns array of ingredients (deduped) or null.
  function _segment(c) {
    const L = c.length;
    if (L < 8 || L > 500 || _compactMap.size === 0) return null;
    const maxK = Math.min(_maxKeyLen + 2, 100);
    // best[i] = { cost, prev, ing, skips, pieces }
    const best = new Array(L + 1).fill(null);
    best[0] = { cost: 0, prev: -1, ing: null, skips: 0, pieces: 0 };
    for (let i = 1; i <= L; i++) {
      for (let j = Math.max(0, i - maxK); j <= i - 3; j++) {
        const b = best[j];
        if (!b) continue;
        const ing = _lookupCompact(c.slice(j, i));
        if (!ing) continue;
        const cost = b.cost + 1;
        if (!best[i] || cost < best[i].cost) {
          best[i] = { cost, prev: j, ing, skips: b.skips, pieces: b.pieces + 1 };
        }
      }
      const p = best[i - 1];
      if (p && p.skips < 3 && (!best[i] || p.cost + 3 < best[i].cost)) {
        best[i] = { cost: p.cost + 3, prev: i - 1, ing: null, skips: p.skips + 1, pieces: p.pieces };
      }
    }
    const end = best[L];
    if (!end || end.pieces < 2) return null;
    const out = [];
    const seen = new Set();
    for (let i = L; i > 0; i = best[i].prev) {
      const ing = best[i].ing;
      if (ing && !seen.has(ing.id)) { seen.add(ing.id); out.unshift(ing); }
    }
    return out.length ? out : null;
  }

  // Expand one OCR token into 1+ ingredient name strings.
  function _expandToken(token) {
    const c = _compact(token);
    if (!c || _lookupCompact(c)) return [token];
    const cands = typeof InciCleaner !== 'undefined' ? InciCleaner.matchCandidates(token) : [];
    if (cands.some(x => _lookupCompact(_compact(x)))) return [token];
    const seg = _segment(c);
    if (seg) return seg.map(_displayName);
    return [token];
  }

  // ── Match one ingredient string against DB ──────
  function _matchOne(rawName) {
    // ─ Pass 1: Exact compact match on any candidate ─
    // "Aqua (Water)" tries: full, "Aqua", "Water". Case/space/hyphen-insensitive.
    const candidates = typeof InciCleaner !== 'undefined'
      ? InciCleaner.matchCandidates(rawName) : [rawName];
    for (const cand of candidates) {
      const hit = _lookupCompact(_compact(cand));
      if (hit) return { ...hit, _matchType: 'exact', _score: 1 };
    }

    // Fuzzy passes run on the name without its parenthetical
    const base = candidates[1] && rawName.includes('(') ? candidates[1] : rawName;
    const norm = _normalize(base);
    if (!norm || norm.length < 2) return null;

    // ─ Pass 2: Substring on WHOLE WORDS (one name fully contains the other) ─
    // "Sodium Hyaluronate Crosspolymer" ⊃ "Sodium Hyaluronate" → ok.
    // "Waterproof" ⊅ "Water" (inside a word) → rejected; was a false hit.
    const padIn = ` ${norm} `;
    for (const ing of _ingredients) {
      for (const name of ing.names) {
        const n = _normalize(name);
        if (n.length < 3) continue;
        if (padIn.includes(` ${n} `) || ` ${n} `.includes(padIn)) {
          const ratio = Math.min(n.length, norm.length) / Math.max(n.length, norm.length);
          if (ratio >= 0.50) {
            return { ...ing, _matchType: 'substring', _score: ratio };
          }
        }
      }
    }

    // ─ Pass 3: Calibrated fuzzy (same tiers as Stage 3 fuzzyCorrect) ─
    // Old per-word Levenshtein @0.65 mapped "Sodium Polyaspartate" → Sodium
    // Polyacrylate (different chemical) and "Hydrating" → Hydrated Silica.
    // Wrong safety colour is worse than Unknown + "Did you mean?" chips.
    const hit = _fuzzyTier1(_compact(base)) || _fuzzyTier2(_compact(base));
    if (hit) return { ...hit.ing, _matchType: 'fuzzy', _score: hit.score };

    return null;
  }

  function suggest(rawName, limit = 3) {
    const norm = _normalize(rawName);
    if (!norm || norm.length < 3) return [];

    const normToks = _tokenize(rawName);
    const maxDist = Math.max(3, Math.floor(norm.length / 3));

    const scored = [];
    for (const ing of _ingredients) {
      let best = 0;
      for (const name of ing.names) {
        const n = _normalize(name);
        // Token Jaccard
        const jacc = _jaccardScore(normToks, _tokenize(name));
        // Levenshtein (capped to avoid O(n²) on long strings)
        const nShort = n.slice(0, norm.length + 4);
        const dist   = _levenshtein(norm.slice(0, 30), nShort.slice(0, 30));
        const lvSc   = dist <= maxDist ? (1 - dist / Math.max(norm.length, n.length)) : 0;
        best = Math.max(best, jacc * 0.6 + lvSc * 0.4);
      }
      if (best > 0.25) scored.push({ ing, score: best });
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.ing);
  }

  // ── Ingredient name quality gate ─────────────────
  // Returns true only if the token looks like a real cosmetic ingredient.
  // Silently drops OCR garbage (symbols, numbers-only, too-short, gibberish)
  // so they never appear as "Unknown" cards.
  function _isLikelyIngredient(token) {
    const t = token.trim();

    // Must be at least 3 characters long
    if (t.length < 3) return false;

    // Must contain at least 2 real Latin letters
    const letterCount = (t.match(/[a-z]/gi) || []).length;
    if (letterCount < 2) return false;

    // INCI names with numbers (CI 77891, PEG-100, Red 7) pass via shared gate
    if (typeof InciCleaner !== 'undefined' && InciCleaner.isLikelyIngredient(t)
        && letterCount / t.length < 0.4) return true;

    // Ratio of letters to total chars must be > 40%
    // (catches "= c ©", "123 %", "----" etc.)
    if (letterCount / t.length < 0.4) return false;

    // Must not be a pure number (e.g. "123", "0.5")
    if (/^[\d.,%]+$/.test(t)) return false;

    // Must not be a very common non-ingredient word or sentence fragment
    const STOPWORDS = new Set([
      'and','the','for','with','this','that','from','into','each','also',
      'may','can','use','used','using','contains','contain','free','safe',
      'not','but','its','all','has','have','more','than','less','some',
      // common label words that aren't ingredients
      'product','ingredients','formula','manufactured','distributed',
      'by','of','or','in','to','a','an','it','no','do','be','at','on',
      'lot','exp','mfg','net','wt','fl','oz','ml','g','mg','made',
    ]);
    if (STOPWORDS.has(t.toLowerCase())) return false;

    // Must not be mostly symbols/numbers with only 1-2 letters sprinkled
    // e.g. "Ic", "lc", "= c", "C©"
    if (t.length <= 4 && letterCount <= 2) return false;

    return true;
  }

  // ── Parse raw ingredient text into tokens ───────
  function _parseText(text) {
    // Try to isolate the ingredients block (after "Ingredients:" label)
    const sectionMatch = text.match(/ingredients?\s*[:：]\s*([\s\S]+?)(?:\n\n|\.\s*$|$)/i);
    const block = (sectionMatch ? sectionMatch[1] : text)
      .replace(/[°º]/g, 'o')
      .replace(/[^\x20-\x7E\u0E00-\u0E7F\n\uFF0C\u3001\uFF1B•·]/g, ' '); // printable ASCII + Thai + separators

    if (typeof InciCleaner !== 'undefined') {
      return InciCleaner.splitIngredients(block)
        .filter(s => s.length >= 2 && _isLikelyIngredient(s));
    }
    // Fallback (cleaner not loaded)
    return block.replace(/[\r\n]+/g, ',').split(/[;]|(?<!\d),|,(?!\d)/)
      .map(s => _sanitizeForMatch(s))
      .filter(s => s.length >= 3 && _isLikelyIngredient(s));
  }

  // ── Public: search ───────────────────────────────
  function search(rawText) {
    if (!rawText || !rawText.trim()) return [];

    // Expand glued OCR tokens ("SodiumHYDROXIDETitaniumDIOXIDES") into parts
    const tokens = _parseText(rawText).flatMap(_expandToken);
    const results = [];
    const seenIds = new Set(); // deduplicate

    tokens.forEach(token => {
      const trimmed = _sanitizeForMatch(token.trim());
      if (!trimmed) return;

      const match = _matchOne(trimmed);

      if (match) {
        // Avoid exact duplicate DB entries
        if (seenIds.has(match.id)) {
          // Still push the raw name as an alias result
          results.push({
            inputName:        trimmed,
            id:               match.id,
            names:            match.names,
            risk:             match.risk,
            category:         match.category,
            purpose:          match.purpose,
            concerns:         match.concerns || [],
            kidsUnsafe:       match.kidsUnsafe || false,
            pregnancyWarning: match.pregnancyWarning || false,
            description_en:   match.description_en || '',
            description_th:   match.description_th || '',
            reference:        match.reference || '',
            _matchType:       match._matchType,
            _score:           match._score,
          });
          return;
        }
        seenIds.add(match.id);

        results.push({
          inputName:        trimmed,
          id:               match.id,
          names:            match.names,
          risk:             match.risk,
          category:         match.category,
          purpose:          match.purpose,
          concerns:         match.concerns || [],
          kidsUnsafe:       match.kidsUnsafe || false,
          pregnancyWarning: match.pregnancyWarning || false,
          description_en:   match.description_en || '',
          description_th:   match.description_th || '',
          reference:        match.reference || '',
          _matchType:       match._matchType,
          _score:           match._score,
          _suggestions:     [],
        });
      } else {
        // Unknown — compute suggestions
        const suggestions = suggest(trimmed, 3);
        results.push({
          inputName:        trimmed,
          id:               null,
          names:            [trimmed],
          risk:             'unknown',
          category:         '',
          purpose:          I18n.t('error.notfound', 'Not found in database'),
          concerns:         [],
          kidsUnsafe:       false,
          pregnancyWarning: false,
          description_en:   I18n.t('error.notfound', 'Not found in database'),
          description_th:   I18n.t('error.notfound', 'ไม่พบในฐานข้อมูล'),
          _matchType:       'none',
          _score:           0,
          _suggestions:     suggestions,
        });
      }
    });

    return results;
  }

  // ── Lookup by id ─────────────────────────────────
  function getById(id) {
    return _ingredients.find(i => i.id === id) || null;
  }

  // ── Load all JSON files ──────────────────────────
  async function load() {
    _setStatus('loading');

    try {
      const responses = await Promise.all(
        DB_FILES.map(f => fetch(f).then(r => {
          if (!r.ok) throw new Error(`Failed to fetch ${f}: ${r.status}`);
          return r.json();
        }))
      );

      _ingredients = responses.flat();
      _buildIndex();
      _loaded      = true;
      _loadError   = false;
      _setStatus('ready');

      console.log(`[ChaeCheck DB] Loaded ${_ingredients.length} ingredients across ${DB_FILES.length} files.`);
    } catch (err) {
      _loadError = true;
      _setStatus('error');
      console.error('[ChaeCheck DB] Load error:', err);
      throw err;
    }
  }

  function isLoaded() { return _loaded; }
  function hasError()  { return _loadError; }
  function getCount()  { return _ingredients.length; }

  // ═══════════════════════════════════════════════════
  // STAGE 3: Fuzzy Matching Resolver
  // Maps OCR-misspelled names to correct DB spellings.
  // Uses existing _levenshtein + _normalize infra.
  // Threshold: 85% similarity = auto-correct.
  // ═══════════════════════════════════════════════════
  const FUZZY_THRESHOLD = 0.85;

  /**
   * Takes comma-separated OCR text, fuzzy-corrects each ingredient
   * against the loaded database, returns corrected text string.
   * @param {string} ocrText - Comma-separated ingredient names from Stage 2
   * @returns {string} - Corrected comma-separated text
   */
  function fuzzyCorrect(ocrText) {
    if (!_loaded || !ocrText) return ocrText || '';

    const items = (typeof InciCleaner !== 'undefined'
      ? InciCleaner.splitIngredients(ocrText)
      : ocrText.split(/(?<!\d),|,(?!\d)/).map(s => s.trim()).filter(s => s.length >= 2)
    ).flatMap(_expandToken);

    const corrected = [];
    for (const item of items) {
      // Exact (case/space/hyphen/plural-insensitive).
      // Whole token hit → emit DB spelling ("SilICA" → "Silica").
      // Only an inner candidate hit ("Aqua (Water)" via "Water") → keep label text.
      const cands = typeof InciCleaner !== 'undefined' ? InciCleaner.matchCandidates(item) : [item];
      const fullKey = _lookupKey(_compact(cands[0]));
      if (fullKey) { corrected.push(_canonicalName(_compactMap.get(fullKey), fullKey)); continue; }
      if (cands.some(c => _lookupCompact(_compact(c)))) { corrected.push(item); continue; }

      const base = cands[1] && item.includes('(') ? cands[1] : item;
      const c = _compact(base);
      if (c.length < 4) { corrected.push(item); continue; }

      const hit = _fuzzyTier1(c) || _fuzzyTier2(c);
      if (hit) {
        const name = _canonicalName(hit.ing, hit.key);
        console.log(`[Fuzzy:${hit.tier}] "${item}" → "${name}" (${(hit.score * 100).toFixed(0)}%)`);
        corrected.push(name);
      } else {
        corrected.push(item); // no confident match — keep original, flagged Unknown later
      }
    }

    return corrected.join(', ');
  }

  // Tier 1: plain Levenshtein. Long names tolerate proportionally more slips.
  function _fuzzyTier1(c) {
    const threshold = c.length >= 12 ? 0.80 : FUZZY_THRESHOLD;
    let best = null;
    for (const [key, ing] of _compactMap) {
      const maxLen = Math.max(c.length, key.length);
      if (Math.abs(c.length - key.length) > maxLen * (1 - threshold)) continue; // can't reach threshold
      const score = 1 - _levenshtein(c, key) / maxLen;
      if (!best || score > best.score) best = { ing, key, score, tier: 1 };
    }
    return best && best.score >= threshold ? best : null;
  }

  // Tier 2: OCR-scramble resolver ("lisohexdacne" → Isohexadecane).
  // Guards against forcing unknown chemicals onto wrong entries:
  //   - only names ≥ 8 chars (short words have too many near-neighbours)
  //   - blended score ≥ TIER2_MIN
  //   - winner must beat the best *different* ingredient by TIER2_MARGIN
  // Also tries dropping one leading l/i/1 — glm-ocr's common stray glyph.
  const TIER2_MIN = 0.80, TIER2_MARGIN = 0.05;
  function _fuzzyTier2(c) {
    if (c.length < 8) return null;
    const variants = /^[li1]/.test(c) ? [c, c.slice(1)] : [c];
    let best = null, second = 0;
    for (const [key, ing] of _compactMap) {
      if (Math.abs(c.length - key.length) > Math.ceil(c.length * 0.35)) continue;
      let score = 0;
      for (const v of variants) score = Math.max(score, _ocrScore(v, key));
      if (!best || score > best.score) {
        if (best && best.ing !== ing) second = Math.max(second, best.score);
        best = { ing, key, score, tier: 2 };
      } else if (ing !== best.ing && score > second) {
        second = score;
      }
    }
    return best && best.score >= TIER2_MIN && best.score - second >= TIER2_MARGIN ? best : null;
  }

  return { load, search, getById, suggest, fuzzyCorrect, isLoaded, hasError, getCount };
})();
