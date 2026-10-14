/*
 * Vista de una población (D3): la rejilla de cromosomas, un individuo por fila, y un panel con el espacio de
 * soluciones de cada problema (mapa de la función, rutas del viajante, peso y valor de la mochila o makespan
 * de la asignación) o, en el paso de la diversidad, la matriz de distancias entre individuos.
 *
 * show(step, model, width) dibuja un paso. model = { enc, inst, pop, draws, shape, measures, quality, qualityLabel }:
 *   step.done     individuos completos que se ven
 *   step.ind      individuo que se está generando o se acaba de generar (resaltado)
 *   step.draw     sorteo del primer individuo que se está mostrando (etapa 3)
 *   step.show     'distance' para ver la matriz de distancias en el panel
 *   step.partial  { known, active }: genes ya decididos del individuo 1 (en cualquier orden) y los que se deciden ahora
 *   step.cand     candidato que se está examinando (inhibición secuencial): fila extra bajo la población
 *   step.grid     'strata': rejilla de N × N estratos en el mapa de la función
 *   step.ghost    dibuja también la población uniforme de la misma semilla (model.uniformPop), en hueco
 *   step.hole     dibuja el mayor hueco de las dos poblaciones (model.measures.coverage)
 * Con poco ancho, el panel pasa debajo de la rejilla.
 */
(function (root) {
  'use strict';

  const ROW = 28;          // alto de una fila de la rejilla
  const TOP = 52;          // espacio para el título de cada panel y la cabecera de los genes
  const LABEL = 42;        // columna de etiquetas (I1, I2…)
  const QCOL = 84;         // columna de la calidad (objetivo)
  const PANEL = 330;       // lado del panel
  const GAP = 44;

  function createPopulationView(opts) {
    const svg = d3.select(opts.svg);
    const t = opts.t;
    const fmt = opts.fmt;
    const fmtFixed = opts.fmtFixed;
    const Fn = root.GAX.func;
    const S = root.GAX.space;

    svg.selectAll(':scope > g').remove();   // el <title> de la figura se conserva
    const gGrid = svg.append('g').attr('class', 'pv-grid');
    const gPanel = svg.append('g').attr('class', 'pv-panel');
    let contours = { key: null, polys: null };

    // ---------- Geometría ----------

    function cellWidth(sh) {
      if (sh.kind === 'real') return 70;
      if (sh.kind === 'matrix') return 20;
      if (sh.kind === 'bits' && sh.length > 12) return 22;
      return 26;
    }
    function cellX(sh, g) {
      const w = cellWidth(sh);
      if (sh.kind === 'matrix') return g * (w + 2) + Math.floor(g / sh.m) * 8;
      if (sh.kind === 'bits' && sh.k) return g * (w + 2) + (g >= sh.k ? 10 : 0);
      return g * (w + 2);
    }
    function layout(model, width) {
      const sh = model.shape;
      const cw = cellWidth(sh);
      const cells = cellX(sh, sh.length - 1) + cw;
      const gridW = LABEL + cells + 12 + QCOL + (model.candidates ? 10 : 0);
      const gridH = TOP + model.pop.length * ROW + (model.candidates ? ROW + 14 : 0);
      const side = width >= gridW + GAP + PANEL;
      const panelX = side ? gridW + GAP : Math.max(0, (Math.max(gridW, PANEL) - PANEL) / 2);
      const panelY = side ? 0 : gridH + 26;
      const W = side ? gridW + GAP + PANEL : Math.max(gridW, PANEL);
      const H = (side ? Math.max(gridH, TOP + PANEL + 20) : panelY + TOP + PANEL + 20) + 6;
      return { sh, cw, cells, gridW, gridH, panelX, panelY, W, H };
    }

    // ---------- Qué individuos se ven ----------

    const isSeedRow = (model, i) => !!model.seedRows && model.seedRows.indexOf(i) !== -1;
    /** ¿Se ve completo el individuo i? onlySeed: solo las semillas; onlyRandom: solo los aleatorios. */
    function visible(model, step, i) {
      if (step.onlySeed) return isSeedRow(model, i);
      if (step.onlyRandom) return !isSeedRow(model, i) && i < step.done;
      return i < step.done;
    }
    const shownIdx = (model, step) => d3.range(model.pop.length).filter((i) => visible(model, step, i));

    // ---------- Rejilla ----------

    const geneText = (sh, v) => (sh.kind === 'real' ? fmtFixed(v, 2) : String(v));

    function drawGrid(step, model, L) {
      const sh = L.sh;
      const N = model.pop.length;
      gGrid.selectAll('*').remove();
      gGrid.append('text').attr('class', 'pv-title').attr('x', 0).attr('y', 16).text(t('pvPopTitle', { N }));
      gGrid.append('text').attr('class', 'pv-title pv-qtitle').attr('x', LABEL + L.cells + 12 + QCOL).attr('y', 16)
        .attr('text-anchor', 'end').text(t(model.qualityLabel));
      if (sh.kind === 'matrix') {
        for (let i = 0; i < sh.n; i++) {
          gGrid.append('text').attr('class', 'pv-sub').attr('text-anchor', 'middle')
            .attr('x', LABEL + cellX(sh, i * sh.m) + (sh.m * (L.cw + 2) - 2) / 2).attr('y', TOP - 18).text(t('pvTask', { i: i + 1 }));
        }
      }
      if (sh.kind === 'real') {
        ['x₁', 'x₂'].forEach((lab, v) => gGrid.append('text').attr('class', 'pv-sub').attr('text-anchor', 'middle')
          .attr('x', LABEL + cellX(sh, v) + L.cw / 2).attr('y', TOP - 18).text(lab));
      } else if (sh.kind !== 'matrix' && !sh.k) {
        for (let g = 0; g < sh.length; g++) {
          gGrid.append('text').attr('class', 'pv-sub').attr('text-anchor', 'middle')
            .attr('x', LABEL + cellX(sh, g) + L.cw / 2).attr('y', TOP - 18).text(g + 1);
        }
      }
      if (sh.kind === 'bits' && sh.k) {
        ['x₁', 'x₂'].forEach((lab, v) => gGrid.append('text').attr('class', 'pv-sub').attr('text-anchor', 'middle')
          .attr('x', LABEL + cellX(sh, v * sh.k) + (sh.k * (L.cw + 2) - 2) / 2).attr('y', TOP - 18).text(lab));
      }
      const partial = step.partial || null;
      const first = !partial && step.stage === 3 && step.draw != null ? step : null;
      const d0 = first ? model.draws[0][first.draw] : null;
      for (let i = 0; i < N; i++) {
        const isSeed = isSeedRow(model, i);
        const complete = visible(model, step, i);
        const building = (!!first || !!partial) && i === 0;
        const row = gGrid.append('g')
          .attr('class', `pv-row${i === step.ind ? ' current' : ''}${!complete && !building ? ' pending' : ''}${isSeed && complete ? ' seed' : ''}`)
          .attr('transform', `translate(0,${TOP + i * ROW})`);
        if (isSeed && complete) row.append('rect').attr('class', 'pv-seedmark').attr('x', 2).attr('y', 4).attr('width', 5).attr('height', ROW - 8).attr('rx', 2);
        row.append('text').attr('class', 'pv-label').attr('x', LABEL - 10).attr('y', ROW / 2 + 5).attr('text-anchor', 'end').text(`I${i + 1}`);
        let genes = null;
        let known = 0;
        if (complete) { genes = model.pop[i]; known = sh.length; } else if (building && partial) {
          genes = model.pop[0];
        } else if (building) {
          if (sh.kind === 'perm') { genes = d0.after; known = sh.length; } else { genes = model.pop[0]; known = first.draw + 1; }
        }
        for (let g = 0; g < sh.length; g++) {
          const has = !!genes && (building && partial && !complete ? partial.known.indexOf(g) !== -1 : g < known);
          const v = has ? genes[g] : null;
          let cls = 'pv-gene';
          if (!has) cls += ' empty';
          else if (sh.kind === 'bits' || sh.kind === 'matrix') cls += v ? ' one' : ' zero';
          else cls += ' val';
          if (building && partial) {
            if ((partial.active || []).indexOf(g) !== -1) cls += ' active';
          } else if (building) {
            if (sh.kind === 'perm') {
              if (g === d0.k - 1 || g === d0.j - 1) cls += ' active';
              else if (g >= d0.k) cls += ' fixed';
            } else if (g === first.draw) cls += ' active';
          }
          const cell = row.append('g').attr('class', cls).attr('transform', `translate(${LABEL + cellX(sh, g)},3)`);
          cell.append('rect').attr('width', L.cw).attr('height', ROW - 6).attr('rx', 5);
          if (has) cell.append('text').attr('x', L.cw / 2).attr('y', ROW / 2 + 2).attr('text-anchor', 'middle').text(geneText(sh, v));
        }
        if (building && sh.kind === 'perm' && d0.j !== d0.k) {
          const x1 = LABEL + cellX(sh, d0.j - 1) + L.cw / 2;
          const x2 = LABEL + cellX(sh, d0.k - 1) + L.cw / 2;
          row.append('path').attr('class', 'pv-swap').attr('d', `M${x1},3 C${x1},-13 ${x2},-13 ${x2},3`);
        }
        if (complete) {
          const q = model.quality[i];
          row.append('text').attr('class', `pv-q${q.feasible ? '' : ' infeasible'}`).attr('x', LABEL + L.cells + 12 + QCOL)
            .attr('y', ROW / 2 + 5).attr('text-anchor', 'end').text(q.feasible ? fmt(q.objective) : t('pvInfeasible'));
        }
      }
    }

    /** Fila del candidato (inhibición secuencial), bajo la población. */
    function drawCandidate(step, model, L) {
      const sh = L.sh;
      const cd = model.candidates[step.cand];
      const y = TOP + model.pop.length * ROW + 14;
      const row = gGrid.append('g').attr('class', `pv-row pv-cand ${cd.accepted ? 'ok' : 'rej'}`).attr('transform', `translate(0,${y})`);
      row.append('rect').attr('class', 'pv-cand-bg').attr('x', 0).attr('y', 0).attr('width', LABEL + L.cells + 12 + QCOL + 8).attr('height', ROW).attr('rx', 6);
      row.append('text').attr('class', 'pv-label').attr('x', LABEL - 10).attr('y', ROW / 2 + 5).attr('text-anchor', 'end').text(`C${step.cand + 1}`);
      for (let g = 0; g < sh.length; g++) {
        const v = cd.x[g];
        let cls = 'pv-gene';
        if (sh.kind === 'bits' || sh.kind === 'matrix') cls += v ? ' one' : ' zero';
        else cls += ' val';
        const cell = row.append('g').attr('class', cls).attr('transform', `translate(${LABEL + cellX(sh, g)},3)`);
        cell.append('rect').attr('width', L.cw).attr('height', ROW - 6).attr('rx', 5);
        cell.append('text').attr('x', L.cw / 2).attr('y', ROW / 2 + 2).attr('text-anchor', 'middle').text(geneText(sh, v));
      }
      const txt = cd.dmin == null ? t('pvCandFirst') : t(cd.accepted ? 'pvCandOk' : 'pvCandRej', { d: fmtFixed(cd.dmin, 2) });
      row.append('text').attr('class', `pv-q${cd.accepted ? '' : ' infeasible'}`).attr('x', LABEL + L.cells + 12 + QCOL)
        .attr('y', ROW / 2 + 5).attr('text-anchor', 'end').text(txt);
      if (cd.nearest != null && step.done > cd.nearest) {
        // marca el individuo más cercano
        gGrid.append('rect').attr('class', 'pv-near').attr('x', 1).attr('y', TOP + cd.nearest * ROW + 1)
          .attr('width', LABEL + L.cells + 4).attr('height', ROW - 2).attr('rx', 6);
      }
    }

    // ---------- Paneles ----------

    function panelFrame(L, titleKey, params) {
      gPanel.selectAll('*').remove();
      gPanel.attr('transform', `translate(${L.panelX},${L.panelY})`);
      gPanel.append('text').attr('class', 'pv-title').attr('x', 0).attr('y', 16).text(t(titleKey, params));
      return gPanel.append('g').attr('transform', `translate(0,${TOP})`);
    }

    function contourPolys(fnId) {
      if (contours.key === fnId) return contours.polys;
      const F = Fn.fnOf(fnId);
      const G = 64;
      // Himmelblau va de 0 a casi 2000: escala logarítmica; Rastrigin, lineal (se ven las ondas)
      const tf = fnId === 'himmelblau' ? Math.log1p : (v) => v;
      const values = new Float64Array(G * G);
      let vmax = 0;
      const w = (F.b - F.a) / G;
      for (let r = 0; r < G; r++) {
        const y = F.b - (r + 0.5) * w;
        for (let c = 0; c < G; c++) {
          const v = tf(Math.max(0, F.f(F.a + (c + 0.5) * w, y)));
          values[r * G + c] = v;
          if (v > vmax) vmax = v;
        }
      }
      const th = d3.range(1, 13).map((q) => (q / 13) * vmax);
      contours = { key: fnId, polys: d3.contours().size([G, G]).thresholds(th)(values), G };
      return contours.polys;
    }

    function drawFunction(step, model, L) {
      const inst = model.inst;
      const F = Fn.fnOf(inst.fn);
      const g = panelFrame(L, 'pvMapTitle');
      const sx = d3.scaleLinear().domain([F.a, F.b]).range([0, PANEL]);
      const sy = d3.scaleLinear().domain([F.a, F.b]).range([PANEL, 0]);
      const polys = contourPolys(inst.fn);
      const path = d3.geoPath(d3.geoIdentity().scale(PANEL / contours.G));
      g.append('rect').attr('class', 'fbase').attr('width', PANEL).attr('height', PANEL);
      g.selectAll('path.fband').data(polys).join('path').attr('class', 'fband').attr('d', path);
      g.append('rect').attr('class', 'fbox').attr('width', PANEL).attr('height', PANEL);
      F.minima.forEach((m) => g.append('path').attr('class', 'pv-min')
        .attr('d', d3.symbol(d3.symbolCross, 80)()).attr('transform', `translate(${sx(m[0])},${sy(m[1])}) rotate(45)`));
      const N = model.pop.length;
      if (step.grid === 'strata') {
        for (let k = 1; k < N; k++) {
          g.append('line').attr('class', 'pv-strata').attr('x1', (k * PANEL) / N).attr('x2', (k * PANEL) / N).attr('y1', 0).attr('y2', PANEL);
          g.append('line').attr('class', 'pv-strata').attr('y1', (k * PANEL) / N).attr('y2', (k * PANEL) / N).attr('x1', 0).attr('x2', PANEL);
        }
      }
      const scaleR = PANEL / (F.b - F.a);
      // Lo que pueda salirse de la caja (huecos, círculos δ) se recorta a ella
      g.append('clipPath').attr('id', 'pvFnClip').append('rect').attr('width', PANEL).attr('height', PANEL);
      const clipped = g.append('g').attr('clip-path', 'url(#pvFnClip)');
      if (step.hole && model.measures.coverage) {
        const holes = [['pv-hole', model.measures.coverage.hole]];
        if (model.uniformMeasures) holes.unshift(['pv-hole ghost', model.uniformMeasures.coverage.hole]);
        holes.forEach(([cls, h]) => {
          clipped.append('circle').attr('class', cls).attr('cx', sx(h.center[0])).attr('cy', sy(h.center[1])).attr('r', h.radius * scaleR);
          clipped.append('circle').attr('class', `${cls} centre`).attr('cx', sx(h.center[0])).attr('cy', sy(h.center[1])).attr('r', 3);
        });
      }
      if (step.ghost && model.uniformPop) {
        g.selectAll('circle.pv-ghost').data(model.uniformPop.map((x) => S.point(model.enc, model.inst, x))).join('circle')
          .attr('class', 'pv-ghost').attr('cx', (p) => sx(p[0])).attr('cy', (p) => sy(p[1])).attr('r', 4.5);
      }
      if (model.delta != null && model.candidates && step.stage <= 3) {
        // círculos de radio δ (en diagonales de la caja) alrededor de los individuos aceptados
        const r = model.delta * Math.SQRT2 * PANEL;
        shownIdx(model, step).forEach((i) => {
          const p = model.quality[i].point;
          clipped.append('circle').attr('class', 'pv-delta').attr('cx', sx(p[0])).attr('cy', sy(p[1])).attr('r', r);
        });
      }
      const pts = shownIdx(model, step).map((i) => ({ i, p: model.quality[i].point }));
      if (step.cand != null) {
        const cd = model.candidates[step.cand];
        const p = S.point(model.enc, model.inst, cd.x);
        g.append('path').attr('class', `pv-candpt ${cd.accepted ? 'ok' : 'rej'}`).attr('d', d3.symbol(d3.symbolDiamond, 110)())
          .attr('transform', `translate(${sx(p[0])},${sy(p[1])})`);
      }
      const dots = g.selectAll('g.pv-pt').data(pts).join('g').attr('class', (d) => `pv-pt${d.i === step.ind ? ' current' : ''}`)
        .attr('transform', (d) => `translate(${sx(d.p[0])},${sy(d.p[1])})`);
      dots.append('circle').attr('r', (d) => (d.i === step.ind ? 7 : 5));
      dots.filter((d) => model.pop.length <= 12 || d.i === step.ind).append('text').attr('class', 'pv-pt-label').attr('x', 8).attr('y', -6).text((d) => `I${d.i + 1}`);
      g.append('text').attr('class', 'pv-axis').attr('x', 0).attr('y', PANEL + 16).text(fmt(F.a));
      g.append('text').attr('class', 'pv-axis').attr('x', PANEL).attr('y', PANEL + 16).attr('text-anchor', 'end').text(fmt(F.b));
      g.append('text').attr('class', 'pv-axis').attr('x', PANEL / 2).attr('y', PANEL + 16).attr('text-anchor', 'middle').text(t('pvMinima'));
    }

    function drawTsp(step, model, L) {
      const g = panelFrame(L, 'pvRoutesTitle');
      const N = model.pop.length;
      const cols = Math.ceil(Math.sqrt(N));
      const rows = Math.ceil(N / cols);
      const cell = Math.min(PANEL / cols, PANEL / rows);
      const s = (v) => 5 + (v / 100) * (cell - 22);
      const coords = model.inst.coords;
      for (let i = 0; i < N; i++) {
        const vis = visible(model, step, i);
        const m = g.append('g').attr('class', `pv-mini${i === step.ind ? ' current' : ''}${vis ? '' : ' pending'}${vis && isSeedRow(model, i) ? ' seed' : ''}`)
          .attr('transform', `translate(${(i % cols) * cell},${Math.floor(i / cols) * cell})`);
        m.append('rect').attr('class', 'pv-mini-bg').attr('width', cell - 6).attr('height', cell - 6).attr('rx', 6);
        if (vis) {
          const tour = model.pop[i];
          m.append('path').attr('class', 'pv-route')
            .attr('d', tour.map((c, k) => `${k ? 'L' : 'M'}${s(coords[c - 1][0])},${s(100 - coords[c - 1][1])}`).join('') + 'Z');
        }
        coords.forEach((p) => m.append('circle').attr('class', 'pv-city').attr('cx', s(p[0])).attr('cy', s(100 - p[1])).attr('r', 2.4));
        m.append('text').attr('class', 'pv-mini-label').attr('x', 5).attr('y', cell - 11).text(`I${i + 1}`);
      }
    }

    function drawKnapsack(step, model, L) {
      const inst = model.inst;
      const g = panelFrame(L, 'pvKnapsackTitle');
      const W = inst.weights.reduce((a, b) => a + b, 0);
      const V = inst.values.reduce((a, b) => a + b, 0);
      const x0 = 34;
      const y1 = PANEL - 24;
      const sx = d3.scaleLinear().domain([0, W]).range([x0, PANEL - 8]);
      const sy = d3.scaleLinear().domain([0, V]).range([y1, 6]);
      g.append('rect').attr('class', 'pv-feasible-band').attr('x', x0).attr('y', 0).attr('width', sx(inst.capacity) - x0).attr('height', y1);
      g.append('line').attr('class', 'pv-cap').attr('x1', sx(inst.capacity)).attr('x2', sx(inst.capacity)).attr('y1', 0).attr('y2', y1);
      g.append('text').attr('class', 'pv-axis').attr('x', sx(inst.capacity) + 5).attr('y', y1 - 6).text(t('pvCapacity', { W: inst.capacity }));
      const opt = model.measures.optimum;
      g.append('line').attr('class', 'pv-opt').attr('x1', x0).attr('x2', PANEL).attr('y1', sy(opt)).attr('y2', sy(opt));
      g.append('text').attr('class', 'pv-axis pv-opt-label').attr('x', PANEL).attr('y', sy(opt) - 5).attr('text-anchor', 'end').text(t('pvOptimum', { v: fmt(opt) }));
      g.append('line').attr('class', 'pv-axisline').attr('x1', x0).attr('x2', PANEL).attr('y1', y1).attr('y2', y1);
      g.append('line').attr('class', 'pv-axisline').attr('x1', x0).attr('x2', x0).attr('y1', 0).attr('y2', y1);
      g.append('text').attr('class', 'pv-axis').attr('x', PANEL).attr('y', y1 + 18).attr('text-anchor', 'end').text(t('pvWeight'));
      g.append('text').attr('class', 'pv-axis').attr('x', x0 - 6).attr('y', 10).attr('text-anchor', 'end').text(t('pvValue'));
      if (step.ghost && model.uniformPop) {
        const KS = root.GAX.problems['knapsack-bits'];
        g.selectAll('circle.pv-ghost').data(model.uniformPop).join('circle').attr('class', 'pv-ghost')
          .attr('cx', (x) => sx(KS.weightOf(inst, x))).attr('cy', (x) => sy(KS.valueOf(inst, x))).attr('r', 4.5);
      }
      if (step.cand != null) {
        const KS = root.GAX.problems['knapsack-bits'];
        const cd = model.candidates[step.cand];
        g.append('path').attr('class', `pv-candpt ${cd.accepted ? 'ok' : 'rej'}`).attr('d', d3.symbol(d3.symbolDiamond, 110)())
          .attr('transform', `translate(${sx(KS.weightOf(inst, cd.x))},${sy(KS.valueOf(inst, cd.x))})`);
      }
      const pts = shownIdx(model, step).map((i) => ({ i, q: model.quality[i] }));
      const dots = g.selectAll('g.pv-pt').data(pts).join('g')
        .attr('class', (d) => `pv-pt${d.q.feasible ? '' : ' infeasible'}${d.i === step.ind ? ' current' : ''}`)
        .attr('transform', (d) => `translate(${sx(d.q.weight)},${sy(d.q.value)})`);
      dots.append('circle').attr('r', (d) => (d.i === step.ind ? 7 : 5));
      dots.filter((d) => isSeedRow(model, d.i)).classed('seed', true);
    }

    function drawAssignment(step, model, L) {
      const g = panelFrame(L, 'pvMakespanTitle');
      const N = model.pop.length;
      const objs = model.quality.map((q) => q.objective).filter((v) => v != null);
      const opt = model.measures.optimum;
      const max = Math.max(opt, ...objs, 1);
      const sx = d3.scaleLinear().domain([0, max]).range([34, PANEL - 8]);
      const rowH = Math.min(ROW, (PANEL - 30) / N);
      for (let i = 0; i < N; i++) {
        const r = g.append('g').attr('class', `pv-barrow${i === step.ind ? ' current' : ''}`).attr('transform', `translate(0,${i * rowH})`);
        r.append('text').attr('class', 'pv-axis').attr('x', 28).attr('y', rowH / 2 + 4).attr('text-anchor', 'end').text(`I${i + 1}`);
        if (!visible(model, step, i)) continue;
        const q = model.quality[i];
        if (q.feasible) r.append('rect').attr('class', `pv-bar${isSeedRow(model, i) ? ' seed' : ''}`).attr('x', 34).attr('y', 3).attr('height', rowH - 6).attr('width', sx(q.objective) - 34);
        else {
          r.append('rect').attr('class', 'pv-bar infeasible').attr('x', 34).attr('y', 3).attr('height', rowH - 6).attr('width', PANEL - 42);
          r.append('text').attr('class', 'pv-bar-note').attr('x', 40).attr('y', rowH / 2 + 4).text(q.violations != null ? t('pvInfeasibleV', { v: q.violations }) : t('pvInfeasible'));
        }
      }
      g.append('line').attr('class', 'pv-opt').attr('x1', sx(opt)).attr('x2', sx(opt)).attr('y1', -4).attr('y2', N * rowH + 4);
      g.append('text').attr('class', 'pv-axis pv-opt-label').attr('x', sx(opt)).attr('y', N * rowH + 18).attr('text-anchor', 'middle').text(t('pvOptimum', { v: fmt(opt) }));
    }

    function drawDistances(step, model, L) {
      const g = panelFrame(L, `pvDistTitle_${S.DISTANCE_KIND[model.enc]}`);
      const D = model.measures.D;
      const N = D.length;
      const c = Math.min(30, (PANEL - 30) / N);
      const css = getComputedStyle(document.documentElement);
      const lo = css.getPropertyValue('--card').trim() || '#ffffff';
      const hi = css.getPropertyValue('--p1').trim() || '#0072b2';
      const color = d3.interpolateRgb(lo, hi);
      for (let i = 0; i < N; i++) {
        g.append('text').attr('class', 'pv-axis').attr('x', 26).attr('y', 26 + i * c + c / 2 + 4).attr('text-anchor', 'end').text(`I${i + 1}`);
        if (N <= 12) g.append('text').attr('class', 'pv-axis').attr('x', 30 + i * c + c / 2).attr('y', 18).attr('text-anchor', 'middle').text(`${i + 1}`);
        for (let j = 0; j < N; j++) {
          const v = D[i][j];
          const cell = g.append('g').attr('transform', `translate(${30 + j * c},${26 + i * c})`);
          cell.append('rect').attr('class', `pv-dcell${i === j ? ' diag' : ''}${v === 0 && i !== j ? ' zero' : ''}`)
            .attr('width', c - 1).attr('height', c - 1).attr('fill', i === j ? null : color(v));
          if (N <= 10 && i !== j) {
            cell.append('text').attr('class', `pv-dtext${v > 0.5 ? ' light' : ''}`).attr('x', (c - 1) / 2).attr('y', c / 2 + 3)
              .attr('text-anchor', 'middle').text(fmtFixed(v, 2).replace(/^0(?=[.,])/, ''));
          }
        }
      }
      g.append('text').attr('class', 'pv-axis').attr('x', 30).attr('y', 26 + N * c + 18).text(t('pvDistScale'));
    }


    function drawTakeover(step, model, L) {
      const g = panelFrame(L, 'pvTakeoverTitle');
      const curve = model.curve;
      const N = model.pop.length;
      const G = curve[curve.length - 1].g;
      const x0 = 34;
      const y1 = PANEL - 30;
      const sx = d3.scaleLinear().domain([0, G]).range([x0, PANEL - 10]);
      const sy = d3.scaleLinear().domain([0, N]).range([y1, 8]);
      g.append('line').attr('class', 'pv-axisline').attr('x1', x0).attr('x2', PANEL - 10).attr('y1', y1).attr('y2', y1);
      g.append('line').attr('class', 'pv-axisline').attr('x1', x0).attr('x2', x0).attr('y1', 0).attr('y2', y1);
      g.append('line').attr('class', 'pv-cap').attr('x1', x0).attr('x2', PANEL - 10).attr('y1', sy(N)).attr('y2', sy(N));
      g.append('text').attr('class', 'pv-axis').attr('x', x0 + 4).attr('y', sy(N) - 5).text(t('pvTakeoverAll', { N }));
      d3.range(0, G + 1).forEach((k) => g.append('text').attr('class', 'pv-axis').attr('x', sx(k)).attr('y', y1 + 16).attr('text-anchor', 'middle').text(k));
      [0, Math.round(N / 2), N].forEach((k) => g.append('text').attr('class', 'pv-axis').attr('x', x0 - 6).attr('y', sy(k) + 4).attr('text-anchor', 'end').text(k));
      g.append('text').attr('class', 'pv-axis').attr('x', PANEL - 10).attr('y', y1 + 30).attr('text-anchor', 'end').text(t('pvGeneration'));
      const shown = curve.filter((c) => c.g <= step.gen);
      g.append('path').attr('class', 'pv-curve').attr('d', d3.line().x((c) => sx(c.g)).y((c) => sy(c.k))(shown));
      g.selectAll('circle.pv-cdot').data(shown).join('circle').attr('class', (c) => `pv-cdot${c.g === step.gen ? ' current' : ''}`)
        .attr('cx', (c) => sx(c.g)).attr('cy', (c) => sy(c.k)).attr('r', (c) => (c.g === step.gen ? 6 : 4));
    }

    function show(step, model, width) {
      const L = layout(model, width || 900);
      svg.attr('viewBox', `0 0 ${L.W} ${L.H}`).attr('width', L.W).attr('height', L.H);
      drawGrid(step, model, L);
      if (step.cand != null && model.candidates) drawCandidate(step, model, L);
      if (step.show === 'distance') drawDistances(step, model, L);
      else if (step.show === 'takeover') drawTakeover(step, model, L);
      else if (model.enc === 'function-real' || model.enc === 'function-bits') drawFunction(step, model, L);
      else if (model.enc === 'tsp-perm') drawTsp(step, model, L);
      else if (model.enc === 'knapsack-bits') drawKnapsack(step, model, L);
      else drawAssignment(step, model, L);
    }

    return { show, layout };
  }

  (root.GAX = root.GAX || {}).createPopulationView = createPopulationView;
})(typeof self !== 'undefined' ? self : this);
