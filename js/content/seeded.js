/*
 * Contenido docente del contraejemplo de la siembra heurística: explicación, etapas, narración, pseudocódigo
 * (según el problema), código descargable y referencias.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    "es": [
        "Sembrar la población es incluir soluciones conocidas, por ejemplo obtenidas con una heurística. Puede dar un buen punto de partida, pero hay que conservar variedad: muchas copias de una misma solución dejan al cruce poca información distinta que combinar (Talbi, 2009, §3.1.1; Eiben y Smith, 2015).",
        "La herramienta construye una solución voraz: en la mochila, prueba los objetos por relación valor/peso; en la asignación, lleva cada tarea a la máquina en la que terminaría antes; en el viajante, elige el vecino más cercano desde la ciudad 1. La población contiene N − K individuos aleatorios uniformes y K copias de esa solución. Se compara con una población uniforme de N individuos generada con la misma semilla.",
        "La curva supone que la semilla es el único mejor individuo y que solo actúa la selección por torneo binario con reemplazo, sin cruce, mutación ni élite. Si hay K copias entre N, un torneo no elige ninguna solo cuando ambos contendientes son otros. La esperanza de copias en la generación siguiente, dado ese K, es N (1 − (1 − K/N)²).",
        "Para dibujar varias generaciones se itera esa fórmula sobre el resultado anterior. Es una aproximación determinista, no la media exacta de muchas poblaciones finitas. Con N = 10 y K = 1 estima 1,9; 3,4; 5,7; 8,1; 9,7 y 10,0 copias. Una ejecución real también puede perder la semilla: ya en la primera generación ocurre con probabilidad 0,81^10, aproximadamente el 12,2 %. Acercarse a N en la curva no garantiza la fijación.",
        "En un torneo determinista importan el orden de aptitud y el número de copias, no cuánto supera el mejor al resto. Para el mismo rango y número de copias, aumentar esa ventaja no cambia la probabilidad de selección. Esta aproximación muestra la concentración causada por la selección sola; no demuestra que sembrar perjudique siempre a un algoritmo genético completo.",
        "Sembrar puede ser útil con pocas soluciones heurísticas variadas y operadores que mantengan la diversidad. Hay que comprobar su efecto con el algoritmo completo y varias ejecuciones. Para un primer diseño, una población aleatoria uniforme es un punto de partida sencillo (Eiben y Smith, 2015)."
    ],
    "en": [
        "Seeding a population means including known solutions, for example solutions obtained with a heuristic. It can provide a good starting point, but diversity must be preserved: many copies of one solution leave crossover with little distinct information to combine (Talbi, 2009, §3.1.1; Eiben and Smith, 2015).",
        "The tool builds a greedy solution: for knapsack, it tries items in value/weight order; for assignment, each task goes to the machine on which it would finish first; for travelling salesman, it uses the nearest neighbour from city 1. The population contains N − K uniform random individuals and K copies of that solution. It is compared with a uniform population of N individuals generated with the same seed.",
        "The curve assumes that the seed is the single best individual and that only binary tournament selection with replacement acts, with no crossover, mutation or elitism. With K copies among N, a tournament misses the seed only when both contestants are other individuals. The expected number of copies in the next generation, conditional on K, is N (1 − (1 − K/N)²).",
        "To draw several generations, the formula is iterated on the previous result. This is a deterministic approximation, not the exact mean of many finite populations. With N = 10 and K = 1 it estimates 1.9, 3.4, 5.7, 8.1, 9.7 and 10.0 copies. A real run can also lose the seed: this happens in the first generation with probability 0.81^10, about 12.2%. Approaching N in the curve does not guarantee fixation.",
        "In a deterministic tournament, fitness rank and the number of copies matter, not how far ahead the best individual is. With the same rank and number of copies, increasing that advantage does not change selection probability. This approximation shows concentration under selection alone; it does not prove that seeding always harms a complete genetic algorithm.",
        "Seeding can help when a few varied heuristic solutions are combined with operators that preserve diversity. Its effect must be checked with the complete algorithm and several runs. For a first design, a uniform random population is a simple starting point (Eiben and Smith, 2015)."
    ]
};

  const stages = {
    es: ['Heurística', 'Población', 'Diversidad', 'Selección', 'Conclusión'],
    en: ['Heuristic', 'Population', 'Diversity', 'Selection', 'Conclusion'],
  };

  const narration = {
    es: {
      heur_knapsack: 'Heurística voraz: se ordenan los objetos por relación valor/peso de mayor a menor ({order}) y cada uno entra si cabe. Resultado: {chrom}, que vale {v}; el óptimo es {opt}. {copies}',
      heur_assign: 'Heurística voraz: cada tarea, en orden, va a la máquina en la que terminaría antes. Resultado: {chrom}, con makespan {c}; el óptimo es {opt}. {copies}',
      heur_tsp: 'Heurística del vecino más cercano: desde la ciudad 1, el viajante va siempre a la ciudad sin visitar más próxima. Resultado: {chrom}, de longitud {L}; el óptimo es {opt}. {copies}',
      copies_one: 'Se coloca una copia en la población, en la última fila.',
      copies_many: 'Se colocan {K} copias en la población, en las últimas filas.',
      random: 'El resto de la población, {R} individuos, se genera al azar de forma uniforme: son los mismos que daría la estrategia aleatoria uniforme con esta semilla.',
      mix_best: "Población sembrada: {R} individuos aleatorios y {K} copias de la solución heurística. Ningún individuo aleatorio es tan bueno como ella.",
      mix_notbest: 'Población sembrada: {R} individuos aleatorios y {K} copias de la solución heurística. Esta vez {nw} de los aleatorios son tan buenos como ella o mejores: en ejemplos tan pequeños pasa a veces.',
      div_one: 'Diversidad: con una sola copia apenas cambia (distancia media {du} en la población uniforme y {ds} en la sembrada). El problema llega al seleccionar.',
      div_many: "Diversidad: la distancia media pasa de {du} en la población uniforme a {ds} en la sembrada, y los individuos distintos, de {nu} a {ns}. Las copias están a distancia 0 entre sí (celdas con borde).",
      gen: "Generación {g}: la aproximación determinista estima {k} copias de {N}, con torneo binario, sin cruce, mutación ni élite.",
      end: "En la aproximación determinista, en unas {gt} generaciones casi toda la población son copias de la semilla. Una ejecución real puede perderla por azar. Este modelo de selección sola no demuestra que sembrar perjudique siempre al algoritmo completo.",
      end_opt: "La aproximación determinista concentra la población en unas {gt} generaciones. Aquí la heurística ya da el óptimo. En una ejecución real puede perderse por azar; para valorar la siembra hay que probar el algoritmo completo.",
    },
    en: {
      heur_knapsack: 'Greedy heuristic: the items are sorted by value/weight ratio from highest to lowest ({order}) and each one goes in if it fits. Result: {chrom}, worth {v}; the optimum is {opt}. {copies}',
      heur_assign: 'Greedy heuristic: each task, in order, goes to the machine on which it would finish first. Result: {chrom}, with makespan {c}; the optimum is {opt}. {copies}',
      heur_tsp: 'Nearest-neighbour heuristic: from city 1, the salesman always goes to the closest unvisited city. Result: {chrom}, of length {L}; the optimum is {opt}. {copies}',
      copies_one: 'One copy is placed in the population, in the last row.',
      copies_many: '{K} copies are placed in the population, in the last rows.',
      random: 'The rest of the population, {R} individuals, is generated uniformly at random: they are the same ones the uniform random strategy would give with this seed.',
      mix_best: "Seeded population: {R} random individuals and {K} copies of the heuristic solution. No random individual is as good as the seed.",
      mix_notbest: 'Seeded population: {R} random individuals and {K} copies of the heuristic solution. This time {nw} of the random ones are at least as good: this sometimes happens in such small examples.',
      div_one: 'Diversity: with a single copy it hardly changes (mean distance {du} in the uniform population and {ds} in the seeded one). The problem comes with selection.',
      div_many: "Diversity: the mean distance changes from {du} in the uniform population to {ds} in the seeded one, and distinct individuals from {nu} to {ns}. The copies are at distance 0 from one another (outlined cells).",
      gen: "Generation {g}: the deterministic approximation estimates {k} copies out of {N}, with binary tournament selection and no crossover, mutation or elitism.",
      end: "In the deterministic approximation, after about {gt} generations almost the whole population consists of seed copies. A real run can lose the seed by chance. This selection-only model does not prove that seeding always harms the complete algorithm.",
      end_opt: "The deterministic approximation concentrates the population in about {gt} generations. Here the heuristic already gives the optimum. A real run can lose it by chance; seeding must be assessed using the complete algorithm.",
    },
  };

  // ---------- Pseudocódigo ----------

  const P = {
    es: {
      sig: 'SEMBRAR_POBLACIÓN(N, K)',
      rand: 'P ← INICIALIZAR_POBLACIÓN(N − K)        // aleatoria uniforme',
      heur: 'h ← HEURÍSTICA_VORAZ()',
      copy: 'repetir K veces:  P ← P ∪ {h}',
      ret: 'devolver P',
      tsig: 'COPIAS_ESPERADAS(k, N)        // torneo binario, sin cruce ni mutación',
      tret: 'devolver N · (1 − (1 − k/N)²)',
      hsig: 'HEURÍSTICA_VORAZ()',
      ks1: 'ordenar los objetos por vᵢ / wᵢ, de mayor a menor',
      ks2: 'x ← (0, …, 0);  peso ← 0',
      ks3: 'para cada objeto i en ese orden:',
      ks4: 'si peso + wᵢ ≤ W:  xᵢ ← 1;  peso ← peso + wᵢ',
      as1: 'cargas ← (0, …, 0)',
      as2: 'para i = 1, …, n:',
      as3: 'j ← máquina que minimiza cargas[j] + pᵢⱼ',
      as4: 'xᵢ ← j;  cargas[j] ← cargas[j] + pᵢⱼ',
      ts1: 'π ← (1);  quedan ← {2, …, n}',
      ts2: 'mientras quedan ≠ ∅:',
      ts3: 'c ← ciudad de quedan más cercana a la última de π',
      ts4: 'añadir c al final de π;  quitar c de quedan',
      hret: 'devolver x',
      hretp: 'devolver π',
    },
    en: {
      sig: 'SEED_POPULATION(N, K)',
      rand: 'P ← INITIALISE_POPULATION(N − K)        // uniform random',
      heur: 'h ← GREEDY_HEURISTIC()',
      copy: 'repeat K times:  P ← P ∪ {h}',
      ret: 'return P',
      tsig: 'EXPECTED_COPIES(k, N)        // binary tournament, no crossover or mutation',
      tret: 'return N · (1 − (1 − k/N)²)',
      hsig: 'GREEDY_HEURISTIC()',
      ks1: 'sort the items by vᵢ / wᵢ, from highest to lowest',
      ks2: 'x ← (0, …, 0);  weight ← 0',
      ks3: 'for each item i in that order:',
      ks4: 'if weight + wᵢ ≤ W:  xᵢ ← 1;  weight ← weight + wᵢ',
      as1: 'loads ← (0, …, 0)',
      as2: 'for i = 1, …, n:',
      as3: 'j ← machine that minimises loads[j] + pᵢⱼ',
      as4: 'xᵢ ← j;  loads[j] ← loads[j] + pᵢⱼ',
      ts1: 'π ← (1);  left ← {2, …, n}',
      ts2: 'while left ≠ ∅:',
      ts3: 'c ← city in left closest to the last one in π',
      ts4: 'append c to π;  remove c from left',
      hret: 'return x',
      hretp: 'return π',
    },
  };

  /** variant: codificación ('knapsack-bits', 'assignment-int' o 'tsp-perm'). */
  function pseudocode(lang, variant) {
    const T = P[lang] || P.es;
    const head = [
      { id: 'sig', indent: 0, text: T.sig },
      { id: 'rand', indent: 1, text: T.rand },
      { id: 'heur', indent: 1, text: T.heur },
      { id: 'copy', indent: 1, text: T.copy },
      { id: 'ret', indent: 1, text: T.ret },
      { id: 'blank', indent: 0, text: '' },
      { id: 'hsig', indent: 0, text: T.hsig },
    ];
    let body;
    if (variant === 'assignment-int') {
      body = [['as1', 1], ['as2', 1], ['as3', 2], ['as4', 2], ['hret', 1]];
    } else if (variant === 'tsp-perm') {
      body = [['ts1', 1], ['ts2', 1], ['ts3', 2], ['ts4', 2], ['hretp', 1]];
    } else {
      body = [['ks1', 1], ['ks2', 1], ['ks3', 1], ['ks4', 2], ['hret', 1]];
    }
    return head.concat(body.map(([id, indent]) => ({ id: id === 'hretp' ? 'hret' : id, indent, text: T[id] })), [
      { id: 'blank2', indent: 0, text: '' },
      { id: 'tsig', indent: 0, text: T.tsig },
      { id: 'tret', indent: 1, text: T.tret },
    ]);
  }

  const keywords = { es: ['para cada', 'para', 'mientras', 'repetir', 'veces', 'si', 'devolver'], en: ['for each', 'for', 'while', 'repeat', 'times', 'if', 'return'] };
  const stepLines = {
    heur: ['heur', 'hsig'],
    random: ['rand'],
    mix: ['copy', 'ret'],
    div: ['ret'],
    gen: ['tsig', 'tret'],
    end: ['tret'],
  };

  // ---------- Código descargable ----------

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'seeded_population.py',
      template: `"""
{{title}}
{{ref}}
"""
import math


def greedy_knapsack(weights, values, capacity):
    """{{docKnap}}"""
    n = len(weights)
    order = sorted(range(n), key=lambda i: (-values[i] / weights[i], i))
    x, weight = [0] * n, 0
    for i in order:
        if weight + weights[i] <= capacity:
            x[i], weight = 1, weight + weights[i]
    return x


def greedy_assignment(p):
    """{{docAssign}}"""
    m = len(p[0])
    loads, x = [0] * m, []
    for times in p:
        j = min(range(m), key=lambda k: (loads[k] + times[k], k))
        loads[j] += times[j]
        x.append(j + 1)
    return x


def nearest_neighbour(coords):
    """{{docNN}}"""
    def d(a, b):  # {{tenths}}
        (x1, y1), (x2, y2) = coords[a - 1], coords[b - 1]
        return round(math.hypot(x1 - x2, y1 - y2) * 10)
    tour, left = [1], set(range(2, len(coords) + 1))
    while left:
        c = min(left, key=lambda k: (d(tour[-1], k), k))
        tour.append(c)
        left.remove(c)
    return tour


def seeded_population(random_individuals, heuristic_solution, k):
    """{{docSeed}}"""
    return [list(x) for x in random_individuals] + [list(heuristic_solution) for _ in range(k)]


def deterministic_copies(k, n, generations):
    """{{docTake}}"""
    out = [k]
    for _ in range(generations):
        k = n * (1 - (1 - k / n) ** 2)
        out.append(k)
    return out


if __name__ == "__main__":
    # {{example}}
    print(greedy_knapsack([3, 4, 5, 2], [4, 5, 7, 1], 7))      # [0, 0, 1, 1]
    print(greedy_assignment([[2, 5], [4, 1], [3, 3]]))       # [1, 2, 2]
    print([round(k, 2) for k in deterministic_copies(1, 10, 6)])  # [1, 1.9, 3.44, 5.7, 8.15, 9.66, 9.99]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'seededPopulation.js',
      template: `/**
 * {{title}}
 * {{ref}}
 */

/** {{docKnap}} */
function greedyKnapsack(weights, values, capacity) {
  const order = weights.map((_, i) => i)
    .sort((i, j) => values[j] * weights[i] - values[i] * weights[j] || i - j);
  const x = weights.map(() => 0);
  let weight = 0;
  for (const i of order) {
    if (weight + weights[i] <= capacity) { x[i] = 1; weight += weights[i]; }
  }
  return x;
}

/** {{docAssign}} */
function greedyAssignment(p) {
  const m = p[0].length;
  const loads = Array(m).fill(0);
  return p.map((times) => {
    let j = 0;
    for (let k = 1; k < m; k++) if (loads[k] + times[k] < loads[j] + times[j]) j = k;
    loads[j] += times[j];
    return j + 1;
  });
}

/** {{docNN}} */
function nearestNeighbour(coords) {
  // {{tenths}}
  const d = (a, b) => Math.round(Math.hypot(coords[a - 1][0] - coords[b - 1][0], coords[a - 1][1] - coords[b - 1][1]) * 10);
  const tour = [1];
  const left = new Set(coords.map((_, i) => i + 1).slice(1));
  while (left.size) {
    let best = null;
    for (const c of left) if (best === null || d(tour[tour.length - 1], c) < d(tour[tour.length - 1], best) || (d(tour[tour.length - 1], c) === d(tour[tour.length - 1], best) && c < best)) best = c;
    tour.push(best);
    left.delete(best);
  }
  return tour;
}

/** {{docSeed}} */
function seededPopulation(randomIndividuals, heuristicSolution, k) {
  return randomIndividuals.map((x) => x.slice()).concat(Array.from({ length: k }, () => heuristicSolution.slice()));
}

/** {{docTake}} */
function deterministicCopies(k, n, generations) {
  const out = [k];
  for (let g = 0; g < generations; g++) {
    k = n * (1 - (1 - k / n) ** 2);
    out.push(k);
  }
  return out;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { greedyKnapsack, greedyAssignment, nearestNeighbour, seededPopulation, deterministicCopies };
  if (require.main === module) {
    // {{example}}
    console.log(greedyKnapsack([3, 4, 5, 2], [4, 5, 7, 1], 7));   // [ 0, 0, 1, 1 ]
    console.log(greedyAssignment([[2, 5], [4, 1], [3, 3]]));     // [ 1, 2, 2 ]
    console.log(deterministicCopies(1, 10, 6).map((k) => Math.round(k * 100) / 100));   // [ 1, 1.9, 3.44, 5.7, 8.15, 9.66, 9.99 ]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Contraejemplo: población inicial sembrada con una solución voraz y aproximación determinista de las copias tras la selección.',
      ref: 'Referencias: Talbi, E.-G. (2009), §3.1.1; Goldberg, D. E., y Deb, K. (1991); Bautista-Valhondo, J. (2020).',
      docKnap: 'Mochila: objetos por relación valor/peso decreciente (a igualdad, el de menor índice); cada uno entra si cabe.',
      docAssign: 'Asignación: cada tarea, en orden, a la máquina en la que terminaría antes (a igualdad, la de menor índice). p[i][j] es el tiempo de la tarea i en la máquina j.',
      docNN: 'Viajante: vecino más cercano desde la ciudad 1 (a igualdad, la ciudad de menor número). coords[c - 1] son las coordenadas de la ciudad c.',
      tenths: 'distancia euclídea en décimas enteras, como en la herramienta',
      docSeed: 'Población sembrada: los individuos aleatorios y k copias de la solución heurística, al final.',
      docTake: 'Aproximación determinista: itera la esperanza de un paso; no es la media exacta de réplicas. Torneo binario, sin cruce, mutación ni élite.',
      example: 'Ejemplo pequeño, para comprobarlo a mano',
    },
    en: {
      title: 'Counterexample: initial population seeded with a greedy solution and a deterministic approximation of copies after selection.',
      ref: 'References: Talbi, E.-G. (2009), §3.1.1; Goldberg, D. E., & Deb, K. (1991); Bautista-Valhondo, J. (2020).',
      docKnap: 'Knapsack: items in decreasing value/weight order (ties: lowest index); each one goes in if it fits.',
      docAssign: 'Assignment: each task, in order, to the machine on which it would finish first (ties: lowest index). p[i][j] is the time of task i on machine j.',
      docNN: 'Travelling salesman: nearest neighbour from city 1 (ties: lowest-numbered city). coords[c - 1] holds the coordinates of city c.',
      tenths: 'Euclidean distance in whole tenths, as in the tool',
      docSeed: 'Seeded population: the random individuals and k copies of the heuristic solution, at the end.',
      docTake: 'Deterministic approximation: iterates a one-step expectation, not the exact mean of replicates. Binary tournament, no crossover, mutation or elitism.',
      example: 'Small example, to check by hand',
    },
  };

  const references = [
    C.ref('talbi', {
      es: 'Manual de referencia del curso. El apartado 3.1.1 advierte de que una población inicial generada con una heurística voraz o con búsquedas locales puede provocar convergencia prematura, y compara las estrategias de inicialización por diversidad, coste y calidad.',
      en: 'The course’s reference textbook. Section 3.1.1 warns that an initial population generated with a greedy heuristic or with local searches can cause premature convergence, and compares initialisation strategies by diversity, cost and quality.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Dedica a los algoritmos genéticos el capítulo 8.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Chapter 8 is devoted to genetic algorithms.',
    }),
    C.ref('goldbergDeb1991', {
      es: 'Define el tiempo de toma de control (takeover time): las generaciones que tarda el mejor individuo en ocupar toda la población con selección sola. Lo calcula para el torneo, el ranking y la selección proporcional.',
      en: 'Defines takeover time: the number of generations the best individual takes to fill the whole population under selection alone. Computes it for tournament, ranking and proportionate selection.',
    }),
    C.ref('eiben', {
      es: 'Manual de computación evolutiva. Discute cuándo compensa sembrar la población inicial con soluciones conocidas y el riesgo de perder diversidad.',
      en: 'Textbook on evolutionary computing. Discusses when it pays to seed the initial population with known solutions and the risk of losing diversity.',
    }),
    C.ref('kazimipour2014', {
      es: 'Revisión de las técnicas de inicialización de poblaciones, incluida la inicialización con conocimiento del problema.',
      en: 'Review of population initialisation techniques, including problem-specific initialisation.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({
    id: 'seeded', explanation, stages, narration, pseudocode, keywords, stepLines, codeTemplates, references,
  }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).seeded = api;
})(typeof self !== 'undefined' ? self : this);
