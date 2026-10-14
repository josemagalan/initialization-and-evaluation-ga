/*
 * Paisaje de aptitud: el espacio de búsqueda, una relación de vecindad y la aptitud que ve el algoritmo
 * (Talbi, 2009, §2.2). La aptitud es la de js/fitness.js (penalización lineal con λ = 1 en la mochila y la matriz).
 *
 * Vecinos a un gen:
 *   bits (mochila, función binaria) y matriz   se cambia un bit
 *   enteros (asignación)                       una tarea pasa a otra máquina
 *   permutación (viajante)                     se intercambian dos posiciones
 *   reales (función)                           un gen sube o baja H = 0,1 (sin salir de la caja)
 * Búsqueda local de máximo descenso (o ascenso, en la mochila): se pasa al mejor vecino mientras mejore
 * estrictamente (a igualdad, el primero en el orden de los vecinos).
 * Correlación aptitud-distancia (FDC, Jones y Forrest, 1995): correlación de Pearson entre la aptitud, orientada a
 * minimizar (−F en la mochila), y la distancia normalizada al óptimo del problema más cercano, en una muestra uniforme
 * de SAMPLE individuos cuyos N primeros son la población.
 *
 * run(enc, inst, N, seed) → { pop, evals, fits, neighbours, climb, climbs, fdc, landscape, steps, ... }
 * Funciona tanto en el navegador (window.GAX.items.landscape) como en Node (module.exports).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const S = isNode ? require('../space.js') : root.GAX.space;
  const U = isNode ? require('./uniform.js') : root.GAX.items.uniform;
  const F = isNode ? require('../fitness.js') : root.GAX.fitness;
  const Fn = isNode ? require('../func.js') : root.GAX.func;
  const A = isNode ? require('../assignment.js') : root.GAX.assignment;
  const TSP = isNode ? require('../problems/tsp-perm.js') : root.GAX.problems['tsp-perm'];

  const ENCODINGS = S.ENCODINGS;
  const H = 0.1;
  const SAMPLE = 500;
  const MAX_STATES = 20000;   // espacios que se recorren enteros para contar óptimos locales
  const MAX_STEPS = 1000;

  const round2 = (v) => Math.round(v * 100) / 100 + 0;

  /** Vecinos a un gen de x: [{ x, label }] en un orden fijo. */
  function neighbours(enc, inst, x) {
    const sh = S.shape(enc, inst);
    const out = [];
    if (sh.kind === 'perm') {
      for (let i = 0; i < x.length; i++) {
        for (let j = i + 1; j < x.length; j++) {
          const y = x.slice();
          [y[i], y[j]] = [y[j], y[i]];
          out.push({ x: y, label: `${i + 1}↔${j + 1}` });
        }
      }
      return out;
    }
    if (sh.kind === 'int') {
      x.forEach((g, i) => {
        for (let v = 1; v <= sh.m; v++) {
          if (v === g) continue;
          const y = x.slice();
          y[i] = v;
          out.push({ x: y, label: `T${i + 1}→M${v}` });
        }
      });
      return out;
    }
    if (sh.kind === 'real') {
      [0, 1].forEach((i) => [1, -1].forEach((s) => {
        const v = round2(x[i] + s * H);
        if (v < sh.a || v > sh.b) return;
        const y = x.slice();
        y[i] = v;
        out.push({ x: y, label: `x${['₁', '₂'][i]}${s > 0 ? '+' : '−'}` });
      }));
      return out;
    }
    x.forEach((b, g) => {
      const y = x.slice();
      y[g] = 1 - b;
      out.push({ x: y, label: sh.kind === 'matrix' ? `T${Math.floor(g / sh.m) + 1}M${(g % sh.m) + 1}` : `g${g + 1}` });
    });
    return out;
  }

  const fitOf = (enc, inst, x) => F.evaluate(enc, inst, x).fitness;

  /** Vecinos evaluados de x y cuántos mejoran: { list: [{ x, label, fit, better }], better, best }. */
  function neighbourhood(enc, inst, x) {
    const sense = S.sense(enc);
    const f0 = fitOf(enc, inst, x);
    const list = neighbours(enc, inst, x).map((n) => {
      const fit = fitOf(enc, inst, n.x);
      return Object.assign(n, { fit, better: F.better(sense, fit, f0) });
    });
    let best = -1;
    list.forEach((n, k) => { if (n.better && (best < 0 || F.better(sense, n.fit, list[best].fit))) best = k; });
    return { list, better: list.filter((n) => n.better).length, best, fit: f0 };
  }

  /** Búsqueda local de máximo descenso desde x: [{ x, fit, move }] hasta un óptimo local. */
  function localSearch(enc, inst, x) {
    let cur = { x: x.slice(), fit: fitOf(enc, inst, x), move: null };
    const path = [cur];
    for (let k = 0; k < MAX_STEPS; k++) {
      const nb = neighbourhood(enc, inst, cur.x);
      if (nb.best < 0) break;
      const n = nb.list[nb.best];
      cur = { x: n.x, fit: n.fit, move: n.label };
      path.push(cur);
    }
    return path;
  }

  // ---------- Óptimos del problema y distancia a ellos ----------

  /** Soluciones óptimas del problema (o puntos, en la función) para medir la distancia. */
  function optimalSet(enc, inst) {
    if (enc === 'knapsack-bits') {
      const n = inst.weights.length;
      let best = -Infinity;
      let set = [];
      for (let m = 0; m < (1 << n); m++) {
        let w = 0;
        let v = 0;
        for (let i = 0; i < n; i++) if (m & (1 << i)) { w += inst.weights[i]; v += inst.values[i]; }
        if (w > inst.capacity) continue;
        const x = Array.from({ length: n }, (_, i) => (m >> i) & 1);
        if (v > best) { best = v; set = [x]; } else if (v === best) set.push(x);
      }
      return set;
    }
    if (enc === 'assignment-int' || enc === 'assignment-matrix') {
      const { n, m } = A.sizes(inst);
      const opt = A.optimum(inst).makespan;
      const a = Array(n).fill(1);
      const set = [];
      for (;;) {
        if (A.makespan(inst, a) === opt) set.push(enc === 'assignment-int' ? a.slice() : A.toMatrix(a, m).flat());
        let k = n - 1;
        while (k >= 0 && a[k] === m) { a[k] = 1; k--; }
        if (k < 0) break;
        a[k]++;
      }
      return set;
    }
    if (enc === 'tsp-perm') return [TSP.optimum(inst).tour];
    return Fn.fnOf(inst.fn).minima.map((p) => p.slice());
  }

  /** Distancia normalizada de x al óptimo más cercano. */
  function distanceToOptimum(enc, inst, x, set) {
    if (enc === 'function-real' || enc === 'function-bits') {
      const p = S.point(enc, inst, x);
      const Fd = Fn.fnOf(inst.fn);
      return Math.min(...set.map((q) => Math.hypot(p[0] - q[0], p[1] - q[1]))) / (Math.SQRT2 * (Fd.b - Fd.a));
    }
    return Math.min(...set.map((o) => S.distance(enc, inst, x, o)));
  }

  /** Correlación de Pearson (null si alguna varianza es 0). */
  function pearson(xs, ys) {
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let sxy = 0;
    let sxx = 0;
    let syy = 0;
    for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
    return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : null;
  }

  /** FDC con la aptitud orientada a minimizar: { r, points: [{ d, fit }] } (fit es la aptitud tal cual). */
  function fdc(enc, inst, pop, set) {
    const sense = S.sense(enc);
    const points = pop.map((x) => ({ d: distanceToOptimum(enc, inst, x, set), fit: fitOf(enc, inst, x) }));
    const r = pearson(points.map((p) => (sense === 'max' ? -p.fit : p.fit)), points.map((p) => p.d));
    return { r, points };
  }

  // ---------- Recorrido completo (espacios pequeños) ----------

  /** Todos los cromosomas de un espacio discreto pequeño, o null si es demasiado grande o continuo. */
  function allStates(enc, inst) {
    const sh = S.shape(enc, inst);
    let base;
    let len;
    if (enc === 'knapsack-bits' || enc === 'function-bits') { base = 2; len = sh.length; } else if (enc === 'assignment-int') { base = sh.m; len = sh.length; } else return null;
    if (Math.pow(base, len) > MAX_STATES) return null;
    const out = [];
    const x = Array(len).fill(0);
    for (;;) {
      out.push(enc === 'assignment-int' ? x.map((v) => v + 1) : x.slice());
      let k = len - 1;
      while (k >= 0 && x[k] === base - 1) { x[k] = 0; k--; }
      if (k < 0) break;
      x[k]++;
    }
    return out;
  }

  /** Óptimos locales del paisaje entero: { states, local, global } o null si no se recorre. */
  function landscapeStats(enc, inst) {
    const states = allStates(enc, inst);
    if (!states) return null;
    const sense = S.sense(enc);
    const fit = new Map(states.map((x) => [x.join(','), fitOf(enc, inst, x)]));
    let local = 0;
    let bestFit = null;
    fit.forEach((v) => { if (bestFit == null || F.better(sense, v, bestFit)) bestFit = v; });
    let global = 0;
    states.forEach((x) => {
      const f0 = fit.get(x.join(','));
      const isLocal = !neighbours(enc, inst, x).some((n) => F.better(sense, fit.get(n.x.join(',')), f0));
      if (isLocal) { local++; if (f0 === bestFit) global++; }
    });
    return { states: states.length, local, global, bestFit };
  }

  /** ¿Es el final de una búsqueda un óptimo del problema? */
  function reachesOptimum(enc, inst, e, opt) {
    if (enc === 'function-real') return e.objective < 0.5;
    if (enc === 'function-bits') return e.objective <= opt + 1e-9;
    return e.feasible && Math.abs(e.objective - opt) < 1e-9;
  }

  /**
   * Traza. Etapas: 1 paisaje · 2 vecinos del individuo 1 · 3 búsqueda local desde el individuo 1 ·
   * 4 búsqueda local desde toda la población · 5 correlación aptitud-distancia y óptimos locales.
   */
  function run(enc, inst, N, seed) {
    const sample = U.population(enc, inst, Math.max(SAMPLE, N), seed);
    const pop = sample.pop.slice(0, N);
    const evals = pop.map((x) => F.evaluate(enc, inst, x));
    const fits = evals.map((e) => e.fitness);
    const sense = S.sense(enc);
    const opt = S.optimum(enc, inst);
    const nb = neighbourhood(enc, inst, pop[0]);
    const climbs = pop.map((x) => {
      const path = localSearch(enc, inst, x);
      const end = path[path.length - 1];
      const e = F.evaluate(enc, inst, end.x);
      return { path, end: end.x, endFit: end.fit, steps: path.length - 1, optimum: reachesOptimum(enc, inst, e, opt), key: end.x.join(',') };
    });
    const set = optimalSet(enc, inst);
    const fd = fdc(enc, inst, sample.pop, set);
    const stats = landscapeStats(enc, inst);
    const steps = [];
    const snap = (type, stage, extra) => steps.push(Object.assign({ type, stage, done: N, ind: null, draw: null }, extra));
    snap('l_space', 1, {});
    snap('l_neigh', 2, { ind: 0, show: enc === 'function-real' ? 'cut' : 'neigh' });
    snap('l_climb', 3, { ind: 0, show: 'climb' });
    snap('l_pop', 4, { show: 'basins', ends: true });
    snap('l_fdc', 5, { show: 'fdc', ends: true });
    snap('l_end', 5, { show: 'fdc', ends: true });
    return {
      pop, draws: sample.draws.slice(0, N), shape: sample.shape, dec: sample.dec, evals, fits, sense, neighbours: nb,
      climbs, distinctEnds: new Set(climbs.map((c) => c.key)).size, reached: climbs.filter((c) => c.optimum).length,
      optimalSet: set, fdc: fd, landscape: stats, steps, info: S.spaceInfo(enc, inst), measures: { optimum: opt },
    };
  }

  const api = { ENCODINGS, H, SAMPLE, MAX_STATES, neighbours, neighbourhood, localSearch, optimalSet, distanceToOptimum, pearson, fdc, allStates, landscapeStats, reachesOptimum, run };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).items = root.GAX.items || {}).landscape = api;
})(typeof self !== 'undefined' ? self : this);
