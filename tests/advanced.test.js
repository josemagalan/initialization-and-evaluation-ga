'use strict';
// Fase 4, evaluación avanzada: paisaje de aptitud (vecinos, búsqueda local, óptimos locales y FDC), aptitud con ruido,
// aptitud aproximada (metamodelos y preselección) y varios objetivos (dominancia, frentes y soportados).
const test = require('node:test');
const assert = require('node:assert/strict');

const S = require('../js/space.js');
const F = require('../js/fitness.js');
const U = require('../js/items/uniform.js');
const L = require('../js/items/landscape.js');
const Nz = require('../js/items/noise.js');
const Sg = require('../js/items/surrogate.js');
const M = require('../js/items/multi.js');
const A = require('../js/assignment.js');

// ---------- Paisaje ----------

test('vecinos a un gen: cuántos hay y en qué se diferencian', () => {
  for (const enc of S.ENCODINGS) {
    for (let s = 0; s < 10; s++) {
      const inst = S.instance(enc, s);
      const sh = S.shape(enc, inst);
      U.population(enc, inst, 4, s).pop.forEach((x) => {
        const nb = L.neighbours(enc, inst, x);
        const diff = (y) => y.reduce((c, v, i) => c + (v !== x[i] ? 1 : 0), 0);
        if (sh.kind === 'perm') {
          assert.equal(nb.length, (sh.length * (sh.length - 1)) / 2);
          nb.forEach((n) => { assert.equal(diff(n.x), 2); assert.deepEqual(n.x.slice().sort((a, b) => a - b), x.slice().sort((a, b) => a - b)); });
        } else if (sh.kind === 'int') {
          assert.equal(nb.length, sh.length * (sh.m - 1));
          nb.forEach((n) => assert.equal(diff(n.x), 1));
        } else if (sh.kind === 'real') {
          assert.ok(nb.length >= 2 && nb.length <= 4);
          nb.forEach((n) => {
            assert.equal(diff(n.x), 1);
            const k = n.x[0] !== x[0] ? 0 : 1;
            assert.ok(Math.abs(Math.abs(n.x[k] - x[k]) - 0.1) < 1e-9 && n.x[k] >= sh.a && n.x[k] <= sh.b);
          });
        } else {
          assert.equal(nb.length, sh.length);
          nb.forEach((n) => assert.equal(diff(n.x), 1));
        }
      });
    }
  }
});

test('búsqueda local: cada paso mejora estrictamente y el final no tiene ningún vecino mejor', () => {
  for (const enc of S.ENCODINGS) {
    for (let s = 0; s < 8; s++) {
      const inst = S.instance(enc, s);
      const sense = S.sense(enc);
      U.population(enc, inst, 5, s + 100).pop.forEach((x) => {
        const path = L.localSearch(enc, inst, x);
        for (let k = 1; k < path.length; k++) assert.ok(F.better(sense, path[k].fit, path[k - 1].fit), `${enc}: paso ${k}`);
        const end = path[path.length - 1];
        assert.ok(!L.neighbours(enc, inst, end.x).some((n) => F.better(sense, F.evaluate(enc, inst, n.x).fitness, end.fit)), `${enc}: óptimo local`);
      });
    }
  }
});

test('óptimos locales del espacio entero frente a un recorrido independiente (mochila de 6 objetos)', () => {
  for (let s = 0; s < 10; s++) {
    const inst = S.instance('knapsack-bits', s, { n: 6 });
    const n = 6;
    const fit = (m) => {
      let w = 0; let v = 0;
      for (let i = 0; i < n; i++) if (m & (1 << i)) { w += inst.weights[i]; v += inst.values[i]; }
      return v - Math.max(0, w - inst.capacity);
    };
    let local = 0;
    for (let m = 0; m < 64; m++) {
      let isLocal = true;
      for (let i = 0; i < n; i++) if (fit(m ^ (1 << i)) > fit(m)) isLocal = false;
      if (isLocal) local++;
    }
    assert.equal(L.landscapeStats('knapsack-bits', inst).local, local, `semilla ${s}`);
  }
  assert.equal(L.landscapeStats('tsp-perm', S.instance('tsp-perm', 1)), null);
  assert.equal(L.landscapeStats('function-real', S.instance('function-real', 1)), null);
});

test('óptimos del problema: todos los del conjunto tienen el valor óptimo', () => {
  for (const enc of ['knapsack-bits', 'assignment-int', 'assignment-matrix', 'tsp-perm']) {
    for (let s = 0; s < 6; s++) {
      const inst = S.instance(enc, s);
      const opt = S.optimum(enc, inst);
      const set = L.optimalSet(enc, inst);
      assert.ok(set.length >= 1);
      set.forEach((x) => { const q = S.quality(enc, inst, x); assert.ok(q.feasible && Math.abs(q.objective - opt) < 1e-9, enc); });
    }
  }
  const asg = S.instance('assignment-int', 2);
  assert.equal(L.optimalSet('assignment-int', asg).length, A.optimum(asg).count);
});

test('FDC: correlación de Pearson independiente y muestra cuyos N primeros son la población', () => {
  const inst = S.instance('tsp-perm', 4);
  const r = L.run('tsp-perm', inst, 8, 9);
  const sample = U.population('tsp-perm', inst, L.SAMPLE, 9).pop;
  assert.deepEqual(r.pop, sample.slice(0, 8));
  const pts = r.fdc.points;
  const xs = pts.map((p) => p.fit);
  const ys = pts.map((p) => p.d);
  const mean = (v) => v.reduce((a, b) => a + b, 0) / v.length;
  const mx = mean(xs); const my = mean(ys);
  const cov = mean(xs.map((x, i) => (x - mx) * (ys[i] - my)));
  const sd = (v, m) => Math.sqrt(mean(v.map((x) => (x - m) ** 2)));
  assert.ok(Math.abs(r.fdc.r - cov / (sd(xs, mx) * sd(ys, my))) < 1e-12);
  assert.equal(L.pearson([1, 2, 3], [5, 5, 5]), null);
});

// ---------- Ruido ----------

test('ruido: Box–Muller da media 0 y desviación σ; Φ en valores conocidos', () => {
  const next = Nz.stream(3);
  const z = Array.from({ length: 20000 }, () => Nz.gaussian(next(), next(), 10));
  const m = z.reduce((a, b) => a + b, 0) / z.length;
  const sd = Math.sqrt(z.reduce((a, b) => a + (b - m) ** 2, 0) / z.length);
  assert.ok(Math.abs(m) < 0.3, `media ${m}`);
  assert.ok(Math.abs(sd - 10) < 0.3, `desviación ${sd}`);
  assert.ok(z.every((v) => Math.abs(Math.round(v * 100) - v * 100) < 1e-6), 'centésimas');
  assert.ok(Math.abs(Nz.Phi(0) - 0.5) < 1e-7);
  assert.ok(Math.abs(Nz.Phi(1.959964) - 0.975) < 1e-6);
  assert.ok(Math.abs(Nz.Phi(-1) - 0.158655) < 1e-6);
});

test('ruido: medias, pares mal ordenados, probabilidad de equivocarse y R necesario', () => {
  for (const enc of Nz.ENCODINGS) {
    for (let s = 0; s < 10; s++) {
      const r = Nz.run(enc, S.instance(enc, s), 10, s, { R: 1 + (s % 6) });
      r.noisy.forEach((reps, i) => {
        assert.equal(reps.length, r.R);
        reps.forEach((e) => assert.ok(Math.abs(e.value - r.f[i] - e.z) < 1e-9));
        assert.ok(Math.abs(r.means[i] - reps.reduce((a, b) => a + b.value, 0) / r.R) < 1e-9);
      });
      let d = 0;
      for (let i = 0; i < 10; i++) for (let j = i + 1; j < 10; j++) if (r.f[i] !== r.f[j] && (r.f[i] < r.f[j]) !== (r.single[i] < r.single[j]) && r.single[i] !== r.single[j]) d++;
      assert.equal(r.discSingle, d);
      assert.ok(r.pWrongR <= r.pWrong1 + 1e-12);
      if (r.r95 != null) {
        const p = (k) => Nz.Phi(-(r.gap * Math.sqrt(k)) / (r.sigma * Math.SQRT2));
        assert.ok(p(r.r95) < 0.05 && (r.r95 === 1 || p(r.r95 - 1) >= 0.05));
      }
    }
  }
  const z0 = Nz.run('tsp-perm', S.instance('tsp-perm', 1), 6, 1, { sigma: 0 });
  assert.deepEqual(z0.single, z0.f, 'sin ruido');
  assert.equal(z0.discSingle, 0);
});

// ---------- Aptitud aproximada ----------

test('metamodelos: vecino más cercano, inversa de la distancia y preselección', () => {
  for (const enc of Sg.ENCODINGS) {
    for (let s = 0; s < 10; s++) {
      for (const method of Sg.METHODS) {
        const inst = S.instance(enc, s);
        const r = Sg.run(enc, inst, 8, s, { method });
        const g = U.population(enc, inst, 16, s).pop;
        assert.deepEqual(r.cands, g.slice(8));
        const fits = r.archive.map((a) => a.fit);
        r.cands.forEach((x, i) => {
          const p = S.point(enc, inst, x);
          const ds = r.archive.map((a) => Math.hypot(a.p[0] - p[0], a.p[1] - p[1]));
          const k = ds.indexOf(Math.min(...ds));
          if (method === 'nn') assert.equal(r.pred[i], fits[k]);
          else {
            assert.ok(r.pred[i] >= Math.min(...fits) - 1e-9 && r.pred[i] <= Math.max(...fits) + 1e-9);
            if (ds[k] > 0) {
              const w = ds.map((d) => 1 / (d * d));
              assert.ok(Math.abs(r.pred[i] - w.reduce((a, b, j) => a + b * fits[j], 0) / w.reduce((a, b) => a + b, 0)) < 1e-9);
            }
          }
          assert.equal(r.truth[i], F.evaluate(enc, inst, x).fitness);
        });
        assert.equal(r.preselected.length, 4);
        const cut = Math.max(...r.preselected.map((i) => r.pred[i]));
        r.pred.forEach((v, i) => { if (r.preselected.indexOf(i) === -1) assert.ok(v >= cut); });
        assert.equal(r.foundBest, r.preselected.indexOf(r.trueBest) !== -1);
      }
    }
  }
  // en un punto del archivo, la inversa de la distancia devuelve su aptitud
  assert.equal(Sg.predict('idw', [{ p: [0, 0], fit: 3 }, { p: [1, 1], fit: 9 }], [1, 1]).value, 9);
  assert.equal(Sg.spearman([1, 2, 3], [10, 30, 20]), 0.5);
});

// ---------- Varios objetivos ----------

test('varios objetivos: frentes, dominancia entre frentes y soportados frente a un barrido fino de w', () => {
  for (const enc of M.ENCODINGS) {
    for (let s = 0; s < 15; s++) {
      const r = M.run(enc, S.instance(enc, s), 12, s, {});
      const o = r.o;
      for (let i = 0; i < 12; i++) {
        for (let j = 0; j < 12; j++) if (M.dominates(o[j], o[i])) assert.ok(r.rank[j] < r.rank[i], 'quien domina va en un frente anterior');
        if (r.rank[i] > 1) assert.ok(o.some((v, j) => r.rank[j] === r.rank[i] - 1 && M.dominates(v, o[i])), 'lo domina alguien del frente anterior');
      }
      // un barrido fino de w solo encuentra soportados, y encuentra a todos los soportados que no empatan
      const found = new Set();
      for (let k = 1; k < 2000; k++) found.add(M.weighted(r.norm, k / 2000).best);
      found.forEach((i) => assert.ok(r.supported.has(i), `${enc} s=${s}: I${i + 1} elegido por w pero no soportado`));
      r.supported.forEach((i) => assert.equal(r.rank[i], 1, 'un soportado es no dominado'));
    }
  }
});

test('frente verdadero: no dominado y completo frente a un recorrido independiente (mochila de 6 objetos)', () => {
  for (let s = 0; s < 6; s++) {
    const inst = S.instance('knapsack-bits', s, { n: 6 });
    const tf = M.trueFront('knapsack-bits', inst);
    const all = [];
    for (let m = 0; m < 64; m++) all.push(M.objectives('knapsack-bits', inst, Array.from({ length: 6 }, (_, i) => (m >> i) & 1)).o);
    const nd = new Set(all.filter((u) => !all.some((v) => M.dominates(v, u))).map((u) => u.join(',')));
    assert.deepEqual(new Set(tf.map((p) => p.o.join(','))), nd);
  }
  assert.equal(M.normW('0.33'), 0.35);
  assert.equal(M.normW('x'), 0.5);
});
