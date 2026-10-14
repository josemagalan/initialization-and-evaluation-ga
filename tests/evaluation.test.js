'use strict';
// Fase 3, evaluación: la capa común (decodificar → objetivo → violación → aptitud) frente a un cálculo independiente
// y ejemplos a mano; del genotipo a la aptitud; objetivo frente a aptitud (transformaciones y ruleta); penalización y
// peso crítico λ*; coste de evaluar con caché.
const test = require('node:test');
const assert = require('node:assert/strict');

const S = require('../js/space.js');
const F = require('../js/fitness.js');
const U = require('../js/items/uniform.js');
const Pipe = require('../js/items/pipeline.js');
const Obj = require('../js/items/objective.js');
const Pen = require('../js/items/penalty.js');
const Cost = require('../js/items/cost.js');
const Fn = require('../js/func.js');

// ---------- Cálculo independiente de la aptitud (sin usar js/fitness.js ni js/problems/) ----------

function independent(enc, inst, x, lambda, type) {
  const pen = (v) => (v === 0 ? 0 : type === 'quadratic' ? (lambda * v) ** 2 : lambda * v);
  if (enc === 'knapsack-bits') {
    let w = 0;
    let val = 0;
    x.forEach((b, i) => { if (b === 1) { w += inst.weights[i]; val += inst.values[i]; } });
    const e = w > inst.capacity ? w - inst.capacity : 0;
    return { z: val, v: e, F: val - pen(e) };
  }
  if (enc === 'assignment-int' || enc === 'assignment-matrix') {
    const n = inst.p.length;
    const m = inst.p[0].length;
    const loads = new Array(m).fill(0);
    let v = 0;
    for (let i = 0; i < n; i++) {
      let ones = 0;
      for (let j = 0; j < m; j++) {
        const on = enc === 'assignment-int' ? x[i] === j + 1 : x[i * m + j] === 1;
        if (on) { loads[j] += inst.p[i][j]; ones++; }
      }
      v += Math.abs(ones - 1);
    }
    const z = Math.max(0, ...loads);
    return { z, v, F: z + pen(v) };
  }
  if (enc === 'tsp-perm') {
    let t = 0;
    for (let k = 0; k < x.length; k++) {
      const a = inst.coords[x[k] - 1];
      const b = inst.coords[x[(k + 1) % x.length] - 1];
      t += Math.round(Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) * 10);
    }
    return { z: t / 10, v: 0, F: t / 10 };
  }
  const box = Fn.fnOf(inst.fn);
  let p = x;
  if (enc === 'function-bits') {
    const k = inst.k;
    p = [0, 1].map((d) => {
      let zz = 0;
      for (let j = 0; j < k; j++) zz = zz * 2 + x[d * k + j];
      return box.a + (zz * (box.b - box.a)) / (2 ** k - 1);
    });
  }
  const z = box.f(p[0], p[1]);
  return { z, v: 0, F: z };
}

test('la aptitud de las seis codificaciones coincide con un cálculo independiente (λ y penalización variados)', () => {
  for (const enc of S.ENCODINGS) {
    for (let s = 0; s < 30; s++) {
      const inst = S.instance(enc, s, enc === 'function-real' || enc === 'function-bits' ? { fn: s % 2 ? 'rastrigin' : 'himmelblau' } : {});
      const pop = U.population(enc, inst, 8, s).pop;
      for (const [lambda, type] of [[1, 'linear'], [0.5, 'quadratic'], [2.5, 'linear']]) {
        pop.forEach((x) => {
          const e = F.evaluate(enc, inst, x, { lambda, type });
          const r = independent(enc, inst, x, lambda, type);
          assert.ok(Math.abs(e.objective - r.z) < 1e-9, `${enc} objetivo`);
          assert.equal(e.violation, r.v, `${enc} violación`);
          assert.ok(Math.abs(e.fitness - r.F) < 1e-9, `${enc} aptitud ${e.fitness} ≠ ${r.F}`);
          assert.equal(e.feasible, r.v === 0);
        });
      }
    }
  }
});

test('ejemplos a mano: mochila, matriz, viajante y cadena binaria', () => {
  const ks = { weights: [3, 4, 5], values: [4, 5, 6], capacity: 8 };
  const a = F.evaluate('knapsack-bits', ks, [1, 1, 1]);
  assert.deepEqual([a.objective, a.obj.weight, a.violation, a.penalty, a.fitness], [15, 12, 4, 4, 11]);
  assert.deepEqual(a.phenotype.items, [1, 2, 3]);
  assert.equal(F.evaluate('knapsack-bits', ks, [1, 1, 1], { type: 'quadratic', lambda: 0.5 }).fitness, 11);
  assert.equal(F.evaluate('knapsack-bits', ks, [1, 1, 0]).fitness, 9, 'cabe: sin penalización');
  const am = { p: [[2, 3], [4, 1]] };
  const b = F.evaluate('assignment-matrix', am, [1, 1, 0, 0]);
  assert.deepEqual([b.objective, b.violation, b.fitness], [3, 2, 5]);
  assert.deepEqual(b.phenotype.rows, [[1, 2], []]);
  assert.equal(b.phenotype.assignment, null);
  const c = F.evaluate('assignment-int', am, [1, 2]);
  assert.deepEqual([c.objective, c.obj.loads, c.fitness], [2, [2, 1], 2]);
  assert.deepEqual(c.phenotype.machines, [[1], [2]]);
  const t = F.evaluate('tsp-perm', { coords: [[0, 0], [3, 0], [3, 4]] }, [1, 2, 3]);
  assert.equal(t.fitness, 12);
  assert.deepEqual(t.obj.legs.map((l) => l.d), [3, 4, 5]);
  const d = F.evaluate('function-bits', { fn: 'himmelblau', k: 3 }, [1, 1, 1, 0, 0, 0]);
  assert.deepEqual(d.phenotype.point, [5, -5]);
  assert.deepEqual(d.phenotype.vars.map((v) => v.z), [7, 0]);
  assert.equal(F.evaluate('function-real', { fn: 'himmelblau' }, [3, 2]).fitness, 0);
});

test('puestos: el mejor primero, a igual aptitud el mismo puesto y el menor índice delante', () => {
  assert.deepEqual(F.ranking([5, 9, 5, 1], 'max'), { order: [1, 0, 2, 3], rank: [2, 1, 2, 4] });
  assert.deepEqual(F.ranking([5, 9, 5, 1], 'min'), { order: [3, 0, 2, 1], rank: [2, 4, 2, 1] });
});

// ---------- Del genotipo a la aptitud ----------

test('del genotipo a la aptitud: una evaluación por individuo, en orden, sobre la población uniforme', () => {
  for (const enc of S.ENCODINGS) {
    const inst = S.instance(enc, 5);
    const r = Pipe.run(enc, inst, 7, 9);
    assert.deepEqual(r.pop, U.population(enc, inst, 7, 9).pop);
    assert.equal(r.evals.length, 7);
    // done crece de uno en uno en la etapa 4 y nunca baja
    const dones = r.steps.map((s) => s.done);
    for (let k = 1; k < dones.length; k++) assert.ok(dones[k] >= dones[k - 1] && dones[k] - dones[k - 1] <= 1);
    assert.equal(dones[dones.length - 1], 7);
    const st = r.steps.filter((s) => s.type === 'e_ind').map((s) => s.ind);
    assert.deepEqual(st, [1, 2, 3, 4, 5, 6]);
    // el mejor tiene el puesto 1 y ninguno es mejor que él
    r.fits.forEach((f) => assert.ok(!F.better(r.sense, f, r.fits[r.best])));
    assert.equal(r.ranking.rank[r.best], 1);
  }
});

// ---------- Objetivo frente a aptitud ----------

test('transformaciones: conservan el orden; C − f da 0 al peor; los puestos suman N(N + 1)/2; −f no tiene ruleta', () => {
  for (const enc of Obj.ENCODINGS) {
    for (let s = 0; s < 25; s++) {
      const inst = S.instance(enc, s);
      const r = Obj.run(enc, inst, 4 + (s % 17), s, { transform: Obj.TRANSFORMS[s % 4] });
      const f = r.f;
      const N = f.length;
      const T = r.table;
      for (const k of ['cmax', 'inv', 'rank', 'neg']) {
        for (let i = 0; i < N; i++) {
          for (let j = 0; j < N; j++) {
            if (f[i] < f[j]) assert.ok(T[k].F[i] > T[k].F[j] || (k === 'rank' && T[k].F[i] > T[k].F[j]), `${k}: orden`);
            if (f[i] === f[j]) assert.equal(T[k].F[i], T[k].F[j], `${k}: empates`);
          }
        }
      }
      assert.equal(Math.min(...T.cmax.F), 0);
      assert.equal(T.neg.p, null);
      const sum = T.rank.F.reduce((a, b) => a + b, 0);
      assert.equal(sum, (N * (N + 1)) / 2);
      for (const k of ['cmax', 'inv', 'rank']) {
        if (!T[k].p) continue;
        assert.ok(Math.abs(T[k].p.reduce((a, b) => a + b, 0) - 1) < 1e-12);
        assert.ok(Math.abs(T[k].copiesBest - N * T[k].pBest) < 1e-12);
      }
    }
  }
});

test('rango: sin empates el mejor tiene p = 2/(N + 1); con empates, la media de los puestos', () => {
  assert.deepEqual(Obj.ranks([4, 1, 3, 1]), [1, 3.5, 2, 3.5]);
  assert.deepEqual(Obj.ranks([10, 20, 30]), [3, 2, 1]);
  const t = Obj.table([7, 2, 9, 4, 5]);
  assert.ok(Math.abs(t.rank.pBest - 2 / 6) < 1e-12);
  assert.ok(Math.abs(t.rank.pWorst - 1 / 15) < 1e-12);
  assert.equal(Obj.roulette([0, 0, 0]), null, 'todo ceros: sin ruleta');
  assert.equal(Obj.roulette([1, -1]), null);
  assert.deepEqual(Obj.table([3, 3]).cmax.p, null, 'C − f con todos iguales: sin ruleta');
  // 1/(1 + f): el mejor sale (1 + f_peor)/(1 + f_mejor) veces más que el peor
  const u = Obj.table([0, 9]);
  assert.ok(Math.abs(u.inv.ratio - 10) < 1e-12);
});

// ---------- Penalización ----------

test('peso crítico λ*: por encima, el mejor es factible; justo por debajo, un infactible lo iguala o mejora', () => {
  let checked = 0;
  for (const enc of Pen.ENCODINGS) {
    for (const type of Pen.TYPES) {
      for (let s = 0; s < 60; s++) {
        const inst = S.instance(enc, s);
        const r = Pen.run(enc, inst, 10, s, { type, lambda: 1 });
        if (!r.lambdaStar) { assert.equal(r.feasibleCount, 0); continue; }
        const star = r.lambdaStar.lambda;
        const fitsAt = (l) => r.evals.map((e) => (e.violation ? (r.sense === 'max' ? e.objective - F.penaltyTerm(type, l, e.violation) : e.objective + F.penaltyTerm(type, l, e.violation)) : e.objective));
        const bestAt = (l) => { const fs = fitsAt(l); return F.ranking(fs, r.sense).order[0]; };
        assert.equal(r.evals[bestAt(star + 1e-6)].violation, 0, `${enc} ${type} s=${s}: por encima de λ*`);
        if (star > 1e-6) {
          const fs = fitsAt(star - 1e-6);
          const bestF = r.lambdaStar.bestFeasible;
          assert.ok(r.evals.some((e, i) => e.violation && !F.better(r.sense, bestF, fs[i])), `${enc} ${type} s=${s}: por debajo de λ*`);
          checked++;
        }
      }
    }
  }
  assert.ok(checked > 20, `casos con λ* > 0: ${checked}`);
});

test('penalización: las curvas en λ coinciden con la evaluación, y λ se normaliza a su rejilla', () => {
  const inst = S.instance('knapsack-bits', 7);
  const r = Pen.run('knapsack-bits', inst, 12, 3, { type: 'quadratic', lambda: 1.3 });
  r.curves.forEach((c) => {
    r.pop.forEach((x, i) => assert.ok(Math.abs(F.evaluate('knapsack-bits', inst, x, { type: 'quadratic', lambda: c.lambda }).fitness - c.fits[i]) < 1e-9));
  });
  assert.equal(Pen.normLambda('knapsack-bits', '1.34'), 1.3);
  assert.equal(Pen.normLambda('knapsack-bits', '99'), 5);
  assert.equal(Pen.normLambda('assignment-matrix', '2.3'), 2.5);
  assert.equal(Pen.normLambda('assignment-matrix', 'x'), 1);
  assert.equal(Pen.criticalLambda([{ objective: 15, violation: 4 }, { objective: 9, violation: 0 }, { objective: 10, violation: 0 }], 'max', 'linear').lambda, 1.25);
  assert.equal(Pen.criticalLambda([{ objective: 3, violation: 2 }, { objective: 7, violation: 0 }], 'min', 'quadratic').lambda, 1);
});

// ---------- Coste de evaluar ----------

test('coste: recuento de evaluaciones con y sin caché frente a un recuento independiente', () => {
  for (const enc of S.ENCODINGS) {
    for (let s = 0; s < 8; s++) {
      const inst = S.instance(enc, s);
      const r = Cost.run(enc, inst, 10, s, { G: 6 });
      const seen = new Set();
      let cum = 0;
      r.gens.forEach((g, k) => {
        assert.equal(g.cumNo, 10 * (k + 1));
        const fresh = g.pop.filter((x) => { const key = x.join(','); if (seen.has(key)) return false; seen.add(key); return true; }).length;
        cum += fresh;
        assert.equal(g.newEvals, fresh);
        assert.equal(g.cumCache, cum);
        assert.equal(g.cacheSize, seen.size);
        assert.equal(g.hit.filter((h) => !h).length, fresh);
      });
      assert.deepEqual(r.gens[0].pop, U.population(enc, inst, 10, s).pop, 'la generación 0 es la uniforme');
      // con el mismo presupuesto, la caché llega a la generación reach y no a la siguiente
      assert.ok(r.extended[r.reach].cumCache <= r.budget);
      if (!r.reachCapped && r.reach + 1 < r.extended.length) assert.ok(r.extended[r.reach + 1].cumCache > r.budget);
      assert.ok(r.reach >= r.G);
    }
  }
});

test('coste: la mutación mantiene los genes válidos y el torneo pasa al mejor de los dos', () => {
  for (const enc of S.ENCODINGS) {
    const inst = S.instance(enc, 2);
    const sh = S.shape(enc, inst);
    const next = Cost.stream(11);
    let x = U.population(enc, inst, 1, 1).pop[0];
    for (let k = 0; k < 300; k++) {
      x = Cost.mutate(sh, x, next);
      assert.equal(x.length, sh.length);
      if (sh.kind === 'perm') assert.deepEqual(x.slice().sort((a, b) => a - b), Array.from({ length: sh.length }, (_, i) => i + 1));
      else if (sh.kind === 'int') assert.ok(x.every((g) => Number.isInteger(g) && g >= 1 && g <= sh.m));
      else if (sh.kind === 'real') assert.ok(x.every((g) => g >= sh.a && g <= sh.b && Math.abs(Math.round(g * 100) - g * 100) < 1e-9));
      else assert.ok(x.every((g) => g === 0 || g === 1));
    }
  }
  // torneo con números fijados: a = ⌊0,1 · 4⌋ = 0, b = ⌊0,9 · 4⌋ = 3; sin mutación (u ≥ 1/L siempre)
  const us = [0.1, 0.9, 0.99, 0.99, 0.99];
  const child = Cost.nextGeneration({ kind: 'bits', length: 3 }, [[0, 0, 0], [1, 1, 1], [0, 1, 0], [1, 0, 1]], [1, 2, 3, 4], 'max', () => (us.length ? us.shift() : 0.99))[0];
  assert.deepEqual(child, [1, 0, 1]);
});

test('coste: con mutación de bits 1/L, un hijo sale igual que su padre con probabilidad (1 − 1/L)ᴸ', () => {
  const L = 8;
  const sh = { kind: 'bits', length: L };
  const next = Cost.stream(5);
  const x = Array(L).fill(0);
  let same = 0;
  const R = 20000;
  for (let k = 0; k < R; k++) if (Cost.mutate(sh, x, next).every((g) => g === 0)) same++;
  const p = (1 - 1 / L) ** L;
  assert.ok(Math.abs(same / R - p) < 4 * Math.sqrt((p * (1 - p)) / R), `${same / R} frente a ${p}`);
});

test('las páginas son reproducibles: la misma semilla da la misma traza', () => {
  const inst = S.instance('tsp-perm', 4);
  assert.deepEqual(Cost.run('tsp-perm', inst, 8, 21, { G: 5 }).extended, Cost.run('tsp-perm', inst, 8, 21, { G: 5 }).extended);
  assert.deepEqual(Pen.run('assignment-matrix', S.instance('assignment-matrix', 4), 8, 21, {}).fits, Pen.run('assignment-matrix', S.instance('assignment-matrix', 4), 8, 21, {}).fits);
});
