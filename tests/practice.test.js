'use strict';
// Modo práctica: cada ejercicio tiene una respuesta única que se puede obtener solo con los datos que da (se
// recalcula aquí de forma independiente, leyendo esas tablas), la corrección es elemento a elemento con las
// tolerancias anunciadas, y los textos existen en los dos idiomas.
const test = require('node:test');
const assert = require('node:assert/strict');

const PR = require('../js/practice.js');
const TXT = require('../js/practice-text.js');
const registry = require('../js/registry.js');
const S = require('../js/space.js');
const Fn = require('../js/func.js');

// ---------- Páginas de prueba ----------
const EXTRAS = {
  seeded: [{ K: '1' }, { K: '3' }],
  quasi: [{ m: 'halton' }, { m: 'sobol' }, { m: 'lhs' }],
  ssi: [{ d: '0.3' }, { d: '0.15' }, { d: '0.5' }],
  objective: [{ tr: 'cmax' }, { tr: 'inv' }, { tr: 'rank' }],
  penalty: [{ pt: 'linear', l: '1' }, { pt: 'quadratic', l: '0.5' }, { pt: 'linear', l: '2.5' }],
  cost: [{ G: '1' }, { G: '6' }],
  noise: [{ sg: '30', R: '3' }, { sg: '12', R: '5' }],
  surrogate: [{ sm: 'nn' }, { sm: 'idw' }],
  multi: [{ w: '0.5' }, { w: '0.2' }],
};
const PARAMS = {
  'knapsack-bits': [{ n: 5 }, { n: 8 }], 'assignment-int': [{ n: 5, m: 2 }, { n: 6, m: 3 }], 'assignment-matrix': [{ n: 5, m: 2 }, { n: 6, m: 3 }],
  'tsp-perm': [{ n: 5 }, { n: 7 }], 'function-real': [{ fn: 'himmelblau' }, { fn: 'rastrigin' }], 'function-bits': [{ fn: 'himmelblau', k: 3 }, { fn: 'rastrigin', k: 5 }],
};

/** Todas las combinaciones de página de un elemento (codificaciones, tamaños, ajustes, N y semillas). */
function* pages(item, seeds) {
  for (const enc of registry.getItem(item).encodings) {
    for (const p of PARAMS[enc]) {
      for (const x of EXTRAS[item] || [{}]) {
        for (const N of [4, 6, 9]) {
          for (const s of seeds || [1, 2]) yield { enc, p: S.params(enc, p), N, s: s * 31 + 7, ps: s * 977 + N, x };
        }
      }
    }
  }
}
const all = (fn, seeds) => { for (const item of PR.ITEM_IDS) for (const pg of pages(item, seeds)) for (const type of PR.typesFor(item)) fn(item, type, pg, PR.exercise(item, type, pg)); };

// ---------- Lectura de los datos ----------
const val = (c) => (c == null ? null : typeof c === 'number' ? c : c.chrom ? c.chrom : c.v != null ? c.v : c);
const tableOf = (ex, key) => { const gv = ex.givens.find((g) => g.key === key && g.table); assert.ok(gv, `falta la tabla ${key}`); return gv.table; };
const rowsOf = (ex, key) => tableOf(ex, key).rows.map((r) => r.slice(1).map(val));
const givenParams = (ex, prefix) => { const gv = ex.givens.find((g) => g.key && g.key.startsWith(prefix)); assert.ok(gv, `falta ${prefix}`); return gv.params; };
const answers = (ex, id) => ex.groups.find((g) => g.id === id).items.map((it) => it.answer);
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} frente a ${b}`);

/** La instancia, leída de las tablas de datos del ejercicio. */
function instanceFrom(ex) {
  const k = ex.givens.find((g) => g.key === 'prKnapTable');
  if (k) return { weights: k.table.rows[0].slice(1), values: k.table.rows[1].slice(1), W: k.params.W };
  const t = ex.givens.find((g) => g.key === 'prTimesTable');
  if (t) { const rows = t.table.rows.map((r) => r.slice(1)); return { p: rows[0].map((_, i) => rows.map((r) => r[i])) }; }
  const d = ex.givens.find((g) => g.key === 'prDistTable');
  if (d) return { dist: d.table.rows.map((r) => r.slice(1).map((c) => (c === '—' ? 0 : c.v))) };
  return null;
}

// ---------- Cálculos independientes ----------
const fnOf = (ex) => (ex.page.p.fn === 'rastrigin' ? 'rastrigin' : 'himmelblau');
const F_ = {
  himmelblau: (x, y) => (x * x + y - 11) ** 2 + (x + y * y - 7) ** 2,
  rastrigin: (x, y) => 20 + x * x - 10 * Math.cos(2 * Math.PI * x) + y * y - 10 * Math.cos(2 * Math.PI * y),
};
const BOX = { himmelblau: [-5, 5], rastrigin: [-5.12, 5.12] };
function decodeBits(fn, bits) {
  const k = bits.length / 2;
  const [a, b] = BOX[fn];
  return [bits.slice(0, k), bits.slice(k)].map((v) => a + parseInt(v.join(''), 2) * (b - a) / (2 ** k - 1));
}
function loadsOf(p, assign) {
  const m = p[0].length;
  const L = Array(m).fill(0);
  assign.forEach((j, i) => { L[j - 1] += p[i][j - 1]; });
  return L;
}
function matrixInfo(p, flat) {
  const m = p[0].length;
  const L = Array(m).fill(0);
  let v = 0;
  for (let i = 0; i < p.length; i++) {
    const row = flat.slice(i * m, (i + 1) * m);
    row.forEach((b, j) => { if (b) L[j] += p[i][j]; });
    v += Math.abs(row.reduce((a, c) => a + c, 0) - 1);
  }
  return { cmax: Math.max(0, ...L), v };
}
const tourLen = (dist, t) => Math.round(t.reduce((s, c, k) => s + dist[c - 1][t[(k + 1) % t.length] - 1] * 10, 0)) / 10;
/** Aptitud de un cromosoma con la regla de la página (penalización lineal con λ = 1). */
function fitness(enc, inst, x, fn) {
  if (enc === 'knapsack-bits') {
    const w = x.reduce((s, b, i) => s + b * inst.weights[i], 0);
    const v = x.reduce((s, b, i) => s + b * inst.values[i], 0);
    return v - Math.max(0, w - inst.W);
  }
  if (enc === 'assignment-int') return Math.max(...loadsOf(inst.p, x));
  if (enc === 'assignment-matrix') { const r = matrixInfo(inst.p, x); return r.cmax + r.v; }
  if (enc === 'tsp-perm') return tourLen(inst.dist, x);
  const pt = enc === 'function-bits' ? decodeBits(fn, x) : x;
  return F_[fn](pt[0], pt[1]);
}
function normDistance(enc, a, b, fn) {
  if (enc === 'tsp-perm') {
    const edges = (t) => new Set(t.map((c, i) => [c, t[(i + 1) % t.length]].sort((u, v) => u - v).join('-')));
    const eb = edges(b);
    return [...edges(a)].filter((e) => !eb.has(e)).length / a.length;
  }
  if (enc.startsWith('function')) {
    const p = enc === 'function-bits' ? decodeBits(fn, a) : a;
    const q = enc === 'function-bits' ? decodeBits(fn, b) : b;
    const [lo, hi] = BOX[fn];
    return Math.hypot(p[0] - q[0], p[1] - q[1]) / (Math.SQRT2 * (hi - lo));
  }
  return a.filter((v, i) => v !== b[i]).length / a.length;
}
function fisherYates(n, us) {
  const p = Array.from({ length: n }, (_, i) => i + 1);
  const js = [];
  us.forEach((u, q) => { const k = n - q; const j = 1 + Math.floor(u * k); js.push(j); [p[k - 1], p[j - 1]] = [p[j - 1], p[k - 1]]; });
  return { p, js };
}
const r2 = (v) => Math.round(v * 100) / 100 + 0;
/** Inverso radical con cadenas: los dígitos de i en base b, al revés, detrás de la coma. */
const radical = (i, b) => i.toString(b).split('').reverse().reduce((s, d, k) => s + Number(d) / b ** (k + 1), 0);

// ======================================================================

test('cada elemento del registro tiene práctica y cada tipo, su nombre y su presentación en ES y EN', () => {
  for (const it of registry.allItems()) {
    const types = PR.typesFor(it.id);
    assert.ok(types.length >= 1, it.id);
    for (const ty of types) for (const l of ['es', 'en']) {
      assert.ok(TXT[l][`prType_${ty}`], `prType_${ty} (${l})`);
      assert.ok(TXT[l][`prIntro_${ty}`], `prIntro_${ty} (${l})`);
    }
  }
});

test('los textos de la práctica tienen las mismas claves y parámetros en ES y EN', () => {
  const params = (s) => (s.match(/\{(\w+)\}/g) || []).sort().join(',');
  assert.deepEqual(Object.keys(TXT.es).sort(), Object.keys(TXT.en).sort());
  for (const k of Object.keys(TXT.es)) assert.equal(params(TXT.es[k]), params(TXT.en[k]), k);
});

test('todos los ejercicios: la respuesta correcta es válida y obtiene la nota máxima; los textos existen y se rellenan', () => {
  let n = 0;
  const keys = (o, out) => {
    if (Array.isArray(o)) o.forEach((x) => keys(x, out));
    else if (o && typeof o === 'object') { if (typeof o.key === 'string') out.push(o); Object.values(o).forEach((x) => keys(x, out)); }
    return out;
  };
  all((item, type, pg, ex) => {
    n++;
    assert.ok(ex.groups.length >= 1 && ex.groups.every((g) => g.items.length >= 1), `${item}/${type}`);
    const ans = PR.answerOf(ex);
    assert.equal(PR.validate(ex, ans), null, `${item}/${type}/${pg.enc}`);
    const gr = PR.grade(ex, ans);
    assert.equal(gr.ok, gr.total);
    for (const k of keys([ex.givens, ex.groups], [])) {
      for (const l of ['es', 'en']) {
        assert.ok(TXT[l][k.key] != null, `falta ${k.key} (${l})`);
        assert.doesNotMatch(PR.t(l, k.key, k.params), /\{\w+\}/, `${k.key} sin rellenar (${l})`);
      }
    }
    // Volver a pedir el ejercicio con su página da lo mismo
    assert.deepEqual(PR.answerOf(PR.exercise(item, type, ex.page)), ans);
    // El paso que se enseña y el de la solución existen en la traza
    const steps = PR.model(item, ex.page).r.steps;
    assert.ok(steps.some((s) => s.type === ex.view.type), `${item}: vista ${ex.view.type}`);
    assert.ok(steps.some((s) => ex.solution.types.indexOf(s.type) !== -1), `${item}: solución ${ex.solution.types}`);
  });
  assert.ok(n > 1000, `${n} ejercicios`);
});

test('el paso que se enseña al practicar no da la respuesta', () => {
  const hidden = { generate: (s) => s.done === 0, build: (s) => s.done === 0, quasi: (s) => s.done === 0, accept: (s) => s.done === 0, evaluate: (s) => s.done === 0 };
  all((item, type, pg, ex) => {
    const st = PR.model(item, ex.page).r.steps.find((s) => s.type === ex.view.type);
    if (hidden[type]) assert.ok(hidden[type](st), `${item}/${type}: ${ex.view.type}`);
  }, [1]);
});

// ---------- Inicialización ----------

test('generar: cada gen se recalcula con la regla a partir de los números dados', () => {
  for (const pg of pages('uniform', [1, 2, 3])) {
    const ex = PR.exercise('uniform', 'generate', pg);
    const us = rowsOf(ex, ex.givens[1].key);
    const sh = S.shape(pg.enc, S.instance(pg.enc, pg.s, pg.p));
    us.forEach((row, i) => {
      let x;
      if (sh.kind === 'perm') {
        const fy = fisherYates(sh.length, row);
        x = fy.p;
        if (i === 0) assert.deepEqual(answers(ex, 'j1'), fy.js);
      } else if (sh.kind === 'int') x = row.map((u) => 1 + Math.floor(u * sh.m));
      else if (sh.kind === 'real') x = row.map((u) => r2(sh.a + u * (sh.b - sh.a)));
      else x = row.map((u) => (u < 0.5 ? 1 : 0));
      assert.deepEqual(answers(ex, `x${i + 1}`), x, `${pg.enc} I${i + 1}`);
    });
  }
});

test('diversidad: distancias, media, mínima y distintos frente a un cálculo independiente', () => {
  for (const pg of pages('uniform', [1, 2, 3])) {
    const ex = PR.exercise('uniform', 'diversity', pg);
    const pop = rowsOf(ex, 'prPopFirst').map((r) => r[0]);
    const fn = pg.enc.startsWith('function') ? fnOf(ex) : null;
    const d = [];
    for (let i = 0; i < pop.length; i++) for (let j = i + 1; j < pop.length; j++) d.push(normDistance(pg.enc, pop[i], pop[j], fn));
    answers(ex, 'pairs').forEach((v, q) => near(v, d[q], 1e-9, `${pg.enc} par ${q}`));
    near(answers(ex, 'mean')[0], d.reduce((a, b) => a + b, 0) / d.length, 1e-9, 'media');
    near(answers(ex, 'min')[0], Math.min(...d), 1e-9, 'mínima');
    // En el viajante, dos cromosomas del mismo circuito son el mismo individuo
    const key = (x) => (pg.enc === 'tsp-perm' ? x.map((c, i) => [c, x[(i + 1) % x.length]].sort((u, v) => u - v).join('-')).sort().join('|') : x.join());
    assert.equal(answers(ex, 'distinct')[0], new Set(pop.map(key)).size);
  }
});

test('heurística voraz: mochila por valor/peso, asignación a la máquina que acaba antes, vecino más cercano', () => {
  for (const pg of pages('seeded', [1, 2, 3, 4])) {
    const ex = PR.exercise('seeded', 'greedy', pg);
    const inst = instanceFrom(ex);
    if (pg.enc === 'knapsack-bits') {
      const n = inst.weights.length;
      const order = Array.from({ length: n }, (_, i) => i + 1).sort((a, b) => inst.values[b - 1] / inst.weights[b - 1] - inst.values[a - 1] / inst.weights[a - 1] || a - b);
      assert.deepEqual(answers(ex, 'order'), order);
      const x = Array(n).fill(0);
      let w = 0;
      order.forEach((i) => { if (w + inst.weights[i - 1] <= inst.W) { x[i - 1] = 1; w += inst.weights[i - 1]; } });
      assert.deepEqual(answers(ex, 'x'), x);
      assert.equal(answers(ex, 'value')[0], x.reduce((s, b, i) => s + b * inst.values[i], 0));
    } else if (pg.enc === 'assignment-int') {
      const m = inst.p[0].length;
      const L = Array(m).fill(0);
      const a = inst.p.map((row) => { let best = 0; for (let j = 1; j < m; j++) if (L[j] + row[j] < L[best] + row[best]) best = j; L[best] += row[best]; return best + 1; });
      assert.deepEqual(answers(ex, 'x'), a);
      assert.equal(answers(ex, 'cmax')[0], Math.max(...L));
    } else {
      const n = inst.dist.length;
      const tour = [1];
      while (tour.length < n) {
        const last = tour[tour.length - 1];
        let best = null;
        for (let c = 1; c <= n; c++) if (tour.indexOf(c) === -1 && (best == null || inst.dist[last - 1][c - 1] < inst.dist[last - 1][best - 1])) best = c;
        tour.push(best);
      }
      assert.deepEqual(answers(ex, 'tour'), tour.slice(1));
      near(answers(ex, 'length')[0], tourLen(inst.dist, tour), 1e-9, 'longitud');
    }
  }
});

test('copias de la semilla: la recurrencia k′ = N (1 − (1 − k/N)²) y la generación en que llega a N − 0,5', () => {
  for (const N of [4, 10, 20]) for (const K of [1, 2, 4]) {
    if (K > N) continue;
    const ex = PR.exercise('seeded', 'takeover', { enc: 'knapsack-bits', p: { n: 6 }, N, s: 1, ps: 1, x: { K: String(K) } });
    let k = K;
    const ks = [];
    let g = 0;
    let reach = K >= N - 0.5 ? 0 : null;
    while (reach == null || g < 3) { g++; k = N * (1 - (1 - k / N) ** 2); if (g <= 3) ks.push(k); if (reach == null && k >= N - 0.5) reach = g; }
    answers(ex, 'k').forEach((v, q) => near(v, ks[q], 1e-9, `N=${N} K=${K} g=${q + 1}`));
    assert.equal(answers(ex, 'gen')[0], reach);
  }
});

test('cuasialeatoria: Halton con inversos radicales en cadena, Sobol con los números directores dados, hipercubo con π y v', () => {
  for (const pg of pages('quasi', [1, 2, 3])) {
    const ex = PR.exercise('quasi', 'quasi', pg);
    const [a, b] = BOX[fnOf(ex) === 'rastrigin' ? 'rastrigin' : 'himmelblau'];
    const rule = givenParams(ex, 'prQuasiRule_');
    const idx = Array.from({ length: rule.to - rule.from + 1 }, (_, q) => rule.from + q);
    const x1 = answers(ex, 'x1');
    const x2 = answers(ex, 'x2');
    if (pg.x.m === 'lhs') {
      const P = givenParams(ex, 'prLhsPerms');
      const p1 = P.p1.split(', ').map(Number);
      const p2 = P.p2.split(', ').map(Number);
      const vs = rowsOf(ex, 'prLhsV');
      idx.forEach((i, q) => {
        [[p1, x1], [p2, x2]].forEach(([perm, xs], d) => {
          const u = (perm[i - 1] - 1 + vs[q][d]) / pg.N;
          near(xs[q], a + u * (b - a), 0.0105, `LHS I${i}`);
          // Dentro de su estrato
          const s = Math.min(pg.N - 1, Math.floor(((xs[q] - a) / (b - a)) * pg.N + 1e-9));
          assert.equal(s, perm[i - 1] - 1);
        });
      });
      continue;
    }
    const u1 = answers(ex, 'u1');
    const u2 = answers(ex, 'u2');
    const dirs = pg.x.m === 'sobol' ? givenParams(ex, 'prSobolDirs') : null;
    idx.forEach((i, q) => {
      near(u1[q], radical(i, 2), 1e-12, `u₁ I${i}`);
      let v2;
      if (pg.x.m === 'halton') v2 = radical(i, 3);
      else {
        const fr = dirs.dirs.split(', ').map((s) => s.split(' = ')[1].split('/').map(Number));
        const L = 32;
        let acc = 0;
        i.toString(2).split('').reverse().forEach((bit, k) => { if (bit === '1') acc ^= fr[k][0] * (L / fr[k][1]); });
        v2 = acc / L;
      }
      near(u2[q], v2, 1e-12, `u₂ I${i}`);
      near(x1[q], r2(a + u1[q] * (b - a)), 1e-9, `x₁ I${i}`);
      near(x2[q], r2(a + u2[q] * (b - a)), 1e-9, `x₂ I${i}`);
    });
  }
});

test('inhibición secuencial: distancia al aceptado más cercano y decisión, candidato a candidato', () => {
  for (const pg of pages('ssi', [1, 2, 3])) {
    const ex = PR.exercise('ssi', 'accept', pg);
    const cands = rowsOf(ex, 'prCands').map((r) => r[0]);
    const delta = givenParams(ex, 'prSsiRule').delta.v;
    const fn = pg.enc.startsWith('function') ? fnOf(ex) : null;
    const acc = [cands[0]];
    const d = [];
    const yes = [];
    cands.slice(1).forEach((c) => {
      const m = Math.min(...acc.map((y) => normDistance(pg.enc, c, y, fn)));
      d.push(m);
      const ok = m >= delta - 1e-9;
      yes.push(ok ? 'yes' : 'no');
      if (ok) acc.push(c);
    });
    answers(ex, 'dmin').forEach((v, q) => near(v, d[q], 1e-9, `${pg.enc} C${q + 2}`));
    assert.deepEqual(answers(ex, 'acc'), yes);
    assert.ok(acc.length <= Math.min(4, pg.N));
  }
});

test('inicialización factible: orden de Fisher–Yates y mochila llena; una máquina por tarea', () => {
  for (const pg of pages('feasible', [1, 2, 3])) {
    const ex = PR.exercise('feasible', 'build', pg);
    if (pg.enc === 'knapsack-bits') {
      const inst = instanceFrom(ex);
      const us = rowsOf(ex, 'prDrawsPerm')[0];
      const { p } = fisherYates(inst.weights.length, us);
      assert.deepEqual(answers(ex, 'perm'), p);
      const x = Array(p.length).fill(0);
      let w = 0;
      p.forEach((i) => { if (w + inst.weights[i - 1] <= inst.W) { x[i - 1] = 1; w += inst.weights[i - 1]; } });
      assert.deepEqual(answers(ex, 'x'), x);
      assert.equal(answers(ex, 'weight')[0], w);
      // Llena: no cabe ningún objeto más
      assert.ok(x.every((b, i) => b || w + inst.weights[i] > inst.W));
    } else {
      const m = Number(pg.p.m);
      rowsOf(ex, 'prDrawsTask').forEach((us, i) => assert.deepEqual(answers(ex, `a${i + 1}`), us.map((u) => 1 + Math.floor(u * m))));
    }
  }
});

// ---------- Evaluación ----------

test('calcular la aptitud: la cadena de los primeros individuos frente a un cálculo independiente', () => {
  for (const pg of pages('pipeline', [1, 2, 3])) {
    const ex = PR.exercise('pipeline', 'evaluate', pg);
    const inst = instanceFrom(ex);
    const pop = rowsOf(ex, 'prPopFirst').map((r) => r[0]);
    const fn = pg.enc.startsWith('function') ? fnOf(ex) : null;
    pop.forEach((x, i) => {
      if (pg.enc === 'knapsack-bits') {
        const w = x.reduce((s, b, q) => s + b * inst.weights[q], 0);
        assert.equal(answers(ex, 'weight')[i], w);
        assert.equal(answers(ex, 'excess')[i], Math.max(0, w - inst.W));
      }
      if (pg.enc === 'assignment-int' && i === 0) assert.deepEqual(answers(ex, 'loads'), loadsOf(inst.p, x));
      if (pg.enc === 'assignment-matrix') {
        const r = matrixInfo(inst.p, x);
        assert.equal(answers(ex, 'v')[i], r.v);
        assert.equal(answers(ex, 'cmax')[i], r.cmax);
      }
      if (pg.enc === 'function-bits') near(answers(ex, 'x1')[i], decodeBits(fn, x)[0], 1e-9, 'x₁');
      const id = { 'knapsack-bits': 'fitness', 'assignment-int': 'cmax', 'assignment-matrix': 'fitness', 'tsp-perm': 'length' }[pg.enc] || 'f';
      near(answers(ex, id)[i], fitness(pg.enc, inst, x, fn), 1e-9, `${pg.enc} I${i + 1}`);
    });
  }
});

test('ordenar por aptitud: puestos con empates (el menor de los que ocupan) a partir de la tabla', () => {
  for (const pg of pages('pipeline', [1, 2, 3])) {
    const ex = PR.exercise('pipeline', 'rank', pg);
    const f = rowsOf(ex, 'prFitTable').map((r) => r[0]);
    const max = pg.enc === 'knapsack-bits';
    const rank = f.map((v) => 1 + f.filter((w) => (max ? w > v : w < v)).length);
    assert.deepEqual(answers(ex, 'rank'), rank);
  }
});

test('aptitud y ruleta: las transformaciones y pᵢ = Fᵢ / Σ F a partir de la tabla del objetivo', () => {
  for (const pg of pages('objective', [1, 2, 3])) {
    const ex = PR.exercise('objective', 'transform', pg);
    const f = rowsOf(ex, 'prObjTable').map((r) => r[0]);
    let F;
    if (pg.x.tr === 'cmax') { const C = Math.max(...f); assert.equal(answers(ex, 'C')[0], C); F = f.map((v) => C - v); }
    else if (pg.x.tr === 'inv') F = f.map((v) => 1 / (1 + v));
    else F = f.map((v) => { const worse = f.filter((w) => w > v).length; const eq = f.filter((w) => w === v).length; return worse + (eq + 1) / 2; });
    answers(ex, 'F').forEach((v, i) => near(v, F[i], 1e-9, `F I${i + 1}`));
    const sum = F.reduce((a, b) => a + b, 0);
    answers(ex, 'p').forEach((v, i) => near(v, F[i] / sum, 1e-9, `p I${i + 1}`));
    near(answers(ex, 'p').reduce((a, b) => a + b, 0), 1, 1e-9, 'Σ p');
  }
  // −f no sirve para la ruleta: el ejercicio pasa a C − f y su página lo dice
  const ex = PR.exercise('objective', 'transform', { enc: 'tsp-perm', p: { n: 6 }, N: 5, s: 3, ps: 4, x: { tr: 'neg' } });
  assert.equal(ex.page.x.tr, 'cmax');
});

test('penalizar: violación, aptitud penalizada y λ* a partir de la tabla de la población', () => {
  for (const pg of pages('penalty', [1, 2, 3, 4])) {
    const ex = PR.exercise('penalty', 'penalize', pg);
    const rows = rowsOf(ex, 'prPenPop');
    const lambda = givenParams(ex, 'prPenRule_').lambda.v;
    const quad = pg.x.pt === 'quadratic';
    const knap = pg.enc === 'knapsack-bits';
    const W = knap ? givenParams(ex, 'prPenKnapData').W : null;
    const m = knap ? null : Number(pg.p.m);
    const z = rows.map((r) => (knap ? r[1] : r[1]));
    const v = rows.map((r) => (knap ? Math.max(0, r[2] - W) : (() => { let s = 0; for (let i = 0; i < r[0].length / m; i++) s += Math.abs(r[0].slice(i * m, (i + 1) * m).reduce((a, b) => a + b, 0) - 1); return s; })()));
    assert.deepEqual(answers(ex, 'v'), v);
    const P = v.map((e) => (quad ? (lambda * e) ** 2 : lambda * e));
    answers(ex, 'fitness').forEach((F, i) => near(F, knap ? z[i] - P[i] : z[i] + P[i], 1e-9, `F I${i + 1}`));
    const feas = z.filter((_, i) => v[i] === 0);
    if (!feas.length) { assert.ok(!ex.groups.some((g) => g.id === 'lstar')); continue; }
    const B = knap ? Math.max(...feas) : Math.min(...feas);
    let star = 0;
    z.forEach((zi, i) => { if (v[i]) { const d = Math.max(0, knap ? zi - B : B - zi); star = Math.max(star, (quad ? Math.sqrt(d) : d) / v[i]); } });
    near(answers(ex, 'lstar')[0], star, 1e-9, 'λ*');
  }
});

test('contar evaluaciones: con caché solo los cromosomas nuevos; sin caché, N por generación', () => {
  for (const pg of pages('cost', [1, 2, 3])) {
    const ex = PR.exercise('cost', 'cache', pg);
    const g0 = rowsOf(ex, 'prGen0').map((r) => r[0].join());
    const g1 = rowsOf(ex, 'prGen1').map((r) => r[0].join());
    const seen = new Set(g0);
    const must = g1.map((x) => { const isNew = !seen.has(x); seen.add(x); return isNew ? 'yes' : 'no'; });
    assert.deepEqual(answers(ex, 'new'), must);
    assert.equal(answers(ex, 'cum')[0], seen.size);
    assert.equal(answers(ex, 'plain')[0], 2 * pg.N);
    assert.equal(answers(ex, 'budget')[0], pg.N * (Number(pg.x.G) + 1));
  }
});

test('vecinos: número, aptitudes y óptimo local del individuo 1 frente a una enumeración independiente', () => {
  for (const pg of pages('landscape', [1, 2])) {
    const ex = PR.exercise('landscape', 'neighbours', pg);
    const inst = instanceFrom(ex);
    const x = rowsOf(ex, 'prIndGiven')[0][0];
    const fn = pg.enc.startsWith('function') ? fnOf(ex) : null;
    const nb = [];
    if (pg.enc === 'tsp-perm') { for (let i = 0; i < x.length; i++) for (let j = i + 1; j < x.length; j++) { const y = x.slice(); [y[i], y[j]] = [y[j], y[i]]; nb.push(y); } }
    else if (pg.enc === 'assignment-int') { const m = inst.p[0].length; x.forEach((g, i) => { for (let v = 1; v <= m; v++) if (v !== g) { const y = x.slice(); y[i] = v; nb.push(y); } }); }
    else if (pg.enc === 'function-real') { const [a, b] = BOX[fn]; [0, 1].forEach((i) => [0.1, -0.1].forEach((h) => { const v = r2(x[i] + h); if (v >= a && v <= b) { const y = x.slice(); y[i] = v; nb.push(y); } })); }
    else x.forEach((_, i) => { const y = x.slice(); y[i] = 1 - y[i]; nb.push(y); });
    const max = pg.enc === 'knapsack-bits';
    const f0 = fitness(pg.enc, inst, x, fn);
    const fs = nb.map((y) => fitness(pg.enc, inst, y, fn));
    near(answers(ex, 'fit')[0], f0, 1e-9, 'F(I1)');
    assert.equal(answers(ex, 'count')[0], nb.length);
    const better = fs.filter((v) => (max ? v > f0 : v < f0)).length;
    assert.equal(answers(ex, 'better')[0], better);
    near(answers(ex, 'best')[0], max ? Math.max(...fs) : Math.min(...fs), 1e-9, 'mejor vecino');
    assert.equal(answers(ex, 'local')[0], better ? 'no' : 'yes');
  }
});

test('promediar el ruido: medias, mejores y pares mal ordenados a partir de la tabla', () => {
  for (const pg of pages('noise', [1, 2, 3])) {
    const ex = PR.exercise('noise', 'average', pg);
    const rows = rowsOf(ex, 'prNoiseTable');
    const f = rows.map((r) => r[0]);
    const evs = rows.map((r) => r.slice(1));
    const mean = evs.map((e) => e.reduce((a, b) => a + b, 0) / e.length);
    answers(ex, 'mean').forEach((v, i) => near(v, mean[i], 1e-9, `media I${i + 1}`));
    const argmin = (v) => v.indexOf(Math.min(...v)) + 1;
    assert.equal(answers(ex, 'bestSingle')[0], argmin(evs.map((e) => e[0])));
    assert.equal(answers(ex, 'bestMean')[0], argmin(mean));
    const disc = (v) => { let d = 0; for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) if (f[i] !== f[j] && Math.sign(f[i] - f[j]) !== Math.sign(v[i] - v[j])) d++; return d; };
    assert.equal(answers(ex, 'discSingle')[0], disc(evs.map((e) => e[0])));
    assert.equal(answers(ex, 'discMean')[0], disc(mean));
  }
});

test('metamodelo: vecino más cercano e inversa del cuadrado de la distancia a partir de las tablas', () => {
  for (const pg of pages('surrogate', [1, 2, 3])) {
    const ex = PR.exercise('surrogate', 'predict', pg);
    const arch = rowsOf(ex, 'prArchive');
    const cands = rowsOf(ex, 'prCandPoints');
    cands.forEach((c, q) => {
      const ds = arch.map((a) => Math.hypot(a[0] - c[0], a[1] - c[1]));
      const k = ds.indexOf(Math.min(...ds));
      let pred;
      if (pg.x.sm === 'nn' || ds[k] === 0) pred = arch[k][2];
      else { const w = ds.map((d) => 1 / (d * d)); pred = w.reduce((s, wi, i) => s + wi * arch[i][2], 0) / w.reduce((a, b) => a + b, 0); }
      if (pg.x.sm === 'nn') assert.equal(answers(ex, 'near')[q], k + 1);
      near(answers(ex, 'pred')[q], pred, 1e-9, `C${q + 1}`);
    });
  }
});

test('dominancia: frentes por eliminación sucesiva y el mejor de la suma ponderada a partir de la tabla', () => {
  for (const pg of pages('multi', [1, 2, 3])) {
    const ex = PR.exercise('multi', 'dominance', pg);
    const raw = rowsOf(ex, 'prObjsTable');
    const o = raw.map((r) => (pg.enc === 'knapsack-bits' ? [-r[0], r[1]] : r));
    const dom = (u, v) => u[0] <= v[0] && u[1] <= v[1] && (u[0] < v[0] || u[1] < v[1]);
    const front = Array(o.length).fill(0);
    for (let k = 1; front.some((f) => !f); k++) {
      const left = o.map((_, i) => i).filter((i) => !front[i]);
      left.filter((i) => !left.some((j) => dom(o[j], o[i]))).forEach((i) => { front[i] = k; });
    }
    assert.deepEqual(answers(ex, 'front'), front);
    const w = givenParams(ex, 'prMultiRule_').w.v;
    const nz = [0, 1].map((d) => { const vs = o.map((x) => x[d]); const lo = Math.min(...vs); const hi = Math.max(...vs); return vs.map((x) => (hi > lo ? (x - lo) / (hi - lo) : 0)); });
    const s = o.map((_, i) => w * nz[0][i] + (1 - w) * nz[1][i]);
    assert.equal(answers(ex, 'best')[0], s.indexOf(Math.min(...s)) + 1);
  }
});

// ---------- Corrección ----------

test('corrección: tolerancias anunciadas, una casilla mal no afecta a las demás y los errores de formato', () => {
  const ex = PR.exercise('objective', 'transform', { enc: 'function-real', p: { fn: 'himmelblau' }, N: 5, s: 2, ps: 9, x: { tr: 'inv' } });
  const ans = PR.answerOf(ex);
  const resp = JSON.parse(JSON.stringify(ans));
  // p: ±0,001 o el 1 %
  resp.p[0] = ans.p[0] + 0.0009;
  resp.p[1] = ans.p[1] + Math.max(0.001, 0.01 * ans.p[1]) + 0.0005;
  const g = PR.grade(ex, resp);
  assert.equal(g.groups[1].items[0].ok, true);
  assert.equal(g.groups[1].items[1].ok, false);
  assert.equal(g.ok, g.total - 1);
  assert.equal(PR.validate(ex, Object.assign({}, ans, { F: ans.F.map(() => '') })), 'prErrEmpty');
  assert.equal(PR.validate(ex, Object.assign({}, ans, { F: ans.F.map(() => '1,2') })), 'prErrNumber');
  const rk = PR.exercise('pipeline', 'rank', { enc: 'tsp-perm', p: { n: 6 }, N: 5, s: 2, ps: 9, x: {} });
  const ra = PR.answerOf(rk);
  assert.equal(PR.validate(rk, { rank: ra.rank.map((v, i) => (i ? v : 1.5)) }), 'prErrInteger');
  assert.equal(PR.validate(rk, { rank: ra.rank.map((v, i) => (i ? v : 6)) }), 'prErrRange');
  const ss = PR.exercise('ssi', 'accept', { enc: 'knapsack-bits', p: { n: 8 }, N: 6, s: 2, ps: 9, x: { d: '0.3' } });
  const sa = PR.answerOf(ss);
  assert.equal(PR.validate(ss, Object.assign({}, sa, { acc: sa.acc.map(() => 'maybe') })), 'prErrEmpty');
  const flip = sa.acc.map((v) => (v === 'yes' ? 'no' : 'yes'));
  assert.equal(PR.grade(ss, Object.assign({}, sa, { acc: flip })).ok, sa.dmin.length);
});

test('las tolerancias: centésimas, distancias, u con tres decimales, valores de f y probabilidades', () => {
  assert.equal(PR.TOL.cents(123), 0.005);
  assert.equal(PR.TOL.dist(0.4), 0.005);
  assert.equal(PR.TOL.u(1 / 3), 0.0005);
  assert.equal(PR.TOL.fval(5), 0.01);
  assert.equal(PR.TOL.fval(200), 0.2);
  assert.equal(PR.TOL.prob(0.05), 0.001);
  assert.equal(PR.TOL.prob(0.5), 0.005);
  assert.ok(Math.abs(1 / 3 - 0.333) <= PR.TOL.u(1 / 3));
});

test('«Nuevo ejercicio» cambia la instancia y la población y conserva el resto de la página', () => {
  const pg = { enc: 'assignment-int', p: { n: 6, m: 3 }, N: 7, s: 5, ps: 6, x: { tr: 'rank' } };
  const a = PR.newPage('objective', 'transform', 123, pg);
  const b = PR.newPage('objective', 'transform', 124, pg);
  assert.notEqual(a.s, pg.s);
  assert.notEqual(a.ps, b.ps);
  assert.deepEqual(Object.assign({}, a, { s: pg.s, ps: pg.ps }), pg);
  assert.deepEqual(PR.newPage('objective', 'transform', 123, pg), a);
});

test('formato de las celdas: coma decimal en español, signo menos y cromosomas', () => {
  assert.equal(PR.cellText({ v: -2.5, d: 2 }, 'es'), '−2,50');
  assert.equal(PR.cellText({ v: -2.5, d: 2 }, 'en'), '−2.50');
  assert.equal(PR.cellText({ v: 0.32258, t: 4 }, 'es'), '0,3226');
  assert.equal(PR.cellText({ chrom: [1, 0, 1, 1, 0, 0], sh: { kind: 'bits', length: 6, k: 3 } }, 'es'), '101 100');
  assert.equal(PR.cellText({ chrom: [1, 0, 0, 1], sh: { kind: 'matrix', length: 4, n: 2, m: 2 } }, 'es'), '10 01');
  assert.equal(PR.cellText({ chrom: [-1.5, 2], sh: { kind: 'real', length: 2 } }, 'es'), '(−1,50; 2,00)');
  assert.equal(PR.cellText({ key: 'prInd', params: { i: 3 } }, 'en'), 'I3');
});

test('la decodificación binaria de la prueba coincide con la de la herramienta', () => {
  const bits = [1, 0, 1, 1, 1, 0];
  assert.deepEqual(decodeBits('himmelblau', bits), Fn.decodeBits('himmelblau', bits, 3, 'standard').point);
});
