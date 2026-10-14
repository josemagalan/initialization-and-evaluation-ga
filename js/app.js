/*
 * Controlador de la página: enrutado, idioma y URL.
 *
 * URL: #lang=es                 → pantalla inicial
 *      #item=<id>&lang=es&…     → página de una estrategia o aspecto (a partir de la fase 1)
 *      #page=about&lang=es      → acerca de
 * También se acepta ?lang=es en la dirección, como en el portal de la serie.
 */
(function () {
  'use strict';
  const G = window.GAX;
  const { i18n, registry, createHome } = G;

  const $ = (id) => document.getElementById(id);
  const el = {
    homeView: $('homeView'), famGrid: $('famGrid'),
    aboutView: $('aboutView'), aboutBody: $('aboutBody'), siteFoot: $('siteFoot'),
  };

  const fromQuery = new URLSearchParams(location.search).get('lang');
  const state = {
    lang: i18n.languages.indexOf(fromQuery) !== -1 ? fromQuery
      : (navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'es',
    view: 'home',
  };

  const t = (key, params) => i18n.t(state.lang, key, params);
  const home = createHome(el.famGrid, { registry, t, lang: () => state.lang });

  // ---------- Idioma ----------

  function applyLanguage() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach((node) => node.setAttribute('aria-label', t(node.dataset.i18nAria)));
    document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
    $('portalLink').href = `https://josemagalan.github.io/genetic-algorithms-lab/?lang=${state.lang}`;
    ['representation', 'selection', 'crossover', 'mutation'].forEach((k) => {
      $(`sister-${k}`).href = G.about.sisterUrl(state.lang, k);
    });
    G.about.renderFooter(el.siteFoot, state.lang);
    if (state.view === 'about') {
      document.title = `${G.about.text[state.lang].title} · ${t('brand')}`;
      G.about.renderAbout(el.aboutBody, state.lang);
    } else {
      document.title = t('homeTitleDoc');
      home.render();
    }
    writeHash();
  }

  // ---------- Enrutado ----------

  function show(which) {
    const changed = state.view !== which;
    state.view = which;
    el.homeView.hidden = which !== 'home';
    el.aboutView.hidden = which !== 'about';
    if (changed) window.scrollTo(0, 0);
  }

  function route() {
    const q = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (i18n.languages.indexOf(q.get('lang')) !== -1) state.lang = q.get('lang');
    if (q.get('page') === 'about') show('about');
    else show('home');   // un #item= aún no disponible lleva a la pantalla inicial
    applyLanguage();
  }

  // Guarda el estado en la URL sin crear entradas de historial (para proyectar o compartir).
  function writeHash() {
    const params = new URLSearchParams();
    if (state.view === 'about') params.set('page', 'about');
    params.set('lang', state.lang);
    const h = params.toString();
    if (location.hash.replace(/^#/, '') === h) return;
    try { history.replaceState(null, '', `#${h}`); } catch (err) { /* file:// en algunos navegadores */ }
  }

  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => {
    state.lang = b.dataset.lang;
    applyLanguage();
  }));

  // Enlaces a la pantalla inicial conservando el idioma
  [$('brandLink'), $('aboutBack')].forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    location.hash = `lang=${state.lang}`;
  }));

  window.addEventListener('hashchange', route);

  // ---------- Arranque ----------
  route();
  G.a11y.watch(document, () => t('scrollRegion'));
})();
