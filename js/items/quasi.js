/*
 * Inicialización cuasialeatoria (Halton, Sobol) y por hipercubo latino en la función continua (vector de reales).
 *
 * Cada individuo i = 1, …, N es un punto u = (u₁, u₂) del cuadrado unidad, que se lleva a la caja como
 * xⱼ = a + uⱼ (b − a), redondeado a centésimas (como en la inicialización uniforme):
 *   Halton        u₁ = φ₂(i), u₂ = φ₃(i): el inverso radical de i en base 2 y en base 3 (se dan la vuelta
 *                 a los dígitos de i detrás de la coma). Determinista: no usa números aleatorios.
 *   Sobol         u₁ = φ₂(i) y u₂ = ⊕ vₖ para cada bit k de i que vale 1 (versión directa, sin código Gray),
 *                 con los números directores del polinomio x + 1: mₖ = 2 mₖ₋₁ ⊕ mₖ₋₁, m₁ = 1, vₖ = mₖ / 2ᵏ.
 *                 Determinista.
 *   Hipercubo     cada eje se divide en N estratos iguales; dos permutaciones aleatorias π₁, π₂ (Fisher–Yates)
 *   latino        deciden el estrato de cada individuo en cada eje y, dentro de él, un número v uniforme:
 *                 uⱼ = (πⱼ(i) − 1 + vⱼ) / N. Así cada estrato de cada eje recibe exactamente un individuo.
 *                 El redondeo a centésimas se hace dentro del estrato.
 * Se empieza en i = 1 porque el punto 0 de Halton y Sobol es la esquina (0, 0).
 *
 * run(...) devuelve, además de la población, la población uniforme de N individuos con la misma semilla y las
 * medidas de las dos, para compararlas.
 * Funciona tanto en el navegador (window.GAX.items.quasi) como en Node (module.exports).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const S = isNode ? require('../space.js') : root.GAX.space;
  const U = isNode ? require('./uniform.js') : root.GAX.items.uniform;
  const Fn = isNode ? require('../func.js') : root.GAX.func;

  const ENCODINGS = ['function-real'];
  const METHODS = ['halton', 'sobol', 'lhs'];
  const DEC = 3;            // decimales de los números aleatorios del hipercubo latino
  const SOBOL_BITS = 5;     // N ≤ 20 < 2⁵

  const round2 = (v) => Math.round(v * 100) / 100 + 0;

  /** Inverso radical de i en base b: { num, den, u, digits } (digits: los de i en base b, el más significativo primero). */
  function radicalInverse(i, b) {
    const digits = [];
    let n = i;
    while (n > 0) { digits.unshift(n % b); n = Math.floor(n / b); }
    let num = 0;
    let den = 1;
    for (let j = digits.length - 1; j >= 0; j--) { num = num * b + digits[j]; den *= b; }
    return { num, den, u: num / den, digits };
  }

  /** Números directores de Sobol (segunda coordenada) como enteros sobre 2^SOBOL_BITS: mₖ y Vₖ = mₖ · 2^(L − k). */
  function sobolDirections(L) {
    const m = [1];
    for (let k = 1; k < L; k++) m.push((2 * m[k - 1]) ^ m[k - 1]);
    return m.map((mk, k) => ({ k: k + 1, m: mk, V: mk * Math.pow(2, L - k - 1) }));
  }
  const DIRS = sobolDirections(SOBOL_BITS);

  /** Segunda coordenada de Sobol del punto i: { num, den, u, bits (de i, el menos significativo primero), terms }. */
  function sobol2(i) {
    const bits = [];
    let n = i;
    while (n > 0) { bits.push(n % 2); n = Math.floor(n / 2); }
    let acc = 0;
    const terms = [];
    bits.forEach((b, k) => { if (b) { acc ^= DIRS[k].V; terms.push(DIRS[k]); } });
    const den = Math.pow(2, SOBOL_BITS);
    return { num: acc, den, u: acc / den, bits, terms };
  }

  /** Real de la caja a partir de u (a + u (b − a), en centésimas). */
  const toBox = (u, a, b) => round2(a + u * (b - a));

  /** Lleva x (en centésimas) al estrato s (0…N − 1) de [a, b] si el redondeo lo ha sacado. */
  function intoStratum(x, s, N, a, b) {
    const st = (v) => S.stratumOf((v - a) / (b - a), N);
    let y = x;
    while (st(y) < s) y = round2(y + 0.01);
    while (st(y) > s) y = round2(y - 0.01);
    return y;
  }

  /** Permutación de 1…N por Fisher–Yates con los números `next`: { perm, draws }. */
  function shuffle(N, next) {
    const perm = Array.from({ length: N }, (_, i) => i + 1);
    const draws = [];
    for (let k = N; k >= 2; k--) {
      const u = next();
      const j = 1 + Math.floor(u * k);
      [perm[k - 1], perm[j - 1]] = [perm[j - 1], perm[k - 1]];
      draws.push({ u, k, j });
    }
    return { perm, draws };
  }

  /**
   * Población de N puntos con el método dado. Devuelve { pop, draws, shape, dec, perms }:
   * draws[i] = [coordenada 1, coordenada 2], cada una { d, u, x, ... detalle del método }.
   */
  function population(enc, inst, N, seed, method) {
    const sh = S.shape(enc, inst);
    const a = sh.a;
    const b = sh.b;
    const pop = [];
    const draws = [];
    let perms = null;
    if (method === 'lhs') {
      const next = U.stream(seed, DEC);
      perms = [shuffle(N, next), shuffle(N, next)];
      for (let i = 0; i < N; i++) {
        const row = [0, 1].map((d) => {
          const v = next();
          const s = perms[d].perm[i];
          const u = (s - 1 + v) / N;
          const x = intoStratum(toBox(u, a, b), s - 1, N, a, b);
          return { d, u, v, stratum: s, x };
        });
        draws.push(row);
        pop.push(row.map((r) => r.x));
      }
    } else {
      for (let i = 1; i <= N; i++) {
        const c1 = Object.assign({ d: 0, base: 2 }, radicalInverse(i, 2));
        const c2 = method === 'sobol' ? Object.assign({ d: 1 }, sobol2(i)) : Object.assign({ d: 1, base: 3 }, radicalInverse(i, 3));
        const row = [c1, c2].map((c) => Object.assign(c, { i, x: toBox(c.u, a, b) }));
        draws.push(row);
        pop.push(row.map((r) => r.x));
      }
    }
    return { pop, draws, shape: sh, dec: DEC, perms: perms && perms.map((p) => p.perm), permDraws: perms && perms.map((p) => p.draws) };
  }

  /**
   * Traza. Etapas: 1 la caja · 2 la regla del método · 3 primer individuo, coordenada a coordenada ·
   * 4 el resto de la población · 5 cobertura y diversidad frente a la población uniforme.
   */
  function run(enc, inst, N, seed, opts) {
    const method = METHODS.indexOf(opts && opts.method) !== -1 ? opts.method : 'halton';
    const g = population(enc, inst, N, seed, method);
    const u = U.population(enc, inst, N, seed);
    const measures = S.measures(enc, inst, g.pop);
    const uniformMeasures = S.measures(enc, inst, u.pop);
    const steps = [];
    const snap = (type, stage, extra) => steps.push(Object.assign({ type, stage, done: 0, ind: null, draw: null }, extra));
    snap('q_space', 1, { grid: method === 'lhs' ? 'strata' : null });
    snap('q_rule', 2, { grid: method === 'lhs' ? 'strata' : null });
    snap('q_coord', 3, { ind: 0, draw: 0, grid: method === 'lhs' ? 'strata' : null });
    snap('q_coord', 3, { ind: 0, draw: 1, grid: method === 'lhs' ? 'strata' : null });
    snap('first', 3, { ind: 0, done: 1, grid: method === 'lhs' ? 'strata' : null });
    for (let i = 1; i < N; i++) snap('q_ind', 4, { ind: i, done: i + 1, grid: method === 'lhs' ? 'strata' : null });
    snap('q_pop', 4, { done: N, grid: method === 'lhs' ? 'strata' : null });
    snap('q_hole', 5, { done: N, hole: true, ghost: true });
    snap('q_strata', 5, { done: N, grid: 'strata', ghost: true });
    snap('q_dist', 5, { done: N, show: 'distance' });
    snap('q_end', 5, { done: N, ghost: true });
    return {
      method, pop: g.pop, draws: g.draws, shape: g.shape, dec: g.dec, perms: g.perms, permDraws: g.permDraws,
      uniformPop: u.pop, measures, uniformMeasures, info: S.spaceInfo(enc, inst), steps,
      columns: ['mUniformPop', `mPop_${method}`],
      fn: Fn.fnOf(inst.fn).id,
    };
  }

  const api = { ENCODINGS, METHODS, DEC, SOBOL_BITS, DIRS, radicalInverse, sobolDirections, sobol2, toBox, intoStratum, shuffle, population, run };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).items = root.GAX.items || {}).quasi = api;
})(typeof self !== 'undefined' ? self : this);
