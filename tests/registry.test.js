'use strict';
// Catálogo: dos familias, ids únicos, textos en los dos idiomas, niveles y fases válidos, codificaciones
// de representation-ga existentes y, para cada elemento disponible, sus ficheros.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const registry = require('../js/registry.js');
const { languages } = require('../js/i18n.js');
const ROOT = path.join(__dirname, '..');

const bilingual = (obj, what) => {
  for (const l of languages) assert.ok(obj && typeof obj[l] === 'string' && obj[l].trim(), `${what}: falta el texto en «${l}»`);
};

test('dos familias, primero la inicialización', () => {
  assert.deepEqual(registry.families.map((f) => f.id), ['init', 'eval']);
});

test('las seis codificaciones de representation-ga, cada una con su lógica en js/problems/', () => {
  assert.deepEqual(registry.encodings.map((e) => e.id).sort(),
    ['assignment-int', 'assignment-matrix', 'function-bits', 'function-real', 'knapsack-bits', 'tsp-perm']);
  for (const e of registry.encodings) {
    bilingual(e.name, `${e.id}.name`);
    assert.ok(fs.existsSync(path.join(ROOT, 'js', 'problems', `${e.id}.js`)), `falta js/problems/${e.id}.js`);
  }
});

test('ids únicos en familias y elementos', () => {
  const ids = registry.families.flatMap((f) => [f.id, ...f.items.map((it) => it.id)]);
  assert.equal(new Set(ids).size, ids.length);
});

test('textos bilingües, nivel, fase y codificaciones válidos', () => {
  for (const f of registry.families) {
    bilingual(f.name, `${f.id}.name`);
    bilingual(f.desc, `${f.id}.desc`);
    assert.ok(Array.isArray(f.sample) && f.sample.length > 0, `${f.id}.sample`);
    for (const it of f.items) {
      bilingual(it.name, `${it.id}.name`);
      bilingual(it.summary, `${it.id}.summary`);
      assert.ok(registry.LEVELS.includes(it.level), `${it.id}: nivel ${it.level}`);
      assert.ok(Number.isInteger(it.phase) && it.phase >= 1 && it.phase <= 4, `${it.id}: fase ${it.phase}`);
      assert.ok(it.encodings.length > 0, `${it.id}: sin codificaciones`);
      for (const e of it.encodings) assert.ok(registry.getEncoding(e), `${it.id}: codificación ${e}`);
    }
  }
});

test('cada elemento disponible tiene sus ficheros (lógica, contenido e interfaz)', () => {
  for (const it of registry.allItems().filter((x) => x.ready)) {
    for (const dir of ['items', 'content']) {
      assert.ok(fs.existsSync(path.join(ROOT, 'js', dir, `${it.id}.js`)), `falta js/${dir}/${it.id}.js`);
    }
  }
});

test('búsquedas del registro', () => {
  assert.equal(registry.getItem('uniform').family, 'init');
  assert.equal(registry.getItem('pipeline').family, 'eval');
  assert.equal(registry.getItem('nope'), null);
  assert.equal(registry.isReady('nope'), false);
  assert.equal(registry.getFamily('eval').id, 'eval');
  assert.equal(registry.getEncoding('tsp-perm').representation, 'permutation');
});
