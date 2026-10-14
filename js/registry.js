/*
 * Catálogo de la herramienta: dos familias (inicialización y evaluación) con sus estrategias o aspectos.
 * Cada elemento indica su nivel (B básico, A avanzado, + para saber más), la fase en que se construye y
 * las codificaciones de representation-ga a las que se aplica (js/problems/<id>.js).
 * Un elemento con `ready: true` es un enlace (#item=<id>); los demás aparecen como «próximamente».
 * Funciona tanto en el navegador (window.GAX.registry) como en Node (module.exports).
 */
(function (root) {
  'use strict';

  // Las seis codificaciones de representation-ga, en el orden de aquella herramienta.
  const encodings = [
    { id: 'knapsack-bits', representation: 'binary', problem: 'knapsack',
      name: { es: 'Mochila · vector de bits', en: 'Knapsack · bit vector' } },
    { id: 'assignment-int', representation: 'integer', problem: 'assignment',
      name: { es: 'Asignación · vector de enteros', en: 'Assignment · integer vector' } },
    { id: 'assignment-matrix', representation: 'integer', problem: 'assignment',
      name: { es: 'Asignación · matriz binaria', en: 'Assignment · binary matrix' } },
    { id: 'tsp-perm', representation: 'permutation', problem: 'tsp',
      name: { es: 'Viajante · permutación', en: 'TSP · permutation' } },
    { id: 'function-real', representation: 'real', problem: 'function',
      name: { es: 'Función 2D · vector de reales', en: '2D function · real vector' } },
    { id: 'function-bits', representation: 'real', problem: 'function',
      name: { es: 'Función 2D · cadena binaria', en: '2D function · bit string' } },
  ];
  const ALL = encodings.map((e) => e.id);
  const REAL = ['function-real', 'function-bits'];

  const families = [
    {
      id: 'init',
      name: { es: 'Inicialización', en: 'Initialisation' },
      desc: {
        es: 'Antes de evolucionar hay que crear la población de partida. Si es posible, uniforme por todo el espacio de soluciones y lo más diversa posible: una población poco variada converge antes de tiempo, y sembrarla con soluciones de heurísticas previas no suele ser buena idea.',
        en: 'Before anything can evolve, the starting population has to be created. Ideally it is spread uniformly over the whole solution space and as diverse as possible: a population with little variety converges prematurely, and seeding it with solutions from earlier heuristics is rarely a good idea.',
      },
      sample: ['1', '0', '1', '1', '0'],
      items: [
        { id: 'uniform', level: 'B', phase: 1, ready: true, encodings: ALL,
          name: { es: 'Aleatoria uniforme', en: 'Uniform random' },
          summary: {
            es: 'Cada gen se sortea de forma uniforme: un bit con probabilidad 0,5, un entero o un real en su rango, una permutación al azar.',
            en: 'Each gene is drawn uniformly: a bit with probability 0.5, an integer or a real within its range, a random permutation.',
          } },
        { id: 'seeded', level: 'B', phase: 1, ready: true, encodings: ['knapsack-bits', 'assignment-int', 'tsp-perm'],
          name: { es: 'Sembrar con una heurística (contraejemplo)', en: 'Seeding with a heuristic (counterexample)' },
          summary: {
            es: 'Qué pasa con la diversidad si la población parte de una solución voraz o de copias de ella.',
            en: 'What happens to diversity when the population starts from a greedy solution or copies of it.',
          } },
        { id: 'quasi', level: 'A', phase: 2, ready: true, encodings: ['function-real'],
          name: { es: 'Cuasialeatoria e hipercubo latino', en: 'Quasi-random and Latin hypercube' },
          summary: {
            es: 'Secuencias de Halton o Sobol y muestreo por hipercubo latino: cubrir el espacio mejor que el azar.',
            en: 'Halton or Sobol sequences and Latin hypercube sampling: covering the space better than chance.',
          } },
        { id: 'ssi', level: 'A', phase: 2, ready: true, encodings: ALL,
          name: { es: 'Diversificación secuencial', en: 'Sequential diversification' },
          summary: {
            es: 'Inhibición secuencial simple: un individuo nuevo solo entra si está a una distancia mínima δ de los demás.',
            en: 'Simple sequential inhibition: a new individual is accepted only if it lies at least δ away from the others.',
          } },
        { id: 'feasible', level: 'A', phase: 2, ready: true, encodings: ['knapsack-bits', 'assignment-matrix'],
          name: { es: 'Inicialización factible', en: 'Feasible initialisation' },
          summary: {
            es: 'Generar solo individuos que cumplen las restricciones: llenar la mochila hasta que no quepa nada, un 1 por fila en la matriz.',
            en: 'Generate only individuals that satisfy the constraints: fill the knapsack until nothing else fits, one 1 per row in the matrix.',
          } },
      ],
    },
    {
      id: 'eval',
      name: { es: 'Evaluación', en: 'Evaluation' },
      desc: {
        es: 'La aptitud (fitness) mide la calidad de cada individuo. Puede ser una fórmula, una subrutina, una simulación o un experimento externo, y suele ser el paso más caro del algoritmo. Las restricciones pueden entrar en ella como penalización.',
        en: 'Fitness measures the quality of each individual. It may be a formula, a subroutine, a simulation or an external experiment, and it is usually the most expensive step of the algorithm. Constraints can be built into it as a penalty.',
      },
      sample: ['x', '→', 'f(x)'],
      items: [
        { id: 'pipeline', level: 'B', phase: 3, ready: true, encodings: ALL,
          name: { es: 'Del genotipo a la aptitud', en: 'From genotype to fitness' },
          summary: {
            es: 'Decodificar, calcular el objetivo, comprobar las restricciones y obtener la aptitud, individuo a individuo.',
            en: 'Decode, compute the objective, check the constraints and obtain the fitness, one individual at a time.',
          } },
        { id: 'objective', level: 'B', phase: 3, ready: true, encodings: ['assignment-int', 'tsp-perm', 'function-real', 'function-bits'],
          name: { es: 'Objetivo frente a aptitud', en: 'Objective versus fitness' },
          summary: {
            es: 'Maximizar o minimizar: transformar un coste en aptitud y ver cómo cambian las probabilidades de la ruleta.',
            en: 'Maximising or minimising: turning a cost into fitness and seeing how roulette-wheel probabilities change.',
          } },
        { id: 'penalty', level: 'B', phase: 3, ready: true, encodings: ['knapsack-bits', 'assignment-matrix'],
          name: { es: 'Restricciones como penalización', en: 'Constraints as a penalty' },
          summary: {
            es: 'Restar a la aptitud un término que crece con la violación: penalización lineal o cuadrática y el peso λ.',
            en: 'Subtracting from the fitness a term that grows with the violation: linear or quadratic penalty and the weight λ.',
          } },
        { id: 'cost', level: 'B', phase: 3, ready: true, encodings: ALL,
          name: { es: 'Coste de evaluar', en: 'The cost of evaluating' },
          summary: {
            es: 'Contar evaluaciones, fijar un presupuesto y no repetir las de individuos ya vistos (caché).',
            en: 'Counting evaluations, setting a budget and not repeating those of individuals already seen (cache).',
          } },
        { id: 'landscape', level: 'A', phase: 4, ready: true, encodings: ALL,
          name: { es: 'Paisaje de aptitud', en: 'Fitness landscape' },
          summary: {
            es: 'La aptitud vista sobre el espacio de soluciones: curvas de nivel en la función y vecinos a un gen en los problemas discretos.',
            en: 'Fitness seen over the solution space: contour lines for the function, one-gene neighbours for the discrete problems.',
          } },
        { id: 'noise', level: 'A', phase: 4, ready: true, encodings: ['function-real', 'tsp-perm'],
          name: { es: 'Aptitud con ruido', en: 'Noisy fitness' },
          summary: {
            es: 'Cuando dos evaluaciones del mismo individuo no coinciden: reevaluar, promediar y cuándo cambia el orden.',
            en: 'When two evaluations of the same individual disagree: re-evaluating, averaging, and when the ranking changes.',
          } },
        { id: 'surrogate', level: '+', phase: 4, ready: true, encodings: REAL,
          name: { es: 'Aptitud aproximada', en: 'Approximate fitness' },
          summary: {
            es: 'Un metamodelo barato en lugar de la evaluación real: cuánto se ahorra y cuánto se equivoca.',
            en: 'A cheap surrogate model instead of the true evaluation: how much it saves and how wrong it gets.',
          } },
        { id: 'multi', level: '+', phase: 4, ready: true, encodings: ['knapsack-bits', 'assignment-int'],
          name: { es: 'Varios objetivos', en: 'Several objectives' },
          summary: {
            es: 'Suma ponderada frente a dominancia de Pareto y el primer frente.',
            en: 'Weighted sum versus Pareto dominance and the first front.',
          } },
      ],
    },
  ];

  const LEVELS = ['B', 'A', '+'];
  const allItems = () => families.flatMap((f) => f.items.map((it) => Object.assign({ family: f.id }, it)));
  const getItem = (id) => allItems().find((it) => it.id === id) || null;
  const getFamily = (id) => families.find((f) => f.id === id) || null;
  const getEncoding = (id) => encodings.find((e) => e.id === id) || null;
  const isReady = (id) => { const it = getItem(id); return !!(it && it.ready); };
  const readyCount = (fam) => fam.items.filter((it) => it.ready).length;

  const api = { families, encodings, LEVELS, allItems, getItem, getFamily, getEncoding, isReady, readyCount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.GAX = root.GAX || {}).registry = api;
})(typeof self !== 'undefined' ? self : this);
