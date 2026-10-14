'use strict';
// Inicialización cuasialeatoria (Halton, Sobol) e hipercubo latino: valores a mano, propiedades de red de las
// secuencias, un individuo por estrato en el hipercubo, genes comprobables y cobertura de la caja.
const test = require('node:test');
const assert = require('node:assert/strict');

const Q = require('../js/items/quasi.js');
const U = require('../js/items/uniform.js');
const S = require('../js/space.js');

const ENC = 'function-real';
const inst = (fn) => S.instance(ENC, 1, { fn: fn || 'himmelblau' });

test('inverso radical a mano: φ₂(1, 2, 3, 6) y φ₃(1, 2, 3, 5)', () => {
  assert.deepEqual([1, 2, 3, 6].map((i) => Q.radicalInverse(i, 2).u), [0.5, 0.25, 0.75, 0.375]);
  const r = Q.radicalInverse(5, 3);   // 5 = 12₃ → 0,21₃ = 2/3 + 1/9 = 7/9
  assert.deepEqual([r.num, r.den, r.digits], [7, 9, [1, 2]]);
  assert.deepEqual([1, 2, 3].map((i) => Q.radicalInverse(i, 3).num), [1, 2, 1]);
  assert.equal(Q.radicalInverse(3, 3).den, 9);
});

test('números directores de Sobol (segunda coordenada, polinomio x + 1): m = 1, 3, 5, 15, 17', () => {
  assert.deepEqual(Q.DIRS.map((d) => d.m), [1, 3, 5, 15, 17]);
  // vₖ = mₖ / 2ᵏ, en treintaidosavos
  Q.DIRS.forEach((d) => assert.equal(d.V / 32, d.m / Math.pow(2, d.k)));
  assert.deepEqual([1, 2, 3, 4, 5].map((i) => Q.sobol2(i).u), [0.5, 0.75, 0.25, 0.625, 0.125]);
});

/** ¿Hay exactamente un punto en cada caja de la rejilla nx × ny del cuadrado unidad? */
function onePerBox(pts, nx, ny) {
  const count = new Map();
  pts.forEach(([u, v]) => { const k = `${Math.floor(u * nx)},${Math.floor(v * ny)}`; count.set(k, (count.get(k) || 0) + 1); });
  return count.size === nx * ny && [...count.values()].every((c) => c === 1);
}

test('Sobol: los puntos 0…2ᵐ − 1 forman una red (0, m, 2): uno en cada intervalo elemental de área 2⁻ᵐ', () => {
  for (let m = 1; m <= 5; m++) {
    const pts = Array.from({ length: Math.pow(2, m) }, (_, i) => [Q.radicalInverse(i, 2).u, Q.sobol2(i).u]);
    for (let k = 0; k <= m; k++) assert.ok(onePerBox(pts, Math.pow(2, k), Math.pow(2, m - k)), `m = ${m}, k = ${k}`);
  }
});

test('Halton: los puntos 0…2ᵃ3ᵇ − 1 dejan uno en cada caja de 1/2ᵃ × 1/3ᵇ', () => {
  for (const [a, b] of [[1, 1], [2, 1], [1, 2], [2, 2], [3, 1]]) {
    const n = Math.pow(2, a) * Math.pow(3, b);
    const pts = Array.from({ length: n }, (_, i) => [Q.radicalInverse(i, 2).u, Q.radicalInverse(i, 3).u]);
    assert.ok(onePerBox(pts, Math.pow(2, a), Math.pow(3, b)), `2^${a} · 3^${b}`);
  }
});

test('Halton y Sobol son deterministas y cada gen es a + u (b − a) en centésimas', () => {
  for (const fn of ['himmelblau', 'rastrigin']) {
    const I = inst(fn);
    for (const m of ['halton', 'sobol']) {
      const g = Q.population(ENC, I, 12, 3, m);
      assert.deepEqual(g.pop, Q.population(ENC, I, 12, 99, m).pop, `${m}: no depende de la semilla`);
      g.draws.forEach((row, i) => row.forEach((d) => {
        assert.equal(d.i, i + 1);
        assert.equal(d.num / d.den, d.u);
        assert.equal(g.pop[i][d.d], Math.round((g.shape.a + d.u * (g.shape.b - g.shape.a)) * 100) / 100 + 0);
      }));
    }
  }
});

test('hipercubo latino: un individuo en cada estrato de cada eje, también tras redondear, y reproducible', () => {
  for (const fn of ['himmelblau', 'rastrigin']) {
    const I = inst(fn);
    for (let N = 4; N <= 20; N++) {
      for (let s = 0; s < 25; s++) {
        const g = Q.population(ENC, I, N, s, 'lhs');
        assert.deepEqual(g.pop, Q.population(ENC, I, N, s, 'lhs').pop);
        for (const d of [0, 1]) {
          assert.deepEqual(g.perms[d].slice().sort((a, b) => a - b), Array.from({ length: N }, (_, i) => i + 1));
          const xs = g.pop.map((x) => x[d]);
          const strata = xs.map((x) => S.stratumOf((x - g.shape.a) / (g.shape.b - g.shape.a), N));
          assert.equal(new Set(strata).size, N, `${fn}, N = ${N}, semilla ${s}`);
          g.draws.forEach((row, i) => {
            const c = row[d];
            assert.equal(c.stratum, g.perms[d][i]);
            assert.equal(c.u, (c.stratum - 1 + c.v) / N);
            assert.ok(Math.abs(c.x - (g.shape.a + c.u * (g.shape.b - g.shape.a))) < 0.011, 'como mucho una centésima del valor exacto');
            assert.equal(strata[i], c.stratum - 1);
          });
        }
        assert.deepEqual(S.coverage(ENC, I, g.pop).strata, [N, N]);
      }
    }
  }
});

test('hipercubo latino: las permutaciones salen por Fisher–Yates de los números mostrados', () => {
  const g = Q.population(ENC, inst(), 9, 4, 'lhs');
  g.permDraws.forEach((ds, d) => {
    let p = Array.from({ length: 9 }, (_, i) => i + 1);
    ds.forEach((x) => { assert.equal(x.j, 1 + Math.floor(x.u * x.k)); p = p.slice(); [p[x.k - 1], p[x.j - 1]] = [p[x.j - 1], p[x.k - 1]]; });
    assert.deepEqual(p, g.perms[d]);
  });
});

test('mayor hueco: cuatro esquinas dejan libre el centro, a media diagonal', () => {
  const I = inst();
  const c = S.coverage(ENC, I, [[-5, -5], [5, -5], [-5, 5], [5, 5]]);
  assert.deepEqual(c.hole.center, [0, 0]);
  assert.ok(Math.abs(c.hole.r - 0.5) < 1e-12);
  assert.deepEqual(c.strata, [2, 2]);
  assert.equal(S.coverage('tsp-perm', S.instance('tsp-perm', 1), []), null);
});

test('en promedio, las tres estrategias reparten mejor que el azar (estratos por eje y distancia mínima)', () => {
  const I = inst();
  const avg = (f) => { let s = 0; for (let k = 1; k <= 60; k++) s += f(k); return s / 60; };
  const strata = (pop) => S.coverage(ENC, I, pop).strata.reduce((a, b) => a + b, 0) / 20;
  const minD = (pop) => S.measures(ENC, I, pop).minDist;
  const uni = (k) => U.population(ENC, I, 10, k).pop;
  for (const m of Q.METHODS) {
    const q = (k) => Q.population(ENC, I, 10, k, m).pop;
    assert.ok(avg((k) => strata(q(k))) > avg((k) => strata(uni(k))) + 0.1, `${m}: estratos`);
    assert.ok(avg((k) => minD(q(k))) > avg((k) => minD(uni(k))), `${m}: distancia mínima`);
  }
});

test('la traza recorre las cinco etapas y compara con la población uniforme de la misma semilla', () => {
  for (const m of Q.METHODS) {
    const r = Q.run(ENC, inst(), 8, 5, { method: m });
    assert.deepEqual([...new Set(r.steps.map((s) => s.stage))], [1, 2, 3, 4, 5]);
    assert.deepEqual(r.uniformPop, U.population(ENC, inst(), 8, 5).pop);
    assert.equal(r.steps.filter((s) => s.type === 'q_coord').length, 2);
    assert.equal(r.steps.filter((s) => s.type === 'q_ind').length, 7);
    assert.deepEqual(r.columns, ['mUniformPop', `mPop_${m}`]);
  }
  assert.equal(Q.run(ENC, inst(), 8, 5, { method: 'nope' }).method, 'halton');
});
