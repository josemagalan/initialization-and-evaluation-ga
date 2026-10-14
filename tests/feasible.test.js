'use strict';
// Inicialización factible: mochila llena desde un orden aleatorio y matriz con un 1 por fila.
const test = require('node:test');
const assert = require('node:assert/strict');

const F = require('../js/items/feasible.js');
const U = require('../js/items/uniform.js');
const S = require('../js/space.js');

test('mochila a mano: con el orden 3, 2, 1, 4 y capacidad 7 entran el 3 y el 4', () => {
  // u = 0,9 (k = 4 → j = 4), 0,2 (k = 3 → j = 1), 0,99 (k = 2 → j = 2): (1 2 3 4) → (3 2 1 4); pesos 5, 4, 3, 2
  const us = [0.9, 0.2, 0.99];
  const r = F.fillKnapsack({ weights: [3, 4, 5, 2], values: [4, 5, 7, 1], capacity: 7 }, () => us.shift());
  assert.deepEqual(r.perm, [3, 2, 1, 4]);
  assert.deepEqual(r.decisions.map((d) => d.fits), [true, false, false, true]);
  assert.deepEqual(r.x, [0, 0, 1, 1]);
});

test('mochila: todos factibles y llenos (no cabe ningún objeto más), con el orden de Fisher–Yates', () => {
  for (let s = 0; s < 40; s++) {
    const I = S.instance('knapsack-bits', s);
    const g = F.population('knapsack-bits', I, 10, s);
    g.details.forEach((d, i) => {
      const w = I.weights.reduce((a, wi, k) => a + wi * d.x[k], 0);
      assert.ok(w <= I.capacity);
      I.weights.forEach((wi, k) => { if (!d.x[k]) assert.ok(w + wi > I.capacity, `semilla ${s}: cabría el objeto ${k + 1}`); });
      let p = Array.from({ length: I.weights.length }, (_, k) => k + 1);
      d.swaps.forEach((x) => { assert.equal(x.j, 1 + Math.floor(x.u * x.k)); [p[x.k - 1], p[x.j - 1]] = [p[x.j - 1], p[x.k - 1]]; });
      assert.deepEqual(p, d.perm);
      assert.deepEqual(d.x, g.pop[i]);
    });
    assert.equal(S.measures('knapsack-bits', I, g.pop).feasible, 10);
  }
});

test('matriz: un único 1 por fila, en la máquina 1 + ⌊u · m⌋, y cada máquina con probabilidad 1/m', () => {
  const I = S.instance('assignment-matrix', 3, { n: 6, m: 3 });
  const g = F.population('assignment-matrix', I, 2000, 5);
  const count = [0, 0, 0];
  g.details.forEach((d) => {
    S.toRows(d.x, 3).forEach((row, i) => {
      assert.equal(row.reduce((a, b) => a + b, 0), 1);
      assert.equal(row.indexOf(1) + 1, 1 + Math.floor(d.rows[i].u * 3));
      count[d.rows[i].j - 1]++;
    });
  });
  count.forEach((c) => assert.ok(Math.abs(c / 12000 - 1 / 3) < 0.015, `${count}`));
  assert.equal(S.measures('assignment-matrix', I, g.pop.slice(0, 10)).feasible, 10);
});

test('la traza: cinco etapas, el primer individuo paso a paso y la uniforme de la misma semilla', () => {
  for (const enc of F.ENCODINGS) {
    const I = S.instance(enc, 2);
    const r = F.run(enc, I, 9, 4);
    assert.deepEqual([...new Set(r.steps.map((s) => s.stage))], [1, 2, 3, 4, 5]);
    const n = enc === 'knapsack-bits' ? I.weights.length : I.p.length;
    assert.equal(r.steps.filter((s) => s.type === 'f_item' || s.type === 'f_row').length, n);
    assert.deepEqual(r.uniformPop, U.population(enc, I, 9, 4).pop);
    r.steps.filter((s) => s.partial).forEach((s) => s.partial.known.forEach((k) => assert.ok(k >= 0 && k < r.shape.length)));
  }
});
