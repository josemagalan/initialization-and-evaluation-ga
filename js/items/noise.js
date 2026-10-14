/*
 * Aptitud con ruido: cada evaluación devuelve F̃ = f + z, con z normal de media 0 y desviación σ (Talbi, 2009, §1.2.1).
 * Dos evaluaciones del mismo individuo no coinciden; la media de R evaluaciones tiene desviación σ/√R.
 *
 * Números normales por Box–Muller con dos uniformes del flujo de la población, z = σ · √(−2 ln(1 − u₁)) · cos(2π u₂),
 * redondeado a centésimas para que las cuentas se puedan seguir a mano.
 * Pares mal ordenados: pares de individuos cuyo orden por la aptitud con ruido no es el de la aptitud real.
 * Probabilidad de equivocarse al comparar dos individuos con diferencia real Δ usando medias de R evaluaciones:
 *   P = Φ(−Δ √R / (σ √2)).
 *
 * run(enc, inst, N, seed, { sigma, R }) → { pop, f, noisy (R evaluaciones por individuo), single, means, ... }
 * Funciona tanto en el navegador (window.GAX.items.noise) como en Node (module.exports).
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const S = isNode ? require('../space.js') : root.GAX.space;
  const R0 = isNode ? require('../rng.js') : root.GAX.rng;
  const U = isNode ? require('./uniform.js') : root.GAX.items.uniform;
  const F = isNode ? require('../fitness.js') : root.GAX.fitness;

  const ENCODINGS = ['function-real', 'tsp-perm'];
  const SIGMA = {
    'function-real': { min: 0, max: 100, step: 5, def: 30 },
    'tsp-perm': { min: 0, max: 40, step: 2, def: 12 },
  };
  const REPS = { min: 1, max: 20, def: 5 };

  const round2 = (v) => Math.round(v * 100) / 100 + 0;

  function normSigma(enc, v) {
    const L = SIGMA[enc] || SIGMA['function-real'];
    const n = Number(v);
    if (v == null || v === '' || !Number.isFinite(n)) return L.def;
    const k = Math.round((Math.min(L.max, Math.max(L.min, n)) - L.min) / L.step);
    return Math.round((L.min + k * L.step) * 100) / 100;
  }
  const normR = (v) => { const n = Number(v); return Number.isInteger(n) && n >= REPS.min && n <= REPS.max ? n : REPS.def; };

  /** Flujo del ruido, distinto del de la población. */
  function stream(seed) {
    return R0.mulberry32((Math.imul(R0.seedState(seed), 3266489917) ^ 0x6d2b79f5) >>> 0);
  }

  /** Ruido normal N(0, σ) por Box–Muller, redondeado a centésimas. */
  function gaussian(u1, u2, sigma) {
    return round2(sigma * Math.sqrt(-2 * Math.log(1 - u1)) * Math.cos(2 * Math.PI * u2));
  }

  /** Función de distribución normal estándar Φ (Abramowitz y Stegun, 7.1.26; error < 1,5 · 10⁻⁷). */
  function Phi(x) {
    const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2);
    return x >= 0 ? (1 + y) / 2 : (1 - y) / 2;
  }

  /** Pares (i < j) cuyo orden según v no es el de f (se minimiza). Los empates de f no cuentan. */
  function discordant(f, v) {
    let d = 0;
    for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) if (f[i] !== f[j] && (f[i] - f[j]) * (v[i] - v[j]) < 0) d++;
    return d;
  }
  const argmin = (v) => v.reduce((b, x, i) => (x < v[b] ? i : b), 0);

  /**
   * Traza. Etapas: 1 aptitud real · 2 una evaluación con ruido · 3 reevaluar al individuo 1 ·
   * 4 media de R evaluaciones · 5 coste y probabilidad de equivocarse.
   */
  function run(enc, inst, N, seed, opts) {
    const sigma = normSigma(enc, opts && opts.sigma);
    const R = normR(opts && opts.R);
    const g = U.population(enc, inst, N, seed);
    const f = g.pop.map((x) => F.evaluate(enc, inst, x).fitness);
    const next = stream(seed);
    const noisy = f.map((fi) => Array.from({ length: R }, () => {
      const u1 = next();
      const u2 = next();
      const z = gaussian(u1, u2, sigma);
      return { z, value: fi + z };
    }));
    const single = noisy.map((r) => r[0].value);
    const means = noisy.map((r) => r.reduce((a, b) => a + b.value, 0) / R);
    const order = f.map((_, i) => i).sort((i, j) => f[i] - f[j] || i - j);
    const best = order[0];
    const second = order[1];
    const gap = f[second] - f[best];
    const pWrong = (r) => (sigma === 0 ? (gap > 0 ? 0 : 0.5) : Phi(-(gap * Math.sqrt(r)) / (sigma * Math.SQRT2)));
    // R necesario para que la probabilidad de equivocarse con los dos mejores baje del 5 %
    let r95 = null;
    if (gap > 0) for (let r = 1; r <= 1000; r++) if (pWrong(r) < 0.05) { r95 = r; break; }
    const steps = [];
    const snap = (type, stage, extra) => steps.push(Object.assign({ type, stage, done: N, ind: null, draw: null, show: 'noise' }, extra));
    snap('n_true', 1, { cols: 1, layers: ['true'] });
    snap('n_one', 2, { cols: 2, layers: ['true', 'single'] });
    snap('n_rank', 2, { cols: 2, layers: ['true', 'single'], ind: argmin(single) });
    snap('n_again', 3, { cols: 2, layers: ['true', 'single', 'reps0'], ind: 0 });
    snap('n_mean', 4, { cols: 3, layers: ['true', 'single', 'mean'] });
    snap('n_cost', 5, { cols: 3, layers: ['true', 'mean'], ind: best });
    snap('n_end', 5, { cols: 3, layers: ['true', 'mean'] });
    return {
      pop: g.pop, draws: g.draws, shape: g.shape, dec: g.dec, sigma, R, f, noisy, single, means, best, second, gap,
      discSingle: discordant(f, single), discMean: discordant(f, means), pairs: (N * (N - 1)) / 2,
      bestSingle: argmin(single), bestMean: argmin(means), pWrong1: pWrong(1), pWrongR: pWrong(R), r95,
      steps, info: S.spaceInfo(enc, inst), measures: { optimum: S.optimum(enc, inst) },
    };
  }

  const api = { ENCODINGS, SIGMA, REPS, normSigma, normR, stream, gaussian, Phi, discordant, run };
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).items = root.GAX.items || {}).noise = api;
})(typeof self !== 'undefined' ? self : this);
