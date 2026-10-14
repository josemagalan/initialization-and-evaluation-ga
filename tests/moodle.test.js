'use strict';
// Bancos de Moodle: cada pregunta es un ejercicio de la práctica, con sus mismas respuestas en casillas cloze;
// los enlaces reproducen el ejercicio en la herramienta; el XML se puede importar; los niveles cambian el tamaño.
const test = require('node:test');
const assert = require('node:assert/strict');

const M = require('../js/moodle.js');
const PR = require('../js/practice.js');
const registry = require('../js/registry.js');
const S = require('../js/space.js');
global.self = global;
require('../js/i18n.js');
global.GAX = global.GAX || {};
global.GAX.i18n = require('../js/i18n.js');
const MP = require('../js/moodle-page.js');

const ALL = M.KINDS.map((k) => k.id);
const bank = M.generate({ lang: 'es', kinds: ALL, levels: M.LEVELS, count: 4, seed: 4242 });
const bankEn = M.generate({ lang: 'en', kinds: ALL, levels: M.LEVELS, count: 2, seed: 77 });

/** Casillas cloze del texto de una pregunta, en orden. */
const boxes = (text) => [...text.matchAll(/\{1:(SHORTANSWER|NUMERICAL|MULTICHOICE):([^}]*)\}/g)].map((m) => ({ type: m[1], body: m[2] }));

test('hay un tipo de pregunta por elemento, ejercicio y codificación (las copias de la semilla, sin codificación)', () => {
  let want = 0;
  for (const it of registry.allItems()) for (const ty of PR.typesFor(it.id)) want += it.id === 'seeded' && ty === 'takeover' ? 1 : it.encodings.length;
  assert.equal(M.KINDS.length, want);
  assert.equal(new Set(ALL).size, ALL.length);
  assert.ok(M.KINDS.find((k) => k.id === 'seeded:takeover').encFree);
});

test('el banco tiene los ejemplares pedidos, distintos, en todas las categorías y niveles', () => {
  assert.deepEqual(bank.missing, []);
  assert.equal(bank.questions.length, ALL.length * M.LEVELS.length * 4);
  const seen = new Set();
  for (const q of bank.questions) {
    const key = `${q.kind}|${q.level}|${JSON.stringify(q.exercise.givens)}`;
    assert.ok(!seen.has(key), `repetida: ${q.name}`);
    seen.add(key);
  }
});

test('la misma semilla da el mismo banco', () => {
  const a = M.generate({ lang: 'es', kinds: ALL.slice(0, 8), levels: ['easy', 'hard'], count: 2, seed: 99 });
  const b = M.generate({ lang: 'es', kinds: ALL.slice(0, 8), levels: ['easy', 'hard'], count: 2, seed: 99 });
  assert.equal(M.toXml(a), M.toXml(b));
});

test('cada casilla cloze lleva la respuesta del ejercicio, con la tolerancia de la práctica', () => {
  for (const q of bank.questions.concat(bankEn.questions)) {
    const bx = boxes(q.text);
    assert.equal(bx.length, q.boxes, q.name);
    let k = 0;
    q.exercise.groups.forEach((gr) => gr.items.forEach((it) => {
      const b = bx[k++];
      if (gr.kind === 'bit') assert.deepEqual([b.type, b.body], ['SHORTANSWER', `=${it.answer}`]);
      else if (gr.kind === 'yesno') {
        assert.equal(b.type, 'MULTICHOICE');
        const opts = b.body.split('~');
        assert.equal(opts.length, 2);
        assert.equal(opts.filter((o) => o.startsWith('=')).length, 1);
        assert.equal(opts[it.answer === 'yes' ? 0 : 1].startsWith('='), true, q.name);
      } else {
        assert.equal(b.type, 'NUMERICAL');
        const [ans, tol] = b.body.replace(/^=/, '').split(':').map(Number);
        assert.ok(Math.abs(ans - it.answer) < 1e-9, `${q.name}: ${ans} frente a ${it.answer}`);
        if (gr.kind === 'int') assert.equal(tol, 0);
        else { const want = PR.TOL[gr.tol || 'exact'](it.answer); assert.ok(want < 1e-5 ? tol === 0 : Math.abs(tol - want) <= 1e-5 * want, `${q.name}: tolerancia ${tol}`); }
      }
    }));
  }
});

test('los enlaces reproducen el ejercicio en la herramienta (resolución paso a paso y modo práctica)', () => {
  for (const q of bank.questions.filter((_, i) => i % 3 === 0)) {
    assert.ok(q.link.startsWith(M.APP));
    const h = new URLSearchParams(q.practiceLink.split('#')[1]);
    assert.equal(h.get('item'), q.item);
    assert.equal(h.get('practice'), q.type);
    assert.equal(h.get('lang'), 'es');
    const enc = h.get('enc');
    // Los parámetros de la instancia, como los lee la página; el resto son los propios del elemento
    const p = S.params(enc, Object.fromEntries(h));
    const x = {};
    ['K', 'm', 'd', 'tr', 'pt', 'l', 'G', 'sg', 'R', 'sm', 'w'].forEach((k) => { if (h.has(k) && p[k] == null) x[k] = h.get(k); });
    const page = { enc, p, N: Number(h.get('N')), s: Number(h.get('s')), ps: Number(h.get('ps')), x };
    const ex = PR.exercise(q.item, q.type, page);
    assert.deepEqual(PR.answerOf(ex), PR.answerOf(q.exercise), q.name);
    const steps = PR.model(q.item, page).r.steps;
    const st = Number(new URLSearchParams(q.link.split('#')[1]).get('step'));
    assert.ok(st >= 0 && st < steps.length);
    assert.ok(q.exercise.solution.types.indexOf(steps[st].type) !== -1, `${q.name}: paso ${steps[st].type}`);
  }
});

test('los niveles: más individuos o instancias más grandes en difícil que en fácil', () => {
  const size = (q) => q.page.N * 100 + (q.page.p.n || q.page.p.k || 0);
  for (const kid of ALL) {
    const easy = bank.questions.filter((q) => q.kind === kid && q.level === 'easy');
    const hard = bank.questions.filter((q) => q.kind === kid && q.level === 'hard');
    const mean = (qs) => qs.reduce((s, q) => s + size(q), 0) / qs.length;
    const k = M.KINDS.find((x) => x.id === kid);
    if (k.item === 'quasi') continue;   // fácil y difícil con N parecidos: lo que cambia es el método
    assert.ok(mean(hard) >= mean(easy), kid);
  }
  // Ajustes propios del nivel
  const of = (kid, lv) => bank.questions.filter((q) => q.kind === kid && q.level === lv);
  assert.ok(of('objective:transform:tsp-perm', 'easy').every((q) => q.page.x.tr === 'cmax'));
  assert.ok(of('objective:transform:tsp-perm', 'hard').every((q) => q.page.x.tr === 'rank'));
  assert.ok(of('penalty:penalize:knapsack-bits', 'hard').every((q) => q.page.x.pt === 'quadratic'));
  assert.ok(of('quasi:quasi:function-real', 'hard').every((q) => q.page.x.m === 'lhs'));
  assert.ok(of('surrogate:predict:function-real', 'hard').every((q) => q.page.x.sm === 'idw'));
  assert.ok(of('penalty:penalize:assignment-matrix', 'medium').every((q) => q.exercise.groups.find((g) => g.id === 'v').items.some((it) => it.answer > 0)));
});

test('filtros: sin distancias en el filo de δ, sin empates ajustados en el vecino más cercano, con algún rechazo o acierto de caché', () => {
  for (const q of bank.questions) {
    const ans = (id) => q.exercise.groups.find((g) => g.id === id).items.map((it) => it.answer);
    if (q.item === 'ssi' && q.enc.startsWith('function')) {
      const delta = Number(q.page.x.d);
      assert.ok(ans('dmin').every((d) => Math.abs(d - delta) >= 0.006), q.name);
    }
    if (q.item === 'ssi' && q.level !== 'easy') assert.ok(ans('acc').indexOf('no') !== -1, q.name);
    if (q.item === 'cost' && q.level !== 'easy') assert.ok(ans('new').indexOf('no') !== -1, q.name);
    if (q.item === 'penalty') assert.ok(ans('v').some((v) => v === 0) && ans('v').some((v) => v > 0), q.name);
  }
});

test('el XML: una categoría antes de cada grupo de preguntas, CDATA bien cerrado y etiquetas equilibradas', () => {
  const xml = M.toXml(bank);
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.equal((xml.match(/<question type="cloze">/g) || []).length, bank.questions.length);
  assert.equal((xml.match(/<question /g) || []).length, (xml.match(/<\/question>/g) || []).length);
  assert.equal((xml.match(/<!\[CDATA\[/g) || []).length, (xml.match(/\]\]>/g) || []).length);
  const cats = [...xml.matchAll(/<text>\$course\$\/top\/([^<]+)<\/text>/g)].map((m) => m[1]);
  assert.equal(new Set(cats).size, ALL.length * M.LEVELS.length);
  assert.ok(cats.every((c) => c.split('/').length === 4 && c.startsWith('Inicialización y evaluación/')), cats[0]);
  // Fuera de CDATA no hay & sin escapar
  const outside = xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
  assert.doesNotMatch(outside, /&(?!amp;|lt;|gt;|quot;)/);
});

test('las preguntas en inglés no tienen textos en español ni parámetros sin rellenar', () => {
  for (const q of bankEn.questions) {
    assert.doesNotMatch(q.text + q.general, /\{\w+\}/, q.name);
    assert.doesNotMatch(q.text, /Calcula|individuo|Aptitud|Respuesta/, q.name);
    assert.match(q.general, /step-by-step/);
  }
});

test('la vista previa sustituye todas las casillas', () => {
  for (const q of bank.questions.slice(0, 60)) {
    const html = M.previewHtml(q, 'Casilla');
    assert.doesNotMatch(html, /\{1:/);
    assert.equal((html.match(/<input|<select/g) || []).length, q.boxes);
  }
});

test('la página del generador tiene los mismos textos en ES y EN', () => {
  const es = MP.text.es;
  const en = MP.text.en;
  assert.deepEqual(Object.keys(es).sort(), Object.keys(en).sort());
  assert.equal(es.how.length, en.how.length);
  assert.deepEqual(Object.keys(M.texts.es).sort(), Object.keys(M.texts.en).sort());
});
