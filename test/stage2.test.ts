import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitize, killLoops } from '../src/stage2-sanitize.ts';

const items = (raw: string): string[] => sanitize(raw).items;

test('delimiters: period, semicolon, full-width comma, ideographic comma, newline → comma', () => {
  assert.deepEqual(items('Aqua. Glycerin; Niacinamide，Silica、Dimethicone\nFragrance'),
    ['Aqua', 'Glycerin', 'Niacinamide', 'Silica', 'Dimethicone', 'Fragrance']);
});

test('INCI characters preserved: hyphens, numbers, parens, slashes, digit-commas', () => {
  const list = 'PEG-100 Stearate, Polysorbate 60, C12-15 Alkyl Benzoate, 1,2-Hexanediol, CI 77891, Aqua (Water), Caprylic/Capric Triglyceride, FD&C Yellow No. 5';
  assert.deepEqual(items(list), list.split(/, (?!\d)/));
});

test('spaced hyphens and padded parens repaired', () => {
  assert.deepEqual(items('PEG - 100 Stearate, C12 -15 Alkyl Benzoate, Aqua ( Water ), Caprylic / Capric Triglyceride'),
    ['PEG-100 Stearate', 'C12-15 Alkyl Benzoate', 'Aqua (Water)', 'Caprylic/Capric Triglyceride']);
});

test('percentages and non-INCI parentheticals stripped', () => {
  assert.deepEqual(items('Niacinamide (5%), Glycerin 3 %, Aloe Barbadensis Leaf Juice (organic), Squalane*'),
    ['Niacinamide', 'Glycerin', 'Aloe Barbadensis Leaf Juice', 'Squalane']);
});

test('Thai negative claims purged, incl. "^" prefix and zero-width spaces', () => {
  for (const raw of [
    'Aqua, Glycerin. ไม่มี mineral oil และ vegetable oil',
    'Aqua, Glycerin. ^ไม่มี mineral oil และ vegetable oil',
    'Aqua, Glycerin. ไม่มี\u200Bmineral\u200Boil',
    'Aqua, Glycerin, ปราศจาก paraben',
  ]) {
    const r = sanitize(raw);
    assert.deepEqual(r.items, ['Aqua', 'Glycerin'], raw);
    assert.ok(r.removed.some(x => /mineral|paraben/i.test(x)), `audit should record claim: ${raw}`);
  }
});

test('English negative claims purged: free from / no / without / suffix -free / chains', () => {
  assert.deepEqual(items('Aqua, Glycerin. Free from parabens, alcohol and silicone.'), ['Aqua', 'Glycerin']);
  assert.deepEqual(items('Aqua, Glycerin. No alcohol. Paraben-free. Silicone Free'), ['Aqua', 'Glycerin']);
  assert.deepEqual(items('Aqua, Glycerin, without mineral oil, 0% alcohol'), ['Aqua', 'Glycerin']);
  assert.deepEqual(items('Aqua, Glycerin. Paraben & Sulfate Free. Dermatologically tested'), ['Aqua', 'Glycerin']);
});

test('claims never eat real ingredients', () => {
  const real = ['Mineral Oil', 'Cetearyl Alcohol', 'Alcohol Denat', 'Lanolin Alcohol', 'Benzyl Alcohol',
    'Methylparaben', 'Cyclopentasiloxane', 'Nonoxynol-9', 'Paraffinum Liquidum', 'Fragrance'];
  assert.deepEqual(items(real.join(', ')), real);
  // claim chain must stop before a real ingredient that follows a comma
  assert.deepEqual(items('Free from parabens, Alcohol Denat., Glycerin'), ['Alcohol Denat', 'Glycerin']);
});

test('uncropped packaging: header, brand, directions, manufacturer, expiry, barcode', () => {
  const raw = 'HydraGlow SPF50 PA++++ Sunscreen 8850123456789\nINGREDIENTS: Water, Homosalate, Octocrylene, Glycerin.\n' +
    'Directions: apply 15 minutes before sun exposure. Mfg. by ABC Co., Ltd. Tel 02-123-4567 EXP 12/2027';
  assert.deepEqual(items(raw), ['Water', 'Homosalate', 'Octocrylene', 'Glycerin']);
  assert.deepEqual(items('Ingredients: Aqua, Panthenol. EXP 12/2027 Lot ABC123'), ['Aqua', 'Panthenol']);
  assert.deepEqual(items('ส่วนประกอบ (Ingredients) : Aqua, Cetearyl Alcohol. วิธีใช้ ทาบางๆ'), ['Aqua', 'Cetearyl Alcohol']);
});

test('UI chatter, markdown, stray letters dropped; legit single letters kept', () => {
  assert.deepEqual(items('```markdown\nWait, Aqua, U vegetable o, Glycerin, Wait, let me check, Silica\n```'),
    ['Aqua', 'Glycerin', 'Silica']);
  assert.deepEqual(items('Tocopherol (Vitamin E), D Panthenol, Coenzyme Q10'),
    ['Tocopherol (Vitamin E)', 'D Panthenol', 'Coenzyme Q10']);
});

test('blend separator "(and)" splits', () => {
  assert.deepEqual(items('Silica (and) Dimethicone, Water'), ['Silica', 'Dimethicone', 'Water']);
});

test('END_OF_LIST marker and second header (loop restart) cut output', () => {
  assert.deepEqual(items('Aqua, Glycerin END_OF_LIST Aqua, Glycerin'), ['Aqua', 'Glycerin']);
  assert.deepEqual(items('Ingredients: Aqua, Glycerin, Ingredients: Aqua, Glycerin'), ['Aqua', 'Glycerin']);
});

test('loop kill-switch: adjacent duplicate truncates', () => {
  const r = sanitize('Aqua, Glycerin, Glycerin, Glycerin, Silica');
  assert.deepEqual(r.items, ['Aqua', 'Glycerin']);
  assert.equal(r.loop.reason, 'adjacent');
  assert.equal(r.loop.droppedCount, 3);
});

test('loop kill-switch: whole-list restart truncates (case/space-insensitive)', () => {
  const list = 'Aqua, Glycerin, Niacinamide, Fragrance';
  const r = sanitize(`${list}, ${list.toUpperCase()}, ${list}, ${list}`);
  assert.deepEqual(r.items, ['Aqua', 'Glycerin', 'Niacinamide', 'Fragrance']);
  assert.equal(r.loop.reason, 'repeat');
});

test('loop kill-switch: adjacent-only mode keeps non-adjacent repeats', () => {
  assert.deepEqual(killLoops(['A', 'B', 'A'], false).items, ['A', 'B', 'A']);
  assert.deepEqual(killLoops(['A', 'B', 'B'], false).items, ['A', 'B']);
});

test('empty / garbage input is safe', () => {
  assert.deepEqual(items(''), []);
  assert.deepEqual(items('NO_INGREDIENTS_FOUND'), []);
  assert.deepEqual(items('!!! ### ... ,,,'), []);
});
