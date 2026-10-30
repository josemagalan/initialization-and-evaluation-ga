/*
 * Contraejemplo: sembrar la población inicial con una solución de una heurística voraz.
 *
 * La población sembrada son N − K individuos aleatorios uniformes (los mismos que da js/items/uniform.js con la
 * misma semilla) y K copias de la solución heurística. Se compara con la población uniforme de N individuos y se
 * aproxima de forma determinista las copias de la mejor solución tras cada generación de torneo binario solo,
 * sin cruce, mutación ni élite (esperanza de un paso condicionada a k: k' = N · (1 − (1 − k/N)²) si la semilla es el mejor individuo).
 *
 * Heurísticas (desempates por el menor índice):
 *   mochila     objetos por relación valor/peso decreciente; cada uno entra si cabe
 *   asignación  cada tarea, en orden, a la máquina en la que terminaría antes (carga + tiempo)
 *   viajante    vecino más cercano desde la ciudad 1
 * Funciona tanto en el navegador (window.GAX.items.seeded) como en Node (module.exports).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const S = isNode ? require('../space.js') : root.GAX.space;
  const U = isNode ? require('./uniform.js') : root.GAX.items.uniform;
  const TSP = isNode ? require('../problems/tsp-perm.js') : root.GAX.problems['tsp-perm'];

  const ENCODINGS = ['knapsack-bits', 'assignment-int', 'tsp-perm'];
  const GENERATIONS = 8;

  /** Solución voraz y el orden en que se ha construido: { x, order }. */
  function greedy(enc, inst) {
    if (enc === 'knapsack-bits') {
      const n = inst.weights.length;
      const idx = Array.from({ length: n }, (_, i) => i)
        .sort((i, j) => inst.values[j] * inst.weights[i] - inst.values[i] * inst.weights[j] || i - j);
      const x = Array(n).fill(0);
      let w = 0;
      const order = [];
      idx.forEach((i) => {
        const fits = w + inst.weights[i] <= inst.capacity;
        if (fits) { x[i] = 1; w += inst.weights[i]; }
        order.push({ item: i + 1, fits });
      });
      return { x, order };
    }
    if (enc === 'assignment-int') {
      const n = inst.p.length;
      const m = inst.p[0].length;
      const load = Array(m).fill(0);
      const x = [];
      const order = [];
      for (let i = 0; i < n; i++) {
        let best = 0;
        for (let j = 1; j < m; j++) if (load[j] + inst.p[i][j] < load[best] + inst.p[i][best]) best = j;
        load[best] += inst.p[i][best];
        x.push(best + 1);
        order.push({ task: i + 1, machine: best + 1, end: load[best] });
      }
      return { x, order };
    }
    // Vecino más cercano
    const n = inst.coords.length;
    const tour = [1];
    const left = new Set(Array.from({ length: n - 1 }, (_, i) => i + 2));
    while (left.size) {
      const last = tour[tour.length - 1];
      let best = null;
      left.forEach((c) => { if (best == null || TSP.distTenths(inst, last, c) < TSP.distTenths(inst, last, best) || (TSP.distTenths(inst, last, c) === TSP.distTenths(inst, last, best) && c < best)) best = c; });
      tour.push(best);
      left.delete(best);
    }
    return { x: tour, order: tour.map((c) => ({ city: c })) };
  }

  /** Aproximación determinista: itera la esperanza de un paso, no la media exacta de poblaciones finitas. */
  function takeover(K, N, G) {
    const out = [{ g: 0, k: K }];
    let k = K;
    for (let g = 1; g <= G; g++) {
      k = N * (1 - (1 - k / N) * (1 - k / N));
      out.push({ g, k });
    }
    return out;
  }

  /**
   * run(enc, inst, N, seed, { K }) → { pop, uniformPop, seedRows, heuristic, measures, uniformMeasures, curve, steps, shape }
   * Etapas: 1 heurística · 2 población sembrada (aleatorios y semillas) · 3 diversidad · 4 toma de control · 5 conclusión.
   */
  function run(enc, inst, N, seed, opts) {
    const K = Math.max(1, Math.min(N, (opts && opts.K) || 1));
    const g = U.population(enc, inst, N, seed);
    const h = greedy(enc, inst);
    const pop = g.pop.slice(0, N - K).concat(Array.from({ length: K }, () => h.x.slice()));
    const seedRows = Array.from({ length: K }, (_, i) => N - K + i);
    const measures = S.measures(enc, inst, pop);
    const uniformMeasures = S.measures(enc, inst, g.pop);
    const hq = S.quality(enc, inst, h.x);
    const better = (a, b) => (S.sense(enc) === 'max' ? a > b : a < b);
    const notWorse = g.pop.slice(0, N - K).map((x) => S.quality(enc, inst, x))
      .filter((q) => q.feasible && !better(hq.objective, q.objective)).length;   // aleatorios tan buenos como la semilla o mejores
    const curve = takeover(K, N, GENERATIONS);
    const steps = [];
    const snap = (type, stage, extra) => steps.push(Object.assign({ type, stage, done: 0, ind: null, draw: null }, extra));
    snap('heur', 1, { done: N, onlySeed: true });
    snap('random', 2, { done: N, onlyRandom: true });
    snap('mix', 2, { done: N });
    snap('div', 3, { done: N, show: 'distance' });
    for (let k = 1; k <= GENERATIONS; k++) snap('gen', 4, { done: N, show: 'takeover', gen: k });
    snap('end', 5, { done: N, show: 'takeover', gen: GENERATIONS });
    return {
      pop, uniformPop: g.pop, draws: g.draws, shape: g.shape, dec: g.dec, seedRows, K,
      heuristic: Object.assign({ quality: hq, notWorse }, h),
      measures, uniformMeasures, curve, steps, info: S.spaceInfo(enc, inst),
    };
  }

  const api = { ENCODINGS, GENERATIONS, greedy, takeover, run };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).items = root.GAX.items || {}).seeded = api;
})(typeof self !== 'undefined' ? self : this);
