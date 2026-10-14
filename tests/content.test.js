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

// ---------- Fase 3: evaluación ----------

test('evaluación: narración y pseudocódigo de cada paso de las cuatro páginas', () => {
  const Pipe = require('../js/items/pipeline.js');
  const Obj = require('../js/items/objective.js');
  const Pen = require('../js/items/penalty.js');
  const Cost = require('../js/items/cost.js');
  checkSteps('pipeline', S.ENCODINGS.map((enc) => ({ variant: enc, steps: Pipe.run(enc, S.instance(enc, 1), 6, 2).steps })));
  checkSteps('objective', Obj.TRANSFORMS.flatMap((tr) => Obj.ENCODINGS.map((enc) => ({ variant: tr, steps: Obj.run(enc, S.instance(enc, 1), 6, 2, { transform: tr }).steps }))));
  checkSteps('penalty', Pen.ENCODINGS.flatMap((enc) => Pen.TYPES.map((ty) => ({ variant: `${enc}:${ty}`, steps: Pen.run(enc, S.instance(enc, 1), 6, 2, { type: ty }).steps }))));
  checkSteps('cost', S.ENCODINGS.map((enc) => ({ variant: undefined, steps: Cost.run(enc, S.instance(enc, 1), 6, 2, { G: 3 }).steps })));
});

/** Casos de la capa de evaluación: población uniforme de cada codificación con su aptitud según la herramienta. */
function fitnessCases() {
  const F = require('../js/fitness.js');
  const U = require('../js/items/uniform.js');
  const cases = [];
  for (const enc of S.ENCODINGS) {
    for (let s = 0; s < 15; s++) {
      const p = enc.startsWith('function') ? { fn: s % 2 ? 'rastrigin' : 'himmelblau' } : {};
      const inst = S.instance(enc, s, p);
      const sh = S.shape(enc, inst);
      const box = enc.startsWith('function') ? require('../js/func.js').fnOf(inst.fn) : null;
      U.population(enc, inst, 5, s).pop.forEach((x, i) => {
        const lam = [1, 0.5, 2][i % 3];
        const quad = i % 2 === 1;
        const opts = { lambda: lam, type: quad ? 'quadratic' : 'linear' };
        cases.push({ enc, inst, x, lam, quad, rows: sh.kind === 'matrix' ? S.toRows(x, sh.m) : null, a: box && box.a, b: box && box.b,
          F: F.evaluate(enc, inst, x, opts).fitness, F1: F.evaluate(enc, inst, x).fitness });
      });
    }
  }
  return cases;
}

test('del genotipo a la aptitud (JavaScript y Python): la misma aptitud que la herramienta en las seis codificaciones', () => {
  const cases = fitnessCases();
  for (const l of ['es', 'en']) {
    const code = loadJs(content('pipeline').getCode('javascript', l));
    const fnOf = (c, p) => (c.inst.fn === 'rastrigin' ? code.rastrigin(p[0], p[1]) : code.himmelblau(p[0], p[1]));
    cases.forEach((c, i) => {
      let v;
      if (c.enc === 'knapsack-bits') {
        assert.equal(code.knapsackFitness(c.inst.weights, c.inst.values, c.inst.capacity, c.x, c.lam, c.quad), c.F, `mochila ${i}`);
        v = code.knapsackFitness(c.inst.weights, c.inst.values, c.inst.capacity, c.x);
      } else if (c.enc === 'assignment-int') v = code.assignmentMakespan(c.inst.p, c.x);
      else if (c.enc === 'assignment-matrix') {
        assert.equal(code.matrixFitness(c.inst.p, c.rows, c.lam, c.quad), c.F, `matriz ${i}`);
        v = code.matrixFitness(c.inst.p, c.rows);
      } else if (c.enc === 'tsp-perm') v = code.tourLength(c.inst.coords, c.x);
      else if (c.enc === 'function-real') v = fnOf(c, c.x);
      else v = fnOf(c, code.decodeBits(c.x, c.inst.k, c.a, c.b));
      assert.equal(v, c.F1, `${c.enc} ${i}`);
    });
    assert.deepEqual(code.evaluatePopulation([[3, 2], [0, 0]], (p) => code.himmelblau(...p)), { values: [0, 170], evaluations: 2 });
    if (!hasPython()) continue;
    const { res, ex } = runPython('pipeline', 'fitness_evaluation.py', l, `
out = []
for c in cases:
    inst = c["inst"]; x = c["x"]
    fn = rastrigin if inst.get("fn") == "rastrigin" else himmelblau
    e = c["enc"]
    if e == "knapsack-bits":
        out.append([knapsack_fitness(inst["weights"], inst["values"], inst["capacity"], x, c["lam"], c["quad"]), knapsack_fitness(inst["weights"], inst["values"], inst["capacity"], x)])
    elif e == "assignment-int": out.append([None, assignment_makespan(inst["p"], x)])
    elif e == "assignment-matrix": out.append([matrix_fitness(inst["p"], c["rows"], c["lam"], c["quad"]), matrix_fitness(inst["p"], c["rows"])])
    elif e == "tsp-perm": out.append([None, tour_length(inst["coords"], x)])
    elif e == "function-real": out.append([None, fn(*x)])
    else: out.append([None, fn(*decode_bits(x, inst["k"], c["a"], c["b"]))])
print(json.dumps(out))
`, cases);
    res.forEach(([f, f1], i) => {
      if (f != null) assert.ok(Math.abs(f - cases[i].F) < 1e-9, `${l}: caso ${i}`);
      assert.ok(Math.abs(f1 - cases[i].F1) < 1e-9 * Math.max(1, Math.abs(cases[i].F1)), `${l}: caso ${i} (${cases[i].enc})`);
    });
    assert.deepEqual(ex.slice(0, 5), ['11', '5', '12.0', '[5.0, -5.0]', '([0, 170], 2)']);
  }
});

test('objetivo frente a aptitud (JavaScript y Python): mismas aptitudes y probabilidades que la herramienta', () => {
  const Obj = require('../js/items/objective.js');
  const cases = [];
  for (const enc of Obj.ENCODINGS) {
    for (let s = 0; s < 20; s++) {
      const r = Obj.run(enc, S.instance(enc, s), 4 + (s % 17), s, {});
      cases.push({ f: r.f, T: Obj.TRANSFORMS.map((k) => [r.table[k].F, r.table[k].p]) });
    }
  }
  for (const l of ['es', 'en']) {
    const code = loadJs(content('objective').getCode('javascript', l));
    cases.forEach((c, i) => {
      const got = [code.negative(c.f), code.cMinusF(c.f), code.inverse(c.f), code.rankFitness(c.f)];
      got.forEach((F, k) => {
        assert.deepEqual(F, c.T[k][0], `caso ${i}, ${Obj.TRANSFORMS[k]}`);
        let p = null;
        try { p = code.rouletteProbabilities(F); } catch (e) { p = null; }
        assert.deepEqual(p, c.T[k][1], `caso ${i}, ruleta ${Obj.TRANSFORMS[k]}`);
      });
    });
    if (!hasPython()) continue;
    const { res, ex } = runPython('objective', 'cost_to_fitness.py', l, `
def safe(F):
    try: return roulette_probabilities(F)
    except ValueError: return None
out = []
for c in cases:
    Fs = [negative(c["f"]), c_minus_f(c["f"]), inverse(c["f"]), rank_fitness(c["f"])]
    out.append([[F, safe(F)] for F in Fs])
print(json.dumps(out))
`, cases);
    res.forEach((r, i) => r.forEach(([F, p], k) => {
      F.forEach((v, j) => assert.ok(Math.abs(v - cases[i].T[k][0][j]) < 1e-12, `${l}: caso ${i}`));
      if (cases[i].T[k][1] == null) assert.equal(p, null);
      else p.forEach((v, j) => assert.ok(Math.abs(v - cases[i].T[k][1][j]) < 1e-12));
    }));
    assert.deepEqual(ex.slice(0, 4), ['[0, 3, 1, 3]', '[0.2, 0.5, 0.25, 0.5]', '[1.0, 3.5, 2.0, 3.5]', '[0.1, 0.35, 0.2, 0.35]']);
  }
});

test('penalización (JavaScript y Python): misma aptitud penalizada y mismo λ* que la herramienta', () => {
  const Pen = require('../js/items/penalty.js');
  const cases = [];
  for (const enc of Pen.ENCODINGS) {
    for (const type of Pen.TYPES) {
      for (let s = 0; s < 20; s++) {
        const inst = S.instance(enc, s);
        const lambda = Pen.normLambda(enc, (s % 7) * 0.7);
        const r = Pen.run(enc, inst, 10, s, { type, lambda });
        const m = enc === 'assignment-matrix' ? inst.p[0].length : 0;
        cases.push({ enc, type, lambda, inst, pop: m ? r.pop.map((x) => S.toRows(x, m)) : r.pop, fits: r.fits,
          z: r.evals.map((e) => e.objective), v: r.evals.map((e) => e.violation), star: r.lambdaStar ? r.lambdaStar.lambda : null });
      }
    }
  }
  for (const l of ['es', 'en']) {
    const code = loadJs(content('penalty').getCode('javascript', l));
    cases.forEach((c, i) => {
      const q = c.type === 'quadratic';
      c.pop.forEach((x, k) => {
        const f = c.enc === 'knapsack-bits' ? code.knapsackPenalised(c.inst.weights, c.inst.values, c.inst.capacity, x, c.lambda, q)
          : code.matrixPenalised(c.inst.p, x, c.lambda, q);
        assert.equal(f, c.fits[k], `caso ${i}.${k}`);
      });
      assert.equal(code.criticalLambda(c.z, c.v, c.enc === 'knapsack-bits', q), c.star, `λ* ${i}`);
    });
    if (!hasPython()) continue;
    const { res, ex } = runPython('penalty', 'penalty_fitness.py', l, `
out = []
for c in cases:
    q = c["type"] == "quadratic"; inst = c["inst"]
    if c["enc"] == "knapsack-bits": fs = [knapsack_penalised(inst["weights"], inst["values"], inst["capacity"], x, c["lambda"], q) for x in c["pop"]]
    else: fs = [matrix_penalised(inst["p"], x, c["lambda"], q) for x in c["pop"]]
    out.append([fs, critical_lambda(c["z"], c["v"], c["enc"] == "knapsack-bits", q)])
print(json.dumps(out))
`, cases);
    res.forEach(([fs, star], i) => {
      fs.forEach((f, k) => assert.ok(Math.abs(f - cases[i].fits[k]) < 1e-9, `${l}: caso ${i}.${k}`));
      if (cases[i].star == null) assert.equal(star, null);
      else assert.ok(Math.abs(star - cases[i].star) < 1e-12);
    });
    assert.deepEqual(ex.slice(0, 4), ['11', '11.0', '7', '1.25']);
  }
});

test('coste de evaluar (JavaScript y Python): mismo recuento de evaluaciones con y sin caché que la herramienta', () => {
  const Cost = require('../js/items/cost.js');
  const cases = [];
  for (const enc of S.ENCODINGS) {
    for (let s = 0; s < 6; s++) {
      const r = Cost.run(enc, S.instance(enc, s), 10, s, { G: 6 });
      cases.push({ gens: r.gens.map((g) => g.pop), rows: r.gens.map((g) => [g.newEvals, g.cumNo, g.cumCache]) });
    }
  }
  for (const l of ['es', 'en']) {
    const code = loadJs(content('cost').getCode('javascript', l));
    cases.forEach((c, i) => {
      assert.deepEqual(code.evaluationsPerGeneration(c.gens), c.rows, `caso ${i}`);
      const f = new code.CachedFitness((x) => x.length);
      c.gens.flat().forEach((x) => f.evaluate(x));
      assert.equal(f.evaluations, c.rows[c.rows.length - 1][2]);
      assert.equal(f.evaluations + f.hits, c.rows[c.rows.length - 1][1]);
    });
    if (!hasPython()) continue;
    const { res, ex } = runPython('cost', 'cached_fitness.py', l, `
out = []
for c in cases:
    f = CachedFitness(len)
    for g in c["gens"]:
        for x in g: f(x)
    out.append([[list(r) for r in evaluations_per_generation(c["gens"])], f.evaluations, f.hits])
print(json.dumps(out))
`, cases);
    res.forEach(([rows, ev, hits], i) => {
      assert.deepEqual(rows, cases[i].rows, `${l}: caso ${i}`);
      assert.equal(ev + hits, cases[i].rows[cases[i].rows.length - 1][1]);
    });
    assert.deepEqual(ex.slice(0, 2), ['2 2', '[(2, 2, 2), (1, 4, 3), (0, 6, 3)]']);
  }
});
