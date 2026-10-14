'use strict';
// Contenido docente de cada elemento disponible: textos en los dos idiomas, narración de todos los pasos,
// líneas del pseudocódigo que existen, referencias con las básicas del curso y código descargable que da
// exactamente lo mismo que la herramienta con los mismos números aleatorios (JavaScript y, si hay Python 3, Python).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const registry = require('../js/registry.js');
const S = require('../js/space.js');
const C = require('../js/content/common.js');

const ready = registry.allItems().filter((it) => it.ready);
const content = (id) => require(path.join('..', 'js', 'content', `${id}.js`));
const params = (s) => (s.match(/\{(\w+)\}/g) || []).sort().join(',');

function hasPython() {
  try { execFileSync('python3', ['--version'], { stdio: 'ignore' }); return true; } catch (e) { return false; }
}

test('cada elemento disponible tiene su contenido completo en ES y EN', () => {
  for (const it of ready) {
    const c = content(it.id);
    for (const l of ['es', 'en']) {
      assert.ok(c.explanation[l].length >= 3, `${it.id}: explicación ${l}`);
      assert.equal(c.stages[l].length, 5, `${it.id}: etapas ${l}`);
      assert.ok(c.getCode('python', l).length > 200 && c.getCode('javascript', l).length > 200);
      assert.doesNotMatch(c.getCode('python', l), /\{\{\w+\}\}/, 'plantilla sin rellenar');
      assert.doesNotMatch(c.getCode('javascript', l), /\{\{\w+\}\}/, 'plantilla sin rellenar');
    }
    assert.deepEqual(Object.keys(c.narration.es).sort(), Object.keys(c.narration.en).sort(), `${it.id}: claves de narración`);
    for (const k of Object.keys(c.narration.es)) assert.equal(params(c.narration.es[k]), params(c.narration.en[k]), `${it.id}.${k}`);
  }
});

test('las referencias básicas del curso van justo después de la fuente original (o primero)', () => {
  for (const it of ready) {
    const refs = content(it.id).references;
    const ids = refs.map((r) => r.id);
    const core = C.CORE.map((k) => C.refs[k].id);
    core.forEach((id) => assert.ok(ids.includes(id), `${it.id}: falta ${id}`));
    const firstCore = Math.min(...core.map((id) => ids.indexOf(id)));
    const originals = refs.filter((r) => r.original).map((r) => ids.indexOf(r.id));
    assert.ok(firstCore <= 1 || originals.some((o) => o < firstCore), `${it.id}: orden de las referencias`);
    refs.forEach((r) => { assert.ok(r.note && r.note.es && r.note.en, `${it.id}: nota de ${r.id}`); });
  }
});

test('inicialización uniforme: cada paso tiene narración y resalta líneas que existen en su pseudocódigo', () => {
  const U = require('../js/items/uniform.js');
  const c = content('uniform');
  const N = c.narration.es;
  for (const enc of S.ENCODINGS) {
    const inst = S.instance(enc, 3);
    const r = U.run(enc, inst, 5, 4);
    const ids = new Set(c.pseudocodeFor('es', r.shape.kind).map((l) => l.id));
    for (const st of r.steps) {
      const lines = c.stepLines[st.type];
      assert.ok(lines && lines.length, `${enc}: sin líneas para ${st.type}`);
      lines.forEach((id) => assert.ok(ids.has(id), `${enc}: ${st.type} → ${id}`));
      const keys = Object.keys(N).filter((k) => k === st.type || k.startsWith(`${st.type}_`));
      assert.ok(keys.length, `${enc}: sin narración para ${st.type}`);
    }
  }
});

test('siembra heurística: cada paso tiene narración y resalta líneas que existen en su pseudocódigo', () => {
  const Sd = require('../js/items/seeded.js');
  const c = content('seeded');
  for (const enc of Sd.ENCODINGS) {
    const r = Sd.run(enc, S.instance(enc, 3), 6, 4, { K: 2 });
    const ids = new Set(c.pseudocodeFor('es', enc).map((l) => l.id));
    for (const st of r.steps) {
      (c.stepLines[st.type] || []).forEach((id) => assert.ok(ids.has(id), `${enc}: ${st.type} → ${id}`));
      assert.ok((c.stepLines[st.type] || []).length, `${enc}: sin líneas para ${st.type}`);
      assert.ok(Object.keys(c.narration.es).some((k) => k === st.type || k.startsWith(`${st.type}_`)), `${enc}: sin narración para ${st.type}`);
    }
  }
});

/** Carga el código JavaScript descargable como un módulo. */
function loadJs(code) {
  const m = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('module', 'require', code)(m, require);
  return m.exports;
}

test('código descargable (JavaScript): con los mismos números aleatorios, la misma población que la herramienta', () => {
  const U = require('../js/items/uniform.js');
  const code = loadJs(content('uniform').getCode('javascript', 'es'));
  for (const enc of S.ENCODINGS) {
    for (let s = 0; s < 40; s++) {
      const inst = S.instance(enc, s);
      const g = U.population(enc, inst, 6, s);
      const us = g.draws.flat().map((d) => d.u);
      const rand = () => us.shift();
      const sh = g.shape;
      const make = () => {
        if (sh.kind === 'perm') return code.randomPermutation(sh.length, rand);
        if (sh.kind === 'int') return code.randomInts(sh.length, sh.m, rand);
        if (sh.kind === 'real') return code.randomReals(2, sh.a, sh.b, rand);
        return code.randomBits(sh.length, 0.5, rand);
      };
      assert.deepEqual(code.initialPopulation(6, make), g.pop, `${enc}, semilla ${s}`);
    }
  }
});

test('código descargable (Python): la misma población que la herramienta', { skip: !hasPython() && 'sin Python 3' }, () => {
  const U = require('../js/items/uniform.js');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ieg-'));
  for (const l of ['es', 'en']) {
    fs.writeFileSync(path.join(dir, 'uniform_initialisation.py'), content('uniform').getCode('python', l));
    const cases = [];
    for (const enc of S.ENCODINGS) {
      for (let s = 0; s < 25; s++) {
        const inst = S.instance(enc, s);
        const g = U.population(enc, inst, 5, s);
        cases.push({ kind: g.shape.kind, sh: g.shape, us: g.draws.flat().map((d) => d.u), pop: g.pop });
      }
    }
    fs.writeFileSync(path.join(dir, 'cases.json'), JSON.stringify(cases));
    const script = `
import json, sys
sys.path.insert(0, ${JSON.stringify(dir)})
from uniform_initialisation import *
cases = json.load(open(${JSON.stringify(path.join(dir, 'cases.json'))}))
out = []
for c in cases:
    us = iter(c["us"]); rand = lambda: next(us); sh = c["sh"]
    if c["kind"] == "perm": make = lambda: random_permutation(sh["length"], rand)
    elif c["kind"] == "int": make = lambda: random_ints(sh["length"], sh["m"], rand)
    elif c["kind"] == "real": make = lambda: random_reals(2, sh["a"], sh["b"], rand)
    else: make = lambda: random_bits(sh["length"], 0.5, rand)
    out.append(initial_population(len(c["pop"]), make))
print(json.dumps(out))
`;
    const res = JSON.parse(execFileSync('python3', ['-c', script], { encoding: 'utf8' }));
    res.forEach((pop, i) => assert.deepEqual(pop, cases[i].pop, `${l}: caso ${i} (${cases[i].kind})`));
    // y el ejemplo del propio fichero da lo que dicen sus comentarios
    const ex = execFileSync('python3', [path.join(dir, 'uniform_initialisation.py')], { encoding: 'utf8' }).split(/\r?\n/);
    assert.equal(ex[0], '[1, 0, 1, 0]');
    assert.equal(ex[1], '[1, 3, 2]');
    assert.equal(ex[2], '[2, 1, 3]');
  }
});

test('el ejemplo del código JavaScript da lo que dicen sus comentarios', () => {
  const code = loadJs(content('uniform').getCode('javascript', 'en'));
  const us = [0.37, 0.81, 0.05, 0.62, 0.29, 0.94, 0.41, 0.73, 0.12, 0.58];
  const rand = () => us.shift();
  assert.deepEqual(code.randomBits(4, 0.5, rand), [1, 0, 1, 0]);
  assert.deepEqual(code.randomInts(3, 3, rand), [1, 3, 2]);
  assert.deepEqual(code.randomPermutation(3, rand), [2, 1, 3]);
});

test('siembra (JavaScript y Python): mismas heurísticas y copias esperadas que la herramienta', () => {
  const Sd = require('../js/items/seeded.js');
  for (const l of ['es', 'en']) {
    const code = loadJs(content('seeded').getCode('javascript', l));
    const cases = [];
    for (let s = 0; s < 40; s++) {
      const ks = S.instance('knapsack-bits', s);
      const as = S.instance('assignment-int', s);
      const ts = S.instance('tsp-perm', s, { n: 9 });
      assert.deepEqual(code.greedyKnapsack(ks.weights, ks.values, ks.capacity), Sd.greedy('knapsack-bits', ks).x);
      assert.deepEqual(code.greedyAssignment(as.p), Sd.greedy('assignment-int', as).x);
      assert.deepEqual(code.nearestNeighbour(ts.coords), Sd.greedy('tsp-perm', ts).x);
      cases.push({ ks, as, ts, out: [Sd.greedy('knapsack-bits', ks).x, Sd.greedy('assignment-int', as).x, Sd.greedy('tsp-perm', ts).x] });
    }
    assert.deepEqual(code.expectedCopies(2, 12, 8), Sd.takeover(2, 12, 8).map((c) => c.k));
    if (!hasPython()) continue;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ieg-'));
    fs.writeFileSync(path.join(dir, 'seeded_population.py'), content('seeded').getCode('python', l));
    fs.writeFileSync(path.join(dir, 'cases.json'), JSON.stringify(cases));
    const script = `
import json, sys
sys.path.insert(0, ${JSON.stringify(dir)})
from seeded_population import *
out = []
for c in json.load(open(${JSON.stringify(path.join(dir, 'cases.json'))})):
    k = c["ks"]
    out.append([greedy_knapsack(k["weights"], k["values"], k["capacity"]), greedy_assignment(c["as"]["p"]), nearest_neighbour(c["ts"]["coords"])])
print(json.dumps([out, expected_copies(2, 12, 8)]))
`;
    const [res, take] = JSON.parse(execFileSync('python3', ['-c', script], { encoding: 'utf8' }));
    res.forEach((r, i) => assert.deepEqual(r, cases[i].out, `${l}: caso ${i}`));
    take.forEach((k, i) => assert.ok(Math.abs(k - Sd.takeover(2, 12, 8)[i].k) < 1e-12));
    const ex = execFileSync('python3', [path.join(dir, 'seeded_population.py')], { encoding: 'utf8' }).split(/\r?\n/);
    assert.deepEqual(ex.slice(0, 3), ['[0, 0, 1, 1]', '[1, 2, 2]', '[1, 1.9, 3.44, 5.7, 8.15, 9.66, 9.99]']);
  }
});

// ---------- Fase 2: cuasialeatoria, inhibición secuencial e inicialización factible ----------

/** Cada paso de cada variante tiene narración y resalta líneas que existen en el pseudocódigo de esa variante. */
function checkSteps(id, cases) {
  const c = content(id);
  for (const { variant, steps } of cases) {
    const ids = new Set(c.pseudocodeFor('es', variant).map((l) => l.id));
    assert.deepEqual(c.pseudocodeFor('en', variant).map((l) => l.id), c.pseudocodeFor('es', variant).map((l) => l.id));
    for (const st of steps) {
      const lines = c.stepLines[st.type] || [];
      assert.ok(lines.length, `${id}/${variant}: sin líneas para ${st.type}`);
      lines.forEach((l) => assert.ok(ids.has(l), `${id}/${variant}: ${st.type} → ${l}`));
      assert.ok(Object.keys(c.narration.es).some((k) => k === st.type || k.startsWith(`${st.type}_`)), `${id}: sin narración para ${st.type}`);
    }
  }
}

test('cuasialeatoria, inhibición secuencial y factible: narración y pseudocódigo de cada paso', () => {
  const Q = require('../js/items/quasi.js');
  const X = require('../js/items/ssi.js');
  const F = require('../js/items/feasible.js');
  checkSteps('quasi', Q.METHODS.map((m) => ({ variant: m, steps: Q.run('function-real', S.instance('function-real', 1), 6, 2, { method: m }).steps })));
  checkSteps('ssi', S.ENCODINGS.map((enc) => ({ variant: enc, steps: X.run(enc, S.instance(enc, 1), 8, 2, {}).steps })));
  checkSteps('feasible', F.ENCODINGS.map((enc) => ({ variant: enc, steps: F.run(enc, S.instance(enc, 1), 6, 2).steps })));
});

/** Ejecuta un script de Python que importa el fichero descargable `file` (escrito en un directorio temporal). */
function runPython(id, file, lang, body, data) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ieg-'));
  fs.writeFileSync(path.join(dir, file), content(id).getCode('python', lang));
  fs.writeFileSync(path.join(dir, 'cases.json'), JSON.stringify(data));
  const mod = file.replace(/\.py$/, '');
  const script = `import json, sys\nsys.path.insert(0, ${JSON.stringify(dir)})\nfrom ${mod} import *\ncases = json.load(open(${JSON.stringify(path.join(dir, 'cases.json'))}))\n${body}`;
  const out = execFileSync('python3', ['-c', script], { encoding: 'utf8' });
  const ex = execFileSync('python3', [path.join(dir, file)], { encoding: 'utf8' }).split(/\r?\n/);
  return { res: JSON.parse(out), ex };
}

test('cuasialeatoria (JavaScript y Python): Halton, Sobol e hipercubo latino dan la misma población que la herramienta', () => {
  const Q = require('../js/items/quasi.js');
  const cases = [];
  for (const fn of ['himmelblau', 'rastrigin']) {
    const inst = S.instance('function-real', 1, { fn });
    for (let N = 4; N <= 20; N += 4) {
      for (let s = 0; s < 6; s++) {
        const g = Q.population('function-real', inst, N, s, 'lhs');
        const us = g.permDraws[0].map((d) => d.u).concat(g.permDraws[1].map((d) => d.u), g.draws.flatMap((row) => row.map((c) => c.v)));
        cases.push({ N, a: g.shape.a, b: g.shape.b, us, lhs: g.pop,
          halton: Q.population('function-real', inst, N, s, 'halton').pop, sobol: Q.population('function-real', inst, N, s, 'sobol').pop });
      }
    }
  }
  for (const l of ['es', 'en']) {
    const code = loadJs(content('quasi').getCode('javascript', l));
    cases.forEach((c, i) => {
      assert.deepEqual(code.haltonPopulation(c.N, c.a, c.b), c.halton, `halton ${i}`);
      assert.deepEqual(code.sobolPopulation(c.N, c.a, c.b), c.sobol, `sobol ${i}`);
      const us = c.us.slice();
      assert.deepEqual(code.latinHypercube(c.N, c.a, c.b, () => us.shift()), c.lhs, `lhs ${i}`);
    });
    if (!hasPython()) continue;
    const { res, ex } = runPython('quasi', 'quasi_random_initialisation.py', l, `
out = []
for c in cases:
    us = iter(c["us"]); rand = lambda: next(us)
    out.append([halton_population(c["N"], c["a"], c["b"]), sobol_population(c["N"], c["a"], c["b"]), latin_hypercube(c["N"], c["a"], c["b"], rand)])
print(json.dumps(out))
`, cases);
    res.forEach((r, i) => { assert.deepEqual(r, [cases[i].halton, cases[i].sobol, cases[i].lhs], `${l}: caso ${i}`); });
    assert.deepEqual(ex.slice(0, 3), ['[0.5, 0.25, 0.75, 0.125]', '[0.5, 0.75, 0.25, 0.625]', '[[0.0, -1.67], [-2.5, 1.67], [2.5, -3.89]]']);
  }
});

test('inhibición secuencial (JavaScript y Python): mismos individuos aceptados y mismo número de candidatos', () => {
  const X = require('../js/items/ssi.js');
  const encs = ['knapsack-bits', 'assignment-int', 'tsp-perm', 'function-real'];
  const cases = [];
  for (const enc of encs) {
    for (let s = 0; s < 12; s++) {
      const inst = S.instance(enc, s);
      const delta = [0.2, X.DEFAULT_DELTA[enc], 0.6][s % 3];
      const g = X.population(enc, inst, 8, s, delta);
      const sh = S.shape(enc, inst);
      cases.push({ enc, delta, a: sh.a, b: sh.b, cands: g.candidates.map((c) => c.x), pop: g.pop, total: g.total });
    }
  }
  for (const l of ['es', 'en']) {
    const code = loadJs(content('ssi').getCode('javascript', l));
    cases.forEach((c, i) => {
      const dist = c.enc === 'tsp-perm' ? code.tourDistance : c.enc === 'function-real' ? (p, q) => code.euclideanDistance(p, q, c.a, c.b) : code.hammingDistance;
      const cands = c.cands.slice();
      const r = code.sequentialInhibition(8, () => cands.shift(), dist, c.delta);
      assert.deepEqual(r.population, c.pop, `${c.enc} ${i}`);
      assert.equal(r.candidates, c.total);
    });
    if (!hasPython()) continue;
    const { res, ex } = runPython('ssi', 'sequential_inhibition.py', l, `
out = []
for c in cases:
    it = iter(c["cands"])
    if c["enc"] == "tsp-perm": d = tour_distance
    elif c["enc"] == "function-real": d = lambda p, q, c=c: euclidean_distance(p, q, c["a"], c["b"])
    else: d = hamming_distance
    pop, total = sequential_inhibition(8, lambda: next(it), d, c["delta"])
    out.append([pop, total])
print(json.dumps(out))
`, cases);
    res.forEach((r, i) => assert.deepEqual(r, [cases[i].pop, cases[i].total], `${l}: caso ${i}`));
    assert.equal(ex[0], '[[0, 0, 0, 0], [1, 1, 0, 0], [0, 1, 1, 1]] 4');
  }
});

test('inicialización factible (JavaScript y Python): misma población que la herramienta', () => {
  const F = require('../js/items/feasible.js');
  const cases = [];
  for (let s = 0; s < 25; s++) {
    const ks = S.instance('knapsack-bits', s);
    const gk = F.population('knapsack-bits', ks, 6, s);
    const am = S.instance('assignment-matrix', s);
    const gm = F.population('assignment-matrix', am, 6, s);
    cases.push({
      weights: ks.weights, capacity: ks.capacity, kus: gk.details.flatMap((d) => d.swaps.map((x) => x.u)), kpop: gk.pop,
      n: am.p.length, m: am.p[0].length, mus: gm.details.flatMap((d) => d.rows.map((r) => r.u)), mpop: gm.pop.map((x) => S.toRows(x, am.p[0].length)),
    });
  }
  for (const l of ['es', 'en']) {
    const code = loadJs(content('feasible').getCode('javascript', l));
    cases.forEach((c, i) => {
      const ku = c.kus.slice();
      assert.deepEqual(Array.from({ length: 6 }, () => code.fullKnapsack(c.weights, c.capacity, () => ku.shift())), c.kpop, `mochila ${i}`);
      const mu = c.mus.slice();
      assert.deepEqual(Array.from({ length: 6 }, () => code.onePerRow(c.n, c.m, () => mu.shift())), c.mpop, `matriz ${i}`);
    });
    if (!hasPython()) continue;
    const { res, ex } = runPython('feasible', 'feasible_initialisation.py', l, `
out = []
for c in cases:
    ku = iter(c["kus"]); mu = iter(c["mus"])
    out.append([[full_knapsack(c["weights"], c["capacity"], lambda: next(ku)) for _ in range(6)], [one_per_row(c["n"], c["m"], lambda: next(mu)) for _ in range(6)]])
print(json.dumps(out))
`, cases);
    res.forEach((r, i) => assert.deepEqual(r, [cases[i].kpop, cases[i].mpop], `${l}: caso ${i}`));
    assert.deepEqual(ex.slice(0, 2), ['[0, 0, 1, 1]', '[[0, 1, 0], [1, 0, 0]]']);
  }
});
