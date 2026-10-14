/*
 * Paneles de la evaluación avanzada (fase 4) para la vista de la población (js/viz/population-view.js), que los
 * llama por el nombre de step.show:
 *   neigh      aptitud de los vecinos a un gen del individuo step.ind (paisaje, problemas discretos y cadena binaria)
 *   cut        cortes de la función por el individuo step.ind, uno por eje (paisaje, vector de reales)
 *   climb      búsqueda local desde step.ind: camino sobre el mapa (función) o aptitud paso a paso (discretos)
 *   basins     búsqueda local desde toda la población: flechas en el mapa o de la aptitud inicial a la final
 *   fdc        aptitud frente a distancia al óptimo (muestra y población)
 *   noise      aptitud real, una evaluación con ruido, repeticiones y media con su intervalo, una fila por individuo
 *   smap       archivo y candidatos del metamodelo sobre el mapa
 *   sscatter   aptitud estimada frente a la real
 *   objspace   espacio de los dos objetivos: suma ponderada, dominancia y frentes
 * Cada panel recibe api = { PANEL, ROW, TOP, t, fmt, fmtFixed, panelFrame, fnBase, shownIdx, visible, svg }.
 */
(function (root) {
  'use strict';
  const G = (root.GAX = root.GAX || {});
  const panels = (G.pvPanels = G.pvPanels || {});

  /** Ejes de un gráfico x–y dentro del panel: escalas y líneas. */
  function axes(api, g, xd, yd, opts) {
    const { PANEL } = api;
    const o = Object.assign({ x0: 44, y1: PANEL - 30, xLabel: '', yLabel: '', nice: true, top: 8 }, opts || {});
    const sx = d3.scaleLinear().domain(xd).range([o.x0, PANEL - 10]);
    const sy = d3.scaleLinear().domain(yd).range([o.y1, o.top]);
    if (o.nice) { if (o.niceX !== false) sx.nice(); sy.nice(); }
    g.append('line').attr('class', 'pv-axisline').attr('x1', o.x0).attr('x2', PANEL - 10).attr('y1', o.y1).attr('y2', o.y1);
    g.append('line').attr('class', 'pv-axisline').attr('x1', o.x0).attr('x2', o.x0).attr('y1', o.top).attr('y2', o.y1);
    if (o.xTicks !== false) sx.ticks(4).forEach((v) => g.append('text').attr('class', 'pv-axis').attr('x', sx(v)).attr('y', o.y1 + 15).attr('text-anchor', 'middle').text(api.fmt(v)));
    sy.ticks(4).forEach((v) => g.append('text').attr('class', 'pv-axis').attr('x', o.x0 - 6).attr('y', sy(v) + 4).attr('text-anchor', 'end').text(api.fmt(v)));
    if (o.xLabel) g.append('text').attr('class', 'pv-axis').attr('x', PANEL - 10).attr('y', o.y1 + 29).attr('text-anchor', 'end').text(o.xLabel);
    if (o.yLabel) g.append('text').attr('class', 'pv-axis').attr('x', o.x0 + 4).attr('y', o.top + 2).text(o.yLabel);
    return { sx, sy, x0: o.x0, y1: o.y1 };
  }
  const ext = (vals, pad) => {
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const p = (hi - lo || Math.abs(hi) || 1) * (pad || 0.05);
    return [lo - p, hi + p];
  };

  // ---------- Paisaje ----------

  panels.neigh = (api, step, model, L) => {
    const g = api.panelFrame(L, 'pvNeighTitle', { i: step.ind + 1 });
    const nb = model.neighbours;
    const list = nb.list;
    const ys = list.map((n) => n.fit).concat([nb.fit]);
    const A = axes(api, g, [0, list.length + 1], ext(ys), { niceX: false, xTicks: false, xLabel: api.t('pvNeighAxis'), yLabel: api.t('pvColFitness') });
    const yCur = A.sy(nb.fit);
    g.append('line').attr('class', 'pv-lnow').attr('x1', A.x0).attr('x2', api.PANEL - 10).attr('y1', yCur).attr('y2', yCur);
    g.append('text').attr('class', 'pv-axis pv-lnow-label').attr('x', api.PANEL - 10).attr('y', yCur - 5).attr('text-anchor', 'end').text(api.t('pvNeighCurrent', { i: step.ind + 1 }));
    list.forEach((n, k) => {
      const x = A.sx(k + 1);
      g.append('line').attr('class', `pv-stem${n.better ? ' better' : ''}`).attr('x1', x).attr('x2', x).attr('y1', yCur).attr('y2', A.sy(n.fit));
      g.append('circle').attr('class', `pv-nb${n.better ? ' better' : ''}${k === nb.best ? ' best' : ''}`).attr('cx', x).attr('cy', A.sy(n.fit)).attr('r', k === nb.best ? 6 : 4);
      if (list.length <= 12) g.append('text').attr('class', 'pv-axis pv-nb-label').attr('x', x).attr('y', A.y1 + 15).attr('text-anchor', 'middle').text(n.label);
    });
  };

  panels.cut = (api, step, model, L) => {
    const g = api.panelFrame(L, 'pvCutTitle', { i: step.ind + 1 });
    const inst = model.inst;
    const F = G.func.fnOf(inst.fn);
    const x = model.pop[step.ind];
    const h = (api.PANEL - 40) / 2;
    [0, 1].forEach((d) => {
      const top = d * (h + 34);
      const sub = g.append('g').attr('transform', `translate(0,${top})`);
      const pts = d3.range(0, 201).map((k) => {
        const v = F.a + ((F.b - F.a) * k) / 200;
        const p = d === 0 ? [v, x[1]] : [x[0], v];
        return [v, F.f(p[0], p[1])];
      });
      const sx = d3.scaleLinear().domain([F.a, F.b]).range([44, api.PANEL - 10]);
      const sy = d3.scaleLinear().domain(d3.extent(pts, (p) => p[1])).nice().range([h - 6, 14]);
      sub.append('line').attr('class', 'pv-axisline').attr('x1', 44).attr('x2', api.PANEL - 10).attr('y1', h - 6).attr('y2', h - 6);
      sy.ticks(3).forEach((v) => sub.append('text').attr('class', 'pv-axis').attr('x', 38).attr('y', sy(v) + 4).attr('text-anchor', 'end').text(api.fmt(v)));
      [F.a, 0, F.b].forEach((v) => sub.append('text').attr('class', 'pv-axis').attr('x', sx(v)).attr('y', h + 8).attr('text-anchor', 'middle').text(api.fmt(v)));
      sub.append('text').attr('class', 'pv-sub').attr('x', 44).attr('y', 8).text(api.t(d === 0 ? 'pvCutX1' : 'pvCutX2', { v: api.fmtFixed(x[1 - d], 2) }));
      sub.append('path').attr('class', 'pv-cutline').attr('d', d3.line().x((p) => sx(p[0])).y((p) => sy(p[1]))(pts));
      model.neighbours.list.filter((n) => n.label.indexOf(['₁', '₂'][d]) !== -1).forEach((n) => {
        sub.append('circle').attr('class', `pv-nb${n.better ? ' better' : ''}`).attr('cx', sx(n.x[d])).attr('cy', sy(n.fit)).attr('r', 4);
      });
      sub.append('circle').attr('class', 'pv-cutpt').attr('cx', sx(x[d])).attr('cy', sy(F.f(x[0], x[1]))).attr('r', 6);
    });
  };

  /** Camino de una búsqueda local sobre el mapa de la función. */
  function mapPath(api, g, model, path, sx, sy, cls) {
    const pts = path.map((s) => G.space.point(model.enc, model.inst, s.x));
    g.append('path').attr('class', `pv-climb ${cls || ''}`).attr('d', d3.line().x((p) => sx(p[0])).y((p) => sy(p[1]))(pts));
    return pts;
  }

  panels.climb = (api, step, model, L) => {
    const c = model.climbs[step.ind];
    if (model.enc === 'function-real' || model.enc === 'function-bits') {
      const g = api.panelFrame(L, 'pvClimbMapTitle', { i: step.ind + 1 });
      const { sx, sy } = api.fnBase(g, model.inst);
      const pts = mapPath(api, g, model, c.path, sx, sy, 'current');
      pts.forEach((p, k) => g.append('circle').attr('class', `pv-climbpt${k === 0 ? ' start' : k === pts.length - 1 ? ' end' : ''}`)
        .attr('cx', sx(p[0])).attr('cy', sy(p[1])).attr('r', k === 0 || k === pts.length - 1 ? 6 : 2.5));
      return;
    }
    const g = api.panelFrame(L, 'pvClimbTitle', { i: step.ind + 1 });
    const ys = c.path.map((s) => s.fit).concat([model.measures.optimum]);
    const A = axes(api, g, [0, Math.max(1, c.steps)], ext(ys), { xLabel: api.t('pvClimbAxis'), yLabel: api.t('pvColFitness') });
    const yo = A.sy(model.measures.optimum);
    g.append('line').attr('class', 'pv-opt').attr('x1', A.x0).attr('x2', api.PANEL - 10).attr('y1', yo).attr('y2', yo);
    g.append('text').attr('class', 'pv-axis pv-opt-label').attr('x', api.PANEL - 10).attr('y', yo - 5).attr('text-anchor', 'end').text(api.t('pvOptimum', { v: api.fmt(model.measures.optimum) }));
    g.append('path').attr('class', 'pv-climb current').attr('d', d3.line().x((s, k) => A.sx(k)).y((s) => A.sy(s.fit))(c.path));
    c.path.forEach((s, k) => g.append('circle').attr('class', `pv-climbpt${k === 0 ? ' start' : k === c.steps ? ' end' : ''}`).attr('cx', A.sx(k)).attr('cy', A.sy(s.fit)).attr('r', k === 0 || k === c.steps ? 6 : 3.5));
  };

  panels.basins = (api, step, model, L) => {
    const N = model.pop.length;
    if (model.enc === 'function-real' || model.enc === 'function-bits') {
      const g = api.panelFrame(L, 'pvBasinsMapTitle');
      const { sx, sy } = api.fnBase(g, model.inst);
      model.climbs.forEach((c) => mapPath(api, g, model, c.path, sx, sy, c.optimum ? 'ok' : 'local'));
      model.climbs.forEach((c, i) => {
        const p0 = G.space.point(model.enc, model.inst, c.path[0].x);
        const p1 = G.space.point(model.enc, model.inst, c.end);
        g.append('circle').attr('class', 'pv-climbpt start').attr('cx', sx(p0[0])).attr('cy', sy(p0[1])).attr('r', 4);
        g.append('circle').attr('class', `pv-climbpt end${c.optimum ? ' ok' : ''}`).attr('cx', sx(p1[0])).attr('cy', sy(p1[1])).attr('r', 5);
        if (N <= 12) g.append('text').attr('class', 'pv-pt-label').attr('x', sx(p0[0]) + 6).attr('y', sy(p0[1]) - 6).text(`I${i + 1}`);
      });
      return;
    }
    const g = api.panelFrame(L, 'pvBasinsTitle');
    const vals = model.climbs.flatMap((c) => [c.path[0].fit, c.endFit]).concat([model.measures.optimum]);
    const sx = d3.scaleLinear().domain(ext(vals)).nice().range([34, api.PANEL - 10]);
    const rowH = Math.min(api.ROW, (api.PANEL - 30) / N);
    model.climbs.forEach((c, i) => {
      const r = g.append('g').attr('transform', `translate(0,${i * rowH})`);
      r.append('text').attr('class', 'pv-axis').attr('x', 28).attr('y', rowH / 2 + 4).attr('text-anchor', 'end').text(`I${i + 1}`);
      const a = sx(c.path[0].fit);
      const b = sx(c.endFit);
      r.append('line').attr('class', `pv-dumb${c.optimum ? ' ok' : ''}`).attr('x1', a).attr('x2', b).attr('y1', rowH / 2).attr('y2', rowH / 2);
      r.append('circle').attr('class', 'pv-climbpt start').attr('cx', a).attr('cy', rowH / 2).attr('r', 4);
      r.append('circle').attr('class', `pv-climbpt end${c.optimum ? ' ok' : ''}`).attr('cx', b).attr('cy', rowH / 2).attr('r', 5);
    });
    const xo = sx(model.measures.optimum);
    g.append('line').attr('class', 'pv-opt').attr('x1', xo).attr('x2', xo).attr('y1', -4).attr('y2', N * rowH + 4);
    g.append('text').attr('class', 'pv-axis pv-opt-label').attr('x', xo).attr('y', N * rowH + 18).attr('text-anchor', 'middle').text(api.t('pvOptimum', { v: api.fmt(model.measures.optimum) }));
  };

  panels.fdc = (api, step, model, L) => {
    const g = api.panelFrame(L, 'pvFdcTitle');
    const pts = model.fdc.points;
    const N = model.pop.length;
    const A = axes(api, g, [0, Math.max(...pts.map((p) => p.d)) || 1], ext(pts.map((p) => p.fit)), { xLabel: api.t('pvFdcAxis'), yLabel: api.t('pvColFitness') });
    pts.slice(N).forEach((p) => g.append('circle').attr('class', 'pv-sample').attr('cx', A.sx(p.d)).attr('cy', A.sy(p.fit)).attr('r', 2.2));
    pts.slice(0, N).forEach((p, i) => g.append('circle').attr('class', `pv-fdcpt${i === step.ind ? ' current' : ''}`).attr('cx', A.sx(p.d)).attr('cy', A.sy(p.fit)).attr('r', 5));
    if (model.fdc.r != null) g.append('text').attr('class', 'pv-share-note').attr('x', api.PANEL - 10).attr('y', 22).attr('text-anchor', 'end').text(`FDC r = ${api.fmtFixed(model.fdc.r, 2)}`);
  };

  // ---------- Ruido ----------

  panels.noise = (api, step, model, L) => {
    const g = api.panelFrame(L, 'pvNoiseTitle');
    const N = model.pop.length;
    const layers = step.layers || ['true'];
    const se = model.R > 0 ? model.sigma / Math.sqrt(model.R) : 0;
    const vals = model.f.concat(model.single, model.noisy.flat().map((r) => r.value), model.means.map((m) => m - 2 * se), model.means.map((m) => m + 2 * se));
    const sx = d3.scaleLinear().domain(ext(vals, 0.03)).nice().range([34, api.PANEL - 10]);
    const rowH = Math.min(api.ROW, (api.PANEL - 30) / N);
    for (let i = 0; i < N; i++) {
      const r = g.append('g').attr('class', `pv-barrow${i === step.ind ? ' current' : ''}`).attr('transform', `translate(0,${i * rowH})`);
      r.append('text').attr('class', 'pv-axis').attr('x', 28).attr('y', rowH / 2 + 4).attr('text-anchor', 'end').text(`I${i + 1}`);
      const y = rowH / 2;
      if (layers.indexOf('mean') !== -1) {
        r.append('line').attr('class', 'pv-ci').attr('x1', sx(model.means[i] - 2 * se)).attr('x2', sx(model.means[i] + 2 * se)).attr('y1', y).attr('y2', y);
      }
      if (layers.indexOf('reps0') !== -1 && i === step.ind) {
        model.noisy[i].forEach((rep) => r.append('circle').attr('class', 'pv-rep').attr('cx', sx(rep.value)).attr('cy', y).attr('r', 3.2));
      }
      if (layers.indexOf('true') !== -1) r.append('line').attr('class', 'pv-truetick').attr('x1', sx(model.f[i])).attr('x2', sx(model.f[i])).attr('y1', 3).attr('y2', rowH - 3);
      if (layers.indexOf('single') !== -1) r.append('path').attr('class', 'pv-single').attr('d', d3.symbol(d3.symbolDiamond, 60)()).attr('transform', `translate(${sx(model.single[i])},${y})`);
      if (layers.indexOf('mean') !== -1) r.append('circle').attr('class', 'pv-mean').attr('cx', sx(model.means[i])).attr('cy', y).attr('r', 4.5);
    }
    sx.ticks(4).forEach((v) => g.append('text').attr('class', 'pv-axis').attr('x', sx(v)).attr('y', N * rowH + 16).attr('text-anchor', 'middle').text(api.fmt(v)));
    g.append('text').attr('class', 'pv-axis').attr('x', api.PANEL - 10).attr('y', N * rowH + 30).attr('text-anchor', 'end').text(api.t('pvNoiseAxis'));
  };

  // ---------- Metamodelo ----------

  panels.smap = (api, step, model, L) => {
    const g = api.panelFrame(L, 'pvSmapTitle');
    const { sx, sy } = api.fnBase(g, model.inst);
    const cpts = model.cands.map((x) => G.space.point(model.enc, model.inst, x));
    if (step.predOnly != null) {
      const p = cpts[step.predOnly];
      const pr = model.preds[step.predOnly];
      if (model.method === 'nn') {
        const q = model.archive[pr.near].p;
        g.append('line').attr('class', 'pv-slink strong').attr('x1', sx(p[0])).attr('y1', sy(p[1])).attr('x2', sx(q[0])).attr('y2', sy(q[1]));
      } else {
        const ws = pr.ds.map((d) => (d > 0 ? 1 / (d * d) : Infinity));
        const wmax = Math.max(...ws);
        model.archive.forEach((a, k) => g.append('line').attr('class', 'pv-slink').attr('stroke-width', 0.6 + 4 * (ws[k] / wmax))
          .attr('x1', sx(p[0])).attr('y1', sy(p[1])).attr('x2', sx(a.p[0])).attr('y2', sy(a.p[1])));
      }
    }
    model.archive.forEach((a, k) => g.append('circle').attr('class', 'pv-arch').attr('cx', sx(a.p[0])).attr('cy', sy(a.p[1])).attr('r', 5));
    if (step.stage >= 2) {
      cpts.forEach((p, i) => {
        const pre = step.presel && model.preselected.indexOf(i) !== -1;
        g.append('path').attr('class', `pv-cand-pt${pre ? ' pre' : ''}${i === step.ind ? ' current' : ''}`).attr('d', d3.symbol(d3.symbolDiamond, i === step.ind ? 130 : 80)())
          .attr('transform', `translate(${sx(p[0])},${sy(p[1])})`);
        if (step.presel && i === model.trueBest) g.append('circle').attr('class', 'pv-truebest').attr('cx', sx(p[0])).attr('cy', sy(p[1])).attr('r', 10);
      });
    }
  };

  panels.sscatter = (api, step, model, L) => {
    const g = api.panelFrame(L, 'pvSscatterTitle');
    const all = model.pred.concat(model.truth);
    const d = ext(all);
    const A = axes(api, g, d, d, { xLabel: api.t('pvSpredAxis'), yLabel: api.t('pvStrueAxis') });
    const [lo, hi] = A.sx.domain();
    g.append('line').attr('class', 'pv-diag').attr('x1', A.sx(lo)).attr('y1', A.sy(lo)).attr('x2', A.sx(hi)).attr('y2', A.sy(hi));
    if (step.presel) {
      const cut = model.pred[model.preselected[model.preselected.length - 1]];
      g.append('rect').attr('class', 'pv-preband').attr('x', A.x0).attr('y', 8).attr('width', Math.max(0, A.sx(cut) - A.x0)).attr('height', A.y1 - 8);
    }
    model.pred.forEach((p, i) => {
      const pre = step.presel && model.preselected.indexOf(i) !== -1;
      g.append('path').attr('class', `pv-cand-pt${pre ? ' pre' : ''}`).attr('d', d3.symbol(d3.symbolDiamond, 80)()).attr('transform', `translate(${A.sx(p)},${A.sy(model.truth[i])})`);
      if (step.presel && i === model.trueBest) g.append('circle').attr('class', 'pv-truebest').attr('cx', A.sx(p)).attr('cy', A.sy(model.truth[i])).attr('r', 10);
    });
    if (model.rho != null) g.append('text').attr('class', 'pv-share-note').attr('x', api.PANEL - 10).attr('y', A.y1 - 8).attr('text-anchor', 'end').text(`ρ = ${api.fmtFixed(model.rho, 2)}`);
  };

  // ---------- Varios objetivos ----------

  panels.objspace = (api, step, model, L) => {
    const g = api.panelFrame(L, `pvObjTitle_${model.enc}`);
    const N = model.pop.length;
    const xs = model.objs.map((b) => b.shown[1]);
    const ys = model.objs.map((b) => b.shown[0]);
    const tf = step.truth && model.trueFront ? model.trueFront : [];
    const A = axes(api, g, ext(xs.concat(tf.map((p) => p.shown[1]))), ext(ys.concat(tf.map((p) => p.shown[0]))),
      { xLabel: api.t(`pvObjX_${model.enc}`), yLabel: api.t(`pvObjY_${model.enc}`) });
    g.append('clipPath').attr('id', 'pvObjClip').append('rect').attr('x', A.x0).attr('y', 8).attr('width', api.PANEL - 10 - A.x0).attr('height', A.y1 - 8);
    const clipped = g.append('g').attr('clip-path', 'url(#pvObjClip)');
    const P = (i) => [A.sx(xs[i]), A.sy(ys[i])];
    const knap = model.enc === 'knapsack-bits';
    // y «mejor» hacia arriba en la mochila (valor) y hacia abajo en la asignación (makespan)
    if (step.cone != null) {
      const [cx, cy] = P(step.cone);
      const W = api.PANEL;
      const better = knap ? [A.x0, 0, cx - A.x0, cy] : [A.x0, cy, cx - A.x0, A.y1 - cy];
      const worse = knap ? [cx, cy, W - cx, A.y1 - cy] : [cx, 0, W - cx, cy];
      clipped.append('rect').attr('class', 'pv-cone better').attr('x', better[0]).attr('y', better[1]).attr('width', Math.max(0, better[2])).attr('height', Math.max(0, better[3]));
      clipped.append('rect').attr('class', 'pv-cone worse').attr('x', worse[0]).attr('y', worse[1]).attr('width', Math.max(0, worse[2])).attr('height', Math.max(0, worse[3]));
    }
    if (tf.length) {
      const pts = tf.map((p) => [A.sx(p.shown[1]), A.sy(p.shown[0])]).sort((a, b) => a[0] - b[0]);
      clipped.append('path').attr('class', 'pv-truefront').attr('d', d3.line().curve(d3.curveStepAfter)(pts));
      pts.forEach((p) => clipped.append('circle').attr('class', 'pv-truefront-pt').attr('cx', p[0]).attr('cy', p[1]).attr('r', 2.5));
    }
    if (step.front) {
      const f1 = model.front1.slice().sort((i, j) => xs[i] - xs[j] || ys[i] - ys[j]);
      clipped.append('path').attr('class', 'pv-front').attr('d', d3.line().curve(d3.curveStepAfter)(f1.map(P)));
    }
    if (step.iso) {
      const n = model.norm;
      const w = model.w;
      const s = model.scores[model.best];
      // puntos de la recta w·n₁ + (1 − w)·n₂ = s en coordenadas normalizadas, pasados a los objetivos
      const toShown = (n1, n2) => {
        const o1 = n[0].lo + n1 * (n[0].hi - n[0].lo);
        const o2 = n[1].lo + n2 * (n[1].hi - n[1].lo);
        return [A.sx(o2), A.sy(knap ? -o1 : o1)];
      };
      const ends = w > 0 ? [-1, 2].map((n2) => toShown((s - (1 - w) * n2) / w, n2)) : [-1, 2].map((n1) => toShown(n1, s));
      clipped.append('line').attr('class', 'pv-iso').attr('x1', ends[0][0]).attr('y1', ends[0][1]).attr('x2', ends[1][0]).attr('y2', ends[1][1]);
    }
    for (let i = 0; i < N; i++) {
      const [x, y] = P(i);
      let cls = 'pv-objpt';
      if (step.front) cls += model.rank[i] === 1 ? ' f1' : ' fk';
      if (step.cone != null) {
        if (model.dominatedBy[step.cone].indexOf(i) !== -1) cls += ' dom-by';
        if (model.dominatesList[step.cone].indexOf(i) !== -1) cls += ' doms';
      }
      if (i === step.ind) cls += ' current';
      g.append('circle').attr('class', cls).attr('cx', x).attr('cy', y).attr('r', i === step.ind ? 7 : 5);
      if (step.sweep && model.rank[i] === 1) g.append('circle').attr('class', `pv-sup${model.supported.has(i) ? '' : ' no'}`).attr('cx', x).attr('cy', y).attr('r', 10);
    }
    // Etiquetas: los individuos con los mismos objetivos comparten punto y etiqueta («I1 · I5»)
    if (N <= 12) {
      const groups = new Map();
      for (let i = 0; i < N; i++) {
        const k = `${xs[i]},${ys[i]}`;
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(i);
      }
      groups.forEach((ids) => {
        const [x, y] = P(ids[0]);
        g.append('text').attr('class', 'pv-pt-label').attr('x', x + 7).attr('y', y - 7).text(ids.map((i) => `I${i + 1}`).join(' · '));
      });
    }
  };
})(typeof self !== 'undefined' ? self : this);
