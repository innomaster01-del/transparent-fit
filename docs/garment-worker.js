/* Garment detector: YOLOv8s-seg trained on DeepFashion2 (13 garment types + outline), run with
   onnxruntime-web in this worker, so the camera never waits for it. */
let session = null, loading = null;
const NAMES = ["short_sleeved_shirt", "long_sleeved_shirt", "short_sleeved_outwear", "long_sleeved_outwear", "vest", "sling",
  "shorts", "trousers", "skirt", "short_sleeved_dress", "long_sleeved_dress", "vest_dress", "sling_dress"];
const SZ = 416;
async function load(base) {
  importScripts(base + "vendor/ort/ort.wasm.min.js");
  ort.env.wasm.wasmPaths = new URL(base + "vendor/ort/", self.location.href).href;
  ort.env.wasm.numThreads = 1;
  const parts = await Promise.all([1, 2, 3, 4].map((k) => fetch(base + "models/garment-" + k + ".wasm").then((r) => { if (!r.ok) throw new Error("garment model " + r.status); return r.arrayBuffer(); })));
  const n = parts.reduce((a, p) => a + p.byteLength, 0), u = new Uint8Array(n); let o = 0;
  for (const p of parts) { u.set(new Uint8Array(p), o); o += p.byteLength; }
  session = await ort.InferenceSession.create(u, { executionProviders: ["wasm"], graphOptimizationLevel: "all" });
}
const iou = (a, b) => { const ix = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])), iy = Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1])), i = ix * iy;
  return i / ((a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - i + 1e-6); };
async function detect(rgba, w, h) {
  // letterbox into SZ x SZ
  const s = SZ / Math.max(w, h), nw = Math.round(w * s), nh = Math.round(h * s), px = (SZ - nw) >> 1, py = (SZ - nh) >> 1;
  const x = new Float32Array(3 * SZ * SZ).fill(114 / 255), plane = SZ * SZ;
  for (let yy = 0; yy < nh; yy++) { const sy = Math.min(h - 1, Math.floor(yy / s));
    for (let xx = 0; xx < nw; xx++) { const sx = Math.min(w - 1, Math.floor(xx / s)), i = (sy * w + sx) * 4, j = (yy + py) * SZ + xx + px;
      x[j] = rgba[i] / 255; x[plane + j] = rgba[i + 1] / 255; x[2 * plane + j] = rgba[i + 2] / 255; } }
  const out = await session.run({ [session.inputNames[0]]: new ort.Tensor("float32", x, [1, 3, SZ, SZ]) });
  const o0 = out[session.outputNames[0]], o1 = out[session.outputNames[1]];
  const N = o0.dims[2], C = o0.dims[1], P = o0.data, nc = 13;
  const cand = [];
  for (let i = 0; i < N; i++) { let best = 0, bc = 0; for (let c = 0; c < nc; c++) { const v = P[(4 + c) * N + i]; if (v > best) { best = v; bc = c; } }
    if (best > 0.3) cand.push({ i, p: best, c: bc }); }
  cand.sort((a, b) => b.p - a.p);
  const dets = [];
  for (const d of cand) {
    const cx = P[d.i], cy = P[N + d.i], bw = P[2 * N + d.i], bh = P[3 * N + d.i], b = [cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2];
    if (dets.some((q) => iou(q.b, b) > 0.5)) continue;
    const coef = new Float32Array(32); for (let k = 0; k < 32; k++) coef[k] = P[(4 + nc + k) * N + d.i];
    dets.push({ b, p: d.p, c: d.c, coef }); if (dets.length >= 3) break;
  }
  void C;
  // mask of the best one, at prototype resolution, cropped to its box; mapped back to the frame (0..1)
  const res = dets.map((d) => ({ name: NAMES[d.c], cls: d.c, p: d.p,
    box: [(d.b[0] - px) / s / w, (d.b[1] - py) / s / h, (d.b[2] - px) / s / w, (d.b[3] - py) / s / h] }));
  let mask = null;
  if (dets.length) {
    const M = o1.dims[2], pr = o1.data, d = dets[0], m = new Uint8ClampedArray(M * M), k = M / SZ;
    for (let yy = 0; yy < M; yy++) for (let xx = 0; xx < M; xx++) {
      const X = xx / k, Y = yy / k; if (X < d.b[0] || X > d.b[2] || Y < d.b[1] || Y > d.b[3]) continue;
      let v = 0; for (let c = 0; c < 32; c++) v += d.coef[c] * pr[c * M * M + yy * M + xx];
      m[yy * M + xx] = 255 / (1 + Math.exp(-v));
    }
    mask = { data: m, size: M, px: px * k, py: py * k, nw: nw * k, nh: nh * k };
  }
  return { dets: res, mask };
}
self.onmessage = async (e) => {
  const d = e.data;
  try {
    if (!session) { loading = loading || load(d.base); await loading; }
    if (d.cmd === "load") { self.postMessage({ cmd: "ready" }); return; }
    const t0 = performance.now(), r = await detect(d.rgba, d.w, d.h);
    self.postMessage({ cmd: "result", id: d.id, ...r, ms: performance.now() - t0 }, r.mask ? [r.mask.data.buffer] : []);
  } catch (err) { self.postMessage({ cmd: "error", id: d.id, msg: String(err && err.stack || err) }); }
};
