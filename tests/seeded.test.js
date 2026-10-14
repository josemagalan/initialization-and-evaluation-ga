'use strict';
// Contraejemplo de la siembra: heurísticas voraces (ejemplos a mano), composición de la población,
// proyección de la toma de control y traza.
const test = require('node:test');
const assert = require('node:assert/strict');

const Sd = require('../js/items/seeded.js');
const U = require('../js/items/uniform.js');
const S = require('../js/space.js');
const TSP = require('../js/problems/tsp-perm.js');

test('mochila voraz por valor/peso (ejemplo a mano)', () => {
  // relaciones 4/3, 5/4, 7/5, 1/2 → orden 3, 1, 2, 4; entran el 3 (peso 5) y el 4 (peso 2)
  const r = Sd.greedy('knapsack-bits', { weights: [3, 4, 5, 2], values: [4, 5, 7, 1], capacity: 7 });
  assert.deepEqual(r.x, [0, 0, 1, 1]);
  assert.deepEqual(r.order.map((o) => o.item), [3, 1, 2, 4]);
});

test('asignación voraz: cada tarea a la máquina en la que termina antes (ejemplo a mano)', () => {
  const r = Sd.greedy('assignment-int', { p: [[2, 5], [4, 1], [3, 3]] });
  assert.deepEqual(r.x, [1, 2, 2]);   // 2 | 1 | máquina 1 acabaría en 5, la 2 en 4
});

test('vecino más cercano: desde la ciudad 1, siempre a la más próxima sin visitar', () => {
  for (let s = 0; s < 30; s++) {
    const inst = S.instance('tsp-perm', s, { n: 8 });
    const { x } = Sd.greedy('tsp-perm', inst);
    assert.equal(x[0], 1);
    assert.deepEqual(x.slice().sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8]);
    for (let k = 1; k < x.length; k++) {
      const left = x.slice(k);
      const best = Math.min(...left.map((c) => TSP.distTenths(inst, x[k - 1], c)));
      assert.equal(TSP.distTenths(inst, x[k - 1], x[k]), best);
    }
  }
});

test('la población sembrada son los N − K primeros aleatorios de la uniforme y K copias al final', () => {
  for (const enc of Sd.ENCODINGS) {
    const inst = S.instance(enc, 5);
    const r = Sd.run(enc, inst, 9, 7, { K: 3 });
    const u = U.population(enc, inst, 9, 7).pop;
    assert.deepEqual(r.uniformPop, u);
    assert.deepEqual(r.pop.slice(0, 6), u.slice(0, 6));
    r.pop.slice(6).forEach((x) => assert.deepEqual(x, r.heuristic.x));
    assert.deepEqual(r.seedRows, [6, 7, 8]);
    // las copias están a distancia 0 entre sí
    assert.equal(r.measures.D[6][7], 0);
    assert.ok(r.measures.distinct <= 7);
  }
});

test('copias esperadas tras el torneo binario: N (1 − (1 − k/N)²), creciente y acotada por N', () => {
  const c = Sd.takeover(1, 10, 8);
  assert.equal(c[0].k, 1);
  assert.ok(Math.abs(c[1].k - 1.9) < 1e-12);
  assert.ok(Math.abs(c[2].k - 3.439) < 1e-12);
  for (let g = 1; g < c.length; g++) { assert.ok(c[g].k > c[g - 1].k); assert.ok(c[g].k <= 10); }
  // con toda la población sembrada no hay nada que invadir
  assert.ok(Sd.takeover(10, 10, 3).every((p) => p.k === 10));
  // comprobación por simulación: torneos binarios con reemplazo sobre una población con k copias
  const R = require('../js/rng.js');
  const r = R.mulberry32(9);
  let total = 0;
  const reps = 20000;
  for (let t = 0; t < reps; t++) {
    let k = 0;
    for (let i = 0; i < 10; i++) { const a = Math.floor(r() * 10); const b = Math.floor(r() * 10); if (a < 3 || b < 3) k++; }
    total += k;
  }
  assert.ok(Math.abs(total / reps - Sd.takeover(3, 10, 1)[1].k) < 0.05);
});

test('la traza: heurística, aleatorios, mezcla, diversidad, una etapa por generación y conclusión', () => {
  const inst = S.instance('knapsack-bits', 2);
  const r = Sd.run('knapsack-bits', inst, 8, 1, { K: 2 });
  assert.deepEqual(r.steps.map((s) => s.type), ['heur', 'random', 'mix', 'div', ...Array(Sd.GENERATIONS).fill('gen'), 'end']);
  assert.deepEqual([...new Set(r.steps.map((s) => s.stage))], [1, 2, 3, 4, 5]);
});
