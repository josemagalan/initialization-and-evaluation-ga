/*
 * Varios objetivos: cada individuo tiene dos objetivos en conflicto y no hay una única «mejor» solución
 * (Talbi, 2009, cap. 4; Deb, 2001).
 *   mochila      maximizar el valor y minimizar el peso (sin capacidad: la restricción pasa a ser un objetivo)
 *   asignación   minimizar el makespan y minimizar el tiempo total Σᵢ p(i, aᵢ)
 * Internamente los dos se minimizan: o = (−valor, peso) en la mochila y (makespan, tiempo total) en la asignación.
 *   suma ponderada   s = w · n₁ + (1 − w) · n₂, con nₖ = (oₖ − mín oₖ)/(máx oₖ − mín oₖ) en la población (0 si son iguales)
 *   dominancia       u ≺ v si u no es peor en ningún objetivo y es mejor en alguno
 *   frentes          ordenación no dominada: frente 1 = los no dominados; se quitan y se repite
 *   soportado        un individuo del frente 1 es el mejor de la suma ponderada para algún w de [0, 1]
 * Frente real (mochila hasta 2¹² cromosomas, asignación hasta 4⁸): las soluciones no dominadas de todo el espacio.
 *
 * run(enc, inst, N, seed, { w }) → { pop, objs, o, norm, scores, best, fronts, front1, supported, trueFront, steps, ... }
 * Funciona tanto en el navegador (window.GAX.items.multi) como en Node (module.exports).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const S = isNode ? require('../space.js') : root.GAX.space;
  const U = isNode ? require('./uniform.js') : root.GAX.items.uniform;
  const A = isNode ? require('../assignment.js') : root.GAX.assignment;

  const ENCODINGS = ['knapsack-bits', 'assignment-int'];
  const W = { min: 0, max: 1, step: 0.05, def: 0.5 };

  const normW = (v) => {
    const n = Number(v);
    if (v == null || v === '' || !Number.isFinite(n)) return W.def;
    return Math.round(Math.round(Math.min(W.max, Math.max(W.min, n)) / W.step) * W.step * 100) / 100;
  };

  /** Los dos objetivos tal cual (para mostrar) y como vector que se minimiza. */
  function objectives(enc, inst, x) {
    if (enc === 'knapsack-bits') {
      let v = 0;
      let w = 0;
      x.forEach((b, i) => { if (b) { v += inst.values[i]; w += inst.weights[i]; } });
      return { shown: [v, w], o: [-v + 0, w] };
    }
    const c = A.makespan(inst, x);
    const t = x.reduce((s, j, i) => s + inst.p[i][j - 1], 0);
    return { shown: [c, t], o: [c, t] };
  }

  /** ¿Domina u a v? (los dos se minimizan) */
  const dominates = (u, v) => u[0] <= v[0] && u[1] <= v[1] && (u[0] < v[0] || u[1] < v[1]);

  /** Ordenación no dominada: rank[i] = número del frente de i (1 el primero). */
  function fronts(o) {
    const n = o.length;
    const rank = Array(n).fill(0);
    let left = o.map((_, i) => i);
    let k = 0;
    while (left.length) {
      k++;
      const front = left.filter((i) => !left.some((j) => j !== i && dominates(o[j], o[i])));
      front.forEach((i) => { rank[i] = k; });
      left = left.filter((i) => rank[i] === 0);
    }
    return rank;
  }

  /** Objetivos normalizados en [0, 1] con el mínimo y el máximo de la población. */
  function normalise(o) {
    return [0, 1].map((k) => {
      const lo = Math.min(...o.map((v) => v[k]));
      const hi = Math.max(...o.map((v) => v[k]));
      return { lo, hi, values: o.map((v) => (hi > lo ? (v[k] - lo) / (hi - lo) : 0)) };
    });
  }

  /** Suma ponderada de cada individuo y el mejor (el menor; a igualdad, el de menor índice). */
  function weighted(norm, w) {
    const s = norm[0].values.map((a, i) => w * a + (1 - w) * norm[1].values[i]);
    let best = 0;
    s.forEach((v, i) => { if (v < s[best]) best = i; });
    return { scores: s, best };
  }

  /**
   * Individuos que la suma ponderada elige para algún w de [0, 1] (soportados). Basta probar w = 0, w = 1 y los w en
   * que se cortan dos rectas sᵢ(w): la envolvente inferior es lineal a trozos con los cambios en esos puntos.
   */
  function supported(norm) {
    const a = norm[0].values;
    const b = norm[1].values;
    const n = a.length;
    const ws = [0, 1];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const den = (a[i] - b[i]) - (a[j] - b[j]);
        if (den !== 0) { const w = (b[j] - b[i]) / den; if (w > 0 && w < 1) ws.push(w); }
      }
    }
    const out = new Set();
    ws.forEach((w) => {
      const s = a.map((v, i) => w * v + (1 - w) * b[i]);
      const m = Math.min(...s);
      s.forEach((v, i) => { if (v <= m + 1e-12) out.add(i); });
    });
    return out;
  }

  /** Frente de Pareto de todo el espacio (vectores distintos, ordenados por el primer objetivo) o null si es grande. */
  function trueFront(enc, inst) {
    const sh = S.shape(enc, inst);
    const base = enc === 'knapsack-bits' ? 2 : sh.m;
    const len = sh.length;
    if (Math.pow(base, len) > 70000) return null;
    const pts = new Map();
    const x = Array(len).fill(0);
    for (;;) {
      const chrom = enc === 'knapsack-bits' ? x : x.map((v) => v + 1);
      const ob = objectives(enc, inst, chrom);
      pts.set(ob.o.join(','), ob);
      let k = len - 1;
      while (k >= 0 && x[k] === base - 1) { x[k] = 0; k--; }
      if (k < 0) break;
      x[k]++;
    }
    const all = [...pts.values()].sort((p, q) => p.o[0] - q.o[0] || p.o[1] - q.o[1]);
    const front = [];
    let minB = Infinity;
    all.forEach((p) => { if (p.o[1] < minB) { front.push(p); minB = p.o[1]; } });
    return front;
  }

  /**
   * Traza. Etapas: 1 dos objetivos · 2 suma ponderada · 3 dominancia (individuo 1) · 4 frentes ·
   * 5 qué encuentra la suma ponderada al variar w.
   */
  function run(enc, inst, N, seed, opts) {
    const w = normW(opts && opts.w);
    const g = U.population(enc, inst, N, seed);
    const objs = g.pop.map((x) => objectives(enc, inst, x));
    const o = objs.map((b) => b.o);
    const norm = normalise(o);
    const ws = weighted(norm, w);
    const rank = fronts(o);
    const front1 = rank.map((r, i) => (r === 1 ? i : -1)).filter((i) => i >= 0);
    const sup = new Set([...supported(norm)].filter((i) => rank[i] === 1));   // en w = 0 o 1 puede empatar un dominado
    const dominatedBy = o.map((v, i) => o.map((u, j) => (j !== i && dominates(u, v) ? j : -1)).filter((j) => j >= 0));
    const dominatesList = o.map((v, i) => o.map((u, j) => (j !== i && dominates(v, u) ? j : -1)).filter((j) => j >= 0));
    const steps = [];
    const snap = (type, stage, extra) => steps.push(Object.assign({ type, stage, done: N, ind: null, draw: null, show: 'objspace' }, extra));
    snap('m_objs', 1, { cols: 2 });
    snap('m_weighted', 2, { cols: 3, ind: ws.best, iso: true });
    snap('m_dom', 3, { cols: 3, ind: 0, cone: 0 });
    snap('m_front', 4, { cols: 4, front: true });
    snap('m_sweep', 5, { cols: 4, front: true, sweep: true });
    snap('m_end', 5, { cols: 4, front: true, sweep: true, truth: true });
    return {
      pop: g.pop, draws: g.draws, shape: g.shape, dec: g.dec, w, objs, o, norm, scores: ws.scores, best: ws.best,
      rank, front1, supported: sup, dominatedBy, dominatesList, trueFront: trueFront(enc, inst),
      steps, info: S.spaceInfo(enc, inst), measures: { optimum: S.optimum(enc, inst) },
    };
  }

  const api = { ENCODINGS, W, normW, objectives, dominates, fronts, normalise, weighted, supported, trueFront, run };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).items = root.GAX.items || {}).multi = api;
})(typeof self !== 'undefined' ? self : this);
