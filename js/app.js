/*
 * Controlador de la página: enrutado (inicio / estrategia o aspecto / acerca de), reproductor, etapas,
 * narración, idioma y URL. Lo propio de cada elemento (controles, modelo, narración, tarjeta de medidas y
 * parámetros de la URL) está en js/ui/; la vista de la población, en js/viz/population-view.js.
 *
 * URL: #lang=es                          → pantalla inicial
 *      #item=<id>&lang=es&…&step=…       → página de una estrategia o aspecto (el resto, según js/ui/)
 *      …&practice=<tipo>                  → la misma página en modo práctica (js/practice.js)
 *      #cmp=init&lang=es&enc=…&N=…&s=…   → comparar las estrategias de inicialización (js/ui/compare-page.js)
 *      #page=about&lang=es               → acerca de
 *      #page=moodle&lang=es              → bancos de preguntas para Moodle (js/moodle-page.js)
 * También se acepta ?lang=es en la dirección, como en el portal de la serie.
 */
(function () {
  'use strict';
  const G = window.GAX;
  const { i18n, registry, createHome, createLearnPanel, practice: PR, rng: R } = G;

  const $ = (id) => document.getElementById(id);
  const el = {
    homeView: $('homeView'), famGrid: $('famGrid'), itemView: $('itemView'),
    aboutView: $('aboutView'), aboutBody: $('aboutBody'), siteFoot: $('siteFoot'),
    itemEyebrow: $('itemEyebrow'), itemTitle: $('itemTitle'), itemSubtitle: $('itemSubtitle'),
    itemControls: $('itemControls'), itemExtra: $('itemExtra'),
    stageStrip: $('stageStrip'), viz: $('viz'), vizLabel: $('vizLabel'), vizScroll: $('vizScroll'),
    btnReset: $('btnReset'), btnPrev: $('btnPrev'), btnPlay: $('btnPlay'), btnNext: $('btnNext'),
    counter: $('stepCounter'), barFill: $('barFill'), speed: $('speed'), speedOut: $('speedOut'),
    narration: $('narration'), legend: $('legend'),
    cmpView: $('cmpView'), cmpBack: $('cmpBack'),
    playerBox: $('playerBox'), narrationBox: $('narrationBox'), btnPractice: $('btnPractice'), practiceCard: $('practiceCard'),
    moodleView: $('moodleView'), moodleBody: $('moodleBody'),
  };

  const fromQuery = new URLSearchParams(location.search).get('lang');
  const state = {
    lang: i18n.languages.indexOf(fromQuery) !== -1 ? fromQuery
      : (navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'es',
    view: 'home',
    itemId: null,
    ui: null,
    result: null, step: 0, playing: false, timer: null, speed: 1,
    practice: null,   // tipo de ejercicio mientras se practica (null: paso a paso)
    ex: null,         // ejercicio de js/practice.js
    prStep: null,     // paso que dibuja la vista mientras se practica
  };

  // ---------- Textos y números ----------

  const locale = () => (state.lang === 'es' ? 'es-ES' : 'en-GB');
  const fmt = (v) => (typeof v === 'number' ? v.toLocaleString(locale(), { maximumFractionDigits: 2 }) : v);
  const fmtFixed = (v, d) => v.toLocaleString(locale(), { minimumFractionDigits: d, maximumFractionDigits: d });
  const fill = (s, params) => (params ? s.replace(/\{(\w+)\}/g, (m, p) => {
    const v = params[p];
    if (v == null) return m;
    return typeof v === 'number' ? fmt(v) : v;
  }) : s);
  const t = (key, params) => fill(i18n.t(state.lang, key), params);

  const content = () => G.content[state.itemId];
  /** Texto de la narración: primero el del contenido docente del elemento, si no, el de la interfaz. */
  function tItem(key, params) {
    const c = state.itemId && content();
    const table = c && c.narration && (c.narration[state.lang] || c.narration.es);
    return table && table[key] != null ? fill(table[key], params) : t(key, params);
  }

  const home = createHome(el.famGrid, { registry, t, lang: () => state.lang });
  let learn = null;
  let view = null;
  let cmp = null;
  const moodlePage = G.moodlePage.createMoodlePage();

  // ---------- Modelo ----------

  /** Paso que se dibuja: el del paso a paso o, practicando, el del ejercicio. */
  const curStep = () => (state.practice && state.prStep ? state.prStep : state.result && state.result.steps[state.step]);

  function recompute(stepMode) {
    state.result = state.ui.run();
    const n = state.result.steps.length;
    if (stepMode === 'start') state.step = 0;
    else if (stepMode === 'end') state.step = n - 1;
    else state.step = Math.min(state.step, n - 1);
    if (state.practice) buildExercise();
    learn.setVariant(state.ui.variant());
    renderLegend();
    renderAll();
  }

  // ---------- Practicar ----------

  const samePage = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  /** Ejercicio sobre la página actual (con el ajuste que pida el tipo, si hace falta). */
  function buildExercise() {
    let ex = PR.exercise(state.itemId, state.practice, state.ui.getPage());
    if (!samePage(ex.page, state.ui.getPage())) {
      state.ui.setPage(ex.page);
      state.result = state.ui.run();
      ex = PR.exercise(state.itemId, state.practice, state.ui.getPage());
    }
    state.ex = ex;
    const steps = state.result.steps;
    state.prStep = steps.find((st) => st.type === ex.view.type) || steps[0];
    panel.render(ex, PR.typesFor(state.itemId));
  }

  function solutionIndex() {
    const steps = state.result.steps;
    const k = steps.findIndex((st) => state.ex.solution.types.indexOf(st.type) !== -1);
    return k >= 0 ? k : steps.length - 1;
  }

  function setPracticeView(on) {
    el.playerBox.hidden = on;
    el.narrationBox.hidden = on;
    el.itemExtra.hidden = on;          // las medidas de la página darían la respuesta
    el.practiceCard.hidden = !on;
    el.btnPractice.textContent = PR.t(state.lang, on ? 'exitPractice' : 'practiceMode');
    el.btnPractice.setAttribute('aria-pressed', String(on));
  }

  function enterPractice(type) {
    stop();
    state.practice = type;
    setPracticeView(true);
    recompute('keep');
  }

  function exitPractice(toSolution) {
    const idx = toSolution && state.ex ? solutionIndex() : null;
    state.practice = null;
    state.ex = null;
    state.prStep = null;
    setPracticeView(false);
    if (idx != null) state.step = idx;
    renderAll();
    if (toSolution) el.viz.scrollIntoView({ block: 'nearest' });
  }

  const panel = G.createPracticePanel({
    root: el.practiceCard, lang: () => state.lang,
    onType(type) { state.practice = type; recompute('keep'); },
    onNew() {
      state.ui.setPage(PR.newPage(state.itemId, state.practice, R.newSeed(), state.ui.getPage()));
      recompute('start');
    },
    onSolution: () => exitPractice(true),
  });

  el.btnPractice.addEventListener('click', () => {
    if (state.practice) exitPractice(false);
    else enterPractice(PR.typesFor(state.itemId)[0]);
  });

  // ---------- Pintado ----------

  function renderStageStrip() {
    const s = curStep();
    const names = content().stages[state.lang] || content().stages.es;
    el.stageStrip.replaceChildren(...names.map((name, idx) => {
      const k = idx + 1;
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'stage-btn' + (k === s.stage ? ' current' : k < s.stage ? ' done' : '');
      if (k === s.stage && !state.practice) b.setAttribute('aria-current', 'step');
      b.disabled = !!state.practice;
      const num = document.createElement('span');
      num.className = 'stage-num';
      num.textContent = k;
      b.append(num, document.createTextNode(` ${name}`));
      b.addEventListener('click', () => { stop(); goTo(state.result.steps.findIndex((st) => st.stage === k)); });
      li.append(b);
      return li;
    }));
  }

  function renderLegend() {
    el.legend.replaceChildren(...state.ui.legend().map(([cls, key]) => {
      const li = document.createElement('li');
      const sw = document.createElement('span');
      sw.className = `sw ${cls}`;
      sw.setAttribute('aria-hidden', 'true');
      li.append(sw, document.createTextNode(t(key)));
      return li;
    }));
  }

  function renderPlayer() {
    const n = state.result.steps.length;
    el.counter.textContent = t('stepCounter', { i: state.step + 1, n });
    el.barFill.style.width = `${(100 * (state.step + 1)) / n}%`;
    el.btnPrev.disabled = state.step === 0;
    el.btnReset.disabled = state.step === 0;
    el.btnNext.disabled = state.step >= n - 1;
    el.btnPlay.classList.toggle('playing', state.playing);
    const key = state.playing ? 'pause' : 'play';
    el.btnPlay.title = t(key);
    el.btnPlay.setAttribute('aria-label', t(key));
  }

  function renderAll() {
    const s = curStep();
    const width = el.vizScroll.clientWidth || 900;
    view.show(s, state.ui.model(), width);
    const nar = state.ui.narrate(s);
    el.narration.textContent = tItem(nar.key, nar.params);
    const said = state.practice ? PR.t(state.lang, 'practiceHint') : el.narration.textContent;
    el.vizLabel.textContent = `${t('svgLabel', { name: registry.getItem(state.itemId).name[state.lang] })}. ${said}`;
    renderStageStrip();
    renderPlayer();
    if (!state.practice) state.ui.renderExtra(s);
    learn.setStep(s);
    writeHash();
  }

  function renderItemHeader() {
    const it = registry.getItem(state.itemId);
    const fam = registry.getFamily(it.family);
    el.itemEyebrow.textContent = `${fam.name[state.lang]} · ${t(`level${it.level}`)}`;
    el.itemTitle.textContent = it.name[state.lang];
    el.itemSubtitle.textContent = it.summary[state.lang];
    document.title = t('itemTitleDoc', { name: it.name[state.lang] });
  }

  // ---------- Reproductor ----------

  function goTo(i) {
    const n = state.result.steps.length;
    state.step = Math.max(0, Math.min(n - 1, i));
    renderAll();
  }
  function next() { if (state.step < state.result.steps.length - 1) goTo(state.step + 1); else stop(); }
  function prev() { stop(); goTo(state.step - 1); }
  function reset() { stop(); goTo(0); }
  function play() {
    if (state.step >= state.result.steps.length - 1) goTo(0);
    state.playing = true;
    renderPlayer();
    const tick = () => {
      if (!state.playing) return;
      next();
      if (state.playing) state.timer = setTimeout(tick, 1700 / state.speed);
    };
    state.timer = setTimeout(tick, 900 / state.speed);
  }
  function stop() {
    state.playing = false;
    clearTimeout(state.timer);
    if (state.result && state.view === 'item') renderPlayer();
  }
  function togglePlay() { if (state.playing) stop(); else play(); }

  el.btnReset.addEventListener('click', reset);
  el.btnPrev.addEventListener('click', prev);
  el.btnNext.addEventListener('click', () => { stop(); next(); });
  el.btnPlay.addEventListener('click', togglePlay);
  el.speed.addEventListener('input', () => {
    state.speed = Number(el.speed.value);
    el.speedOut.textContent = `${fmt(state.speed)}×`;
  });

  // ---------- Idioma ----------

  function applyLanguage() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach((node) => node.setAttribute('aria-label', t(node.dataset.i18nAria)));
    document.querySelectorAll('[data-i18n-title]').forEach((node) => {
      node.title = t(node.dataset.i18nTitle);
      node.setAttribute('aria-label', t(node.dataset.i18nTitle));
    });
    document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
    $('portalLink').href = `https://josemagalan.github.io/genetic-algorithms-lab/?lang=${state.lang}`;
    ['representation', 'selection', 'crossover', 'mutation'].forEach((k) => { $(`sister-${k}`).href = G.about.sisterUrl(state.lang, k); });
    G.about.renderFooter(el.siteFoot, state.lang);
    el.speedOut.textContent = `${fmt(state.speed)}×`;
    $('moodleLink').href = `#page=moodle&lang=${state.lang}`;
    el.btnPractice.textContent = PR.t(state.lang, state.practice ? 'exitPractice' : 'practiceMode');
    if (state.view === 'about') {
      document.title = `${G.about.text[state.lang].title} · ${t('brand')}`;
      G.about.renderAbout(el.aboutBody, state.lang);
    } else if (state.view === 'moodle') {
      moodlePage.render(el.moodleBody, state.lang);
    } else if (state.view === 'cmp') {
      document.title = t('compareDocTitle');
      cmp.onLanguage();
    } else if (state.view === 'item') {
      renderItemHeader();
      state.ui.onLanguage();
      learn.refresh();
      if (state.practice) panel.refresh();
      renderLegend();
      renderAll();
    } else {
      document.title = t('homeTitleDoc');
      home.render();
    }
    writeHash();
  }

  // ---------- Enrutado ----------

  function show(which) {
    stop();
    if (cmp && which !== 'cmp') cmp.stop();
    const changed = state.view !== which;
    state.view = which;
    el.homeView.hidden = which !== 'home';
    el.itemView.hidden = which !== 'item';
    el.aboutView.hidden = which !== 'about';
    el.cmpView.hidden = which !== 'cmp';
    el.moodleView.hidden = which !== 'moodle';
    if (changed) window.scrollTo(0, 0);
  }

  function showItem(id, q) {
    const same = id === state.itemId && state.view === 'item' && state.result;
    show('item');
    state.itemId = id;
    state.result = null;
    view = G.createPopulationView({ svg: el.viz, t, fmt, fmtFixed });
    state.ui = G.itemUI[id]({
      content: content(), t, fmt, fmtFixed, lang: () => state.lang,
      controlsEl: el.itemControls, extraEl: el.itemExtra,
      onChange: (mode) => recompute(mode), stop,
    });
    if (!learn) learn = createLearnPanel({ content: content(), t, lang: () => state.lang });
    state.ui.init(q);
    state.result = state.ui.run();
    learn.setContent(content(), state.ui.variant());
    state.step = Math.max(0, Math.min(state.result.steps.length - 1, Math.floor(Number(q.get('step')) || 0)));
    const pr = q.get('practice');
    state.practice = PR.typesFor(id).indexOf(pr) !== -1 ? pr : null;
    state.ex = null;
    state.prStep = null;
    setPracticeView(!!state.practice);
    if (state.practice) buildExercise();
    renderItemHeader();
    renderLegend();
    if (!same) window.scrollTo(0, 0);
  }

  function route() {
    const q = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (i18n.languages.indexOf(q.get('lang')) !== -1) state.lang = q.get('lang');
    const id = q.get('item');
    if (id && registry.isReady(id) && G.itemUI && G.itemUI[id] && G.content && G.content[id]) showItem(id, q);
    else if (q.get('cmp') === 'init') showCompare(q);
    else if (q.get('page') === 'about') show('about');
    else if (q.get('page') === 'moodle') show('moodle');
    else show('home');
    applyLanguage();
  }

  function showCompare(q) {
    const fresh = state.view !== 'cmp';
    show('cmp');
    if (!cmp) {
      cmp = G.createComparePage({
        controlsEl: $('cmpControls'), tableEl: $('cmpTable'), defsEl: $('cmpDefs'), progressEl: $('cmpProgress'), noteEl: $('cmpNote'),
        t, fmt, fmtFixed, lang: () => state.lang, onChange: () => writeHash(),
      });
    }
    // Un cambio de idioma reescribe la URL: no hace falta recalcular
    if (fresh || !state.cmpHash || state.cmpHash !== cmpKey(q)) cmp.init(q);
  }
  /** Lo que decide el cálculo de la comparación (sin el idioma). */
  const cmpKey = (q) => ['enc', 'n', 'm', 'k', 'fn', 'N', 's'].map((k) => `${k}=${q.get(k)}`).join('&');

  // Guarda el estado en la URL sin crear entradas de historial (para proyectar o compartir).
  function writeHash() {
    const params = new URLSearchParams();
    if (state.view === 'about') params.set('page', 'about');
    if (state.view === 'moodle') params.set('page', 'moodle');
    if (state.view === 'cmp' && cmp) {
      cmp.hash().forEach(([k, v]) => params.set(k, v));
      state.cmpHash = cmpKey(params);
    }
    if (state.view === 'item' && state.result) {
      params.set('item', state.itemId);
      params.set('lang', state.lang);
      state.ui.hash().forEach(([k, v]) => params.set(k, v));
      params.set('step', String(state.step));
      if (state.practice) params.set('practice', state.practice);
    } else if (state.view !== 'cmp') params.set('lang', state.lang);
    const h = params.toString();
    if (location.hash.replace(/^#/, '') === h) return;
    try { history.replaceState(null, '', `#${h}`); } catch (err) { /* file:// en algunos navegadores */ }
  }

  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => {
    state.lang = b.dataset.lang;
    applyLanguage();
  }));

  // Enlaces a la pantalla inicial conservando el idioma
  [$('brandLink'), $('backLink'), $('aboutBack'), $('cmpBack'), $('moodleBack')].forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    location.hash = `lang=${state.lang}`;
  }));

  document.addEventListener('keydown', (e) => {
    if (state.view !== 'item' || state.practice) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const scroller = tag === 'pre' || (e.target.dataset && e.target.dataset.a11yScroll);
    if (scroller && (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); stop(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === ' ' && tag !== 'button' && tag !== 'summary' && tag !== 'a') { e.preventDefault(); togglePlay(); }
    else if (e.key === 'Home') { e.preventDefault(); reset(); }
  });

  // Al cambiar el ancho, la vista recoloca el panel (al lado o debajo de la rejilla)
  let lastWidth = 0;
  window.addEventListener('resize', () => {
    if (state.view !== 'item' || !state.result) return;
    const w = el.vizScroll.clientWidth;
    if (Math.abs(w - lastWidth) < 20) return;
    lastWidth = w;
    view.show(curStep(), state.ui.model(), w);
  });

  window.addEventListener('hashchange', route);

  // Solo lectura, para comprobar la página desde fuera (pruebas en el navegador)
  G.app = {
    step: () => curStep(), model: () => state.ui && state.ui.model(),
    exercise: () => state.ex, practice: () => state.practice, answer: (resp) => panel.answer(resp),
  };

  // ---------- Arranque ----------
  route();
  G.a11y.watch(document, () => t('scrollRegion'));
})();
