/*
 * Adaptador común a las seis codificaciones de representation-ga para trabajar con poblaciones:
 * instancias con semilla, calidad de un individuo (factibilidad y objetivo), óptimo, tamaño del espacio
 * de búsqueda, distancia entre dos individuos y medidas de diversidad de una población.
 * Funciona tanto en el navegador (window.GAX.space) como en Node (module.exports).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const req = (p, k) => (isNode ? require(p) : root.GAX[k]);
  const Fn = req('./func.js', 'func');
  const A = req('./assignment.js', 'assignment');
  const KS = isNode ? require('./problems/knapsack-bits.js') : root.GAX.problems['knapsack-bits'];
  const TSP = isNode ? require('./problems/tsp-perm.js') : root.GAX.problems['tsp-perm'];

  const ENCODINGS = ['knapsack-bits', 'assignment-int', 'assignment-matrix', 'tsp-perm', 'function-real', 'function-bits'];

  // Tamaños: por defecto y límites (los de representation-ga, salvo k, acotado para que quepa la fila de genes)
  const LIMITS = {
    knapsack: { n: [5, 12], def: 8 },
    assignment: { n: [5, 8], m: [2, 4], defN: 6, defM: 3 },
    tsp: { n: [5, 10], def: 7 },
    bits: { k: [2, 8], def: 5 },
    pop: { N: [4, 20], def: 10 },
  };
  const FNS = Fn.FN_IDS;
  const clampInt = (v, [lo, hi], def) => { const n = Number(v); return Number.isInteger(n) && n >= lo && n <= hi ? n : def; };

  /** Parámetros de la instancia normalizados (lo que no sea válido toma su valor por defecto). */
  function params(enc, p) {
    p = p || {};
    if (enc === 'knapsack-bits') return { n: clampInt(p.n, LIMITS.knapsack.n, LIMITS.knapsack.def) };
    if (enc === 'assignment-int' || enc === 'assignment-matrix') {
      return { n: clampInt(p.n, LIMITS.assignment.n, LIMITS.assignment.defN), m: clampInt(p.m, LIMITS.assignment.m, LIMITS.assignment.defM) };
    }
    if (enc === 'tsp-perm') return { n: clampInt(p.n, LIMITS.tsp.n, LIMITS.tsp.def) };
    const fn = FNS.indexOf(p.fn) !== -1 ? p.fn : 'himmelblau';
    return enc === 'function-bits' ? { fn, k: clampInt(p.k, LIMITS.bits.k, LIMITS.bits.def) } : { fn };
  }

  /** Instancia del problema con la semilla s (la misma que daría representation-ga). */
  function instance(enc, s, p) {
    const q = params(enc, p);
    if (enc === 'knapsack-bits') return KS.randomInstance(s, q.n);
    if (enc === 'assignment-int' || enc === 'assignment-matrix') return A.randomInstance(s, q.n, q.m);
    if (enc === 'tsp-perm') return TSP.randomInstance(s, q.n);
    return enc === 'function-bits' ? { fn: q.fn, k: q.k } : { fn: q.fn };
  }

  /** Forma del cromosoma: { kind, length, values } para dibujar y sortear los genes. */
  function shape(enc, inst) {
    if (enc === 'knapsack-bits') return { kind: 'bits', length: inst.weights.length };
    if (enc === 'assignment-int') { const s = A.sizes(inst); return { kind: 'int', length: s.n, m: s.m }; }
    if (enc === 'assignment-matrix') { const s = A.sizes(inst); return { kind: 'matrix', length: s.n * s.m, n: s.n, m: s.m }; }
    if (enc === 'tsp-perm') return { kind: 'perm', length: inst.coords.length };
    if (enc === 'function-bits') return { kind: 'bits', length: 2 * inst.k, k: inst.k };
    const F = Fn.fnOf(inst.fn);
    return { kind: 'real', length: 2, a: F.a, b: F.b };
  }

  /** Sentido de la optimización: el objetivo se maximiza (mochila) o se minimiza (el resto). */
  const sense = (enc) => (enc === 'knapsack-bits' ? 'max' : 'min');

  /** Matriz n × m a partir del cromosoma aplanado (fila a fila), y al revés. */
  const toRows = (flat, m) => Array.from({ length: flat.length / m }, (_, i) => flat.slice(i * m, (i + 1) * m));

  /** Punto del plano que representa un individuo de la función (decodificado si es binario). */
  function point(enc, inst, x) {
    if (enc === 'function-bits') return Fn.decodeBits(inst.fn, x, inst.k, 'standard').point;
    return x.slice();
  }

  /**
   * Calidad de un individuo sin tratar la infactibilidad: { feasible, objective, ... }.
   * Un individuo infactible no tiene objetivo (null): cómo se le da una aptitud es cosa de la evaluación.
   */
  function quality(enc, inst, x) {
    if (enc === 'knapsack-bits') {
      const weight = KS.weightOf(inst, x);
      const value = KS.valueOf(inst, x);
      return { feasible: weight <= inst.capacity, objective: weight <= inst.capacity ? value : null, weight, value };
    }
    if (enc === 'assignment-int') return { feasible: true, objective: A.makespan(inst, x) };
    if (enc === 'assignment-matrix') {
      const y = toRows(x, A.sizes(inst).m);
      const a = A.fromMatrix(y);
      return { feasible: !!a, objective: a ? A.makespan(inst, a) : null, violations: A.violations(y) };
    }
    if (enc === 'tsp-perm') return { feasible: true, objective: TSP.tourLength(inst, x) };
    const p = point(enc, inst, x);
    return { feasible: Fn.inBox(inst.fn, p), objective: Fn.evalAt(inst.fn, p), point: p };
  }

  const optCache = new Map();
  /** Óptimo del problema (exacto en los discretos; el mínimo global, 0, en la función). */
  function optimum(enc, inst) {
    const key = `${enc}:${JSON.stringify(inst)}`;
    if (optCache.has(key)) return optCache.get(key);
    let v;
    if (enc === 'knapsack-bits') v = KS.enumerate(inst).optimum;
    else if (enc === 'assignment-int' || enc === 'assignment-matrix') v = A.optimum(inst).makespan;
    else if (enc === 'tsp-perm') v = TSP.optimum(inst).length;
    else if (enc === 'function-bits') v = Fn.bestRepresentable(inst.fn, inst.k).f;
    else v = Fn.fnOf(inst.fn).fmin;
    if (optCache.size > 200) optCache.clear();
    optCache.set(key, v);
    return v;
  }

  const factorial = (k) => (k <= 1 ? 1 : k * factorial(k - 1));
  /**
   * Espacio de búsqueda: { chromosomes, feasible (o null si no se cuenta), solutions (soluciones distintas),
   * exp (exponente si chromosomes es una potencia: { base, exp }) }.
   */
  function spaceInfo(enc, inst) {
    if (enc === 'knapsack-bits') {
      const e = KS.enumerate(inst);
      return { chromosomes: e.total, feasible: e.feasible, power: { base: 2, exp: inst.weights.length } };
    }
    if (enc === 'assignment-int') { const s = A.sizes(inst); return { chromosomes: Math.pow(s.m, s.n), feasible: Math.pow(s.m, s.n), power: { base: s.m, exp: s.n } }; }
    if (enc === 'assignment-matrix') {
      const s = A.sizes(inst);
      return { chromosomes: Math.pow(2, s.n * s.m), feasible: Math.pow(s.m, s.n), power: { base: 2, exp: s.n * s.m } };
    }
    if (enc === 'tsp-perm') { const n = inst.coords.length; return { chromosomes: factorial(n), feasible: factorial(n), tours: factorial(n - 1) / 2, n }; }
    if (enc === 'function-bits') return { chromosomes: Math.pow(2, 2 * inst.k), feasible: Math.pow(2, 2 * inst.k), power: { base: 2, exp: 2 * inst.k } };
    const F = Fn.fnOf(inst.fn);
    return { chromosomes: null, feasible: null, box: [F.a, F.b] };
  }

  // ---------- Distancias ----------

  const hamming = (a, b) => a.reduce((s, v, i) => s + (v !== b[i] ? 1 : 0), 0);
  /** Aristas (no dirigidas) de un circuito, como claves «menor-mayor». */
  const edges = (t) => t.map((c, i) => { const d = t[(i + 1) % t.length]; return c < d ? `${c}-${d}` : `${d}-${c}`; });
  /** Distancia entre circuitos: aristas de uno que no están en el otro (0 si es el mismo circuito, aunque cambie el cromosoma). */
  function tourDistance(a, b) {
    const eb = new Set(edges(b));
    return edges(a).filter((e) => !eb.has(e)).length;
  }

  /**
   * Distancia normalizada en [0, 1] entre dos individuos y lo que significa:
   * Hamming en las cadenas de bits y de enteros, aristas distintas en el viajante y distancia euclídea
   * entre los puntos (decodificados) dividida por la diagonal de la caja en la función.
   */
  function distance(enc, inst, a, b) {
    if (enc === 'tsp-perm') return tourDistance(a, b) / a.length;
    if (enc === 'function-real' || enc === 'function-bits') {
      const p = point(enc, inst, a);
      const q = point(enc, inst, b);
      const F = Fn.fnOf(inst.fn);
      return Math.hypot(p[0] - q[0], p[1] - q[1]) / (Math.SQRT2 * (F.b - F.a));
    }
    return hamming(a, b) / a.length;
  }
  const DISTANCE_KIND = {
    'knapsack-bits': 'hamming', 'assignment-int': 'hamming', 'assignment-matrix': 'hamming',
    'tsp-perm': 'edges', 'function-real': 'euclid', 'function-bits': 'euclid',
  };

  /** Matriz de distancias normalizadas de la población. */
  function distanceMatrix(enc, inst, pop) {
    return pop.map((a) => pop.map((b) => distance(enc, inst, a, b)));
  }

  /** Entropía media por gen, normalizada en [0, 1] (bits y enteros; null en permutaciones y reales). */
  function geneEntropy(enc, inst, pop) {
    const sh = shape(enc, inst);
    if (sh.kind === 'perm' || sh.kind === 'real') return null;
    const k = sh.kind === 'int' ? sh.m : 2;
    let total = 0;
    for (let g = 0; g < sh.length; g++) {
      const count = new Map();
      pop.forEach((x) => count.set(x[g], (count.get(x[g]) || 0) + 1));
      let h = 0;
      count.forEach((c) => { const p = c / pop.length; h -= p * Math.log(p); });
      total += h / Math.log(k);
    }
    return total / sh.length;
  }

  /**
   * Cobertura de la caja en la función (null en los demás problemas):
   *   strata  por cada eje, cuántos de los N intervalos iguales de [a, b] tienen algún individuo (de N)
   *   hole    el mayor hueco: el punto de una rejilla de 41 × 41 de la caja más alejado de todos los individuos,
   *           { center, r } con r dividida por la diagonal de la caja (la misma escala que las distancias)
   */
  const HOLE_GRID = 40;
  function stratumOf(t, n) { return Math.max(0, Math.min(n - 1, Math.floor(t * n + 1e-9))); }
  function coverage(enc, inst, pop) {
    if (enc !== 'function-real' && enc !== 'function-bits') return null;
    const F = Fn.fnOf(inst.fn);
    const N = pop.length;
    const w = F.b - F.a;
    const pts = pop.map((x) => point(enc, inst, x));
    const strata = [0, 1].map((d) => new Set(pts.map((p) => stratumOf((p[d] - F.a) / w, N))).size);
    let hole = { r: -1, center: null };
    for (let i = 0; i <= HOLE_GRID; i++) {
      const x = F.a + (i * w) / HOLE_GRID;
      for (let j = 0; j <= HOLE_GRID; j++) {
        const y = F.a + (j * w) / HOLE_GRID;
        let m = Infinity;
        for (const p of pts) { const d = Math.hypot(p[0] - x, p[1] - y); if (d < m) m = d; }
        if (m > hole.r) hole = { r: m, center: [x, y] };
      }
    }
    return { strata, N, hole: { center: hole.center, r: hole.r / (Math.SQRT2 * w), radius: hole.r } };
  }

  /** Clave de un individuo: dos cromosomas iguales (en el viajante, el mismo circuito) dan la misma clave. */
  function key(enc, x) {
    if (enc !== 'tsp-perm') return x.join(',');
    return edges(x).sort().join('|');
  }

  /**
   * Medidas de diversidad y calidad de una población:
   * { meanDist, minDist, distinct, feasible, entropy, best, mean, worst, optimum, gap, sense, D }
   */
  function measures(enc, inst, pop) {
    const D = distanceMatrix(enc, inst, pop);
    const N = pop.length;
    let sum = 0;
    let min = Infinity;
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { sum += D[i][j]; if (D[i][j] < min) min = D[i][j]; }
    const pairs = (N * (N - 1)) / 2;
    const q = pop.map((x) => quality(enc, inst, x));
    const objs = q.filter((r) => r.feasible).map((r) => r.objective);
    const s = sense(enc);
    const better = (u, v) => (s === 'max' ? u > v : u < v);
    const best = objs.length ? objs.reduce((u, v) => (better(v, u) ? v : u)) : null;
    const worst = objs.length ? objs.reduce((u, v) => (better(v, u) ? u : v)) : null;
    const mean = objs.length ? objs.reduce((u, v) => u + v, 0) / objs.length : null;
    const opt = optimum(enc, inst);
    const gap = best == null ? null : (opt === 0 ? best - opt : Math.abs(best - opt) / Math.abs(opt));
    return {
      D, quality: q, meanDist: pairs ? sum / pairs : 0, minDist: pairs ? min : 0,
      distinct: new Set(pop.map((x) => key(enc, x))).size, feasible: objs.length, entropy: geneEntropy(enc, inst, pop),
      best, worst, mean, optimum: opt, gap, sense: s, coverage: coverage(enc, inst, pop),
    };
  }

  const api = {
    ENCODINGS, LIMITS, params, instance, shape, sense, toRows, point, quality, optimum, spaceInfo,
    hamming, edges, tourDistance, distance, DISTANCE_KIND, distanceMatrix, geneEntropy, stratumOf, coverage, key, measures,
  };
  if (isNode) module.exports = api;
  else (root.GAX = root.GAX || {}).space = api;
})(typeof self !== 'undefined' ? self : this);
