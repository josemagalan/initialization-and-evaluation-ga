/*
 * Capa común de la evaluación: del genotipo a la aptitud en las seis codificaciones de representation-ga.
 *
 *   decodificar   genotipo → fenotipo (la solución que representa el cromosoma)
 *   objetivo      el valor del objetivo calculado sobre el fenotipo tal cual, aunque no sea factible
 *   violación     cuánto incumple las restricciones (0 si las cumple):
 *                   mochila   e = máx(0, peso − W)
 *                   matriz    v = Σᵢ |Σⱼ yᵢⱼ − 1|   (filas sin ningún 1 o con varios)
 *                   resto     0: la codificación solo da soluciones válidas (en la función, los genes
 *                             de una población inicial están siempre dentro de la caja)
 *   aptitud       la mochila se maximiza: F = valor − P;  el resto se minimiza: F = objetivo + P,
 *                 con P = λ · v (lineal) o (λ · v)² (cuadrática). Sin violación, F es el objetivo.
 * Por defecto, penalización lineal con λ = 1, como representation-ga.
 * Funciona tanto en el navegador (window.GAX.fitness) como en Node (module.exports).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const S = isNode ? require('./space.js') : root.GAX.space;
  const Fn = isNode ? require('./func.js') : root.GAX.func;
  const A = isNode ? require('./assignment.js') : root.GAX.assignment;
  const KS = isNode ? require('./problems/knapsack-bits.js') : root.GAX.problems['knapsack-bits'];
  const TSP = isNode ? require('./problems/tsp-perm.js') : root.GAX.problems['tsp-perm'];

  const PENALTY_TYPES = ['linear', 'quadratic'];
  const DEFAULT_PENALTY = { type: 'linear', lambda: 1 };

  /** Fenotipo: la solución que representa el cromosoma x. */
  function decode(enc, inst, x) {
    if (enc === 'knapsack-bits') return { items: x.map((b, i) => (b ? i + 1 : 0)).filter(Boolean) };
    if (enc === 'assignment-int') {
      const m = A.sizes(inst).m;
      const machines = Array.from({ length: m }, () => []);
      x.forEach((j, i) => machines[j - 1].push(i + 1));
      return { machines };
    }
    if (enc === 'assignment-matrix') {
      const y = S.toRows(x, A.sizes(inst).m);
      return { rows: y.map((r) => A.rowOnes(r)), assignment: A.fromMatrix(y) };
    }
    if (enc === 'tsp-perm') return { tour: x.slice() };
    if (enc === 'function-bits') {
      const d = Fn.decodeBits(inst.fn, x, inst.k, 'standard');
      return { vars: d.vars.map((v, i) => ({ bits: x.slice(i * inst.k, (i + 1) * inst.k), z: v.z, x: v.x })), point: d.point };
    }
    return { point: x.slice() };
  }

  /** Objetivo calculado sobre el fenotipo tal cual: { value, ... } con el detalle de cada problema. */
  function objective(enc, inst, x, ph) {
    ph = ph || decode(enc, inst, x);
    if (enc === 'knapsack-bits') {
      const weight = KS.weightOf(inst, x);
      const value = KS.valueOf(inst, x);
      return { value, weight };
    }
    if (enc === 'assignment-int') {
      const loads = A.loads(inst, x);
      return { value: A.cmaxOf(loads), loads };
    }
    if (enc === 'assignment-matrix') {
      const loads = A.matrixLoads(inst, S.toRows(x, A.sizes(inst).m));
      return { value: A.cmaxOf(loads), loads };
    }
    if (enc === 'tsp-perm') {
      const legs = x.map((c, k) => ({ a: c, b: x[(k + 1) % x.length], d: TSP.distTenths(inst, c, x[(k + 1) % x.length]) / 10 }));
      return { value: TSP.tourLength(inst, x), legs };
    }
    return { value: Fn.evalAt(inst.fn, ph.point) };
  }

  /** Cuánto incumple las restricciones: 0 si las cumple. */
  function violation(enc, inst, x, obj) {
    if (enc === 'knapsack-bits') return Math.max(0, (obj ? obj.weight : KS.weightOf(inst, x)) - inst.capacity);
    if (enc === 'assignment-matrix') return A.violations(S.toRows(x, A.sizes(inst).m));
    if (enc === 'function-real') return Fn.outside(inst.fn, x);
    return 0;
  }

  /** Término de penalización P(v) = λ · v (lineal) o (λ · v)² (cuadrática). */
  function penaltyTerm(type, lambda, v) {
    const p = lambda * v;
    return type === 'quadratic' ? p * p : p;
  }

  /**
   * Evaluación completa de un individuo:
   * { phenotype, obj (detalle), objective, violation, feasible, penalty, fitness, sense }.
   * opts = { type, lambda } (penalización); por defecto lineal con λ = 1.
   */
  function evaluate(enc, inst, x, opts) {
    const o = Object.assign({}, DEFAULT_PENALTY, opts || {});
    const phenotype = decode(enc, inst, x);
    const obj = objective(enc, inst, x, phenotype);
    const v = violation(enc, inst, x, obj);
    const penalty = v ? penaltyTerm(o.type, o.lambda, v) : 0;
    const sense = S.sense(enc);
    const fitness = sense === 'max' ? obj.value - penalty : obj.value + penalty;
    return { phenotype, obj, objective: obj.value, violation: v, feasible: v === 0, penalty, fitness, sense };
  }

  /** ¿Es la aptitud a mejor que la b? */
  const better = (sense, a, b) => (sense === 'max' ? a > b : a < b);

  /**
   * Puestos de la población por aptitud: rank[i] = 1 el mejor, N el peor; a igual aptitud, el mismo puesto
   * (el menor de los que ocupan). order: índices del mejor al peor (a igualdad, el de menor índice primero).
   */
  function ranking(fits, sense) {
    const order = fits.map((_, i) => i).sort((i, j) => (fits[i] === fits[j] ? i - j : better(sense, fits[i], fits[j]) ? -1 : 1));
    const rank = Array(fits.length);
    order.forEach((i, k) => { rank[i] = k > 0 && fits[order[k - 1]] === fits[i] ? rank[order[k - 1]] : k + 1; });
    return { order, rank };
  }

  /** Clave de caché de un individuo: el genotipo. */
  const genotypeKey = (x) => x.join(',');

  const api = { PENALTY_TYPES, DEFAULT_PENALTY, decode, objective, violation, penaltyTerm, evaluate, better, ranking, genotypeKey };
  if (isNode) module.exports = api;
  else (root.GAX = root.GAX || {}).fitness = api;
})(typeof self !== 'undefined' ? self : this);
