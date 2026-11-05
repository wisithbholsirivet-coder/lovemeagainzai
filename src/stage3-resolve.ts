/* ════════════════════════════════════════════════════════════
   Stage 3 — Fuzzy INCI resolver (Fuse.js) + numeric guard
   ════════════════════════════════════════════════════════════
   Pipeline per token:
     0. OCR digit repair      "PEG-1OO" → "PEG-100", "Ceteareth-2O" → "Ceteareth-20"
     1. Exact compact lookup  case/space/hyphen-insensitive, plural fallback ("SilICA" → Silica)
     2. Fuse.js retrieval     top-N candidates (recall only — Fuse scores are not trusted alone)
     3. Deterministic verify  OCR-tolerant similarity + length ratio
     4. NUMERIC GUARD         digits must match exactly ("PEG-10" ≠ "PEG-100")
     5. Ambiguity margin      winner must clearly beat the next *different* ingredient
   Anything that fails stays as typed and is flagged "unknown" — in a safety app,
   "unknown" is recoverable; the wrong chemical's safety colour is not.        */

import Fuse from 'fuse.js';

export type Risk = 'green' | 'yellow' | 'red' | 'unknown';

export interface IngredientRecord {
  inci: string;
  aliases?: string[];
  category?: string;
  risk?: Risk;
}

export type RejectReason = 'numeric-mismatch' | 'ambiguous' | 'low-score';

export interface Resolution {
  input: string;
  /** Name to render: DB INCI name when matched, else the cleaned input. */
  name: string;
  status: 'exact' | 'fuzzy' | 'unknown';
  /** 1 for exact; verifier similarity (0-1) otherwise. */
  score: number;
  record: IngredientRecord | null;
  matchedAlias?: string;
  /** Why the closest candidate was NOT accepted (audit / "Did you mean?"). */
  rejected?: { candidate: string; reason: RejectReason; score: number };
}

export interface ResolverOptions {
  /** Fuse.js threshold for candidate retrieval (0 = exact … 1 = anything). */
  fuseThreshold?: number;
  candidateLimit?: number;
  /** Acceptance for names ≥ 8 compact chars (blended OCR score). */
  minScore?: number;
  /** Acceptance for 4–7 chars (plain edit ratio — short words need stricter rules). */
  minScoreShort?: number;
  margin?: number;
  /**
   * strict    — digits must match whenever EITHER side has digits (default):
   *             "PEG Stearate" will not be guessed as PEG-8 / PEG-100.
   * tokenOnly — only when the OCR token has digits (literal spec).
   * off       — no numeric validation.
   */
  numericGuard?: 'strict' | 'tokenOnly' | 'off';
}

const DEFAULTS: Required<ResolverOptions> = {
  fuseThreshold: 0.5,
  candidateLimit: 12,
  minScore: 0.8,
  minScoreShort: 0.86,
  margin: 0.05,
  numericGuard: 'strict',
};

// ── String helpers ────────────────────────────────────────────
export const compact = (s: string): string =>
  s.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g, '');

/** OCR letter↔digit confusions, only directly after a digit. Iterates so "1OO" → "100".
 *  Lookbehind-only on purpose: "CI77891" must not become "C177891". */
export function ocrDigitFix(s: string): string {
  let prev: string, t = s;
  do { prev = t; t = t.replace(/(?<=\d)[Oo]/g, '0').replace(/(?<=\d)[lI|]/g, '1'); } while (t !== prev);
  return t;
}

/** "C12-15 Alkyl Benzoate" → "12-15", "PEG-100 Stearate" → "100", "Water" → "". */
export const digitSignature = (s: string): string => (ocrDigitFix(s).match(/\d+/g) ?? []).join('-');

function numericOk(tokenDigits: string, candDigits: string, mode: ResolverOptions['numericGuard']): boolean {
  if (mode === 'off') return true;
  if (mode === 'tokenOnly' && !tokenDigits) return true;
  return tokenDigits === candDigits;
}

// ── Similarity (OCR-tolerant) ─────────────────────────────────
// Plain Levenshtein punishes scrambles: "lisohexdacne"→"isohexadecane" = 4 edits (69%).
// Blend: OSA (edits + adjacent swaps) · Jaro (order) · letter-bag Dice (scrambles).
export function osa(a: string, b: string): number {
  const m = a.length, n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2]![j - 2]! + 1);
      d[i]![j] = v;
    }
  }
  return d[m]![n]!;
}

export function jaro(a: string, b: string): number {
  if (a === b) return 1;
  const win = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const aM = new Array<boolean>(a.length).fill(false), bM = new Array<boolean>(b.length).fill(false);
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

export function bagDice(a: string, b: string): number {
  const cnt = new Map<string, number>();
  for (const ch of a) cnt.set(ch, (cnt.get(ch) ?? 0) + 1);
  let common = 0;
  for (const ch of b) { const c = cnt.get(ch) ?? 0; if (c > 0) { cnt.set(ch, c - 1); common++; } }
  return (2 * common) / (a.length + b.length);
}

export const editRatio = (a: string, b: string): number => 1 - osa(a, b) / Math.max(a.length, b.length, 1);

export const ocrScore = (a: string, b: string): number =>
  0.4 * editRatio(a, b) + 0.3 * jaro(a, b) + 0.3 * bagDice(a, b);

// ── Resolver ──────────────────────────────────────────────────
interface Entry { name: string; compact: string; digits: string; rec: IngredientRecord }

export interface Resolver {
  resolve(token: string): Resolution;
  resolveAll(tokens: string[]): Resolution[];
  readonly size: number;
}

export function createResolver(db: IngredientRecord[], options: ResolverOptions = {}): Resolver {
  const opt = { ...DEFAULTS, ...options };
  const entries: Entry[] = [];
  const exact = new Map<string, Entry>();

  for (const rec of db) {
    for (const name of [rec.inci, ...(rec.aliases ?? [])]) {
      const c = compact(name);
      if (c.length < 2) continue;
      const e: Entry = { name, compact: c, digits: digitSignature(name), rec };
      entries.push(e);
      if (!exact.has(c)) exact.set(c, e);          // INCI inserted first → wins collisions
    }
  }

  const fuse = new Fuse(entries, {
    keys: ['compact'],
    includeScore: true,
    threshold: opt.fuseThreshold,
    ignoreLocation: true,        // OCR junk can sit anywhere in the token
    minMatchCharLength: 2,
    shouldSort: true,
  });

  const lookupExact = (c: string): Entry | undefined =>
    exact.get(c)
    ?? (c.endsWith('es') ? exact.get(c.slice(0, -2)) : undefined)
    ?? (c.endsWith('s') ? exact.get(c.slice(0, -1)) : undefined);

  function resolve(token: string): Resolution {
    const input = token.trim();
    const fixed = ocrDigitFix(input);
    const c = compact(fixed);
    const unknown = (extra: Partial<Resolution> = {}): Resolution =>
      ({ input, name: fixed, status: 'unknown', score: 0, record: null, ...extra });

    if (c.length < 2) return unknown();

    // 1. Exact
    const hit = lookupExact(c);
    if (hit) return { input, name: hit.rec.inci, status: 'exact', score: 1, record: hit.rec, matchedAlias: hit.name };
    if (c.length < 4) return unknown();

    // 2. Fuse retrieval (+ a stray-leading-glyph variant: glm-ocr often prefixes "l"/"i")
    const variants = /^[li1]/.test(c) && c.length >= 9 ? [c, c.slice(1)] : [c];
    const cands = new Map<Entry, number>();
    for (const v of variants) {
      for (const r of fuse.search(v, { limit: opt.candidateLimit })) {
        const e = r.item;
        const lenRatio = Math.min(v.length, e.compact.length) / Math.max(v.length, e.compact.length);
        if (lenRatio < 0.65) continue;                                   // "hydrating" ⊂ "hydratedsilica"
        const s = v.length >= 8 ? ocrScore(v, e.compact) : editRatio(v, e.compact);
        if (s > (cands.get(e) ?? -1)) cands.set(e, s);
      }
    }

    // 3-5. Verify: numeric guard, threshold, margin
    const tokDigits = digitSignature(fixed);
    const need = c.length >= 8 ? opt.minScore : opt.minScoreShort;
    let best: { e: Entry; s: number } | null = null;
    let numericReject: { e: Entry; s: number } | null = null;
    for (const [e, s] of cands) {
      if (!numericOk(tokDigits, e.digits, opt.numericGuard)) {
        if (!numericReject || s > numericReject.s) numericReject = { e, s };
        continue;
      }
      if (!best || s > best.s) best = { e, s };
    }
    let second = 0;
    if (best) for (const [e, s] of cands) {
      if (e.rec !== best.e.rec && numericOk(tokDigits, e.digits, opt.numericGuard)) second = Math.max(second, s);
    }

    if (best && best.s >= need && best.s - second >= opt.margin) {
      return { input, name: best.e.rec.inci, status: 'fuzzy', score: round(best.s), record: best.e.rec, matchedAlias: best.e.name };
    }

    // Explain the miss — the strongest reason wins.
    if (numericReject && numericReject.s >= need && (!best || numericReject.s >= best.s)) {
      return unknown({ score: round(numericReject.s), rejected: { candidate: numericReject.e.rec.inci, reason: 'numeric-mismatch', score: round(numericReject.s) } });
    }
    if (best && best.s >= need) {
      return unknown({ score: round(best.s), rejected: { candidate: best.e.rec.inci, reason: 'ambiguous', score: round(best.s) } });
    }
    if (best) return unknown({ score: round(best.s), rejected: { candidate: best.e.rec.inci, reason: 'low-score', score: round(best.s) } });
    return unknown();
  }

  return {
    resolve,
    resolveAll: tokens => tokens.map(resolve),
    get size() { return entries.length; },
  };
}

const round = (x: number): number => Math.round(x * 1000) / 1000;

// ── Adapter for the existing ChaeCheck data/*.json format ────
// { names: [primary, ...aliases], risk, category } → IngredientRecord
export interface ChaeCheckRow { names: string[]; risk?: string; category?: string }

export function fromChaeCheckJson(rows: ChaeCheckRow[]): IngredientRecord[] {
  return rows.filter(r => r.names?.length).map(r => {
    const primary = r.names[0]!;
    // Prefer a proper-case spelling of the primary name ("ECTOIN" → "Ectoin" if an alias has it).
    const pc = r.names.find(n => n !== n.toUpperCase() && compact(n) === compact(primary));
    const risk = (['green', 'yellow', 'red'] as const).find(x => x === r.risk) ?? 'unknown';
    return { inci: pc ?? primary, aliases: r.names.filter(n => n !== (pc ?? primary)), category: r.category, risk };
  });
}
