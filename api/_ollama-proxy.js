/* Shared Ollama proxy — used by the Vercel Function (api/ocr.js) and the
   local Node server (server/src/server.ts). Files starting with "_" in /api
   are NOT deployed as functions by Vercel.

   Why a proxy: the browser on a phone cannot reach the PC's Ollama.
     - "http://localhost:11434" on a phone = the phone itself
     - an HTTPS page (Vercel) may not call plain-HTTP URLs (mixed content)
   So the browser calls same-origin /api/ocr; this code forwards to OLLAMA_URL
   (localhost on the PC, or a Cloudflare/ngrok HTTPS tunnel when on Vercel).

   Hardening: Ollama has no auth, so the client can NOT pick the model, stream,
   or hit other Ollama endpoints (pull/delete). Only /api/generate with one
   image and a whitelisted option set is forwarded.

   Env:
     OLLAMA_URL              base URL, e.g. http://127.0.0.1:11434 or https://ocr.example.com
     OLLAMA_MODEL            default glm-ocr
     CF_ACCESS_CLIENT_ID     } Cloudflare Access service token (recommended for tunnels)
     CF_ACCESS_CLIENT_SECRET }
     OLLAMA_BASIC_AUTH       user:pass  (ngrok --basic-auth)
     OLLAMA_TIMEOUT_MS       default 55000                                         */

const OPTION_WHITELIST = ['temperature', 'seed', 'top_k', 'top_p', 'repeat_penalty',
  'repeat_last_n', 'num_predict', 'stop', 'penalize_newline'];
export const MAX_IMAGE_B64 = 6 * 1024 * 1024;   // ~4.5 MB binary

/** @param {Record<string,string|undefined>} env */
export function proxyConfig(env) {
  const url = (env.OLLAMA_URL || '').replace(/\/+$/, '');
  return {
    url,
    model: env.OLLAMA_MODEL || 'glm-ocr',
    timeoutMs: Number(env.OLLAMA_TIMEOUT_MS) || 55_000,
    headers: upstreamHeaders(env),
    via: !url ? 'unconfigured' : /\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(url) ? 'local' : 'tunnel',
  };
}

/** @param {Record<string,string|undefined>} env */
function upstreamHeaders(env) {
  /** @type {Record<string,string>} */
  const h = { 'Content-Type': 'application/json' };
  if (env.CF_ACCESS_CLIENT_ID && env.CF_ACCESS_CLIENT_SECRET) {
    h['CF-Access-Client-Id'] = env.CF_ACCESS_CLIENT_ID;
    h['CF-Access-Client-Secret'] = env.CF_ACCESS_CLIENT_SECRET;
  }
  if (env.OLLAMA_BASIC_AUTH) h.Authorization = 'Basic ' + Buffer.from(env.OLLAMA_BASIC_AUTH).toString('base64');
  return h;
}

/**
 * Validate the browser's payload and rebuild a safe one.
 * @param {any} body
 * @param {string} model
 * @returns {{ ok: true, payload: object } | { ok: false, status: number, error: string, code: string }}
 */
export function buildSafePayload(body, model) {
  if (!body || typeof body !== 'object') return { ok: false, status: 400, code: 'bad_request', error: 'JSON body required' };
  const images = body.images;
  if (!Array.isArray(images) || images.length !== 1 || typeof images[0] !== 'string' || images[0].length < 100) {
    return { ok: false, status: 400, code: 'bad_request', error: 'Exactly one base64 image required in "images"' };
  }
  if (images[0].length > MAX_IMAGE_B64) {
    return { ok: false, status: 413, code: 'image_too_large', error: `Image too large (${(images[0].length / 1048576).toFixed(1)} MB base64, max ${MAX_IMAGE_B64 / 1048576} MB)` };
  }
  /** @type {Record<string, unknown>} */
  const options = {};
  for (const k of OPTION_WHITELIST) if (body.options && body.options[k] !== undefined) options[k] = body.options[k];
  options.num_predict = Math.min(Math.max(Number(options.num_predict) || 768, 1), 1024);
  return {
    ok: true,
    payload: {
      model,
      system: typeof body.system === 'string' ? body.system.slice(0, 8000) : undefined,
      prompt: typeof body.prompt === 'string' ? body.prompt.slice(0, 8000) : '',
      images: [images[0].replace(/^data:[^,]*,/, '')],
      stream: false,
      keep_alive: -1,
      options,
    },
  };
}

/**
 * Forward one OCR request. Never throws — always returns an HTTP-shaped result.
 * @param {any} body  parsed JSON from the browser (Ollama /api/generate shape)
 * @param {Record<string,string|undefined>} env
 * @param {typeof fetch} [fetchImpl]
 * @returns {Promise<{ status: number, body: any, engine: string }>}
 */
export async function proxyGenerate(body, env, fetchImpl = fetch) {
  const cfg = proxyConfig(env);
  const engine = `${cfg.model} (Ollama via ${cfg.via} proxy)`;
  if (!cfg.url) {
    return { status: 503, engine, body: { code: 'proxy_not_configured', error: 'OLLAMA_URL is not set on the server — see .env.example' } };
  }
  const safe = buildSafePayload(body, cfg.model);
  if (!safe.ok) return { status: safe.status, engine, body: { code: safe.code, error: safe.error } };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
  try {
    const r = await fetchImpl(`${cfg.url}/api/generate`, {
      method: 'POST', headers: cfg.headers, body: JSON.stringify(safe.payload), signal: ctrl.signal,
    });
    const text = await r.text();
    if (!r.ok) {
      return { status: r.status === 404 ? 502 : r.status, engine,
        body: { code: 'ollama_http', error: `Ollama answered HTTP ${r.status}`, detail: hint(r.status, text) } };
    }
    try { return { status: 200, engine, body: JSON.parse(text) }; }
    catch { return { status: 502, engine, body: { code: 'ollama_bad_response', error: 'Upstream did not return JSON (tunnel login page?)', detail: text.slice(0, 200) } }; }
  } catch (err) {
    const timeout = /** @type {Error} */ (err).name === 'AbortError';
    return { status: timeout ? 504 : 502, engine, body: {
      code: timeout ? 'ollama_timeout' : 'ollama_unreachable',
      error: timeout ? `Ollama did not answer within ${cfg.timeoutMs / 1000}s` : 'Proxy could not reach Ollama — is the PC on, Ollama running, and the tunnel up?',
      detail: String(/** @type {Error} */ (err).cause?.code || /** @type {Error} */ (err).message || err),
    } };
  } finally {
    clearTimeout(timer);
  }
}

/** GET /api/ocr health probe: is Ollama reachable and is the model installed? */
export async function proxyHealth(env, fetchImpl = fetch) {
  const cfg = proxyConfig(env);
  const base = { model: cfg.model, via: cfg.via, engine: `${cfg.model} (Ollama via ${cfg.via} proxy)` };
  if (!cfg.url) return { status: 503, body: { ok: false, ...base, code: 'proxy_not_configured', error: 'OLLAMA_URL is not set on the server' } };
  try {
    const r = await fetchImpl(`${cfg.url}/api/tags`, { headers: cfg.headers, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return { status: 502, body: { ok: false, ...base, code: 'ollama_http', error: `Ollama answered HTTP ${r.status}`, detail: hint(r.status, '') } };
    const data = await r.json();
    const hasModel = (data.models || []).some((/** @type {{name:string}} */ m) => m.name.startsWith(cfg.model));
    return { status: 200, body: { ok: hasModel, ...base, ...(hasModel ? {} : { code: 'model_missing', error: `Run on the PC: ollama pull ${cfg.model}` }) } };
  } catch (err) {
    return { status: 502, body: { ok: false, ...base, code: 'ollama_unreachable', error: 'Proxy could not reach Ollama',
      detail: String(/** @type {Error} */ (err).cause?.code || /** @type {Error} */ (err).message) } };
  }
}

/** @param {number} status @param {string} text */
function hint(status, text) {
  if (status === 403) return 'Ollama rejected the Host header — start the tunnel with --http-host-header localhost:11434 (cloudflared) or --host-header=localhost:11434 (ngrok). ' + text.slice(0, 120);
  if (status === 401) return 'Tunnel auth failed — check CF_ACCESS_CLIENT_ID/SECRET or OLLAMA_BASIC_AUTH.';
  if (status === 404) return 'Model not found — run: ollama pull glm-ocr. ' + text.slice(0, 120);
  if (status === 530 || status === 1033) return 'Cloudflare tunnel is down — restart cloudflared on the PC.';
  return text.slice(0, 200);
}
