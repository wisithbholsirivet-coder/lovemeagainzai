/* ════════════════════════════════════════════════════════════
   Stage 2 — Regex sanitization + loop kill-switch
   ════════════════════════════════════════════════════════════
   Input : raw glm-ocr string (untrusted: loops, bad delimiters, claims, chatter)
   Output: ordered, de-looped ingredient tokens + audit of what was removed

   INCI rule: never destroy characters that belong to a name.
     KEEP  PEG-100 Stearate · Polysorbate 60 · C12-15 Alkyl Benzoate
           1,2-Hexanediol · Aqua (Water) · Caprylic/Capric Triglyceride · CI 77891
     DROP  percentages · free-from claims · headers · post-list sections
           UI chatter ("Wait") · stray single letters · Thai/CJK leftovers   */

export interface LoopInfo {
  detected: boolean;
  /** adjacent: "A, B, B" · repeat: "A, B, C, A, …" (whole-list restart) */
  reason?: 'adjacent' | 'repeat';
  /** index in the token array where the loop began (= kept length) */
  at?: number;
  item?: string;
  droppedCount?: number;
}

export interface SanitizeResult {
  items: string[];
  removed: string[];
  loop: LoopInfo;
}

export interface SanitizeOptions {
  /** Also truncate on a non-adjacent repeat (default true — this is how glm-ocr actually loops). */
  truncateOnAnyRepeat?: boolean;
}

// ── Character classes ─────────────────────────────────────────
const ZW = '\\u200B-\\u200D\\u2060\\uFEFF';          // zero-width space/joiners, BOM
const SP = `[\\s${ZW}]*`;                             // whitespace incl. zero-width

// ── Negative ("free-from") claims ─────────────────────────────
// Targets are exported so the list can grow without touching the regex.
export const NEGATIVE_CLAIM_TARGETS = [
  'mineral oil', 'vegetable oil', 'paraben', 'alcohol', 'silicone',
  'sulfate', 'sulphate', 'fragrance', 'perfume',
] as const;

const TARGET = `(?:${NEGATIVE_CLAIM_TARGETS
  .map(t => t.replace(/ /g, `${SP}`) + 's?')           // "mineral oil" also "mineral\u200Boils"
  .join('|')})(?![A-Za-z])`;

// Thai prefixes have no \b (Thai is not \w), English prefixes need letter boundaries.
const CLAIM_PREFIX =
  `(?:[\\^*•]${SP})?` +
  `(?:ไม่มี|ปราศจาก|ไม่ผสม|ไร้` +
  `|(?<![A-Za-z])(?:free${SP}(?:from|of)|without|no|0${SP}%)(?![A-Za-z]))` +
  `${SP}(?:added${SP})?`;

// Chains: "parabens, alcohol and silicone", "mineral oil และ vegetable oil".
//  - "and/&/และ/or/" links are trusted.
//  - comma links only if that target then ENDS the phrase — so
//    "Free from parabens, Alcohol Denat." keeps the real "Alcohol Denat.".
const CONJ = `${SP}(?:&|/|\\band\\b|\\bor\\b|และ|หรือ)${SP}`;
const COMMA_LINK = `${SP}[,，]${SP}(?:(?:and|&)${SP})?${TARGET}(?=${SP}(?:[,，.;)\\n&/]|and\\b|or\\b|และ|หรือ|$))`;
const CHAIN = `${TARGET}(?:${CONJ}${TARGET}|${COMMA_LINK})*`;

const PREFIX_CLAIM_RE = new RegExp(`${CLAIM_PREFIX}${CHAIN}`, 'giu');
// Suffix form: "Paraben-free", "Alcohol Free", "Paraben & Sulfate Free"
const SUFFIX_CLAIM_RE = new RegExp(
  `(?<![A-Za-z])${TARGET}(?:${CONJ}${TARGET})*${SP}-?${SP}free(?![A-Za-z])`, 'giu');
// Generic English marketing claims
const MARKETING_RE = /\b(?:dermatologically|clinically|ophthalmologically)\s+(?:tested|proven)\b|\bhypo-?allergenic\b|\bnon-?comedogenic\b|\bno\s+animal\s+testing\b|\bcruelty[- ]free\b|\bvegan\b|\bfor\s+(?:all|sensitive)\s+skin(?:\s+types)?\b/giu;

// ── Section boundaries ────────────────────────────────────────
const END_RE = /END_OF_LIST|NO_INGREDIENTS_FOUND/i;
const HEADER_RE = /(?:\(?\b(?:ingredients?|ingrédients|inci)\b\)?\s*[:：\]}]|ส่วนประกอบ(?:สำคัญ)?\s*(?:\(\s*ingredients?\s*\))?\s*[:：]?|全?成分\s*[:：]?)/giu;
// Things printed AFTER the ingredient list on uncropped packaging.
const POST_LIST_RE = /\b(?:directions?(?:\s+for\s+use)?|how\s+to\s+use|usage|caution\s*:|warnings?\s*:|precautions?\s*:|keep\s+out\s+of\s+(?:the\s+)?reach|store\s+(?:in|at|below)|manufactured\s+(?:by|for)|mfg\.?\s*(?:by|date)|distributed\s+by|imported\s+by|made\s+in\s+[A-Z]|product\s+of\s+[A-Z]|batch\s*(?:no|number|code)|lot\s*(?:no|number)|exp(?:iry)?\.?\s*(?:date)?\s*(?:[:.]|(?=\d))|best\s+before|net\s+(?:wt|weight|vol|volume|content))\b|วิธีใช้|คำเตือน|ผลิตโดย|นำเข้าโดย|วันหมดอายุ/iu;

// ── Noise ─────────────────────────────────────────────────────
const NOISE_WORD = /^(?:wait|loading|processing|please|ok(?:ay)?|done|scan(?:ning)?|image|photo|picture|text|output|here|is|are|the|a|an|and|or|of|to|so|it|i|me|let|check|re-?check|again|actually|note|notes|sure|sorry|hmm|answer|result|results|extracted|following|below|above|list|ingredients?|markdown|json|end|free|from|with|without|no|yes|contains|natural|organic|vegetable|mineral|plant|derived|based|skin|sensitive|tested|safe|new|formula|spf\d*|uva|uvb|pa\+*|broad|spectrum|protection)$/i;
const CHEM_HINT = /(?:acid|ate|ite|ide|ine|ane|ene|ol|one|ose|yl|oil|wax|butter|extract|water|aqua|glycol|siloxane|cone|peg|ppg|ci\s?\d|ceteareth|laureth|polysorbate|ferment|gum|powder|juice|salt)\b/i;
const MAX_WORDS_NO_HINT = 4;

// ─────────────────────────────────────────────────────────────
export function sanitize(raw: string, opts: SanitizeOptions = {}): SanitizeResult {
  const removed: string[] = [];
  const cut = (s: string, re: RegExp): string =>
    s.replace(re, m => { if (m.trim()) removed.push(m.trim()); return ' '; });

  let s = String(raw ?? '');

  // 1. Unicode normalisation. NFKC folds full-width "，" → "," and ligatures "ﬁ" → "fi".
  //    Strip ™©® first: NFKC would turn ™ into the letters "TM".
  s = s.replace(/[\u00A9\u00AE\u2122]/g, '').normalize('NFKC');

  // 2. Hard stops: model markers, then code fences / markdown.
  const end = s.search(END_RE);
  if (end !== -1) s = s.slice(0, end);
  s = s.replace(/```[a-z]*|`/gi, ' ').replace(/^\s*[-*#>]+\s*/gm, '');

  // 3. Ingredient header: keep text after the first header; a second header = loop restart.
  const headers = [...s.matchAll(HEADER_RE)];
  if (headers.length) {
    const first = headers[0]!, second = headers[1];
    s = s.slice(first.index! + first[0].length, second ? second.index : undefined);
  }

  // 4. Post-list sections (directions, manufacturer, expiry…) — drop everything after.
  const post = s.search(POST_LIST_RE);
  if (post !== -1) { removed.push(s.slice(post).trim().slice(0, 80)); s = s.slice(0, post); }

  // 5. Claims BEFORE Thai stripping, or "ไม่มี mineral oil" degrades into a fake "mineral oil".
  s = cut(s, PREFIX_CLAIM_RE);
  s = cut(s, SUFFIX_CLAIM_RE);
  s = cut(s, MARKETING_RE);

  // 6. Packaging debris that is never INCI.
  s = cut(s, /(?:tel|phone|fax|โทร)\.?\s*:?\s*\+?[\d\s\-()]{7,}/giu);  // phone numbers
  s = cut(s, /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b|\b\d{1,2}\/\d{4}\b/g); // dates
  s = cut(s, /\b\d{8,}\b/g);                                             // EAN/UPC barcodes (CI codes are 5 digits)
  s = cut(s, /\bhttps?:\/\/\S+|\bwww\.\S+|\S+@\S+\.\w+/gi);              // URLs / e-mail
  s = s.replace(/[\u0E00-\u0E7F]+/gu, ' ')                               // Thai leftovers
       .replace(/[\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]+/gu, ' ')     // CJK leftovers
       .replace(new RegExp(`[${ZW}]`, 'g'), '');

  // 7. Percentages: "(5%)", "0,5 %", "<1%" — never touches PEG-100 / CI 77891.
  s = s.replace(/\(\s*<?\s*\d+(?:[.,]\d+)?\s*%\s*\)/g, ' ')
       .replace(/<?\s*\b\d+(?:[.,]\d+)?\s*%/g, ' ');

  // 8. Delimiter normalisation → ","
  s = s
    .replace(/[;、•·▪●|\n\r\t]+/g, ',')
    .replace(/\s*\(\s*and\s*\)\s*/gi, ',')                     // blends: "Silica (and) Dimethicone"
    // Period as separator: after a 2+-letter word or a digit, before space/EOS/Capital.
    // Keeps decimals (0.5), "C.I. 77891" (1-letter parts) and "FD&C Yellow No. 5".
    .replace(/(?<!\bNo)(?<=[A-Za-z]{2}\)?|\d)\.(?=\s|$)/g, ',')
    .replace(/(?<=[a-z]{2})\.(?=[A-Z])/g, ',');                // "Glycerin.Water"

  // 9. Split on commas EXCEPT digit,digit ("1,2-Hexanediol", "2,4-Diamino…").
  const rawTokens = s.split(/,(?!\d)|(?<!\d),/);

  // 10. Token clean-up + noise filter.
  const tokens: string[] = [];
  for (const t0 of rawTokens) {
    const t = cleanToken(t0);
    if (!t) continue;
    if (isNoise(t)) { removed.push(t); continue; }
    tokens.push(t);
  }

  // 11. Loop kill-switch.
  const { items, loop } = killLoops(tokens, opts.truncateOnAnyRepeat ?? true);
  return { items, removed, loop };
}

// ── Token helpers ─────────────────────────────────────────────
const NON_INCI_PAREN = /\(\s*(?:\*+|†+|organic|certified\s+organic|bio|natural|vegan|nano|plant[- ]derived|may\s+contain|\+\/-)\s*\)/gi;

export function cleanToken(t: string): string {
  let s = t
    .replace(NON_INCI_PAREN, ' ')
    .replace(/([A-Za-z0-9])\s*-\s*(\d)/g, '$1-$2')              // "PEG - 100"/"PEG -100" → "PEG-100", "C12 - 15" → "C12-15"
    .replace(/(\w)\s*\/\s*(\w)/g, '$1/$2')                      // "Caprylic / Capric"
    .replace(/\(\s+/g, '(').replace(/\s+\)/g, ')')              // "( Water )" → "(Water)"
    .replace(/[#^~`_=+<>{}\\@$!?"“”]/g, ' ')                    // symbols (keeps - / ( ) & . , ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/^[\s.,:\-–—&]+|[\s.,:\-–—&]+$/g, '');             // edge punctuation
  s = stripStrayLetters(s);
  s = balanceParens(s);
  return /[A-Za-z]{2}/.test(s) ? s : '';                        // must contain a real word
}

// "U vegetable o" → "vegetable" (then dropped as noise).
// Keeps "Vitamin E", "Coenzyme Q10", "D Panthenol", "L Arginine".
function stripStrayLetters(t: string): string {
  const w = t.split(' ');
  return w.filter((word, i) => {
    const core = word.replace(/[()[\],.]/g, '');
    if (!/^[A-Za-z]$/.test(core)) return true;
    if (/^\(?(?:pro)?vitamin$|^\(?coenzyme$/i.test(w[i - 1] ?? '')) return true;
    return i === 0 && /^[DL]$/.test(core) && w.length > 1;
  }).join(' ').trim();
}

function balanceParens(t: string): string {
  let depth = 0, out = '';
  for (const ch of t) {
    if (ch === '(') depth++;
    else if (ch === ')') { if (!depth) continue; depth--; }   // drop unmatched ")"
    out += ch;
  }
  return out + ')'.repeat(depth);                              // close unmatched "("
}

function isNoise(t: string): boolean {
  const words = t.split(/\s+/).map(w => w.replace(/[()[\]]/g, ''));
  if (words.every(w => !w || NOISE_WORD.test(w))) return true;            // "Wait", "let me check"
  if (words.length > MAX_WORDS_NO_HINT && !CHEM_HINT.test(t)) return true; // leaked sentence
  return false;
}

// ── Loop kill-switch ──────────────────────────────────────────
export const loopKey = (t: string): string => t.toLowerCase().replace(/[^a-z0-9]/g, '');

export function killLoops(tokens: string[], truncateOnAnyRepeat = true): { items: string[]; loop: LoopInfo } {
  const seen = new Set<string>();
  for (let i = 0; i < tokens.length; i++) {
    const k = loopKey(tokens[i]!);
    const adjacent = i > 0 && k === loopKey(tokens[i - 1]!);
    if (adjacent || (truncateOnAnyRepeat && seen.has(k))) {
      return {
        items: tokens.slice(0, i),
        loop: { detected: true, reason: adjacent ? 'adjacent' : 'repeat', at: i, item: tokens[i]!, droppedCount: tokens.length - i },
      };
    }
    seen.add(k);
  }
  return { items: tokens, loop: { detected: false } };
}
