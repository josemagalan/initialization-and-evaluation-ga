'use strict';
// Accesibilidad que se puede comprobar sin navegador: contraste de los colores de texto en los dos
// temas, las reglas de js/a11y.js y algunos patrones del código que axe marcaría como errores.
// La auditoría completa (axe-core en Chromium, todas las vistas, ES/EN, claro/oscuro, 1280 y 375 px)
// se hace aparte (fase 6).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(ROOT, 'css', 'styles.css'), 'utf8');
const a11y = require('../js/a11y.js');
const pkg = require('../package.json');
global.self = global;
require('../js/about.js');

// Variables de color de :root (tema claro) y del bloque prefers-color-scheme: dark
function tokens(block) {
  const out = {};
  for (const m of block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)) out[m[1]] = m[2];
  return out;
}
const light = tokens(css.slice(css.indexOf(':root {'), css.indexOf('@media (prefers-color-scheme: dark)')));
const darkStart = css.indexOf('@media (prefers-color-scheme: dark)');
const dark = Object.assign({}, light, tokens(css.slice(darkStart, css.indexOf('\n}\n', darkStart))));

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => p - q); return (y + 0.05) / (x + 0.05); };
const mix = (a, b, p) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * p + parseInt(b.slice(i, i + 2), 16) * (1 - p)).toString(16).padStart(2, '0')).join('');

test('los colores de texto tienen contraste AA (4,5:1) sobre el fondo y las tarjetas, en los dos temas', () => {
  for (const [name, T] of [['claro', light], ['oscuro', dark]]) {
    for (const fg of ['ink', 'muted', 'p1-text', 'p2-text', 'conflict-text', 'p1-strong']) {
      for (const bg of ['bg', 'card']) {
        assert.ok(T[fg] && T[bg], `falta --${fg} o --${bg} en el tema ${name}`);
        const r = ratio(T[fg], T[bg]);
        assert.ok(r >= 4.5, `tema ${name}: --${fg} sobre --${bg} = ${r.toFixed(2)}`);
      }
    }
  }
});

test('las etiquetas de nivel (colores del libro) tienen contraste AA con su texto blanco', () => {
  for (const bg of ['#1f63b0', '#b3261e', '#1c1c1c']) assert.ok(ratio('#ffffff', bg) >= 4.5, bg);
  for (const cls of ['basic', 'advanced', 'further']) assert.match(css, new RegExp(`\\.badge-level\\.${cls} \\{`));
});

test('las palabras clave del pseudocódigo se leen sobre la línea resaltada (22 % del acento)', () => {
  assert.match(css, /\.code \.line\.current \{[^}]*color-mix\(in srgb, var\(--accent\) 22%, transparent\)/);
  assert.match(css, /\.code \.line\.current \.kw \{ color: var\(--p1-strong\); \}/);
  for (const T of [light, dark]) {
    for (const bg of ['bg', 'card']) assert.ok(ratio(T['p1-strong'], mix(T.accent, T[bg], 0.22)) >= 4.5);
  }
});

test('el texto en bermellón usa --conflict-text, no --conflict (que solo llega a 3,9:1 sobre blanco)', () => {
  for (const m of css.matchAll(/(^|[;{\s])color:\s*var\(--conflict\)/g)) assert.fail(`color: var(--conflict) en «${css.slice(m.index, m.index + 60)}»`);
});

test('zonas desplazables: solo son enfocables si de verdad desbordan', () => {
  assert.equal(a11y.overflows(640, 313), true);
  assert.equal(a11y.overflows(1098, 1098), false);
  assert.equal(a11y.overflows(1099, 1098), false, '1 px de margen por el redondeo');
  for (const sel of ['.viz-scroll', '.table-scroll', '.cmp-scroll', '.formula-math']) assert.ok(a11y.SCROLLERS.includes(sel), sel);
});

test('la figura es una imagen si no tiene controles y un grupo si los tiene', () => {
  assert.equal(a11y.vizRole(false), 'img');
  assert.equal(a11y.vizRole(true), 'group');
});

test('la versión de «Acerca de» coincide con package.json y el README anuncia el estado', () => {
  assert.ok(pkg.version.startsWith(`${global.GAX.about.VERSION}.`), `${pkg.version} frente a ${global.GAX.about.VERSION}`);
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  assert.match(readme, /Status-in_development/);
  assert.match(pkg.version, /dev/);
});
