/*
 * Contenido docente de «Coste de evaluar»: explicación, etapas, narración de los pasos, pseudocódigo,
 * código descargable y referencias.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'En las aplicaciones reales, evaluar suele ser lo más caro de un algoritmo genético: la aptitud puede ser una subrutina larga, una simulación o un experimento. Talbi (2009, §1.4.2.6) pone como ejemplo el diseño aerodinámico, en el que una sola evaluación es una simulación que puede durar más de un día. Seleccionar, cruzar y mutar cuesta muy poco a su lado.',
      'Un algoritmo genético generacional evalúa los N individuos de cada generación: con G generaciones, N · (G + 1) evaluaciones contando la población inicial. Ese número es el presupuesto del algoritmo, y por eso, para comparar dos algoritmos de forma justa, se cuentan evaluaciones y no generaciones ni segundos de un ordenador concreto.',
      'Muchas de esas evaluaciones se repiten. La selección copia los buenos individuos, y la mutación deja a muchos hijos iguales que su padre: con una probabilidad de 1/L por gen, un hijo sale sin ningún cambio con probabilidad (1 − 1/L)ᴸ, cerca de 0,37. Cuando la población converge, cada vez hay más repetidos. Una caché (una tabla de cromosoma → aptitud) evita volver a evaluar un individuo ya visto: antes de evaluar, se busca en la tabla.',
      'Para verlo, la herramienta hace evolucionar la población inicial uniforme con un algoritmo mínimo, sin cruce: torneo binario y mutación de cada gen con probabilidad 1/L, que lo vuelve a sortear con la regla uniforme de su tipo (en la permutación, lo intercambia con otra posición). Cuenta las evaluaciones con y sin caché y, con el mismo presupuesto, hasta qué generación se llega con la caché.',
      'La caché tiene condiciones. Solo vale si la aptitud es determinista: si dos evaluaciones del mismo individuo pueden dar valores distintos (aptitud con ruido), guardar la primera sesga la búsqueda. Ocupa memoria, una entrada por cada individuo distinto, aunque se puede limitar a las últimas generaciones. Y la clave importa: en el viajante, los 2n cromosomas de un mismo circuito tienen la misma aptitud, así que una caché por circuito (fenotipo) ahorraría más que una por cromosoma, que es la que usa la herramienta. Otras formas de ahorrar son evaluar en paralelo o sustituir parte de las evaluaciones por un modelo aproximado (Talbi, 2009, §1.4.2.6).',
    ],
    en: [
      'In real applications, evaluation is usually the most expensive part of a genetic algorithm: fitness may be a long subroutine, a simulation or an experiment. Talbi (2009, §1.4.2.6) gives the example of aerodynamic design, where a single evaluation is a simulation that may take more than a day. Selection, crossover and mutation cost very little by comparison.',
      'A generational genetic algorithm evaluates all N individuals of every generation: with G generations, N · (G + 1) evaluations including the initial population. That number is the algorithm’s budget, which is why two algorithms are compared fairly by counting evaluations rather than generations or seconds on a particular computer.',
      'Many of those evaluations are repeats. Selection copies the good individuals, and mutation leaves many children identical to their parent: with a probability of 1/L per gene, a child comes out unchanged with probability (1 − 1/L)ᴸ, close to 0.37. As the population converges, repeats become more frequent. A cache (a table from chromosome to fitness) avoids evaluating an individual already seen: before evaluating, the table is looked up.',
      'To show it, the tool evolves the uniform initial population with a minimal algorithm, without crossover: binary tournaments and a mutation of each gene with probability 1/L that redraws it with the uniform rule for its type (in the permutation, it swaps it with another position). It counts the evaluations with and without the cache and, for the same budget, how far the cache lets the algorithm go.',
      'A cache comes with conditions. It is only valid if fitness is deterministic: if two evaluations of the same individual can give different values (noisy fitness), keeping the first one biases the search. It takes memory, one entry per distinct individual, although it can be limited to the last few generations. And the key matters: in the travelling salesman problem the 2n chromosomes of one tour have the same fitness, so a cache keyed by tour (phenotype) would save more than one keyed by chromosome, which is the one the tool uses. Other ways of saving are evaluating in parallel or replacing some evaluations with an approximate model (Talbi, 2009, §1.4.2.6).',
    ],
  };

  const stages = {
    es: ['Presupuesto', 'Generación 0', 'Generaciones', 'Evaluaciones', 'Mismo presupuesto'],
    en: ['Budget', 'Generation 0', 'Generations', 'Evaluations', 'Same budget'],
  };

  const narration = {
    es: {
      c_budget: 'Un algoritmo genético generacional evalúa los N individuos de cada generación. Con N = {N} y G = {G} generaciones, N · (G + 1) = {B} evaluaciones: ese es el presupuesto. Si cada una fuera una simulación, sería casi todo el tiempo de cálculo.',
      c_gen0: 'Generación 0, la población inicial: {N} evaluaciones, todas nuevas. Cada cromosoma y su aptitud se guardan en la caché.',
      c_gen0_dup: 'Generación 0, la población inicial: {N} individuos, pero {d} repetidos dentro de la propia población. Con la caché, cada repetido se evalúa una sola vez.',
      c_gen: 'Generación {g} (torneo binario y mutación de cada gen con probabilidad 1/{L}, sin cruce): {hits} de los {N} individuos ya estaban en la caché y solo {nw} se evalúan. Acumulado: {cumNo} evaluaciones sin caché y {cumCache} con caché.',
      c_curve: 'En {G} generaciones, la caché ha evitado {saved} de las {B} evaluaciones ({pct} %). Los repetidos salen de padres que pasan sin mutar y de individuos que la selección copia varias veces; cuanto más converge la población, más hay.',
      c_reach: 'Con el mismo presupuesto de {B} evaluaciones, la caché deja llegar hasta la generación {R}, en lugar de la {G}. Mismo coste, más búsqueda.',
      c_reach_capped: 'Con el mismo presupuesto de {B} evaluaciones, la caché deja llegar más allá de la generación {max} (el límite de la herramienta), en lugar de la {G}: casi todos los individuos se repiten.',
      c_end: 'Contar evaluaciones, y no generaciones, es la forma justa de medir el esfuerzo. La caché ahorra las repetidas si la aptitud es determinista; si tiene ruido, no sirve. Ocupa una entrada por individuo distinto.',
      c_end_tsp: 'Contar evaluaciones, y no generaciones, es la forma justa de medir el esfuerzo. La caché ahorra las repetidas si la aptitud es determinista. En el viajante, con una caché por circuito en lugar de por cromosoma se ahorraría aún más: 2n cromosomas describen el mismo circuito.',
    },
    en: {
      c_budget: 'A generational genetic algorithm evaluates all N individuals of every generation. With N = {N} and G = {G} generations, N · (G + 1) = {B} evaluations: that is the budget. If each were a simulation, it would be almost all of the computing time.',
      c_gen0: 'Generation 0, the initial population: {N} evaluations, all of them new. Each chromosome and its fitness are stored in the cache.',
      c_gen0_dup: 'Generation 0, the initial population: {N} individuals, but {d} repeated within the population itself. With the cache, each repeat is evaluated only once.',
      c_gen: 'Generation {g} (binary tournaments and a mutation of each gene with probability 1/{L}, no crossover): {hits} of the {N} individuals were already in the cache and only {nw} are evaluated. Cumulative: {cumNo} evaluations without the cache and {cumCache} with it.',
      c_curve: 'In {G} generations, the cache has avoided {saved} of the {B} evaluations ({pct}%). Repeats come from parents that pass through without mutating and from individuals that selection copies several times; the more the population converges, the more there are.',
      c_reach: 'With the same budget of {B} evaluations, the cache lets the algorithm reach generation {R} instead of {G}. Same cost, more search.',
      c_reach_capped: 'With the same budget of {B} evaluations, the cache lets the algorithm go beyond generation {max} (the tool’s limit) instead of stopping at {G}: almost every individual is a repeat.',
      c_end: 'Counting evaluations, not generations, is the fair way to measure effort. The cache saves the repeated ones if fitness is deterministic; if it is noisy, it does not work. It takes one entry per distinct individual.',
      c_end_tsp: 'Counting evaluations, not generations, is the fair way to measure effort. The cache saves the repeated ones if fitness is deterministic. In the travelling salesman problem, a cache keyed by tour instead of by chromosome would save even more: 2n chromosomes describe the same tour.',
    },
  };

  // ---------- Pseudocódigo ----------

  const P = {
    es: {
      sig: 'AG_CON_CACHÉ(N, G)',
      init: 'P ← POBLACIÓN_INICIAL(N);  caché ← tabla vacía;  evaluaciones ← 0',
      gen: 'para g = 0, 1, …, G:',
      loop: 'para cada individuo x de P:',
      hit: 'si x está en la caché:  F(x) ← caché[x]          // no cuesta nada',
      miss: 'si no:  F(x) ← EVALUAR(x);  caché[x] ← F(x);  evaluaciones ← evaluaciones + 1',
      next: 'si g < G:  P ← MUTAR(TORNEO_BINARIO(P, F))       // sin cruce',
      ret: 'devolver evaluaciones                          // sin caché serían N · (G + 1)',
    },
    en: {
      sig: 'GA_WITH_CACHE(N, G)',
      init: 'P ← INITIAL_POPULATION(N);  cache ← empty table;  evaluations ← 0',
      gen: 'for g = 0, 1, …, G:',
      loop: 'for each individual x in P:',
      hit: 'if x is in the cache:  F(x) ← cache[x]          // costs nothing',
      miss: 'otherwise:  F(x) ← EVALUATE(x);  cache[x] ← F(x);  evaluations ← evaluations + 1',
      next: 'if g < G:  P ← MUTATE(BINARY_TOURNAMENT(P, F))   // no crossover',
      ret: 'return evaluations                             // N · (G + 1) without the cache',
    },
  };

  function pseudocode(lang) {
    const T = P[lang] || P.es;
    return [
      { id: 'sig', indent: 0, text: T.sig },
      { id: 'init', indent: 1, text: T.init },
      { id: 'gen', indent: 1, text: T.gen },
      { id: 'loop', indent: 2, text: T.loop },
      { id: 'hit', indent: 3, text: T.hit },
      { id: 'miss', indent: 3, text: T.miss },
      { id: 'next', indent: 2, text: T.next },
      { id: 'ret', indent: 1, text: T.ret },
    ];
  }

  const keywords = { es: ['para cada', 'para', 'si no', 'si', 'devolver'], en: ['for each', 'for', 'if', 'otherwise', 'return'] };
  const stepLines = {
    c_budget: ['sig', 'ret'],
    c_gen0: ['init', 'gen', 'loop', 'miss'],
    c_gen: ['gen', 'loop', 'hit', 'miss', 'next'],
    c_curve: ['ret'],
    c_reach: ['ret'],
    c_end: ['ret'],
  };

  // ---------- Código descargable ----------

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'cached_fitness.py',
      template: `"""
{{title}}
{{ref}}
"""


class CachedFitness:
    """{{docClass}}"""

    def __init__(self, fitness, key=tuple):
        self.fitness = fitness
        self.key = key            # {{docKey}}
        self.cache = {}
        self.evaluations = 0      # {{docEvals}}
        self.hits = 0             # {{docHits}}

    def __call__(self, x):
        k = self.key(x)
        if k in self.cache:
            self.hits += 1
            return self.cache[k]
        self.evaluations += 1
        value = self.fitness(x)
        self.cache[k] = value
        return value


def evaluations_per_generation(generations, key=tuple):
    """{{docCount}}"""
    seen = set()
    rows = []
    without_cache = with_cache = 0
    for population in generations:
        new = 0
        for x in population:
            if key(x) not in seen:
                seen.add(key(x))
                new += 1
        without_cache += len(population)
        with_cache += new
        rows.append((new, without_cache, with_cache))
    return rows


if __name__ == "__main__":
    # {{example}}
    f = CachedFitness(lambda x: sum(x))
    for x in [[1, 0, 1], [0, 0, 1], [1, 0, 1], [1, 0, 1]]:
        f(x)
    print(f.evaluations, f.hits)                               # 2 2
    print(evaluations_per_generation([[[1, 0], [0, 1]], [[1, 0], [1, 1]], [[1, 0], [1, 0]]]))
    # [(2, 2, 2), (1, 4, 3), (0, 6, 3)]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'cachedFitness.js',
      template: `/**
 * {{title}}
 * {{ref}}
 */

/** {{docClass}} */
class CachedFitness {
  constructor(fitness, key = (x) => x.join(',')) {
    this.fitness = fitness;
    this.key = key;            // {{docKey}}
    this.cache = new Map();
    this.evaluations = 0;      // {{docEvals}}
    this.hits = 0;             // {{docHits}}
  }

  evaluate(x) {
    const k = this.key(x);
    if (this.cache.has(k)) { this.hits++; return this.cache.get(k); }
    this.evaluations++;
    const value = this.fitness(x);
    this.cache.set(k, value);
    return value;
  }
}

/** {{docCount}} */
function evaluationsPerGeneration(generations, key = (x) => x.join(',')) {
  const seen = new Set();
  let withoutCache = 0;
  let withCache = 0;
  return generations.map((population) => {
    let fresh = 0;
    population.forEach((x) => { if (!seen.has(key(x))) { seen.add(key(x)); fresh++; } });
    withoutCache += population.length;
    withCache += fresh;
    return [fresh, withoutCache, withCache];
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CachedFitness, evaluationsPerGeneration };
  if (require.main === module) {
    // {{example}}
    const f = new CachedFitness((x) => x.reduce((a, b) => a + b, 0));
    [[1, 0, 1], [0, 0, 1], [1, 0, 1], [1, 0, 1]].forEach((x) => f.evaluate(x));
    console.log(f.evaluations, f.hits);                        // 2 2
    console.log(evaluationsPerGeneration([[[1, 0], [0, 1]], [[1, 0], [1, 1]], [[1, 0], [1, 0]]]));
    // [ [ 2, 2, 2 ], [ 1, 4, 3 ], [ 0, 6, 3 ] ]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Coste de evaluar: una función de aptitud con caché y el recuento de evaluaciones, con y sin caché, de una sucesión de generaciones.',
      ref: 'Referencias: Talbi, E.-G. (2009), §1.4.2.6; Bautista-Valhondo, J. (2020); Luke, S. (2013).',
      docClass: 'Envuelve una función de aptitud determinista: un individuo ya visto no se vuelve a evaluar.',
      docKey: 'clave de la caché: el cromosoma (en el viajante se podría usar el circuito)',
      docEvals: 'evaluaciones reales',
      docHits: 'consultas resueltas por la caché',
      docCount: 'Para cada generación: (evaluaciones nuevas, acumuladas sin caché, acumuladas con caché).',
      example: 'Ejemplo pequeño: cuatro consultas con dos repetidas, y tres generaciones de dos individuos',
    },
    en: {
      title: 'The cost of evaluating: a fitness function with a cache, and the evaluation count, with and without the cache, for a sequence of generations.',
      ref: 'References: Talbi, E.-G. (2009), §1.4.2.6; Bautista-Valhondo, J. (2020); Luke, S. (2013).',
      docClass: 'Wraps a deterministic fitness function: an individual already seen is not evaluated again.',
      docKey: 'cache key: the chromosome (for the travelling salesman the tour could be used)',
      docEvals: 'real evaluations',
      docHits: 'lookups answered by the cache',
      docCount: 'For each generation: (new evaluations, cumulative without the cache, cumulative with the cache).',
      example: 'Small example: four lookups with two repeats, and three generations of two individuals',
    },
  };

  const references = [
    C.ref('talbi', {
      es: 'Manual de referencia del curso. El apartado 1.4.2.6 recuerda que, casi siempre, la evaluación del objetivo es la parte más cara de una metaheurística, con ejemplos de simulaciones de más de un día, y presenta los modelos aproximados para reducir ese coste.',
      en: 'The course’s reference textbook. Section 1.4.2.6 points out that evaluating the objective is almost always the most expensive part of a metaheuristic, with examples of simulations lasting more than a day, and introduces approximate models to reduce that cost.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Dedica a los algoritmos genéticos el capítulo 8.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Chapter 8 is devoted to genetic algorithms.',
    }),
    C.ref('luke', {
      es: 'Manual libre en línea, citado en las transparencias del curso: la evaluación suele ser el paso más costoso y puede ser una subrutina, un simulador o un proceso externo.',
      en: 'Free online textbook, cited in the course slides: evaluation is usually the most costly step and may be a subroutine, a simulator or an external process.',
    }),
    C.ref('eiben', {
      es: 'Manual de computación evolutiva. Trata cómo medir y comparar el rendimiento de los algoritmos evolutivos, con el número de evaluaciones como medida del esfuerzo.',
      en: 'Textbook on evolutionary computing. It discusses how to measure and compare the performance of evolutionary algorithms, with the number of evaluations as the measure of effort.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({
    id: 'cost', explanation, stages, narration, pseudocode, keywords, stepLines, codeTemplates, references,
  }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).cost = api;
})(typeof self !== 'undefined' ? self : this);
