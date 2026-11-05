/* ════════════════════════════════════════════════════════════
   Stage 1 — Deterministic Ollama request for glm-ocr
   ════════════════════════════════════════════════════════════
   Goal: make the ~1B VLM as boring as possible.
     temperature 0 + fixed seed  → same image, same output
     repeat_penalty 1.5          → discourages re-emitting the list
     num_predict 200             → hard ceiling on runaway loops
     stop ["END_OF_LIST"]        → Ollama cuts generation at the marker
     keep_alive -1               → model stays pinned in VRAM between scans
   Stage 2 still assumes the model WILL misbehave; nothing here is trusted. */

export const OLLAMA_DEFAULTS = {
  url: 'http://127.0.0.1:11434/api/generate',
  model: 'glm-ocr',
  timeoutMs: 60_000,
  numPredict: 200,
} as const;

export const END_MARKER = 'END_OF_LIST';
export const NONE_MARKER = 'NO_INGREDIENTS_FOUND';

export const SYSTEM_PROMPT = `You are a strict INCI cosmetic-ingredient extractor reading a product label photo.

FIND the ingredient list: the block after "Ingredients:", "INGREDIENTS", "ส่วนประกอบ" or "成分". It is a dense comma-separated list of chemical names.

OUTPUT FORMAT (mandatory):
- One line. Ingredient names separated by ", " (comma + space). Nothing else.
- Use standard INCI spelling. Keep numbers, hyphens, slashes and parentheses that belong to a name: PEG-100 Stearate, Polysorbate 60, C12-15 Alkyl Benzoate, 1,2-Hexanediol, Aqua (Water), Caprylic/Capric Triglyceride, CI 77891.
- Each ingredient exactly once, in label order.
- After the last ingredient write ${END_MARKER} and stop.
- If the image has no ingredient list, write ${NONE_MARKER} and stop.

NEVER OUTPUT:
- Anything after the ingredient list ends (directions, warnings, manufacturer, address, phone, batch/lot, expiry dates, barcodes, volume).
- Marketing or "free-from" claims, in any language: "ไม่มี mineral oil", "ปราศจากพาราเบน", "Free from parabens", "No alcohol", "Paraben-free", "Dermatologically tested".
- Headers ("Ingredients:", "ส่วนประกอบ"), Thai/Chinese text, symbols, bullets, markdown, code fences.
- Your own words or thoughts: no "Wait", "Let me check", "Note:", "Here is", "Sure".
- The list a second time.`;

export const USER_PROMPT = `EXAMPLE 1
Label text: ส่วนประกอบ (Ingredients) : Aqua ( Water ), Octocryrene ; Iso hexadecane ， Silica。Dimethylicone, Gliceryll Stearate. ^ไม่มี mineral oil และ vegetable oil
Output: Aqua (Water), Octocrylene, Isohexadecane, Silica, Dimethicone, Glyceryl Stearate ${END_MARKER}

EXAMPLE 2
Label text: HydraGlow SPF50 Sunscreen. INGREDIENTS: Water, C12-15 Alkyl Benzoate, PEG - 100 Stearate, Polysorbate 60, 1,2-Hexanediol, Phenoxyethanol, Fragrance. Free from parabens & silicone. Directions: apply 15 minutes before sun exposure. Mfg. by ABC Co., Ltd. Tel 02-123-4567 EXP 12/2027 8850123456789 Wait
Output: Water, C12-15 Alkyl Benzoate, PEG-100 Stearate, Polysorbate 60, 1,2-Hexanediol, Phenoxyethanol, Fragrance ${END_MARKER}

Now read the image. Output ONLY the ingredient list in the same format:`;

export interface OllamaConfig {
  url?: string;
  model?: string;
  timeoutMs?: number;
  /** Token ceiling. 200 ≈ 45-60 INCI names; raise for very long labels. */
  numPredict?: number;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
}

export interface OllamaPayload {
  model: string;
  system: string;
  prompt: string;
  images: string[];
  stream: false;
  keep_alive: -1;
  options: {
    temperature: 0;
    seed: number;
    top_k: number;
    top_p: number;
    repeat_penalty: number;
    repeat_last_n: number;
    num_predict: number;
    stop: string[];
  };
}

export function buildOllamaPayload(imageBase64: string, cfg: OllamaConfig = {}): OllamaPayload {
  return {
    model: cfg.model ?? OLLAMA_DEFAULTS.model,
    system: SYSTEM_PROMPT,
    prompt: USER_PROMPT,
    images: [stripDataUrl(imageBase64)],
    stream: false,
    keep_alive: -1,                 // pin weights in VRAM; no reload per scan
    options: {
      temperature: 0,               // greedy decoding — no creative spelling
      seed: 42,                     // belt-and-braces determinism
      top_k: 1,
      top_p: 1,
      repeat_penalty: 1.5,          // break autoregressive loops
      repeat_last_n: 256,           // look back far enough to see a whole list
      num_predict: cfg.numPredict ?? OLLAMA_DEFAULTS.numPredict,
      stop: [END_MARKER],           // server-side hard stop at the marker
    },
  };
}

export interface OllamaResult {
  raw: string;
  /** true when generation hit num_predict — list may be cut short. */
  truncated: boolean;
  noIngredients: boolean;
  evalCount: number | null;
  durationMs: number;
}

export class OllamaError extends Error {
  readonly kind: 'timeout' | 'unreachable' | 'http';
  constructor(kind: 'timeout' | 'unreachable' | 'http', message: string) {
    super(message);
    this.name = 'OllamaError';
    this.kind = kind;
  }
}

export async function runOllamaOCR(imageBase64: string, cfg: OllamaConfig = {}): Promise<OllamaResult> {
  const doFetch = cfg.fetchImpl ?? fetch;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs ?? OLLAMA_DEFAULTS.timeoutMs);
  const t0 = Date.now();

  let res: Response;
  try {
    res = await doFetch(cfg.url ?? OLLAMA_DEFAULTS.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildOllamaPayload(imageBase64, cfg)),
      signal: ctrl.signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new OllamaError('timeout', `glm-ocr timed out after ${cfg.timeoutMs ?? OLLAMA_DEFAULTS.timeoutMs} ms`);
    }
    throw new OllamaError('unreachable', 'Ollama unreachable — is `ollama serve` running?');
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new OllamaError('http', `Ollama HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as { response?: string; done_reason?: string; eval_count?: number };
  const raw = (data.response ?? '').trim();
  return {
    raw,
    truncated: data.done_reason === 'length',
    noIngredients: raw.includes(NONE_MARKER),
    evalCount: typeof data.eval_count === 'number' ? data.eval_count : null,
    durationMs: Date.now() - t0,
  };
}

function stripDataUrl(b64: string): string {
  const i = b64.indexOf('base64,');
  return i === -1 ? b64 : b64.slice(i + 7);
}
