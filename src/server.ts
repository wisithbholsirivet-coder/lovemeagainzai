/* Minimal local API. Privacy-first: binds to 127.0.0.1 only, no external calls,
   images are processed in memory and never written to disk.

   POST /api/scan   { "image": "<base64 or data URL>" }   → PipelineResult
   POST /api/text   { "text":  "<raw ingredient text>" }  → Stage 2+3 only
   GET  /api/health

   Env: PORT (8787), CHAECHECK_DB (path to data/ dir; default = mock DB),
        OLLAMA_URL, OLLAMA_MODEL, OLLAMA_NUM_PREDICT, ALLOW_ORIGIN (http://localhost:8765) */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { processLabel, processText } from './pipeline.ts';
import { createResolver, fromChaeCheckJson, type IngredientRecord, type ChaeCheckRow } from './stage3-resolve.ts';
import { MOCK_INCI_DB } from './mock-db.ts';
import { OllamaError } from './stage1-ollama.ts';

const PORT = Number(process.env.PORT ?? 8787);
const ORIGIN = process.env.ALLOW_ORIGIN ?? 'http://localhost:8765';
const MAX_BODY = 15 * 1024 * 1024;

function loadDb(): IngredientRecord[] {
  const dir = process.env.CHAECHECK_DB;
  if (!dir) return MOCK_INCI_DB;
  const rows: ChaeCheckRow[] = readdirSync(dir)
    .filter(f => /^ingredients_.*\.json$/.test(f))
    .flatMap(f => JSON.parse(readFileSync(join(dir, f), 'utf8')) as ChaeCheckRow[]);
  return fromChaeCheckJson(rows);
}

const resolver = createResolver(loadDb());
const ollama = {
  url: process.env.OLLAMA_URL,
  model: process.env.OLLAMA_MODEL,
  numPredict: process.env.OLLAMA_NUM_PREDICT ? Number(process.env.OLLAMA_NUM_PREDICT) : undefined,
};

function send(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > MAX_BODY) throw Object.assign(new Error('Payload too large'), { status: 413 });
    chunks.push(c as Buffer);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>; }
  catch { throw Object.assign(new Error('Invalid JSON'), { status: 400 }); }
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return send(res, 204, null);
    if (req.method === 'GET' && req.url === '/api/health') return send(res, 200, { ok: true, dbEntries: resolver.size });

    if (req.method === 'POST' && req.url === '/api/scan') {
      const { image } = await readJson(req);
      if (typeof image !== 'string' || image.length < 100) return send(res, 400, { error: 'Field "image" (base64) required' });
      return send(res, 200, await processLabel(image, { resolver, ollama }));
    }
    if (req.method === 'POST' && req.url === '/api/text') {
      const { text } = await readJson(req);
      if (typeof text !== 'string') return send(res, 400, { error: 'Field "text" required' });
      return send(res, 200, processText(text, { resolver }));
    }
    return send(res, 404, { error: 'Not found' });
  } catch (err) {
    if (err instanceof OllamaError) return send(res, err.kind === 'timeout' ? 504 : 502, { error: err.message, kind: err.kind });
    const status = (err as { status?: number }).status ?? 500;
    return send(res, status, { error: status === 500 ? 'Internal error' : (err as Error).message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[chaecheck] pipeline API on http://127.0.0.1:${PORT}  (DB entries: ${resolver.size})`);
});
