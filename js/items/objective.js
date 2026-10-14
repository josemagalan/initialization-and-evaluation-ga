/*
 * Objetivo frente a aptitud: el objetivo de la asignación, el viajante y la función se minimiza, pero la selección
 * por ruleta reparte probabilidades proporcionales a la aptitud, que se tiene que maximizar y no puede ser negativa.
 * Se comparan cuatro formas de pasar de un coste f a una aptitud F (todas conservan el orden de los individuos):
 *   neg    F = −f                     negativa: la ruleta no se puede usar
 *   cmax   F = C − f, C = máx f       el peor individuo de la población recibe F = 0 (Goldberg, 1989)
 *   inv    F = 1 / (1 + f)            depende de la escala de f
 *   rank   F = puesto, del peor (1) al mejor (N); a igual f, la media de los puestos (Baker, 1985)
 * Ruleta: pᵢ = Fᵢ / Σ F, y copias esperadas del individuo i en N tiradas: N · pᵢ.
 *
 * run(enc, inst, N, seed, { transform }) → { pop, evals, f, table (las cuatro transformaciones), steps, ... }
 * Funciona tanto en el navegador (window.GAX.items.objective) como en Node (module.exports).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const S = isNode ? require('../space.js') : root.GAX.space;
  const U = isNode ? require('./uniform.js') : root.GAX.items.uniform;
  const F = isNode ? require('../fitness.js') : root.GAX.fitness;

  const ENCODINGS = ['assignment-int', 'tsp-perm', 'function-real', 'function-bits'];
  const TRANSFORMS = ['neg', 'cmax', 'inv', 'rank'];

  /** Puestos para la selección por rango: el peor (mayor f) 1, el mejor N; a igual f, la media de los puestos. */
  function ranks(f) {
    const order = f.map((_, i) => i).sort((i, j) => f[j] - f[i] || i - j);   // del peor al mejor
    const r = Array(f.length);
    for (let k = 0; k < order.length;) {
      let e = k;
      while (e + 1 < order.length && f[order[e + 1]] === f[order[k]]) e++;
      const mean = (k + 1 + e + 1) / 2;
      for (let q = k; q <= e; q++) r[order[q]] = mean;
      k = e + 1;
    }
    return r;
  }

  /** Aptitudes F a partir de los costes f: { F, C } (C solo en cmax). */
  function transform(kind, f) {
    if (kind === 'neg') return { F: f.map((v) => -v + 0) };
    if (kind === 'cmax') { const C = Math.max(...f); return { F: f.map((v) => C - v), C }; }
    if (kind === 'inv') return { F: f.map((v) => 1 / (1 + v)) };
    return { F: ranks(f) };
  }

  /** Probabilidades de la ruleta, pᵢ = Fᵢ / Σ F, o null si alguna aptitud es negativa o todas son 0. */
  function roulette(Fs) {
    if (Fs.some((v) => v < 0)) return null;
    const sum = Fs.reduce((a, b) => a + b, 0);
    if (!(sum > 0)) return null;
    return Fs.map((v) => v / sum);
  }

  /** Las cuatro transformaciones de una población: { kind: { F, C, p, pBest, pWorst, copiesBest, ratio } }. */
  function table(f) {
    const order = f.map((_, i) => i).sort((i, j) => f[i] - f[j] || i - j);
    const best = order[0];
    const worst = order[order.length - 1];
    const out = {};
    TRANSFORMS.forEach((k) => {
      const t = transform(k, f);
      const p = roulette(t.F);
      out[k] = Object.assign(t, {
        p, best, worst,
        pBest: p ? p[best] : null, pWorst: p ? p[worst] : null,
        copiesBest: p ? f.length * p[best] : null,
        ratio: p && p[worst] > 0 ? p[best] / p[worst] : null,
      });
    });
    return out;
  }

  /**
   * Traza. Etapas: 1 objetivo · 2 regla de la transformación · 3 aptitudes (individuo 1 y todos) ·
   * 4 ruleta (probabilidades, el mejor y el peor) · 5 comparación de las cuatro transformaciones.
   */
  function run(enc, inst, N, seed, opts) {
    const kind = TRANSFORMS.indexOf(opts && opts.transform) !== -1 ? opts.transform : 'cmax';
    const g = U.population(enc, inst, N, seed);
    const evals = g.pop.map((x) => F.evaluate(enc, inst, x));
    const f = evals.map((e) => e.objective);
    const T = table(f);
    const cur = T[kind];
    const steps = [];
    const snap = (type, stage, extra) => steps.push(Object.assign({ type, stage, done: N, ind: null, draw: null }, extra));
    snap('o_obj', 1, { cols: 1 });
    snap('o_rule', 2, { cols: 1 });
    snap('o_first', 3, { cols: 2, ind: 0 });
    snap('o_all', 3, { cols: 2 });
    snap('o_wheel', 4, { cols: 3, show: 'roulette' });
    snap('o_best', 4, { cols: 3, show: 'roulette', ind: cur.best });
    snap('o_worst', 4, { cols: 3, show: 'roulette', ind: cur.worst });
    snap('o_compare', 5, { cols: 3, show: 'shares' });
    snap('o_end', 5, { cols: 3, show: 'shares' });
    return {
      pop: g.pop, draws: g.draws, shape: g.shape, dec: g.dec, evals, f, table: T, transform: kind,
      fitnessValues: cur.F, probs: cur.p, steps, info: S.spaceInfo(enc, inst), measures: { optimum: S.optimum(enc, inst) },
    };
  }

  const api = { ENCODINGS, TRANSFORMS, ranks, transform, roulette, table, run };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).items = root.GAX.items || {}).objective = api;
})(typeof self !== 'undefined' ? self : this);
