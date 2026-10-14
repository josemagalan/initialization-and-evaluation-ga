/*
 * Coste de evaluar: un algoritmo genético generacional evalúa N individuos por generación, N · (G + 1) en total.
 * Para ver cuántas de esas evaluaciones se repiten, la población inicial uniforme (js/items/uniform.js, misma semilla)
 * evoluciona G generaciones con un algoritmo mínimo, sin cruce:
 *   selección   torneo binario con reemplazo: dos índices a = ⌊u · N⌋, b = ⌊u · N⌋; pasa el de mejor aptitud
 *               (a igualdad, a)
 *   mutación    cada gen, con probabilidad 1/L, se vuelve a sortear con la regla uniforme de su tipo (bit cambiado,
 *               entero 1 + ⌊u · m⌋, real a + u (b − a) en centésimas) o, en la permutación, se intercambia con la
 *               posición ⌊u · L⌋ + 1
 * Con una caché (tabla genotipo → aptitud), un individuo que ya se ha evaluado no se vuelve a evaluar.
 * Con el mismo presupuesto de N · (G + 1) evaluaciones, la caché deja llegar más lejos: se siguen generando
 * generaciones (hasta MAX_GEN) mientras las evaluaciones con caché no pasen del presupuesto.
 *
 * run(enc, inst, N, seed, { G }) → { gens, budget, reach, steps, ... }
 * Funciona tanto en el navegador (window.GAX.items.cost) como en Node (module.exports).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const S = isNode ? require('../space.js') : root.GAX.space;
  const R = isNode ? require('../rng.js') : root.GAX.rng;
  const U = isNode ? require('./uniform.js') : root.GAX.items.uniform;
  const F = isNode ? require('../fitness.js') : root.GAX.fitness;

  const ENCODINGS = S.ENCODINGS;
  const GENS = { min: 1, max: 10, def: 6 };
  const MAX_GEN = 60;

  const normG = (v) => { const n = Number(v); return Number.isInteger(n) && n >= GENS.min && n <= GENS.max ? n : GENS.def; };

  /** Flujo de la evolución, distinto del de la población inicial. */
  function stream(seed) {
    return R.mulberry32((Math.imul(R.seedState(seed), 2246822519) ^ 0x2545f491) >>> 0);
  }

  /** Hijo mutado: cada gen, con probabilidad 1/L, se vuelve a sortear con la regla uniforme de su tipo. */
  function mutate(sh, x, next) {
    const y = x.slice();
    const L = y.length;
    for (let g = 0; g < L; g++) {
      if (next() >= 1 / L) continue;
      const u = next();
      if (sh.kind === 'perm') { const j = Math.floor(u * L); [y[g], y[j]] = [y[j], y[g]]; }
      else if (sh.kind === 'int') y[g] = U.intGene(u, sh.m);
      else if (sh.kind === 'real') y[g] = U.realGene(u, sh.a, sh.b);
      else y[g] = 1 - y[g];
    }
    return y;
  }

  /** Siguiente generación: N torneos binarios con reemplazo y mutación. */
  function nextGeneration(sh, pop, fits, sense, next) {
    const N = pop.length;
    return pop.map(() => {
      const a = Math.floor(next() * N);
      const b = Math.floor(next() * N);
      const w = F.better(sense, fits[b], fits[a]) ? b : a;
      return mutate(sh, pop[w], next);
    });
  }

  /**
   * Evaluación de una sucesión de generaciones con y sin caché.
   * Devuelve, por generación: { pop, hit (¿estaba en la caché?), dupWithin, newEvals, cumNo, cumCache, cacheSize }.
   */
  function countEvaluations(pops, key) {
    const k = key || F.genotypeKey;
    const cache = new Set();
    let cumNo = 0;
    let cumCache = 0;
    return pops.map((pop) => {
      const seenBefore = new Set(cache);
      const hit = pop.map((x) => { const h = cache.has(k(x)); cache.add(k(x)); return h; });
      const newEvals = hit.filter((h) => !h).length;
      cumNo += pop.length;
      cumCache += newEvals;
      const dupWithin = pop.filter((x, i) => hit[i] && !seenBefore.has(k(x))).length;
      return { pop, hit, newEvals, dupWithin, cumNo, cumCache, cacheSize: cache.size };
    });
  }

  /**
   * Traza. Etapas: 1 presupuesto · 2 generación 0 · 3 generaciones 1…G con la caché · 4 evaluaciones acumuladas ·
   * 5 con el mismo presupuesto.
   */
  function run(enc, inst, N, seed, opts) {
    const G = normG(opts && opts.G);
    const g0 = U.population(enc, inst, N, seed);
    const sh = g0.shape;
    const sense = S.sense(enc);
    const next = stream(seed);
    const budget = N * (G + 1);
    const pops = [g0.pop];
    const evalsOf = (pop) => pop.map((x) => F.evaluate(enc, inst, x));
    const evals = [evalsOf(g0.pop)];
    // Se sigue evolucionando más allá de G para ver hasta dónde llega el presupuesto con caché
    let counts = countEvaluations(pops);
    while (pops.length <= MAX_GEN && (pops.length <= G || counts[counts.length - 1].cumCache <= budget)) {
      const last = pops.length - 1;
      const p = nextGeneration(sh, pops[last], evals[last].map((e) => e.fitness), sense, next);
      pops.push(p);
      evals.push(evalsOf(p));
      counts = countEvaluations(pops);
    }
    let reach = 0;
    counts.forEach((c, g) => { if (c.cumCache <= budget) reach = g; });
    const reachCapped = reach >= MAX_GEN && counts[MAX_GEN].cumCache <= budget;
    const gens = counts.slice(0, G + 1).map((c, g) => Object.assign(c, { evals: evals[g] }));
    const extended = counts.map((c) => ({ cumNo: c.cumNo, cumCache: c.cumCache, newEvals: c.newEvals }));
    const steps = [];
    const snap = (type, stage, extra) => steps.push(Object.assign({ type, stage, done: N, ind: null, draw: null }, extra));
    snap('c_budget', 1, { gen: 0, done: 0, allGenes: true });
    snap('c_gen0', 2, { gen: 0 });
    for (let k = 1; k <= G; k++) snap('c_gen', 3, { gen: k, show: 'cost' });
    snap('c_curve', 4, { gen: G, show: 'cost' });
    snap('c_reach', 5, { gen: G, show: 'cost', extended: true });
    snap('c_end', 5, { gen: G, show: 'cost', extended: true });
    return {
      pop: g0.pop, draws: g0.draws, shape: sh, dec: g0.dec, G, gens, extended, budget, reach, reachCapped, sense,
      steps, info: S.spaceInfo(enc, inst), measures: { optimum: S.optimum(enc, inst) },
    };
  }

  const api = { ENCODINGS, GENS, MAX_GEN, normG, stream, mutate, nextGeneration, countEvaluations, run };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).items = root.GAX.items || {}).cost = api;
})(typeof self !== 'undefined' ? self : this);
