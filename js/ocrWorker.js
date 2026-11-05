/* ════════════════════════════════════════════════════════════════════
   ChaeCheck · js/ocrWorker.js  v4
   Client-side OCR via Tesseract.js v5 — optimized for cosmetic labels

   Preprocessing pipeline (handles curved/glossy/uneven surfaces):
   1. Upscale small images (target 2400px, bicubic)
   2. Grayscale (ITU-R BT.601 weighted luminance)
   3. Auto-invert (dark background → light background)
   4. Unsharp mask (sharpen blurred text from curved surfaces)
   5. CLAHE-like local contrast enhancement
   6. Adaptive Sauvola binarization (large R=20 for curved label lighting)
   7. Morphological closing (fill broken character strokes)

   PSM 6 = single uniform block of text.
   Dictionary correction DISABLED for INCI names.
════════════════════════════════════════════════════════════════════ */

importScripts('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');

let _worker = null;
let _loadPromise = null;

function progress(pct, label) {
  self.postMessage({ type: 'progress', pct, label });
}

// ── Engine loader ────────────────────────────────────────────────
function _loadEngine() {
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    progress(5, 'Loading OCR engine…');

    const worker = await Tesseract.createWorker('eng', 1, {
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core-simd-lstm.wasm.js',
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const pct = Math.round(m.progress * 100);
          progress(30 + Math.round(pct * 0.60), `Reading text… ${pct}%`);
        } else if (m.status === 'loading tesseract core') {
          progress(8, 'Loading OCR core…');
        } else if (m.status === 'initializing tesseract') {
          progress(12, 'Initializing OCR…');
        } else if (m.status === 'loading language traineddata') {
          progress(10, 'Downloading language data…');
        }
      }
    });

    await worker.setParameters({
      // PSM 6 = uniform block of text (more deterministic than PSM 4)
      tessedit_pageseg_mode: '6',
      // DISABLE dictionary correction — INCI names aren't dictionary words
      load_system_dawg: '0',
      load_freq_dawg: '0',
      // Disable word-level language model to prevent "auto-correct" behavior
      language_model_penalty_non_dict_word: '0',
      language_model_penalty_non_freq_dict_word: '0',
    });

    _worker = worker;
    return worker;
  })();

  return _loadPromise;
}


// ═══════════════════════════════════════════════════════════════
//  IMAGE PREPROCESSING PIPELINE
// ═══════════════════════════════════════════════════════════════

/** Convert RGBA pixel data to grayscale luminance array. */
function toGrayscale(data, len) {
  const gray = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    const off = i * 4;
    gray[i] = Math.round(data[off] * 0.299 + data[off + 1] * 0.587 + data[off + 2] * 0.114);
  }
  return gray;
}

/** Auto-invert dark backgrounds to light (Tesseract expects dark-on-light). */
function autoInvert(gray) {
  let sum = 0;
  const step = Math.max(1, Math.floor(gray.length / 40000));
  let count = 0;
  for (let i = 0; i < gray.length; i += step) { sum += gray[i]; count++; }
  if (sum / count < 128) {
    for (let i = 0; i < gray.length; i++) gray[i] = 255 - gray[i];
  }
  return gray;
}

/**
 * Unsharp mask: sharpen blurred text from curved/out-of-focus labels.
 * Uses a simple box blur as the "blurred" version, then:
 *   sharpened = original + amount * (original - blurred)
 */
function unsharpMask(gray, w, h, radius, amount) {
  // Fast box blur via integral image
  const integral = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    for (let x = 0; x < w; x++) {
      rowSum += gray[y * w + x];
      integral[(y + 1) * (w + 1) + (x + 1)] =
        integral[y * (w + 1) + (x + 1)] + rowSum;
    }
  }

  const out = new Uint8Array(gray.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x1 = Math.max(0, x - radius), y1 = Math.max(0, y - radius);
      const x2 = Math.min(w - 1, x + radius), y2 = Math.min(h - 1, y + radius);
      const area = (x2 - x1 + 1) * (y2 - y1 + 1);
      const sum =
        integral[(y2 + 1) * (w + 1) + (x2 + 1)] -
        integral[y1 * (w + 1) + (x2 + 1)] -
        integral[(y2 + 1) * (w + 1) + x1] +
        integral[y1 * (w + 1) + x1];
      const blurred = sum / area;
      const orig = gray[y * w + x];
      out[y * w + x] = Math.max(0, Math.min(255,
        Math.round(orig + amount * (orig - blurred))
      ));
    }
  }
  return out;
}

/**
 * CLAHE-like local contrast enhancement.
 * Divides image into tiles and stretches contrast locally.
 * This handles uneven lighting across curved surfaces.
 */
function localContrastEnhance(gray, w, h) {
  const TILE_W = 64, TILE_H = 64;
  const out = new Uint8Array(gray.length);

  const tilesX = Math.ceil(w / TILE_W);
  const tilesY = Math.ceil(h / TILE_H);

  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const x0 = tx * TILE_W, y0 = ty * TILE_H;
      const x1 = Math.min(w, x0 + TILE_W);
      const y1 = Math.min(h, y0 + TILE_H);

      // Find local min/max
      let lo = 255, hi = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const v = gray[y * w + x];
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
      }

      // Clip 2% extremes
      const range = hi - lo;
      const clipLo = lo + range * 0.02;
      const clipHi = hi - range * 0.02;
      const cRange = clipHi - clipLo || 1;

      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = y * w + x;
          out[i] = Math.max(0, Math.min(255,
            Math.round((gray[i] - clipLo) * 255 / cRange)
          ));
        }
      }
    }
  }
  return out;
}

/**
 * Adaptive Sauvola binarization with larger window (R=20).
 * Larger window handles gradual brightness changes on curved labels.
 * Uses both mean and std dev for better threshold adaptation.
 */
function adaptiveBinarize(gray, w, h) {
  const out = new Uint8Array(gray.length);
  const R = 20;     // larger radius for curved surface gradients
  const k = 0.15;   // Sauvola k parameter
  const RANGE = 128; // Sauvola R parameter (dynamic range of std dev)

  // Integral image and integral of squares
  const integral = new Float64Array((w + 1) * (h + 1));
  const integralSq = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let rowSum = 0, rowSqSum = 0;
    for (let x = 0; x < w; x++) {
      const v = gray[y * w + x];
      rowSum += v;
      rowSqSum += v * v;
      integral[(y + 1) * (w + 1) + (x + 1)] =
        integral[y * (w + 1) + (x + 1)] + rowSum;
      integralSq[(y + 1) * (w + 1) + (x + 1)] =
        integralSq[y * (w + 1) + (x + 1)] + rowSqSum;
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x1 = Math.max(0, x - R), y1 = Math.max(0, y - R);
      const x2 = Math.min(w - 1, x + R), y2 = Math.min(h - 1, y + R);
      const area = (x2 - x1 + 1) * (y2 - y1 + 1);

      const sum =
        integral[(y2 + 1) * (w + 1) + (x2 + 1)] -
        integral[y1 * (w + 1) + (x2 + 1)] -
        integral[(y2 + 1) * (w + 1) + x1] +
        integral[y1 * (w + 1) + x1];
      const sqSum =
        integralSq[(y2 + 1) * (w + 1) + (x2 + 1)] -
        integralSq[y1 * (w + 1) + (x2 + 1)] -
        integralSq[(y2 + 1) * (w + 1) + x1] +
        integralSq[y1 * (w + 1) + x1];

      const mean = sum / area;
      const variance = sqSum / area - mean * mean;
      const stddev = Math.sqrt(Math.max(0, variance));

      // Sauvola threshold: T = mean * (1 + k * (stddev/R - 1))
      const threshold = mean * (1 + k * (stddev / RANGE - 1));

      const i = y * w + x;
      out[i] = gray[i] > threshold ? 255 : 0;
    }
  }
  return out;
}

/**
 * Morphological closing (dilate then erode) to fill small breaks
 * in character strokes caused by curved surface distortion.
 */
function morphClose(bin, w, h) {
  // Dilate: if any neighbor is black (0), make pixel black
  const dilated = new Uint8Array(bin.length);
  dilated.set(bin);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (bin[y * w + x] === 0 ||
          bin[(y-1) * w + x] === 0 ||
          bin[(y+1) * w + x] === 0 ||
          bin[y * w + (x-1)] === 0 ||
          bin[y * w + (x+1)] === 0) {
        dilated[y * w + x] = 0;
      }
    }
  }

  // Erode: if any neighbor is white (255), make pixel white
  const eroded = new Uint8Array(dilated.length);
  eroded.set(dilated);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (dilated[y * w + x] === 255 ||
          dilated[(y-1) * w + x] === 255 ||
          dilated[(y+1) * w + x] === 255 ||
          dilated[y * w + (x-1)] === 255 ||
          dilated[y * w + (x+1)] === 255) {
        eroded[y * w + x] = 255;
      }
    }
  }
  return eroded;
}


/**
 * Full preprocessing pipeline.
 * Optimized for cosmetic product labels including curved bottles.
 */
function preprocessImage(srcCanvas, w, h) {
  const ctx = srcCanvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, w, h);
  const pixelCount = w * h;

  // 1. Grayscale
  let gray = toGrayscale(imgData.data, pixelCount);

  // 2. Auto-invert dark backgrounds
  gray = autoInvert(gray);

  // 3. Unsharp mask — sharpens blurred text from curved surfaces
  gray = unsharpMask(gray, w, h, 3, 1.5);

  // 4. Local contrast enhancement — handles uneven lighting on curves
  gray = localContrastEnhance(gray, w, h);

  // 5. Adaptive Sauvola binarization (large window for curved labels)
  let bin = adaptiveBinarize(gray, w, h);

  // 6. Morphological closing — fills broken character strokes
  bin = morphClose(bin, w, h);

  // Write back as black/white RGBA
  const outCanvas = new OffscreenCanvas(w, h);
  const outCtx = outCanvas.getContext('2d');
  const outData = outCtx.createImageData(w, h);
  for (let i = 0; i < pixelCount; i++) {
    const v = bin[i];
    const off = i * 4;
    outData.data[off] = v;
    outData.data[off + 1] = v;
    outData.data[off + 2] = v;
    outData.data[off + 3] = 255;
  }
  outCtx.putImageData(outData, 0, 0);
  return outCanvas;
}


// ═══════════════════════════════════════════════════════════════
//  MAIN OCR FUNCTION
// ═══════════════════════════════════════════════════════════════

// Scan ID counter — prevents stale results from overwriting newer scans
let _currentScanId = 0;

async function runOCR(imageDataBuffer, width, height, scanId) {
  const worker = await _loadEngine();

  const imgData = new ImageData(
    new Uint8ClampedArray(imageDataBuffer),
    width,
    height
  );

  // ── Upscale for Tesseract accuracy (~300 DPI effective) ──
  const TARGET_W = 2400;
  let rw = width, rh = height;
  if (rw < TARGET_W) {
    const scale = TARGET_W / rw;
    rw = TARGET_W;
    rh = Math.round(height * scale);
  }
  if (Math.max(rw, rh) > 4096) {
    const s = 4096 / Math.max(rw, rh);
    rw = Math.round(rw * s);
    rh = Math.round(rh * s);
  }

  // Check if this scan is still current
  if (scanId !== _currentScanId) return '';

  progress(16, 'Preprocessing image…');

  const srcCanvas = new OffscreenCanvas(width, height);
  srcCanvas.getContext('2d').putImageData(imgData, 0, 0);

  // Upscale with high quality interpolation
  const scaledCanvas = new OffscreenCanvas(rw, rh);
  const sCtx = scaledCanvas.getContext('2d');
  sCtx.imageSmoothingEnabled = true;
  sCtx.imageSmoothingQuality = 'high';
  sCtx.drawImage(srcCanvas, 0, 0, rw, rh);

  if (scanId !== _currentScanId) return '';

  progress(18, 'Enhancing for curved labels…');

  // Run full preprocessing pipeline
  const processedCanvas = preprocessImage(scaledCanvas, rw, rh);

  if (scanId !== _currentScanId) return '';

  progress(22, 'Recognizing text…');

  // Convert to Blob for Tesseract
  const blob = await processedCanvas.convertToBlob({ type: 'image/png' });
  const result = await worker.recognize(blob);
  const rawText = result.data.text || '';

  progress(95, 'Text extraction complete ✓');

  return rawText;
}


// ── Message handler ───────────────────────────────────────────────
self.onmessage = async ({ data }) => {
  if (data.type === 'load') {
    try {
      await _loadEngine();
      self.postMessage({ type: 'ready' });
    } catch (e) {
      self.postMessage({ type: 'error', message: String(e) });
    }
    return;
  }

  if (data.type === 'ocr') {
    try {
      // Increment scan ID to invalidate any previous in-flight scan
      const scanId = ++_currentScanId;
      progress(1, 'Starting OCR…');
      const text = await runOCR(data.imageData, data.width, data.height, scanId);
      // Only send result if this scan is still the current one
      if (scanId === _currentScanId) {
        self.postMessage({ type: 'done', text });
      }
    } catch (e) {
      self.postMessage({ type: 'error', message: String(e) });
    }
  }
};
