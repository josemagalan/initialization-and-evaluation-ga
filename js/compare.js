/*
 * Comparar estrategias de inicialización: para una instancia, cada estrategia aplicable a la codificación genera
 * muchas poblaciones de N individuos (semillas de población 1, 2, …, R) y se promedian sus medidas de diversidad,
 * factibilidad, calidad inicial, cobertura (función) y coste (candidatos generados por individuo).
 * Halton y Sobol son deterministas: dan la misma población en todas las réplicas y se calculan una vez.
 * Funciona tanto en el navegador (window.GAX.compare) como en Node (module.exports).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const S = isNode ? require('./space.js') : root.GAX.space;
  const items = isNode ? {
    uniform: require('./items/uniform.js'), seeded: require('./items/seeded.js'), quasi: require('./items/quasi.js'),
    ssi: require('./items/ssi.js'), feasible: require('./items/feasible.js'),
  } : root.GAX.items;

  const REPS = 1000;

  /**
   * Estrategias que se comparan para una codificación: [{ id, item, opts, deterministic, make(inst, N, seed) → { pop, cost } }].
   * id es también el sufijo de su texto (cmpRow_<id>); item, la página de la herramienta a la que enlaza.
   */
  function strategies(enc) {
    const out = [];
    out.push({ id: 'uniform', item: 'uniform', make: (inst, N, seed) => ({ pop: items.uniform.population(enc, inst, N, seed).pop, cost: N }) });
    if (items.seeded.ENCODINGS.indexOf(enc) !== -1) {
      const seeded = (K) => (inst, N, seed) => {
        const k = Math.max(1, Math.min(N, K(N)));
        const h = items.seeded.greedy(enc, inst).x;
        const pop = items.uniform.population(enc, inst, N - k, seed).pop.concat(Array.from({ length: k }, () => h.slice()));
        return { pop, cost: N };
      };
      out.push({ id: 'seeded1', item: 'seeded', opts: { K: 1 }, make: seeded(() => 1) });
      out.push({ id: 'seededHalf', item: 'seeded', opts: { K: 'half' }, make: seeded((N) => Math.floor(N / 2)) });
    }
    if (items.quasi.ENCODINGS.indexOf(enc) !== -1) {
      items.quasi.METHODS.forEach((m) => out.push({
        id: m, item: 'quasi', opts: { method: m }, deterministic: m !== 'lhs',
        make: (inst, N, seed) => ({ pop: items.quasi.population(enc, inst, N, seed, m).pop, cost: N }),
      }));
    }
    out.push({
      id: 'ssi', item: 'ssi', opts: { delta: items.ssi.DEFAULT_DELTA[enc] },
      make: (inst, N, seed) => { const g = items.ssi.population(enc, inst, N, seed, items.ssi.DEFAULT_DELTA[enc]); return { pop: g.pop, cost: g.total }; },
    });
    if (items.feasible.ENCODINGS.indexOf(enc) !== -1) {
      out.push({ id: 'feasible', item: 'feasible', make: (inst, N, seed) => ({ pop: items.feasible.population(enc, inst, N, seed).pop, cost: N }) });
    }
    return out;
  }

  /** Acumulador vacío de las medidas de una estrategia. */
  const emptyAcc = () => ({ n: 0, meanDist: 0, minDist: 0, distinct: 0, feasible: 0, best: 0, nBest: 0, strata: 0, hole: 0, cost: 0 });

  /** Suma al acumulador las réplicas r0…r1 (semillas de población). */
  function accumulate(acc, enc, inst, N, strat, r0, r1) {
    for (let r = r0; r <= r1; r++) {
      const g = strat.make(inst, N, r);
      const M = S.measures(enc, inst, g.pop);
      acc.n++;
      acc.meanDist += M.meanDist;
      acc.minDist += M.minDist;
      acc.distinct += M.distinct / N;
      acc.feasible += M.feasible / N;
      if (M.best != null) { acc.best += M.best; acc.nBest++; }
      if (M.coverage) {
        acc.strata += (M.coverage.strata[0] + M.coverage.strata[1]) / (2 * N);
        acc.hole += M.coverage.hole.r;
      }
      acc.cost += g.cost / N;
    }
    return acc;
  }

  /** Medias a partir del acumulador. */
  function finish(acc, enc, strat, reps) {
    const R = acc.n;
    const cov = enc === 'function-real' || enc === 'function-bits';
    return {
      meanDist: acc.meanDist / R, minDist: acc.minDist / R, distinct: acc.distinct / R, feasible: acc.feasible / R,
      best: acc.nBest ? acc.best / acc.nBest : null, noFeasible: (R - acc.nBest) / R,
      strata: cov ? acc.strata / R : null, hole: cov ? acc.hole / R : null, cost: acc.cost / R,
      reps: reps || REPS, deterministic: !!strat.deterministic,
    };
  }

  /**
   * Medidas medias de una estrategia en `reps` réplicas (semillas de población 1…reps):
   * { meanDist, minDist, distinct (proporción), feasible (proporción), best (media de las réplicas con algún
   *   factible, o null), noFeasible (proporción de réplicas sin ningún factible), strata (proporción), hole, cost
   *   (candidatos por individuo), reps, deterministic }. Las deterministas se calculan una sola vez.
   */
  function metrics(enc, inst, N, strat, reps) {
    const R = strat.deterministic ? 1 : (reps || REPS);
    return finish(accumulate(emptyAcc(), enc, inst, N, strat, 1, R), enc, strat, reps);
  }

  const api = { REPS, strategies, emptyAcc, accumulate, finish, metrics };
  if (isNode) module.exports = api;
  else (root.GAX = root.GAX || {}).compare = api;
})(typeof self !== 'undefined' ? self : this);
