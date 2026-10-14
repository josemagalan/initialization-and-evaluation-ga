/*
 * Contenido docente de la diversificación secuencial (inhibición secuencial simple): explicación, etapas,
 * narración, pseudocódigo (según la distancia de la codificación), código descargable y referencias.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'La inicialización aleatoria uniforme no impide que dos individuos salgan iguales o casi iguales: con poblaciones pequeñas pasa a menudo, y cada pareja de individuos parecidos es diversidad desperdiciada. La diversificación secuencial lo evita construyendo la población individuo a individuo y comprobando cada uno frente a los que ya están (Talbi, 2009, §3.1.1).',
      'La versión más sencilla es la inhibición secuencial simple (simple sequential inhibition, SSI), un proceso que viene de la estadística de patrones de puntos en el plano (Diggle, 1983): se genera un candidato al azar con la regla uniforme y solo entra en la población si está a una distancia de al menos δ de todos los individuos aceptados; si no, se descarta y se genera otro. Así la población final tiene, por construcción, una distancia mínima entre individuos de δ o más.',
      'La distancia es la misma que usa la herramienta para medir la diversidad, normalizada entre 0 y 1: la proporción de genes distintos en las cadenas de bits y de enteros, la proporción de tramos distintos en el viajante y la distancia euclídea entre los puntos dividida por la diagonal de la caja en la función. Con δ = 0 se recupera la inicialización uniforme: los N primeros candidatos son exactamente la población uniforme con la misma semilla.',
      'El precio es el coste. Cada candidato hay que generarlo y compararlo con todos los aceptados, y cuantos más individuos hay, más candidatos se rechazan. Si δ es demasiado grande para el tamaño del espacio y de la población, puede que no quepan N individuos tan separados y el proceso no termine; por eso la herramienta, tras 50 · N candidatos, acepta los siguientes sin comprobar la distancia y los marca como forzados. En la práctica, δ se elige algo por debajo de la distancia media de una población uniforme.',
      'La inhibición secuencial no mira la calidad de los individuos ni reparte la población de forma pareja por todo el espacio: solo impide que dos individuos estén demasiado cerca. Es fácil de aplicar a cualquier codificación, porque solo necesita una distancia, a diferencia de las secuencias cuasialeatorias y del hipercubo latino, que necesitan variables continuas.',
    ],
    en: [
      'Uniform random initialisation does not prevent two individuals from being identical or almost identical: with small populations it happens often, and every pair of similar individuals is wasted diversity. Sequential diversification avoids it by building the population one individual at a time and checking each one against those already in it (Talbi, 2009, §3.1.1).',
      'The simplest version is simple sequential inhibition (SSI), a process that comes from the statistics of point patterns in the plane (Diggle, 1983): a candidate is generated at random with the uniform rule and is only accepted into the population if it lies at a distance of at least δ from every accepted individual; otherwise it is discarded and another one is generated. The final population then has, by construction, a minimum distance between individuals of δ or more.',
      'The distance is the same one the tool uses to measure diversity, normalised between 0 and 1: the share of differing genes for bit and integer strings, the share of differing legs for the travelling salesman and the Euclidean distance between the points divided by the box diagonal for the function. With δ = 0, uniform initialisation is recovered: the first N candidates are exactly the uniform population with the same seed.',
      'The price to pay is computational cost. Every candidate has to be generated and compared with all the accepted individuals, and the more individuals there are, the more candidates are rejected. If δ is too large for the size of the space and of the population, N individuals that far apart may not fit and the process may never end; that is why, after 50 · N candidates, the tool accepts the following ones without checking the distance and marks them as forced. In practice, δ is chosen somewhat below the mean distance of a uniform population.',
      'Sequential inhibition does not look at the quality of the individuals, nor does it spread the population evenly over the whole space: it only prevents two individuals from being too close. It is easy to apply to any encoding, because all it needs is a distance, unlike quasi-random sequences and the Latin hypercube, which need continuous variables.',
    ],
  };

  const stages = {
    es: ['Regla', 'Candidatos', 'Población', 'Diversidad', 'Coste'],
    en: ['Rule', 'Candidates', 'Population', 'Diversity', 'Cost'],
  };

  const narration = {
    es: {
      d_hamming: 'la proporción de genes distintos',
      d_edges: 'la proporción de tramos distintos',
      d_euclid: 'la distancia entre los puntos dividida por la diagonal de la caja',
      ssi_rule: 'Inhibición secuencial: se generan candidatos al azar, con la regla uniforme, y uno entra en la población solo si está a δ = {delta} o más de todos los que ya están. La distancia es {dist}, entre 0 (iguales) y 1. Vamos a reunir N = {N} individuos.',
      cand_ok_first: 'Candidato {c}: {chrom}. La población está vacía, así que entra sin comparar: es el individuo 1.',
      cand_ok: 'Candidato {c}: {chrom}. El individuo más cercano es I{near}, a {d} ≥ δ = {delta}: entra como individuo {i}.',
      cand_ok_forced: 'Candidato {c}: {chrom}. Está a {d} de I{near}, menos que δ, pero ya se han probado demasiados candidatos: entra forzado como individuo {i}.',
      cand_rej: 'Candidato {c}: {chrom}. Está a {d} de I{near}, menos que δ = {delta}: se descarta y se genera otro.',
      ssi_ind: 'Individuo {i}: {chrom}, aceptado al primer intento (candidato {c}).',
      ssi_ind_rej: 'Individuo {i}: {chrom}, aceptado en el candidato {c}, tras descartar {r} por estar demasiado cerca de algún individuo.',
      ssi_ind_forced: 'Individuo {i}: {chrom}, forzado: tras {r} descartes se han agotado los intentos y entra sin respetar δ.',
      ssi_ind_forced_next: 'Individuo {i}: {chrom}. Agotados los intentos, entra también sin comprobar la distancia (candidato {c}).',
      ssi_pop: 'Población completa: {N} individuos a δ = {delta} o más unos de otros, tras generar {total} candidatos y descartar {rej}.',
      ssi_pop_forced: 'Población completa, pero {forced} de los {N} individuos han entrado forzados: δ = {delta} es demasiado grande para {N} individuos en este espacio. Prueba con un δ menor.',
      ssi_dist: 'Diversidad: la distancia mínima entre dos individuos es {smin} (nunca menor que δ = {delta}), frente a {umin} en la población uniforme con la misma semilla; la media, {smean} frente a {umean}. Individuos distintos: {sd} frente a {ud}.',
      ssi_dist_forced: 'Diversidad: la distancia mínima entre dos individuos es {smin}, porque los individuos forzados no respetan δ = {delta}; en la población uniforme con la misma semilla es {umin}. La media, {smean} frente a {umean}. Individuos distintos: {sd} frente a {ud}.',
      ssi_cost: 'Coste: la población uniforme necesita {N} individuos aleatorios; la inhibición secuencial ha generado {total} candidatos ({ratio} por individuo) y ha calculado {comps} distancias. Cuanto mayor es δ, más candidatos se descartan.',
      ssi_end: 'La inhibición secuencial asegura una distancia mínima entre individuos con cualquier codificación, porque solo necesita una distancia. A cambio cuesta más, no mira la calidad y, si δ es demasiado grande, no termina: se elige algo por debajo de la distancia media de una población uniforme ({expected} en esta codificación).',
    },
    en: {
      d_hamming: 'the share of differing genes',
      d_edges: 'the share of differing legs',
      d_euclid: 'the distance between the points divided by the box diagonal',
      ssi_rule: 'Sequential inhibition: candidates are generated at random, with the uniform rule, and one is accepted into the population only if it is δ = {delta} or more away from every individual already in it. The distance is {dist}, between 0 (identical) and 1. We are going to gather N = {N} individuals.',
      cand_ok_first: 'Candidate {c}: {chrom}. The population is empty, so it is accepted without comparison: it is individual 1.',
      cand_ok: 'Candidate {c}: {chrom}. The closest individual is I{near}, at {d} ≥ δ = {delta}: it is accepted as individual {i}.',
      cand_ok_forced: 'Candidate {c}: {chrom}. It is {d} away from I{near}, less than δ, but too many candidates have already been tried: it is forced in as individual {i}.',
      cand_rej: 'Candidate {c}: {chrom}. It is {d} away from I{near}, less than δ = {delta}: it is discarded and another one is generated.',
      ssi_ind: 'Individual {i}: {chrom}, accepted at the first attempt (candidate {c}).',
      ssi_ind_rej: 'Individual {i}: {chrom}, accepted at candidate {c}, after discarding {r} for being too close to some individual.',
      ssi_ind_forced: 'Individual {i}: {chrom}, forced: after {r} rejected candidates, the attempts have run out and it goes in without respecting δ.',
      ssi_ind_forced_next: 'Individual {i}: {chrom}. With the attempts used up, it also goes in without checking the distance (candidate {c}).',
      ssi_pop: 'Complete population: {N} individuals δ = {delta} or more apart, after generating {total} candidates and discarding {rej}.',
      ssi_pop_forced: 'Complete population, but {forced} of the {N} individuals were forced in: δ = {delta} is too large for {N} individuals in this space. Try a smaller δ.',
      ssi_dist: 'Diversity: the minimum distance between two individuals is {smin} (never less than δ = {delta}), against {umin} in the uniform population with the same seed; the mean, {smean} against {umean}. Distinct individuals: {sd} against {ud}.',
      ssi_dist_forced: 'Diversity: the minimum distance between two individuals is {smin}, because the forced individuals do not respect δ = {delta}; in the uniform population with the same seed it is {umin}. The mean, {smean} against {umean}. Distinct individuals: {sd} against {ud}.',
      ssi_cost: 'Cost: the uniform population needs {N} random individuals; sequential inhibition generated {total} candidates ({ratio} per individual) and computed {comps} distances. The larger δ, the more candidates are discarded.',
      ssi_end: 'Sequential inhibition ensures a minimum distance between individuals with any encoding, because all it needs is a distance. On the other hand, it costs more, ignores quality and, if δ is too large, never ends: δ is therefore chosen somewhat below the mean distance of a uniform population ({expected} for this encoding).',
    },
  };

  // ---------- Pseudocódigo ----------

  const P = {
    es: {
      sig: 'INHIBICIÓN_SECUENCIAL(N, δ)',
      pinit: 'P ← ∅;  candidatos ← 0',
      pwhile: 'mientras |P| < N:',
      pcand: 'x ← INDIVIDUO_ALEATORIO();  candidatos ← candidatos + 1        // regla uniforme',
      ptest: 'si P = ∅ o d(x, y) ≥ δ para todo y de P:',
      padd: 'P ← P ∪ {x}',
      pforce: 'si no, si candidatos > 50 · N:  P ← P ∪ {x}        // forzado: δ es demasiado grande',
      prej: 'si no:  descartar x',
      pret: 'devolver P',
      dsig: 'd(x, y)        // entre 0 y 1',
      d_hamming: 'devolver (número de genes con x[g] ≠ y[g]) / L',
      d_edges: 'devolver (número de tramos de x que no están en y) / n',
      d_euclid: 'devolver ‖p(x) − p(y)‖ / (√2 · (b − a))        // p: el punto (decodificado)',
    },
    en: {
      sig: 'SEQUENTIAL_INHIBITION(N, δ)',
      pinit: 'P ← ∅;  candidates ← 0',
      pwhile: 'while |P| < N:',
      pcand: 'x ← RANDOM_INDIVIDUAL();  candidates ← candidates + 1        // uniform rule',
      ptest: 'if P = ∅ or d(x, y) ≥ δ for every y in P:',
      padd: 'P ← P ∪ {x}',
      pforce: 'otherwise, if candidates > 50 · N:  P ← P ∪ {x}        // forced: δ is too large',
      prej: 'otherwise:  discard x',
      pret: 'return P',
      dsig: 'd(x, y)        // between 0 and 1',
      d_hamming: 'return (number of genes with x[g] ≠ y[g]) / L',
      d_edges: 'return (number of legs of x that are not in y) / n',
      d_euclid: 'return ‖p(x) − p(y)‖ / (√2 · (b − a))        // p: the (decoded) point',
    },
  };
  const KIND = {
    'knapsack-bits': 'hamming', 'assignment-int': 'hamming', 'assignment-matrix': 'hamming',
    'tsp-perm': 'edges', 'function-real': 'euclid', 'function-bits': 'euclid',
  };

  /** variant: codificación (decide la distancia). */
  function pseudocode(lang, variant) {
    const T = P[lang] || P.es;
    return [
      { id: 'sig', indent: 0, text: T.sig },
      { id: 'pinit', indent: 1, text: T.pinit },
      { id: 'pwhile', indent: 1, text: T.pwhile },
      { id: 'pcand', indent: 2, text: T.pcand },
      { id: 'ptest', indent: 2, text: T.ptest },
      { id: 'padd', indent: 3, text: T.padd },
      { id: 'pforce', indent: 2, text: T.pforce },
      { id: 'prej', indent: 2, text: T.prej },
      { id: 'pret', indent: 1, text: T.pret },
      { id: 'blank', indent: 0, text: '' },
      { id: 'dsig', indent: 0, text: T.dsig },
      { id: 'dret', indent: 1, text: T[`d_${KIND[variant] || 'hamming'}`] },
    ];
  }

  const keywords = { es: ['mientras', 'si no', 'si', 'para todo', 'devolver', 'descartar', 'o'], en: ['while', 'otherwise', 'if', 'for every', 'return', 'discard', 'or'] };
  const stepLines = {
    ssi_rule: ['sig', 'ptest', 'dsig', 'dret'],
    cand_ok: ['pcand', 'ptest', 'padd'],
    cand_rej: ['pcand', 'ptest', 'prej'],
    ssi_ind: ['pwhile', 'pcand', 'ptest', 'padd'],
    ssi_pop: ['pret'],
    ssi_dist: ['pret'],
    ssi_cost: ['pinit', 'pcand'],
    ssi_end: ['pret'],
  };

  // ---------- Código descargable ----------

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'sequential_inhibition.py',
      template: `"""
{{title}}
{{ref}}
"""
import math


def hamming_distance(x, y):
    """{{docHamming}}"""
    return sum(1 for a, b in zip(x, y) if a != b) / len(x)


def tour_distance(x, y):
    """{{docTour}}"""
    def legs(t):
        return {tuple(sorted((t[i], t[(i + 1) % len(t)]))) for i in range(len(t))}
    return len(legs(x) - legs(y)) / len(x)


def euclidean_distance(p, q, a, b):
    """{{docEuclid}}"""
    return math.hypot(p[0] - q[0], p[1] - q[1]) / (math.sqrt(2) * (b - a))


def sequential_inhibition(n, new_individual, distance, delta, max_per_individual=50):
    """{{docSsi}}"""
    population, candidates = [], 0
    while len(population) < n:
        x = new_individual()
        candidates += 1
        far = all(distance(x, y) >= delta - 1e-9 for y in population)
        if far or candidates > max_per_individual * n:  # {{forced}}
            population.append(x)
    return population, candidates


if __name__ == "__main__":
    # {{example}}
    stream = iter([[0, 0, 0, 0], [0, 0, 0, 1], [1, 1, 0, 0], [0, 1, 1, 1], [1, 0, 1, 1]])
    pop, cost = sequential_inhibition(3, lambda: next(stream), hamming_distance, 0.5)
    print(pop, cost)  # [[0, 0, 0, 0], [1, 1, 0, 0], [0, 1, 1, 1]] 4
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'sequentialInhibition.js',
      template: `/**
 * {{title}}
 * {{ref}}
 */

/** {{docHamming}} */
function hammingDistance(x, y) {
  return x.filter((v, i) => v !== y[i]).length / x.length;
}

/** {{docTour}} */
function tourDistance(x, y) {
  const legs = (t) => new Set(t.map((c, i) => { const d = t[(i + 1) % t.length]; return c < d ? \`\${c}-\${d}\` : \`\${d}-\${c}\`; }));
  const ly = legs(y);
  return [...legs(x)].filter((e) => !ly.has(e)).length / x.length;
}

/** {{docEuclid}} */
function euclideanDistance(p, q, a, b) {
  return Math.hypot(p[0] - q[0], p[1] - q[1]) / (Math.SQRT2 * (b - a));
}

/** {{docSsi}} */
function sequentialInhibition(n, newIndividual, distance, delta, maxPerIndividual = 50) {
  const population = [];
  let candidates = 0;
  while (population.length < n) {
    const x = newIndividual();
    candidates++;
    const far = population.every((y) => distance(x, y) >= delta - 1e-9);
    if (far || candidates > maxPerIndividual * n) population.push(x);   // {{forced}}
  }
  return { population, candidates };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { hammingDistance, tourDistance, euclideanDistance, sequentialInhibition };
  if (require.main === module) {
    // {{example}}
    const stream = [[0, 0, 0, 0], [0, 0, 0, 1], [1, 1, 0, 0], [0, 1, 1, 1], [1, 0, 1, 1]];
    console.log(sequentialInhibition(3, () => stream.shift(), hammingDistance, 0.5));
    // { population: [ [ 0, 0, 0, 0 ], [ 1, 1, 0, 0 ], [ 0, 1, 1, 1 ] ], candidates: 4 }
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Diversificación secuencial: inhibición secuencial simple (un candidato entra solo si está a δ o más de todos los aceptados).',
      ref: 'Referencias: Diggle, P. J. (1983); Talbi, E.-G. (2009), §3.1.1; Bautista-Valhondo, J. (2020).',
      docHamming: 'Proporción de genes distintos (cadenas de bits o de enteros).',
      docTour: 'Proporción de tramos de un circuito que no están en el otro (0 si es el mismo circuito).',
      docEuclid: 'Distancia euclídea entre dos puntos de la caja [a, b]², dividida por su diagonal.',
      docSsi: 'Genera candidatos con new_individual hasta reunir n a distancia δ o más unos de otros. Devuelve la población y los candidatos generados.',
      forced: 'tras demasiados intentos, se acepta sin comprobar (δ era demasiado grande)',
      example: 'Ejemplo pequeño, para comprobarlo a mano',
    },
    en: {
      title: 'Sequential diversification: simple sequential inhibition (a candidate is accepted only if it is δ or more away from every accepted one).',
      ref: 'References: Diggle, P. J. (1983); Talbi, E.-G. (2009), §3.1.1; Bautista-Valhondo, J. (2020).',
      docHamming: 'Share of differing genes (bit or integer strings).',
      docTour: 'Share of the legs of one tour that are not in the other (0 for the same tour).',
      docEuclid: 'Euclidean distance between two points of the box [a, b]², divided by its diagonal.',
      docSsi: 'Generates candidates with new_individual until n of them are δ or more apart. Returns the population and the number of candidates generated.',
      forced: 'after too many attempts, accepted without checking (δ was too large)',
      example: 'Small example, to check by hand',
    },
  };

  const references = [
    C.ref('talbi', {
      es: 'Manual de referencia del curso. El apartado 3.1.1 presenta la diversificación secuencial, con la inhibición secuencial simple como ejemplo, y la compara con la inicialización aleatoria y la diversificación en paralelo por diversidad, coste y calidad.',
      en: 'The course’s reference textbook. Section 3.1.1 presents sequential diversification, with simple sequential inhibition as an example, and compares it with random initialisation and parallel diversification by diversity, cost and quality.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Dedica a los algoritmos genéticos el capítulo 8.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Chapter 8 is devoted to genetic algorithms.',
    }),
    C.ref('diggle1983', {
      es: 'Manual de estadística de patrones de puntos, donde se describe la inhibición secuencial simple como modelo de puntos que no pueden estar a menos de una distancia dada.',
      en: 'Textbook on the statistics of point patterns, which describes simple sequential inhibition as a model of points that cannot be closer than a given distance.',
    }),
    C.ref('kazimipour2014', {
      es: 'Revisión de las técnicas de inicialización de poblaciones, incluidas las que controlan la distancia entre individuos.',
      en: 'Review of population initialisation techniques, including those that control the distance between individuals.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({
    id: 'ssi', explanation, stages, narration, pseudocode, keywords, stepLines, codeTemplates, references,
  }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).ssi = api;
})(typeof self !== 'undefined' ? self : this);
