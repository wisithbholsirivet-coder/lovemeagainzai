/* Vercel Function: same-origin OCR proxy → your PC's Ollama (via HTTPS tunnel).
   POST /api/ocr   body = Ollama /api/generate JSON  → Ollama JSON
   GET  /api/ocr   health probe (used by the UI engine badge)
   Configure OLLAMA_URL (+ CF_ACCESS_* or OLLAMA_BASIC_AUTH) in Vercel → Settings → Environment Variables. */

import { proxyGenerate, proxyHealth } from './_ollama-proxy.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    const h = await proxyHealth(process.env);
    res.setHeader('X-OCR-Engine', h.body.engine);
    return res.status(h.status).json(h.body);
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ code: 'method_not_allowed', error: 'Use POST' });
  }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  const r = await proxyGenerate(body, process.env);
  res.setHeader('X-OCR-Engine', r.engine);
  return res.status(r.status).json(r.body);
}
