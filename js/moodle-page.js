/*
 * Página «Preguntas para Moodle» (#page=moodle): formulario del generador (js/moodle.js), descarga del banco en
 * Moodle XML, vista previa de una pregunta e instrucciones de uso. Textos propios en ES y EN; los nombres de los
 * elementos, de los tipos de ejercicio y de las codificaciones salen del registro y de js/practice-text.js.
 */
(function (root) {
  'use strict';

  const text = {
    es: {
      title: 'Bancos de preguntas para Moodle',
      lead: 'Genera preguntas con los mismos ejercicios de la práctica y descárgalas en formato Moodle XML para importarlas en el banco de preguntas de tu curso. Cada pregunta enlaza, en su retroalimentación, con la resolución paso a paso de ese mismo ejemplo y con el ejercicio en la herramienta.',
      typesTitle: 'Tipos de pregunta',
      typesHint: 'Una casilla por elemento (gen, individuo, distancia, probabilidad), con puntuación parcial, como en la corrección de la práctica. Los números admiten la misma tolerancia que la práctica.',
      all: 'Marcar todos', none: 'Ninguno',
      levelsTitle: 'Niveles de dificultad',
      levelsHint: 'Fácil: instancias y poblaciones pequeñas (4 o 5 individuos, 5 objetos, 5 ciudades, 5 tareas × 2 máquinas, k = 3) y los ajustes más directos (C − f, penalización lineal con λ = 1, Halton, vecino más cercano). Media: algo más grandes, con 1/(1 + f), Sobol, otros λ y más generaciones. Difícil: las mayores, con la función de Rastrigin, el rango, la penalización cuadrática, el hipercubo latino y la ponderación por la inversa de la distancia.',
      level: { easy: 'Fácil', medium: 'Media', hard: 'Difícil' },
      sizeTitle: 'Tamaño',
      count: 'Ejemplares por categoría',
      summary: (q, c) => `Se generarán ${q} preguntas en ${c} categorías (una por elemento, tipo, codificación y nivel).`,
      nothing: 'Elige al menos un tipo de pregunta y un nivel.',
      download: 'Descargar banco (Moodle XML)',
      working: 'Generando…',
      done: (q, s, f) => `Descargado ${f}: ${q} preguntas, semilla del banco ${s}.`,
      missing: (list) => `No se han encontrado bastantes ejemplares distintos para: ${list}.`,
      previewTitle: 'Vista previa',
      previewHint: 'Así se verá una pregunta del banco (sin el estilo de Moodle). La solución y los enlaces van en la retroalimentación general.',
      previewKind: 'Pregunta',
      previewLevel: 'Nivel',
      previewAnother: 'Otro ejemplar',
      previewSolution: 'Retroalimentación general',
      previewBox: 'Casilla de respuesta',
      howTitle: 'Cómo usarlo en Moodle',
      how: [
        'En el curso: Banco de preguntas → Importar → formato «Moodle XML». Se crea una categoría por elemento, tipo de ejercicio, codificación y nivel dentro de «Inicialización y evaluación».',
        'En el cuestionario, añade una «pregunta aleatoria» de cada categoría: cada estudiante recibe ejemplares distintos del mismo nivel.',
        'En las opciones de revisión, muestra la «Retroalimentación general» solo «Después de cerrar el cuestionario»: contiene la solución y los enlaces a la herramienta.',
        'Las preguntas son de tipo «Respuestas anidadas (Cloze)»: cada casilla puntúa por separado. Si usas Safe Exam Browser, comprueba que los enlaces se puedan abrir durante la revisión.',
      ],
      adaptNote: 'Las preguntas dan como datos todo lo que en la herramienta se ve en el dibujo: la instancia, los cromosomas y los números aleatorios. Algunos ejercicios dependen de muy pocos datos (las copias de la semilla, solo de N y K; Halton y Sobol, solo de N y de la caja), así que tienen pocos ejemplares distintos por nivel.',
      seedNote: 'Cada descarga usa una semilla nueva, así que el banco no se puede volver a generar desde aquí. El nombre de cada pregunta (que el alumnado no ve) lleva su semilla para reproducir el ejercicio ante una reclamación.',
      file: 'banco-inicializacion-evaluacion',
    },
    en: {
      title: 'Question banks for Moodle',
      lead: 'Generate questions based on the practice-mode exercises and download them in Moodle XML format to import into your course question bank. Each question’s feedback links to the step-by-step solution of that exact example and to the exercise in the tool.',
      typesTitle: 'Question types',
      typesHint: 'One box per element (gene, individual, distance, probability), with partial credit, marked as in practice mode. Numbers have the same tolerance as in practice mode.',
      all: 'Select all', none: 'None',
      levelsTitle: 'Difficulty levels',
      levelsHint: 'Easy: small instances and populations (4 or 5 individuals, 5 items, 5 cities, 5 tasks × 2 machines, k = 3) and the most straightforward settings (C − f, linear penalty with λ = 1, Halton, nearest neighbour). Medium: somewhat larger, with 1/(1 + f), Sobol, other values of λ and more generations. Hard: the largest, with Rastrigin’s function, ranking, the quadratic penalty, the Latin hypercube and inverse distance weighting.',
      level: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
      sizeTitle: 'Size',
      count: 'Instances per category',
      summary: (q, c) => `${q} questions will be generated in ${c} categories (one per element, type, encoding and level).`,
      nothing: 'Choose at least one question type and one level.',
      download: 'Download bank (Moodle XML)',
      working: 'Generating…',
      done: (q, s, f) => `Downloaded ${f}: ${q} questions, bank seed ${s}.`,
      missing: (list) => `Not enough distinct instances were found for: ${list}.`,
      previewTitle: 'Preview',
      previewHint: 'This is how a question from the bank will look (without Moodle’s styling). The solution and the links go in the general feedback.',
      previewKind: 'Question',
      previewLevel: 'Level',
      previewAnother: 'Another instance',
      previewSolution: 'General feedback',
      previewBox: 'Answer box',
      howTitle: 'How to use it in Moodle',
      how: [
        'In the course: Question bank → Import → “Moodle XML” format. One category per element, exercise type, encoding and level is created inside “Initialisation and evaluation”.',
        'In the quiz, add a “random question” from each category: each student gets different instances of the same level.',
        'In the review options, show the “General feedback” only “After the quiz is closed”: it contains the solution and the links to the tool.',
        'The questions are of the “Embedded answers (Cloze)” type: each box is marked separately. If you use Safe Exam Browser, check that the links can be opened during the review.',
      ],
      adaptNote: 'The questions give as data everything that the tool shows in the drawing: the instance, the chromosomes and the random numbers. Some exercises depend on very few data (the copies of the seed only on N and K; Halton and Sobol only on N and the box), so they have few distinct instances per level.',
      seedNote: 'Each download uses a new seed, so the bank cannot be regenerated from here. Each question’s name (hidden from students) includes its seed, so the exercise can be reproduced if a student queries a mark.',
      file: 'initialisation-evaluation-bank',
    },
  };

  function createMoodlePage() {
    const G = root.GAX;
    const M = G.moodle;
    const I = G.i18n;
    const sel = { kinds: new Set(M.KINDS.map((k) => k.id)), levels: new Set(['medium']), count: 10, preview: null, previewLevel: 'medium', previewSeed: 1 };
    let last = null;

    function node(tag, cls, content) {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (content != null) e.textContent = content;
      return e;
    }
    function check(label, checked, onChange) {
      const l = node('label', 'mq-check');
      const i = node('input');
      i.type = 'checkbox';
      i.checked = checked;
      i.addEventListener('change', () => onChange(i.checked));
      l.append(i, node('span', null, label));
      return { el: l, input: i };
    }
    function numberField(label, value, min, max, onChange) {
      const l = node('label', 'mq-num');
      const i = node('input');
      i.type = 'number';
      i.min = String(min);
      i.max = String(max);
      i.step = '1';
      i.value = String(value);
      i.addEventListener('change', () => {
        const v = Math.max(min, Math.min(max, Math.round(Number(i.value)) || value));
        i.value = String(v);
        onChange(v);
      });
      l.append(node('span', null, label), i);
      return l;
    }
    function group(title, hint, items) {
      const f = node('fieldset', 'mq-group');
      f.append(node('legend', null, title));
      if (hint) f.append(node('p', 'hint', hint));
      const box = node('div', 'mq-items');
      box.append(...items);
      f.append(box);
      return f;
    }
    function download(name, content) {
      const blob = new Blob([content], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = node('a');
      link.href = url;
      link.download = name;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function render(container, lang) {
      const L = text[lang] || text.es;
      const kindName = (k) => (k.encFree ? M.typeName(k.type, lang) : `${M.typeName(k.type, lang)} · ${M.encName(k.enc, lang)}`);
      const levels = () => M.LEVELS.filter((lv) => sel.levels.has(lv));
      const kinds = () => M.KINDS.map((k) => k.id).filter((k) => sel.kinds.has(k));

      const summary = node('p', 'mq-summary');
      const btn = node('button', 'btn primary', L.download);
      btn.type = 'button';
      const status = node('p', 'mq-status');
      status.setAttribute('role', 'status');
      const preview = node('div', 'mq-preview');
      const pvSelect = node('select');
      pvSelect.id = 'mqPreviewKind';
      const pvLabel = node('label', 'mq-num');
      pvLabel.append(node('span', null, L.previewKind), pvSelect);
      const pvLevel = node('select');
      pvLevel.id = 'mqPreviewLevel';
      M.LEVELS.forEach((lv) => { const o = node('option', null, L.level[lv]); o.value = lv; pvLevel.append(o); });
      pvLevel.value = sel.previewLevel;
      const pvLevelLabel = node('label', 'mq-num');
      pvLevelLabel.append(node('span', null, L.previewLevel), pvLevel);
      const pvAnother = node('button', 'btn', L.previewAnother);
      pvAnother.type = 'button';

      function renderPreview() {
        preview.replaceChildren();
        const kid = pvSelect.value;
        if (!kid) return;
        const r = M.generate({ lang, kinds: [kid], levels: [sel.previewLevel], count: 1, seed: sel.previewSeed });
        const q = r.questions[0];
        if (!q) return;
        const qt = node('div', 'mq-qtext');
        qt.innerHTML = M.previewHtml(q, L.previewBox);   // HTML generado por js/moodle.js (texto escapado)
        const fb = node('details', 'mq-feedback');
        const body = node('div');
        body.innerHTML = q.general;
        fb.append(node('summary', null, L.previewSolution), body);
        preview.append(node('p', 'mq-qname', q.name), qt, fb);
      }

      function syncPreviewOptions() {
        const ks = kinds();
        const keep = ks.indexOf(sel.preview) !== -1 ? sel.preview : ks[0];
        pvSelect.replaceChildren(...ks.map((id) => {
          const k = M.KINDS.find((x) => x.id === id);
          const o = node('option', null, `${M.itemName(k.item, lang)} · ${kindName(k)}`);
          o.value = id;
          return o;
        }));
        if (keep) pvSelect.value = keep;
        sel.preview = keep || null;
      }

      function refresh() {
        const cats = kinds().length * levels().length;
        summary.textContent = cats ? L.summary(cats * sel.count, cats) : L.nothing;
        btn.disabled = !cats;
        syncPreviewOptions();
        renderPreview();
      }

      const boxes = [];
      const itemGroups = M.ITEMS.map((item) => {
        const items = M.KINDS.filter((k) => k.item === item).map((k) => {
          const c = check(kindName(k), sel.kinds.has(k.id), (on) => { if (on) sel.kinds.add(k.id); else sel.kinds.delete(k.id); refresh(); });
          boxes.push({ id: k.id, input: c.input });
          return c.el;
        });
        return group(M.itemName(item, lang), null, items);
      });
      const setAll = (on) => {
        boxes.forEach((b) => { b.input.checked = on; if (on) sel.kinds.add(b.id); else sel.kinds.delete(b.id); });
        refresh();
      };
      const bAll = node('button', 'btn', L.all);
      bAll.type = 'button';
      bAll.addEventListener('click', () => setAll(true));
      const bNone = node('button', 'btn', L.none);
      bNone.type = 'button';
      bNone.addEventListener('click', () => setAll(false));
      const allRow = node('div', 'buttons mq-all');
      allRow.append(bAll, bNone);

      const levelItems = M.LEVELS.map((lv) => check(L.level[lv], sel.levels.has(lv), (on) => {
        if (on) sel.levels.add(lv); else sel.levels.delete(lv);
        refresh();
      }).el);

      pvSelect.addEventListener('change', () => { sel.preview = pvSelect.value; renderPreview(); });
      pvLevel.addEventListener('change', () => { sel.previewLevel = pvLevel.value; renderPreview(); });
      pvAnother.addEventListener('click', () => { sel.previewSeed = (sel.previewSeed % 9973) + 1; renderPreview(); });

      btn.addEventListener('click', () => {
        btn.disabled = true;
        status.textContent = L.working;
        // Se deja pintar el aviso antes de generar
        setTimeout(() => {
          const r = M.generate({ lang, kinds: kinds(), levels: levels(), count: sel.count });
          const date = new Date().toISOString().slice(0, 10);
          const file = `${L.file}-${date}-s${r.seed}.xml`;
          download(file, M.toXml(r));
          let msg = L.done(r.questions.length, r.seed, file);
          if (r.missing.length) {
            const list = r.missing.map((m) => {
              const k = M.KINDS.find((x) => x.id === m.kind);
              return `${M.itemName(k.item, lang)} · ${kindName(k)} · ${L.level[m.level]} (${m.made}/${m.wanted})`;
            }).join('; ');
            msg += ` ${L.missing(list)}`;
          }
          last = { lang, text: msg };
          status.textContent = msg;
          btn.disabled = false;
        }, 30);
      });

      const how = node('ol', 'mq-how');
      L.how.forEach((h) => how.append(node('li', null, h)));

      const form = node('div', 'mq-form');
      form.append(node('h2', null, L.typesTitle), node('p', 'hint', L.typesHint), allRow, ...itemGroups,
        group(L.levelsTitle, L.levelsHint, levelItems),
        group(L.sizeTitle, null, [numberField(L.count, sel.count, 1, 50, (v) => { sel.count = v; refresh(); })]));
      const actions = node('div', 'mq-actions');
      actions.append(summary, btn, status);
      if (last && last.lang === lang) status.textContent = last.text;

      const pvBar = node('div', 'mq-actions mq-pvbar');
      pvBar.append(pvLabel, pvLevelLabel, pvAnother);
      const sec = (title, ...kids) => { const s = node('section', 'about-section'); s.append(node('h2', null, title), ...kids); return s; };
      container.replaceChildren(
        node('h1', null, L.title),
        node('p', 'lead', L.lead),
        form,
        actions,
        sec(L.previewTitle, node('p', 'hint', L.previewHint), pvBar, preview),
        sec(L.howTitle, how, node('p', 'hint', L.adaptNote), node('p', 'hint', L.seedNote)),
      );
      document.title = `${L.title} · ${I.t(lang, 'brand')}`;
      refresh();
    }

    return { render };
  }

  const api = { createMoodlePage, text };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.GAX = root.GAX || {}).moodlePage = api;
})(typeof self !== 'undefined' ? self : this);
