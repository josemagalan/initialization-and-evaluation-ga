/*
 * Generador de bancos de preguntas para Moodle (formato Moodle XML).
 *
 * Cada pregunta es uno de los ejercicios de la práctica (js/practice.js) sobre una página generada al azar con
 * los tamaños y ajustes del nivel; las respuestas guardadas son las del ejercicio, así que la pregunta y la
 * herramienta corrigen lo mismo. Formato cloze: una casilla por elemento (puntuación parcial). La
 * retroalimentación general da la solución y enlaza a la herramienta publicada: la resolución paso a paso (en
 * el paso de la solución) y el ejercicio en modo práctica.
 *
 * Una categoría por elemento, tipo de ejercicio, codificación y nivel. El nombre de cada pregunta (que el
 * alumnado no ve) lleva su semilla, para reproducirla. La semilla base del banco es aleatoria en cada
 * exportación.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const G = isNode ? null : root.GAX;
  const R = isNode ? require('./rng.js') : G.rng;
  const PR = isNode ? require('./practice.js') : G.practice;
  const S = isNode ? require('./space.js') : G.space;
  const REG = isNode ? require('./registry.js') : G.registry;
  const SSI = isNode ? require('./items/ssi.js') : G.items.ssi;

  const APP = 'https://josemagalan.github.io/initialization-and-evaluation-ga/';
  const LEVELS = ['easy', 'medium', 'hard'];
  const ITEMS = PR.ITEM_IDS;
  /**
   * Tipos de pregunta: elemento × tipo de ejercicio × codificación. Las copias de la semilla no dependen del
   * problema (solo de N y K): un único tipo, sin codificación.
   */
  const ENC_FREE = ['seeded:takeover'];
  const KINDS = [].concat(...ITEMS.map((item) => [].concat(...PR.typesFor(item).map((type) => {
    const free = ENC_FREE.indexOf(`${item}:${type}`) !== -1;
    const encs = free ? REG.getItem(item).encodings.slice(0, 1) : REG.getItem(item).encodings;
    return encs.map((enc) => ({ id: free ? `${item}:${type}` : `${item}:${type}:${enc}`, item, type, enc, encFree: free }));
  }))));
  const kindById = (id) => KINDS.find((k) => k.id === id);
  const MAX_TRIES = 3000;

  // ---------- Textos propios (el resto sale de js/practice-text.js, los mismos de la práctica) ----------
  const T = {
    es: {
      root: 'Inicialización y evaluación',
      level: { easy: 'Fácil', medium: 'Media', hard: 'Difícil' },
      problem: {
        'knapsack-bits': 'Problema de la mochila 0/1 con un vector de bits: xᵢ = 1 si el objeto i entra en la mochila.',
        'assignment-int': 'Asignación de tareas a máquinas no relacionadas (minimizar el makespan Cmax, la mayor carga) con un vector de enteros: aᵢ es la máquina de la tarea i.',
        'assignment-matrix': 'Asignación de tareas a máquinas no relacionadas (minimizar el makespan Cmax, la mayor carga) con una matriz binaria: yᵢⱼ = 1 si la tarea i se hace en la máquina j. El cromosoma se escribe tarea a tarea: cada bloque es una tarea y cada bit, una máquina.',
        'tsp-perm': 'Problema del viajante con una permutación: el gen k es la ciudad que se visita en el lugar k, y el circuito vuelve de la última a la primera.',
        'function-real': 'Minimizar una función continua de dos variables con un vector de dos reales.',
        'function-bits': 'Minimizar una función continua de dos variables con una cadena binaria.',
      },
      answer: 'Respuesta', solution: 'Solución',
      linkSteps: 'Ver la resolución paso a paso en la herramienta',
      linkPractice: 'Repetir este ejercicio en la herramienta (modo práctica)',
      decimals: 'Escribe los números con la coma decimal; basta con dos decimales salvo que se diga otra cosa.',
    },
    en: {
      root: 'Initialisation and evaluation',
      level: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
      problem: {
        'knapsack-bits': '0/1 knapsack problem with a bit vector: xᵢ = 1 if item i goes into the knapsack.',
        'assignment-int': 'Assignment of tasks to unrelated machines (minimise the makespan Cmax, the largest load) with an integer vector: aᵢ is the machine of task i.',
        'assignment-matrix': 'Assignment of tasks to unrelated machines (minimise the makespan Cmax, the largest load) with a binary matrix: yᵢⱼ = 1 if task i is done on machine j. The chromosome is written task by task: each block is a task and each bit a machine.',
        'tsp-perm': 'Travelling salesman problem with a permutation: gene k is the city visited in position k, and the tour returns from the last city to the first.',
        'function-real': 'Minimise a continuous function of two variables with a vector of two real numbers.',
        'function-bits': 'Minimise a continuous function of two variables with a bit string.',
      },
      answer: 'Answer', solution: 'Solution',
      linkSteps: 'See the step-by-step solution in the tool',
      linkPractice: 'Repeat this exercise in the tool (practice mode)',
      decimals: 'Write numbers with a decimal point; two decimal places are enough unless stated otherwise.',
    },
  };
  const encName = (enc, lang) => REG.getEncoding(enc).name[lang];
  const itemName = (item, lang) => REG.getItem(item).name[lang];
  const typeName = (type, lang) => PR.t(lang, `prType_${type}`);

  // ---------- Páginas al azar por nivel ----------
  const pick = (r, list) => list[Math.floor(r() * list.length)];
  const SIZES = {
    knapsack: { easy: 5, medium: 6, hard: 8 },
    int: { easy: [5, 2], medium: [6, 3], hard: [8, 3] },
    matrix: { easy: [5, 2], medium: [5, 3], hard: [6, 3] },
    tsp: { easy: 5, medium: 6, hard: 7 },
    k: { easy: 3, medium: 4, hard: 5 },
  };
  /** En el paisaje, instancias pequeñas: hay que evaluar todos los vecinos a mano. */
  const SMALL = {
    knapsack: { easy: 5, medium: 6, hard: 7 },
    int: { easy: [5, 2], medium: [5, 3], hard: [6, 3] },
    matrix: { easy: [5, 2], medium: [5, 2], hard: [5, 3] },
    tsp: { easy: 5, medium: 5, hard: 6 },
    k: { easy: 3, medium: 3, hard: 4 },
  };
  const POP = { easy: 4, medium: 5, hard: 6 };

  function params(enc, level, small) {
    const Z = small ? SMALL : SIZES;
    if (enc === 'knapsack-bits') return { n: Z.knapsack[level] };
    if (enc === 'assignment-int') return { n: Z.int[level][0], m: Z.int[level][1] };
    if (enc === 'assignment-matrix') return { n: Z.matrix[level][0], m: Z.matrix[level][1] };
    if (enc === 'tsp-perm') return { n: Z.tsp[level] };
    const fn = level === 'hard' ? 'rastrigin' : 'himmelblau';
    return enc === 'function-bits' ? { fn, k: Z.k[level] } : { fn };
  }

  /** Ajustes propios del elemento para el nivel (los mismos parámetros que la URL). */
  function extras(kind, level, r) {
    const { item, enc } = kind;
    switch (item) {
      case 'seeded': return { K: String({ easy: 1, medium: 2, hard: 3 }[level]) };
      case 'quasi': return { m: { easy: 'halton', medium: 'sobol', hard: 'lhs' }[level] };
      case 'ssi': return { d: String(SSI.DEFAULT_DELTA[enc]) };
      case 'objective': return { tr: { easy: 'cmax', medium: 'inv', hard: 'rank' }[level] };
      case 'penalty': {
        const knap = enc === 'knapsack-bits';
        if (level === 'easy') return { pt: 'linear', l: '1' };
        if (level === 'medium') return { pt: 'linear', l: String(knap ? pick(r, [0.5, 1.5, 2, 2.5]) : pick(r, [2, 2.5, 3, 4])) };
        return { pt: 'quadratic', l: String(knap ? pick(r, [0.5, 0.8, 1.2, 1.5]) : pick(r, [1, 1.5, 2])) };
      }
      case 'cost': return { G: String({ easy: 2, medium: 4, hard: 6 }[level]) };
      case 'noise': return { sg: String(enc === 'tsp-perm' ? 12 : 30), R: String({ easy: 2, medium: 3, hard: 4 }[level]) };
      case 'surrogate': return { sm: level === 'hard' ? 'idw' : 'nn' };
      case 'multi': return { w: String(level === 'easy' ? 0.5 : level === 'medium' ? pick(r, [0.3, 0.7]) : pick(r, [0.2, 0.4, 0.6, 0.8])) };
      default: return {};
    }
  }

  /** Población según el ejercicio: los que piden algo de cada individuo, más pequeña. */
  function popSize(kind, level) {
    if (kind.item === 'multi') return { easy: 5, medium: 6, hard: 8 }[level];
    if (kind.item === 'quasi' || kind.item === 'ssi' || kind.type === 'diversity') return { easy: 4, medium: 6, hard: 8 }[level];
    return POP[level];
  }

  function pageFor(kind, level, seed) {
    const r = R.mulberry32(R.seedState(seed));
    const s = Math.floor(r() * 999999) + 1;
    const ps = Math.floor(r() * 999999) + 1;
    const page = { enc: kind.enc, p: S.params(kind.enc, params(kind.enc, level, kind.item === 'landscape')), N: popSize(kind, level), s, ps, x: extras(kind, level, r) };
    if (kind.item === 'seeded' && kind.type === 'takeover') {
      // Solo dependen de N y K
      const [lo, hi] = { easy: [4, 10], medium: [8, 16], hard: [10, 20] }[level];
      page.N = lo + Math.floor(r() * (hi - lo + 1));
      page.x = { K: String(level === 'easy' ? 1 : level === 'medium' ? pick(r, [1, 2]) : pick(r, [2, 3, 4])) };
    }
    if (kind.item === 'quasi') {
      // En Halton y Sobol solo cambian N (se piden los últimos individuos) y la caja
      const [lo, hi] = { easy: [4, 8], medium: [9, 20], hard: [4, 8] }[level];
      page.N = lo + Math.floor(r() * (hi - lo + 1));
      page.p = { fn: pick(r, ['himmelblau', 'rastrigin']) };
      page.x = { m: level === 'hard' ? 'lhs' : pick(r, ['halton', 'sobol']) };
    }
    return acceptable(kind, level, page) ? page : null;
  }

  /** Filtros: que el ejercicio tenga una respuesta clara y sea del nivel. */
  function acceptable(kind, level, page) {
    const ex = PR.exercise(kind.item, kind.type, page);
    const ans = (id) => { const gr = ex.groups.find((g) => g.id === id); return gr ? gr.items.map((it) => it.answer) : null; };
    const m = PR.model(kind.item, page);
    switch (kind.item) {
      case 'ssi': {
        // Ninguna distancia en el filo de δ (en la euclídea, al menos 0,006 de margen) y algún rechazo salvo en fácil
        const d = ans('dmin');
        const delta = m.r.delta;
        if (S.DISTANCE_KIND[kind.enc] === 'euclid' && d.some((v) => Math.abs(v - delta) < 0.006)) return false;
        if (level !== 'easy' && ans('acc').indexOf('no') === -1) return false;
        return d.length >= 3;
      }
      case 'penalty': {
        const v = ans('v');
        return v.some((x) => x === 0) && v.some((x) => x > 0) && (level === 'easy' || v.filter((x) => x > 0).length >= 2);
      }
      case 'cost': return level === 'easy' || ans('new').indexOf('no') !== -1;
      case 'surrogate': {
        // El vecino más cercano, sin empates por poco
        const enc = page.enc;
        const pts = m.r.archive.map((a) => a.p);
        const ok = m.r.cands.slice(0, 3).every((x) => {
          const p = S.point(enc, m.inst, x);
          const ds = pts.map((q) => Math.hypot(q[0] - p[0], q[1] - p[1])).sort((a, b) => a - b);
          return ds[1] - ds[0] > 0.05;
        });
        return ok;
      }
      case 'multi': {
        const fr = ans('front');
        return level === 'easy' ? Math.max(...fr) >= 2 : Math.max(...fr) >= 3;
      }
      case 'landscape': return level === 'easy' || ans('better')[0] > 0;
      case 'pipeline': {
        if (kind.type === 'rank') return true;
        if (kind.enc === 'knapsack-bits' && level !== 'easy') return ans('excess').some((e) => e > 0);
        if (kind.enc === 'assignment-matrix' && level !== 'easy') return ans('v').some((e) => e > 0);
        return true;
      }
      default: return true;
    }
  }

  // ---------- Enlaces a la herramienta ----------
  function pageHash(item, page) {
    const h = [['item', item]];
    h.push(['enc', page.enc]);
    Object.entries(page.p).forEach(([k, v]) => h.push([k, String(v)]));
    h.push(['N', String(page.N)], ['s', String(page.s)], ['ps', String(page.ps)]);
    Object.entries(page.x || {}).forEach(([k, v]) => h.push([k, String(v)]));
    return h;
  }
  function links(ex, lang) {
    const steps = PR.model(ex.item, ex.page).r.steps;
    let step = steps.findIndex((s) => ex.solution.types.indexOf(s.type) !== -1);
    if (step < 0) step = steps.length - 1;
    const base = pageHash(ex.item, ex.page);
    base.splice(1, 0, ['lang', lang]);
    const q1 = new URLSearchParams(base.concat([['step', String(step)]]));
    const q2 = new URLSearchParams(base.concat([['step', '0'], ['practice', ex.type]]));
    return { steps: `${APP}#${q1.toString()}`, practice: `${APP}#${q2.toString()}`, step };
  }

  // ---------- HTML ----------
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const CELL = 'padding:3px 8px;text-align:right;font-variant-numeric:tabular-nums;';
  const MONO = 'padding:3px 8px;text-align:left;font-family:monospace;font-size:1.05em;white-space:nowrap;';
  const HEAD = 'padding:3px 8px;text-align:center;font-size:0.85em;font-weight:600;';
  const TH = 'padding:3px 10px;text-align:left;white-space:nowrap;';
  const table = (rows) => `<table style="border-collapse:collapse;margin:0.5em 0;">${rows.join('')}</table>`;

  function dataTable(tb, lang) {
    const c = (v) => PR.cellText(v, lang);
    const head = `<tr>${tb.head.map((h, k) => (k === 0 && !c(h) ? '<td></td>' : `<th style="${k ? HEAD : TH}">${esc(c(h))}</th>`)).join('')}</tr>`;
    const rows = tb.rows.map((row) => `<tr><th style="${TH}">${esc(c(row[0]))}</th>${row.slice(1).map((v) => `<td style="${v && v.chrom ? MONO : CELL}">${esc(c(v))}</td>`).join('')}</tr>`);
    return table([head].concat(rows));
  }
  function givensHtml(ex, lang) {
    return ex.givens.map((gv) => (gv.key ? `<p>${esc(PR.t(lang, gv.key, gv.params))}</p>` : '') + (gv.table ? dataTable(gv.table, lang) : '')).join('');
  }

  // ---------- Casillas cloze ----------
  const clozeEsc = (s) => String(s).replace(/([}#~/"\\])/g, '\\$1');
  const clozeNumber = (v) => String(Math.abs(v) < 1e-12 ? 0 : Number(v.toPrecision(12)));
  function tolOf(gr, v) {
    if (gr.kind === 'int') return 0;
    const t = PR.TOL[gr.tol || 'exact'](v);
    return t < 1e-5 ? 0 : Number(t.toPrecision(6));
  }
  function cloze(gr, ans, lang) {
    if (gr.kind === 'bit') return `{1:SHORTANSWER:=${ans}}`;
    if (gr.kind === 'int' || gr.kind === 'num') return `{1:NUMERICAL:=${clozeNumber(ans)}:${tolOf(gr, ans)}}`;
    const yes = clozeEsc(PR.t(lang, 'prYes'));
    const no = clozeEsc(PR.t(lang, 'prNo'));
    return `{1:MULTICHOICE:${ans === 'yes' ? '=' : ''}${yes}~${ans === 'no' ? '=' : ''}${no}}`;
  }
  function answerHtml(ex, lang) {
    return ex.groups.map((gr) => {
      const label = esc(PR.t(lang, gr.key, gr.params));
      if (gr.items.length === 1) return `<p><strong>${label}:</strong> ${cloze(gr, gr.items[0].answer, lang)}</p>`;
      if (gr.kind === 'yesno') {
        return `<p><strong>${label}</strong></p>` + table(gr.items.map((it) => `<tr><th style="${TH}">${esc(PR.t(lang, it.label.key, it.label.params))}</th><td style="${CELL}text-align:left;">${cloze(gr, it.answer, lang)}</td></tr>`));
      }
      const head = `<tr>${gr.items.map((it) => `<th style="${HEAD}">${esc(PR.t(lang, it.label.key, it.label.params))}</th>`).join('')}</tr>`;
      const row = `<tr>${gr.items.map((it) => `<td style="padding:2px 4px;">${cloze(gr, it.answer, lang)}</td>`).join('')}</tr>`;
      return `<p><strong>${label}</strong></p>` + table([head, row]);
    }).join('');
  }
  function solutionHtml(ex, lang, lk) {
    const L = T[lang];
    const parts = ex.groups.map((gr) => {
      const vals = gr.items.map((it) => PR.answerText(gr, it.answer, lang));
      const list = gr.items.length === 1 ? vals[0]
        : (gr.kind === 'bit' ? vals.join('') : gr.items.map((it, i) => `${PR.t(lang, it.label.key, it.label.params)}: ${vals[i]}`).join(' · '));
      return `<li>${esc(PR.t(lang, gr.key, gr.params))}: ${esc(list)}</li>`;
    });
    const a = (href, text) => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(text)}</a>`;
    return `<p><strong>${esc(L.solution)}</strong></p><ul>${parts.join('')}</ul><p>${a(lk.steps, L.linkSteps)} · ${a(lk.practice, L.linkPractice)}</p>`;
  }

  function question(kind, level, seed, lang) {
    const page = pageFor(kind, level, seed);
    if (!page) return null;
    const ex = PR.exercise(kind.item, kind.type, page);
    const L = T[lang];
    const lk = links(ex, lang);
    const tn = typeName(kind.type, lang);
    const needsNum = ex.groups.some((gr) => gr.kind === 'num');
    const text = (kind.encFree ? '' : `<p>${esc(L.problem[kind.enc])}</p>`) + `<p><strong>${esc(itemName(kind.item, lang))} · ${esc(tn)}.</strong> ${esc(PR.t(lang, `prIntro_${kind.type}`))}</p>` +
      givensHtml(ex, lang) + `<p><strong>${esc(L.answer)}</strong>${needsNum ? ` <em>(${esc(L.decimals)})</em>` : ''}</p>` + answerHtml(ex, lang);
    const name = [itemName(kind.item, lang), tn].concat(kind.encFree ? [] : [encName(kind.enc, lang)], [L.level[level].toLowerCase(), `s=${seed}`]).join(' · ');
    return {
      kind: kind.id, item: kind.item, type: kind.type, enc: kind.enc, level, seed, page: ex.page, exercise: ex,
      category: [itemName(kind.item, lang), kind.encFree ? tn : `${tn} · ${encName(kind.enc, lang)}`, L.level[level]], name,
      tags: [`item-${kind.item}`, `type-${kind.type}`].concat(kind.encFree ? [] : [`encoding-${kind.enc}`], [`level-${level}`, `lang-${lang}`]),
      qtype: 'cloze', text, general: solutionHtml(ex, lang, lk), link: lk.steps, practiceLink: lk.practice, step: lk.step,
      boxes: ex.groups.reduce((s, gr) => s + gr.items.length, 0),
    };
  }

  // ---------- Generación ----------
  /**
   * opts: { lang, kinds: [id], levels: [id], count, seed (base; aleatoria si falta) }
   * → { seed, lang, questions, missing: [{ kind, level, made, wanted }] }
   */
  function generate(opts) {
    const lang = T[opts.lang] ? opts.lang : 'es';
    const count = Math.max(1, Math.min(50, opts.count || 10));
    const seed = Number.isFinite(opts.seed) ? opts.seed : R.newSeed();
    const questions = [];
    const missing = [];
    const used = new Set();
    let block = 0;
    (opts.kinds || []).forEach((kid) => {
      const kind = kindById(kid);
      if (!kind) return;
      LEVELS.filter((lv) => (opts.levels || []).indexOf(lv) !== -1).forEach((level) => {
        let s = (seed % 100000) * 1000 + (block++) * 100003;
        let made = 0;
        for (let tries = 0; made < count && tries < MAX_TRIES; tries++, s++) {
          const sd = (s % 2147483646) + 1;
          const q = question(kind, level, sd, lang);
          if (!q) continue;
          const key = `${kid}|${JSON.stringify(q.exercise.givens)}`;
          if (used.has(key)) continue;
          used.add(key);
          questions.push(q);
          made++;
        }
        if (made < count) missing.push({ kind: kid, level, made, wanted: count });
      });
    });
    return { seed, lang, questions, missing };
  }

  // ---------- Moodle XML ----------
  const cdata = (s) => `<![CDATA[${String(s).replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`;

  function toXml(result) {
    const L = T[result.lang] || T.es;
    const out = [];
    let lastCat = null;
    result.questions.forEach((q) => {
      const cat = [L.root].concat(q.category).map((c) => c.replace(/\//g, '-')).join('/');
      if (cat !== lastCat) {
        out.push(`  <question type="category">\n    <category><text>$course$/top/${esc(cat)}</text></category>\n  </question>`);
        lastCat = cat;
      }
      out.push(`  <question type="cloze">
    <name><text>${esc(q.name)}</text></name>
    <questiontext format="html"><text>${cdata(q.text)}</text></questiontext>
    <generalfeedback format="html"><text>${cdata(q.general)}</text></generalfeedback>
    <penalty>0</penalty>
    <hidden>0</hidden>
    <idnumber></idnumber>
    <tags>${q.tags.map((t) => `<tag><text>${esc(t)}</text></tag>`).join('')}</tags>
  </question>`);
    });
    return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- ${esc(L.root)} · seed ${result.seed} · ${APP} -->\n<quiz>\n${out.join('\n')}\n</quiz>\n`;
  }

  /** Texto de la pregunta para la vista previa: las casillas cloze se sustituyen por campos vacíos. */
  function previewHtml(q, aria) {
    const a = esc(aria || '…');
    return q.text
      .replace(/\{1:MULTICHOICE:([^}]*)\}/g, (m, body) => `<select disabled aria-label="${a}"><option>—</option>${body.split('~').map((o) => `<option>${o.replace(/^=/, '').replace(/\\(.)/g, '$1')}</option>`).join('')}</select>`)
      .replace(/\{1:(SHORTANSWER|NUMERICAL):=[^}]*\}/g, `<input size="4" disabled aria-label="${a}">`);
  }

  const api = { generate, toXml, previewHtml, question, pageFor, pageHash, links, KINDS, LEVELS, ITEMS, APP, texts: T, encName, itemName, typeName };
  if (isNode) module.exports = api;
  else (root.GAX = root.GAX || {}).moodle = api;
})(typeof self !== 'undefined' ? self : this);
