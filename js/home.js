/*
 * Pantalla inicial: las dos familias (inicialización y evaluación) y sus elementos, a partir del registro.
 * Los elementos disponibles son enlaces (#item=<id>); el resto aparecen como «próximamente».
 * Cada elemento lleva su nivel con el nombre completo y el color del libro (Básico, Avanzado, Para saber más).
 */
(function (root) {
  'use strict';

  const LEVEL_CLASS = { B: 'basic', A: 'advanced', '+': 'further' };

  function createHome(container, opts) {
    const registry = opts.registry;
    const t = opts.t;          // (key, params) => texto en el idioma actual
    const lang = opts.lang;    // () => 'es' | 'en'

    function node(tag, cls, text) {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    }

    function levelBadge(level) {
      const b = node('span', `badge-level ${LEVEL_CLASS[level]}`, t(`level${level}`));
      return b;
    }

    function item(it, l) {
      const li = node('li');
      const el = it.ready ? node('a', 'op-item') : node('div', 'op-item disabled');
      if (it.ready) el.href = `#item=${it.id}&lang=${l}`;
      else el.setAttribute('aria-disabled', 'true');
      const text = node('span', 'op-text');
      const name = node('span', 'op-name');
      name.append(document.createTextNode(`${it.name[l]} `), levelBadge(it.level));
      text.append(name, node('span', 'op-summary', it.summary[l]));
      el.append(text);
      if (it.ready) {
        const go = node('span', 'op-go', '→');
        go.setAttribute('aria-hidden', 'true');
        el.append(go);
      } else el.append(node('span', 'badge-soon', t('comingSoon')));
      li.append(el);
      return li;
    }

    function render() {
      const l = lang();
      container.replaceChildren(...registry.families.map((fam) => {
        const card = node('section', 'rep-card');
        card.dataset.family = fam.id;
        card.setAttribute('aria-labelledby', `fam-${fam.id}`);
        const head = node('div', 'rep-head');
        const h2 = node('h2', null, fam.name[l]);
        h2.id = `fam-${fam.id}`;
        const n = registry.readyCount(fam);
        head.append(h2, node('span', 'rep-count', n ? t('itemsCount', { n, total: fam.items.length }) : t('itemsCountNone')));
        const chromo = node('div', 'chromo');
        chromo.setAttribute('aria-hidden', 'true');
        fam.sample.forEach((v) => chromo.append(node('span', 'gene-mini', v)));
        const list = node('ul', 'op-list');
        fam.items.forEach((it) => list.append(item(it, l)));
        card.append(head, chromo, node('p', 'rep-desc', fam.desc[l]), list);
        return card;
      }));
    }

    return { render };
  }

  (root.GAX = root.GAX || {}).createHome = createHome;
})(typeof self !== 'undefined' ? self : this);
