/*
 * Inicialización factible: generar solo individuos que cumplen las restricciones.
 *
 *   mochila   se baraja el orden de los objetos (Fisher–Yates, como en js/items/uniform.js) y se recorren en ese
 *             orden: cada objeto entra si cabe. La mochila queda llena: no cabe ningún objeto más.
 *   matriz    cada tarea i va a una máquina j = 1 + ⌊u · m⌋ y la fila i lleva un único 1, en la columna j.
 *             Es uniforme sobre las asignaciones válidas (lo mismo que la codificación entera).
 * Los números aleatorios se truncan a 3 decimales, como en la inicialización uniforme.
 *
 * run(...) devuelve la población, los sorteos de cada individuo, la población uniforme de N individuos con la misma
 * semilla y las medidas de las dos.
 * Funciona tanto en el navegador (window.GAX.items.feasible) como en Node (module.exports).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const S = isNode ? require('../space.js') : root.GAX.space;
  const U = isNode ? require('./uniform.js') : root.GAX.items.uniform;

  const ENCODINGS = ['knapsack-bits', 'assignment-matrix'];
  const DEC = 3;

  /** Mochila llena a partir de un orden aleatorio: { x, perm, swaps, decisions }. */
  function fillKnapsack(inst, next) {
    const n = inst.weights.length;
    const perm = Array.from({ length: n }, (_, i) => i + 1);
    const swaps = [];
    for (let k = n; k >= 2; k--) {
      const u = next();
      const j = 1 + Math.floor(u * k);
      [perm[k - 1], perm[j - 1]] = [perm[j - 1], perm[k - 1]];
      swaps.push({ u, k, j });
    }
    const x = Array(n).fill(0);
    let w = 0;
    const decisions = perm.map((item) => {
      const wi = inst.weights[item - 1];
      const fits = w + wi <= inst.capacity;
      if (fits) { x[item - 1] = 1; w += wi; }
      return { item, weight: wi, fits, total: w };
    });
    return { x, perm, swaps, decisions };
  }

  /** Matriz con un 1 por fila: { x, rows } con rows[i] = { u, j }. */
  function oneHotRows(inst, next) {
    const n = inst.p.length;
    const m = inst.p[0].length;
    const x = Array(n * m).fill(0);
    const rows = [];
    for (let i = 0; i < n; i++) {
      const u = next();
      const j = 1 + Math.floor(u * m);
      x[i * m + j - 1] = 1;
      rows.push({ u, j, task: i + 1 });
    }
    return { x, rows };
  }

  function population(enc, inst, N, seed) {
    const sh = S.shape(enc, inst);
    const next = U.stream(seed, DEC);
    const out = [];
    for (let i = 0; i < N; i++) out.push(enc === 'knapsack-bits' ? fillKnapsack(inst, next) : oneHotRows(inst, next));
    return { pop: out.map((o) => o.x), details: out, shape: sh, dec: DEC };
  }

  /**
   * Traza. Etapas: 1 el espacio y sus factibles · 2 la regla · 3 primer individuo paso a paso ·
   * 4 el resto de la población · 5 factibilidad, diversidad y calidad frente a la uniforme.
   */
  function run(enc, inst, N, seed) {
    const g = population(enc, inst, N, seed);
    const u = U.population(enc, inst, N, seed);
    const measures = S.measures(enc, inst, g.pop);
    const uniformMeasures = S.measures(enc, inst, u.pop);
    const sh = g.shape;
    const steps = [];
    const snap = (type, stage, extra) => steps.push(Object.assign({ type, stage, done: 0, ind: null, draw: null }, extra));
    snap('f_space', 1, {});
    snap('f_rule', 2, {});
    const d0 = g.details[0];
    if (enc === 'knapsack-bits') {
      snap('f_order', 3, { ind: 0, partial: { known: [] } });
      d0.decisions.forEach((d, k) => snap('f_item', 3, {
        ind: 0, draw: k, partial: { known: d0.decisions.slice(0, k + 1).map((e) => e.item - 1), active: [d.item - 1] },
      }));
    } else {
      d0.rows.forEach((r, i) => {
        const known = [];
        for (let t = 0; t <= i; t++) for (let j = 0; j < sh.m; j++) known.push(t * sh.m + j);
        snap('f_row', 3, { ind: 0, draw: i, partial: { known, active: Array.from({ length: sh.m }, (_, j) => i * sh.m + j) } });
      });
    }
    snap('first', 3, { ind: 0, done: 1 });
    for (let i = 1; i < N; i++) snap('f_ind', 4, { ind: i, done: i + 1 });
    snap('f_pop', 4, { done: N });
    snap('f_feas', 5, { done: N, ghost: true });
    snap('f_dist', 5, { done: N, show: 'distance' });
    snap('f_quality', 5, { done: N, ghost: true });
    snap('f_end', 5, { done: N });
    return {
      pop: g.pop, details: g.details, shape: sh, dec: g.dec, uniformPop: u.pop,
      measures, uniformMeasures, info: S.spaceInfo(enc, inst), steps, columns: ['mUniformPop', 'mPop_feasible'],
    };
  }

  const api = { ENCODINGS, DEC, fillKnapsack, oneHotRows, population, run };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).items = root.GAX.items || {}).feasible = api;
})(typeof self !== 'undefined' ? self : this);
