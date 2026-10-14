/*
 * Contenido docente de la aptitud aproximada: explicación, etapas, narración, pseudocódigo (según el metamodelo),
 * código descargable y referencias.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'Cuando una evaluación cuesta horas, se puede sustituir parte de ellas por un metamodelo: una función barata que aproxima la aptitud a partir de los individuos ya evaluados (Talbi, 2009, §1.4.2.6; Jin, 2005). También se llama modelo sustituto o aptitud aproximada. Redes neuronales, superficies de respuesta, kriging o procesos gaussianos son metamodelos habituales; la herramienta usa dos muy sencillos para que se vea la idea.',
      'El vecino más cercano da a un individuo nuevo la aptitud del individuo evaluado más próximo. La ponderación por la inversa de la distancia (Shepard, 1968) hace una media de todas las aptitudes conocidas, con pesos 1/d² que dan más importancia a los puntos cercanos. Los dos solo usan el archivo: los N individuos de la población inicial, evaluados de verdad. Con pocos puntos y una función con valles estrechos, sus errores pueden ser grandes.',
      'Un metamodelo no tiene que acertar el valor: le basta con ordenar bien. Por eso se mide también la correlación de rangos de Spearman entre la aptitud estimada y la real. Un uso típico es la preselección: de muchos candidatos, el metamodelo elige los K que parecen mejores y solo esos se evalúan de verdad. Se ahorran las evaluaciones del resto, con el riesgo de descartar al mejor sin saberlo.',
      'La gestión del metamodelo es lo delicado: hay que mezclar evaluaciones reales y aproximadas, añadir las reales al archivo para que el modelo mejore y evitar que el algoritmo converja a un falso óptimo del modelo (Jin, 2005). El equilibrio es el de siempre: una evaluación real cara y exacta frente a una aproximada barata y con error.',
    ],
    en: [
      'When an evaluation takes hours, some of them can be replaced by a meta-model: a cheap function that approximates fitness from the individuals already evaluated (Talbi, 2009, §1.4.2.6; Jin, 2005). It is also called a surrogate model or approximate fitness. Neural networks, response surfaces, kriging or Gaussian processes are common meta-models; the tool uses two very simple ones so that the idea is clear.',
      'The nearest-neighbour meta-model gives a new individual the fitness of the closest evaluated individual. Inverse distance weighting (Shepard, 1968) averages all known fitness values, with weights 1/d² that give more importance to nearby points. Both use only the archive: the N individuals of the initial population, evaluated for real. With few points and a function with narrow valleys, their errors can be large.',
      'A meta-model does not need to get the value right: ranking well is enough. That is why the Spearman rank correlation between estimated and true fitness is measured too. A typical use is pre-selection: out of many candidates, the meta-model picks the K that look best and only those are evaluated for real. The evaluations of the rest are saved, at the risk of discarding the best one without knowing it.',
      'Managing the meta-model is the delicate part: real and approximate evaluations have to be mixed, the real ones added to the archive so that the model improves, and the algorithm kept from converging to a false optimum of the model (Jin, 2005). The balance is the usual one: an expensive, exact real evaluation against a cheap approximate one subject to error.',
    ],
  };

  const stages = {
    es: ['Archivo', 'Metamodelo', 'Un candidato', 'Todos', 'Preselección'],
    en: ['Archive', 'Meta-model', 'One candidate', 'All', 'Pre-selection'],
  };

  const narration = {
    es: {
      s_archive: 'Archivo: los N = {N} individuos de la población inicial (A1 a A{N}), evaluados de verdad (círculos negros en el mapa). Son las únicas evaluaciones reales que conoce el metamodelo.',
      s_rule_nn: 'Llegan N = {N} candidatos nuevos, C1 a C{N} (rombos). Metamodelo del vecino más cercano: la aptitud estimada de un candidato es la del punto del archivo más próximo. No cuesta ninguna evaluación.',
      s_rule_idw: 'Llegan N = {N} candidatos nuevos, C1 a C{N} (rombos). Metamodelo de ponderación por la inversa de la distancia: F̂ = Σ wₖ Fₖ / Σ wₖ, con wₖ = 1/dₖ². No cuesta ninguna evaluación.',
      s_first_nn: 'Candidato 1, en ({x1}; {x2}): el punto del archivo más cercano es A{k}, a {d}, con F = {Fk}. Así que F̂ = {Fp}. Su aptitud real sería {F}.',
      s_first_idw: 'Candidato 1, en ({x1}; {x2}): todos los puntos del archivo aportan, con más peso los cercanos (líneas más gruesas); el más cercano es A{k}. F̂ = {Fp}. Su aptitud real sería {F}.',
      s_all: 'Todos los candidatos: estimada frente a real. El error medio es {mae} y el mayor, {max}. La correlación de rangos es ρ = {rho}: con N = {N} puntos en el archivo, el metamodelo ordena regular.',
      s_all_good: 'Todos los candidatos: estimada frente a real. El error medio es {mae} y el mayor, {max}, pero la correlación de rangos es ρ = {rho}: ordena bastante bien, que es lo que importa para seleccionar.',
      s_presel_found: 'Preselección: solo se evalúan de verdad los K = {K} candidatos con mejor F̂ (zona sombreada). Se ahorran {saved} de {N} evaluaciones y entre ellos está el mejor candidato real, C{i}.',
      s_presel_missed: 'Preselección: solo se evalúan de verdad los K = {K} candidatos con mejor F̂ (zona sombreada). Se ahorran {saved} de {N} evaluaciones, pero el mejor candidato real, C{i} (F = {Fi}), se queda fuera; el mejor preseleccionado es C{j} (F = {Fj}).',
      s_end: 'El metamodelo ahorra evaluaciones a cambio de error. Funciona mejor con más puntos en el archivo, añadiendo cada evaluación real que se hace y combinándolo con evaluaciones reales para no perseguir un óptimo falso.',
    },
    en: {
      s_archive: 'Archive: the N = {N} individuals of the initial population (A1 to A{N}), evaluated for real (black circles on the map). They are the only real evaluations the meta-model knows.',
      s_rule_nn: 'N = {N} new candidates arrive, C1 to C{N} (diamonds). Nearest-neighbour meta-model: the estimated fitness of a candidate is that of the closest point of the archive. It costs no evaluation.',
      s_rule_idw: 'N = {N} new candidates arrive, C1 to C{N} (diamonds). Inverse distance weighting meta-model: F̂ = Σ wₖ Fₖ / Σ wₖ, with wₖ = 1/dₖ². It costs no evaluation.',
      s_first_nn: 'Candidate 1, at ({x1}; {x2}): the closest point of the archive is A{k}, at {d}, with F = {Fk}. So F̂ = {Fp}. Its true fitness would be {F}.',
      s_first_idw: 'Candidate 1, at ({x1}; {x2}): every point of the archive contributes, the closer ones with more weight (thicker lines); the closest is A{k}. F̂ = {Fp}. Its true fitness would be {F}.',
      s_all: 'All candidates: estimated against true. The mean error is {mae} and the largest, {max}. The rank correlation is ρ = {rho}: with N = {N} points in the archive, the meta-model ranks only moderately well.',
      s_all_good: 'All candidates: estimated against true. The mean error is {mae} and the largest, {max}, but the rank correlation is ρ = {rho}: it ranks quite well, which is what matters for selection.',
      s_presel_found: 'Pre-selection: only the K = {K} candidates with the best F̂ (shaded area) are evaluated for real. {saved} of {N} evaluations are saved and the best real candidate, C{i}, is among those evaluated.',
      s_presel_missed: 'Pre-selection: only the K = {K} candidates with the best F̂ (shaded area) are evaluated for real. {saved} of {N} evaluations are saved, but the best real candidate, C{i} (F = {Fi}), is left out; the best pre-selected one is C{j} (F = {Fj}).',
      s_end: 'The meta-model saves evaluations at the price of error. It works better with more points in the archive, when every real evaluation made is added to it, and when it is combined with real evaluations so as not to chase a false optimum.',
    },
  };

  const P = {
    es: {
      sig: 'METAMODELO(x, archivo)',
      nn: 'k ← el punto del archivo más cercano a x;  devolver F(xₖ)',
      idw0: 'para cada punto k del archivo:  wₖ ← 1 / d(x, xₖ)²',
      idw: 'devolver Σₖ wₖ F(xₖ) / Σₖ wₖ                 // si d = 0, F(xₖ)',
      psig: 'PRESELECCIÓN(candidatos, K)',
      pest: 'para cada candidato c:  F̂(c) ← METAMODELO(c, archivo)',
      pk: 'elegir los K candidatos con mejor F̂',
      peval: 'evaluar de verdad solo esos K y añadirlos al archivo',
    },
    en: {
      sig: 'META_MODEL(x, archive)',
      nn: 'k ← the point of the archive closest to x;  return F(xₖ)',
      idw0: 'for each point k of the archive:  wₖ ← 1 / d(x, xₖ)²',
      idw: 'return Σₖ wₖ F(xₖ) / Σₖ wₖ                   // if d = 0, F(xₖ)',
      psig: 'PRE_SELECTION(candidates, K)',
      pest: 'for each candidate c:  F̂(c) ← META_MODEL(c, archive)',
      pk: 'choose the K candidates with the best F̂',
      peval: 'evaluate only those K for real and add them to the archive',
    },
  };
  /** variant: 'nn' o 'idw'. */
  function pseudocode(lang, variant) {
    const T = P[lang] || P.es;
    const body = variant === 'idw' ? [{ id: 'm0', indent: 1, text: T.idw0 }, { id: 'm', indent: 1, text: T.idw }] : [{ id: 'm', indent: 1, text: T.nn }];
    return [{ id: 'sig', indent: 0, text: T.sig }].concat(body, [
      { id: 'blank', indent: 0, text: '' },
      { id: 'psig', indent: 0, text: T.psig }, { id: 'pest', indent: 1, text: T.pest }, { id: 'pk', indent: 1, text: T.pk }, { id: 'peval', indent: 1, text: T.peval },
    ]);
  }
  const keywords = { es: ['para cada', 'devolver', 'elegir'], en: ['for each', 'return', 'choose'] };
  const stepLines = {
    s_archive: ['peval'],
    s_rule: ['sig', 'm'],
    s_first: ['sig', 'm'],
    s_all: ['pest'],
    s_presel: ['pk', 'peval'],
    s_end: ['peval'],
  };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'surrogate_fitness.py',
      template: `"""
{{title}}
{{ref}}
"""
import math


def nearest_neighbour(points, fitness, p):
    """{{docNn}}"""
    d = [math.hypot(q[0] - p[0], q[1] - p[1]) for q in points]
    k = min(range(len(points)), key=lambda i: (d[i], i))
    return fitness[k]


def inverse_distance(points, fitness, p):
    """{{docIdw}}"""
    d = [math.hypot(q[0] - p[0], q[1] - p[1]) for q in points]
    k = min(range(len(points)), key=lambda i: (d[i], i))
    if d[k] == 0:
        return fitness[k]
    w = [1 / (dk * dk) for dk in d]
    return sum(wk * fk for wk, fk in zip(w, fitness)) / sum(w)


def preselect(estimates, k):
    """{{docPre}}"""
    return sorted(range(len(estimates)), key=lambda i: (estimates[i], i))[:k]


def spearman(a, b):
    """{{docRho}}"""
    def ranks(v):
        order = sorted(range(len(v)), key=lambda i: v[i])
        r = [0] * len(v)
        k = 0
        while k < len(order):
            e = k
            while e + 1 < len(order) and v[order[e + 1]] == v[order[k]]:
                e += 1
            for q in range(k, e + 1):
                r[order[q]] = (k + e) / 2 + 1
            k = e + 1
        return r
    ra, rb, n = ranks(a), ranks(b), len(a)
    m = (n + 1) / 2
    sab = sum((x - m) * (y - m) for x, y in zip(ra, rb))
    saa = sum((x - m) ** 2 for x in ra)
    sbb = sum((y - m) ** 2 for y in rb)
    return sab / math.sqrt(saa * sbb) if saa > 0 and sbb > 0 else None


if __name__ == "__main__":
    # {{example}}
    pts, fit = [[0, 0], [2, 0]], [10, 20]
    print(nearest_neighbour(pts, fit, [0.5, 0]))    # 10
    print(inverse_distance(pts, fit, [1, 0]))        # 15.0
    print(preselect([3.2, 1.0, 2.5, 0.4], 2))        # [3, 1]
    print(spearman([1, 2, 3], [10, 30, 20]))         # 0.5
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'surrogateFitness.js',
      template: `/**
 * {{title}}
 * {{ref}}
 */

/** {{docNn}} */
function nearestNeighbour(points, fitness, p) {
  const d = points.map((q) => Math.hypot(q[0] - p[0], q[1] - p[1]));
  let k = 0;
  d.forEach((v, i) => { if (v < d[k]) k = i; });
  return fitness[k];
}

/** {{docIdw}} */
function inverseDistance(points, fitness, p) {
  const d = points.map((q) => Math.hypot(q[0] - p[0], q[1] - p[1]));
  let k = 0;
  d.forEach((v, i) => { if (v < d[k]) k = i; });
  if (d[k] === 0) return fitness[k];
  let sw = 0;
  let swf = 0;
  d.forEach((dk, i) => { const w = 1 / (dk * dk); sw += w; swf += w * fitness[i]; });
  return swf / sw;
}

/** {{docPre}} */
function preselect(estimates, k) {
  return estimates.map((_, i) => i).sort((i, j) => estimates[i] - estimates[j] || i - j).slice(0, k);
}

/** {{docRho}} */
function spearman(a, b) {
  const ranks = (v) => {
    const o = v.map((_, i) => i).sort((i, j) => v[i] - v[j]);
    const r = Array(v.length);
    for (let k = 0; k < o.length;) {
      let e = k;
      while (e + 1 < o.length && v[o[e + 1]] === v[o[k]]) e++;
      for (let q = k; q <= e; q++) r[o[q]] = (k + e) / 2 + 1;
      k = e + 1;
    }
    return r;
  };
  const ra = ranks(a);
  const rb = ranks(b);
  const m = (a.length + 1) / 2;
  let sab = 0;
  let saa = 0;
  let sbb = 0;
  for (let i = 0; i < a.length; i++) { sab += (ra[i] - m) * (rb[i] - m); saa += (ra[i] - m) ** 2; sbb += (rb[i] - m) ** 2; }
  return saa > 0 && sbb > 0 ? sab / Math.sqrt(saa * sbb) : null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { nearestNeighbour, inverseDistance, preselect, spearman };
  if (require.main === module) {
    // {{example}}
    const pts = [[0, 0], [2, 0]];
    const fit = [10, 20];
    console.log(nearestNeighbour(pts, fit, [0.5, 0]));   // 10
    console.log(inverseDistance(pts, fit, [1, 0]));       // 15
    console.log(preselect([3.2, 1.0, 2.5, 0.4], 2));      // [ 3, 1 ]
    console.log(spearman([1, 2, 3], [10, 30, 20]));       // 0.5
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Aptitud aproximada: metamodelos del vecino más cercano y de ponderación por la inversa de la distancia, preselección y correlación de rangos.',
      ref: 'Referencias: Talbi, E.-G. (2009), §1.4.2.6; Jin, Y. (2005); Shepard, D. (1968); Bautista-Valhondo, J. (2020).',
      docNn: 'Aptitud estimada en p: la del punto del archivo más cercano (a igual distancia, el primero).',
      docIdw: 'Aptitud estimada en p: media de las aptitudes del archivo con pesos 1/d² (si p está en el archivo, su aptitud).',
      docPre: 'Índices de los k candidatos con mejor estimación (se minimiza; a igualdad, el de menor índice).',
      docRho: 'Correlación de rangos de Spearman (rangos medios en los empates).',
      example: 'Ejemplos pequeños, para comprobar a mano',
    },
    en: {
      title: 'Approximate fitness: nearest-neighbour and inverse distance weighting meta-models, pre-selection and rank correlation.',
      ref: 'References: Talbi, E.-G. (2009), §1.4.2.6; Jin, Y. (2005); Shepard, D. (1968); Bautista-Valhondo, J. (2020).',
      docNn: 'Estimated fitness at p: that of the closest point of the archive (ties: the first).',
      docIdw: 'Estimated fitness at p: mean of the archive’s fitness values with weights 1/d² (if p is in the archive, its fitness).',
      docPre: 'Indices of the k candidates with the best estimate (minimised; ties: lower index first).',
      docRho: 'Spearman rank correlation (average ranks for ties).',
      example: 'Small examples, to check by hand',
    },
  };

  const references = [
    C.ref('talbi', {
      es: 'Manual de referencia del curso. El apartado 1.4.2.6 presenta los metamodelos (redes neuronales, superficies de respuesta, kriging) para funciones objetivo caras y el equilibrio entre una evaluación exacta y cara y una aproximada y barata.',
      en: 'The course’s reference textbook. Section 1.4.2.6 introduces meta-models (neural networks, response surfaces, kriging) for expensive objective functions and the trade-off between an expensive exact evaluation and a cheap approximate one.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Dedica a los algoritmos genéticos el capítulo 8.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Chapter 8 is devoted to genetic algorithms.',
    }),
    C.ref('jin2005', {
      es: 'Revisión de la aptitud aproximada en computación evolutiva: modelos, cómo combinarlos con evaluaciones reales y los riesgos de un modelo engañoso.',
      en: 'Survey of fitness approximation in evolutionary computation: models, how to combine them with real evaluations and the risks of a misleading model.',
    }),
    C.ref('shepard1968', {
      es: 'Origen de la interpolación por la inversa de la distancia para datos irregularmente espaciados.',
      en: 'Origin of inverse distance weighting interpolation for irregularly spaced data.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({
    id: 'surrogate', explanation, stages, narration, pseudocode, keywords, stepLines, codeTemplates, references,
  }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).surrogate = api;
})(typeof self !== 'undefined' ? self : this);
