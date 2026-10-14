/*
 * Inicialización aleatoria uniforme de una población de N individuos, gen a gen.
 *
 * Cada número aleatorio u ∈ [0, 1) se trunca a DEC decimales y el gen se calcula con ese u, de modo que
 * la regla se puede comprobar a mano con los números que muestra la herramienta:
 *   bits (mochila, matriz, función binaria): gen = 1 si u < 0,5; si no, 0
 *   enteros 1…m (asignación):                gen = 1 + ⌊u · m⌋
 *   real en [a, b] (función):                x = a + u (b − a), redondeado a centésimas
 *   permutación (viajante), Fisher–Yates:    π = (1, …, n); para k = n, …, 2: j = 1 + ⌊u · k⌋, intercambiar π[k] y π[j]
 *
 * run(...) devuelve { pop, draws, steps, measures, info }: la población, los sorteos de cada individuo,
 * la traza paso a paso y las medidas de diversidad y calidad (js/space.js).
 * Funciona tanto en el navegador (window.GAX.items.uniform) como en Node (module.exports).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const R = isNode ? require('../rng.js') : root.GAX.rng;
  const S = isNode ? require('../space.js') : root.GAX.space;

  /** Decimales con que se muestra (y se usa) cada número aleatorio. */
  // Con 3 decimales, cada resultado de ⌊u · k⌋ (k ≤ 10) recibe ⌊1000/k⌋ o ⌈1000/k⌉ de los 1000 valores posibles de u:
  // un sesgo de una milésima como mucho, que los tests comprueban exactamente.
  const DEC = { bits: 2, int: 3, matrix: 2, perm: 3, real: 3 };
  const P_BIT = 0.5;

  const trunc = (v, d) => Math.floor(v * Math.pow(10, d)) / Math.pow(10, d);
  const round2 = (v) => Math.round(v * 100) / 100 + 0;   // + 0: sin −0

  /** Flujo de números aleatorios de la población, distinto del de la instancia, ya truncados. */
  function stream(seed, dec) {
    const r = R.mulberry32((Math.imul(R.seedState(seed), 2654435761) ^ 0x7f4a7c15) >>> 0);
    return () => trunc(r(), dec);
  }

  // ---------- Las reglas, una por tipo de gen (las mismas que el código descargable) ----------

  const bitGene = (u, p) => (u < (p == null ? P_BIT : p) ? 1 : 0);
  const intGene = (u, m) => 1 + Math.floor(u * m);
  const realGene = (u, a, b) => round2(a + u * (b - a));

  /** Un individuo: { x, draws }. `next` da el siguiente u. */
  function individual(sh, next) {
    const draws = [];
    if (sh.kind === 'perm') {
      const x = Array.from({ length: sh.length }, (_, i) => i + 1);
      for (let k = sh.length; k >= 2; k--) {
        const u = next();
        const j = 1 + Math.floor(u * k);
        const before = x.slice();
        [x[k - 1], x[j - 1]] = [x[j - 1], x[k - 1]];
        draws.push({ u, k, j, before, after: x.slice() });
      }
      return { x, draws };
    }
    const x = [];
    for (let g = 0; g < sh.length; g++) {
      const u = next();
      let v;
      if (sh.kind === 'int') v = intGene(u, sh.m);
      else if (sh.kind === 'real') v = realGene(u, sh.a, sh.b);
      else v = bitGene(u);
      x.push(v);
      draws.push({ u, g, value: v });
    }
    return { x, draws };
  }

  /** Población de N individuos con la semilla `seed`. */
  function population(enc, inst, N, seed) {
    const sh = S.shape(enc, inst);
    const next = stream(seed, DEC[sh.kind]);
    const out = [];
    for (let i = 0; i < N; i++) out.push(individual(sh, next));
    return { pop: out.map((o) => o.x), draws: out.map((o) => o.draws), shape: sh, dec: DEC[sh.kind] };
  }

  /**
   * Traza paso a paso. Etapas: 1 espacio de búsqueda · 2 regla · 3 primer individuo, sorteo a sorteo ·
   * 4 el resto de la población, individuo a individuo · 5 diversidad y calidad.
   */
  function run(enc, inst, N, seed) {
    const g = population(enc, inst, N, seed);
    const sh = g.shape;
    const info = S.spaceInfo(enc, inst);
    const M = S.measures(enc, inst, g.pop);
    const steps = [];
    const snap = (type, stage, extra) => steps.push(Object.assign({ type, stage, done: 0, ind: null, draw: null }, extra));

    snap('space', 1, {});
    snap('rule', 2, {});
    g.draws[0].forEach((d, k) => snap(sh.kind === 'perm' ? 'swap' : 'gene', 3, { ind: 0, draw: k, done: 0 }));
    snap('first', 3, { ind: 0, done: 1 });
    for (let i = 1; i < N; i++) snap('ind', 4, { ind: i, done: i + 1 });
    snap('pop', 4, { done: N });
    snap('feasible', 5, { done: N, show: 'quality' });
    snap('distance', 5, { done: N, show: 'distance' });
    snap('quality', 5, { done: N, show: 'quality' });
    return { pop: g.pop, draws: g.draws, shape: sh, dec: g.dec, info, measures: M, steps };
  }

  const api = { DEC, P_BIT, trunc, stream, bitGene, intGene, realGene, individual, population, run };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).items = root.GAX.items || {}).uniform = api;
})(typeof self !== 'undefined' ? self : this);
