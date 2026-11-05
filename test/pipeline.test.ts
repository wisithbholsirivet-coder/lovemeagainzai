import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { processLabel, processText } from '../src/pipeline.ts';
import { buildOllamaPayload, SYSTEM_PROMPT, USER_PROMPT, OllamaError } from '../src/stage1-ollama.ts';
import { createResolver, fromChaeCheckJson, type ChaeCheckRow } from '../src/stage3-resolve.ts';
import { MOCK_INCI_DB } from '../src/mock-db.ts';

const resolver = createResolver(MOCK_INCI_DB);

test('Stage 1 payload: deterministic params, VRAM pin, stop marker', () => {
  const p = buildOllamaPayload('data:image/jpeg;base64,QUJD');
  assert.equal(p.keep_alive, -1);
  assert.equal(p.stream, false);
  assert.deepEqual(p.images, ['QUJD']);
  assert.equal(p.options.temperature, 0);
  assert.equal(p.options.repeat_penalty, 1.5);
  assert.equal(p.options.num_predict, 200);
  assert.deepEqual(p.options.stop, ['END_OF_LIST']);
  assert.match(SYSTEM_PROMPT, /Wait/);
  assert.equal((USER_PROMPT.match(/^EXAMPLE \d/gm) ?? []).length, 2);
});

function mockFetch(response: string, done_reason = 'stop') {
  const calls: unknown[] = [];
  const fetchImpl = (async (_url: string, init: RequestInit) => {
    calls.push(JSON.parse(String(init.body)));
    return new Response(JSON.stringify({ response, done_reason, eval_count: 99 }), { status: 200 });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

test('end-to-end: looping, claim-laden, misspelled VLM output → clean verified list', async () => {
  const raw = 'Wait, ส่วนประกอบ (Ingredients) : Aqua ( Water ), Octocryrene ; lisohexdacne ， SilICA。 Dimethylicone, ' +
    'PEG - 1OO Stearate, Fragrance. ^ไม่มี mineral oil และ vegetable oil, Aqua (Water), Octocrylene, Isohexadecane, Silica';
  const { fetchImpl, calls } = mockFetch(raw);
  const r = await processLabel('QUJD', { resolver, ollama: { fetchImpl } });

  assert.deepEqual(r.ingredients.map(i => i.name),
    ['Water', 'Octocrylene', 'Isohexadecane', 'Silica', 'Dimethicone', 'PEG-100 Stearate', 'Fragrance']);
  assert.ok(r.ingredients.every(i => i.status !== 'unknown'));
  assert.ok(r.audit.loop.detected, 'loop should be detected');
  assert.ok(r.audit.removed.some(x => /mineral oil/.test(x)));
  assert.equal((calls[0] as { options: { num_predict: number } }).options.num_predict, 200);
});

test('post-resolve loop: model repeats list with DIFFERENT typos', () => {
  const r = processText('Aqua, Dimethylicone, Octocryrene, Water, Dimethicone, Octocrylene', { resolver });
  assert.deepEqual(r.ingredients.map(i => i.name), ['Water', 'Dimethicone', 'Octocrylene']);
  assert.ok(r.audit.postResolveLoop.detected);
});

test('token limit hit without loop → incompleteness warning', async () => {
  const { fetchImpl } = mockFetch('Aqua, Glycerin, Niacinamide', 'length');
  const r = await processLabel('QUJD', { resolver, ollama: { fetchImpl } });
  assert.ok(r.audit.truncated);
  assert.match(r.warnings[0] ?? '', /token limit/);
});

test('NO_INGREDIENTS_FOUND → empty result, warning', async () => {
  const { fetchImpl } = mockFetch('NO_INGREDIENTS_FOUND');
  const r = await processLabel('QUJD', { resolver, ollama: { fetchImpl } });
  assert.deepEqual(r.ingredients, []);
  assert.match(r.warnings[0] ?? '', /No ingredient list/);
});

test('Ollama down → typed OllamaError', async () => {
  const fetchImpl = (async () => { throw new TypeError('fetch failed'); }) as unknown as typeof fetch;
  await assert.rejects(processLabel('QUJD', { resolver, ollama: { fetchImpl } }),
    (e: unknown) => e instanceof OllamaError && e.kind === 'unreachable');
});

// ── Same resolver against the real 2,408-entry ChaeCheck DB ──
const DATA = join(import.meta.dirname, '..', '..', 'data');
test('real ChaeCheck DB: typo fixes + numeric guard at scale', { skip: !existsSync(DATA) }, () => {
  const rows = readdirSync(DATA).filter(f => /^ingredients_.*\.json$/.test(f))
    .flatMap(f => JSON.parse(readFileSync(join(DATA, f), 'utf8')) as ChaeCheckRow[]);
  const real = createResolver(fromChaeCheckJson(rows));
  assert.ok(real.size > 2000);
  for (const [t, want] of [['lisohexdacne', 'isohexadecane'], ['SilICA', 'silica'], ['Octocryrene', 'octocrylene'],
    ['Dimethylicone', 'dimethicone'], ['PEG-1OO Stearate', 'peg-100 stearate']] as const) {
    assert.equal(real.resolve(t).name.toLowerCase(), want, t);
  }
  for (const t of ['PEG-10 Stearate', 'Waterproof', 'Hydrating']) {
    const r = real.resolve(t);
    assert.ok(r.status === 'unknown' || r.name.toLowerCase() === t.toLowerCase(), `${t} → ${r.name}`);
  }
});
