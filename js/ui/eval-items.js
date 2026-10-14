/*
 * Páginas de la familia Evaluación (fase 3): del genotipo a la aptitud, objetivo frente a aptitud, restricciones
 * como penalización y coste de evaluar. Cada una es un createPopulationUI (js/ui/population.js) con sus columnas,
 * su tarjeta propia, su narración y su leyenda. Los textos de la narración están en js/content/<id>.js; los de las
 * tarjetas y las columnas, en js/i18n.js.
 */
(function (root) {
  'use strict';
  const G = root.GAX;
  const items = (G.itemUI = G.itemUI || {});
  const PEN_ENCS = ['knapsack-bits', 'assignment-matrix'];

  // ---------- Utilidades comunes ----------

  /** Objetivo con los decimales de su problema. */
  function fo(h, enc, v) {
    if (v == null) return '—';
    if (enc === 'tsp-perm') return h.fmtFixed(v, 1);
    if (enc.startsWith('function')) return h.fmtFixed(v, 2);
    return h.fmt(v);
  }
  /** Porcentaje con un decimal (número solo, para la narración). */
  const pc = (h, p) => (p == null ? '—' : h.fmtFixed(100 * p, 1));
  /** Porcentaje con su signo: «16,7 %» en español, «16.7%» en inglés. */
  const pcs = (h, p) => (p == null ? '—' : `${pc(h, p)}${h.lang() === 'es' ? ' %' : '%'}`);
  /** Lista «a, b y c» sin conjunción: «a, b, c». */
  const list = (xs) => xs.join(', ');

  /** Fenotipo como texto, según la codificación. */
  function phenoText(h, enc, e) {
    const t = h.t;
    const ph = e.phenotype;
    if (enc === 'knapsack-bits') return ph.items.length ? t('chItems', { items: list(ph.items) }) : t('chNoItems');
    if (enc === 'assignment-int') return ph.machines.map((ts, j) => `M${j + 1}: ${ts.length ? list(ts) : '—'}`).join(' · ');
    if (enc === 'assignment-matrix') return ph.rows.map((ms, i) => `T${i + 1} → ${ms.length ? ms.map((j) => `M${j}`).join('+') : '∅'}`).join(' · ');
    if (enc === 'tsp-perm') return `${ph.tour.join(' → ')} → ${ph.tour[0]}`;
    if (enc === 'function-bits') return `z = (${ph.vars[0].z}, ${ph.vars[1].z}) → (${h.fmtFixed(ph.point[0], 2)}; ${h.fmtFixed(ph.point[1], 2)})`;
    return `(${h.fmtFixed(ph.point[0], 2)}; ${h.fmtFixed(ph.point[1], 2)})`;
  }
  /** Objetivo como texto, con su detalle. */
  function objText(h, enc, e, inst) {
    const t = h.t;
    if (enc === 'knapsack-bits') return t('chKnapsack', { v: e.objective, w: e.obj.weight });
    if (enc.startsWith('assignment')) return t('chLoads', { loads: `(${e.obj.loads.join(', ')})`, c: e.objective });
    if (enc === 'tsp-perm') return t('chTour', { L: fo(h, enc, e.objective) });
    return t('chF', { f: fo(h, enc, e.objective) });
  }
  /** Restricciones como texto. */
  function consText(h, enc, e, inst) {
    const t = h.t;
    if (enc === 'knapsack-bits') return e.violation ? t('chCapBad', { w: e.obj.weight, W: inst.capacity, e: e.violation }) : t('chCapOk', { w: e.obj.weight, W: inst.capacity });
    if (enc === 'assignment-matrix') return e.violation ? t('chRowsBad', { v: e.violation }) : t('chRowsOk');
    if (enc === 'function-real') return t('chBox');
    return t('chByConstruction');
  }
  /** Aptitud como texto, con la fórmula. */
  function fitText(h, enc, e, lambda, type) {
    const t = h.t;
    const l = h.fmt(lambda == null ? 1 : lambda);
    if (!e.violation) return t('chFitPlain', { F: fo(h, enc, e.fitness) });
    const pen = type === 'quadratic' ? `(${l} · ${e.violation})²` : `${l} · ${e.violation}`;
    const sign = enc === 'knapsack-bits' ? '−' : '+';
    return t('chFitPen', { z: fo(h, enc, e.objective), sign, pen, F: h.fmt(e.fitness) });
  }

  /** Leyenda de los genes según la codificación. */
  const geneLegend = (state) => {
    const sh = state.model ? state.model.shape : null;
    return sh && (sh.kind === 'bits' || sh.kind === 'matrix') ? [['sw-one', 'lgOne'], ['sw-zero', 'lgZero']] : [['sw-val', 'lgGeneVal']];
  };

  /** Tarjeta con una tabla de dos columnas (rótulo y valor), que se rehace en cada paso. */
  function kvCard(c, titleKey, noteKey) {
    const card = c.card(titleKey, noteKey);
    const head = c.el('p', 'eval-head');
    const wrap = c.el('div', 'table-scroll');
    const table = c.el('table', 'measures eval-table');
    wrap.append(table);
    const pending = c.el('p', 'hint');
    card.append(head, wrap, pending);
    return {
      el: card,
      /** rows = [[rótulo, valor, cls?]]; null o vacío → se ve la nota de espera. */
      set(title, rows, pendingText) {
        head.textContent = title || '';
        head.hidden = !title;
        const has = rows && rows.length;
        wrap.hidden = !has;
        pending.hidden = !!has;
        pending.textContent = pendingText || '';
        if (!has) return;
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

  /** Tarjeta con una tabla de varias columnas: cols = [claves], rows = [[celdas], cls?]. */
  function gridCard(c, titleKey, noteKey) {
    const card = c.card(titleKey, noteKey);
    const head = c.el('p', 'eval-head');
    const wrap = c.el('div', 'table-scroll');
    const table = c.el('table', 'measures eval-grid');
    wrap.append(table);
    const pending = c.el('p', 'hint');
    card.append(head, wrap, pending);
    return {
      el: card,
      set(title, cols, rows, pendingText) {
        head.textContent = title || '';
        head.hidden = !title;
        const has = rows && rows.length;
        wrap.hidden = !has;
        pending.hidden = !!has;
        pending.textContent = pendingText || '';
        if (!has) return;
        const thead = c.el('thead');
        const tr = c.el('tr');
        cols.forEach((k) => { const th = c.el('th', null, { scope: 'col' }); th.textContent = k; tr.append(th); });
        thead.append(tr);
        const tb = c.el('tbody');
        rows.forEach(([cells, cls]) => {
          const r = c.el('tr', cls || null);
          cells.forEach((v, k) => {
            const cell = k === 0 ? c.el('th', null, { scope: 'row' }) : c.el('td');
            cell.textContent = v;
            r.append(cell);
          });
          tb.append(r);
        });
        table.replaceChildren(thead, tb);
      },
    };
  }

  /** Vuelve a poner los textos con data-i18n de una tarjeta (cambio de idioma). */
  const relabel = (el, t) => el.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });

  // ---------- Del genotipo a la aptitud ----------

  items.pipeline = G.createPopulationUI({
    item: 'pipeline',
    noCompare: true,
    variant: (state) => state.enc,
    run: (enc, inst, N, seed) => G.items.pipeline.run(enc, inst, N, seed),
    augment(model, state, h) {
      const enc = state.enc;
      const pen = PEN_ENCS.indexOf(enc) !== -1;
      model.penaltyPanel = pen;
      // ¿Se ve ya el eslabón k (1 decodificar, 2 objetivo, 3 restricciones, 4 aptitud) del individuo i?
      const seen = (step, i, k) => i < step.done || (i === step.ind && (step.phase || 0) >= k);
      model.fitShown = (step, i) => seen(step, i, 4);
      const cols = [];
      if (pen) {
        cols.push({ key: 'obj', head: h.t(`pvQ_${enc}`), width: 70, at: 2, cell: (e) => ({ text: fo(h, enc, e.objective), cls: e.violation ? 'muted' : '' }) });
        cols.push({ key: 'viol', head: h.t(enc === 'knapsack-bits' ? 'pvColExcess' : 'pvColViol'), width: 50, at: 3, cell: (e) => ({ text: h.fmt(e.violation), cls: e.violation ? 'infeasible' : '' }) });
      }
      cols.push({ key: 'fit', head: h.t('pvColFitness'), width: pen ? 74 : 84, at: 4, cell: (e) => ({ text: fo(h, enc, e.fitness), cls: e.violation ? 'infeasible' : '' }) });
      cols.push({ key: 'rank', head: h.t('pvColRank'), width: 58, rank: true, cell: (e, i) => ({ text: String(model.ranking.rank[i]), cls: model.ranking.rank[i] === 1 ? 'best' : '' }) });
      model.gridColumns = (step) => cols.map((col) => ({
        head: col.head, width: col.width, shown: col.rank ? !!step.rank : true,
        cell: (i) => (col.rank ? (step.rank ? col.cell(model.evals[i], i) : null) : (seen(step, i, col.at) ? col.cell(model.evals[i], i) : null)),
      }));
    },
    extra(c, h) {
      const card = kvCard(c, 'chainTitle', 'chainNote');
      return {
        el: card.el,
        render(step) {
          relabel(card.el, h.t);
          const m = h.state.model;
          const enc = h.state.enc;
          const inst = h.state.inst;
          const i = step.ind;
          const N = m.pop.length;
          const count = h.t('chCount', { k: step.done, N });
          if (i == null) { card.set(count, null, h.t('chainPending')); return; }
          const e = m.evals[i];
          const k = step.phase || 0;
          const rows = [[h.t('chGenotype'), h.chromText(m.pop[i])]];
          if (k >= 1) rows.push([h.t('chPhenotype'), phenoText(h, enc, e)]);
          if (k >= 2) rows.push([h.t('chObjective'), objText(h, enc, e, inst)]);
          if (k >= 3) rows.push([h.t('chConstraints'), consText(h, enc, e, inst), e.violation ? 'bad' : '']);
          if (k >= 4) rows.push([h.t('chFitness'), fitText(h, enc, e, 1, 'linear'), 'strong']);
          card.set(`${h.t('chIndividual', { i: i + 1 })} · ${count}`, rows);
        },
      };
    },
    legend: (state) => {
      const base = geneLegend(state);
      if (state.enc === 'knapsack-bits') return base.concat([['sw-fpoint', 'lgFeasiblePt'], ['sw-fpoint-out', 'lgInfeasiblePt'], ['sw-fitpt', 'lgFitPt']]);
      if (state.enc === 'assignment-matrix') return base.concat([['sw-bar', 'lgCmaxAsIs'], ['sw-penbar', 'lgPenalty']]);
      return base.concat([['sw-fpoint', 'lgEvaluated']]);
    },
    narrate(step, state, h) {
      const m = state.model;
      const enc = state.enc;
      const inst = state.inst;
      const N = m.pop.length;
      const T = h.content.narration[h.lang()] || h.content.narration.es;
      const f2 = (v) => h.fmtFixed(v, 2);
      const e = step.ind != null ? m.evals[step.ind] : null;
      const chrom = e ? h.chromText(m.pop[step.ind]) : '';
      switch (step.type) {
        case 'e_pop': return { key: m.sense === 'max' ? 'e_pop_max' : 'e_pop_min', params: { N } };
        case 'e_decode': {
          const ph = e.phenotype;
          if (enc === 'knapsack-bits') return { key: 'e_decode_knapsack', params: { chrom, items: ph.items.length ? list(ph.items) : T.none } };
          if (enc === 'assignment-int') return { key: 'e_decode_int', params: { chrom, machines: phenoText(h, enc, e) } };
          if (enc === 'assignment-matrix') {
            const bad = ph.rows.map((r, i) => (r.length === 1 ? 0 : i + 1)).filter(Boolean);
            return { key: bad.length ? 'e_decode_matrix_bad' : 'e_decode_matrix', params: { chrom, rows: phenoText(h, enc, e), bad: list(bad) } };
          }
          if (enc === 'tsp-perm') return { key: 'e_decode_tsp', params: { chrom, tour: phenoText(h, enc, e) } };
          if (enc === 'function-bits') {
            const F = G.func.fnOf(inst.fn);
            const v = ph.vars;
            return { key: 'e_decode_fbits', params: {
              b1: v[0].bits.join(''), z1: v[0].z, x1: f2(v[0].x), b2: v[1].bits.join(''), z2: v[1].z, x2: f2(v[1].x),
              a: h.fmt(F.a), w: h.fmt(F.b - F.a), lev: Math.pow(2, inst.k) - 1,
            } };
          }
          return { key: 'e_decode_real', params: { x1: f2(ph.point[0]), x2: f2(ph.point[1]) } };
        }
        case 'e_objective': {
          if (enc === 'knapsack-bits') {
            const it = e.phenotype.items;
            const sv = it.length ? it.map((k) => inst.values[k - 1]).join(' + ') : '0';
            const sw = it.length ? it.map((k) => inst.weights[k - 1]).join(' + ') : '0';
            return { key: 'e_objective_knapsack', params: { sumv: sv, v: e.objective, sumw: sw, w: e.obj.weight } };
          }
          if (enc === 'assignment-int') return { key: 'e_objective_int', params: { loads: `(${e.obj.loads.join(', ')})`, c: e.objective } };
          if (enc === 'assignment-matrix') return { key: 'e_objective_matrix', params: { loads: `(${e.obj.loads.join(', ')})`, c: e.objective } };
          if (enc === 'tsp-perm') return { key: 'e_objective_tsp', params: { n: e.obj.legs.length, legs: e.obj.legs.map((l) => h.fmtFixed(l.d, 1)).join(' + '), L: fo(h, enc, e.objective) } };
          return { key: 'e_objective_fn', params: { x1: f2(e.phenotype.point[0]), x2: f2(e.phenotype.point[1]), f: f2(e.objective) } };
        }
        case 'e_cons': {
          if (enc === 'knapsack-bits') return { key: e.violation ? 'e_cons_knapsack_bad' : 'e_cons_knapsack_ok', params: { w: e.obj.weight, W: inst.capacity, e: e.violation } };
          if (enc === 'assignment-matrix') {
            const terms = e.phenotype.rows.map((r) => `|${r.length} − 1|`).join(' + ');
            return { key: e.violation ? 'e_cons_matrix_bad' : 'e_cons_matrix_ok', params: { terms, v: e.violation } };
          }
          if (enc === 'assignment-int') return { key: 'e_cons_int', params: {} };
          if (enc === 'tsp-perm') return { key: 'e_cons_tsp', params: {} };
          if (enc === 'function-real') { const F = G.func.fnOf(inst.fn); return { key: 'e_cons_real', params: { a: h.fmt(F.a), b: h.fmt(F.b) } }; }
          return { key: 'e_cons_fbits', params: {} };
        }
        case 'e_fit': {
          if (enc === 'knapsack-bits') return e.violation ? { key: 'e_fit_knapsack_bad', params: { v: e.objective, e: e.violation, F: h.fmt(e.fitness) } } : { key: 'e_fit_knapsack_ok', params: { v: e.objective } };
          if (enc === 'assignment-matrix') return e.violation ? { key: 'e_fit_matrix_bad', params: { c: e.objective, v: e.violation, F: h.fmt(e.fitness) } } : { key: 'e_fit_matrix_ok', params: { c: e.objective } };
          return { key: 'e_fit_min', params: { F: fo(h, enc, e.fitness) } };
        }
        case 'e_ind': return { key: e.violation ? 'e_ind_bad' : 'e_ind', params: { i: step.ind + 1, chrom, F: fo(h, enc, e.fitness), v: e.violation, k: step.done, N } };
        case 'e_rank': {
          const b = m.best;
          const w = m.ranking.order[N - 1];
          const p = { b: b + 1, Fb: fo(h, enc, m.fits[b]), w: w + 1, Fw: fo(h, enc, m.fits[w]) };
          if (m.evals[b].violation) return { key: 'e_rank_bad', params: p };
          return { key: m.sense === 'max' ? 'e_rank_max' : 'e_rank_min', params: p };
        }
        case 'e_count': return { key: 'e_count', params: { N, total: h.big(N * 101), hours: h.big(Math.round((N * 101) / 60)) } };
        default: return { key: PEN_ENCS.indexOf(enc) !== -1 ? 'e_end_pen' : 'e_end', params: {} };
      }
    },
  });

  // ---------- Objetivo frente a aptitud ----------

  items.objective = G.createPopulationUI({
    item: 'objective',
    noCompare: true,
    variant: (state) => state.extra.transform || 'cmax',
    run: (enc, inst, N, seed, extra) => G.items.objective.run(enc, inst, N, seed, { transform: extra.transform }),
    extraControls(c, state, h) {
      state.extra.transform = state.extra.transform || 'cmax';
      const sel = c.select({ id: 'transformSel', labelKey: 'ctlTransform', onChange: (v) => { state.extra.transform = v; h.changed('start'); } });
      state.extra.control = sel;
      state.extra.t = h.t;
      return [sel];
    },
    sync(state) {
      const sel = state.extra.control;
      if (sel) sel.setOptions(G.items.objective.TRANSFORMS.map((k) => ({ value: k, label: state.extra.t(`tr_${k}`) })), state.extra.transform);
    },
    readExtra(q, state) {
      const k = q.get('tr');
      state.extra.transform = G.items.objective.TRANSFORMS.indexOf(k) !== -1 ? k : 'cmax';
    },
    hashExtra: (state) => [['tr', state.extra.transform]],
    augment(model, state, h) {
      const enc = state.enc;
      model.transforms = G.items.objective.TRANSFORMS;
      const fmtF = (v) => (model.transform === 'rank' ? h.fmt(v) : model.transform === 'inv' ? h.fmtFixed(v, 4) : fo(h, enc, v));
      model.gridColumns = (step) => [
        { head: h.t(`pvQ_${enc}`), width: 78, shown: true, cell: (i) => ({ text: fo(h, enc, model.f[i]) }) },
        { head: h.t('pvColFitnessF'), width: 84, shown: (step.cols || 0) >= 2,
          cell: (i) => ((step.cols || 0) >= 2 && (step.type !== 'o_first' || i === 0) ? { text: fmtF(model.fitnessValues[i]), cls: model.fitnessValues[i] < 0 ? 'infeasible' : '' } : null) },
        { head: h.t('pvColProb'), width: 64, shown: (step.cols || 0) >= 3,
          cell: (i) => ((step.cols || 0) >= 3 ? { text: model.probs ? pcs(h, model.probs[i]) : '—' } : null) },
      ];
    },
    extra(c, h) {
      const card = gridCard(c, 'trTableTitle', 'trTableNote');
      return {
        el: card.el,
        render(step) {
          relabel(card.el, h.t);
          const m = h.state.model;
          if (step.stage < 4) { card.set(null, null, null, h.t('trTablePending')); return; }
          const N = m.pop.length;
          const pct = (p) => pcs(h, p);
          const rows = m.transforms.map((k) => {
            const T = m.table[k];
            return [[h.t(`tr_${k}`), T.p ? pct(T.pBest) : h.t('trNone'), T.p ? pct(T.pWorst) : '—',
              T.p ? h.fmtFixed(T.copiesBest, 2) : '—', T.ratio == null ? (T.p ? '∞' : '—') : h.fmtFixed(T.ratio, 1)], k === m.transform ? 'current' : ''];
          });
          card.set(h.t('trTableHead', { N }), [h.t('trColTransform'), h.t('trColPBest'), h.t('trColPWorst'), h.t('trColCopies'), h.t('trColRatio')], rows);
        },
      };
    },
    legend: (state) => geneLegend(state).concat([['sw-sector', 'lgSector'], ['sw-sector-current', 'lgSectorCurrent'], ['sw-share-best', 'lgShareBest']]),
    narrate(step, state, h) {
      const m = state.model;
      const enc = state.enc;
      const N = m.pop.length;
      const kind = m.transform;
      const T = m.table[kind];
      const f = (i) => fo(h, enc, m.f[i]);
      const fmtF = (v) => (kind === 'rank' ? h.fmt(v) : kind === 'inv' ? h.fmtFixed(v, 4) : fo(h, enc, v));
      const what = h.t(`what_${enc}`);
      switch (step.type) {
        case 'o_obj': return { key: 'o_obj', params: { N, what, b: T.best + 1, fb: f(T.best), w: T.worst + 1, fw: f(T.worst) } };
        case 'o_rule': return { key: `o_rule_${kind}`, params: { C: kind === 'cmax' ? fo(h, enc, T.C) : '', N } };
        case 'o_first': return { key: `o_first_${kind}`, params: { f: f(0), F: fmtF(T.F[0]), C: kind === 'cmax' ? fo(h, enc, T.C) : '', N } };
        case 'o_all': return { key: `o_all_${kind}`, params: { Fb: fmtF(T.F[T.best]), Fw: fmtF(T.F[T.worst]), b: T.best + 1, w: T.worst + 1 } };
        case 'o_wheel': {
          if (!T.p) return { key: kind === 'neg' ? 'o_wheel_neg' : 'o_wheel_zero', params: {} };
          return { key: 'o_wheel', params: { sum: fmtF(T.F.reduce((a, b) => a + b, 0)), N } };
        }
        case 'o_best': return T.p ? { key: 'o_best', params: { i: T.best + 1, f: f(T.best), p: pc(h, T.pBest), c: h.fmtFixed(T.copiesBest, 2), N } } : { key: 'o_best_none', params: {} };
        case 'o_worst': {
          if (!T.p) return { key: 'o_worst_none', params: {} };
          if (T.pWorst === 0) return { key: 'o_worst_zero', params: { i: T.worst + 1, f: f(T.worst) } };
          return { key: 'o_worst', params: { i: T.worst + 1, f: f(T.worst), p: pc(h, T.pWorst), r: h.fmtFixed(T.ratio, 1) } };
        }
        case 'o_compare': {
          const t2 = m.table;
          return { key: 'o_compare', params: { pc: pc(h, t2.cmax.pBest), pi: pc(h, t2.inv.pBest), pr: pc(h, t2.rank.pBest), prk: pc(h, 2 / (N + 1)), N } };
        }
        default: return { key: enc.startsWith('function') ? 'o_end_fn' : 'o_end', params: {} };
      }
    },
  });

  // ---------- Restricciones como penalización ----------

  items.penalty = G.createPopulationUI({
    item: 'penalty',
    noCompare: true,
    variant: (state) => `${state.enc}:${state.extra.type || 'linear'}`,
    run: (enc, inst, N, seed, extra) => G.items.penalty.run(enc, inst, N, seed, { type: extra.type, lambda: extra.lambda }),
    extraControls(c, state, h) {
      const X = G.items.penalty;
      state.extra.type = state.extra.type || 'linear';
      const sel = c.select({ id: 'penTypeSel', labelKey: 'ctlPenaltyType', onChange: (v) => { state.extra.type = v; h.changed('start'); } });
      const fmtL = (v) => v.toLocaleString(document.documentElement.lang === 'en' ? 'en-GB' : 'es-ES', { maximumFractionDigits: 2 });
      const L = X.LAMBDA[state.enc] || X.LAMBDA['knapsack-bits'];
      const r = c.range({
        id: 'lambdaRange', labelKey: 'ctlLambda', min: L.min, max: L.max, step: L.step, value: state.extra.lambda == null ? L.def : state.extra.lambda, format: fmtL,
        onInput: (v) => { state.extra.lambda = X.normLambda(state.enc, v); h.changed('start'); },
      });
      state.extra.sel = sel;
      state.extra.range = r;
      state.extra.t = h.t;
      return [sel, r];
    },
    sync(state) {
      const X = G.items.penalty;
      if (state.extra.sel) state.extra.sel.setOptions(X.TYPES.map((k) => ({ value: k, label: state.extra.t(`pen_${k}`) })), state.extra.type);
      // Al cambiar de problema, λ vuelve al valor por defecto de ese problema
      if (state.extra.lambdaEnc !== state.enc) {
        if (state.extra.lambdaEnc != null) state.extra.lambda = X.LAMBDA[state.enc].def;
        state.extra.lambdaEnc = state.enc;
      }
      state.extra.lambda = X.normLambda(state.enc, state.extra.lambda);
      const r = state.extra.range;
      if (r) {
        const L = X.LAMBDA[state.enc];
        r.input.min = L.min;
        r.input.max = L.max;
        r.input.step = L.step;
        r.set(state.extra.lambda);
      }
    },
    readExtra(q, state) {
      const X = G.items.penalty;
      state.extra.type = X.TYPES.indexOf(q.get('pt')) !== -1 ? q.get('pt') : 'linear';
      state.extra.lambda = X.normLambda(state.enc, q.get('l'));
      state.extra.lambdaEnc = state.enc;
    },
    hashExtra: (state) => [['pt', state.extra.type], ['l', String(state.extra.lambda)]],
    augment(model, state, h) {
      const enc = state.enc;
      model.penaltyPanel = true;
      model.fitShown = (step, i) => (step.cols || 0) >= 3 && (step.only == null || i === step.only);
      model.gridColumns = (step) => [
        { head: h.t(`pvQ_${enc}`), width: 66, shown: true, cell: (i) => ({ text: fo(h, enc, model.evals[i].objective), cls: model.evals[i].violation ? 'muted' : '' }) },
        { head: h.t(enc === 'knapsack-bits' ? 'pvColExcess' : 'pvColViol'), width: 50, shown: (step.cols || 0) >= 2,
          cell: (i) => ((step.cols || 0) >= 2 ? { text: h.fmt(model.evals[i].violation), cls: model.evals[i].violation ? 'infeasible' : '' } : null) },
        { head: h.t('pvColFitness'), width: 74, shown: (step.cols || 0) >= 3,
          cell: (i) => (model.fitShown(step, i) ? { text: h.fmt(model.evals[i].fitness), cls: model.evals[i].violation ? 'infeasible' : '' } : null) },
      ];
    },
    extra(c, h) {
      const card = kvCard(c, 'penTitle', 'penNote');
      return {
        el: card.el,
        render(step) {
          relabel(card.el, h.t);
          const m = h.state.model;
          const enc = h.state.enc;
          const N = m.pop.length;
          const b = m.evals[m.best];
          const rows = [
            [h.t('penRowFeasible'), `${m.feasibleCount} / ${N}`],
            [h.t('penRowRule'), h.t(`penRule_${enc === 'knapsack-bits' ? 'max' : 'min'}_${m.type}`, { l: h.fmt(m.lambda) })],
          ];
          if (step.stage >= 4) {
            rows.push([h.t('penRowBest'), h.t(b.violation ? 'penBestBad' : 'penBestOk', { i: m.best + 1, F: h.fmt(b.fitness) }), b.violation ? 'bad' : '']);
            rows.push([h.t('penRowBestFeasible'), m.lambdaStar ? fo(h, enc, m.lambdaStar.bestFeasible) : h.t('penNoneFeasible')]);
          }
          if (step.stage >= 5) {
            rows.push([h.t('penRowStar'), m.lambdaStar ? h.fmtFixed(m.lambdaStar.lambda, 2) : h.t('penStarUndefined'), 'strong']);
          }
          card.set(null, rows);
        },
      };
    },
    legend: (state) => {
      const base = geneLegend(state);
      const panel = state.enc === 'knapsack-bits'
        ? [['sw-fpoint', 'lgFeasiblePt'], ['sw-fpoint-out', 'lgInfeasiblePt'], ['sw-fitpt', 'lgFitPt']]
        : [['sw-bar', 'lgCmaxAsIs'], ['sw-penbar', 'lgPenalty']];
      return base.concat(panel, [['sw-lline', 'lgLineFeasible'], ['sw-lline-bad', 'lgLineInfeasible'], ['sw-lenv', 'lgEnvelope'], ['sw-lcur', 'lgCurrentLine'], ['sw-lstar', 'lgLambdaStar']]);
    },
    narrate(step, state, h) {
      const m = state.model;
      const enc = state.enc;
      const inst = state.inst;
      const N = m.pop.length;
      const ks = enc === 'knapsack-bits';
      const suf = ks ? 'knapsack' : 'matrix';
      const l = h.fmt(m.lambda);
      const viols = m.evals.map((e) => e.violation);
      switch (step.type) {
        case 'p_pop': {
          const bf = m.lambdaStar ? m.lambdaStar.bestFeasible : null;
          const over = ks && bf != null ? m.evals.filter((e) => e.violation && e.objective > bf).length : 0;
          return { key: `p_pop_${suf}${m.feasibleCount ? '' : '_none'}`, params: { f: m.feasibleCount, N, W: ks ? inst.capacity : '', over, bf: bf == null ? '—' : fo(h, enc, bf) } };
        }
        case 'p_viol': return { key: `p_viol_${suf}`, params: { f: m.feasibleCount, vmax: Math.max(...viols), vmin: Math.min(...viols) } };
        case 'p_rule': return { key: `p_rule_${suf}_${m.type}`, params: { l } };
        case 'p_first': {
          if (m.firstBad < 0) return { key: 'p_first_none', params: { N } };
          const e = m.evals[m.firstBad];
          return { key: `p_first_${suf}_${m.type}`, params: { i: m.firstBad + 1, z: fo(h, enc, e.objective), v: e.violation, l, P: h.fmt(e.penalty), F: h.fmt(e.fitness) } };
        }
        case 'p_fit': return { key: `p_fit_${suf}`, params: {} };
        case 'p_best': {
          const e = m.evals[m.best];
          const p = { i: m.best + 1, F: h.fmt(e.fitness), v: e.violation, l, B: m.lambdaStar ? fo(h, enc, m.lambdaStar.bestFeasible) : '' };
          if (!m.lambdaStar) return { key: 'p_best_nofeas', params: p };
          return { key: e.violation ? `p_best_bad_${suf}` : 'p_best_ok', params: p };
        }
        case 'p_lambda': {
          if (!m.lambdaStar) return { key: m.bestAtMin === m.bestAtMax ? 'p_lambda_nofeas_same' : 'p_lambda_nofeas', params: { a: m.bestAtMin + 1, b: m.bestAtMax + 1, max: h.fmt(m.lambdaRange.max) } };
          const s = m.lambdaStar.lambda;
          if (s === 0) return { key: 'p_lambda_zero', params: { l } };
          const key = s > m.lambdaRange.max ? 'p_lambda_beyond' : m.lambda > s ? 'p_lambda_above' : 'p_lambda_below';
          return { key, params: { s: h.fmtFixed(s, 2), l, max: h.fmt(m.lambdaRange.max) } };
        }
        default: return { key: 'p_end', params: {} };
      }
    },
  });

  // ---------- Coste de evaluar ----------

  items.cost = G.createPopulationUI({
    item: 'cost',
    noCompare: true,
    variant: () => 'cost',
    run: (enc, inst, N, seed, extra) => G.items.cost.run(enc, inst, N, seed, { G: extra.G }),
    extraControls(c, state, h) {
      const X = G.items.cost;
      state.extra.G = X.normG(state.extra.G);
      const r = c.range({ id: 'gensRange', labelKey: 'ctlGenerations', min: X.GENS.min, max: X.GENS.max, value: state.extra.G, onInput: (v) => { state.extra.G = v; h.changed('start'); } });
      state.extra.range = r;
      return [r];
    },
    sync(state) { if (state.extra.range) state.extra.range.set(state.extra.G); },
    readExtra(q, state) { state.extra.G = G.items.cost.normG(q.get('G')); },
    hashExtra: (state) => [['G', String(state.extra.G)]],
    augment(model, state, h) {
      const enc = state.enc;
      const S = G.space;
      model.gens.forEach((g) => { g.quality = g.pop.map((x) => S.quality(enc, state.inst, x)); });
      // Columnas de la generación que se ve: la vista sustituye pop, evals y hit por los de model.gens[step.gen]
      model.gridColumns = (step) => {
        const g = step.gen != null ? model.gens[step.gen] : null;
        const on = (i) => g && step.done > i;
        return [
          { head: h.t('pvColFitness'), width: 78, shown: true, cell: (i) => (on(i) ? { text: fo(h, enc, g.evals[i].fitness), cls: g.evals[i].violation ? 'infeasible' : '' } : null) },
          { head: h.t('pvColCache'), width: 86, shown: true, cell: (i) => (on(i) ? { text: h.t(g.hit[i] ? 'pvCacheHit' : 'pvCacheNew'), cls: g.hit[i] ? 'hit' : '' } : null) },
        ];
      };
      model.rowClass = (i, step) => {
        const g = step.gen != null ? model.gens[step.gen] : null;
        return g && step.done > i && g.hit[i] ? 'cache-hit' : '';
      };
    },
    extra(c, h) {
      const card = gridCard(c, 'costTitle', 'costNote');
      return {
        el: card.el,
        render(step) {
          relabel(card.el, h.t);
          const m = h.state.model;
          if (step.done === 0) { card.set(h.t('costHead', { B: m.budget, N: m.pop.length, G: m.G }), null, null, h.t('costPending')); return; }
          const upto = step.gen;
          const rows = m.gens.slice(0, upto + 1).map((g, k) => [[String(k), String(g.pop.length), String(g.newEvals), String(g.pop.length - g.newEvals), String(g.cumNo), String(g.cumCache)], k === upto && step.stage <= 3 ? 'current' : '']);
          card.set(h.t('costHead', { B: m.budget, N: m.pop.length, G: m.G }),
            [h.t('costColGen'), h.t('costColInd'), h.t('costColNew'), h.t('costColHits'), h.t('costColCumNo'), h.t('costColCumCache')], rows);
        },
      };
    },
    legend: (state) => geneLegend(state).concat([['sw-cachehit', 'lgCacheHit'], ['sw-cost-no', 'lgCostNo'], ['sw-cost-cache', 'lgCostCache'], ['sw-budget', 'lgBudget']]),
    narrate(step, state, h) {
      const m = state.model;
      const N = m.pop.length;
      const L = m.shape.length;
      const g = m.gens[step.gen];
      switch (step.type) {
        case 'c_budget': return { key: 'c_budget', params: { N, G: m.G, B: m.budget } };
        case 'c_gen0': return { key: g.newEvals < N ? 'c_gen0_dup' : 'c_gen0', params: { N, d: N - g.newEvals } };
        case 'c_gen': return { key: 'c_gen', params: { g: step.gen, L, hits: N - g.newEvals, nw: g.newEvals, N, cumNo: g.cumNo, cumCache: g.cumCache } };
        case 'c_curve': {
          const last = m.gens[m.G];
          const saved = last.cumNo - last.cumCache;
          return { key: 'c_curve', params: { G: m.G, saved, B: m.budget, pct: h.fmtFixed((100 * saved) / last.cumNo, 0) } };
        }
        case 'c_reach': return { key: m.reachCapped ? 'c_reach_capped' : 'c_reach', params: { B: m.budget, R: m.reach, G: m.G, max: G.items.cost.MAX_GEN } };
        default: return { key: state.enc === 'tsp-perm' ? 'c_end_tsp' : 'c_end', params: {} };
      }
    },
  });
})(typeof self !== 'undefined' ? self : this);
