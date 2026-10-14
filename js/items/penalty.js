/*
 * Restricciones como penalización: a la aptitud de un individuo infactible se le resta (mochila, se maximiza) o se
 * le suma (asignación con matriz binaria, se minimiza) un término que crece con la violación v:
 *   lineal       P = λ · v
 *   cuadrática   P = (λ · v)²          (como la mochila de representation-ga, que sigue a Michalewicz, 1996)
 * con v = e = máx(0, peso − W) en la mochila y v = Σᵢ |Σⱼ yᵢⱼ − 1| en la matriz (js/fitness.js).
 * La población es la inicial uniforme (js/items/uniform.js) con la misma semilla.
 *
 * Peso crítico λ*: con λ > λ*, ningún infactible de la población iguala ni mejora al mejor factible. Para cada
 * infactible i con objetivo zᵢ y violación vᵢ, y el mejor objetivo factible B:
 *   lineal  λᵢ = d / vᵢ      cuadrática  λᵢ = √d / vᵢ,   con d = máx(0, zᵢ − B) (mochila) o máx(0, B − zᵢ) (matriz)
 *   λ* = máxᵢ λᵢ (0 si no hay infactibles; sin factibles no está definido).
 *
 * run(enc, inst, N, seed, { type, lambda }) → { pop, evals, fits, ranking, best, lambdaStar, curves, steps, ... }
 * Funciona tanto en el navegador (window.GAX.items.penalty) como en Node (module.exports).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const S = isNode ? require('../space.js') : root.GAX.space;
  const U = isNode ? require('./uniform.js') : root.GAX.items.uniform;
  const F = isNode ? require('../fitness.js') : root.GAX.fitness;

  const ENCODINGS = ['knapsack-bits', 'assignment-matrix'];
  const TYPES = F.PENALTY_TYPES;
  // Los rangos de λ de representation-ga
  const LAMBDA = {
    'knapsack-bits': { min: 0, max: 5, step: 0.1, def: 1 },
    'assignment-matrix': { min: 0, max: 10, step: 0.5, def: 1 },
  };

  /** λ dentro de su rango y en su rejilla (o el de por defecto). */
  function normLambda(enc, v) {
    const L = LAMBDA[enc] || LAMBDA['knapsack-bits'];
    const n = Number(v);
    if (v == null || v === '' || !Number.isFinite(n)) return L.def;
    const k = Math.round((Math.min(L.max, Math.max(L.min, n)) - L.min) / L.step);
    return Math.round((L.min + k * L.step) * 100) / 100;
  }

  /** Peso crítico λ* de una población evaluada (objetivo z y violación v de cada individuo) o null sin factibles. */
  function criticalLambda(evals, sense, type) {
    const feas = evals.filter((e) => e.violation === 0).map((e) => e.objective);
    if (!feas.length) return null;
    const B = sense === 'max' ? Math.max(...feas) : Math.min(...feas);
    let star = 0;
    evals.forEach((e) => {
      if (e.violation === 0) return;
      const d = Math.max(0, sense === 'max' ? e.objective - B : B - e.objective);
      const li = (type === 'quadratic' ? Math.sqrt(d) : d) / e.violation;
      if (li > star) star = li;
    });
    return { lambda: star, bestFeasible: B };
  }

  /** Aptitud de cada individuo para una rejilla de valores de λ: [{ lambda, fits, best }]. */
  function curves(evals, sense, type, L, points) {
    const out = [];
    const n = points || 101;
    for (let k = 0; k < n; k++) {
      const lambda = L.min + ((L.max - L.min) * k) / (n - 1);
      const fits = evals.map((e) => {
        const p = e.violation ? F.penaltyTerm(type, lambda, e.violation) : 0;
        return sense === 'max' ? e.objective - p : e.objective + p;
      });
      out.push({ lambda, fits, best: F.ranking(fits, sense).order[0] });
    }
    return out;
  }

  /**
   * Traza. Etapas: 1 población y objetivo · 2 violación · 3 penalización (regla y un ejemplo) ·
   * 4 aptitud de todos y el mejor · 5 el peso λ.
   */
  function run(enc, inst, N, seed, opts) {
    const type = TYPES.indexOf(opts && opts.type) !== -1 ? opts.type : 'linear';
    const lambda = normLambda(enc, opts && opts.lambda);
    const g = U.population(enc, inst, N, seed);
    const evals = g.pop.map((x) => F.evaluate(enc, inst, x, { type, lambda }));
    const sense = S.sense(enc);
    const fits = evals.map((e) => e.fitness);
    const rk = F.ranking(fits, sense);
    const best = rk.order[0];
    const firstBad = evals.findIndex((e) => e.violation > 0);
    const star = criticalLambda(evals, sense, type);
    const L = LAMBDA[enc];
    const atMin = F.ranking(evals.map((e) => (e.violation ? (sense === 'max' ? e.objective - F.penaltyTerm(type, L.min, e.violation) : e.objective + F.penaltyTerm(type, L.min, e.violation)) : e.objective)), sense).order[0];
    const atMax = F.ranking(evals.map((e) => (e.violation ? (sense === 'max' ? e.objective - F.penaltyTerm(type, L.max, e.violation) : e.objective + F.penaltyTerm(type, L.max, e.violation)) : e.objective)), sense).order[0];
    const steps = [];
    const snap = (type2, stage, extra) => steps.push(Object.assign({ type: type2, stage, done: N, ind: null, draw: null }, extra));
    snap('p_pop', 1, { cols: 1 });
    snap('p_viol', 2, { cols: 2 });
    snap('p_rule', 3, { cols: 2 });
    snap('p_first', 3, { cols: 3, ind: firstBad >= 0 ? firstBad : 0, only: firstBad >= 0 ? firstBad : 0 });
    snap('p_fit', 4, { cols: 3, show: 'penalty' });
    snap('p_best', 4, { cols: 3, show: 'penalty', ind: best });
    snap('p_lambda', 5, { cols: 3, show: 'lambda', ind: best });
    snap('p_end', 5, { cols: 3, show: 'lambda' });
    return {
      pop: g.pop, draws: g.draws, shape: g.shape, dec: g.dec, evals, fits, ranking: rk, best, sense, type, lambda,
      firstBad, lambdaStar: star, lambdaRange: L, bestAtMin: atMin, bestAtMax: atMax, curves: curves(evals, sense, type, L),
      feasibleCount: evals.filter((e) => e.violation === 0).length,
      steps, info: S.spaceInfo(enc, inst), measures: { optimum: S.optimum(enc, inst) },
    };
  }

  const api = { ENCODINGS, TYPES, LAMBDA, normLambda, criticalLambda, curves, run };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).items = root.GAX.items || {}).penalty = api;
})(typeof self !== 'undefined' ? self : this);
