/* ════════════════════════════════════════════════════
   ChaeCheck · js/inci-cleaner.js
   INCI-aware ingredient string cleaner.

   Rule: never destroy characters that belong to an INCI name.
     KEEP   hyphens + numbers   PEG-100 Stearate, Polysorbate 60,
                                C12-15 Alkyl Benzoate, CI 77891
     KEEP   digit commas        1,2-Hexanediol, 2,4-Diaminophenoxyethanol HCl
     KEEP   INCI parentheses    Aqua (Water), Butyrospermum Parkii (Shea) Butter
     KEEP   slashes             Caprylic/Capric Triglyceride
     STRIP  percentages         5%, (0.5%), <1%
     STRIP  standalone periods  "Glycerin." / "Water. Glycerin"
     STRIP  non-INCI parens     (and), (organic), (*), (2%)

   UMD: works as <script> (window.InciCleaner) and in Node (require).
   ════════════════════════════════════════════════════ */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.InciCleaner = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Ingredient families whose numbers are part of the name.
  const NUMBERED_FAMILY = /\b(PEG|PPG|Polysorbate|Laureth|Ceteareth|Steareth|Ceteth|Oleth|Trideceth|Isoceteth|Polyquaternium|Quaternium|Ceramide|Nylon|Polyglyceryl|Glycereth|Pareth|Poloxamer|Acrylates?|Benzophenone|Polysilicone|Peptide|Tripeptide|Tetrapeptide|Pentapeptide|Hexapeptide|Oligopeptide)\b/i;
  const CI_CODE         = /^C\.?\s?I\.?\s?\d{5}$/i;          // CI 77891, C.I. 77891
  const COLOR_CODE      = /^(FD&C|D&C)?\s?(Red|Yellow|Blue|Green|Orange|Violet|Black)\s?(No\.?\s?)?\d+(\s?Lake)?$/i;

  // Parenthetical content that is NOT INCI nomenclature.
  const NON_INCI_PAREN  = /^\s*(and|or|\*+|†+|organic|certified organic|bio|natural|vegan|plant[- ]derived|\d+(?:[.,]\d+)?\s*%|<\s*\d+(?:[.,]\d+)?\s*%|may contain|\+\/-)\s*$/i;

  // ── 1. Percentages ──────────────────────────────
  // "(5%)", "5 %", "0,5%", "<1%"  —  never touches PEG-100 or CI 77891.
  function stripPercentages(s) {
    return String(s || '')
      .replace(/\(\s*<?\s*\d+(?:[.,]\d+)?\s*%\s*\)/g, ' ')
      .replace(/<?\s*\b\d+(?:[.,]\d+)?\s*%/g, ' ');
  }

  // ── 2. Split a label into ingredient tokens ─────
  function splitIngredients(text) {
    let s = stripPercentages(text)
      .replace(/\uFF0C|\u3001|\uFF1B/g, ',')        // full-width , 、 ；
      .replace(/[;•·▪●|]/g, ',')                     // semicolons, bullets
      .replace(/\r?\n+/g, ',')                       // line breaks
      // Standalone period = separator: after a word or number, before space+letter.
      // Decimals (0.5) and "C.I. 77891" / "No. 7" (digit follows) stay intact.
      .replace(/([A-Za-z]{2,}\)?|\d)\.\s+(?=[A-Za-z(])/g, '$1,')
      // Trailing period at end of text
      .replace(/\.\s*$/g, '');

    // Split on commas, EXCEPT a comma between two digits (1,2-Hexanediol)
    return s.split(/(?<!\d),|,(?!\d)/)
      .map(cleanToken)
      .filter(isLikelyIngredient);
  }

  // ── 3. Clean a single token ─────────────────────
  function cleanToken(t) {
    let s = stripPercentages(t)
      .replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl')
      .replace(/[\u00A9\u00AE\u2122]/g, '')           // © ® ™
      .replace(/[*†‡§]+/g, ' ')                       // footnote markers
      // Drop non-INCI parentheticals, keep INCI ones
      .replace(/\(([^()]*)\)/g, (m, inner) => NON_INCI_PAREN.test(inner) || !inner.trim() ? ' ' : `(${inner.trim()})`)
      .replace(/\[([^\[\]]*)\]/g, (m, inner) => /^\s*nano\s*$/i.test(inner) ? ' [nano]' : ' ')
      // Hyphen spacing from OCR: "PEG - 100" → "PEG-100"
      .replace(/\s*-\s*(?=\d)/g, '-')
      .replace(/([A-Za-z])\s+-\s+([A-Za-z])/g, '$1-$2')
      .replace(/\s*\/\s*/g, '/')
      .replace(/\s+/g, ' ')
      .trim();

    // Unbalanced parentheses
    const open = (s.match(/\(/g) || []).length, close = (s.match(/\)/g) || []).length;
    if (open !== close) s = s.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();

    // Leading/trailing junk: periods, colons, hyphens, stray commas
    return s.replace(/^[\s.:,\-–]+|[\s.:,\-–]+$/g, '');
  }

  // ── 4. Plausibility gate ────────────────────────
  const STOPWORDS = new Set(['and', 'the', 'for', 'with', 'from', 'contains', 'may', 'contain',
    'ingredients', 'ingredient', 'free', 'lot', 'exp', 'mfg', 'net', 'wt', 'ml', 'oz', 'made', 'in', 'of']);

  function isLikelyIngredient(t) {
    if (!t) return false;
    if (CI_CODE.test(t) || COLOR_CODE.test(t)) return true;
    const letters = (t.match(/[A-Za-z]/g) || []).length;
    if (letters < 2 || t.length > 120) return false;
    if (/^[\d\s.,%\-]+$/.test(t)) return false;            // pure numbers
    if (STOPWORDS.has(t.toLowerCase())) return false;
    if (NUMBERED_FAMILY.test(t)) return true;              // PEG-100 etc.
    return letters / t.replace(/\s/g, '').length >= 0.4;
  }

  // ── 5. Lookup candidates for one token ──────────
  // "Aqua (Water)"             → ["Aqua (Water)", "Aqua", "Water", "Aqua Water"]
  // "Butyrospermum Parkii (Shea) Butter" → [..., "Butyrospermum Parkii Butter", ...]
  function matchCandidates(t) {
    const out = [t];
    if (t.includes('(')) {
      const inner = (t.match(/\(([^()]+)\)/g) || []).map(p => p.slice(1, -1).trim());
      out.push(t.replace(/\s*\([^()]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim()); // without parens
      out.push(...inner);                                                        // alias inside
      out.push(t.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim());              // flattened
    }
    // "Aqua/Water/Eau" → try each part. Only when every part is ONE word, so
    // "Sodium Acrylate/Sodium Acryloyldimethyl Taurate Copolymer" never degrades
    // to a partial (wrong) ingredient.
    if (t.includes('/')) {
      const parts = t.split('/').map(x => x.trim());
      if (parts.every(p => /^[A-Za-z]+$/.test(p))) out.push(...parts);
    }
    return [...new Set(out.filter(x => x && x.length >= 2))];
  }

  return { stripPercentages, splitIngredients, cleanToken, isLikelyIngredient, matchCandidates };
});
