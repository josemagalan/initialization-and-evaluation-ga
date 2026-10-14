/*
 * Páginas de la evaluación avanzada (fase 4): paisaje de aptitud, aptitud con ruido, aptitud aproximada y varios
 * objetivos. Cada una es un createPopulationUI (js/ui/population.js) con sus controles, columnas, tarjeta,
 * narración y leyenda; los paneles están en js/viz/eval-panels.js.
 */
(function (root) {
  'use strict';
  const G = root.GAX;
  const items = (G.itemUI = G.itemUI || {});

  // ---------- Utilidades comunes ----------

  function fo(h, enc, v) {
    if (v == null) return '—';
    if (enc === 'tsp-perm') return h.fmtFixed(v, 1);
    if (enc.startsWith('function')) return h.fmtFixed(v, 2);
    return h.fmt(v);
  }
  const list = (xs) => (xs.length ? xs.map((i) => `I${i + 1}`).join(', ') : '—');
  const relabel = (el, t) => el.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
  const geneLegend = (state) => {
    const sh = state.model ? state.model.shape : null;
    return sh && (sh.kind === 'bits' || sh.kind === 'matrix') ? [['sw-one', 'lgOne'], ['sw-zero', 'lgZero']] : [['sw-val', 'lgGeneVal']];
  };
  const fill = (s, p) => s.replace(/\{(\w+)\}/g, (x, k) => (p[k] != null ? p[k] : x));

  /** Tarjeta de rótulos y valores que se rehace en cada paso. */
  function kvCard(c, titleKey, noteKey) {
    const card = c.card(titleKey, noteKey);
    const wrap = c.el('div', 'table-scroll');
    const table = c.el('table', 'measures eval-table');
    wrap.append(table);
    card.append(wrap);
    return {
      el: card,
      set(rows) {
        const tb = c.el('tbody');
        rows.forEach(([k, v, cls]) => {
          const tr = c.el('tr', cls || null);
          const th = c.el('th', null, { scope: 'row' });
          th.textContent = k;
          const td = c.el('td');
          td.textContent = v;
          tr.append(th, td);
          tb.append(tr);
        });
        table.replaceChildren(tb);
      },
    };
  }

  /** Rango numérico de un control con su rejilla. */
  const fmtNum = (v) => v.toLocaleString(document.documentElement.lang === 'en' ? 'en-GB' : 'es-ES', { maximumFractionDigits: 2 });

  // ---------- Paisaje de aptitud ----------

  const NB_KIND = (enc) => (enc === 'tsp-perm' ? 'perm' : enc === 'assignment-int' ? 'int' : enc === 'assignment-matrix' ? 'matrix' : enc === 'function-real' ? 'real' : 'bits');

  items.landscape = G.createPopulationUI({
    item: 'landscape',
    noCompare: true,
    variant: (state) => state.enc,
    run: (enc, inst, N, seed) => G.items.landscape.run(enc, inst, N, seed),
    augment(model, state, h) {
      const enc = state.enc;
      model.gridColumns = (step) => [
        { head: h.t('pvColFitness'), width: 76, shown: true, cell: (i) => ({ text: fo(h, enc, model.fits[i]), cls: model.evals[i].violation ? 'infeasible' : '' }) },
        { head: h.t('pvColEnd'), width: 76, shown: !!step.ends, cell: (i) => (step.ends ? { text: fo(h, enc, model.climbs[i].endFit), cls: model.climbs[i].optimum ? 'best' : '' } : null) },
        { head: h.t('pvColSteps'), width: 52, shown: !!step.ends, cell: (i) => (step.ends ? { text: String(model.climbs[i].steps) } : null) },
      ];
    },
    extra(c, h) {
      const card = kvCard(c, 'lsTitle', 'lsNote');
      return {
        el: card.el,
        render(step) {
          relabel(card.el, h.t);
          const m = h.state.model;
          const enc = h.state.enc;
          const T = h.content.narration[h.lang()] || h.content.narration.es;
          const N = m.pop.length;
          const rows = [[h.t('lsRowNeigh'), T[`nb_${NB_KIND(enc)}`]]];
          if (step.stage >= 2) rows.push([h.t('lsRowNeighI1'), h.t('lsNeighVal', { k: m.neighbours.list.length, b: m.neighbours.better })]);
          if (step.stage >= 3) rows.push([h.t('lsRowClimb'), h.t('lsClimbVal', { s: m.climbs[0].steps, F: fo(h, enc, m.climbs[0].endFit) })]);
          if (step.stage >= 4) {
            rows.push([h.t('lsRowEnds'), h.t('lsEndsVal', { d: m.distinctEnds, N })]);
            rows.push([h.t('lsRowReached'), `${m.reached} / ${N}`, m.reached ? 'strong' : 'bad']);
          }
          if (step.stage >= 5) {
            rows.push([h.t('lsRowFdc'), m.fdc.r == null ? '—' : h.fmtFixed(m.fdc.r, 2), 'strong']);
            rows.push([h.t('lsRowLocal'), m.landscape ? h.t('lsLocalVal', { l: h.big(m.landscape.local), s: h.big(m.landscape.states) }) : h.t('lsLocalNone')]);
          }
          card.set(rows);
        },
      };
    },
    legend: (state) => geneLegend(state).concat([['sw-nb-better', 'lgNbBetter'], ['sw-nb-worse', 'lgNbWorse'], ['sw-climb', 'lgClimb'], ['sw-end-ok', 'lgEndOk'], ['sw-sample', 'lgSample']]),
    narrate(step, state, h) {
      const m = state.model;
      const enc = state.enc;
      const N = m.pop.length;
      const T = h.content.narration[h.lang()] || h.content.narration.es;
      const nb = m.neighbours;
      const f = (v) => fo(h, enc, v);
      switch (step.type) {
        case 'l_space': return { key: 'l_space', params: { nbdesc: T[`nb_${NB_KIND(enc)}`], k: nb.list.length, N } };
        case 'l_neigh': {
          const base = { k: nb.list.length, b: nb.better, F: f(nb.fit), chrom: h.chromText(m.pop[0]) };
          if (enc === 'function-real') return { key: nb.better ? 'l_neigh_real' : 'l_neigh_real_local', params: Object.assign(base, { x1: h.fmtFixed(m.pop[0][0], 2), x2: h.fmtFixed(m.pop[0][1], 2) }) };
          if (!nb.better) return { key: 'l_neigh_local', params: base };
          const best = nb.list[nb.best];
          Object.assign(base, { label: best.label, bestF: f(best.fit) });
          if (enc === 'function-bits') {
            const p0 = G.space.point(enc, state.inst, m.pop[0]);
            const jump = Math.max(...nb.list.map((n) => { const p = G.space.point(enc, state.inst, n.x); return Math.hypot(p[0] - p0[0], p[1] - p0[1]); }));
            return { key: 'l_neigh_fbits', params: Object.assign(base, { jump: h.fmtFixed(jump, 2) }) };
          }
          return { key: 'l_neigh', params: base };
        }
        case 'l_climb': {
          const c = m.climbs[0];
          const p = { s: c.steps, F0: f(c.path[0].fit), F1: f(c.endFit), opt: f(m.measures.optimum) };
          if (c.steps === 0) return { key: 'l_climb_zero', params: p };
          return { key: c.optimum ? 'l_climb_opt' : 'l_climb_local', params: p };
        }
        case 'l_pop': {
          const mean = m.climbs.reduce((a, c) => a + c.steps, 0) / N;
          return { key: m.reached === N ? 'l_pop_all' : m.reached ? 'l_pop' : 'l_pop_none', params: { N, d: m.distinctEnds, r: m.reached, mean: h.fmtFixed(mean, 1) } };
        }
        case 'l_fdc': {
          const r = m.fdc.r;
          if (r == null) return { key: 'l_fdc_none', params: {} };
          const key = r >= 0.15 ? 'l_fdc_easy' : r <= -0.15 ? 'l_fdc_mislead' : 'l_fdc_flat';
          return { key, params: { r: h.fmtFixed(r, 2), n: G.items.landscape.SAMPLE } };
        }
        default: {
          const L = m.landscape;
          if (!L) return { key: 'l_end_nocount', params: {} };
          return { key: 'l_end_count', params: { l: h.big(L.local), s: h.big(L.states), g: L.global } };
        }
      }
    },
  });

  // ---------- Aptitud con ruido ----------

  items.noise = G.createPopulationUI({
    item: 'noise',
    noCompare: true,
    variant: () => 'noise',
    run: (enc, inst, N, seed, extra) => G.items.noise.run(enc, inst, N, seed, { sigma: extra.sigma, R: extra.R }),
    extraControls(c, state, h) {
      const X = G.items.noise;
      const L = X.SIGMA[state.enc] || X.SIGMA['function-real'];
      const s = c.range({ id: 'sigmaRange', labelKey: 'ctlSigma', min: L.min, max: L.max, step: L.step, value: state.extra.sigma == null ? L.def : state.extra.sigma, format: fmtNum,
        onInput: (v) => { state.extra.sigma = X.normSigma(state.enc, v); h.changed('start'); } });
      state.extra.R = X.normR(state.extra.R);
      const r = c.range({ id: 'repsRange', labelKey: 'ctlReps', min: X.REPS.min, max: X.REPS.max, value: state.extra.R, onInput: (v) => { state.extra.R = v; h.changed('start'); } });
      state.extra.srange = s;
      state.extra.rrange = r;
      return [s, r];
    },
    sync(state) {
      const X = G.items.noise;
      if (state.extra.sigmaEnc !== state.enc) {
        if (state.extra.sigmaEnc != null) state.extra.sigma = X.SIGMA[state.enc].def;
        state.extra.sigmaEnc = state.enc;
      }
      state.extra.sigma = X.normSigma(state.enc, state.extra.sigma);
      const s = state.extra.srange;
      if (s) {
        const L = X.SIGMA[state.enc];
        s.input.min = L.min; s.input.max = L.max; s.input.step = L.step;
        s.set(state.extra.sigma);
      }
      if (state.extra.rrange) state.extra.rrange.set(state.extra.R);
    },
    readExtra(q, state) {
      const X = G.items.noise;
      state.extra.sigma = X.normSigma(state.enc, q.get('sg'));
      state.extra.sigmaEnc = state.enc;
      state.extra.R = X.normR(q.get('R'));
    },
    hashExtra: (state) => [['sg', String(state.extra.sigma)], ['R', String(state.extra.R)]],
    augment(model, state, h) {
      const enc = state.enc;
      model.gridColumns = (step) => [
        { head: h.t('pvColTrue'), width: 74, shown: true, cell: (i) => ({ text: fo(h, enc, model.f[i]) }) },
        { head: h.t('pvColNoisy'), width: 74, shown: (step.cols || 0) >= 2, cell: (i) => ((step.cols || 0) >= 2 ? { text: fo(h, enc, model.single[i]), cls: 'hit' } : null) },
        { head: h.t('pvColMean', { R: model.R }), width: 80, shown: (step.cols || 0) >= 3, cell: (i) => ((step.cols || 0) >= 3 ? { text: fo(h, enc, model.means[i]), cls: 'best' } : null) },
      ];
    },
    extra(c, h) {
      const card = kvCard(c, 'nzTitle', 'nzNote');
      return {
        el: card.el,
        render(step) {
          relabel(card.el, h.t);
          const m = h.state.model;
          const N = m.pop.length;
          const pc = (p) => `${h.fmtFixed(100 * p, 1)}${h.lang() === 'es' ? ' %' : '%'}`;
          const rows = [[h.t('nzRowSigma'), h.fmt(m.sigma)], [h.t('nzRowR'), String(m.R)]];
          if (step.stage >= 2) rows.push([h.t('nzRowDisc1'), h.t('nzDiscVal', { d: m.discSingle, p: m.pairs })]);
          if (step.stage >= 4) rows.push([h.t('nzRowDiscR', { R: m.R }), h.t('nzDiscVal', { d: m.discMean, p: m.pairs }), 'strong']);
          if (step.stage >= 5) {
            rows.push([h.t('nzRowWrong'), h.t('nzWrongVal', { p1: pc(m.pWrong1), pR: pc(m.pWrongR), R: m.R })]);
            rows.push([h.t('nzRowR95'), m.sigma === 0 ? '1' : m.r95 == null ? h.t('nzR95None') : String(m.r95)]);
            rows.push([h.t('nzRowCost'), h.t('nzCostVal', { NR: N * m.R, N })]);
          }
          card.set(rows);
        },
      };
    },
    legend: (state) => geneLegend(state).concat([['sw-truetick', 'lgTrue'], ['sw-single', 'lgSingle'], ['sw-rep', 'lgRep'], ['sw-mean', 'lgMean'], ['sw-ci', 'lgCi']]),
    narrate(step, state, h) {
      const m = state.model;
      const enc = state.enc;
      const N = m.pop.length;
      const f = (v) => fo(h, enc, v);
      const pc = (p) => h.fmtFixed(100 * p, 1);
      switch (step.type) {
        case 'n_true': return { key: 'n_true', params: { N, b: m.best + 1, fb: f(m.f[m.best]), sigma: h.fmt(m.sigma) } };
        case 'n_one': return { key: m.sigma === 0 ? 'n_one_zero' : 'n_one', params: { sigma: h.fmt(m.sigma), z: h.fmtFixed(m.noisy[0][0].z, 2), f: f(m.f[0]), F: f(m.single[0]) } };
        case 'n_rank': {
          const p = { d: m.discSingle, pairs: m.pairs, bs: m.bestSingle + 1, b: m.best + 1, fs: f(m.f[m.bestSingle]) };
          return { key: m.bestSingle === m.best ? 'n_rank_ok' : 'n_rank_bad', params: p };
        }
        case 'n_again': {
          const vals = m.noisy[0].map((r) => f(r.value)).join('; ');
          return { key: m.R === 1 ? 'n_again_one' : 'n_again', params: { R: m.R, vals, mean: f(m.means[0]), f: f(m.f[0]), se: h.fmtFixed(m.sigma / Math.sqrt(m.R), 2), sigma: h.fmt(m.sigma) } };
        }
        case 'n_mean': return { key: m.discMean < m.discSingle ? 'n_mean' : 'n_mean_same', params: { R: m.R, d1: m.discSingle, dR: m.discMean, pairs: m.pairs, bm: m.bestMean + 1 } };
        case 'n_cost': {
          const p = { N, R: m.R, NR: N * m.R, gap: f(m.gap), b: m.best + 1, s: m.second + 1, p1: pc(m.pWrong1), pR: pc(m.pWrongR), r95: m.r95 };
          if (m.sigma === 0) return { key: 'n_cost_zero', params: p };
          return { key: m.r95 == null ? 'n_cost_never' : 'n_cost', params: p };
        }
        default: return { key: 'n_end', params: {} };
      }
    },
  });

  // ---------- Aptitud aproximada ----------

  items.surrogate = G.createPopulationUI({
    item: 'surrogate',
    noCompare: true,
    variant: (state) => state.extra.method || 'nn',
    run: (enc, inst, N, seed, extra) => G.items.surrogate.run(enc, inst, N, seed, { method: extra.method }),
    extraControls(c, state, h) {
      state.extra.method = state.extra.method || 'nn';
      const sel = c.select({ id: 'surrogateSel', labelKey: 'ctlSurrogate', onChange: (v) => { state.extra.method = v; h.changed('start'); } });
      state.extra.sel = sel;
      state.extra.t = h.t;
      return [sel];
    },
    sync(state) {
      if (state.extra.sel) state.extra.sel.setOptions(G.items.surrogate.METHODS.map((k) => ({ value: k, label: state.extra.t(`sm_${k}`) })), state.extra.method);
    },
    readExtra(q, state) {
      const k = q.get('sm');
      state.extra.method = G.items.surrogate.METHODS.indexOf(k) !== -1 ? k : 'nn';
    },
    hashExtra: (state) => [['sm', state.extra.method]],
    augment(model, state, h) {
      const enc = state.enc;
      const S = G.space;
      model.gens = [
        { pop: model.pop, quality: model.pop.map((x) => S.quality(enc, state.inst, x)) },
        { pop: model.cands, quality: model.cands.map((x) => S.quality(enc, state.inst, x)) },
      ];
      const isCand = (step) => step.gen === 1;
      model.gridColumns = (step) => [
        { head: h.t('pvColPred'), width: 74, shown: true,
          cell: (i) => (isCand(step) && (step.stage >= 4 || i === step.predOnly) ? { text: fo(h, enc, model.pred[i]), cls: 'hit' } : null) },
        { head: h.t('pvColReal'), width: 74, shown: true,
          cell: (i) => (!isCand(step) ? { text: fo(h, enc, model.archive[i].fit) } : step.stage >= 4 ? { text: fo(h, enc, model.truth[i]) } : null) },
        { head: h.t('pvColPre'), width: 64, shown: !!step.presel,
          cell: (i) => (step.presel && isCand(step) && model.preselected.indexOf(i) !== -1 ? { text: h.t('pvPreYes'), cls: i === model.trueBest ? 'best' : '' } : null) },
      ];
      model.rowClass = (i, step) => (step.presel && isCand(step) && model.preselected.indexOf(i) !== -1 ? 'cache-hit' : '');
      model.rowLabel = (i, step) => `${isCand(step) ? 'C' : 'A'}${i + 1}`;
    },
    extra(c, h) {
      const card = kvCard(c, 'sgTitle', 'sgNote');
      return {
        el: card.el,
        render(step) {
          relabel(card.el, h.t);
          const m = h.state.model;
          const enc = h.state.enc;
          const N = m.pop.length;
          const rows = [[h.t('sgRowModel'), h.t(`sm_${m.method}`)], [h.t('sgRowArchive'), h.t('sgArchiveVal', { N })]];
          if (step.stage >= 4) {
            rows.push([h.t('sgRowMae'), fo(h, enc, m.mae)]);
            rows.push([h.t('sgRowMax'), fo(h, enc, m.maxErr)]);
            rows.push([h.t('sgRowRho'), m.rho == null ? '—' : h.fmtFixed(m.rho, 2), 'strong']);
          }
          if (step.stage >= 5) {
            rows.push([h.t('sgRowPre'), h.t('sgPreVal', { K: m.K, N, saved: N - m.K })]);
            rows.push([h.t('sgRowFound'), h.t(m.foundBest ? 'sgFoundYes' : 'sgFoundNo', { i: m.trueBest + 1 }), m.foundBest ? 'strong' : 'bad']);
          }
          card.set(rows);
        },
      };
    },
    legend: (state) => geneLegend(state).concat([['sw-arch', 'lgArchive'], ['sw-candpt', 'lgCandidate'], ['sw-pre', 'lgPreselected'], ['sw-truebest', 'lgTrueBest']]),
    narrate(step, state, h) {
      const m = state.model;
      const enc = state.enc;
      const N = m.pop.length;
      const f = (v) => fo(h, enc, v);
      const f2 = (v) => h.fmtFixed(v, 2);
      switch (step.type) {
        case 's_archive': return { key: 's_archive', params: { N } };
        case 's_rule': return { key: `s_rule_${m.method}`, params: { N } };
        case 's_first': {
          const pr = m.preds[0];
          const p = G.space.point(enc, state.inst, m.cands[0]);
          const params = { x1: f2(p[0]), x2: f2(p[1]), k: pr.near + 1, d: f2(pr.d), Fk: f(m.archive[pr.near].fit), Fp: f(pr.value), F: f(m.truth[0]) };
          return { key: `s_first_${m.method}`, params };
        }
        case 's_all': return { key: m.rho != null && m.rho >= 0.7 ? 's_all_good' : 's_all', params: { mae: f(m.mae), max: f(m.maxErr), rho: m.rho == null ? '—' : f2(m.rho), N } };
        case 's_presel': {
          const p = { K: m.K, N, saved: N - m.K, i: m.trueBest + 1, j: m.bestOfPre + 1, Fi: f(m.truth[m.trueBest]), Fj: f(m.truth[m.bestOfPre]) };
          return { key: m.foundBest ? 's_presel_found' : 's_presel_missed', params: p };
        }
        default: return { key: 's_end', params: {} };
      }
    },
  });

  // ---------- Varios objetivos ----------

  items.multi = G.createPopulationUI({
    item: 'multi',
    noCompare: true,
    variant: (state) => state.enc,
    run: (enc, inst, N, seed, extra) => G.items.multi.run(enc, inst, N, seed, { w: extra.w }),
    extraControls(c, state, h) {
      const X = G.items.multi;
      state.extra.w = X.normW(state.extra.w);
      const r = c.range({ id: 'weightRange', labelKey: 'ctlWeight', min: X.W.min, max: X.W.max, step: X.W.step, value: state.extra.w, format: fmtNum,
        onInput: (v) => { state.extra.w = X.normW(v); h.changed('start'); } });
      state.extra.range = r;
      return [r];
    },
    sync(state) { if (state.extra.range) state.extra.range.set(state.extra.w); },
    readExtra(q, state) { state.extra.w = G.items.multi.normW(q.get('w')); },
    hashExtra: (state) => [['w', String(state.extra.w)]],
    augment(model, state, h) {
      const enc = state.enc;
      model.gridColumns = (step) => [
        { head: h.t(`pvColObjA_${enc}`), width: 70, shown: true, cell: (i) => ({ text: h.fmt(model.objs[i].shown[0]) }) },
        { head: h.t(`pvColObjB_${enc}`), width: 70, shown: true, cell: (i) => ({ text: h.fmt(model.objs[i].shown[1]) }) },
        { head: h.t('pvColScore'), width: 60, shown: (step.cols || 0) >= 3, cell: (i) => ((step.cols || 0) >= 3 ? { text: h.fmtFixed(model.scores[i], 2), cls: i === model.best ? 'best' : '' } : null) },
        { head: h.t('pvColFront'), width: 56, shown: (step.cols || 0) >= 4, cell: (i) => ((step.cols || 0) >= 4 ? { text: String(model.rank[i]), cls: model.rank[i] === 1 ? 'best' : '' } : null) },
      ];
    },
    extra(c, h) {
      const card = kvCard(c, 'moTitle', 'moNote');
      return {
        el: card.el,
        render(step) {
          relabel(card.el, h.t);
          const m = h.state.model;
          const rows = [[h.t('moRowObjs'), h.t(`moObjs_${h.state.enc}`)], [h.t('moRowW'), h.fmt(m.w)], [h.t('moRowBest'), `I${m.best + 1}`]];
          if (step.stage >= 4) rows.push([h.t('moRowFront'), list(m.front1), 'strong']);
          if (step.stage >= 5) {
            rows.push([h.t('moRowSup'), list(m.front1.filter((i) => m.supported.has(i)))]);
            rows.push([h.t('moRowUnsup'), list(m.front1.filter((i) => !m.supported.has(i)))]);
            rows.push([h.t('moRowTrue'), m.trueFront ? String(m.trueFront.length) : h.t('moTrueNone')]);
          }
          card.set(rows);
        },
      };
    },
    legend: (state) => geneLegend(state).concat([['sw-objpt-f1', 'lgFront1'], ['sw-objpt', 'lgOtherFront'], ['sw-iso', 'lgIso'], ['sw-cone-better', 'lgConeBetter'], ['sw-cone-worse', 'lgConeWorse'], ['sw-sup', 'lgSupported'], ['sw-unsup', 'lgUnsupported'], ['sw-truefront', 'lgTrueFront']]),
    narrate(step, state, h) {
      const m = state.model;
      const enc = state.enc;
      const N = m.pop.length;
      const T = h.content.narration[h.lang()] || h.content.narration.es;
      const sh = (i) => m.objs[i].shown;
      switch (step.type) {
        case 'm_objs': return { key: enc === 'knapsack-bits' ? 'm_objs_knapsack' : 'm_objs_assign', params: { N } };
        case 'm_weighted': return { key: 'm_weighted', params: { w: h.fmt(m.w), w2: h.fmt(Math.round((1 - m.w) * 100) / 100), i: m.best + 1, s: h.fmtFixed(m.scores[m.best], 2), a: h.fmt(sh(m.best)[0]), b: h.fmt(sh(m.best)[1]) } };
        case 'm_dom': {
          const by = m.dominatedBy[0];
          const of = m.dominatesList[0];
          const p = { a: h.fmt(sh(0)[0]), b: h.fmt(sh(0)[1]), by: list(by), of: list(of), nby: by.length, nof: of.length };
          return { key: `${by.length ? 'm_dom_dominated' : 'm_dom_front'}${of.length ? '' : '_none'}`, params: p };
        }
        case 'm_front': {
          const nf = Math.max(...m.rank);
          return { key: m.front1.length === 1 ? 'm_front_one' : 'm_front', params: { k: m.front1.length, f: list(m.front1), nf } };
        }
        case 'm_sweep': {
          const sup = m.front1.filter((i) => m.supported.has(i));
          const uns = m.front1.filter((i) => !m.supported.has(i));
          return { key: uns.length ? 'm_sweep_some' : 'm_sweep_all', params: { s: list(sup), u: list(uns), k: m.front1.length } };
        }
        default: return m.trueFront
          ? { key: 'm_end', params: { t: m.trueFront.length, k: m.front1.length, onf: fill(T.onTrue, { n: m.front1.filter((i) => m.trueFront.some((p) => p.o[0] === m.o[i][0] && p.o[1] === m.o[i][1])).length }) } }
          : { key: 'm_end_notrue', params: { k: m.front1.length } };
      }
    },
  });
})(typeof self !== 'undefined' ? self : this);
