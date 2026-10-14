/*
 * Página «Comparar estrategias de inicialización» (#cmp=init): para una instancia y un tamaño de población, cada
 * estrategia aplicable genera 1000 poblaciones (semillas 1…1000) y se muestran las medias de diversidad,
 * factibilidad, calidad inicial, cobertura (función) y coste. El cálculo va por tandas, sin bloquear la página.
 *
 * createComparePage(opts) → { init(q), hash(), onLanguage(), title() }
 *   opts = { controlsEl, tableEl, defsEl, progressEl, noteEl, t, fmt, fmtFixed, lang, onChange() }
 */
(function (root) {
  'use strict';
  const G = root.GAX;
  const CHUNK = 100;

  function createComparePage(opts) {
    const { t, fmtFixed } = opts;
    const S = G.space;
    const R = G.rng;
    const C = G.compare;
    const registry = G.registry;
    const Fn = G.func;
    const c = G.createControls(t);
    const state = { enc: 'knapsack-bits', p: {}, N: S.LIMITS.pop.def, s: 1, rows: [], token: 0 };

    // ---------- Controles ----------

    const encSel = c.select({ id: 'cmpEnc', labelKey: 'ctlEncoding', onChange: (v) => { state.enc = v; state.p = {}; sync(); recompute(); } });
    const nRange = c.range({ id: 'cmpN', labelKey: 'ctlN', min: 5, max: 12, value: 8, onInput: (v) => { state.p.n = v; recompute(); } });
    const mRange = c.range({ id: 'cmpM', labelKey: 'ctlM', min: 2, max: 4, value: 3, onInput: (v) => { state.p.m = v; recompute(); } });
    const kRange = c.range({ id: 'cmpK', labelKey: 'ctlK', min: 2, max: 8, value: 5, onInput: (v) => { state.p.k = v; recompute(); } });
    const fnSel = c.select({ id: 'cmpFn', labelKey: 'ctlFunction', onChange: (v) => { state.p.fn = v; recompute(); } });
    const popRange = c.range({ id: 'cmpPop', labelKey: 'ctlPop', min: S.LIMITS.pop.N[0], max: S.LIMITS.pop.N[1], value: state.N, onInput: (v) => { state.N = v; recompute(); } });
    const btnInst = c.button({ id: 'cmpInstance', labelKey: 'ctlNewInstance', onClick: () => { state.s = R.newSeed(); recompute(); } });
    const instHint = c.hint('cmpInstHint');
    opts.controlsEl.replaceChildren(c.row(encSel.field, nRange.field, mRange.field, fnSel.field, kRange.field, popRange.field), c.buttons(btnInst), instHint);

    function options() {
      encSel.setOptions(S.ENCODINGS.map((id) => ({ value: id, label: registry.getEncoding(id).name[opts.lang()] })), state.enc);
      fnSel.setOptions(Fn.FN_IDS.map((id) => ({ value: id, label: t(`fn_${id}`) })), S.params(state.enc, state.p).fn || 'himmelblau');
    }

    function sync() {
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
      options();
    }

    // ---------- Cálculo por tandas ----------

    function recompute() {
      const token = ++state.token;
      const inst = S.instance(state.enc, state.s, state.p);
      state.inst = inst;
      state.optimum = S.optimum(state.enc, inst);
      state.rows = C.strategies(state.enc).map((st) => ({ st, acc: C.emptyAcc(), metrics: null }));
      const jobs = [];
      state.rows.forEach((row) => {
        const R0 = row.st.deterministic ? 1 : C.REPS;
        for (let r = 1; r <= R0; r += CHUNK) jobs.push([row, r, Math.min(R0, r + CHUNK - 1), R0]);
      });
      const total = jobs.length;
      render();
      opts.onChange();
      const tick = () => {
        if (token !== state.token) return;
        const job = jobs.shift();
        if (!job) { opts.progressEl.textContent = ''; return; }
        const [row, r0, r1, R0] = job;
        C.accumulate(row.acc, state.enc, inst, state.N, row.st, r0, r1);
        if (r1 === R0) { row.metrics = C.finish(row.acc, state.enc, row.st, C.REPS); renderTable(); }
        opts.progressEl.textContent = jobs.length ? t('compareProgress', { p: Math.floor((100 * (total - jobs.length)) / total) }) : '';
        setTimeout(tick, 0);
      };
      opts.progressEl.textContent = t('compareProgress', { p: 0 });
      setTimeout(tick, 20);
    }

    // ---------- Tabla ----------

    const METRICS = [
      { id: 'meanDist', kind: 'two' },
      { id: 'minDist', kind: 'two' },
      { id: 'distinct', kind: 'pct' },
      { id: 'feasible', kind: 'pct' },
      { id: 'best', kind: 'obj' },
      { id: 'strata', kind: 'pct', cov: true },
      { id: 'hole', kind: 'two', cov: true },
      { id: 'cost', kind: 'times' },
    ];
    const locale = () => (opts.lang() === 'es' ? 'es-ES' : 'en-GB');
    const fmtObj = (v) => (state.enc === 'tsp-perm' || state.enc.startsWith('function') ? fmtFixed(v, 2) : v.toLocaleString(locale(), { maximumFractionDigits: 1 }));
    const FMT = {
      two: (v) => fmtFixed(v, 2),
      pct: (v) => {
        const n = (v * 100).toLocaleString(locale(), { maximumFractionDigits: v > 0 && v < 0.01 ? 1 : 0 });
        return opts.lang() === 'es' ? `${n} %` : `${n}%`;
      },
      obj: fmtObj,
      times: (v) => `${v.toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}×`,
    };
    const node = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

    function rowHref(row) {
      const q = new URLSearchParams([['item', row.st.item], ['lang', opts.lang()], ['enc', state.enc]]);
      Object.entries(S.params(state.enc, state.p)).forEach(([k, v]) => q.set(k, String(v)));
      q.set('N', String(state.N));
      q.set('s', String(state.s));
      q.set('ps', '1');
      const o = row.st.opts || {};
      if (o.K != null) q.set('K', String(o.K === 'half' ? Math.floor(state.N / 2) : o.K));
      if (o.method) q.set('m', o.method);
      if (o.delta != null) q.set('d', String(o.delta));
      return `#${q.toString()}`;
    }

    function rowName(row) {
      const o = row.st.opts || {};
      return t(`cmpRow_${row.st.id}`, { d: o.delta != null ? fmtFixed(o.delta, 2) : '', K: Math.max(1, Math.floor(state.N / 2)) });
    }

    function activeMetrics() {
      const cov = state.enc.startsWith('function');
      return METRICS.filter((m) => !m.cov || cov);
    }

    function renderTable() {
      const ms = activeMetrics();
      const max = {};
      ms.forEach((m) => { max[m.id] = Math.max(1e-9, ...state.rows.map((r) => (r.metrics && r.metrics[m.id] != null ? r.metrics[m.id] : 0))); });
      const thead = node('thead');
      const hr = node('tr');
      const th0 = node('th', null, t('cmpStrategyCol'));
      th0.scope = 'col';
      hr.append(th0);
      ms.forEach((m) => { const th = node('th', null, t(`metric_${m.id}${m.id === 'best' ? (S.sense(state.enc) === 'max' ? 'Max' : 'Min') : ''}`)); th.scope = 'col'; hr.append(th); });
      thead.append(hr);
      const tbody = node('tbody');
      state.rows.forEach((row) => {
        const tr = node('tr');
        const th = node('th');
        th.scope = 'row';
        const a = node('a', null, rowName(row));
        a.href = rowHref(row);
        th.append(a);
        if (row.st.deterministic) th.append(node('span', 'cmp-op-meta cmp-det', t('cmpDeterministic')));
        tr.append(th);
        ms.forEach((m) => {
          const td = node('td');
          const v = row.metrics ? row.metrics[m.id] : undefined;
          const cell = node('div', 'cmp-cell');
          const nums = node('div', 'cmp-nums');
          nums.append(node('span', 'cmp-val', v === undefined ? t('comparePending') : v === null ? '—' : FMT[m.kind](v)));
          if (m.id === 'best' && row.metrics && row.metrics.noFeasible > 0) nums.append(node('span', 'cmp-ex', t('cmpNoFeasible', { p: FMT.pct(row.metrics.noFeasible) })));
          const bar = node('div', 'cmp-bar');
          bar.setAttribute('aria-hidden', 'true');
          const fill = node('div', 'cmp-fill');
          fill.style.width = v == null ? '0%' : `${Math.max(0, Math.min(100, (100 * v) / max[m.id]))}%`;
          bar.append(fill);
          cell.append(nums, bar);
          td.append(cell);
          tr.append(td);
        });
        tbody.append(tr);
      });
      opts.tableEl.replaceChildren(thead, tbody);
      opts.defsEl.replaceChildren(...ms.flatMap((m) => [node('dt', null, t(`metric_${m.id}${m.id === 'best' ? (S.sense(state.enc) === 'max' ? 'Max' : 'Min') : ''}`)), node('dd', null, t(`metricDesc_${m.id}`))]));
    }

    function render() {
      instHint.textContent = t('cmpInstHint', { s: state.s });
      const opt = fmtObj(state.optimum);
      opts.noteEl.textContent = t('cmpTableNote', { reps: C.REPS.toLocaleString(locale()), N: state.N, opt });
      renderTable();
    }

    // ---------- URL e idioma ----------

    function init(q) {
      const enc = q.get('enc');
      state.enc = S.ENCODINGS.indexOf(enc) !== -1 ? enc : 'knapsack-bits';
      state.p = S.params(state.enc, { n: q.get('n'), m: q.get('m'), k: q.get('k'), fn: q.get('fn') });
      const N = Number(q.get('N'));
      state.N = Number.isInteger(N) && N >= S.LIMITS.pop.N[0] && N <= S.LIMITS.pop.N[1] ? N : S.LIMITS.pop.def;
      const s = R.parseSeed(q.get('s'));
      state.s = s == null ? R.newSeed() : s;
      sync();
      recompute();
    }

    function hash() {
      const out = [['cmp', 'init'], ['lang', opts.lang()], ['enc', state.enc]];
      Object.entries(S.params(state.enc, state.p)).forEach(([k, v]) => out.push([k, String(v)]));
      out.push(['N', String(state.N)], ['s', String(state.s)]);
      return out;
    }

    function onLanguage() {
      options();
      opts.controlsEl.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
      render();
    }

    function stop() { state.token++; }

    return { init, hash, onLanguage, stop };
  }

  (root.GAX = root.GAX || {}).createComparePage = createComparePage;
})(typeof self !== 'undefined' ? self : this);
