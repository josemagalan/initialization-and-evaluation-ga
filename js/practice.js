/*
 * Modo «Practicar»: ejercicios con respuesta única sobre la página de una estrategia o un aspecto, y su
 * corrección elemento a elemento. Lógica pura, sin DOM: la usan la página (js/practice-ui.js), los tests y los
 * bancos de Moodle (js/moodle.js). Los textos están en js/practice-text.js.
 *
 * Una «página» es el estado de una página de la herramienta tal como lo guarda la URL:
 *   { enc, p: { n, m, k, fn }, N, s, ps, x: { parámetros propios del elemento, como en la URL } }
 *   x: K (siembra), m (método cuasialeatorio), d (δ), tr (transformación), pt y l (penalización), G (generaciones),
 *      sg y R (ruido), sm (metamodelo), w (peso). Se normalizan igual que en la página.
 *
 * exercise(item, type, page) → {
 *   item, type,
 *   page,      la página que usa el ejercicio (a veces con un ajuste que pide el tipo; volver a llamar a exercise
 *              con ella da el mismo ejercicio)
 *   givens,    [{ key, params } | { key?, params?, table: { head, rows } }]  datos que se dan
 *   groups,    [{ id, key, params, kind, items: [{ label, answer }], tol?, min?, max? }]
 *   view,      { type }  paso de la traza que enseña la vista mientras se practica (sin la respuesta)
 *   solution,  { types }  paso al que lleva «Ver la solución»: el primero de esos tipos
 * }
 * Los parámetros de los textos y las celdas de las tablas son «celdas» (cellText): un entero, un texto, { v, d }
 * (d decimales fijos), { v, t } (hasta t decimales), { chrom, sh } (un cromosoma) o { key, params } (otro texto).
 * Tipos de respuesta (kind): 'bit' (0/1), 'yesno' ('yes'/'no'), 'int' (con min y max si hace falta) y 'num'
 * (con tolerancia tol(valor correcto)).
 *
 * validate(ex, response) → clave de error o null;  grade(ex, response) → corrección elemento a elemento.
 * response = { [id del grupo]: [valores] }.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const G = isNode ? null : root.GAX;
  const R = isNode ? require('./rng.js') : G.rng;
  const S = isNode ? require('./space.js') : G.space;
  const F = isNode ? require('./fitness.js') : G.fitness;
  const Fn = isNode ? require('./func.js') : G.func;
  const A = isNode ? require('./assignment.js') : G.assignment;
  const TSP = isNode ? require('./problems/tsp-perm.js') : G.problems['tsp-perm'];
  const TXT = isNode ? require('./practice-text.js') : G.practiceText;
  const ITEM_IDS = ['uniform', 'seeded', 'quasi', 'ssi', 'feasible', 'pipeline', 'objective', 'penalty', 'cost', 'landscape', 'noise', 'surrogate', 'multi'];
  const IT = {};
  ITEM_IDS.forEach((id) => { IT[id] = isNode ? require(`./items/${id}.js`) : G.items[id]; });

  const TYPES = {
    uniform: ['generate', 'diversity'],
    seeded: ['greedy', 'takeover'],
    quasi: ['quasi'],
    ssi: ['accept'],
    feasible: ['build'],
    pipeline: ['evaluate', 'rank'],
    objective: ['transform'],
    penalty: ['penalize'],
    cost: ['cache'],
    landscape: ['neighbours'],
    noise: ['average'],
    surrogate: ['predict'],
    multi: ['dominance'],
  };
  const typesFor = (item) => (TYPES[item] || []).slice();

  // ---------- Tolerancias ----------
  const TOL = {
    exact: () => 1e-6,                                      // enteros y décimas exactas
    cents: () => 0.005,                                     // centésimas
    dist: () => 0.005,                                      // distancias normalizadas, con dos decimales
    coord: () => 0.0105,                                    // coordenadas que pueden moverse una centésima
    u: () => 0.0005,                                        // números en [0, 1) con tres decimales
    fval: (v) => Math.max(0.01, 0.001 * Math.abs(v)),       // valores de la función: ±0,01 o el 0,1 %
    prob: (v) => Math.max(0.001, 0.01 * Math.abs(v)),       // probabilidades: ±0,001 o el 1 %
    rel: (v) => Math.max(0.01, 0.01 * Math.abs(v)),         // ±0,01 o el 1 %
    small: (v) => Math.max(0.0001, 0.01 * Math.abs(v)),     // números pequeños (1/(1 + f)): el 1 %
    copies: (v) => Math.max(0.05, 0.005 * Math.abs(v)),     // copias esperadas
  };

  // ---------- Utilidades ----------
  const round = (v, d) => { const k = Math.pow(10, d); return Math.round(v * k) / k + 0; };
  const lbl = (key, params) => ({ key, params: params || {} });
  const g = (key, params) => ({ key, params: params || {} });
  const seq = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  const indLabel = (i) => lbl('prInd', { i: i + 1 });
  const num = (v, d) => ({ v, d });
  const upTo = (v, t) => ({ v, t });
  const chrom = (x, sh) => ({ chrom: x, sh });
  const isFn = (enc) => enc.startsWith('function');

  function group(id, key, kind, answers, labelOf, extra) {
    return Object.assign({ id, key, params: {}, kind, items: answers.map((a, i) => ({ label: labelOf(i), answer: a })) }, extra || {});
  }
  const one = (id, key, kind, answer, extra, params) => Object.assign(group(id, key, kind, [answer], () => lbl(key, params), extra), { params: params || {} });

  /** Opciones de la ejecución a partir de los parámetros propios de la URL. */
  function runOpts(item, x) {
    x = x || {};
    switch (item) {
      case 'seeded': return { K: Number(x.K) || 1 };
      case 'quasi': return { method: x.m };
      case 'ssi': return { delta: x.d };
      case 'objective': return { transform: x.tr };
      case 'penalty': return { type: x.pt, lambda: x.l };
      case 'cost': return { G: x.G };
      case 'noise': return { sigma: x.sg, R: x.R };
      case 'surrogate': return { method: x.sm };
      case 'multi': return { w: x.w };
      default: return {};
    }
  }

  /** Instancia y traza de la página (las últimas se guardan: la práctica y Moodle las piden varias veces). */
  const memo = new Map();
  function model(item, page) {
    const key = `${item}|${JSON.stringify([page.enc, page.p, page.N, page.s, page.ps, page.x || {}])}`;
    if (memo.has(key)) return memo.get(key);
    const inst = S.instance(page.enc, page.s, page.p);
    const r = IT[item].run(page.enc, inst, page.N, page.ps, runOpts(item, page.x));
    const out = { inst, r, sh: S.shape(page.enc, inst) };
    if (memo.size >= 8) memo.delete(memo.keys().next().value);
    memo.set(key, out);
    return out;
  }

  /** Decimales con que se enseña el objetivo o la aptitud de cada codificación. */
  const objDec = (enc) => (enc === 'tsp-perm' ? 1 : isFn(enc) ? 2 : 0);
  const objTol = (enc) => (isFn(enc) ? 'fval' : 'exact');

  // ---------- Datos de la instancia ----------

  function knapsackTable(inst) {
    const n = inst.weights.length;
    return {
      key: 'prKnapTable', params: { W: inst.capacity },
      table: { head: [{ key: 'prItemHead' }].concat(seq(n, (i) => i + 1)), rows: [['w'].concat(inst.weights), ['v'].concat(inst.values)] },
    };
  }
  function timesTable(inst) {
    const { n, m } = A.sizes(inst);
    return {
      key: 'prTimesTable',
      table: { head: [''].concat(seq(n, (i) => ({ key: 'prTaskShort', params: { i: i + 1 } }))), rows: seq(m, (j) => [{ key: 'prMachineShort', params: { j: j + 1 } }].concat(seq(n, (i) => inst.p[i][j]))) },
    };
  }
  function distTable(inst) {
    const n = inst.coords.length;
    const cities = seq(n, (i) => i + 1);
    return {
      key: 'prDistTable',
      table: { head: [''].concat(cities), rows: cities.map((a) => [a].concat(cities.map((b) => (a === b ? '—' : num(TSP.distTenths(inst, a, b) / 10, 1))))) },
    };
  }
  function fnGiven(inst) {
    const Fd = Fn.fnOf(inst.fn);
    return g(`prFn_${Fd.id}`, { a: upTo(Fd.a, 2), b: upTo(Fd.b, 2) });
  }
  function bitsDecodeGiven(inst) {
    const Fd = Fn.fnOf(inst.fn);
    return g('prBitsDecode', { k: inst.k, a: upTo(Fd.a, 2), b: upTo(Fd.b, 2), L: Fn.levels(inst.k), delta: upTo(Fn.delta(inst.fn, inst.k), 4) });
  }
  /** Lo que hace falta saber de la instancia para evaluar. */
  function instanceGivens(enc, inst) {
    if (enc === 'knapsack-bits') return [knapsackTable(inst)];
    if (enc.startsWith('assignment')) return [timesTable(inst)];
    if (enc === 'tsp-perm') return [distTable(inst)];
    if (enc === 'function-bits') return [fnGiven(inst), bitsDecodeGiven(inst)];
    return [fnGiven(inst)];
  }
  /** Regla de la aptitud (penalización lineal con λ = 1 en la mochila y la matriz). */
  function fitnessRule(enc) {
    return g(`prFitRule_${enc}`);
  }

  /** Tabla de individuos: una fila por individuo con su cromosoma y, si se pide, más columnas. */
  function popTable(pop, sh, idx, extraHead, extraCells, labelOf) {
    const lab = labelOf || indLabel;
    return {
      head: [''].concat([{ key: 'prChromHead' }], extraHead || []),
      rows: idx.map((i) => [lab(i), chrom(pop[i], sh)].concat(extraCells ? extraCells(i) : [])),
    };
  }

  // ======================================================================
  // Inicialización
  // ======================================================================

  function uniform(type, page) {
    const { inst, r, sh } = model('uniform', page);
    const enc = page.enc;
    if (type === 'generate') {
      const K = 2;
      const dec = r.dec;
      const groups = [];
      const givens = [g(`prGenRule_${sh.kind === 'bits' && sh.k ? 'fbits' : sh.kind}`, ruleParams(enc, inst, sh))];
      if (sh.kind === 'perm') {
        const n = sh.length;
        givens.push({ key: 'prDrawsPerm', table: { head: [''].concat(seq(n - 1, (q) => ({ key: 'prKHead', params: { k: n - q } }))), rows: seq(K, (i) => [indLabel(i)].concat(r.draws[i].map((d) => num(d.u, dec)))) } });
        groups.push(group('j1', 'prJ', 'int', r.draws[0].map((d) => d.j), (q) => lbl('prKLab', { k: n - q }), { min: 1, max: n, params: { i: 1 } }));
        seq(K, (i) => groups.push(group(`x${i + 1}`, 'prChromOf', 'int', r.pop[i], (q) => lbl('prPos', { i: q + 1 }), { min: 1, max: n, params: { i: i + 1 } })));
      } else {
        const L = sh.length;
        givens.push({ key: 'prDraws', table: { head: [''].concat(seq(L, (q) => geneHead(sh, q))), rows: seq(K, (i) => [indLabel(i)].concat(r.draws[i].map((d) => num(d.u, dec)))) } });
        const kind = sh.kind === 'int' ? 'int' : sh.kind === 'real' ? 'num' : 'bit';
        const extra = sh.kind === 'int' ? { min: 1, max: sh.m } : sh.kind === 'real' ? { tol: 'cents' } : {};
        seq(K, (i) => groups.push(group(`x${i + 1}`, 'prChromOf', kind, r.pop[i], (q) => geneHead(sh, q), Object.assign({ params: { i: i + 1 } }, extra))));
      }
      return { page, givens, groups, view: { type: 'rule' }, solution: { types: ['gene', 'swap'] } };
    }
    // Diversidad de los cuatro primeros individuos
    const K = Math.min(4, page.N);
    const idx = seq(K, (i) => i);
    const givens = [{ key: 'prPopFirst', params: { k: K }, table: popTable(r.pop, sh, idx) }];
    givens.push(g(`prDist_${S.DISTANCE_KIND[enc]}`, distParams(enc, inst, sh)));
    if (enc === 'function-bits') givens.push(bitsDecodeGiven(inst));
    const pairs = [];
    for (let i = 0; i < K; i++) for (let j = i + 1; j < K; j++) pairs.push([i, j]);
    const d = pairs.map(([i, j]) => S.distance(enc, inst, r.pop[i], r.pop[j]));
    const mean = d.reduce((a, b) => a + b, 0) / d.length;
    const distinct = new Set(idx.map((i) => S.key(enc, r.pop[i]))).size;
    return {
      page, givens,
      groups: [
        group('pairs', 'prPairs', 'num', d, (q) => lbl('prPair', { i: pairs[q][0] + 1, j: pairs[q][1] + 1 }), { tol: 'dist' }),
        one('mean', 'prMeanDist', 'num', mean, { tol: 'dist' }),
        one('min', 'prMinDist', 'num', Math.min(...d), { tol: 'dist' }),
        one('distinct', 'prDistinct', 'int', distinct, { min: 1, max: K }),
      ],
      view: { type: 'pop' }, solution: { types: ['distance'] },
    };
  }

  /** Cabecera del gen q de un cromosoma (bits, enteros, matriz, reales). */
  function geneHead(sh, q) {
    if (sh.kind === 'matrix') return lbl('prCell', { i: Math.floor(q / sh.m) + 1, j: (q % sh.m) + 1 });
    if (sh.kind === 'real') return lbl(q === 0 ? 'prX1' : 'prX2');
    return lbl('prGene', { g: q + 1 });
  }
  function ruleParams(enc, inst, sh) {
    if (sh.kind === 'int') return { m: sh.m };
    if (sh.kind === 'real') return { a: upTo(sh.a, 2), b: upTo(sh.b, 2), w: upTo(sh.b - sh.a, 2) };
    if (sh.kind === 'perm') return { n: sh.length };
    if (sh.kind === 'matrix') return { n: sh.n, m: sh.m };
    return { L: sh.length };
  }
  function distParams(enc, inst, sh) {
    if (isFn(enc)) { const Fd = Fn.fnOf(inst.fn); return { a: upTo(Fd.a, 2), b: upTo(Fd.b, 2), diag: num(Math.SQRT2 * (Fd.b - Fd.a), 2) }; }
    return { L: sh.kind === 'perm' ? sh.length : sh.length };
  }

  function seeded(type, page) {
    const { inst, r, sh } = model('seeded', page);
    const enc = page.enc;
    const N = page.N;
    if (type === 'greedy') {
      const h = IT.seeded.greedy(enc, inst);
      const givens = instanceGivens(enc, inst).concat([g(`prGreedy_${enc}`)]);
      let groups;
      if (enc === 'knapsack-bits') {
        groups = [
          group('order', 'prGreedyOrder', 'int', h.order.map((o) => o.item), (q) => lbl('prPos', { i: q + 1 }), { min: 1, max: sh.length }),
          group('x', 'prGreedyChrom', 'bit', h.x, (q) => lbl('prGene', { g: q + 1 })),
          one('value', 'prValue', 'int', S.quality(enc, inst, h.x).value),
        ];
      } else if (enc === 'assignment-int') {
        groups = [
          group('x', 'prGreedyChrom', 'int', h.x, (q) => lbl('prTask', { i: q + 1 }), { min: 1, max: sh.m }),
          one('cmax', 'prCmax', 'int', A.makespan(inst, h.x)),
        ];
      } else {
        groups = [
          group('tour', 'prGreedyTour', 'int', h.x.slice(1), (q) => lbl('prPos', { i: q + 2 }), { min: 1, max: sh.length }),
          one('length', 'prLength', 'num', TSP.tourLength(inst, h.x), { tol: 'exact' }),
        ];
      }
      return { page, givens, groups, view: { type: 'random' }, solution: { types: ['heur'] } };
    }
    // Toma de control: copias esperadas del mejor con torneo binario, sin variación
    const K = r.K;
    const curve = IT.seeded.takeover(K, N, 200);
    const gN = curve.find((c) => c.k >= N - 0.5);
    return {
      page,
      givens: [g('prTakeoverRule', { N, K })],
      groups: [
        group('k', 'prCopies', 'num', [1, 2, 3].map((q) => curve[q].k), (q) => lbl('prGenLab', { g: q + 1 }), { tol: 'copies' }),
        one('gen', 'prTakeoverGen', 'int', gN ? gN.g : 200, { min: 0 }, { N }),
      ],
      view: { type: 'mix' }, solution: { types: ['gen'] },
    };
  }

  function quasi(type, page) {
    const { inst, r, sh } = model('quasi', page);
    const method = r.method;
    // Los K últimos individuos: cambian con N (en Halton y Sobol, lo único que cambia)
    const K = Math.min(4, page.N);
    const first = page.N - K;
    const idx = seq(K, (q) => first + q);
    const box = { a: upTo(sh.a, 2), b: upTo(sh.b, 2), w: upTo(sh.b - sh.a, 2) };
    const givens = [g(`prQuasiRule_${method}`, Object.assign({ from: first + 1, to: page.N }, box))];
    const groups = [];
    if (method === 'lhs') {
      givens.push(g('prLhsPerms', { p1: r.perms[0].join(', '), p2: r.perms[1].join(', '), N: page.N }));
      givens.push({ key: 'prLhsV', table: { head: ['', 'v₁', 'v₂'], rows: idx.map((i) => [indLabel(i)].concat(r.draws[i].map((d) => num(d.v, 3)))) } });
    } else if (method === 'sobol') {
      givens.push(g('prSobolDirs', { dirs: IT.quasi.DIRS.map((d) => `v${'₁₂₃₄₅'[d.k - 1]} = ${d.m}/${Math.pow(2, d.k)}`).join(', ') }));
    }
    if (method !== 'lhs') {
      groups.push(group('u1', 'prU1', 'num', idx.map((i) => r.draws[i][0].u), (q) => indLabel(idx[q]), { tol: 'u' }));
      groups.push(group('u2', 'prU2', 'num', idx.map((i) => r.draws[i][1].u), (q) => indLabel(idx[q]), { tol: 'u' }));
    }
    const tol = method === 'lhs' ? 'coord' : 'cents';
    groups.push(group('x1', 'prX1Of', 'num', idx.map((i) => r.pop[i][0]), (q) => indLabel(idx[q]), { tol }));
    groups.push(group('x2', 'prX2Of', 'num', idx.map((i) => r.pop[i][1]), (q) => indLabel(idx[q]), { tol }));
    return { page, givens, groups, view: { type: 'q_rule' }, solution: { types: ['q_pop'] } };
  }

  function ssi(type, page) {
    const { inst, r, sh } = model('ssi', page);
    const enc = page.enc;
    const want = Math.min(4, page.N);
    let C = 0;
    let acc = 0;
    while (C < r.candidates.length && C < 8 && acc < want) { if (r.candidates[C].accepted) acc++; C++; }
    const cands = r.candidates.slice(0, C);
    const givens = [
      g('prSsiRule', { delta: num(r.delta, 2) }),
      g(`prDist_${S.DISTANCE_KIND[enc]}`, distParams(enc, inst, sh)),
    ];
    if (enc === 'function-bits') givens.push(bitsDecodeGiven(inst));
    givens.push({ key: 'prCands', params: { c: C }, table: popTable(cands.map((c) => c.x), sh, seq(C, (i) => i), null, null, (i) => lbl('prCand', { c: i + 1 })) });
    const later = cands.slice(1);
    const cl = (q) => lbl('prCand', { c: q + 2 });
    return {
      page, givens,
      groups: [
        group('dmin', 'prDmin', 'num', later.map((c) => c.dmin), cl, { tol: 'dist' }),
        group('acc', 'prAccepted', 'yesno', later.map((c) => (c.accepted ? 'yes' : 'no')), cl),
      ],
      view: { type: 'ssi_rule' }, solution: { types: ['cand_ok', 'cand_rej'] },
    };
  }

  function feasible(type, page) {
    const { inst, r, sh } = model('feasible', page);
    const enc = page.enc;
    if (enc === 'knapsack-bits') {
      const d0 = r.details[0];
      const n = sh.length;
      return {
        page,
        givens: [knapsackTable(inst), g('prFeasRule_knapsack', { n }),
          { key: 'prDrawsPerm', table: { head: [''].concat(d0.swaps.map((s) => ({ key: 'prKHead', params: { k: s.k } }))), rows: [[indLabel(0)].concat(d0.swaps.map((s) => num(s.u, 3)))] } }],
        groups: [
          group('perm', 'prFeasOrder', 'int', d0.perm, (q) => lbl('prPos', { i: q + 1 }), { min: 1, max: n }),
          group('x', 'prChromOf', 'bit', d0.x, (q) => lbl('prGene', { g: q + 1 }), { params: { i: 1 } }),
          one('weight', 'prWeight', 'int', d0.decisions[d0.decisions.length - 1].total),
        ],
        view: { type: 'f_rule' }, solution: { types: ['f_order'] },
      };
    }
    const K = 2;
    return {
      page,
      givens: [g('prFeasRule_matrix', { m: sh.m, n: sh.n }),
        { key: 'prDrawsTask', table: { head: [''].concat(seq(sh.n, (i) => ({ key: 'prTaskShort', params: { i: i + 1 } }))), rows: seq(K, (i) => [indLabel(i)].concat(r.details[i].rows.map((w) => num(w.u, 3)))) } }],
      groups: seq(K, (i) => group(`a${i + 1}`, 'prMachinesOf', 'int', r.details[i].rows.map((w) => w.j), (q) => lbl('prTask', { i: q + 1 }), { min: 1, max: sh.m, params: { i: i + 1 } })),
      view: { type: 'f_rule' }, solution: { types: ['f_row'] },
    };
  }

  // ======================================================================
  // Evaluación
  // ======================================================================

  function pipeline(type, page) {
    const { inst, r, sh } = model('pipeline', page);
    const enc = page.enc;
    const N = page.N;
    if (type === 'rank') {
      const d = objDec(enc);
      const fits = r.fits.map((v) => round(v, d));
      const rk = F.ranking(fits, S.sense(enc));
      return {
        page,
        givens: [g(`prRankRule_${S.sense(enc)}`), { key: 'prFitTable', table: { head: ['', { key: 'prFitHead' }], rows: seq(N, (i) => [indLabel(i), num(fits[i], d)]) } }],
        groups: [group('rank', 'prRanks', 'int', rk.rank, indLabel, { min: 1, max: N })],
        view: { type: 'e_pop' }, solution: { types: ['e_rank'] },
      };
    }
    const K = Math.min(3, N);
    const idx = seq(K, (i) => i);
    const ev = idx.map((i) => r.evals[i]);
    const givens = instanceGivens(enc, inst).concat([fitnessRule(enc), { key: 'prPopFirst', params: { k: K }, table: popTable(r.pop, sh, idx) }]);
    let groups;
    if (enc === 'knapsack-bits') {
      groups = [
        group('weight', 'prWeights', 'int', ev.map((e) => e.obj.weight), indLabel),
        group('value', 'prValues', 'int', ev.map((e) => e.obj.value), indLabel),
        group('excess', 'prExcesses', 'int', ev.map((e) => e.violation), indLabel),
        group('fitness', 'prFitnesses', 'num', ev.map((e) => e.fitness), indLabel, { tol: 'exact' }),
      ];
    } else if (enc === 'assignment-int') {
      groups = [
        group('loads', 'prLoadsOf', 'int', ev[0].obj.loads, (j) => lbl('prMachine', { j: j + 1 }), { params: { i: 1 } }),
        group('cmax', 'prCmaxes', 'int', ev.map((e) => e.objective), indLabel),
      ];
    } else if (enc === 'assignment-matrix') {
      groups = [
        group('v', 'prViolations', 'int', ev.map((e) => e.violation), indLabel),
        group('cmax', 'prCmaxAsIs', 'int', ev.map((e) => e.objective), indLabel),
        group('fitness', 'prFitnesses', 'num', ev.map((e) => e.fitness), indLabel, { tol: 'exact' }),
      ];
    } else if (enc === 'tsp-perm') {
      groups = [group('length', 'prLengths', 'num', ev.map((e) => e.objective), indLabel, { tol: 'exact' })];
    } else if (enc === 'function-bits') {
      groups = [
        group('x1', 'prX1Of', 'num', ev.map((e) => e.phenotype.point[0]), indLabel, { tol: 'coord' }),
        group('x2', 'prX2Of', 'num', ev.map((e) => e.phenotype.point[1]), indLabel, { tol: 'coord' }),
        group('f', 'prFvals', 'num', ev.map((e) => e.objective), indLabel, { tol: 'fval' }),
      ];
    } else {
      groups = [group('f', 'prFvals', 'num', ev.map((e) => e.objective), indLabel, { tol: 'fval' })];
    }
    return { page, givens, groups, view: { type: 'e_pop' }, solution: { types: ['e_fit'] } };
  }

  function objective(type, page) {
    // −f no sirve para la ruleta: el ejercicio usa C − f
    const pg = page.x && page.x.tr === 'neg' ? Object.assign({}, page, { x: Object.assign({}, page.x, { tr: 'cmax' }) }) : page;
    const { r } = model('objective', pg);
    const enc = pg.enc;
    const N = pg.N;
    const d = objDec(enc);
    const f = r.f.map((v) => round(v, d));
    const kind = r.transform;
    const tr = IT.objective.transform(kind, f);
    const p = IT.objective.roulette(tr.F);
    const groups = [];
    if (kind === 'cmax') groups.push(one('C', 'prC', 'num', tr.C, { tol: 'exact' }));
    const ftol = kind === 'inv' ? 'small' : kind === 'rank' ? 'exact' : (d ? 'cents' : 'exact');
    groups.push(group('F', 'prFitnesses', 'num', tr.F, indLabel, { tol: ftol }));
    groups.push(group('p', 'prProbs', 'num', p, indLabel, { tol: 'prob' }));
    return {
      page: pg,
      givens: [g(`prTransform_${kind}`), g('prRoulette'), { key: 'prObjTable', table: { head: ['', { key: 'prObjHead' }], rows: seq(N, (i) => [indLabel(i), num(f[i], d)]) } }],
      groups, view: { type: 'o_obj' }, solution: { types: ['o_all'] },
    };
  }

  function penalty(type, page) {
    const { inst, r, sh } = model('penalty', page);
    const enc = page.enc;
    const N = page.N;
    const idx = seq(N, (i) => i);
    const lam = upTo(r.lambda, 2);
    const givens = [];
    if (enc === 'knapsack-bits') {
      givens.push(g('prPenKnapData', { W: inst.capacity }));
      givens.push({ key: 'prPenPop', table: popTable(r.pop, sh, idx, [{ key: 'prValueHead' }, { key: 'prWeightHead' }], (i) => [r.evals[i].obj.value, r.evals[i].obj.weight]) });
    } else {
      givens.push(g('prPenMatrixData', { n: sh.n, m: sh.m }));
      givens.push({ key: 'prPenPop', table: popTable(r.pop, sh, idx, [{ key: 'prCmaxHead' }], (i) => [r.evals[i].objective]) });
    }
    givens.push(g(`prPenRule_${enc}_${r.type}`, { lambda: lam }));
    const groups = [
      group('v', enc === 'knapsack-bits' ? 'prExcesses' : 'prViolations', 'int', r.evals.map((e) => e.violation), indLabel),
      group('fitness', 'prFitnesses', 'num', r.evals.map((e) => e.fitness), indLabel, { tol: 'cents' }),
    ];
    if (r.lambdaStar) groups.push(one('lstar', 'prLambdaStar', 'num', r.lambdaStar.lambda, { tol: 'rel' }));
    else givens.push(g('prPenNoFeasible'));
    return { page, givens, groups, view: { type: 'p_pop' }, solution: { types: ['p_fit'] } };
  }

  function cost(type, page) {
    const { r, sh } = model('cost', page);
    const N = page.N;
    const idx = seq(N, (i) => i);
    const g0 = r.gens[0];
    const g1 = r.gens[1];
    return {
      page,
      givens: [
        g('prCostRule', { N, G: r.G }),
        { key: 'prGen0', table: popTable(g0.pop, sh, idx) },
        { key: 'prGen1', table: popTable(g1.pop, sh, idx) },
      ],
      groups: [
        group('new', 'prMustEval', 'yesno', g1.hit.map((h) => (h ? 'no' : 'yes')), indLabel),
        one('cum', 'prCumCache', 'int', g1.cumCache),
        one('plain', 'prCumPlain', 'int', g1.cumNo),
        one('budget', 'prBudget', 'int', r.budget, {}, { G: r.G }),
      ],
      view: { type: 'c_budget' }, solution: { types: ['c_gen'] },
    };
  }

  function landscape(type, page) {
    const { inst, r, sh } = model('landscape', page);
    const enc = page.enc;
    const nb = r.neighbours;
    const sense = S.sense(enc);
    const fits = nb.list.map((n) => n.fit);
    const bestNb = sense === 'max' ? Math.max(...fits) : Math.min(...fits);
    const tol = objTol(enc);
    const givens = instanceGivens(enc, inst).concat([fitnessRule(enc), g(`prNeigh_${sh.kind === 'bits' && sh.k ? 'fbits' : sh.kind}`, { h: upTo(IT.landscape.H, 2) }),
      { key: 'prIndGiven', table: popTable(r.pop, sh, [0]) }]);
    return {
      page, givens,
      groups: [
        one('fit', 'prFitI1', 'num', nb.fit, { tol }),
        one('count', 'prNeighCount', 'int', nb.list.length),
        one('better', 'prNeighBetter', 'int', nb.better),
        one('best', `prNeighBest_${sense}`, 'num', bestNb, { tol }),
        one('local', 'prIsLocal', 'yesno', nb.better === 0 ? 'yes' : 'no'),
      ],
      view: { type: 'l_space' }, solution: { types: ['l_neigh'] },
    };
  }

  function noise(type, page) {
    const { r } = model('noise', page);
    const enc = page.enc;
    const N = page.N;
    const d = objDec(enc);
    const f = r.f.map((v) => round(v, d));
    const vals = r.noisy.map((reps) => reps.map((e) => round(e.value, 2)));
    const means = vals.map((v) => v.reduce((a, b) => a + b, 0) / v.length);
    const single = vals.map((v) => v[0]);
    const argmin = (v) => v.reduce((b, x, i) => (x < v[b] ? i : b), 0);
    const R = r.R;
    return {
      page,
      givens: [g('prNoiseRule', { sigma: upTo(r.sigma, 2), R }),
        { key: 'prNoiseTable', table: { head: ['', { key: 'prTrueHead' }].concat(seq(R, (q) => ({ key: 'prRepHead', params: { q: q + 1 } }))), rows: seq(N, (i) => [indLabel(i), num(f[i], d)].concat(vals[i].map((v) => num(v, 2)))) } }],
      groups: [
        group('mean', 'prMeans', 'num', means, indLabel, { tol: 'cents' }),
        one('bestSingle', 'prBestSingle', 'int', argmin(single) + 1, { min: 1, max: N }),
        one('bestMean', 'prBestMean', 'int', argmin(means) + 1, { min: 1, max: N }),
        one('discSingle', 'prDiscSingle', 'int', IT.noise.discordant(f, single), { min: 0 }),
        one('discMean', 'prDiscMean', 'int', IT.noise.discordant(f, means), { min: 0 }),
      ],
      view: { type: 'n_true' }, solution: { types: ['n_mean'] },
    };
  }

  /** Decimales con que se dan los puntos: centésimas en el vector de reales; en la cadena binaria, hasta 4. */
  const pointCell = (enc, v) => (enc === 'function-real' ? num(v, 2) : upTo(v, 4));
  const pointRound = (enc, v) => (enc === 'function-real' ? round(v, 2) : round(v, 4));

  function surrogate(type, page) {
    const { inst, r } = model('surrogate', page);
    const enc = page.enc;
    const N = page.N;
    const K = Math.min(3, N);
    const archive = r.archive.map((a) => ({ p: a.p.map((v) => pointRound(enc, v)), fit: round(a.fit, 2) }));
    const cands = r.cands.slice(0, K).map((x) => S.point(enc, inst, x).map((v) => pointRound(enc, v)));
    const preds = cands.map((p) => IT.surrogate.predict(r.method, archive, p));
    const groups = [];
    if (r.method === 'nn') groups.push(group('near', 'prNearest', 'int', preds.map((q) => q.near + 1), (q) => lbl('prCand', { c: q + 1 }), { min: 1, max: N }));
    groups.push(group('pred', 'prPredicted', 'num', preds.map((q) => q.value), (q) => lbl('prCand', { c: q + 1 }), { tol: r.method === 'nn' ? 'cents' : 'rel' }));
    return {
      page,
      givens: [g(`prSurRule_${r.method}`),
        { key: 'prArchive', table: { head: ['', 'x₁', 'x₂', { key: 'prFitHead' }], rows: seq(N, (i) => [indLabel(i), pointCell(enc, archive[i].p[0]), pointCell(enc, archive[i].p[1]), num(archive[i].fit, 2)]) } },
        { key: 'prCandPoints', params: { k: K }, table: { head: ['', 'x₁', 'x₂'], rows: seq(K, (i) => [lbl('prCand', { c: i + 1 }), pointCell(enc, cands[i][0]), pointCell(enc, cands[i][1])]) } }],
      groups, view: { type: 's_archive' }, solution: { types: ['s_first'] },
    };
  }

  function multi(type, page) {
    const { r } = model('multi', page);
    const enc = page.enc;
    const N = page.N;
    return {
      page,
      givens: [g(`prMultiRule_${enc}`, { w: upTo(r.w, 2) }),
        { key: 'prObjsTable', table: { head: ['', { key: `prObjA_${enc}` }, { key: `prObjB_${enc}` }], rows: seq(N, (i) => [indLabel(i)].concat(r.objs[i].shown)) } }],
      groups: [
        group('front', 'prFronts', 'int', r.rank, indLabel, { min: 1, max: N }),
        one('best', 'prWeightedBest', 'int', r.best + 1, { min: 1, max: N }, { w: upTo(r.w, 2) }),
      ],
      view: { type: 'm_objs' }, solution: { types: ['m_front'] },
    };
  }

  // ======================================================================

  const BUILD = { uniform, seeded, quasi, ssi, feasible, pipeline, objective, penalty, cost, landscape, noise, surrogate, multi };

  function exercise(item, type, page) {
    if (!BUILD[item] || TYPES[item].indexOf(type) === -1) throw new Error(`practice: ${item}/${type}`);
    const ex = BUILD[item](type, page);
    ex.item = item;
    ex.type = type;
    return ex;
  }

  /** Página nueva para «Nuevo ejercicio»: otra instancia y otra población, con los mismos ajustes. */
  function newPage(item, type, seed, page) {
    const r = R.mulberry32(R.seedState(seed));
    const s = Math.floor(r() * 999999) + 1;
    const ps = Math.floor(r() * 999999) + 1;
    return Object.assign({}, page, { s, ps });
  }

  // ---------- Respuestas ----------

  /** Clave de error de la respuesta (formato), o null. */
  function validate(ex, response) {
    for (const gr of ex.groups) {
      const vals = response && response[gr.id];
      if (!Array.isArray(vals) || vals.length !== gr.items.length) return 'prErrEmpty';
      for (const v of vals) {
        if (v == null || v === '' || (typeof v === 'number' && Number.isNaN(v))) return 'prErrEmpty';
        if (gr.kind === 'int') {
          if (typeof v !== 'number' || !Number.isInteger(v)) return 'prErrInteger';
          if ((gr.min != null && v < gr.min) || (gr.max != null && v > gr.max)) return 'prErrRange';
        } else if (gr.kind === 'num') {
          if (typeof v !== 'number' || !Number.isFinite(v)) return 'prErrNumber';
        } else if (gr.kind === 'bit') {
          if (v !== 0 && v !== 1) return 'prErrEmpty';
        } else if (gr.kind === 'yesno' && v !== 'yes' && v !== 'no') return 'prErrEmpty';
      }
    }
    return null;
  }

  /** Corrección elemento a elemento: { groups: [{ id, items: [{ guess, correct, ok }] }], ok, total }. */
  function grade(ex, response) {
    let ok = 0;
    let total = 0;
    const groups = ex.groups.map((gr) => {
      const tol = gr.kind === 'num' ? TOL[gr.tol || 'exact'] : null;
      const items = response[gr.id].map((v, i) => {
        const c = gr.items[i].answer;
        const good = tol ? Math.abs(v - c) <= tol(c) + 1e-9 : v === c;
        return { guess: v, correct: c, ok: good };
      });
      items.forEach((it) => { total++; if (it.ok) ok++; });
      return { id: gr.id, items };
    });
    return { groups, ok, total };
  }

  /** La respuesta correcta en el formato de response (para los tests y para Moodle). */
  const answerOf = (ex) => ex.groups.reduce((o, gr) => { o[gr.id] = gr.items.map((it) => it.answer); return o; }, {});

  // ---------- Textos y celdas ----------

  const minus = (s) => s.replace(/^-/, '−');
  /** Número con d decimales fijos (o hasta t) y la coma o el punto del idioma. */
  function fmtNum(v, lang, d, t) {
    const x = Math.abs(v) < 1e-12 ? 0 : v;
    const s = t != null ? String(Number(x.toFixed(t))) : x.toFixed(d || 0);
    return minus(lang === 'es' ? s.replace('.', ',') : s);
  }
  function chromText(x, sh, lang) {
    if (sh.kind === 'real') return `(${x.map((v) => fmtNum(v, lang, 2)).join('; ')})`;
    if (sh.kind === 'matrix') return S.toRows(x, sh.m).map((row) => row.join('')).join(' ');
    if (sh.kind === 'perm' || sh.kind === 'int') return `(${x.join(', ')})`;
    if (sh.k) return `${x.slice(0, sh.k).join('')} ${x.slice(sh.k).join('')}`;
    return x.join('');
  }
  /** Texto de la clave en el idioma, con los parámetros (celdas) ya formateados. */
  function t(lang, key, params) {
    const dict = TXT[lang] || TXT.es;
    const s = dict[key] != null ? dict[key] : (TXT.es[key] != null ? TXT.es[key] : key);
    return s.replace(/\{(\w+)\}/g, (m, k) => (params && params[k] != null ? cellText(params[k], lang) : m));
  }
  function cellText(c, lang) {
    if (c == null) return '';
    if (typeof c === 'number') return Number.isInteger(c) ? minus(String(c)) : fmtNum(c, lang, null, 4);
    if (typeof c === 'string') return c;
    if (c.chrom) return chromText(c.chrom, c.sh, lang);
    if (c.key) return t(lang, c.key, c.params);
    if (c.v != null) return fmtNum(c.v, lang, c.d, c.t);
    return '';
  }
  /** Texto de un valor de la respuesta (para la corrección y la solución). */
  function answerText(gr, v, lang) {
    if (gr.kind === 'yesno') return t(lang, v === 'yes' ? 'prYes' : 'prNo');
    if (gr.kind === 'num') {
      const tol = TOL[gr.tol || 'exact'](v);
      const d = Math.max(2, Math.min(6, Math.ceil(-Math.log10(tol))));
      return fmtNum(v, lang, null, d);
    }
    return String(v);
  }

  const api = {
    TYPES, ITEM_IDS, typesFor, TOL, runOpts, model, exercise, newPage, validate, grade, answerOf,
    t, cellText, fmtNum, chromText, answerText,
  };
  if (isNode) module.exports = api;
  else (root.GAX = root.GAX || {}).practice = api;
})(typeof self !== 'undefined' ? self : this);
