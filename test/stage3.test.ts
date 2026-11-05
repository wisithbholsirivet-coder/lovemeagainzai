import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createResolver, digitSignature, ocrDigitFix } from '../src/stage3-resolve.ts';
import { MOCK_INCI_DB } from '../src/mock-db.ts';

const R = createResolver(MOCK_INCI_DB);
const name = (t: string): string => R.resolve(t).name;

test('exact match is case/space/hyphen-insensitive and returns DB spelling', () => {
  for (const [t, want] of [['SilICA', 'Silica'], ['iso hexadecane', 'Isohexadecane'], ['AQUA', 'Water'],
    ['Aqua (Water)', 'Water'], ['polysorbate60', 'Polysorbate 60'], ['Glycerine', 'Glycerin'], ['Iron Oxide', 'CI 77491']] as const) {
    const r = R.resolve(t);
    assert.equal(r.status, 'exact', t);
    assert.equal(r.name, want, t);
  }
});

test('fuzzy auto-corrects OCR typos', () => {
  for (const [t, want] of [
    ['lisohexdacne', 'Isohexadecane'], ['Octocryrene', 'Octocrylene'], ['Dimethylicone', 'Dimethicone'],
    ['Dimethione', 'Dimethicone'], ['Gliceryll Stearate', 'Glyceryl Stearate'], ['DIPROPILEGlycol', 'Dipropylene Glycol'],
    ['Phenylbenzmidiazole Sulfonic Acid', 'Phenylbenzimidazole Sulfonic Acid'], ['Niacinamid', 'Niacinamide'],
    ['Phenoxyethanoll', 'Phenoxyethanol'], ['Cetearyl Alchol', 'Cetearyl Alcohol'],
  ] as const) {
    const r = R.resolve(t);
    assert.equal(r.name, want, `${t} → ${r.name} (${r.status} ${r.score})`);
    assert.equal(r.status, 'fuzzy', t);
  }
});

test('OCR digit repair: O/l after a digit, never inside CI codes', () => {
  assert.equal(ocrDigitFix('PEG-1OO Stearate'), 'PEG-100 Stearate');
  assert.equal(ocrDigitFix('Ceteareth-2O'), 'Ceteareth-20');
  assert.equal(ocrDigitFix('Steareth-2l'), 'Steareth-21');
  assert.equal(ocrDigitFix('CI77891'), 'CI77891');
  assert.equal(digitSignature('C12-15 Alkyl Benzoate'), '12-15');
  assert.equal(name('PEG-1OO Stearate'), 'PEG-100 Stearate');
  assert.equal(name('Ceteareth-2O'), 'Ceteareth-20');
});

test('NUMERIC GUARD: near-miss with different numbers is rejected, not "corrected"', () => {
  for (const [t, wouldBe] of [
    ['PEG-10 Stearate', 'PEG-100 Stearate'],          // 1 edit away — the dangerous case
    ['PEG-4 Hydrogenated Castor Oil', 'PEG-40 Hydrogenated Castor Oil'],
    ['C13-15 Alkyl Benzoate', 'C12-15 Alkyl Benzoate'],
    ['C12-14 Isoparaffin', 'C13-14 Isoparaffin'],
    ['Polysorbate 65', null],
    ['Ceteareth-25', 'Ceteareth-20'],
    ['Steareth-20', null],
    ['CI 77892', 'CI 77891'],
  ] as const) {
    const r = R.resolve(t);
    assert.equal(r.status, 'unknown', `${t} must not resolve, got ${r.name}`);
    assert.equal(r.name, t);
    if (wouldBe) assert.deepEqual([r.rejected?.reason, r.rejected?.candidate], ['numeric-mismatch', wouldBe], t);
  }
});

test('numeric guard strict mode: digits lost by OCR → no guessing which PEG', () => {
  assert.equal(R.resolve('PEG Stearate').status, 'unknown');
  assert.equal(R.resolve('Polysorbate').status, 'unknown');
  const loose = createResolver(MOCK_INCI_DB, { numericGuard: 'tokenOnly' });
  assert.equal(loose.resolve('PEG-10 Stearate').status, 'unknown');   // token has digits → still guarded
});

test('typos inside numbered names still resolve when digits agree', () => {
  assert.equal(name('PEG-100 Stearrate'), 'PEG-100 Stearate');
  assert.equal(name('C12-15 Alkyl Benzoat'), 'C12-15 Alkyl Benzoate');
  assert.equal(name('Polysorbat 80'), 'Polysorbate 80');
});

test('negatives: marketing words / unknown chemicals are NOT forced onto an entry', () => {
  for (const t of ['Waterproof', 'Hydrating', 'Moisturizing', 'Brightening', 'Xyzzyplonk', 'Sodium Polyaspartate', 'Bakuchiol', 'Wait']) {
    const r = R.resolve(t);
    assert.equal(r.status, 'unknown', `${t} → ${r.name}`);
  }
});

test('ambiguity margin: equally-close candidates → unknown with reason', () => {
  const db = [{ inci: 'Sodium Lauryl Glutamate' }, { inci: 'Sodium Lauroyl Glutamate' }];
  const r = createResolver(db).resolve('Sodium Laur yl Glutamat');
  assert.equal(r.status, 'unknown');
});
