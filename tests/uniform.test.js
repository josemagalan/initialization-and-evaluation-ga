'use strict';
// Inicialización aleatoria uniforme: reproducible, regla comprobable con los números mostrados,
// frecuencias uniformes (bits, enteros, reales, permutaciones) y traza completa.
const test = require('node:test');
const assert = require('node:assert/strict');

const U = require('../js/items/uniform.js');
const S = require('../js/space.js');

const ENCS = S.ENCODINGS;
const inst = (enc, s, p) => S.instance(enc, s, p);
const isPerm = (x) => x.slice().sort((a, b) => a - b).every((v, i) => v === i + 1);

test('la misma semilla da la misma población; otra semilla, otra', () => {
  for (const enc of ENCS) {
    const I = inst(enc, 11);
    assert.deepEqual(U.population(enc, I, 8, 5).pop, U.population(enc, I, 8, 5).pop, enc);
    assert.notDeepEqual(U.population(enc, I, 8, 5).pop, U.population(enc, I, 8, 6).pop, enc);
  }
});

test('cada gen sale de su u (con los decimales que se muestran) por la regla de la codificación', () => {
  for (const enc of ENCS) {
    for (let s = 0; s < 30; s++) {
      const I = inst(enc, s);
      const g = U.population(enc, I, 6, s);
      const sh = g.shape;
      g.draws.forEach((ds, i) => {
        const x = g.pop[i];
        ds.forEach((d) => {
          const scaled = d.u * Math.pow(10, g.dec);
          assert.ok(Math.abs(scaled - Math.round(scaled)) < 1e-9 && d.u >= 0 && d.u < 1, `${enc}: u = ${d.u}`);
        });
        if (sh.kind === 'perm') {
          assert.equal(ds.length, sh.length - 1);
          let p = Array.from({ length: sh.length }, (_, k) => k + 1);
          ds.forEach((d, idx) => {
            assert.equal(d.k, sh.length - idx);
            assert.equal(d.j, 1 + Math.floor(d.u * d.k));
            assert.deepEqual(d.before, p);
            p = p.slice();
            [p[d.k - 1], p[d.j - 1]] = [p[d.j - 1], p[d.k - 1]];
            assert.deepEqual(d.after, p);
          });
          assert.deepEqual(p, x);
          assert.ok(isPerm(x));
        } else {
          assert.equal(ds.length, sh.length);
          ds.forEach((d) => {
            const expect = sh.kind === 'int' ? 1 + Math.floor(d.u * sh.m)
              : sh.kind === 'real' ? Math.round((sh.a + d.u * (sh.b - sh.a)) * 100) / 100 + 0
                : (d.u < 0.5 ? 1 : 0);
            assert.equal(x[d.g], expect, `${enc} gen ${d.g}`);
          });
        }
      });
    }
  }
});

test('con u en milésimas, cada resultado de ⌊u·k⌋ recibe ⌊1000/k⌋ o ⌈1000/k⌉ valores de u (k ≤ 10)', () => {
  for (let k = 2; k <= 10; k++) {
    const count = Array(k).fill(0);
    for (let t = 0; t < 1000; t++) count[Math.floor((t / 1000) * k)]++;
    for (const c of count) assert.ok(c === Math.floor(1000 / k) || c === Math.ceil(1000 / k), `k = ${k}: ${count}`);
  }
  // y con dos decimales, el bit es exactamente equiprobable: 50 valores de u dan 1 y 50 dan 0
  let ones = 0;
  for (let t = 0; t < 100; t++) ones += U.bitGene(t / 100);
  assert.equal(ones, 50);
});

test('frecuencias: bits con p = 0,5, enteros uniformes en 1…m y reales repartidos por la caja', () => {
  const ks = inst('knapsack-bits', 1, { n: 10 });
  const bits = U.population('knapsack-bits', ks, 2000, 9).pop.flat();
  assert.ok(Math.abs(bits.reduce((a, b) => a + b, 0) / bits.length - 0.5) < 0.01);

  const as = inst('assignment-int', 1, { n: 8, m: 3 });
  const ints = U.population('assignment-int', as, 3000, 9).pop.flat();
  for (let j = 1; j <= 3; j++) assert.ok(Math.abs(ints.filter((v) => v === j).length / ints.length - 1 / 3) < 0.01, `máquina ${j}`);

  const fr = inst('function-real', 1, { fn: 'rastrigin' });
  const pts = U.population('function-real', fr, 4000, 9).pop;
  const flat = pts.flat();
  assert.ok(flat.every((v) => v >= -5.12 && v <= 5.12 && Math.abs(v * 100 - Math.round(v * 100)) < 1e-9));
  // cuatro cuadrantes con la misma proporción
  const quad = [0, 0, 0, 0];
  pts.forEach(([x, y]) => { quad[(x < 0 ? 0 : 1) + (y < 0 ? 0 : 2)]++; });
  quad.forEach((q) => assert.ok(Math.abs(q / pts.length - 0.25) < 0.02, `${quad}`));
});

test('Fisher–Yates: las 120 permutaciones de 5 ciudades salen con la misma frecuencia (χ², 119 g. l.)', () => {
  const I = inst('tsp-perm', 3, { n: 5 });
  const pop = U.population('tsp-perm', I, 60000, 21).pop;
  const count = new Map();
  pop.forEach((x) => { const k = x.join(''); count.set(k, (count.get(k) || 0) + 1); });
  assert.equal(count.size, 120);
  const e = pop.length / 120;
  let chi = 0;
  count.forEach((c) => { chi += ((c - e) ** 2) / e; });
  // 119 grados de libertad: el percentil 99,9 es ≈ 173
  assert.ok(chi < 173, `χ² = ${chi.toFixed(1)}`);
});

test('la traza recorre las cinco etapas en orden, con un paso por sorteo del primer individuo', () => {
  for (const enc of ENCS) {
    const I = inst(enc, 4);
    const r = U.run(enc, I, 7, 2);
    const stages = r.steps.map((s) => s.stage);
    assert.deepEqual([...new Set(stages)], [1, 2, 3, 4, 5], enc);
    for (let i = 1; i < stages.length; i++) assert.ok(stages[i] >= stages[i - 1]);
    assert.equal(r.steps.filter((s) => s.stage === 3 && s.draw != null).length, r.draws[0].length, enc);
    assert.equal(r.steps.filter((s) => s.type === 'ind').length, 6, enc);
    assert.equal(r.pop.length, 7);
  }
});
