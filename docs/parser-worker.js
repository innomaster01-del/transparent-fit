/* Clothes & body-part parser (SegFormer-B2, 18 classes) running fully on the device.
   The graph is a flat plan of ops; heavy maths runs in SIMD WebAssembly (kern.wasm). */
let P = null, K = null, mem = null, heap0 = 0;
const consts = new Map();
async function load(base) {
  const [plan, bin, wasm] = await Promise.all([
    fetch(base + "parser.json").then((r) => r.json()),
    Promise.all([1, 2].map((k) => fetch(base + "parser-" + k + ".wasm").then((r) => { if (!r.ok) throw new Error("parser weights " + r.status); return r.arrayBuffer(); }))).then(([a, b]) => { const u = new Uint8Array(a.byteLength + b.byteLength); u.set(new Uint8Array(a), 0); u.set(new Uint8Array(b), a.byteLength); return u.buffer; }),
    fetch(base + "kern.wasm").then((r) => r.arrayBuffer()),
  ]);
  mem = new WebAssembly.Memory({ initial: 256 });
  const { instance } = await WebAssembly.instantiate(wasm, { env: { memory: mem } });
  K = instance.exports; heap0 = (K.heap() + 15) & ~15;
  for (const [k, m] of Object.entries(plan.consts)) {
    const n = m.s.reduce((a, b) => a * b, 1);
    let a;
    if (m.t === "u8") { const q = new Uint8Array(bin, m.o, n); a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = q[i] * m.sc + m.min; }
    else if (m.t === "f32") a = new Float32Array(bin.slice(m.o, m.o + 4 * n));
    else a = new Int32Array(bin.slice(m.o, m.o + 4 * n));
    consts.set(k, { d: a, s: m.s });
  }
  P = plan;
}
// ---- WASM scratch: a bump allocator reset per call
let top = 0;
function wreset() { top = heap0; }
function walloc(n) {
  const at = top; top += ((n * 4 + 15) & ~15);
  if (top > mem.buffer.byteLength) mem.grow(Math.ceil((top - mem.buffer.byteLength) / 65536) + 16);
  return at;
}
const F = (ptr, n) => new Float32Array(mem.buffer, ptr, n);
const size = (s) => s.reduce((a, b) => a * b, 1);
const strides = (s) => { const r = new Array(s.length); let k = 1; for (let i = s.length - 1; i >= 0; i--) { r[i] = k; k *= s[i]; } return r; };
function bcast(a, b, out, f) {
  const n = size(out), o = new Float32Array(n), A = a.d, B = b.d, op = f;
  if (A.length === n && B.length === n) {
    if (op === "add") for (let i = 0; i < n; i++) o[i] = A[i] + B[i];
    else if (op === "sub") for (let i = 0; i < n; i++) o[i] = A[i] - B[i];
    else for (let i = 0; i < n; i++) o[i] = A[i] * B[i];
    return o;
  }
  if (out.length <= 4) return bcast4(a, b, out, op, o);
  throw new Error("broadcast rank " + out.length);
}
function bcast4(a, b, out, op, o) {
  const os = pad(out, 4), pa = pad(a.s, 4), pb = pad(b.s, 4), sa = strides(pa), sb = strides(pb);
  const za = pa.map((v, i) => (v === 1 ? 0 : sa[i])), zb = pb.map((v, i) => (v === 1 ? 0 : sb[i])), A = a.d, B = b.d;
  const n3 = os[3], s3a = za[3], s3b = zb[3];
  let i = 0;
  for (let p = 0; p < os[0]; p++) for (let q = 0; q < os[1]; q++) for (let r = 0; r < os[2]; r++) {
    let ia = p * za[0] + q * za[1] + r * za[2], ib = p * zb[0] + q * zb[1] + r * zb[2];
    if (op === "add") for (let s = 0; s < n3; s++, ia += s3a, ib += s3b) o[i++] = A[ia] + B[ib];
    else if (op === "sub") for (let s = 0; s < n3; s++, ia += s3a, ib += s3b) o[i++] = A[ia] - B[ib];
    else for (let s = 0; s < n3; s++, ia += s3a, ib += s3b) o[i++] = A[ia] * B[ib];
  }
  return o;
}
const pad = (s, r) => { const x = s.slice(); while (x.length < r) x.unshift(1); return x; };
function sameTail(s, out) { let i = 0; while (i < s.length - 1 && s[i] === 1) i++; const t = s.slice(i), off = out.length - t.length; return off >= 0 && t.every((v, k) => v === out[off + k]); }
function erf(x) { const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a);
  return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a)); }
function transpose(x, perm) {
  const s = x.s, r = s.length, os = perm.map((p) => s[p]), n = x.d.length, o = new Float32Array(n), is = strides(s), st = perm.map((p) => is[p]);
  if (r === 4) { const [a, b, c, d] = os, [s0, s1, s2, s3] = st; let i = 0;
    for (let p = 0; p < a; p++) for (let q = 0; q < b; q++) for (let u = 0; u < c; u++) { let base = p * s0 + q * s1 + u * s2; for (let v = 0; v < d; v++) o[i++] = x.d[base + v * s3]; } return { d: o, s: os }; }
  if (r === 3) { const [a, b, c] = os, [s0, s1, s2] = st; let i = 0;
    for (let p = 0; p < a; p++) for (let q = 0; q < b; q++) { const base = p * s0 + q * s1; for (let v = 0; v < c; v++) o[i++] = x.d[base + v * s2]; } return { d: o, s: os }; }
  const oss = strides(os);
  for (let i = 0; i < n; i++) { let t = i, j = 0; for (let k = 0; k < r; k++) { const c = Math.floor(t / oss[k]); t -= c * oss[k]; j += c * st[k]; } o[i] = x.d[j]; }
  return { d: o, s: os };
}
function matmul(a, b, ax, ay, outShape) {
  if (ax) a = transpose(a, [...a.s.keys()].map((k, i, arr) => i < arr.length - 2 ? i : i === arr.length - 2 ? arr.length - 1 : arr.length - 2));
  if (ay) b = transpose(b, [...b.s.keys()].map((k, i, arr) => i < arr.length - 2 ? i : i === arr.length - 2 ? arr.length - 1 : arr.length - 2));
  const M = a.s[a.s.length - 2], Kd = a.s[a.s.length - 1], N = b.s[b.s.length - 1];
  const ba = a.d.length / (M * Kd), bb = b.d.length / (Kd * N), nb = Math.max(ba, bb);
  const out = new Float32Array(nb * M * N);
  wreset();
  const pb = walloc(Kd * N), pa = walloc(M * Kd), pc = walloc(M * N);
  let lastB = -1;
  for (let i = 0; i < nb; i++) {
    const ib = bb === 1 ? 0 : i;
    if (ib !== lastB) { F(pb, Kd * N).set(b.d.subarray(ib * Kd * N, (ib + 1) * Kd * N)); lastB = ib; }
    const ia = ba === 1 ? 0 : i;
    F(pa, M * Kd).set(a.d.subarray(ia * M * Kd, (ia + 1) * M * Kd));
    K.gemm4(pa, pb, pc, M, Kd, N, 0);
    out.set(F(pc, M * N), i * M * N);
  }
  return out;
}
function conv(x, f, bias, stride, relu, outShape) {
  const [, H, W, C] = x.s, [KH, KW, , O] = f.s, [, OH, OW] = outShape;
  wreset();
  const px = walloc(H * W * C), pg = walloc(OH * OW * C), pf = walloc(C * O), po = walloc(OH * OW * O);
  F(px, H * W * C).set(x.d);
  for (let i = 0; i < KH; i++) for (let j = 0; j < KW; j++) {
    K.gather(px, pg, H, W, C, OH, OW, stride, i, j);
    F(pf, C * O).set(f.d.subarray((i * KW + j) * C * O, (i * KW + j + 1) * C * O));
    K.gemm4(pg, pf, po, OH * OW, C, O, i + j > 0 ? 1 : 0);
  }
  const o = new Float32Array(F(po, OH * OW * O));
  if (bias) for (let i = 0; i < o.length; i++) o[i] += bias.d[i % O];
  if (relu) for (let i = 0; i < o.length; i++) if (o[i] < 0) o[i] = 0;
  return o;
}
function dwconv(x, f, bias, stride, outShape) {
  const [, H, W, C] = x.s, [KH, KW] = f.s, [, OH, OW] = outShape;
  wreset();
  const px = walloc(H * W * C), pf = walloc(KH * KW * C), po = walloc(OH * OW * C);
  F(px, H * W * C).set(x.d); F(pf, KH * KW * C).set(f.d);
  K.dwconv(px, pf, po, H, W, C, KH, KW, OH, OW, stride);
  const o = new Float32Array(F(po, OH * OW * C));
  if (bias) for (let i = 0; i < o.length; i++) o[i] += bias.d[i % C];
  return o;
}
function pad4(x, p, os) {
  const s = x.s, o = new Float32Array(size(os)), so = strides(os);
  for (let i = 0; i < s[0]; i++) for (let j = 0; j < s[1]; j++) for (let k = 0; k < s[2]; k++) {
    const src = ((i * s[1] + j) * s[2] + k) * s[3];
    const dst = (i + p[0]) * so[0] + (j + p[2]) * so[1] + (k + p[4]) * so[2] + p[6];
    o.set(x.d.subarray(src, src + s[3]), dst);
  }
  return o;
}
function resize(x, oh, ow) {
  const [N, H, W, C] = x.s, o = new Float32Array(N * oh * ow * C);
  const tap = (n_in, n_out) => { const r = []; for (let q = 0; q < n_out; q++) { const s = (q + 0.5) * n_in / n_out - 0.5, s0 = Math.floor(s), f = s - s0; r.push([Math.min(Math.max(s0, 0), n_in - 1), Math.min(Math.max(s0 + 1, 0), n_in - 1), f]); } return r; };
  const ty = tap(H, oh), tx = tap(W, ow);
  for (let n = 0; n < N; n++) for (let y = 0; y < oh; y++) { const [y0, y1, fy] = ty[y];
    for (let x2 = 0; x2 < ow; x2++) { const [x0, x1, fx] = tx[x2];
      const a = ((n * H + y0) * W + x0) * C, b = ((n * H + y0) * W + x1) * C, c = ((n * H + y1) * W + x0) * C, d = ((n * H + y1) * W + x1) * C, oo = ((n * oh + y) * ow + x2) * C;
      for (let k = 0; k < C; k++) o[oo + k] = (x.d[a + k] * (1 - fx) + x.d[b + k] * fx) * (1 - fy) + (x.d[c + k] * (1 - fx) + x.d[d + k] * fx) * fy; } }
  return o;
}
function mean(x, axes, keep) {
  const s = x.s, r = s.length; axes = axes.map((a) => (a < 0 ? a + r : a));
  if (axes.length === 1 && axes[0] === r - 1) { const m = s[r - 1], n = x.d.length / m, o = new Float32Array(n);
    for (let i = 0; i < n; i++) { let t = 0; for (let k = 0; k < m; k++) t += x.d[i * m + k]; o[i] = t / m; } return o; }
  const os = s.map((v, i) => (axes.includes(i) ? 1 : v)), o = new Float32Array(size(os)), cnt = axes.reduce((a, i) => a * s[i], 1), ss = strides(s), so = strides(os);
  for (let i = 0; i < x.d.length; i++) { let t = i, j = 0; for (let k = 0; k < r; k++) { const c = Math.floor(t / ss[k]); t -= c * ss[k]; if (!axes.includes(k)) j += c * so[k]; } o[j] += x.d[i]; }
  for (let i = 0; i < o.length; i++) o[i] /= cnt; return o;
}
/** SegFormer decode head, folded: per stage one small matrix at low resolution, upsample, sum, ReLU, classify. */
function decodeHead(I, stages) {
  const n = stages.length, R = 128, D = 768, acc = new Float32Array(R * R * D);
  for (let k = 0; k < n; k++) {
    const [C, HW] = stages[k], h = Math.round(Math.sqrt(HW)), x = I[k], M = I[n + k];
    const xt = transpose({ d: x.d, s: [C, HW] }, [1, 0]).d;            // HW x C
    const y = matmul({ d: xt, s: [HW, C] }, { d: M.d, s: [C, D] }, false, false);
    const up = h === R ? y : resize({ d: y, s: [1, h, h, D] }, R, R);
    for (let i = 0; i < acc.length; i++) acc[i] += up[i];
  }
  const b = I[2 * n].d;
  for (let i = 0; i < acc.length; i++) { const v = acc[i] + b[i % D]; acc[i] = v > 0 ? v : 0; }
  const W = I[2 * n + 1], bc = I[2 * n + 2].d, nc = bc.length;
  const lg = matmul({ d: acc, s: [R * R, D] }, { d: W.d, s: [D, nc] }, false, false);
  const out = new Float32Array(nc * R * R);
  for (let p = 0; p < R * R; p++) for (let c = 0; c < nc; c++) out[c * R * R + p] = lg[p * nc + c] + bc[c];
  return out;
}
function run(input, progress) {
  const vals = new Map(), last = new Map();
  P.plan.forEach((op, i) => op.in.forEach((r) => r.t && last.set(r.t, i)));
  const get = (r) => { if (r.c) return consts.get(r.c); if (r.x) return input; const v = vals.get(r.t); return Array.isArray(v) ? v[r.i] : v; };
  P.plan.forEach((op, idx) => {
    const I = op.in.map(get), os = op.out[0]; let out;
    switch (op.op) {
      case "AddV2": out = bcast(I[0], I[1], os, "add"); break;
      case "Sub": out = bcast(I[0], I[1], os, "sub"); break;
      case "Mul": out = bcast(I[0], I[1], os, "mul"); break;
      case "Square": out = I[0].d.map((v) => v * v); break;
      case "Rsqrt": out = I[0].d.map((v) => 1 / Math.sqrt(v)); break;
      case "Erf": out = I[0].d.map(erf); break;
      case "Relu": out = I[0].d.map((v) => (v > 0 ? v : 0)); break;
      case "Identity": out = I[0].d; break;
      case "Reshape": out = I[0].d; break;
      case "Transpose": out = transpose(I[0], Array.from(I[1].d)).d; break;
      case "Mean": out = mean(I[0], Array.from(I[1].d), op.at.keep); break;
      case "BatchMatMulV2": out = matmul(I[0], I[1], op.at.ax, op.at.ay, os); break;
      case "Softmax": { const m = os[os.length - 1], d = I[0].d, o = new Float32Array(d.length);
        for (let i = 0; i < d.length; i += m) { let mx = -Infinity; for (let k = 0; k < m; k++) mx = Math.max(mx, d[i + k]); let t = 0;
          for (let k = 0; k < m; k++) { const e = Math.exp(d[i + k] - mx); o[i + k] = e; t += e; } for (let k = 0; k < m; k++) o[i + k] /= t; } out = o; break; }
      case "Pad": if (I[0].s.length === 4) { out = pad4(I[0], I[1].d, os); break; }
      {  const p = I[1].d, s = I[0].s, o = new Float32Array(size(os)), so = strides(os), ss = strides(s);
        for (let i = 0; i < I[0].d.length; i++) { let t = i, j = 0; for (let k = 0; k < s.length; k++) { const c = Math.floor(t / ss[k]); t -= c * ss[k]; j += (c + p[2 * k]) * so[k]; } o[j] = I[0].d[i]; } out = o; break; }
      case "_FusedConv2D": out = conv(I[0], I[1], op.at.fused.includes("BiasAdd") ? I[2] : null, op.at.stride, op.at.fused.includes("Relu"), os); break;
      case "FusedDepthwiseConv2dNative": out = dwconv(I[0], I[1], op.at.fused.includes("BiasAdd") ? I[2] : null, op.at.stride, os); break;
      case "ResizeBilinear": out = resize(I[0], os[1], os[2]); break;
      case "SplitV": { const ax = I[2].d[0] < 0 ? I[2].d[0] + I[0].s.length : I[2].d[0], s = I[0].s, outer = size(s.slice(0, ax)), inner = size(s.slice(ax + 1));
        let start = 0; out = op.out.map((sh) => { const len = sh[ax], o = new Float32Array(size(sh));
          for (let a = 0; a < outer; a++) o.set(I[0].d.subarray((a * s[ax] + start) * inner, (a * s[ax] + start + len) * inner), a * len * inner); start += len; return o; }); break; }
      case "ConcatV2": { const xs = I.slice(0, -1); let ax = I[I.length - 1].d[0]; if (ax < 0) ax += os.length; const outer = size(os.slice(0, ax)), inner = size(os.slice(ax + 1)), o = new Float32Array(size(os)); let off = 0;
        for (const x of xs) { const len = x.s[ax]; for (let a = 0; a < outer; a++) o.set(x.d.subarray(a * len * inner, (a + 1) * len * inner), (a * os[ax] + off) * inner); off += len; } out = o; break; }
      case "DecodeHead": out = decodeHead(I, op.at.stages); break;
      default: throw new Error("op " + op.op);
    }
    vals.set(op.n, Array.isArray(out) ? out.map((d, k) => ({ d, s: op.out[k] })) : { d: out, s: os });
    op.in.forEach((r) => { if (r.t && last.get(r.t) === idx) vals.delete(r.t); });
    if (progress && idx % 60 === 0) progress(idx / P.plan.length);
  });
  return vals.get(P.output);
}
self.onmessage = async (e) => {
  const { cmd } = e.data;
  try {
    if (cmd === "load") { await load(e.data.base); self.postMessage({ cmd: "ready" }); return; }
    if (cmd === "parse") {
      if (!P) await load(e.data.base);
      const t0 = performance.now();
        const out = run({ d: e.data.input, s: [1, 512, 512, 3] }, (f) => self.postMessage({ cmd: "progress", f }));
      self.postMessage({ cmd: "done", logits: out.d, shape: out.s, ms: performance.now() - t0 }, [out.d.buffer]);
    }
  } catch (err) { self.postMessage({ cmd: "error", msg: String(err && err.stack || err) }); }
};
