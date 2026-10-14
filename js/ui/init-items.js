/*
 * Páginas de las estrategias avanzadas de inicialización (fase 2): cuasialeatoria e hipercubo latino,
 * inhibición secuencial simple e inicialización factible. Cada una es un createPopulationUI (js/ui/population.js)
 * con sus controles propios, su narración y su leyenda.
 */
(function (root) {
  'use strict';
  const G = root.GAX;
  const items = (G.itemUI = G.itemUI || {});
  const fillT = (s, p) => s.replace(/\{(\w+)\}/g, (x, k) => (p[k] != null ? p[k] : x));
  const SUB = ['₁', '₂'];

  /** Número con hasta d decimales en el idioma de la página. */
  const upTo = (h, v, d) => v.toLocaleString(h.lang() === 'es' ? 'es-ES' : 'en-GB', { maximumFractionDigits: d });

  // ---------- Cuasialeatoria e hipercubo latino ----------

  /** Fracción reducida num/den como texto. */
  function frac(num, den) {
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);
    const g = gcd(num, den) || 1;
    return num === 0 ? '0' : `${num / g}/${den / g}`;
  }
  /** Binario «0,0101» (con la coma del idioma) de V / 2^L, sin ceros al final. */
  function binFrac(V, L, sep) {
    const bits = V.toString(2).padStart(L, '0').replace(/0+$/, '');
    return `0${sep}${bits || '0'}`;
  }

  items.quasi = G.createPopulationUI({
    item: 'quasi',
    variant: (state) => state.extra.method || 'halton',
    run: (enc, inst, N, seed, extra) => G.items.quasi.run(enc, inst, N, seed, { method: extra.method }),
    extraControls(c, state, h) {
      state.extra.method = state.extra.method || 'halton';
      const sel = c.select({ id: 'methodSel', labelKey: 'ctlMethod', onChange: (v) => { state.extra.method = v; h.changed('start'); } });
      state.extra.control = sel;
      state.extra.t = h.t;
      return [sel];
    },
    sync(state) {
      const sel = state.extra.control;
      if (!sel) return;
      sel.setOptions(G.items.quasi.METHODS.map((m) => ({ value: m, label: state.extra.t(`method_${m}`) })), state.extra.method);
    },
    readExtra(q, state) {
      const m = q.get('m');
      state.extra.method = G.items.quasi.METHODS.indexOf(m) !== -1 ? m : 'halton';
    },
    hashExtra: (state) => [['m', state.extra.method]],
    legend: () => [['sw-val', 'lgGene'], ['sw-active', 'lgActive'], ['sw-ghost', 'lgGhost'], ['sw-hole', 'lgHole']],
    narrate(step, state, h) {
      const m = state.model;
      const T = h.content.narration[h.lang()] || h.content.narration.es;
      const method = m.method;
      const lhs = method === 'lhs';
      const sh = m.shape;
      const N = m.pop.length;
      const a = h.fmt(sh.a);
      const w = h.fmt(sh.b - sh.a);
      const sep = h.lang() === 'es' ? ',' : '.';
      const f2 = (v) => h.fmtFixed(v, 2);
      const name = T[`m_${method}`];
      switch (step.type) {
        case 'q_space': return { key: lhs ? 'q_space_lhs' : 'q_space', params: { a, b: h.fmt(sh.b), N } };
        case 'q_rule': return lhs
          ? { key: 'q_rule_lhs', params: { p1: m.perms[0].join(', '), p2: m.perms[1].join(', '), N } }
          : { key: `q_rule_${method}`, params: { a, w } };
        case 'q_coord': {
          const d = m.draws[0][step.draw];
          const x = f2(d.x);
          if (lhs) return { key: 'q_coord_lhs', params: { g: SUB[d.d], s: d.stratum, N, v: h.fmtFixed(d.v, 3), u: upTo(h, d.u, 4), a, w, x } };
          if (method === 'sobol' && d.d === 1) {
            const L = G.items.quasi.SOBOL_BITS;
            const terms = d.terms.map((v) => `v${'₀₁₂₃₄₅'[v.k]} = ${binFrac(v.V, L, sep)}`).join(' ⊕ ');
            return { key: 'q_coord_sobol', params: { i: d.i, bits: d.i.toString(2), terms, res: binFrac(d.num, L, sep), frac: frac(d.num, d.den), u: h.fmtFixed(d.u, 3), a, w, x } };
          }
          return { key: 'q_coord_halton', params: {
            g: SUB[d.d], i: d.i, digits: d.digits.join(''), base: d.base, rev: d.digits.slice().reverse().join(''),
            frac: frac(d.num, d.den), u: h.fmtFixed(d.u, 3), a, w, x,
          } };
        }
        case 'q_ind': {
          const d = m.draws[step.ind];
          const base = { i: step.ind + 1, chrom: h.chromText(m.pop[step.ind]), q: h.qualityText(step.ind) };
          if (lhs) return { key: 'q_ind_lhs', params: Object.assign(base, { s1: d[0].stratum, s2: d[1].stratum }) };
          return { key: 'q_ind', params: Object.assign(base, { u1: h.fmtFixed(d[0].u, 3), u2: h.fmtFixed(d[1].u, 3) }) };
        }
        case 'q_pop': return { key: lhs ? 'q_pop_lhs' : 'q_pop', params: { N } };
        case 'q_hole': return { key: m.measures.coverage.hole.r <= m.uniformMeasures.coverage.hole.r ? 'q_hole' : 'q_hole_worse', params: { method: name, hq: f2(m.measures.coverage.hole.r), hu: f2(m.uniformMeasures.coverage.hole.r) } };
        case 'q_strata': {
          const q = m.measures.coverage.strata;
          const u = m.uniformMeasures.coverage.strata;
          return { key: 'q_strata', params: { method: name, N, sq1: q[0], sq2: q[1], su1: u[0], su2: u[1] } };
        }
        case 'q_dist': return { key: m.measures.minDist >= 1.5 * m.uniformMeasures.minDist ? 'q_dist' : 'q_dist_close', params: {
          method: name, qmin: f2(m.measures.minDist), umin: f2(m.uniformMeasures.minDist),
          qmean: f2(m.measures.meanDist), umean: f2(m.uniformMeasures.meanDist),
        } };
        default: return { key: lhs ? 'q_end_lhs' : 'q_end', params: { N } };
      }
    },
  });

  // ---------- Inhibición secuencial simple ----------

  items.ssi = G.createPopulationUI({
    item: 'ssi',
    variant: (state) => state.enc,
    run: (enc, inst, N, seed, extra) => G.items.ssi.run(enc, inst, N, seed, { delta: extra.delta }),
    extraControls(c, state, h) {
      const X = G.items.ssi;
      const fmt2 = (v) => v.toLocaleString(document.documentElement.lang === 'en' ? 'en-GB' : 'es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const r = c.range({
        id: 'deltaRange', labelKey: 'ctlDelta', min: X.DELTA.min, max: X.DELTA.max, step: X.DELTA.step,
        value: state.extra.delta || X.DEFAULT_DELTA[state.enc], format: fmt2,
        onInput: (v) => { state.extra.delta = Math.round(v * 100) / 100; h.changed('start'); },
      });
      state.extra.control = r;
      return [r];
    },
    sync(state) {
      const X = G.items.ssi;
      if (state.extra.deltaEnc !== state.enc) {
        if (state.extra.deltaEnc != null) state.extra.delta = X.DEFAULT_DELTA[state.enc];
        state.extra.deltaEnc = state.enc;
      }
      state.extra.delta = X.normDelta(state.enc, state.extra.delta);
      if (state.extra.control) state.extra.control.set(state.extra.delta);
    },
    readExtra(q, state) {
      state.extra.delta = G.items.ssi.normDelta(state.enc, q.get('d'));
      state.extra.deltaEnc = state.enc;
    },
    hashExtra: (state) => [['d', String(state.extra.delta)]],
    legend: (state) => {
      const sh = state.model ? state.model.shape : null;
      const genes = sh && (sh.kind === 'bits' || sh.kind === 'matrix') ? [['sw-one', 'lgOne'], ['sw-zero', 'lgZero']] : [['sw-val', 'lgGene']];
      const fn = state.enc && state.enc.startsWith('function');
      return genes.concat([['sw-cand', 'lgCandOk'], ['sw-rej', 'lgCandRej'], ['sw-near', 'lgNearest']], fn ? [['sw-delta', 'lgDelta']] : []);
    },
    narrate(step, state, h) {
      const m = state.model;
      const T = h.content.narration[h.lang()] || h.content.narration.es;
      const N = m.pop.length;
      const delta = h.fmtFixed(m.delta, 2);
      const f2 = (v) => h.fmtFixed(v, 2);
      const kind = root.GAX.space.DISTANCE_KIND[state.enc];
      switch (step.type) {
        case 'ssi_rule': return { key: 'ssi_rule', params: { delta, dist: T[`d_${kind}`], N } };
        case 'cand_ok':
        case 'cand_rej': {
          const cd = m.candidates[step.cand];
          const base = { c: step.cand + 1, chrom: h.chromText(cd.x), delta };
          if (cd.dmin == null) return { key: 'cand_ok_first', params: base };
          Object.assign(base, { d: f2(cd.dmin), near: cd.nearest + 1, i: cd.ind != null ? cd.ind + 1 : '' });
          if (!cd.accepted) return { key: 'cand_rej', params: base };
          return { key: cd.forced ? 'cand_ok_forced' : 'cand_ok', params: base };
        }
        case 'ssi_ind': {
          const cd = m.candidates[step.cand];
          const p = { i: step.ind + 1, chrom: h.chromText(cd.x), c: step.cand + 1, r: step.rejected };
          if (cd.forced) return { key: step.rejected ? 'ssi_ind_forced' : 'ssi_ind_forced_next', params: p };
          return { key: step.rejected ? 'ssi_ind_rej' : 'ssi_ind', params: p };
        }
        case 'ssi_pop': return m.forced
          ? { key: 'ssi_pop_forced', params: { forced: m.forced, N, delta } }
          : { key: 'ssi_pop', params: { N, delta, total: m.total, rej: m.total - N } };
        case 'ssi_dist': {
          const S = m.measures;
          const U = m.uniformMeasures;
          return { key: m.forced ? 'ssi_dist_forced' : 'ssi_dist', params: { delta, smin: f2(S.minDist), umin: f2(U.minDist), smean: f2(S.meanDist), umean: f2(U.meanDist), sd: S.distinct, ud: U.distinct } };
        }
        case 'ssi_cost': {
          let acc = 0;
          let comps = 0;
          m.candidates.forEach((cd) => { comps += acc; if (cd.accepted) acc++; });
          return { key: 'ssi_cost', params: { N, total: m.total, ratio: upTo(h, m.total / N, 1), comps } };
        }
        default: return { key: 'ssi_end', params: { expected: h.expectedDist() } };
      }
    },
  });

  // ---------- Inicialización factible ----------

  items.feasible = G.createPopulationUI({
    item: 'feasible',
    variant: (state) => state.enc,
    run: (enc, inst, N, seed) => G.items.feasible.run(enc, inst, N, seed),
    legend: (state) => [['sw-one', 'lgOne'], ['sw-zero', 'lgZero'], ['sw-active', state.enc === 'knapsack-bits' ? 'lgActiveItem' : 'lgActiveRow'], ['sw-empty', 'lgUndecided']]
      .concat(state.enc === 'knapsack-bits' ? [['sw-ghost', 'lgGhost']] : []),
    narrate(step, state, h) {
      const m = state.model;
      const T = h.content.narration[h.lang()] || h.content.narration.es;
      const inst = state.inst;
      const N = m.pop.length;
      const ks = state.enc === 'knapsack-bits';
      const sh = m.shape;
      const info = m.info;
      const f2 = (v) => h.fmtFixed(v, 2);
      const f = (v) => h.fmt(v);
      const F = m.measures;
      const U = m.uniformMeasures;
      switch (step.type) {
        case 'f_space': {
          const share = h.pct(info.feasible / info.chromosomes);
          if (ks) return { key: 'f_space_knapsack', params: { n: sh.length, W: inst.capacity, total: h.big(info.chromosomes), feasible: h.big(info.feasible), share, N } };
          return { key: 'f_space_matrix', params: { n: sh.n, m: sh.m, nm: sh.length, total: h.big(info.chromosomes), feasible: h.big(info.feasible), share, N } };
        }
        case 'f_rule': return ks ? { key: 'f_rule_knapsack', params: {} } : { key: 'f_rule_matrix', params: { m: sh.m } };
        case 'f_order': return { key: 'f_order', params: { order: m.details[0].perm.join(', ') } };
        case 'f_item': {
          const d = m.details[0].decisions[step.draw];
          const before = d.total - (d.fits ? d.weight : 0);
          return { key: d.fits ? 'f_item_in' : 'f_item_out', params: { item: d.item, w: d.weight, before, after: before + d.weight, W: inst.capacity } };
        }
        case 'f_row': {
          const r = m.details[0].rows[step.draw];
          return { key: 'f_row', params: { i: r.task, u: h.fmtFixed(r.u, 3), m: sh.m, j: r.j } };
        }
        case 'f_ind': return { key: 'f_ind', params: { i: step.ind + 1, chrom: h.chromText(m.pop[step.ind]), q: h.qualityText(step.ind) } };
        case 'f_pop': return { key: 'f_pop', params: { N } };
        case 'f_feas': return { key: 'f_feas', params: { ff: F.feasible, uf: U.feasible, N } };
        case 'f_dist': return { key: ks ? 'f_dist_knapsack' : 'f_dist_matrix', params: { fmean: f2(F.meanDist), umean: f2(U.meanDist), fd: F.distinct, ud: U.distinct } };
        case 'f_quality': {
          if (ks) return { key: 'f_quality_max', params: { fbest: f(F.best), fmean: upTo(h, F.mean, 1), ubest: U.best == null ? '—' : f(U.best), umean: U.mean == null ? '—' : upTo(h, U.mean, 1), opt: f(F.optimum) } };
          const uq = U.best == null ? T.uq_none : fillT(T.uq_some, { ubest: f(U.best) });
          return { key: 'f_quality_min', params: { fbest: f(F.best), fmean: upTo(h, F.mean, 1), opt: f(F.optimum), uq } };
        }
        default: return { key: ks ? 'f_end_knapsack' : 'f_end_matrix', params: {} };
      }
    },
  });
})(typeof self !== 'undefined' ? self : this);
