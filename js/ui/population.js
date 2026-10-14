/*
 * Página de una estrategia que genera una población (inicialización): controles del problema, de la
 * población y de las semillas; narración de cada paso; tarjeta de medidas y estado en la URL.
 *
 * createPopulationUI(spec)(ctx) devuelve la interfaz que usa js/app.js:
 *   spec = { item, run(enc, inst, N, seed, opts) → resultado con steps, extraControls?(c, state, ctx), hashExtra?, readExtra? }
 *   ctx  = { content, t, fmt, fmtFixed, lang, controlsEl, extraEl, onChange(mode), stop }
 */
(function (root) {
  'use strict';
  const G = root.GAX;

  function createPopulationUI(spec) {
    return function build(ctx) {
      const S = G.space;
      const R = G.rng;
      const registry = G.registry;
      const Fn = G.func;
      const { t, fmt, fmtFixed } = ctx;
      const item = registry.getItem(spec.item);
      const c = G.createControls(t);

      const state = { enc: item.encodings[0], p: {}, N: S.LIMITS.pop.def, s: 1, ps: 1, result: null, model: null, extra: {} };

      // ---------- Controles ----------

      const encSel = c.select({ id: 'encSel', labelKey: 'ctlEncoding', onChange: (v) => { state.enc = v; state.p = {}; syncControls(); changed('start'); } });
      const nRange = c.range({ id: 'nRange', labelKey: 'ctlN', min: 5, max: 12, value: 8, onInput: (v) => { state.p.n = v; changed('start'); } });
      const mRange = c.range({ id: 'mRange', labelKey: 'ctlM', min: 2, max: 4, value: 3, onInput: (v) => { state.p.m = v; changed('start'); } });
      const kRange = c.range({ id: 'kRange', labelKey: 'ctlK', min: 2, max: 8, value: 5, onInput: (v) => { state.p.k = v; changed('start'); } });
      const fnSel = c.select({ id: 'fnSel', labelKey: 'ctlFunction', onChange: (v) => { state.p.fn = v; changed('start'); } });
      const popRange = c.range({ id: 'popRange', labelKey: 'ctlPop', min: S.LIMITS.pop.N[0], max: S.LIMITS.pop.N[1], value: state.N, onInput: (v) => { state.N = v; if (spec.sync) spec.sync(state); changed('start'); } });
      const btnInst = c.button({ id: 'btnInstance', labelKey: 'ctlNewInstance', onClick: () => { state.s = R.newSeed(); changed('start'); } });
      const btnPop = c.button({ id: 'btnPopulation', labelKey: 'ctlNewPopulation', primary: true, onClick: () => { state.ps = R.newSeed(); changed('start'); } });
      const seedsHint = c.hint('seedsHint');
      const cmpLink = c.el('a', 'btn', { id: 'btnCompare', href: '#', 'data-i18n': 'compareLink' });
      cmpLink.textContent = t('compareLink');
      const extraFields = spec.extraControls ? spec.extraControls(c, state, { changed, t }) : [];
      ctx.controlsEl.replaceChildren(
        c.row(encSel.field, nRange.field, mRange.field, fnSel.field, kRange.field, popRange.field, ...extraFields.map((f) => f.field || f)),
        c.buttons(btnInst, btnPop, cmpLink),
        seedsHint,
      );

      function changed(mode) { ctx.stop(); ctx.onChange(mode); }

      function encOptions() {
        encSel.setOptions(item.encodings.map((id) => ({ value: id, label: registry.getEncoding(id).name[ctx.lang()] })), state.enc);
        fnSel.setOptions(Fn.FN_IDS.map((id) => ({ value: id, label: t(`fn_${id}`) })), S.params(state.enc, state.p).fn || 'himmelblau');
      }

      function syncControls() {
        const q = S.params(state.enc, state.p);
        const isAssign = state.enc.startsWith('assignment');
        const isFn = state.enc.startsWith('function');
        nRange.field.hidden = isFn;
        mRange.field.hidden = !isAssign;
        fnSel.field.hidden = !isFn;
        kRange.field.hidden = state.enc !== 'function-bits';
        const lim = state.enc === 'knapsack-bits' ? S.LIMITS.knapsack.n : isAssign ? S.LIMITS.assignment.n : S.LIMITS.tsp.n;
        nRange.input.min = lim[0];
        nRange.input.max = lim[1];
        const nLabel = nRange.field.querySelector('label');
        const nKey = state.enc === 'knapsack-bits' ? 'ctlNItems' : isAssign ? 'ctlNTasks' : 'ctlNCities';
        nLabel.dataset.i18n = nKey;
        nLabel.textContent = t(nKey);
        if (q.n != null) nRange.set(q.n);
        if (q.m != null) mRange.set(q.m);
        if (q.k != null) kRange.set(q.k);
        popRange.set(state.N);
        if (spec.sync) spec.sync(state);
        encOptions();
      }

      // ---------- Modelo ----------

      function run() {
        const inst = S.instance(state.enc, state.s, state.p);
        state.inst = inst;
        const r = spec.run(state.enc, inst, state.N, state.ps, state.extra);
        state.result = r;
        state.model = Object.assign({}, r, {
          enc: state.enc, inst,
          quality: r.pop.map((x) => S.quality(state.enc, inst, x)),
          qualityLabel: `pvQ_${state.enc}`,
        });
        seedsHint.textContent = t('seedsHint', { s: state.s, ps: state.ps });
        updateCompareLink();
        return r;
      }

      /** Enlace a la comparación de estrategias con este problema, este N y esta instancia. */
      function updateCompareLink() {
        const q = new URLSearchParams([['cmp', 'init'], ['lang', ctx.lang()], ['enc', state.enc]]);
        Object.entries(S.params(state.enc, state.p)).forEach(([k, v]) => q.set(k, String(v)));
        q.set('N', String(state.N));
        q.set('s', String(state.s));
        cmpLink.href = `#${q.toString()}`;
      }

      // ---------- Textos ----------

      const locale = () => (ctx.lang() === 'es' ? 'es-ES' : 'en-GB');
      const pct = (v) => (v * 100).toLocaleString(locale(), { maximumSignificantDigits: v < 0.01 ? 2 : 3 });
      const big = (v) => v.toLocaleString(locale());

      function chromText(x) {
        const sh = state.model.shape;
        if (sh.kind === 'real') return `(${x.map((v) => fmtFixed(v, 2)).join('; ')})`;
        if (sh.kind === 'matrix') return S.toRows(x, sh.m).map((r) => r.join('')).join(' ');
        if (sh.kind === 'perm' || sh.kind === 'int') return `(${x.join(', ')})`;
        if (sh.k) return `${x.slice(0, sh.k).join('')} ${x.slice(sh.k).join('')}`;
        return x.join('');
      }

      function qualityText(i) {
        const q = state.model.quality[i];
        const inst = state.inst;
        switch (state.enc) {
          case 'knapsack-bits': return q.feasible ? t('q_knap_ok', { w: q.weight, W: inst.capacity, v: q.value }) : t('q_knap_bad', { w: q.weight, W: inst.capacity });
          case 'assignment-int': return t('q_int', { c: q.objective });
          case 'assignment-matrix': return q.feasible ? t('q_matrix_ok', { c: q.objective }) : t('q_matrix_bad', { v: q.violations });
          case 'tsp-perm': return t('q_tsp', { L: fmtFixed(q.objective, 1) });
          case 'function-real': return t('q_fnReal', { f: fmtFixed(q.objective, 2) });
          default: return t('q_fn', { x1: fmtFixed(q.point[0], 2), x2: fmtFixed(q.point[1], 2), f: fmtFixed(q.objective, 2) });
        }
      }

      const kindSuffix = () => {
        const sh = state.model.shape;
        if (state.enc === 'function-bits') return 'fbits';
        return sh.kind;
      };

      function expectedDist() {
        const sh = state.model.shape;
        if (sh.kind === 'int') return fmtFixed(1 - 1 / sh.m, 2);
        if (sh.kind === 'perm') return fmtFixed(1 - 2 / (sh.length - 1), 2);
        if (state.enc.startsWith('function')) return `≈ ${fmtFixed(0.37, 2)}`;
        return fmtFixed(0.5, 2);
      }

      /** { key, params } de la narración del paso (la clave está en el contenido docente). */
      function narrate(step) {
        const m = state.model;
        const sh = m.shape;
        const inst = state.inst;
        const N = m.pop.length;
        const info = m.info;
        const Fd = state.enc.startsWith('function') ? Fn.fnOf(inst.fn) : null;
        const u = (d) => fmtFixed(d.u, m.dec);
        switch (step.type) {
          case 'space': {
            const share = info.feasible != null && info.chromosomes ? pct(info.feasible / info.chromosomes) : null;
            if (state.enc === 'knapsack-bits') return { key: 'space_knapsack', params: { n: sh.length, W: inst.capacity, total: big(info.chromosomes), feasible: big(info.feasible), share, N } };
            if (state.enc === 'assignment-int') return { key: 'space_int', params: { n: sh.length, m: sh.m, total: big(info.chromosomes), N } };
            if (state.enc === 'assignment-matrix') return { key: 'space_matrix', params: { n: sh.n, m: sh.m, nm: sh.length, total: big(info.chromosomes), feasible: big(info.feasible), share, N } };
            if (state.enc === 'tsp-perm') return { key: 'space_perm', params: { n: sh.length, total: big(info.chromosomes), tours: big(info.tours), N } };
            if (state.enc === 'function-bits') return { key: 'space_fbits', params: { k: inst.k, bits: sh.length, total: big(info.chromosomes), a: fmt(Fd.a), b: fmt(Fd.b), N } };
            return { key: 'space_real', params: { a: fmt(Fd.a), b: fmt(Fd.b), N } };
          }
          case 'rule': {
            const k = kindSuffix();
            if (k === 'int') return { key: 'rule_int', params: { m: sh.m } };
            if (k === 'matrix') return { key: 'rule_matrix', params: { nm: sh.length } };
            if (k === 'perm') return { key: 'rule_perm', params: { n: sh.length, draws: sh.length - 1 } };
            if (k === 'real') return { key: 'rule_real', params: { a: fmt(Fd.a), w: fmt(Fd.b - Fd.a), b: fmt(Fd.b) } };
            if (k === 'fbits') return { key: 'rule_fbits', params: { bits: sh.length, total: big(info.chromosomes) } };
            return { key: 'rule_bits', params: {} };
          }
          case 'gene': {
            const d = m.draws[0][step.draw];
            const cmp = d.u < 0.5 ? '<' : '≥';
            if (sh.kind === 'int') return { key: 'gene_int', params: { g: d.g + 1, u: u(d), m: sh.m, fl: Math.floor(d.u * sh.m), v: d.value } };
            if (sh.kind === 'matrix') return { key: 'gene_matrix', params: { i: Math.floor(d.g / sh.m) + 1, j: (d.g % sh.m) + 1, u: u(d), cmp, v: d.value } };
            if (sh.kind === 'real') return { key: 'gene_real', params: { g: ['₁', '₂'][d.g], u: u(d), a: fmt(Fd.a), w: fmt(Fd.b - Fd.a), v: fmtFixed(d.value, 2) } };
            return { key: 'gene_bits', params: { g: d.g + 1, u: u(d), cmp, v: d.value } };
          }
          case 'swap': {
            const d = m.draws[0][step.draw];
            return { key: d.j === d.k ? 'swap_stay' : 'swap_move', params: { k: d.k, u: u(d), j: d.j, city: d.after[d.k - 1] } };
          }
          case 'first': return { key: 'first', params: { chrom: chromText(m.pop[0]), q: qualityText(0) } };
          case 'ind': return { key: 'ind', params: { i: step.ind + 1, chrom: chromText(m.pop[step.ind]), q: qualityText(step.ind) } };
          case 'pop': {
            const key = state.enc.startsWith('function') ? 'pop_map' : state.enc === 'tsp-perm' ? 'pop_routes' : state.enc === 'knapsack-bits' ? 'pop_knapsack' : 'pop_assign';
            return { key, params: { N } };
          }
          case 'feasible': {
            const f = m.measures.feasible;
            if (info.feasible === info.chromosomes) return { key: 'feasible_all', params: { N } };
            const share = pct(info.feasible / info.chromosomes);
            if (!f) return { key: 'feasible_none', params: { N, share } };
            return { key: 'feasible_some', params: { f, N, sharePop: pct(f / N), share } };
          }
          case 'distance': {
            const M = m.measures;
            return { key: 'distance', params: { mean: fmtFixed(M.meanDist, 2), min: fmtFixed(M.minDist, 2), distinct: M.distinct, N, expected: expectedDist() } };
          }
          case 'quality': {
            const M = m.measures;
            if (M.best == null) return { key: 'quality_none', params: {} };
            const f = (v) => (state.enc === 'tsp-perm' ? fmtFixed(v, 1) : state.enc.startsWith('function') ? fmtFixed(v, 2) : fmt(v));
            return { key: M.sense === 'max' ? 'quality_max' : 'quality_min', params: { best: f(M.best), mean: f(M.mean), worst: f(M.worst), opt: f(M.optimum) } };
          }
          default: return spec.narrate ? spec.narrate(step, state, { t, fmt, fmtFixed, chromText, qualityText, expectedDist, pct, big, content: ctx.content, lang: ctx.lang }) : { key: step.type, params: {} };
        }
      }

      // ---------- Tarjeta de medidas ----------

      const card = c.card('measuresTitle', 'measuresNote');
      const table = c.el('table', 'measures');
      const tableWrap = c.el('div', 'table-scroll');
      tableWrap.append(table);
      card.append(tableWrap);
      const pending = c.el('p', 'hint', { 'data-i18n': 'measuresPending' });
      card.append(pending);
      ctx.extraEl.replaceChildren(card);

      function renderExtra(step) {
        const m = state.model;
        const N = m.pop.length;
        const complete = step.done >= N && !step.onlySeed && !step.onlyRandom;
        pending.hidden = complete;
        pending.textContent = t('measuresPending');
        table.hidden = !complete;
        if (!complete) return;
        const f = (v) => (v == null ? '—' : state.enc === 'tsp-perm' ? fmtFixed(v, 1) : state.enc.startsWith('function') ? fmtFixed(v, 2) : fmt(v));
        // Con dos poblaciones (la uniforme de la misma semilla y la de la estrategia), una columna por población
        const sets = m.uniformMeasures ? [m.uniformMeasures, m.measures] : [m.measures];
        const cols = m.columns || ['mUniformPop', 'mSeededPop'];
        const M0 = m.measures;
        const rows = [
          ['mDistinct', (M) => `${M.distinct} / ${N}`],
          ['mFeasible', (M) => `${M.feasible} / ${N}`],
          [`mMeanDist_${S.DISTANCE_KIND[state.enc]}`, (M) => fmtFixed(M.meanDist, 2)],
          ['mMinDist', (M) => fmtFixed(M.minDist, 2)],
        ];
        if (!m.uniformMeasures) rows.splice(3, 0, ['mExpected', () => expectedDist()]);
        if (M0.entropy != null) rows.push(['mEntropy', (M) => fmtFixed(M.entropy, 2)]);
        if (M0.coverage) {
          rows.push(['mStrata', (M) => t('mStrataVal', { s1: M.coverage.strata[0], s2: M.coverage.strata[1], N })]);
          rows.push(['mHole', (M) => fmtFixed(M.coverage.hole.r, 2)]);
        }
        rows.push([M0.sense === 'max' ? 'mBestMax' : 'mBestMin', (M) => f(M.best)], ['mMean', (M) => f(M.mean)], ['mOptimum', (M) => f(M.optimum)]);
        if (m.costs) rows.push(['mCost', (M) => String(M === m.measures ? m.costs[1] : m.costs[0])]);
        const parts = [];
        if (m.uniformMeasures) {
          const thead = c.el('thead');
          const tr = c.el('tr');
          ['mMeasure'].concat(cols).forEach((k) => { const th = c.el('th', null, { scope: 'col' }); th.textContent = t(k); tr.append(th); });
          thead.append(tr);
          parts.push(thead);
        }
        const tbody = c.el('tbody');
        rows.forEach(([k, get]) => {
          const tr = c.el('tr');
          const th = c.el('th', null, { scope: 'row' });
          th.textContent = t(k);
          tr.append(th);
          sets.forEach((M) => { const td = c.el('td'); td.textContent = get(M); tr.append(td); });
          tbody.append(tr);
        });
        parts.push(tbody);
        table.replaceChildren(...parts);
      }

      // ---------- URL ----------

      function init(q) {
        const enc = q.get('enc');
        state.enc = item.encodings.indexOf(enc) !== -1 ? enc : item.encodings[0];
        state.p = { n: q.get('n'), m: q.get('m'), k: q.get('k'), fn: q.get('fn') };
        state.p = S.params(state.enc, state.p);
        const N = Number(q.get('N'));
        state.N = Number.isInteger(N) && N >= S.LIMITS.pop.N[0] && N <= S.LIMITS.pop.N[1] ? N : S.LIMITS.pop.def;
        const s = R.parseSeed(q.get('s'));
        const ps = R.parseSeed(q.get('ps'));
        state.s = s == null ? R.newSeed() : s;
        state.ps = ps == null ? R.newSeed() : ps;
        if (spec.readExtra) spec.readExtra(q, state);
        syncControls();
      }

      function hash() {
        const q = S.params(state.enc, state.p);
        const out = [['enc', state.enc]];
        Object.entries(q).forEach(([k, v]) => out.push([k, String(v)]));
        out.push(['N', String(state.N)], ['s', String(state.s)], ['ps', String(state.ps)]);
        if (spec.hashExtra) spec.hashExtra(state).forEach((kv) => out.push(kv));
        return out;
      }

      function onLanguage() {
        encOptions();
        seedsHint.textContent = t('seedsHint', { s: state.s, ps: state.ps });
        ctx.controlsEl.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
        if (spec.sync) spec.sync(state);
        updateCompareLink();
      }

      const legendFor = () => {
        if (spec.legend) return spec.legend(state);
        const base = [['sw-one', 'lgOne'], ['sw-zero', 'lgZero'], ['sw-active', 'lgActive'], ['sw-empty', 'lgEmpty']];
        const sh = state.model ? state.model.shape : null;
        const seed = state.model && state.model.seedRows ? [['sw-seed', 'lgSeed']] : [];
        if (state.model && state.model.seedRows) return (sh.kind === 'bits' ? [['sw-one', 'lgOne'], ['sw-zero', 'lgZero']] : [['sw-val', 'lgGene']]).concat(seed, [['sw-empty', 'lgEmptySeed']]);
        if (!sh || sh.kind === 'int' || sh.kind === 'real' || sh.kind === 'perm') return [['sw-val', 'lgGene'], ['sw-active', 'lgActive'], ['sw-empty', 'lgEmpty']];
        return base;
      };

      return {
        init, run, hash, narrate, onLanguage, renderExtra,
        model: () => state.model,
        variant: () => (spec.variant ? spec.variant(state) : state.model ? state.model.shape.kind : 'bits'),
        legend: legendFor,
        state,
      };
    };
  }

  (root.GAX = root.GAX || {}).createPopulationUI = createPopulationUI;
  const items = (root.GAX.itemUI = root.GAX.itemUI || {});
  items.uniform = createPopulationUI({
    item: 'uniform',
    run: (enc, inst, N, seed) => root.GAX.items.uniform.run(enc, inst, N, seed),
  });

  // Contraejemplo de la siembra: control de las copias K y narración propia
  items.seeded = createPopulationUI({
    item: 'seeded',
    variant: (state) => state.enc,
    run: (enc, inst, N, seed, extra) => root.GAX.items.seeded.run(enc, inst, N, seed, { K: Math.min(extra.K || 1, N) }),
    extraControls(c, state, h) {
      state.extra.K = state.extra.K || 1;
      const k = c.range({ id: 'kCopies', labelKey: 'ctlCopies', min: 1, max: 20, value: state.extra.K, onInput: (v) => { state.extra.K = v; h.changed('start'); } });
      state.extra.control = k;
      return [k];
    },
    readExtra(q, state) {
      const K = Number(q.get('K'));
      state.extra.K = Number.isInteger(K) && K >= 1 && K <= 20 ? K : 1;
    },
    sync(state) {
      const k = state.extra.control;
      if (!k) return;
      state.extra.K = Math.min(state.extra.K || 1, state.N);
      k.setMax(state.N);
      k.set(state.extra.K);
    },
    hashExtra: (state) => [['K', String(Math.min(state.extra.K || 1, state.N))]],
    narrate(step, state, h) {
      const m = state.model;
      const N = m.pop.length;
      const K = m.K;
      const R = N - K;
      const T = h.content.narration[h.lang()] || h.content.narration.es;
      const fill = (s, p) => s.replace(/\{(\w+)\}/g, (x, k) => (p[k] != null ? p[k] : x));
      const S = root.GAX.space;
      const f = (v) => (state.enc === 'tsp-perm' ? h.fmtFixed(v, 1) : h.fmt(v));
      switch (step.type) {
        case 'heur': {
          const H = m.heuristic;
          const copies = fill(K === 1 ? T.copies_one : T.copies_many, { K });
          const base = { chrom: h.chromText(H.x), opt: f(m.measures.optimum), copies };
          if (state.enc === 'knapsack-bits') return { key: 'heur_knapsack', params: Object.assign(base, { order: H.order.map((o) => o.item).join(', '), v: H.quality.objective }) };
          if (state.enc === 'assignment-int') return { key: 'heur_assign', params: Object.assign(base, { c: H.quality.objective }) };
          return { key: 'heur_tsp', params: Object.assign(base, { L: f(H.quality.objective) }) };
        }
        case 'random': return { key: 'random', params: { R } };
        case 'mix': return m.heuristic.notWorse ? { key: 'mix_notbest', params: { R, K, nw: m.heuristic.notWorse } } : { key: 'mix_best', params: { R, K } };
        case 'div': {
          const U = m.uniformMeasures;
          const M = m.measures;
          return { key: K === 1 ? 'div_one' : 'div_many', params: { du: h.fmtFixed(U.meanDist, 2), ds: h.fmtFixed(M.meanDist, 2), nu: U.distinct, ns: M.distinct } };
        }
        case 'gen': return { key: 'gen', params: { g: step.gen, k: h.fmtFixed(m.curve[step.gen].k, 1), N } };
        default: {
          const gt = (m.curve.find((c) => c.k >= N - 0.5) || m.curve[m.curve.length - 1]).g;
          const opt = m.heuristic.quality.objective === m.measures.optimum;
          return { key: opt ? 'end_opt' : 'end', params: { gt } };
        }
      }
    },
  });
})(typeof self !== 'undefined' ? self : this);
