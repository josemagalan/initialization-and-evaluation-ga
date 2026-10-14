/*
 * Diversificación secuencial: inhibición secuencial simple (simple sequential inhibition, SSI).
 *
 * Los candidatos se generan uno a uno con la regla aleatoria uniforme (los mismos números que js/items/uniform.js
 * con la misma semilla, así que los N primeros candidatos son la población uniforme). Un candidato entra en la
 * población solo si su distancia normalizada (js/space.js) a todos los individuos ya aceptados es al menos δ;
 * si no, se descarta y se genera otro. Si tras MAX_PER_IND · N candidatos la población no está completa, los
 * siguientes candidatos entran sin comprobar la distancia (se marcan como forzados): δ era demasiado grande.
 *
 * run(...) devuelve la población, todos los candidatos con su distancia al individuo más cercano y la decisión,
 * la población uniforme de N individuos con la misma semilla y las medidas de las dos.
 * Funciona tanto en el navegador (window.GAX.items.ssi) como en Node (module.exports).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const S = isNode ? require('../space.js') : root.GAX.space;
  const U = isNode ? require('./uniform.js') : root.GAX.items.uniform;

  const ENCODINGS = S.ENCODINGS;
  const MAX_PER_IND = 50;
  const DELTA = { min: 0.05, max: 0.8, step: 0.05 };
  /** δ por defecto: algo por debajo de la distancia media de una población uniforme. */
  const DEFAULT_DELTA = {
    'knapsack-bits': 0.3, 'assignment-int': 0.4, 'assignment-matrix': 0.3,
    'tsp-perm': 0.5, 'function-real': 0.15, 'function-bits': 0.15,
  };
  const EPS = 1e-9;

  const normDelta = (enc, d) => {
    const v = Math.round(Number(d) * 100) / 100;
    return Number.isFinite(v) && v >= DELTA.min - EPS && v <= DELTA.max + EPS ? v : DEFAULT_DELTA[enc];
  };

  /**
   * Población por inhibición secuencial: { pop, candidates, total, forced, shape, dec }.
   * candidates[c] = { x, draws, dmin, nearest, accepted, forced, ind } (ind: posición en la población si entra).
   */
  function population(enc, inst, N, seed, delta) {
    const sh = S.shape(enc, inst);
    const next = U.stream(seed, U.DEC[sh.kind]);
    const pop = [];
    const candidates = [];
    const cap = MAX_PER_IND * N;
    while (pop.length < N) {
      const c = U.individual(sh, next);
      let dmin = Infinity;
      let nearest = null;
      pop.forEach((y, i) => { const d = S.distance(enc, inst, c.x, y); if (d < dmin) { dmin = d; nearest = i; } });
      const ok = !pop.length || dmin >= delta - EPS;
      const forced = !ok && candidates.length >= cap;
      const cand = { x: c.x, draws: c.draws, dmin: pop.length ? dmin : null, nearest, accepted: ok || forced, forced, ind: null };
      if (cand.accepted) { cand.ind = pop.length; pop.push(c.x); }
      candidates.push(cand);
    }
    return { pop, candidates, total: candidates.length, forced: candidates.filter((c) => c.forced).length, shape: sh, dec: U.DEC[sh.kind] };
  }

  /**
   * Traza. Etapas: 1 regla · 2 candidatos uno a uno (hasta ver dos rechazos) · 3 el resto de la población,
   * individuo a individuo · 4 diversidad frente a la uniforme · 5 coste.
   */
  function run(enc, inst, N, seed, opts) {
    const delta = normDelta(enc, opts && opts.delta);
    const g = population(enc, inst, N, seed, delta);
    const u = U.population(enc, inst, N, seed);
    const measures = S.measures(enc, inst, g.pop);
    const uniformMeasures = S.measures(enc, inst, u.pop);
    const steps = [];
    const snap = (type, stage, extra) => steps.push(Object.assign({ type, stage, done: 0, ind: null, draw: null }, extra));
    snap('ssi_rule', 1, {});
    // Etapa 2: candidato a candidato hasta el segundo rechazo
    let rejected = 0;
    let c = 0;
    for (; c < g.candidates.length; c++) {
      const cd = g.candidates[c];
      if (!cd.accepted) rejected++;
      const done = cd.accepted ? cd.ind + 1 : g.candidates.slice(0, c).filter((x) => x.accepted).length;
      snap(cd.accepted ? 'cand_ok' : 'cand_rej', 2, { cand: c, done, ind: cd.accepted ? cd.ind : null, near: cd.nearest });
      if (rejected >= 2 || done >= N) { c++; break; }
    }
    // Etapa 3: un paso por individuo aceptado, con los rechazos desde el anterior
    let since = 0;
    for (; c < g.candidates.length; c++) {
      const cd = g.candidates[c];
      if (!cd.accepted) { since++; continue; }
      snap('ssi_ind', 3, { ind: cd.ind, done: cd.ind + 1, cand: c, rejected: since });
      since = 0;
    }
    snap('ssi_pop', 3, { done: N });
    snap('ssi_dist', 4, { done: N, show: 'distance' });
    snap('ssi_cost', 5, { done: N, ghost: true });
    snap('ssi_end', 5, { done: N });
    return {
      delta, pop: g.pop, candidates: g.candidates, total: g.total, forced: g.forced, shape: g.shape, dec: g.dec,
      draws: g.candidates.filter((x) => x.accepted).map((x) => x.draws),
      uniformPop: u.pop, measures, uniformMeasures, info: S.spaceInfo(enc, inst), steps,
      columns: ['mUniformPop', 'mPop_ssi'], costs: [N, g.total],
    };
  }

  const api = { ENCODINGS, MAX_PER_IND, DELTA, DEFAULT_DELTA, normDelta, population, run };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).items = root.GAX.items || {}).ssi = api;
})(typeof self !== 'undefined' ? self : this);
