'use strict';
// Comparar estrategias: qué estrategias se comparan en cada codificación, medias frente a un cálculo directo
// y las diferencias que la página quiere enseñar.
const test = require('node:test');
const assert = require('node:assert/strict');

const C = require('../js/compare.js');
const S = require('../js/space.js');
const U = require('../js/items/uniform.js');
const registry = require('../js/registry.js');

test('estrategias de cada codificación (y cada una enlaza a una página disponible que la admite)', () => {
  const ids = (enc) => C.strategies(enc).map((s) => s.id);
  assert.deepEqual(ids('knapsack-bits'), ['uniform', 'seeded1', 'seededHalf', 'ssi', 'feasible']);
  assert.deepEqual(ids('assignment-matrix'), ['uniform', 'ssi', 'feasible']);
  assert.deepEqual(ids('function-real'), ['uniform', 'halton', 'sobol', 'lhs', 'ssi']);
  for (const enc of S.ENCODINGS) {
    for (const s of C.strategies(enc)) {
      const it = registry.getItem(s.item);
      assert.ok(it && it.ready && it.family === 'init', `${s.id} → ${s.item}`);
      assert.ok(it.encodings.includes(enc), `${s.item} no admite ${enc}`);
    }
  }
});

test('las medias coinciden con un cálculo directo réplica a réplica', () => {
  const enc = 'tsp-perm';
  const inst = S.instance(enc, 3);
  const st = C.strategies(enc)[0];
  const m = C.metrics(enc, inst, 8, st, 30);
  let md = 0; let mn = 0; let best = 0;
  for (let r = 1; r <= 30; r++) {
    const M = S.measures(enc, inst, U.population(enc, inst, 8, r).pop);
    md += M.meanDist; mn += M.minDist; best += M.best;
  }
  assert.ok(Math.abs(m.meanDist - md / 30) < 1e-12);
  assert.ok(Math.abs(m.minDist - mn / 30) < 1e-12);
  assert.ok(Math.abs(m.best - best / 30) < 1e-9);
  assert.equal(m.cost, 1);
  assert.equal(m.feasible, 1);
});

test('lo que se espera ver: SSI sube la distancia mínima y cuesta más; sembrar la mitad baja la diversidad; factible = 100 %', () => {
  const enc = 'knapsack-bits';
  const inst = S.instance(enc, 1);
  const by = {};
  C.strategies(enc).forEach((s) => { by[s.id] = C.metrics(enc, inst, 10, s, 150); });
  assert.ok(by.ssi.minDist >= 0.3 && by.ssi.minDist > by.uniform.minDist);
  assert.ok(by.ssi.cost > 1);
  assert.ok(by.seededHalf.meanDist < by.uniform.meanDist && by.seededHalf.distinct <= 0.6 + 1e-9);
  assert.equal(by.feasible.feasible, 1);
  assert.ok(by.uniform.feasible < 1);
});

test('función: el hipercubo latino ocupa todos los estratos; Halton y Sobol, deterministas, se calculan una vez', () => {
  const enc = 'function-real';
  const inst = S.instance(enc, 1);
  const st = Object.fromEntries(C.strategies(enc).map((s) => [s.id, s]));
  assert.equal(C.metrics(enc, inst, 10, st.lhs, 40).strata, 1);
  const h = C.metrics(enc, inst, 10, st.halton, 1000);
  assert.equal(h.deterministic, true);
  assert.equal(h.reps, 1000);
  const u = C.metrics(enc, inst, 10, st.uniform, 200);
  assert.ok(h.strata > u.strata && h.minDist > u.minDist);
});
