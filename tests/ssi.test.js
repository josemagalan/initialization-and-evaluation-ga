'use strict';
// Inhibición secuencial simple: candidatos de la regla uniforme, aceptación por distancia mínima δ,
// candidatos forzados si δ es demasiado grande, traza y coste.
const test = require('node:test');
const assert = require('node:assert/strict');

const X = require('../js/items/ssi.js');
const U = require('../js/items/uniform.js');
const S = require('../js/space.js');

test('los candidatos salen de la regla uniforme: los N primeros son la población uniforme', () => {
  for (const enc of S.ENCODINGS) {
    const I = S.instance(enc, 2);
    const g = X.population(enc, I, 8, 6, X.DEFAULT_DELTA[enc]);
    const u = U.population(enc, I, Math.min(8, g.total), 6).pop;
    assert.deepEqual(g.candidates.slice(0, u.length).map((c) => c.x), u, enc);
  }
});

test('un candidato entra si y solo si está a δ o más de todos los aceptados; la población respeta δ', () => {
  for (const enc of S.ENCODINGS) {
    for (let s = 0; s < 20; s++) {
      const I = S.instance(enc, s);
      const delta = X.DEFAULT_DELTA[enc];
      const g = X.population(enc, I, 10, s, delta);
      const acc = [];
      g.candidates.forEach((c) => {
        const ds = acc.map((y) => S.distance(enc, I, c.x, y));
        const dmin = ds.length ? Math.min(...ds) : null;
        if (dmin != null) assert.ok(Math.abs(dmin - c.dmin) < 1e-12);
        assert.equal(c.accepted, dmin == null || dmin >= delta - 1e-9 || c.forced, `${enc}, semilla ${s}`);
        if (c.nearest != null) assert.ok(Math.abs(ds[c.nearest] - dmin) < 1e-12);
        if (c.accepted) { assert.equal(c.ind, acc.length); acc.push(c.x); }
      });
      assert.deepEqual(acc, g.pop);
      assert.equal(g.forced, 0, `${enc}: δ por defecto sin forzar`);
      const M = S.measures(enc, I, g.pop);
      assert.ok(M.minDist >= delta - 1e-9, `${enc}: distancia mínima ${M.minDist}`);
      assert.equal(M.distinct, 10);
    }
  }
});

test('si δ es demasiado grande, tras 50 · N candidatos los siguientes entran forzados', () => {
  const I = S.instance('knapsack-bits', 1, { n: 5 });
  const g = X.population('knapsack-bits', I, 12, 3, 0.8);   // 12 cadenas de 5 bits a 4 o más bits unas de otras: imposible
  assert.ok(g.forced > 0);
  assert.equal(g.pop.length, 12);
  const firstForced = g.candidates.findIndex((c) => c.forced);
  assert.ok(firstForced >= X.MAX_PER_IND * 12);
  assert.ok(g.candidates.slice(firstForced).every((c) => c.accepted));
});

test('δ se acota a su rango y vale el de la codificación si no es válido', () => {
  assert.equal(X.normDelta('tsp-perm', '0.35'), 0.35);
  assert.equal(X.normDelta('tsp-perm', 'x'), X.DEFAULT_DELTA['tsp-perm']);
  assert.equal(X.normDelta('tsp-perm', 2), X.DEFAULT_DELTA['tsp-perm']);
});

test('la traza: regla, candidatos hasta el segundo rechazo, un paso por individuo, diversidad y coste', () => {
  for (const enc of S.ENCODINGS) {
    const I = S.instance(enc, 4);
    const r = X.run(enc, I, 10, 2, {});
    assert.deepEqual([...new Set(r.steps.map((s) => s.stage))], [1, 2, 3, 4, 5], enc);
    const cands = r.steps.filter((s) => s.type.startsWith('cand_'));
    const rej = cands.filter((s) => !r.candidates[s.cand].accepted).length;
    assert.ok(rej <= 2);
    cands.forEach((s) => assert.equal(s.type === 'cand_ok', r.candidates[s.cand].accepted));
    const acc2 = cands.filter((s) => r.candidates[s.cand].accepted).length;
    assert.equal(acc2 + r.steps.filter((s) => s.type === 'ssi_ind').length, 10, enc);
    assert.deepEqual(r.costs, [10, r.total]);
    assert.deepEqual(r.uniformPop, U.population(enc, I, 10, 2).pop);
  }
});
