/* Orchestrator: image → Stage 1 → Stage 2 → Stage 3 → database-ready ingredients. */

import { runOllamaOCR, type OllamaConfig } from './stage1-ollama.ts';
import { sanitize, killLoops, loopKey, type LoopInfo, type SanitizeOptions } from './stage2-sanitize.ts';
import type { Resolution, Resolver } from './stage3-resolve.ts';

export interface PipelineResult {
  ingredients: Resolution[];
  warnings: string[];
  audit: {
    raw: string;
    sanitized: string[];
    removed: string[];
    loop: LoopInfo;
    /** Loop caught only after typo correction ("Dimethylicone" … later "Dimethicone"). */
    postResolveLoop: LoopInfo;
    truncated: boolean;
    evalCount: number | null;
    durationMs: number;
  };
}

export interface PipelineDeps {
  resolver: Resolver;
  ollama?: OllamaConfig;
  sanitize?: SanitizeOptions;
}

/** Stages 2 + 3 only — reuse for text that did not come from Ollama (manual paste, Tesseract). */
export function processText(raw: string, deps: PipelineDeps): Omit<PipelineResult, 'audit'> & { audit: Omit<PipelineResult['audit'], 'truncated' | 'evalCount' | 'durationMs'> } {
  const s2 = sanitize(raw, deps.sanitize);
  const resolved = deps.resolver.resolveAll(s2.items);

  // Second loop pass on resolved identities: a VLM loop often restarts with
  // DIFFERENT typos, which Stage 2's raw-string comparison cannot see.
  const keys = resolved.map(r => (r.record ? `db:${r.record.inci}` : `raw:${loopKey(r.input)}`));
  const post = killLoops(keys, deps.sanitize?.truncateOnAnyRepeat ?? true);
  const ingredients = resolved.slice(0, post.items.length);

  const warnings: string[] = [];
  if (s2.loop.detected || post.loop.detected) warnings.push('Model repetition loop detected and truncated.');
  const unknown = ingredients.filter(r => r.status === 'unknown').length;
  if (unknown) warnings.push(`${unknown} ingredient(s) not verified against the database — please review.`);
  if (!ingredients.length) warnings.push('No ingredients recognised. Retake the photo closer to the ingredient list.');

  return {
    ingredients,
    warnings,
    audit: { raw, sanitized: s2.items, removed: s2.removed, loop: s2.loop, postResolveLoop: post.loop },
  };
}

export async function processLabel(imageBase64: string, deps: PipelineDeps): Promise<PipelineResult> {
  const s1 = await runOllamaOCR(imageBase64, deps.ollama);
  if (s1.noIngredients) {
    return {
      ingredients: [],
      warnings: ['No ingredient list found in the image.'],
      audit: { raw: s1.raw, sanitized: [], removed: [], loop: { detected: false }, postResolveLoop: { detected: false },
               truncated: s1.truncated, evalCount: s1.evalCount, durationMs: s1.durationMs },
    };
  }
  const r = processText(s1.raw, deps);
  // Hit num_predict without a loop → the list itself was probably longer than the budget.
  if (s1.truncated && !r.audit.loop.detected && !r.audit.postResolveLoop.detected) {
    r.warnings.unshift('Output reached the token limit — the ingredient list may be incomplete.');
  }
  return { ...r, audit: { ...r.audit, truncated: s1.truncated, evalCount: s1.evalCount, durationMs: s1.durationMs } };
}
