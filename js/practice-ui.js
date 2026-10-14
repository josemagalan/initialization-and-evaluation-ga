/*
 * Tarjeta «Practicar» de la página de una estrategia o un aspecto: tipo de ejercicio, datos (textos y tablas),
 * casillas de respuesta (bits, sí/no y números), «Comprobar» con la corrección elemento a elemento,
 * «Nuevo ejercicio» y «Ver la solución».
 * La lógica (qué se pregunta, cuál es la respuesta y cómo se corrige) está en js/practice.js y los textos, en
 * js/practice-text.js; aquí solo se pinta. app.js decide qué hacer con onType, onNew y onSolution.
 */
(function (root) {
  'use strict';

  function createPracticePanel(opts) {
    const PR = root.GAX.practice;
    const host = opts.root;
    const lang = () => opts.lang();
    const t = (key, params) => PR.t(lang(), key, params);
    const st = { ex: null, types: [], values: {}, graded: null, err: null };

    const el = (tag, cls, attrs) => {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      Object.entries(attrs || {}).forEach(([k, v]) => { if (v != null) e.setAttribute(k, v); });
      return e;
    };
    const txt = (tag, cls, text, attrs) => { const e = el(tag, cls, attrs); e.textContent = text; return e; };
    const label = (l) => t(l.key, l.params);
    const cell = (c) => PR.cellText(c, lang());

    // ---------- Valores ----------
    function parseNumber(raw) {
      const s = String(raw).trim().replace(/−/g, '-').replace(/\s+/g, '');
      if (!s) return '';
      const norm = s.replace(',', '.');
      if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(norm)) return s;   // queda como texto: formato no válido
      return Number(norm);   // si no es entero y hace falta uno, lo dice validate
    }
    function initialValues(ex) {
      const v = {};
      ex.groups.forEach((gr) => { v[gr.id] = gr.items.map(() => (gr.kind === 'bit' ? 0 : '')); });
      return v;
    }
    const numText = (v) => (v === '' || v == null ? '' : (typeof v === 'number' ? String(v).replace(/^-/, '−').replace('.', lang() === 'es' ? ',' : '.') : v));

    // ---------- Pintado ----------
    function changed() {
      st.graded = null;
      st.err = null;
      paintResult();
    }

    function bitButton(gr, idx, caption) {
      const b = el('button', 'pr-bit', { type: 'button' });
      const sync = () => {
        const v = st.values[gr.id][idx];
        b.textContent = String(v);
        b.classList.toggle('one', v === 1);
        b.setAttribute('aria-pressed', String(v === 1));
        b.setAttribute('aria-label', `${caption}: ${v}`);
      };
      b.addEventListener('click', () => { st.values[gr.id][idx] = 1 - st.values[gr.id][idx]; sync(); changed(); });
      sync();
      return b;
    }

    function itemWrap(gr, idx, control, caption) {
      const w = el('div', `pr-item pr-${gr.kind}`, { 'data-group': gr.id, 'data-idx': String(idx) });
      if (caption != null) w.append(txt('span', 'pr-cap', caption, { 'aria-hidden': 'true' }));
      w.append(control, el('span', 'pr-fix'));
      return w;
    }

    function renderGroup(gr) {
      const fs = el('fieldset', `pr-group pr-kind-${gr.kind}`);
      const legend = t(gr.key, gr.params);
      fs.append(txt('legend', null, legend));
      const items = el('div', 'pr-items');
      const single = gr.items.length === 1;
      gr.items.forEach((it, idx) => {
        const name = label(it.label);
        const full = single ? legend : `${legend}: ${name}`;
        let control;
        if (gr.kind === 'bit') control = bitButton(gr, idx, full);
        else if (gr.kind === 'yesno') {
          control = el('div', 'seg pr-yesno', { role: 'radiogroup', 'aria-label': full });
          ['yes', 'no'].forEach((v) => {
            const b = txt('button', null, t(v === 'yes' ? 'prYes' : 'prNo'), { type: 'button', role: 'radio' });
            b.setAttribute('aria-checked', String(st.values[gr.id][idx] === v));
            b.addEventListener('click', () => {
              st.values[gr.id][idx] = v;
              Array.from(control.children).forEach((c) => c.setAttribute('aria-checked', String(c === b)));
              changed();
            });
            control.append(b);
          });
        } else {
          control = el('input', 'pr-num', { type: 'text', inputmode: gr.kind === 'int' ? 'numeric' : 'decimal', autocomplete: 'off', spellcheck: 'false', 'aria-label': full });
          control.value = numText(st.values[gr.id][idx]);
          control.addEventListener('input', () => { st.values[gr.id][idx] = parseNumber(control.value); changed(); });
        }
        items.append(itemWrap(gr, idx, control, single ? null : name));
      });
      fs.append(items);
      return fs;
    }

    function renderTable(tb) {
      const tbl = el('table', 'cmp-table pr-data');
      const thead = el('thead');
      const head = el('tr');
      tb.head.forEach((h, k) => head.append(k === 0 && cell(h) === '' ? el('td') : txt('th', null, cell(h), { scope: 'col' })));
      thead.append(head);
      const tbody = el('tbody');
      tb.rows.forEach((row) => {
        const tr = el('tr');
        tr.append(txt('th', null, cell(row[0]), { scope: 'row' }));
        row.slice(1).forEach((v) => {
          const isNum = typeof v === 'number' || (v && v.v != null);
          tr.append(txt('td', `${isNum ? 'num' : ''}${v && v.chrom ? ' mono' : ''}`.trim() || null, cell(v)));
        });
        tbody.append(tr);
      });
      tbl.append(thead, tbody);
      const sc = el('div', 'table-scroll');
      sc.append(tbl);
      return sc;
    }

    function renderGivens() {
      const box = el('div', 'practice-givens');
      box.append(txt('h3', 'pr-sub', t('prGivensTitle')));
      st.ex.givens.forEach((gv) => {
        if (gv.key) box.append(txt('p', 'practice-given', t(gv.key, gv.params)));
        if (gv.table) box.append(renderTable(gv.table));
      });
      return box;
    }

    let form = null;
    let errP = null;
    let resultBox = null;

    function render() {
      host.replaceChildren();
      const ex = st.ex;
      const head = el('div', 'practice-head');
      head.append(txt('h2', 'learn-title', t('practiceTitle'), { id: 'practice-title' }));
      if (st.types.length > 1) {
        const seg = el('div', 'seg pr-types', { role: 'group', 'aria-label': t('prTypeLabel') });
        st.types.forEach((ty) => {
          const b = txt('button', null, t(`prType_${ty}`), { type: 'button', 'aria-pressed': String(ty === ex.type) });
          b.addEventListener('click', () => { if (ty !== ex.type) opts.onType(ty); });
          seg.append(b);
        });
        head.append(seg);
      } else head.append(txt('p', 'pr-type-one', t(`prType_${ex.type}`)));
      host.append(head, txt('p', 'hint practice-intro', `${t(`prIntro_${ex.type}`)} ${t('prIntroCommon')}`), renderGivens());

      form = el('form', 'practice-form', { novalidate: '' });
      form.append(txt('h3', 'pr-sub', t('prAnswerTitle')));
      if (ex.groups.some((gr) => gr.kind === 'num')) form.append(txt('p', 'hint', t('prDecimals')));
      ex.groups.forEach((gr) => form.append(renderGroup(gr)));
      const actions = el('div', 'manual-actions');
      actions.append(txt('button', 'btn primary', t('prCheck'), { type: 'submit' }));
      const bNew = txt('button', 'btn', t('prNew'), { type: 'button' });
      bNew.addEventListener('click', () => opts.onNew());
      const bSol = txt('button', 'btn', t('prSolution'), { type: 'button' });
      bSol.addEventListener('click', () => opts.onSolution());
      errP = el('p', 'error', { role: 'alert' });
      actions.append(bNew, bSol, errP);
      form.append(actions);
      form.addEventListener('submit', (e) => { e.preventDefault(); check(); });
      resultBox = el('div', 'practice-result', { 'aria-live': 'polite' });
      host.append(form, resultBox);
      paintResult();
    }

    function check() {
      const err = PR.validate(st.ex, st.values);
      st.err = err;
      st.graded = err ? null : PR.grade(st.ex, st.values);
      paintResult();
    }

    function paintResult() {
      if (!form) return;
      errP.textContent = st.err ? t(st.err) : '';
      form.querySelectorAll('.pr-item').forEach((w) => {
        w.classList.remove('ok', 'bad');
        w.querySelector('.pr-fix').textContent = '';
        const b = w.querySelector('.pr-bit');
        if (b) b.removeAttribute('title');
      });
      resultBox.replaceChildren();
      if (!st.graded) return;
      st.graded.groups.forEach((gres, gi) => {
        const gr = st.ex.groups[gi];
        gres.items.forEach((it, idx) => {
          const w = form.querySelector(`.pr-item[data-group="${gr.id}"][data-idx="${idx}"]`);
          if (!w) return;
          w.classList.add(it.ok ? 'ok' : 'bad');
          if (it.ok) return;
          const fix = t('prCorrectWas', { v: PR.answerText(gr, it.correct, lang()) });
          w.querySelector('.pr-fix').textContent = fix;
          const b = w.querySelector('.pr-bit');
          if (b) b.title = fix;
        });
      });
      const all = st.graded.ok === st.graded.total;
      resultBox.append(txt('p', `practice-score${all ? ' all' : ''}`, all ? t('prAllCorrect') : t('prScore', { ok: st.graded.ok, total: st.graded.total })));
    }

    return {
      /** Ejercicio nuevo (o del mismo tipo con otros datos): respuestas en blanco. */
      render(ex, types) {
        st.ex = ex;
        st.types = types;
        st.values = initialValues(ex);
        st.graded = null;
        st.err = null;
        render();
      },
      /** Repinta los textos (cambio de idioma) sin perder las respuestas ni la corrección. */
      refresh() { if (st.ex) render(); },
      /** Solo para las pruebas en el navegador: escribe una respuesta y comprueba. */
      answer(response) {
        st.values = JSON.parse(JSON.stringify(response));
        render();
        check();
        return st.graded;
      },
    };
  }

  (root.GAX = root.GAX || {}).createPracticePanel = createPracticePanel;
})(typeof self !== 'undefined' ? self : this);
