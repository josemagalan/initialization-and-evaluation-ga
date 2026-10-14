'use strict';
// Los textos de la interfaz y de «Acerca de» existen en los dos idiomas, con los mismos parámetros.
const test = require('node:test');
const assert = require('node:assert/strict');

const i18n = require('../js/i18n.js');
global.self = global;
require('../js/about.js');
const about = global.GAX.about;

const params = (s) => (s.match(/\{(\w+)\}/g) || []).sort().join(',');

function sameShape(a, b, where) {
  assert.deepEqual(Object.keys(a).sort(), Object.keys(b).sort(), `${where}: claves distintas`);
  for (const k of Object.keys(a)) {
    if (typeof a[k] === 'string') {
      assert.ok(a[k].trim() && b[k].trim(), `${where}.${k} vacío`);
      assert.equal(params(a[k]), params(b[k]), `${where}.${k}: parámetros distintos`);
    } else sameShape(a[k], b[k], `${where}.${k}`);
  }
}

test('mismas claves y parámetros en ES y EN (interfaz)', () => sameShape(i18n.dict.es, i18n.dict.en, 'i18n'));
test('mismas claves en ES y EN («Acerca de» y pie)', () => sameShape(about.text.es, about.text.en, 'about'));

test('t sustituye parámetros y recurre al español si falta una clave', () => {
  assert.equal(i18n.t('en', 'itemsCount', { n: 2, total: 5 }), '2 available out of 5');
  assert.equal(i18n.t('fr', 'comingSoon'), 'Próximamente');
  assert.equal(i18n.t('es', 'noSuchKey'), 'noSuchKey');
});

test('cada nivel del registro tiene su nombre completo', () => {
  const registry = require('../js/registry.js');
  for (const lv of registry.LEVELS) for (const l of i18n.languages) assert.ok(i18n.dict[l][`level${lv}`], `level${lv} (${l})`);
});

test('las herramientas hermanas enlazan a la serie con el idioma', () => {
  for (const k of ['representation', 'selection', 'crossover', 'mutation']) {
    assert.match(about.sisterUrl('en', k), new RegExp(`^https://josemagalan\\.github\\.io/${k}-ga/#lang=en$`));
  }
});

test('los textos en inglés no tienen comillas españolas, comas decimales ni palabras sueltas en español', () => {
  const path = require('node:path');
  const registry = require('../js/registry.js');
  const out = [];
  /** Recoge las cadenas de las ramas `en` de un objeto (y todo lo que cuelga de ellas). */
  const collect = (o, inEn, where) => {
    if (typeof o === 'string') { if (inEn) out.push([where, o]); return; }
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) collect(v, inEn || k === 'en', `${where}.${k}`);
  };
  collect({ en: i18n.dict.en }, false, 'i18n');
  collect({ en: require('../js/practice-text.js').en }, false, 'practice');
  collect({ en: about.text.en }, false, 'about');
  collect(registry.families, false, 'registry');
  for (const it of registry.allItems()) collect(require(path.join('..', 'js', 'content', `${it.id}.js`)), false, `content.${it.id}`);
  assert.ok(out.length > 500, `${out.length} cadenas`);
  for (const [where, s] of out) {
    const text = s.replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(text, /[«»]/, where);
    assert.doesNotMatch(text, /\b\d+,(?!\d{3}\b)\d+\b/, `${where}: coma decimal en «${text.slice(0, 80)}»`);
    assert.doesNotMatch(text, /\b(?:individuo|población|aptitud|mochila|cromosoma|también|según)\b/i, where);
  }
});
