/*
 * Del genotipo a la aptitud: se evalúa, individuo a individuo, una población inicial uniforme (la misma que da
 * js/items/uniform.js con la misma semilla). Para el primer individuo se ve cada eslabón de la cadena:
 * decodificar → objetivo → restricciones → aptitud (js/fitness.js); para el resto, el resultado. Al final, los
 * puestos de la población por aptitud y el número de evaluaciones.
 *
 * run(enc, inst, N, seed) → { pop, draws, shape, evals, fits, ranking, best, steps, info, sense }
 * Funciona tanto en el navegador (window.GAX.items.pipeline) como en Node (module.exports).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const S = isNode ? require('../space.js') : root.GAX.space;
  const U = isNode ? require('./uniform.js') : root.GAX.items.uniform;
  const F = isNode ? require('../fitness.js') : root.GAX.fitness;

  const ENCODINGS = S.ENCODINGS;

  /** Evalúa toda la población: una evaluación por individuo. */
  function evaluatePopulation(enc, inst, pop, opts) {
    return pop.map((x) => F.evaluate(enc, inst, x, opts));
  }

  /**
   * Traza. Etapas: 1 población sin evaluar · 2 decodificar (individuo 1) · 3 objetivo y restricciones (individuo 1) ·
   * 4 aptitud del individuo 1 y del resto, uno a uno · 5 puestos y coste.
   * step.phase dice hasta qué eslabón de la cadena se ve el individuo step.ind; step.done, cuántos están evaluados.
   */
  function run(enc, inst, N, seed) {
    const g = U.population(enc, inst, N, seed);
    const evals = evaluatePopulation(enc, inst, g.pop);
    const fits = evals.map((e) => e.fitness);
    const sense = S.sense(enc);
    const rk = F.ranking(fits, sense);
    const best = rk.order[0];
    const steps = [];
    const snap = (type, stage, extra) => steps.push(Object.assign({ type, stage, done: 0, ind: null, draw: null, allGenes: true }, extra));
    snap('e_pop', 1, {});
    snap('e_decode', 2, { ind: 0, phase: 1 });
    snap('e_objective', 3, { ind: 0, phase: 2, peek: 0 });
    snap('e_cons', 3, { ind: 0, phase: 3, peek: 0 });
    snap('e_fit', 4, { ind: 0, phase: 4, done: 1 });
    for (let i = 1; i < N; i++) snap('e_ind', 4, { ind: i, phase: 4, done: i + 1 });
    snap('e_rank', 5, { done: N, ind: best, phase: 4, rank: true });
    snap('e_count', 5, { done: N, rank: true });
    snap('e_end', 5, { done: N, rank: true });
    return {
      pop: g.pop, draws: g.draws, shape: g.shape, dec: g.dec, evals, fits, ranking: rk, best, sense,
      steps, info: S.spaceInfo(enc, inst), measures: { optimum: S.optimum(enc, inst) },
    };
  }

  const api = { ENCODINGS, evaluatePopulation, run };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).items = root.GAX.items || {}).pipeline = api;
})(typeof self !== 'undefined' ? self : this);
