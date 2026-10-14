'use strict';
// Adaptador de las seis codificaciones: instancias iguales a las de representation-ga, calidad, óptimo,
// tamaño del espacio, distancias (ejemplos a mano) y medidas contra una implementación independiente.
const test = require('node:test');
const assert = require('node:assert/strict');

const S = require('../js/space.js');
const KS = require('../js/problems/knapsack-bits.js');
const A = require('../js/assignment.js');
const TSP = require('../js/problems/tsp-perm.js');

test('las instancias son las de representation-ga con la misma semilla', () => {
  assert.deepEqual(S.instance('knapsack-bits', 42, { n: 9 }), KS.randomInstance(42, 9));
  assert.deepEqual(S.instance('assignment-matrix', 42, { n: 7, m: 4 }), A.randomInstance(42, 7, 4));
  assert.deepEqual(S.instance('tsp-perm', 42, { n: 6 }), TSP.randomInstance(42, 6));
  assert.deepEqual(S.instance('function-bits', 1, { fn: 'rastrigin', k: 3 }), { fn: 'rastrigin', k: 3 });
});

test('parámetros fuera de rango toman su valor por defecto', () => {
  assert.deepEqual(S.params('knapsack-bits', { n: 99 }), { n: 8 });
  assert.deepEqual(S.params('assignment-int', { n: 'x', m: 4 }), { n: 6, m: 4 });
  assert.deepEqual(S.params('function-real', { fn: 'nope' }), { fn: 'himmelblau' });
  assert.deepEqual(S.params('function-bits', { k: 1 }), { fn: 'himmelblau', k: 5 });
});

test('calidad: factibilidad y objetivo sin tratar la infactibilidad (ejemplos a mano)', () => {
  const ks = { weights: [3, 4, 5], values: [4, 5, 6], capacity: 7 };
  assert.deepEqual(S.quality('knapsack-bits', ks, [1, 1, 0]), { feasible: true, objective: 9, weight: 7, value: 9 });
  assert.deepEqual(S.quality('knapsack-bits', ks, [1, 1, 1]), { feasible: false, objective: null, weight: 12, value: 15 });
  const as = { p: [[2, 5], [4, 1], [3, 3], [6, 2], [1, 7]] };
  assert.equal(S.quality('assignment-int', as, [1, 2, 1, 2, 1]).objective, 6);   // cargas 2+3+1 = 6 y 1+2 = 3
  assert.deepEqual(S.quality('assignment-matrix', as, [1, 0, 0, 1, 1, 0, 0, 1, 1, 0]), { feasible: true, objective: 6, violations: 0 });
  assert.deepEqual(S.quality('assignment-matrix', as, [1, 1, 0, 1, 1, 0, 0, 0, 1, 0]), { feasible: false, objective: null, violations: 2 });
  const q = S.quality('function-real', { fn: 'himmelblau' }, [3, 2]);
  assert.equal(q.objective, 0);
  assert.equal(q.feasible, true);
});

test('óptimos y espacio de búsqueda', () => {
  const ks = { weights: [3, 4, 5], values: [4, 5, 6], capacity: 7 };
  assert.equal(S.optimum('knapsack-bits', ks), 9);
  assert.deepEqual(S.spaceInfo('knapsack-bits', ks), { chromosomes: 8, feasible: 5, power: { base: 2, exp: 3 } });   // {}, 1, 2, 3, 12
  const as = { p: [[2, 5], [4, 1], [3, 3], [6, 2], [1, 7]] };
  assert.equal(S.spaceInfo('assignment-matrix', as).chromosomes, 1024);
  assert.equal(S.spaceInfo('assignment-matrix', as).feasible, 32);
  assert.equal(S.spaceInfo('tsp-perm', { coords: [[0, 0], [1, 0], [1, 1], [0, 1], [2, 2]] }).tours, 12);
  assert.equal(S.optimum('function-real', { fn: 'rastrigin' }), 0);
});

test('distancias: Hamming, aristas del circuito (rotaciones e inversión a distancia 0) y euclídea en la caja', () => {
  assert.equal(S.distance('knapsack-bits', null, [1, 0, 1, 1], [0, 0, 1, 0]), 0.5);
  assert.equal(S.distance('tsp-perm', null, [1, 2, 3, 4, 5], [3, 4, 5, 1, 2]), 0);
  assert.equal(S.distance('tsp-perm', null, [1, 2, 3, 4, 5], [5, 4, 3, 2, 1]), 0);
  assert.equal(S.tourDistance([1, 2, 3, 4, 5], [1, 3, 2, 4, 5]), 2);   // comparten 2-3, 4-5 y 5-1; 1-2 y 3-4 pasan a 1-3 y 2-4
  const I = { fn: 'himmelblau' };
  assert.equal(S.distance('function-real', I, [-5, -5], [5, 5]), 1);
  assert.equal(S.distance('function-real', I, [0, 0], [0, 0]), 0);
  // la binaria se mide entre los puntos decodificados: los extremos de la rejilla están a distancia 1
  const B = { fn: 'himmelblau', k: 3 };
  assert.equal(S.distance('function-bits', B, [0, 0, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1]), 1);
});

test('medidas de una población frente a un cálculo independiente', () => {
  const R = require('../js/rng.js');
  for (const enc of S.ENCODINGS) {
    for (let s = 0; s < 15; s++) {
      const I = S.instance(enc, s);
      const sh = S.shape(enc, I);
      const r = R.mulberry32(s + 1);
      const pop = Array.from({ length: 6 }, () => (sh.kind === 'perm' ? R.randomPermutation(r, sh.length)
        : Array.from({ length: sh.length }, () => (sh.kind === 'int' ? R.randInt(r, 1, sh.m)
          : sh.kind === 'real' ? Math.round((sh.a + r() * (sh.b - sh.a)) * 100) / 100 : (r() < 0.5 ? 1 : 0)))));
      if (s % 5 === 0) pop[5] = pop[0].slice();   // un duplicado
      const M = S.measures(enc, I, pop);
      let sum = 0;
      let min = Infinity;
      let pairs = 0;
      for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) { const d = S.distance(enc, I, pop[i], pop[j]); sum += d; min = Math.min(min, d); pairs++; }
      assert.ok(Math.abs(M.meanDist - sum / pairs) < 1e-12, enc);
      assert.equal(M.minDist, min);
      if (s % 5 === 0) assert.equal(M.minDist, 0);
      assert.equal(M.distinct, new Set(pop.map((x) => S.key(enc, x))).size);
      const objs = pop.map((x) => S.quality(enc, I, x)).filter((q) => q.feasible).map((q) => q.objective);
      assert.equal(M.feasible, objs.length);
      if (objs.length) assert.equal(M.best, S.sense(enc) === 'max' ? Math.max(...objs) : Math.min(...objs));
      for (let i = 0; i < 6; i++) assert.equal(M.D[i][i], 0);
    }
  }
});

test('entropía por gen: 0 si todos iguales, 1 si cada valor aparece lo mismo', () => {
  const ks = S.instance('knapsack-bits', 1, { n: 5 });
  assert.equal(S.geneEntropy('knapsack-bits', ks, [[1, 0, 1, 0, 1], [1, 0, 1, 0, 1]]), 0);
  assert.ok(Math.abs(S.geneEntropy('knapsack-bits', ks, [[1, 0, 1, 0, 1], [0, 1, 0, 1, 0]]) - 1) < 1e-12);
  assert.equal(S.geneEntropy('tsp-perm', S.instance('tsp-perm', 1), [[1, 2, 3, 4, 5, 6, 7]]), null);
});
