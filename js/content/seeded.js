/*
 * Contenido docente del contraejemplo de la siembra heurística: explicación, etapas, narración, pseudocódigo
 * (según el problema), código descargable y referencias.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'Parece una buena idea: si ya tenemos una solución razonable, obtenida con una heurística o con otra metaheurística, ¿por qué no meterla en la población inicial? En recocido simulado o búsqueda tabú, partir de una solución previa es habitual. En un algoritmo genético, en cambio, el curso lo desaconseja: lo mejor es empezar con una población aleatoria y lo más diversa posible.',
      'El motivo es la diversidad. Si toda la población parte de la misma solución, o de soluciones de una misma heurística, el acervo genético inicial es pobre y el cruce no tiene qué combinar. Y si se mezcla una solución muy buena con otras aleatorias, muy malas en comparación, la selección le da casi todos los turnos para reproducirse: en pocas generaciones sus copias invaden la población y la diversidad se pierde demasiado deprisa. Es la convergencia prematura: el algoritmo se queda cerca de la solución de partida, que no tiene por qué ser el óptimo (Talbi, 2009, §3.1.1).',
      'La herramienta construye la solución con una heurística voraz sencilla para cada problema: en la mochila, los objetos por relación valor/peso decreciente, cada uno si cabe; en la asignación, cada tarea a la máquina en la que terminaría antes; en el viajante, el vecino más cercano desde la ciudad 1. Después forma la población con N − K individuos aleatorios uniformes y K copias de esa solución, y la compara con la población uniforme de N individuos generada con la misma semilla.',
      'Para ver la invasión sin que intervengan el cruce ni la mutación, se calcula cuántas copias tendría la mejor solución tras cada generación de selección por torneo binario con reemplazo: si hay k copias entre N, un torneo la elige salvo que los dos contendientes sean otros, así que el número esperado de copias pasa a ser N (1 − (1 − k/N)²). Con N = 10 y una sola copia, en unas seis generaciones la población entera es la misma solución. Es el tiempo de toma de control (takeover time) de Goldberg y Deb (1991), que se estudia en la herramienta de selección.',
      'A cualquier mejor individuo le pasaría lo mismo con selección sola. La diferencia es qué invade la población: con una semilla heurística, una solución elegida de antemano, normalmente muy superior al resto, que gana todos los torneos desde la primera generación y que con selección proporcional a la aptitud se reproduciría aún más deprisa. En una población aleatoria los mejores individuos se parecen poco entre sí y son solo algo mejores que los demás, y el cruce y la mutación tienen tiempo de mezclarlos antes de que uno domine.',
      'Sembrar no está prohibido: hay algoritmos que lo hacen con cuidado, con pocas soluciones heurísticas variadas y operadores que mantienen la diversidad (Eiben y Smith, 2015). Pero tiene que ser una decisión consciente, y en un primer diseño la recomendación es la población aleatoria uniforme.',
    ],
    en: [
      'It looks like a good idea: if we already have a reasonable solution, obtained with a heuristic or another metaheuristic, why not put it into the initial population? In simulated annealing or tabu search, starting from an earlier solution is common. In a genetic algorithm, however, the course advises against it: the best option is to start from a random population that is as diverse as possible.',
      'The reason is diversity. If the whole population starts from the same solution, or from solutions of the same heuristic, the initial gene pool is poor and crossover has nothing to combine. And if a very good solution is mixed with random ones, which are very poor by comparison, selection gives it almost every chance to reproduce: within a few generations its copies invade the population and diversity is lost far too quickly. This is premature convergence: the algorithm stays close to the starting solution, which need not be the optimum (Talbi, 2009, §3.1.1).',
      'The tool builds the solution with a simple greedy heuristic for each problem: for the knapsack, items in decreasing value/weight order, each one if it fits; for the assignment, each task to the machine on which it would finish first; for the travelling salesman, the nearest neighbour from city 1. It then forms the population with N − K uniform random individuals and K copies of that solution, and compares it with the uniform population of N individuals generated with the same seed.',
      'To see the invasion without crossover or mutation getting in the way, the tool computes how many copies the best solution would have after each generation of binary tournament selection with replacement: if there are k copies among N, a tournament picks it unless both contestants are others, so the expected number of copies becomes N (1 − (1 − k/N)²). With N = 10 and a single copy, in about six generations the whole population is the same solution. This is Goldberg and Deb’s (1991) takeover time, which is studied in the selection tool.',
      'With selection alone, the same would happen to any best individual. The difference is what invades the population: with a heuristic seed, a solution chosen in advance, usually far better than the rest, which wins every tournament from the first generation and would reproduce even faster under fitness-proportional selection. In a random population the best individuals are not much alike and only somewhat better than the others, and crossover and mutation have time to mix them before one of them dominates.',
      'Seeding is not forbidden: some algorithms do it carefully, with a few varied heuristic solutions and operators that maintain diversity (Eiben and Smith, 2015). But it has to be a conscious decision, and in a first design the recommendation is a uniform random population.',
    ],
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
      mix_best: 'Población sembrada: {R} individuos aleatorios y {K} copias de la solución heurística, que es con diferencia la mejor: ningún individuo aleatorio llega a su nivel.',
      mix_notbest: 'Población sembrada: {R} individuos aleatorios y {K} copias de la solución heurística. Esta vez {nw} de los aleatorios son tan buenos como ella o mejores: en ejemplos tan pequeños pasa a veces.',
      div_one: 'Diversidad: con una sola copia apenas cambia (distancia media {du} en la población uniforme y {ds} en la sembrada). El problema llega al seleccionar.',
      div_many: 'Diversidad: la distancia media baja de {du} en la población uniforme a {ds} en la sembrada, y los individuos distintos, de {nu} a {ns}. Las copias están a distancia 0 entre sí (celdas con borde).',
      gen: 'Generación {g}: con selección por torneo binario, sin cruce ni mutación, la solución heurística tendría unas {k} copias de {N} (valor esperado).',
      end: 'En unas {gt} generaciones, casi toda la población serían copias de la solución heurística: la diversidad que necesitan el cruce y la mutación desaparece antes de que puedan actuar. Si la heurística no da el óptimo, el algoritmo queda atrapado cerca de ella. Por eso se recomienda empezar con una población aleatoria y diversa.',
      end_opt: 'En unas {gt} generaciones, casi toda la población serían copias de la solución heurística. Aquí la heurística ya da el óptimo, porque el ejemplo es pequeño; en problemas reales rara vez ocurre, y el algoritmo quedaría atrapado cerca de una solución peor. Por eso se recomienda empezar con una población aleatoria y diversa.',
    },
    en: {
      heur_knapsack: 'Greedy heuristic: the items are sorted by value/weight ratio from highest to lowest ({order}) and each one goes in if it fits. Result: {chrom}, worth {v}; the optimum is {opt}. {copies}',
      heur_assign: 'Greedy heuristic: each task, in order, goes to the machine on which it would finish first. Result: {chrom}, with makespan {c}; the optimum is {opt}. {copies}',
      heur_tsp: 'Nearest-neighbour heuristic: from city 1, the salesman always goes to the closest unvisited city. Result: {chrom}, of length {L}; the optimum is {opt}. {copies}',
      copies_one: 'One copy is placed in the population, in the last row.',
      copies_many: '{K} copies are placed in the population, in the last rows.',
      random: 'The rest of the population, {R} individuals, is generated uniformly at random: they are the same ones the uniform random strategy would give with this seed.',
      mix_best: 'Seeded population: {R} random individuals and {K} copies of the heuristic solution, which is by far the best: no random individual comes close to it.',
      mix_notbest: 'Seeded population: {R} random individuals and {K} copies of the heuristic solution. This time {nw} of the random ones are as good as it or better: in examples this small it sometimes happens.',
      div_one: 'Diversity: with a single copy it hardly changes (mean distance {du} in the uniform population and {ds} in the seeded one). The problem comes with selection.',
      div_many: 'Diversity: the mean distance drops from {du} in the uniform population to {ds} in the seeded one, and the number of distinct individuals from {nu} to {ns}. The copies are at distance 0 from one another (outlined cells).',
      gen: 'Generation {g}: with binary tournament selection, no crossover and no mutation, the heuristic solution would have about {k} copies out of {N} (expected value).',
      end: 'In about {gt} generations, almost the whole population would be copies of the heuristic solution: the diversity that crossover and mutation need disappears before they can act. If the heuristic does not give the optimum, the algorithm gets stuck near it. That is why starting from a random, diverse population is recommended.',
      end_opt: 'In about {gt} generations, almost the whole population would be copies of the heuristic solution. Here the heuristic already gives the optimum, because the example is small; in real problems that rarely happens, and the algorithm would get stuck near a worse solution. That is why starting from a random, diverse population is recommended.',
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


def expected_copies(k, n, generations):
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
    print([round(k, 2) for k in expected_copies(1, 10, 6)])  # [1, 1.9, 3.44, 5.7, 8.15, 9.66, 9.99]
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
function expectedCopies(k, n, generations) {
  const out = [k];
  for (let g = 0; g < generations; g++) {
    k = n * (1 - (1 - k / n) ** 2);
    out.push(k);
  }
  return out;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { greedyKnapsack, greedyAssignment, nearestNeighbour, seededPopulation, expectedCopies };
  if (require.main === module) {
    // {{example}}
    console.log(greedyKnapsack([3, 4, 5, 2], [4, 5, 7, 1], 7));   // [ 0, 0, 1, 1 ]
    console.log(greedyAssignment([[2, 5], [4, 1], [3, 3]]));     // [ 1, 2, 2 ]
    console.log(expectedCopies(1, 10, 6).map((k) => Math.round(k * 100) / 100));   // [ 1, 1.9, 3.44, 5.7, 8.15, 9.66, 9.99 ]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Contraejemplo: población inicial sembrada con una solución voraz y copias esperadas tras la selección.',
      ref: 'Referencias: Talbi, E.-G. (2009), §3.1.1; Goldberg, D. E., y Deb, K. (1991); Bautista-Valhondo, J. (2020).',
      docKnap: 'Mochila: objetos por relación valor/peso decreciente (a igualdad, el de menor índice); cada uno entra si cabe.',
      docAssign: 'Asignación: cada tarea, en orden, a la máquina en la que terminaría antes (a igualdad, la de menor índice). p[i][j] es el tiempo de la tarea i en la máquina j.',
      docNN: 'Viajante: vecino más cercano desde la ciudad 1 (a igualdad, la ciudad de menor número). coords[c - 1] son las coordenadas de la ciudad c.',
      tenths: 'distancia euclídea en décimas enteras, como en la herramienta',
      docSeed: 'Población sembrada: los individuos aleatorios y k copias de la solución heurística, al final.',
      docTake: 'Copias esperadas de la mejor solución tras cada generación de torneo binario con reemplazo, sin cruce ni mutación.',
      example: 'Ejemplo pequeño, para comprobarlo a mano',
    },
    en: {
      title: 'Counterexample: initial population seeded with a greedy solution and expected copies after selection.',
      ref: 'References: Talbi, E.-G. (2009), §3.1.1; Goldberg, D. E., & Deb, K. (1991); Bautista-Valhondo, J. (2020).',
      docKnap: 'Knapsack: items in decreasing value/weight order (ties: lowest index); each one goes in if it fits.',
      docAssign: 'Assignment: each task, in order, to the machine on which it would finish first (ties: lowest index). p[i][j] is the time of task i on machine j.',
      docNN: 'Travelling salesman: nearest neighbour from city 1 (ties: lowest-numbered city). coords[c - 1] holds the coordinates of city c.',
      tenths: 'Euclidean distance in whole tenths, as in the tool',
      docSeed: 'Seeded population: the random individuals and k copies of the heuristic solution, at the end.',
      docTake: 'Expected copies of the best solution after each generation of binary tournament with replacement, with no crossover or mutation.',
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
