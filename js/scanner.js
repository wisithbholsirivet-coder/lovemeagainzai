/* =====================================================
   ChaeCheck . js/scanner.js  v3
   Deep-learning OCR (ocrWorker.js) + Ingredient Scan
   ===================================================== */

const Scanner = (() => {
  let _lastResults = [];
  let _lastRawText = '';

  // =====================================================
  //  OCR via local Ollama glm-ocr Vision Model
  //  Calls http://localhost:11434/api/generate
  //  Falls back to Tesseract.js Worker if Ollama down
  // =====================================================
  const OLLAMA_PATH = '/api/generate';
  const OLLAMA_MODEL = 'glm-ocr';
  const OLLAMA_TIMEOUT = 60000; // 60s — vision models need time

  // Ollama base URLs to try, in order. On a phone, "localhost" is the PHONE —
  // so when the page is opened via LAN IP (http://192.168.x.x:8765), try that
  // host first. Override: localStorage.chaecheck_ollama_url = 'http://host:11434'
  // (Ollama must listen on the LAN: OLLAMA_HOST=0.0.0.0, OLLAMA_ORIGINS=*)
  let _ollamaBase = null; // first base that answered; cached after prewarm/scan
  function _ollamaBases() {
    let override = null;
    try { override = localStorage.getItem('chaecheck_ollama_url'); } catch (_) {}
    const host = (typeof location !== 'undefined' && location.hostname) || 'localhost';
    const list = [_ollamaBase, override, `http://${host}:11434`, 'http://localhost:11434'];
    return [...new Set(list.filter(Boolean).map(u => u.replace(/\/+$/, '')))];
  }

  // Tesseract fallback worker (lazy loaded only if Ollama fails)
  let _ocrWorker = null;
  let _ocrBusy = false;
  let _ocrScanId = 0;

  function _getOCRWorker() {
    if (_ocrWorker) return _ocrWorker;
    try { _ocrWorker = new Worker('js/ocrWorker.js'); } catch (_) { _ocrWorker = null; }
    return _ocrWorker;
  }

  // ═══════════════════════════════════════════════════
  // Image normalisation (mobile-safe)
  // Phone photos arrive as 12–48 MP JPEGs whose pixels are stored sideways
  // with an EXIF "Orientation" tag. Ollama decodes server-side and ignores
  // that tag → glm-ocr reads rotated text. browser-image-compression
  // bakes the rotation into the pixels, caps size, re-encodes as JPEG.
  // ═══════════════════════════════════════════════════
  const MAX_OCR_DIM = 2048;   // longest side; 1024 made small label text illegible
  const JPEG_QUALITY = 0.9;

  // Every canvas drawImage() in `fn` uses high-quality resampling.
  // The library never sets imageSmoothingQuality (browser default = 'low'),
  // and resizing canvases resets context state, so patch drawImage itself —
  // scoped to this call, restored in finally.
  async function _withHighQualitySmoothing(fn) {
    const protos = [self.CanvasRenderingContext2D, self.OffscreenCanvasRenderingContext2D]
      .filter(Boolean).map(C => C.prototype);
    const originals = protos.map(p => p.drawImage);
    protos.forEach((p, i) => {
      const orig = originals[i];
      p.drawImage = function (...args) {
        this.imageSmoothingEnabled = true;
        this.imageSmoothingQuality = 'high';
        return orig.apply(this, args);
      };
    });
    try { return await fn(); }
    finally { protos.forEach((p, i) => { p.drawImage = originals[i]; }); }
  }

  function _makeCanvas(w, h) {
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h); // iOS < 16.4 lacks it
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function _hqContext(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    return ctx;
  }

  function _canvasToBlob(canvas, type, quality) {
    if (canvas.convertToBlob) return canvas.convertToBlob({ type, quality });
    return new Promise((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('toBlob failed'))), type, quality));
  }

  // Fallback when the library is missing/fails: browser applies EXIF on decode.
  async function _legacyNormalize(file) {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_OCR_DIM / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
    const canvas = _makeCanvas(w, h);
    _hqContext(canvas).drawImage(bitmap, 0, 0, w, h);
    bitmap.close && bitmap.close();
    return _canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);
  }

  async function _normalizeImage(file) {
    if (typeof imageCompression === 'function') {
      try {
        return await _withHighQualitySmoothing(() => imageCompression(file, {
          maxWidthOrHeight: MAX_OCR_DIM,
          initialQuality: JPEG_QUALITY,
          fileType: 'image/jpeg',
          preserveExif: false,     // orientation is baked into pixels; drop the tag
          useWebWorker: false,     // main thread → the smoothing patch applies
          libURL: new URL('js/vendor/browser-image-compression.js', location.href).href, // never the CDN
        }));
      } catch (err) {
        console.warn('[OCR] browser-image-compression failed, using canvas fallback:', err);
      }
    }
    return _legacyNormalize(file);
  }

  function _blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // ── TEMPORARY debug: mirror uploads to the Node backend for inspection ──
  // Enable on the device: localStorage.chaecheck_debug_upload = 'http://<pc-ip>:8787'
  // Sends the phone's ORIGINAL file and the normalised JPEG. Fire-and-forget.
  function _debugMirror(original, normalized) {
    let base = null;
    try { base = localStorage.getItem('chaecheck_debug_upload'); } catch (_) {}
    if (!base) return;
    const fd = new FormData();
    fd.append('original', original, original.name || 'original');
    fd.append('normalized', normalized, 'normalized.jpg');
    fd.append('meta', JSON.stringify({ ua: navigator.userAgent, originalType: original.type, originalBytes: original.size, normalizedBytes: normalized.size }));
    fetch(base.replace(/\/+$/, '') + '/api/debug/image', { method: 'POST', body: fd })
      .then(r => console.log('[debug] mirror upload', r.status))
      .catch(e => console.warn('[debug] mirror upload failed', e));
  }

  // ═══════════════════════════════════════════════════
  // STAGE 1: Hardened Ollama API — Few-Shot Prompt
  // ═══════════════════════════════════════════════════
  const OLLAMA_SYSTEM_PROMPT = `You are a strict INCI cosmetic ingredient OCR tool specialized in reading product packaging photos.

TASK: Find the official ingredient list on the product label and extract ONLY the chemical/INCI names from it.

LOCATING THE INGREDIENT LIST:
- Look for a section starting with "Ingredients:", "INGREDIENTS:", "ส่วนประกอบ", "成分", or a similar header.
- The ingredient list is typically a dense block of comma-separated chemical names in small print, usually on the back or side of the package.
- IGNORE everything else: product name, brand logo, marketing claims, directions for use, warnings, batch/lot numbers, barcodes, manufacturing info, addresses, phone numbers, website URLs, expiry dates, certifications, weight/volume, and decorative text.

OUTPUT RULES:
1. Output ONLY a comma-separated list of valid INCI chemical names.
2. Fix spelling errors to correct INCI dictionary spelling.
3. Drop all non-ingredient text: Thai characters, Chinese characters, Japanese characters, symbols, numbers that are not part of a chemical name.
4. Output each ingredient exactly once — never repeat.
5. After the last ingredient, write END_OF_LIST and stop immediately.
6. If you cannot find an ingredient list in the image, output NO_INGREDIENTS_FOUND and stop.
7. Ignore all non-ingredient words, random UI texts like 'Wait', symbols, and marketing notes. Output ONLY valid INCI cosmetic ingredient names separated by commas.
8. Never write your own thoughts, comments, or corrections (no "Wait", "Let me check", "Note:"). If unsure of a word, write your best INCI guess once and continue.`;

  const OLLAMA_USER_PROMPT = `EXAMPLE INPUT IMAGE: A photo of a sunscreen bottle back label containing brand name "SunShield Pro", directions "Apply liberally 15 minutes before sun exposure", and an ingredient list starting with "Ingredients: Aqua ( Water ), Octocryrene, Iso hexadecane ， Silica， Dimethione, Gliceryll Stearate. Mfg by ABC Co., Ltd. Tel: 02-123-4567 Exp: 12/2027 U mineral oil that vegetable oi"
EXAMPLE OUTPUT: Aqua (Water), Octocrylene, Isohexadecane, Silica, Dimethicone, Glyceryl Stearate END_OF_LIST

Note: Only the chemical names from the ingredient list were extracted. The brand name, directions, manufacturer info, phone number, expiry date, and marketing claims were all ignored.

Now process the provided image. Find the ingredient list section and output ONLY the corrected comma-separated INCI names:`;

  // ── Main OCR function ──
  async function _runMLOCR(imageFile) {
    if (_ocrBusy) {
      console.warn('[OCR] Scan already in progress, skipping.');
      return '';
    }
    _ocrBusy = true;
    const thisScanId = ++_ocrScanId;

    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const ocrProgress  = document.getElementById('ocr-progress');

    if (ocrProgress) ocrProgress.hidden = false;
    if (progressFill) progressFill.style.width = '1%';
    if (progressText) progressText.textContent = 'Preparing image...';

    // Normalise ONCE (EXIF rotation baked in, ≤2048px, JPEG 0.9) — both engines
    // get the same upright, size-capped image. Also avoids iOS canvas limits
    // (16.7 MP) that blanked 48 MP photos in the Tesseract path.
    let image = imageFile;
    try {
      image = await _normalizeImage(imageFile);
      _debugMirror(imageFile, image);
    } catch (normErr) {
      console.warn('[OCR] Image normalisation failed, sending original:', normErr);
    }
    if (thisScanId !== _ocrScanId) { _ocrBusy = false; return ''; }

    try {
      const { text, engine, route } = await _runOllamaOCR(image, progressFill, progressText);

      // Discard stale
      if (thisScanId !== _ocrScanId) { _ocrBusy = false; return ''; }

      if (progressFill) progressFill.style.width = '95%';
      if (progressText) progressText.textContent = 'Correcting spellings...';

      // Stage 2: Regex sanitization
      const sanitized = _fixOCRText(text);
      // Stage 3: Fuzzy match against DB to fix misspellings
      const corrected = DB.fuzzyCorrect(sanitized);
      _recordAudit('ollama', text, sanitized, corrected);
      _setEngineBadge('ok', `Engine: ${engine}`, `${route.label} · image ${_imgInfo(image)}`);

      if (progressFill) progressFill.style.width = '100%';
      if (progressText) progressText.textContent =
        I18n.t('scanner.ocr.done', 'Text extraction complete!');
      setTimeout(() => { if (ocrProgress) ocrProgress.hidden = true; }, 1500);

      _ocrBusy = false;
      return corrected;
    } catch (ollamaErr) {
      console.warn('[Ollama OCR] Failed:', ollamaErr);

      // NO silent fallback. Tesseract on a phone produced garbage like
      // "G1yEyrrhizate" that looked like real results. Opt-in only:
      //   localStorage.chaecheck_allow_tesseract = '1'
      if (!_allowTesseract()) {
        _ocrBusy = false;
        if (ocrProgress) ocrProgress.hidden = true;
        _setEngineBadge('error', `OCR unavailable — ${ollamaErr.message}`, ollamaErr.detail || '');
        throw ollamaErr;
      }
      try {
        _setEngineBadge('warn', 'Engine: Tesseract.js (fallback — LOW ACCURACY, verify every word)', ollamaErr.message);
        if (progressText) progressText.textContent = 'Ollama unavailable, using Tesseract (low accuracy)...';
        const raw = await _runTesseractFallback(image, thisScanId, progressFill, progressText, ocrProgress);
        _ocrBusy = false;
        const sanitized = _fixOCRText(raw);
        const corrected = DB.fuzzyCorrect(sanitized); // Stage 3 on Tesseract output too
        _recordAudit('tesseract', raw, sanitized, corrected);
        return corrected;
      } catch (tessErr) {
        _ocrBusy = false;
        throw tessErr;
      }
    }
  }

  function _allowTesseract() {
    try { return localStorage.getItem('chaecheck_allow_tesseract') === '1'; } catch (_) { return false; }
  }

  function _imgInfo(blob) {
    return `${blob.type || 'image'} ${(blob.size / 1024).toFixed(0)} KB`;
  }

  // ── Engine badge (UI verification) ──
  // state: 'ok' | 'warn' | 'error' | 'info'
  function _setEngineBadge(state, text, detail) {
    const el = document.getElementById('ocr-engine');
    if (!el) return;
    el.hidden = false;
    el.className = `ocr-engine ocr-engine--${state}`;
    el.textContent = '';
    const main = document.createElement('span');
    main.textContent = text;
    el.appendChild(main);
    if (detail) {
      const small = document.createElement('small');
      small.textContent = detail;
      el.appendChild(small);
    }
  }

  // OCR failure with a user-facing message + technical detail for the badge.
  class OCRError extends Error {
    constructor(code, message, detail) { super(message); this.name = 'OCRError'; this.code = code; this.detail = detail || ''; }
  }

  // ── Ollama API call ──
  async function _runOllamaOCR(imageBlob, progressFill, progressText) {
    if (progressText) progressText.textContent = 'Connecting to local AI model...';
    if (progressFill) progressFill.style.width = '10%';

    const base64Image = await _blobToBase64(imageBlob);
    if (progressFill) progressFill.style.width = '20%';
    if (progressText) progressText.textContent = 'Sending to AI model...';

    const body = JSON.stringify({
      model: OLLAMA_MODEL,
      system: OLLAMA_SYSTEM_PROMPT,
      prompt: OLLAMA_USER_PROMPT,
      images: [base64Image],
      stream: false,
      keep_alive: -1,
      options: {
        temperature: 0.0,          // absolute determinism
        num_predict: 768,          // hard kill-switch (raised for long labels)
        top_p: 1.0,
        top_k: 40,                 // restrict vocabulary breadth
        repeat_penalty: 1.5,       // break autoregressive loops
        repeat_last_n: 256,
        penalize_newline: true,
      }
    });

    // Try each candidate host; a network error (host not listening) moves on,
    // a timeout does not (Ollama is reachable but busy — retrying elsewhere won't help).
    let response = null, lastErr = null;
    for (const base of _ollamaBases()) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT);
      try {
        response = await fetch(base + OLLAMA_PATH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body,
        });
        _ollamaBase = base;
        break;
      } catch (err) {
        lastErr = err;
        if (err.name === 'AbortError') {
          throw new Error('Local OCR server timed out (60s). Is Ollama running?');
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }
    if (!response) {
      console.warn('[Ollama OCR] unreachable at', _ollamaBases().join(', '), lastErr);
      throw new Error('Local OCR server is currently unreachable. Start Ollama with: ollama serve');
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Ollama returned ${response.status}: ${errText.slice(0, 200)}`);
    }

    if (progressFill) progressFill.style.width = '50%';
    if (progressText) progressText.textContent = 'AI model analyzing label...';

    const data = await response.json();
    const rawText = (data.response || '').trim();

    if (progressFill) progressFill.style.width = '90%';

    if (!rawText || rawText === 'NO_INGREDIENTS_FOUND') {
      return '';
    }

    return rawText;
  }

  // ── Tesseract fallback (original Worker-based path) ──
  async function _runTesseractFallback(imageFile, thisScanId, progressFill, progressText, ocrProgress) {
    const worker = _getOCRWorker();
    if (!worker) throw new Error('OCR worker unavailable');

    // Pre-warm if needed
    worker.postMessage({ type: 'load' });

    // Input is already normalised (upright, ≤2048px) by _normalizeImage.
    const bitmap = await createImageBitmap(imageFile, { imageOrientation: 'from-image' });
    const { width, height } = bitmap;
    const offscreen = _makeCanvas(width, height);   // regular <canvas> on iOS < 16.4
    const ctx = _hqContext(offscreen);
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close && bitmap.close();
    const imageData = ctx.getImageData(0, 0, width, height);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => { reject(new Error('OCR timed out (180s)')); }, 180000
      );

      worker.onmessage = ({ data: msg }) => {
        if (msg.type === 'progress') {
          if (progressFill) progressFill.style.width = `${msg.pct}%`;
          if (progressText) progressText.textContent  = msg.label || 'Processing...';
          return;
        }
        if (msg.type === 'ready') return;
        clearTimeout(timeout);

        if (thisScanId !== _ocrScanId) { resolve(''); return; }

        if (msg.type === 'done') {
          if (progressFill) progressFill.style.width = '100%';
          if (progressText) progressText.textContent =
            I18n.t('scanner.ocr.done', 'Text extraction complete!');
          setTimeout(() => { if (ocrProgress) ocrProgress.hidden = true; }, 1500);
          resolve(msg.text || ''); // raw — sanitized by caller (audit needs raw)
        } else if (msg.type === 'error') {
          reject(new Error(msg.message || 'Worker error'));
        }
      };

      worker.onerror = (e) => { clearTimeout(timeout); reject(e); };
      worker.postMessage(
        { type: 'ocr', imageData: imageData.data.buffer, width, height },
        [imageData.data.buffer]
      );
    });
  }

  // Pre-warm: check if Ollama is running on page load
  function _prewarmOCR() {
    fetch('http://localhost:11434/api/tags', { method: 'GET' })
      .then(r => r.json())
      .then(data => {
        const hasModel = (data.models || []).some(m => m.name.startsWith(OLLAMA_MODEL));
        console.log(`[OCR] Ollama ${hasModel ? 'ready with ' + OLLAMA_MODEL : 'running but model not found'}`);
        if (!hasModel) {
          console.warn(`[OCR] Run: ollama pull ${OLLAMA_MODEL}`);
        }
      })
      .catch(() => {
        console.warn('[OCR] Ollama not reachable. Will fallback to Tesseract.js.');
        // Pre-warm Tesseract instead
        const w = _getOCRWorker();
        if (w) w.postMessage({ type: 'load' });
      });
  }


  // ═══════════════════════════════════════════════════
  // STAGE 2: Programmatic Regex Sanitization
  // ═══════════════════════════════════════════════════
  function _fixOCRText(raw) {
    if (!raw) return '';
    let s = raw;

    // ── 2a. Truncate at END_OF_LIST / NO_INGREDIENTS_FOUND marker ──
    const endIdx = s.search(/END_OF_LIST|NO_INGREDIENTS_FOUND/i);
    if (endIdx !== -1) s = s.slice(0, endIdx);

    // ── 2b. Cut at repeated INGREDIENTS header (loop restart) ──
    // Also handles uncropped images where text appears before/after ingredient list
    // Match patterns: "Ingredients:", "Ingredients]", "(Ingredients):", "ส่วนประกอบ:", "成分:", "全成分:"
    // The regex matches the full header including optional surrounding parens + colon
    const headerRe = /(?:\(?ingredients?\)?\s*[:\]\}]|ส่วนประกอบ\s*(?:\(ingredients?\))?\s*[:\]\}]?|成分\s*[:\]\}]?|全成分\s*[:\]\}]?)/gi;
    const headers = [...s.matchAll(headerRe)];
    if (headers.length >= 1) {
      const firstEnd = headers[0].index + headers[0][0].length;
      s = headers.length >= 2
        ? s.slice(firstEnd, headers[1].index)
        : s.slice(firstEnd);
    }

    // ── 2b2. Truncate at common post-ingredient sections ──
    // Uncropped images often have directions/warnings AFTER the ingredient list
    const postIngredientRe = /\b(directions?\s*(?:for\s+use)?|how\s+to\s+use|(?:storage|usage)\s+instructions?|caution\s*:|warning\s*:|keep\s+out\s+of\s+reach|manufactured\s+by|distributed\s+by|imported\s+by|made\s+in\s+[A-Z]|product\s+of\s+[A-Z]|batch\s+no|lot\s+no|exp(?:iry)?\s*(?:date)?\s*:|best\s+before|net\s+(?:wt|weight|vol|content))\b/im;
    const postMatch = s.match(postIngredientRe);
    if (postMatch && postMatch.index !== undefined) {
      s = s.slice(0, postMatch.index);
    }

    // ── 2c. Percentages + ligatures (delimiters handled by InciCleaner in 2f) ──
    s = InciCleaner.stripPercentages(s)
      .replace(/\uFB01/g, 'fi').replace(/\uFB02/g, 'fl')  // ligatures
      .replace(/\uFB00/g, 'ff').replace(/\uFB03/g, 'ffi').replace(/\uFB04/g, 'ffl');

    // ── 2d. Marketing & artifact purge ──
    s = s
      // Thai negation claims BEFORE Thai strip — "ไม่มี mineral oil และ vegetable oil",
      // "ปราศจาก paraben". Otherwise stripping Thai leaves "mineral oil" as a fake ingredient.
      // Kills from the Thai prefix to the next comma/newline (claims aren't comma lists).
      .replace(/[\^*]?\s*(?:ไม่มี|ปราศจาก|ไม่ผสม|ไร้)[^,\n]*/g, ' ')
      // Thai characters
      .replace(/[\u0E00-\u0E7F]+/g, ' ')
      // CJK characters (Chinese/Japanese/Korean — not INCI)
      .replace(/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]+/g, ' ')
      // Marketing claim phrases
      .replace(/\b(mineral\s+oil\s+(free|that)|vegetable\s+oil\s*(free)?|paraben\s+free|dermatologically\s+tested|no\s+animal\s+testing|clinically\s+proven|for\s+sensitive\s+skin|fragrance\s+free|alcohol\s+free|hypoallergenic|non[- ]?comedogenic)\b/gi, ' ')
      // Packaging noise: directions, warnings, manufacturer info, batch/lot, expiry
      .replace(/\b(directions?|how\s+to\s+use|apply|reapply|avoid\s+contact|keep\s+out\s+of\s+reach|store\s+in|caution|warning|distributed\s+by|manufactured\s+by|made\s+in|product\s+of|imported\s+by|mfg\s+by|batch\s+no|lot\s+no|exp(?:iry)?(?:\s+date)?|best\s+before|use\s+before|net\s+(?:wt|weight|vol|volume|content)|tel|fax|email|www|http[s]?|\.com|\.co\.th|\.net|\.org)\b/gi, ' ')
      // Phone numbers (02-xxx-xxxx, +66xxx, etc.)
      .replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, ' ')
      // Date patterns (DD/MM/YYYY, MM/YYYY, YYYY-MM-DD, etc.)
      .replace(/\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/g, ' ')
      .replace(/\b\d{1,2}[\/\-.]\d{4}\b/g, ' ')
      // Standalone large numbers (barcodes, EAN, batch codes) — 6+ digits not part of INCI
      .replace(/\b\d{6,}\b/g, ' ')
      // "markdown" artifact from LLM
      .replace(/\bmarkdown\b/gi, ' ')
      // Floating single characters (e.g., "U", "o", "i" from mangled text)
      .replace(/(?:^|,)\s*[A-Za-z]\s*(?=,|$)/g, ',')
      // Copyright, trademark, registered symbols
      .replace(/[\u00A9\u00AE\u2122]/g, '')
      // Noise characters (keeps - / ( ) [ ] , . digits — all can be INCI)
      .replace(/[#^~`_=+<>{}\\@$&!?]/g, ' ')
      .replace(/[ \t]{2,}/g, ' ');

    // ── 2f. INCI-aware split + filter ──
    // Keeps PEG-100, Polysorbate 60, 1,2-Hexanediol, CI 77891, Aqua (Water).
    const noise = /^(the|and|for|with|see|back|receipt|offer|total|tel|cashier|refund|invoice|your|order|next|original|from|this|that|also|may|can|use|used|not|all|has|had|have|been|was|are|were|will|www|http|com|net|org|page|end|of|list|free|tested|proven|made|in|by|contains|without|apply|before|after|skin|avoid|contact|eyes|keep|out|reach|children|store|cool|dry|place|warning|caution|directions|product|distributed|manufactured|imported|batch|lot|expiry|best|weight|volume|contents|each|other|than|these|them|more|less|only|but|very|such|about|would|should|could|into|just|most|some|any|its|own|our|new|like|get|take|well|right|look|good|want|give|day|sun|exposure|minutes|liberally|reapply|hours|do|stop|discontinue|doctor|consult|irritation|redness|occurs|SPF|UVA|UVB|protection|broad|spectrum|wait|loading|processing|please|ok|okay|done|scan|scanning|image|photo|picture|text|output|here|result|results|note|notes|sure|sorry|hmm|let|me|check|re-?check|again|actually|think|seems|answer|extracted|following|below|above|correct|corrected|ingredients?|vegetable|mineral|natural|organic|plant|derived|based|i|is|it|a|an|to|so|no|yes)$/i;

    // Drop stray single letters inside a token ("U vegetable o" → "vegetable").
    // Keep legit ones: "Vitamin E", "Coenzyme Q", leading "D Panthenol"/"L Arginine".
    const stripFragments = t => {
      const w = t.split(/\s+/);
      return w.filter((word, i) => {
        const core = word.replace(/[()[\],.]/g, '');
        if (!/^[A-Za-z]$/.test(core)) return true;
        if (/^\(?(pro)?vitamin$|^\(?coenzyme$/i.test(w[i - 1] || '')) return true;
        return i === 0 && /^[DL]$/.test(core) && w.length > 1;
      }).join(' ').trim();
    };
    // Token is noise if EVERY word is a filler/UI/marketing word ("Wait", "let me check").
    const isNoise = t => t.split(/\s+/).every(w => noise.test(w.replace(/[()[\]]/g, '')));

    const cleaned = InciCleaner.splitIngredients(s)
      .map(stripFragments)
      .filter(t => t && !isNoise(t));

    // Multi-word noise filter: reject tokens that look like packaging sentences
    // (3+ common English words and no chemical-name indicators)
    const CHEM_INDICATOR = /\b(acid|oxide|amine|glycol|siloxane|stearate|palmitate|cetyl|oleate|glucoside|sulfate|sulphate|phosphate|chloride|hydroxide|methyl|ethyl|propyl|butyl|PEG|PPG|laureth|ceteareth|dimethicon|silicone|extract|oil|wax|butter|sorbate|benzoate|paraben|phenoxy|acrylate|cellulose|gum|ferment)\b/i;
    const filtered = cleaned.filter(t => {
      // Keep anything with chemical indicators
      if (CHEM_INDICATOR.test(t)) return true;
      // Keep short tokens (1-3 words) — likely real ingredients
      const words = t.trim().split(/\s+/);
      if (words.length <= 3) return true;
      // 4+ words without chemical indicator = probably a sentence fragment, drop it
      return false;
    });

    // LOOP-KILLER DEDUP: truncate at first duplicate (not just remove it).
    // If "Water" appears at index 0 and again at index 15, the model
    // looped — everything from index 15 onward is hallucinated repetition.
    const seen = new Set();
    const unique = [];
    for (const item of filtered) {
      const key = item.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seen.has(key)) {
        // First duplicate = loop start. Truncate here.
        console.warn(`[OCR Sanitizer] Loop detected at "${item}", truncating.`);
        break;
      }
      seen.add(key);
      unique.push(item);
    }

    return unique.join(', ');
  }


  // =====================================================
  //  Helpers
  // =====================================================
  // showToast: delegate to global in app.js
  function showToast(msg, duration) {
    if (typeof window.showToast === 'function') {
      window.showToast(msg, duration);
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function _applyFilter(filter) {
    const cards = document.querySelectorAll('.ingredient-card');
    cards.forEach(card => {
      card.style.display =
        (!filter || filter === 'all' || card.dataset.risk === filter)
          ? '' : 'none';
    });
    document.querySelectorAll('.risk-filter').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
  }


  // =====================================================
  //  Render ingredient card
  // =====================================================
  function _renderCard(result) {
    const lang      = I18n.getLang();
    const riskLabel = { green: 'SAFE', yellow: 'CAUTION', red: 'DANGER', unknown: 'UNKNOWN' }[result.risk] || 'UNKNOWN';
    const riskEmoji = { green: 'circle', yellow: 'circle', red: 'circle', unknown: '?' }[result.risk] || '?';
    const card = document.createElement('div');
    card.className = `ingredient-card risk-${result.risk}`;
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');
    card.dataset.risk = result.risk;

    const purpose = lang === 'th'
      ? (result.description_th || result.purpose || '')
      : (result.purpose || '');
    const isFuzzy = result._matchType === 'fuzzy';

    const fuzzyLabel = lang === 'th' ? '~ ใกล้เคียง' : '~ fuzzy match';
    const flagsHtml = [];
    if (result._isUserAllergen)  flagsHtml.push(`<span class="card-flag allergen-badge" title="${lang === 'th' ? '⚠ สารก่อภูมิแพ้ที่คุณเลือก' : '⚠ Your allergen'}">⚠ ${lang === 'th' ? 'แพ้' : 'Allergen'}</span>`);
    if (result.kidsUnsafe)       flagsHtml.push(`<span class="card-flag" title="${lang === 'th' ? 'ไม่เหมาะสำหรับเด็ก' : 'Not safe for children'}">&#x1F476;</span>`);
    if (result.pregnancyWarning) flagsHtml.push(`<span class="card-flag" title="${lang === 'th' ? 'ระวังในระหว่างตั้งครรภ์' : 'Caution during pregnancy'}">&#x1F931;</span>`);
    if (isFuzzy)                 flagsHtml.push(`<span class="card-flag" title="${fuzzyLabel}">${fuzzyLabel}</span>`);

    let suggestHtml = '';
    if (result.risk === 'unknown' && result._suggestions && result._suggestions.length > 0) {
      const chips = result._suggestions.slice(0, 3).map(s =>
        `<button class="suggest-chip" data-sug-id="${escapeHtml(s.id)}">${escapeHtml(s.names[0])}</button>`
      ).join('');
      suggestHtml = `<div class="card-suggest"><span class="suggest-label">${lang === 'th' ? 'หมายถึง?' : 'DID YOU MEAN?'}</span>${chips}</div>`;
    }

    if (result.risk === 'unknown') {
      card.innerHTML =
        `<div class="card-header">
          <div class="card-name">${escapeHtml(result.inputName)}</div>
          <span class="risk-badge badge-unknown">${riskLabel}</span>
        </div>
        <div class="card-unknown-msg">Not found in our database</div>
        ${suggestHtml}`;
    } else {
      const detailLink = `<span class="card-detail-link">${I18n.t('card.learn.more', 'Details &rarr;')}</span>`;
      card.innerHTML =
        `<div class="card-header">
          <div class="card-name">${escapeHtml(result.inputName)}</div>
          <span class="risk-badge badge-${result.risk}">${riskLabel}</span>
        </div>
        ${result.category ? `<div class="card-category">${escapeHtml(lang === 'th' ? (CATEGORY_TH[result.category] || result.category) : result.category)}</div>` : ''}
        <div class="card-purpose">${escapeHtml(purpose)}</div>
        <div class="card-footer">
          <div class="card-flags">${flagsHtml.join('')}</div>
          ${detailLink}
        </div>`;
    }

    if (result.risk !== 'unknown') {
      card.addEventListener('click', e => {
        if (!e.target.closest('.suggest-chip')) openModal(result);
      });
      card.addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.suggest-chip')) {
          e.preventDefault(); openModal(result);
        }
      });
    }

    card.querySelectorAll('.suggest-chip').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const sug = DB.getById(btn.dataset.sugId);
        if (sug) {
          openModal({
            inputName: result.inputName + ' -> ' + sug.names[0],
            ...sug,
            _matchType: 'suggested',
            _suggestions: [],
          });
        }
      });
    });

    return card;
  }


  // =====================================================
  //  Show results
  // =====================================================
  function showResults(results, rawText) {
    _lastResults = results;
    _lastRawText = rawText;

    const section   = document.getElementById('results-section');
    const list      = document.getElementById('ingredient-grid');
    const summary   = document.getElementById('summary-chips');
    const filterBar = document.getElementById('risk-filter-bar');

    if (!section || !list) return;

    list.innerHTML = '';
    section.hidden = false;

    const counts = { green: 0, yellow: 0, red: 0, unknown: 0 };
    results.forEach(r => { counts[r.risk] = (counts[r.risk] || 0) + 1; });

    if (summary) {
      const lang = I18n.getLang();
      summary.innerHTML = [
        counts.red    ? `<span class="sum-chip chip-red">&#x1F534; ${lang === 'th' ? 'อันตราย ' + counts.red   : counts.red   + ' Danger'}</span>`   : '',
        counts.yellow ? `<span class="sum-chip chip-yellow">&#x1F7E1; ${lang === 'th' ? 'ระวัง '    + counts.yellow : counts.yellow + ' Caution'}</span>` : '',
        counts.green  ? `<span class="sum-chip chip-green">&#x1F7E2; ${lang === 'th' ? 'ปลอดภัย ' + counts.green  : counts.green  + ' Safe'}</span>`    : '',
        counts.unknown? `<span class="sum-chip chip-unknown">&#x26AA; ${lang === 'th' ? 'ไม่รู้จัก ' + counts.unknown : counts.unknown + ' Unknown'}</span>` : '',
      ].filter(Boolean).join('');
    }

    results.forEach(r => list.appendChild(_renderCard(r)));

    if (filterBar) filterBar.hidden = results.length < 2;
    _applyFilter('all');

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }


  // =====================================================
  //  Modal
  // =====================================================
  const CATEGORY_TH = {
    'Abrasive': 'สารขัดผิว', 'Abrasive/Absorbent': 'สารขัดผิว/ดูดซับ', 'Absorbent': 'สารดูดซับ', 'Active Ingredient': 'สารออกฤทธิ์',
    'Amino': 'กรดอะมิโน', 'Amino Acid': 'กรดอะมิโน', 'Anti-acne': 'รักษาสิว', 'Anti-aging': 'ต่อต้านริ้วรอย', 'Anti-inflammatory': 'ลดการอักเสบ',
    'Antifungal': 'ต้านเชื้อรา', 'Antifungal/Antibacterial': 'ต้านเชื้อรา/แบคทีเรีย', 'Antimicrobial': 'ต้านเชื้อจุลินทรีย์',
    'Antioxidant': 'สารต้านอนุมูลอิสระ', 'Antioxidant Preservative': 'สารต้านอนุมูลอิสระ/กันเสีย', 'Antioxidant/Chelating': 'ต้านอนุมูลอิสระ/จับโลหะ',
    'Antiperspirant': 'ระงับเหงื่อ', 'Antiseptic': 'ฆ่าเชื้อ', 'Astringent': 'กระชับรูขุมขน', 'BHA': 'BHA', 'Binder': 'สารยึดเกาะ',
    'Botanical': 'สารสกัดจากพืช', 'Botanical Extract': 'สารสกัดจากพืช', 'Chelating': 'สารจับโลหะ', 'Chelating Agent': 'สารจับโลหะ',
    'Cleansing': 'สารทำความสะอาด', 'Colorant': 'สารให้สี', 'Conditioning Agent': 'สารบำรุง', 'Contaminant': 'สารปนเปื้อน',
    'Cooling Agent': 'สารให้ความเย็น', 'Coupling Agent': 'สารประสาน', 'Deodorizing': 'ระงับกลิ่น', 'Depilatory': 'ขจัดขน',
    'Dispersant': 'สารกระจายตัว', 'Emollient': 'สารให้ความชุ่มชื้น', 'Emollient/Emulsifier': 'ให้ความชุ่มชื้น/ผสานน้ำมัน',
    'Emulsifier': 'ผสานน้ำกับน้ำมัน', 'Encapsulant': 'สารห่อหุ้ม', 'Enzyme': 'เอนไซม์', 'Essential Oil': 'น้ำมันหอมระเหย',
    'Exfoliant': 'ผลัดเซลล์ผิว', 'Exfoliant (AHA)': 'ผลัดเซลล์ผิว (AHA)', 'Exfoliant (PHA)': 'ผลัดเซลล์ผิว (PHA)',
    'Fatty': 'กรดไขมัน', 'Fatty Acid': 'กรดไขมัน', 'Ferment': 'สารสกัดจากการหมัก', 'Film Former': 'สารสร้างฟิล์ม',
    'Fragrance': 'น้ำหอม', 'Humectant': 'ดึงดูดน้ำให้ผิว', 'Humectant / Preservative Booster': 'ดึงดูดน้ำ/เสริมกันเสีย',
    'Humectant/Exfoliant': 'ดึงดูดน้ำ/ผลัดเซลล์ผิว', 'Humectant/Preservative Booster': 'ดึงดูดน้ำ/เสริมกันเสีย',
    'Humectant/Solvent': 'ดึงดูดน้ำ/ตัวทำละลาย', 'Lubricant': 'สารหล่อลื่น', 'Mineral': 'แร่ธาตุ', 'Neurotransmitter': 'สารสื่อประสาท',
    'Oxidizing Agent': 'สารออกซิไดซ์', 'Penetration Enhancer': 'สารช่วยนำพา', 'Peptide': 'เปปไทด์', 'Physical': 'ฟิสิคัล',
    'Preservative': 'สารกันเสีย', 'Preservative Booster': 'สารเสริมกันเสีย', 'Probiotic': 'โปรไบโอติก', 'Propellant': 'ก๊าซขับดัน',
    'Protein': 'โปรตีน', 'Restricted': 'สารควบคุม', 'Retinoid': 'เรตินอยด์', 'Sebum': 'ซีบัม', 'Self-Tanner': 'สารทำผิวแทน',
    'Silicone': 'ซิลิโคน', 'Skin': 'ผิวหนัง', 'Skin Barrier': 'เสริมเกราะป้องกันผิว', 'Skin Brightener': 'ปรับผิวกระจ่างใส',
    'Skin Conditioner': 'สารบำรุงผิว', 'Skin Conditioner / Fragrance': 'สารบำรุงผิว/น้ำหอม', 'Skin Conditioning': 'สารบำรุงผิว',
    'Skin Protectant': 'สารปกป้องผิว', 'Skin Soothing': 'สารปลอบประโลมผิว', 'Solvent': 'ตัวทำละลาย', 'Surfactant': 'สารทำความสะอาด',
    'Thickener': 'เพิ่มความหนืด', 'UV': 'กันแดด', 'UV Filter': 'สารกันแดด', 'Viscosity': 'ความหนืด', 'Vitamin': 'วิตามิน',
    'pH': 'ค่า pH', 'pH Adjuster': 'ปรับค่า pH'
  };

  const CONCERN_TH = {
    'Potential contact allergen': 'อาจก่อให้เกิดการแพ้สัมผัส',
    'May cause skin sensitization': 'อาจทำให้ผิวแพ้ง่ายขึ้น',
    'May cause allergic reactions': 'อาจทำให้เกิดอาการแพ้',
    'Skin irritant at high concentrations': '刺激ผิวได้ที่ความเข้มข้นสูง',
    'Skin irritant': 'ทำให้ผิวระคายเคือง',
    'Eye irritant': 'ระคายเคืองตา',
    'May cause respiratory irritation': 'อาจระคายเคืองระบบทางเดินหายใจ',
    'Possible endocrine disruptor': 'อาจรบกวนระบบฮอร์โมน',
    'Suspected carcinogen': 'ต้องสงสัยว่าเป็นสารก่อมะเร็ง',
    'Known carcinogen': 'เป็นสารก่อมะเร็ง',
    'Avoid in children under 3': 'หลีกเลี่ยงในเด็กอายุต่ำกว่า 3 ปี',
    'Avoid during pregnancy': 'หลีกเลี่ยงในระหว่างตั้งครรภ์',
    'Not recommended during pregnancy': 'ไม่แนะนำในระหว่างตั้งครรภ์',
    'Restricted in EU cosmetics': 'ถูกจำกัดการใช้ในสหภาพยุโรป',
    'Banned in EU': 'ถูกห้ามใช้ในสหภาพยุโรป',
    'May irritate sensitive skin': 'อาจระคายเคืองผิวบอบบาง',
    'Photosensitizing': 'ทำให้ผิวไวต่อแสงแดด',
    'May cause photosensitivity': 'อาจทำให้ผิวไวต่อแสง',
    'Accumulates in body fat': 'สะสมในเนื้อเยื่อไขมัน',
    'May be comedogenic': 'อาจอุดตันรูขุมขน',
    'May bleach fabrics': 'อาจทำให้ผ้าซีดจาง',
    'High concentration may cause irritation': 'ความเข้มข้นสูงอาจระคายเคือง',
    'Toxic if ingested': 'เป็นพิษหากกลืนกิน',
    'Linked to hair protein loss': 'เชื่อมโยงกับการสูญเสียโปรตีนเส้นผม',
  };

  function openModal(result) {
    const overlay     = document.getElementById('modal-overlay');
    const banner      = document.getElementById('modal-risk-banner');
    const nameEl      = document.getElementById('modal-ingredient-name');
    const metaEl      = document.getElementById('modal-meta');
    const purposeEl   = document.getElementById('modal-purpose');
    const descEl      = document.getElementById('modal-description');
    const concernsEl  = document.getElementById('modal-concerns');
    const concernsSec = document.getElementById('modal-concerns-section');
    const warningsRow = document.getElementById('modal-warnings-row');

    if (!overlay) return;

    const lang        = I18n.getLang();
    const riskLabel   = I18n.t('risk.label.' + result.risk, result.risk);
    const description = lang === 'th'
      ? (result.description_th || result.description_en || I18n.t('error.notfound'))
      : (result.description_en || I18n.t('error.notfound'));

    if (banner)  banner.className   = 'modal-risk-banner risk-' + result.risk;
    // Fallback chain: inputName → first alias → category → riskLabel
    const displayName = result.inputName
      || (result.names && result.names[0])
      || result.category
      || riskLabel
      || '?';
    if (nameEl)  nameEl.textContent = displayName;

    const purposeSection = document.getElementById('modal-purpose-section');
    if (purposeSection) purposeSection.style.display = '';
    
    if (purposeEl) {
      if (lang === 'th') {
        const catTh = result.category ? (CATEGORY_TH[result.category] || result.category) : '';
        // If we translated the category, use it. Otherwise fallback to english purpose.
        purposeEl.textContent = catTh || result.purpose || I18n.t('error.notfound');
      } else {
        purposeEl.textContent = result.purpose || I18n.t('error.notfound');
      }
    }

    if (descEl) descEl.textContent = description;

    if (metaEl) {
      const riskChipClass = { green: 'chip-risk-green', yellow: 'chip-risk-yellow', red: 'chip-risk-red' }[result.risk] || '';
      metaEl.innerHTML = [
        `<span class="modal-meta-chip ${riskChipClass}">${escapeHtml(riskLabel)}</span>`,
        result.category   ? `<span class="modal-meta-chip">${escapeHtml(lang === 'th' ? (CATEGORY_TH[result.category] || result.category) : result.category)}</span>` : '',
        result._matchType === 'fuzzy'     ? `<span class="modal-meta-chip">${lang === 'th' ? '~ ใกล้เคียง' : '~ fuzzy match'}</span>` : '',
        result._matchType === 'suggested' ? `<span class="modal-meta-chip">${lang === 'th' ? 'แนะนำ' : 'suggested'}</span>`          : '',
      ].filter(Boolean).join('');
    }

    if (concernsEl && concernsSec) {
      if (result.concerns && result.concerns.length > 0) {
        concernsEl.innerHTML = result.concerns
          .map(c => {
            const translated = lang === 'th' ? (CONCERN_TH[c] || c) : c;
            return `<li>${escapeHtml(translated)}</li>`;
          }).join('');
        concernsSec.hidden = false;
      } else {
        concernsSec.hidden = true;
      }
    }

    if (warningsRow) {
      warningsRow.innerHTML = [
        result.kidsUnsafe       ? `<span class="modal-warning-chip">⚠ ${I18n.t('warning.kids', 'Not safe for children')}</span>`       : '',
        result.pregnancyWarning ? `<span class="modal-warning-chip">⚠ ${I18n.t('warning.pregnancy', 'Caution during pregnancy')}</span>` : '',
        result._isUserAllergen  ? `<span class="modal-warning-chip allergen-badge">⚠ ${I18n.t('warning.allergen', 'Your allergen')}</span>` : '',
      ].filter(Boolean).join('');
    }

    // Show reference citation
    const refEl = document.getElementById('modal-reference');
    if (refEl) {
      if (result.reference) {
        refEl.textContent = `📋 ${lang === 'th' ? 'อ้างอิง' : 'Reference'}: ${result.reference}`;
        refEl.hidden = false;
      } else {
        refEl.hidden = true;
      }
    }

    // Apply colored top border class to modal element
    const modalEl = document.getElementById('ingredient-modal');
    if (modalEl) {
      modalEl.classList.remove('border-green', 'border-yellow', 'border-red', 'border-unknown');
      const borderMap = { green: 'border-green', yellow: 'border-yellow', red: 'border-red', unknown: 'border-unknown' };
      if (borderMap[result.risk]) modalEl.classList.add(borderMap[result.risk]);
    }

    overlay.classList.remove('modal-overlay--hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const closeBtn = document.getElementById('modal-close');
      if (closeBtn) closeBtn.focus();
    }, 80);
  }

  function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.add('modal-overlay--hidden');
    document.body.style.overflow = '';
  }


  // =====================================================
  //  Restore from history
  // =====================================================
  function restoreResults(results, rawText) {
    const section = document.getElementById('results-section');
    if (section) section.hidden = false;
    showResults(results, rawText);
    if (rawText) {
      const textarea = document.getElementById('manual-input');
      if (textarea) textarea.value = rawText;
    }
  }


  // =====================================================
  //  Main scan
  // =====================================================
  // ── Allergen categories mapping ──
  const ALLERGEN_CATEGORY_MAP = {
    'fragrance':     ['Fragrance', 'Parfum', 'Aroma'],
    'essential-oil': ['Essential Oil'],
    'paraben':       ['Preservative'],
    'sulfate':       ['Surfactant'],
    'alcohol':       ['Solvent'],
    'preservative':  ['Preservative'],
  };

  function _getSelectedAllergens() {
    const checks = document.querySelectorAll('.allergy-checkbox:checked');
    const cats = new Set();
    checks.forEach(cb => {
      const keywords = ALLERGEN_CATEGORY_MAP[cb.value] || [];
      keywords.forEach(k => cats.add(k.toLowerCase()));
      // Also match by concern keywords
      cats.add(cb.value.toLowerCase());
    });
    return cats;
  }

  function _isAllergenMatch(result, allergenCats) {
    if (allergenCats.size === 0) return false;
    const cat = (result.category || '').toLowerCase();
    // Check category match
    for (const ac of allergenCats) {
      if (cat.includes(ac)) return true;
    }
    // Check concerns for allergen keywords
    if (result.concerns) {
      for (const concern of result.concerns) {
        const cl = concern.toLowerCase();
        if (cl.includes('allergen') || cl.includes('sensitiz') || cl.includes('fragrance')) {
          if (allergenCats.has('fragrance') || allergenCats.has('essential-oil')) return true;
        }
      }
    }
    // Check name for specific allergen matches
    const nameL = (result.names?.[0] || '').toLowerCase();
    if (allergenCats.has('paraben') && nameL.includes('paraben')) return true;
    if (allergenCats.has('sulfate') && (nameL.includes('sulfate') || nameL.includes('sulphate'))) return true;
    if (allergenCats.has('alcohol') && nameL.includes('alcohol') && !nameL.includes('cetyl') && !nameL.includes('cetearyl') && !nameL.includes('stearyl')) return true;
    return false;
  }

  // ── OCR audit trail (evaluation only, stays in memory) ──
  // Lets the Results chapter report each stage separately:
  //   raw (engine output) → sanitized (Stage 2) → corrected (Stage 3)
  //   → finalText (after user edits, at Analyze time)
  let _ocrAudit = null;
  function _recordAudit(engine, raw, sanitized, corrected) {
    _ocrAudit = { engine, raw, sanitized, corrected, finalText: null, ts: new Date().toISOString() };
  }
  function getOCRAudit() { return _ocrAudit ? { ..._ocrAudit } : null; }

  async function scan(inputText) {
    if (!inputText || !inputText.trim()) return;
    if (_ocrAudit && _ocrAudit.finalText === null) _ocrAudit.finalText = inputText;

    if (!DB.isLoaded()) {
      showToast(I18n.t('db.loading', 'Database still loading, please wait...'));
      return;
    }

    const scanLoading = document.getElementById('scan-loading');
    const scanBtn     = document.getElementById('scan-btn');
    const section     = document.getElementById('results-section');

    if (scanLoading) scanLoading.hidden = false;
    if (section)     section.hidden     = true;
    if (scanBtn)     scanBtn.disabled   = true;

    try {
      await new Promise(r => setTimeout(r, 60));
      const results = DB.search(inputText);

      // Cross-reference with user allergen selections
      const allergenCats = _getSelectedAllergens();
      if (allergenCats.size > 0) {
        results.forEach(r => {
          r._isUserAllergen = _isAllergenMatch(r, allergenCats);
        });
      }

      if (results.length === 0) {
        showToast(I18n.t('scan.no.ingredients', 'No ingredients found. Try pasting the full ingredient list.'));
      } else {
        showResults(results, inputText);
      }
    } catch (err) {
      console.error('[Scanner] scan error:', err);
      showToast(I18n.t('error.scan.failed', 'Scan failed. Please try again.'));
    } finally {
      if (scanLoading) scanLoading.hidden = true;
      if (scanBtn)     scanBtn.disabled   = false;
    }
  }


  // =====================================================
  //  Init
  // =====================================================
  function init() {
    const uploadZone  = document.getElementById('upload-zone');
    const fileInput   = document.getElementById('file-input');
    const uploadClear = document.getElementById('upload-clear');
    const scanBtn     = document.getElementById('scan-btn');
    const manualInput = document.getElementById('manual-input');
    const saveScanBtn = document.getElementById('save-scan-btn');

    // Pre-warm ML model download on page open
    _prewarmOCR();

    if (uploadZone) {
      uploadZone.addEventListener('click', () => fileInput && fileInput.click());
      uploadZone.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput && fileInput.click(); }
      });
      uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
      uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
      uploadZone.addEventListener('drop', e => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) _handleImageFile(file);
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (file) _handleImageFile(file);
        fileInput.value = '';
      });
    }

    if (uploadClear) {
      uploadClear.addEventListener('click', e => {
        e.stopPropagation();
        const prev = document.getElementById('upload-preview');
        const ph   = document.getElementById('upload-placeholder');
        const prog = document.getElementById('ocr-progress');
        const card = document.getElementById('upload-card');
        const mini = document.getElementById('upload-mini');
        if (prev) prev.hidden = true;
        if (ph)   ph.hidden   = false;
        if (prog) prog.hidden = true;
        // Restore collapsed upload card
        if (card) card.classList.remove('upload-card--collapsed');
        if (mini) mini.hidden = true;
      });
    }

    // "Change" button on mini upload strip
    const changeBtn = document.getElementById('upload-change-btn');
    if (changeBtn) {
      changeBtn.addEventListener('click', (e) => {
        e.stopPropagation();  // prevent toggling <details>
        e.preventDefault();
        const card = document.getElementById('upload-card');
        const mini = document.getElementById('upload-mini');
        if (card) card.classList.remove('upload-card--collapsed');
        if (mini) mini.hidden = true;
        if (fileInput) fileInput.click();
      });
    }

    if (scanBtn) {
      scanBtn.addEventListener('click', () => {
        const text = (manualInput && manualInput.value || '').trim();
        if (!text) {
          showToast(I18n.t('scan.empty', 'Please paste ingredient text first'));
          if (manualInput) manualInput.focus();
          return;
        }
        scan(text);
      });
    }

    document.querySelectorAll('.risk-filter').forEach(btn => {
      btn.addEventListener('click', () => _applyFilter(btn.dataset.filter));
    });

    // Glare tip banner
    const glareTipToggle = document.getElementById('glare-tip-toggle');
    const glareTipBody   = document.getElementById('glare-tip-body');
    const glareTipBanner = document.getElementById('glare-tip-banner');
    if (glareTipToggle && glareTipBody && glareTipBanner) {
      let tipOpen = false;
      try { tipOpen = localStorage.getItem('chaecheck_tip_open') === '1'; } catch (_) {}
      if (tipOpen) {
        glareTipBody.hidden = false;
        glareTipBanner.classList.add('open');
        glareTipToggle.setAttribute('aria-expanded', 'true');
      }
      glareTipToggle.addEventListener('click', () => {
        tipOpen = !tipOpen;
        glareTipBody.hidden = !tipOpen;
        glareTipBanner.classList.toggle('open', tipOpen);
        glareTipToggle.setAttribute('aria-expanded', String(tipOpen));
        try { localStorage.setItem('chaecheck_tip_open', tipOpen ? '1' : '0'); } catch (_) {}
      });
    }

    const modalClose   = document.getElementById('modal-close');
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalClose)   modalClose.addEventListener('click', closeModal);
    if (modalOverlay) {
      modalOverlay.addEventListener('click', e => {
        if (!e.target.closest('.modal')) closeModal();
      });
    }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    if (saveScanBtn) {
      saveScanBtn.addEventListener('click', () => {
        if (!_lastResults.length) {
          showToast(I18n.t('toast.no.results', 'No results to save'));
          return;
        }
        HistoryManager.add(_lastResults, _lastRawText);
        showToast(I18n.t('toast.saved', 'Scan saved to history'));
      });
    }
  }


  // =====================================================
  //  Handle image upload
  // =====================================================
  async function _handleImageFile(file) {
    const preview     = document.getElementById('upload-preview');
    const placeholder = document.getElementById('upload-placeholder');
    const previewImg  = document.getElementById('preview-img');
    const uploadCard  = document.getElementById('upload-card');
    const uploadMini  = document.getElementById('upload-mini');

    if (previewImg) previewImg.src = URL.createObjectURL(file);
    if (preview)     preview.hidden    = false;
    if (placeholder) placeholder.hidden = true;

    try {
      const text = await _runMLOCR(file);
      const manualInput = document.getElementById('manual-input');
      if (manualInput) {
        manualInput.value = text.trim();
        // Scroll to textarea so user can review
        manualInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        manualInput.focus();
      }

      // Collapse upload card, show mini preview accordion
      if (uploadCard) uploadCard.classList.add('upload-card--collapsed');
      if (uploadMini) {
        uploadMini.hidden = false;
        uploadMini.removeAttribute('open'); // start collapsed
        const miniImg = document.getElementById('upload-mini-img');
        const fullImg = document.getElementById('upload-mini-full');
        if (miniImg && previewImg) miniImg.src = previewImg.src;
        if (fullImg && previewImg) fullImg.src = previewImg.src;
      }

      // Pulse the analyze button to draw attention
      const scanBtn = document.getElementById('scan-btn');
      if (scanBtn) {
        scanBtn.classList.add('scan-btn-pulse');
        setTimeout(() => scanBtn.classList.remove('scan-btn-pulse'), 3000);
      }

      if (text.trim()) {
        // DO NOT auto-scan — let user review and edit first
        showToast(I18n.t('scanner.ocr.review', 'Text extracted! Review and click Analyze.'));
      } else {
        showToast(I18n.t('ocr.no.text', 'Could not extract text. Try pasting manually.'));
      }
    } catch (err) {
      console.error('[OCR Error]', err);
      showToast(I18n.t('ocr.failed', 'OCR failed. Please paste ingredients manually.'));
    }
  }

  return { init, scan, showResults, restoreResults, openModal, closeModal, getOCRAudit };
})();