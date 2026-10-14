/*
 * Aptitud aproximada: un metamodelo barato sustituye a parte de las evaluaciones reales (Talbi, 2009, §1.4.2.6;
 * Jin, 2005). El archivo son los N individuos de la población inicial uniforme, evaluados de verdad; los candidatos,
 * otros N individuos uniformes (los siguientes del mismo flujo), que se estiman con el metamodelo:
 *   nn    vecino más cercano: F̂(x) = F(xₖ), con xₖ el punto del archivo más cercano a x
 *   idw   ponderación por la inversa del cuadrado de la distancia: F̂(x) = Σ wₖ F(xₖ) / Σ wₖ, wₖ = 1/dₖ²
 *         (si x coincide con un punto del archivo, F̂(x) = F(xₖ))
 * La distancia es la euclídea entre los puntos (decodificados, en la cadena binaria). Preselección: de los N
 * candidatos solo se evalúan de verdad los K = ⌈N/2⌉ que el metamodelo da por mejores.
 *
 * run(enc, inst, N, seed, { method }) → { archive, cands, pred, truth, errors, preselected, ... }
 * Funciona tanto en el navegador (window.GAX.items.surrogate) como en Node (module.exports).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const S = isNode ? require('../space.js') : root.GAX.space;
  const U = isNode ? require('./uniform.js') : root.GAX.items.uniform;
  const F = isNode ? require('../fitness.js') : root.GAX.fitness;

  const ENCODINGS = ['function-real', 'function-bits'];
  const METHODS = ['nn', 'idw'];

  /** Estimación de la aptitud en el punto p a partir del archivo [{ p, fit }]: { value, near, d }. */
  function predict(method, archive, p) {
    const ds = archive.map((a) => Math.hypot(a.p[0] - p[0], a.p[1] - p[1]));
    let near = 0;
    ds.forEach((d, k) => { if (d < ds[near]) near = k; });
    if (method === 'nn' || ds[near] === 0) return { value: archive[near].fit, near, d: ds[near], ds };
    let sw = 0;
    let swf = 0;
    archive.forEach((a, k) => { const w = 1 / (ds[k] * ds[k]); sw += w; swf += w * a.fit; });
    return { value: swf / sw, near, d: ds[near], ds };
  }

  /** Correlación de rangos de Spearman (rangos medios en los empates). */
  function spearman(a, b) {
    const rank = (v) => {
      const o = v.map((_, i) => i).sort((i, j) => v[i] - v[j]);
      const r = Array(v.length);
      for (let k = 0; k < o.length;) {
        let e = k;
        while (e + 1 < o.length && v[o[e + 1]] === v[o[k]]) e++;
        for (let q = k; q <= e; q++) r[o[q]] = (k + e) / 2 + 1;
        k = e + 1;
      }
      return r;
    };
    const ra = rank(a);
    const rb = rank(b);
    const n = a.length;
    const m = (n + 1) / 2;
    let sab = 0;
    let saa = 0;
    let sbb = 0;
    for (let i = 0; i < n; i++) { sab += (ra[i] - m) * (rb[i] - m); saa += (ra[i] - m) ** 2; sbb += (rb[i] - m) ** 2; }
    return saa > 0 && sbb > 0 ? sab / Math.sqrt(saa * sbb) : null;
  }

  /**
   * Traza. Etapas: 1 archivo evaluado · 2 regla del metamodelo · 3 primer candidato · 4 todos los candidatos ·
   * 5 preselección y ahorro.
   */
  function run(enc, inst, N, seed, opts) {
    const method = METHODS.indexOf(opts && opts.method) !== -1 ? opts.method : 'nn';
    const g = U.population(enc, inst, 2 * N, seed);
    const archivePop = g.pop.slice(0, N);
    const cands = g.pop.slice(N);
    const archive = archivePop.map((x) => ({ x, p: S.point(enc, inst, x), fit: F.evaluate(enc, inst, x).fitness }));
    const preds = cands.map((x) => predict(method, archive, S.point(enc, inst, x)));
    const pred = preds.map((p) => p.value);
    const truth = cands.map((x) => F.evaluate(enc, inst, x).fitness);
    const errors = pred.map((v, i) => Math.abs(v - truth[i]));
    const K = Math.ceil(N / 2);
    const byPred = cands.map((_, i) => i).sort((i, j) => pred[i] - pred[j] || i - j);
    const preselected = byPred.slice(0, K);
    const trueBest = truth.reduce((b, v, i) => (v < truth[b] ? i : b), 0);
    const bestOfPre = preselected.reduce((b, i) => (truth[i] < truth[b] ? i : b), preselected[0]);
    const steps = [];
    const snap = (type, stage, extra) => steps.push(Object.assign({ type, stage, done: N, ind: null, draw: null }, extra));
    snap('s_archive', 1, { gen: 0, show: 'smap' });
    snap('s_rule', 2, { gen: 1, done: 0, show: 'smap', allGenes: true });
    snap('s_first', 3, { gen: 1, done: 0, ind: 0, peek: 0, show: 'smap', allGenes: true, predOnly: 0 });
    snap('s_all', 4, { gen: 1, show: 'sscatter' });
    snap('s_presel', 5, { gen: 1, show: 'sscatter', presel: true });
    snap('s_end', 5, { gen: 1, show: 'smap', presel: true });
    return {
      pop: archivePop, draws: g.draws.slice(0, N), shape: g.shape, dec: g.dec, method, archive, cands, preds, pred, truth, errors,
      mae: errors.reduce((a, b) => a + b, 0) / N, maxErr: Math.max(...errors), rho: spearman(pred, truth),
      K, preselected, trueBest, bestOfPre, foundBest: preselected.indexOf(trueBest) !== -1,
      steps, info: S.spaceInfo(enc, inst), measures: { optimum: S.optimum(enc, inst) },
    };
  }

  const api = { ENCODINGS, METHODS, predict, spearman, run };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).items = root.GAX.items || {}).surrogate = api;
})(typeof self !== 'undefined' ? self : this);
