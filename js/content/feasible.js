/*
 * Contenido docente de la inicialización factible: explicación, etapas, narración, pseudocódigo (según el
 * problema), código descargable y referencias.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'Con algunas codificaciones, la inicialización aleatoria uniforme produce sobre todo individuos infactibles. En la mochila, cada objeto entra con probabilidad 0,5 y muchas cadenas pesan más que la capacidad. En la asignación con matriz binaria es peor: una fila tiene exactamente un 1 con probabilidad m / 2ᵐ, y con varias tareas casi ninguna matriz es una asignación válida, así que la población inicial sale entera infactible. Un algoritmo genético puede trabajar con infactibles si la evaluación los penaliza o los repara, pero también se puede inicializar de forma que todos cumplan las restricciones.',
      'En la mochila, la herramienta baraja el orden de los objetos con Fisher–Yates y los recorre en ese orden, metiendo cada uno si cabe. El resultado siempre es factible y, además, está lleno: no cabe ningún objeto más. Es la inicialización que usaron Chu y Beasley (1998) en su algoritmo genético para la mochila multidimensional, y sirve para cualquier problema en que una solución se construya añadiendo elementos mientras quepan.',
      'En la matriz binaria basta con cambiar qué se sortea: en lugar de cada bit, la máquina de cada tarea, j = 1 + ⌊u · m⌋, y se pone un único 1 en esa columna de la fila. Cada asignación válida sale con la misma probabilidad: es la inicialización uniforme de la codificación entera, escrita como matriz. Esto muestra que la factibilidad de la población inicial depende tanto de la representación como del método.',
      'Inicializar de forma factible no es gratis. La mochila llena sesga la población: nunca salen soluciones con pocos objetos, que son factibles y pueden tener genes valiosos, y los individuos se parecen más entre sí que en la población uniforme. La calidad inicial mejora, pero la diversidad baja algo. Y en problemas con restricciones complicadas, encontrar una sola solución factible puede ser tan difícil como resolver el problema; entonces es más práctico tratar las restricciones en la evaluación, con penalizaciones, o con reparaciones y decodificadores (Michalewicz, 1996).',
    ],
    en: [
      'With some encodings, uniform random initialisation produces mostly infeasible individuals. In the knapsack, each item goes in with probability 0.5 and many strings weigh more than the capacity. In the assignment with a binary matrix it is worse: a row has exactly one 1 with probability m / 2ᵐ, and with several tasks almost no matrix is a valid assignment, so the whole initial population comes out infeasible. A genetic algorithm can work with infeasible individuals if the evaluation penalises or repairs them, but the population can also be initialised so that every individual satisfies the constraints.',
      'In the knapsack, the tool shuffles the order of the items with Fisher–Yates and goes through them in that order, putting each one in if it fits. The result is always feasible and, moreover, full: no other item fits. This is the initialisation Chu and Beasley (1998) used in their genetic algorithm for the multidimensional knapsack, and it works for any problem in which a solution is built by adding elements while they fit.',
      'In the binary matrix it is enough to change what is drawn: instead of each bit, the machine of each task, j = 1 + ⌊u · m⌋, and a single 1 is placed in that column of the row. Every valid assignment comes out with the same probability: it is the uniform initialisation of the integer encoding, written as a matrix. This shows that the feasibility of the initial population depends on the representation as much as on the method.',
      'Feasible initialisation is not free. The full knapsack biases the population: solutions with few items, which are feasible and may carry valuable genes, never come out, and the individuals are more alike than in the uniform population. Initial quality improves, but diversity drops somewhat. And in problems with complicated constraints, finding a single feasible solution can be as hard as solving the problem; it is then more practical to handle the constraints in the evaluation, with penalties, or with repairs and decoders (Michalewicz, 1996).',
    ],
  };

  const stages = {
    es: ['Espacio', 'Regla', 'Primer individuo', 'Población', 'Comparación'],
    en: ['Space', 'Rule', 'First individual', 'Population', 'Comparison'],
  };

  const narration = {
    es: {
      f_space_knapsack: 'La mochila tiene {n} objetos y capacidad {W}: de los {total} cromosomas, solo {feasible} ({share} %) caben. Con la regla uniforme, más o menos esa proporción de la población sería factible. Ahora vamos a generar N = {N} individuos que quepan todos.',
      f_space_matrix: 'Hay {n} tareas y {m} máquinas: de las {total} matrices de {nm} bits, solo {feasible} ({share} %) tienen un 1 por fila. Con la regla uniforme, casi ninguna población tendría un individuo factible. Ahora vamos a generar N = {N} que lo sean todos.',
      f_rule_knapsack: 'Regla: se baraja el orden de los objetos con Fisher–Yates y se recorren en ese orden; cada objeto entra si cabe en lo que queda de capacidad. Así la mochila acaba llena: no cabe ningún objeto más.',
      f_rule_matrix: 'Regla: en lugar de sortear cada bit, se sortea la máquina de cada tarea, j = 1 + ⌊u · {m}⌋, y la fila lleva un único 1, en la columna j. Cada asignación válida sale con la misma probabilidad.',
      f_order: 'Primer individuo: el orden barajado de los objetos es {order}. Se recorren en ese orden con la mochila vacía.',
      f_item_in: 'Objeto {item} (peso {w}): {before} + {w} = {after} ≤ {W}, cabe: el gen {item} vale 1.',
      f_item_out: 'Objeto {item} (peso {w}): {before} + {w} = {after} > {W}, no cabe: el gen {item} vale 0.',
      f_row: 'Tarea {i}: u = {u}; 1 + ⌊{u} · {m}⌋ = {j}. La fila {i} lleva un 1 en la máquina {j} y 0 en las demás.',
      first: 'Primer individuo completo: {chrom}. {q}',
      f_ind: 'Individuo {i}: {chrom}. {q}',
      f_pop: 'Población completa: los {N} individuos son factibles.',
      f_feas: 'Factibilidad: {ff} de {N} con la inicialización factible, frente a {uf} de {N} en la población uniforme con la misma semilla.',
      f_dist_knapsack: 'Diversidad: la distancia media es {fmean} frente a {umean} en la uniforme, y hay {fd} individuos distintos frente a {ud}. Las mochilas llenas se parecen más entre sí: nunca salen soluciones con pocos objetos.',
      f_dist_matrix: 'Diversidad: la distancia media es {fmean} frente a {umean} en la uniforme. Baja porque cada fila tiene ahora un solo 1: en una matriz uniforme hay tantos unos como ceros.',
      f_quality_max: 'Calidad: el mejor vale {fbest} y la media de los factibles {fmean}, frente a {ubest} y {umean} en la uniforme; el óptimo es {opt}. Las mochilas llenas valen más de partida.',
      f_quality_min: 'Calidad: el mejor makespan es {fbest} y la media {fmean}; el óptimo es {opt}. En la población uniforme {uq}.',
      uq_none: 'no había ningún individuo factible con el que comparar',
      uq_some: 'el mejor de los factibles era {ubest}',
      f_end_knapsack: 'La inicialización factible da una población entera válida y de más calidad, a cambio de algo de diversidad y de un sesgo: solo mochilas llenas. Cuando encontrar soluciones factibles es difícil, se recurre a penalizar o reparar en la evaluación.',
      f_end_matrix: 'Con la matriz, la inicialización factible es la uniforme de la codificación entera: la factibilidad de la población inicial depende tanto de la representación como del método. Cuando encontrar soluciones factibles es difícil, se recurre a penalizar o reparar en la evaluación.',
    },
    en: {
      f_space_knapsack: 'The knapsack has {n} items and capacity {W}: of the {total} chromosomes, only {feasible} ({share}%) fit. With the uniform rule, roughly that share of the population would be feasible. Now we are going to generate N = {N} individuals that all fit.',
      f_space_matrix: 'There are {n} tasks and {m} machines: of the {total} matrices of {nm} bits, only {feasible} ({share}%) have one 1 per row. With the uniform rule, almost no population would contain a feasible individual. Now we are going to generate N = {N} that all are.',
      f_rule_knapsack: 'Rule: the order of the items is shuffled with Fisher–Yates and they are visited in that order; each item goes in if it fits in the remaining capacity. The knapsack thus ends up full: no other item fits.',
      f_rule_matrix: 'Rule: instead of drawing each bit, the machine of each task is drawn, j = 1 + ⌊u · {m}⌋, and the row holds a single 1, in column j. Every valid assignment comes out with the same probability.',
      f_order: 'First individual: the shuffled order of the items is {order}. They are visited in that order with the knapsack empty.',
      f_item_in: 'Item {item} (weight {w}): {before} + {w} = {after} ≤ {W}, it fits: gene {item} is 1.',
      f_item_out: 'Item {item} (weight {w}): {before} + {w} = {after} > {W}, it does not fit: gene {item} is 0.',
      f_row: 'Task {i}: u = {u}; 1 + ⌊{u} · {m}⌋ = {j}. Row {i} holds a 1 for machine {j} and 0 for the others.',
      first: 'First complete individual: {chrom}. {q}',
      f_ind: 'Individual {i}: {chrom}. {q}',
      f_pop: 'Complete population: all {N} individuals are feasible.',
      f_feas: 'Feasibility: {ff} out of {N} with feasible initialisation, against {uf} out of {N} in the uniform population with the same seed.',
      f_dist_knapsack: 'Diversity: the mean distance is {fmean} against {umean} in the uniform population, and there are {fd} distinct individuals against {ud}. Full knapsacks are more alike: solutions with few items never come out.',
      f_dist_matrix: 'Diversity: the mean distance is {fmean} against {umean} in the uniform population. It drops because each row now has a single 1: a uniform matrix has as many ones as zeros.',
      f_quality_max: 'Quality: the best is worth {fbest} and the mean of the feasible ones {fmean}, against {ubest} and {umean} in the uniform population; the optimum is {opt}. Full knapsacks are worth more from the start.',
      f_quality_min: 'Quality: the best makespan is {fbest} and the mean {fmean}; the optimum is {opt}. In the uniform population {uq}.',
      uq_none: 'there was no feasible individual to compare with',
      uq_some: 'the best feasible one was {ubest}',
      f_end_knapsack: 'Feasible initialisation gives an entirely valid population of higher quality, at the price of some diversity and a bias: only full knapsacks. When feasible solutions are hard to find, penalties or repairs in the evaluation are used instead.',
      f_end_matrix: 'With the matrix, feasible initialisation is the uniform initialisation of the integer encoding: the feasibility of the initial population depends on the representation as much as on the method. When feasible solutions are hard to find, penalties or repairs in the evaluation are used instead.',
    },
  };

  // ---------- Pseudocódigo ----------

  const P = {
    es: {
      sig: 'INICIALIZAR_FACTIBLE(N)',
      pinit: 'P ← ∅',
      pfor: 'para i = 1, …, N:',
      pcall: 'x ← INDIVIDUO_FACTIBLE()',
      padd: 'P ← P ∪ {x}',
      pret: 'devolver P',
      isig: 'INDIVIDUO_FACTIBLE()',
      ks1: 'π ← PERMUTACIÓN_ALEATORIA(n)        // Fisher–Yates',
      ks2: 'x ← (0, …, 0);  peso ← 0',
      ks3: 'para k = 1, …, n:',
      ks4: 'si peso + w[π[k]] ≤ W:  x[π[k]] ← 1;  peso ← peso + w[π[k]]',
      mx1: 'y ← matriz n × m de ceros',
      mx2: 'para i = 1, …, n:',
      mx3: 'u ← número aleatorio uniforme en [0, 1);  j ← 1 + ⌊u · m⌋',
      mx4: 'y[i][j] ← 1        // un único 1 por fila',
      iret: 'devolver x',
      iretm: 'devolver y',
    },
    en: {
      sig: 'INITIALISE_FEASIBLE(N)',
      pinit: 'P ← ∅',
      pfor: 'for i = 1, …, N:',
      pcall: 'x ← FEASIBLE_INDIVIDUAL()',
      padd: 'P ← P ∪ {x}',
      pret: 'return P',
      isig: 'FEASIBLE_INDIVIDUAL()',
      ks1: 'π ← RANDOM_PERMUTATION(n)        // Fisher–Yates',
      ks2: 'x ← (0, …, 0);  weight ← 0',
      ks3: 'for k = 1, …, n:',
      ks4: 'if weight + w[π[k]] ≤ W:  x[π[k]] ← 1;  weight ← weight + w[π[k]]',
      mx1: 'y ← n × m matrix of zeros',
      mx2: 'for i = 1, …, n:',
      mx3: 'u ← uniform random number in [0, 1);  j ← 1 + ⌊u · m⌋',
      mx4: 'y[i][j] ← 1        // a single 1 per row',
      iret: 'return x',
      iretm: 'return y',
    },
  };

  /** variant: codificación ('knapsack-bits' o 'assignment-matrix'). */
  function pseudocode(lang, variant) {
    const T = P[lang] || P.es;
    const head = [
      { id: 'sig', indent: 0, text: T.sig },
      { id: 'pinit', indent: 1, text: T.pinit },
      { id: 'pfor', indent: 1, text: T.pfor },
      { id: 'pcall', indent: 2, text: T.pcall },
      { id: 'padd', indent: 2, text: T.padd },
      { id: 'pret', indent: 1, text: T.pret },
      { id: 'blank', indent: 0, text: '' },
      { id: 'isig', indent: 0, text: T.isig },
    ];
    if (variant === 'assignment-matrix') {
      return head.concat([
        { id: 'init', indent: 1, text: T.mx1 },
        { id: 'loop', indent: 1, text: T.mx2 },
        { id: 'draw', indent: 2, text: T.mx3 },
        { id: 'set', indent: 2, text: T.mx4 },
        { id: 'iret', indent: 1, text: T.iretm },
      ]);
    }
    return head.concat([
      { id: 'draw', indent: 1, text: T.ks1 },
      { id: 'init', indent: 1, text: T.ks2 },
      { id: 'loop', indent: 1, text: T.ks3 },
      { id: 'set', indent: 2, text: T.ks4 },
      { id: 'iret', indent: 1, text: T.iret },
    ]);
  }

  const keywords = { es: ['para', 'si', 'devolver'], en: ['for', 'if', 'return'] };
  const stepLines = {
    f_space: ['sig'],
    f_rule: ['isig', 'draw', 'set'],
    f_order: ['draw', 'init'],
    f_item: ['loop', 'set'],
    f_row: ['loop', 'draw', 'set'],
    first: ['iret', 'padd'],
    f_ind: ['pfor', 'pcall', 'padd'],
    f_pop: ['pret'],
    f_feas: ['pret'],
    f_dist: ['pret'],
    f_quality: ['pret'],
    f_end: ['pret'],
  };

  // ---------- Código descargable ----------

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'feasible_initialisation.py',
      template: `"""
{{title}}
{{ref}}
"""
import math
import random


def random_permutation(n, rand=random.random):
    """{{docPerm}}"""
    perm = list(range(1, n + 1))
    for k in range(n, 1, -1):
        j = 1 + math.floor(rand() * k)
        perm[k - 1], perm[j - 1] = perm[j - 1], perm[k - 1]
    return perm


def full_knapsack(weights, capacity, rand=random.random):
    """{{docKnap}}"""
    x, weight = [0] * len(weights), 0
    for item in random_permutation(len(weights), rand):
        if weight + weights[item - 1] <= capacity:
            x[item - 1], weight = 1, weight + weights[item - 1]
    return x


def one_per_row(n, m, rand=random.random):
    """{{docMatrix}}"""
    y = [[0] * m for _ in range(n)]
    for i in range(n):
        j = 1 + math.floor(rand() * m)
        y[i][j - 1] = 1
    return y


if __name__ == "__main__":
    # {{example}}
    us = iter([0.9, 0.2, 0.99, 0.5, 0.1])
    rand = lambda: next(us)
    print(full_knapsack([3, 4, 5, 2], 7, rand))  # [0, 0, 1, 1]
    print(one_per_row(2, 3, rand))               # [[0, 1, 0], [1, 0, 0]]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'feasibleInitialisation.js',
      template: `/**
 * {{title}}
 * {{ref}}
 */

/** {{docPerm}} */
function randomPermutation(n, rand = Math.random) {
  const perm = Array.from({ length: n }, (_, i) => i + 1);
  for (let k = n; k >= 2; k--) {
    const j = 1 + Math.floor(rand() * k);
    [perm[k - 1], perm[j - 1]] = [perm[j - 1], perm[k - 1]];
  }
  return perm;
}

/** {{docKnap}} */
function fullKnapsack(weights, capacity, rand = Math.random) {
  const x = weights.map(() => 0);
  let weight = 0;
  for (const item of randomPermutation(weights.length, rand)) {
    if (weight + weights[item - 1] <= capacity) { x[item - 1] = 1; weight += weights[item - 1]; }
  }
  return x;
}

/** {{docMatrix}} */
function onePerRow(n, m, rand = Math.random) {
  return Array.from({ length: n }, () => {
    const row = Array(m).fill(0);
    row[Math.floor(rand() * m)] = 1;   // j = 1 + ⌊u · m⌋
    return row;
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { randomPermutation, fullKnapsack, onePerRow };
  if (require.main === module) {
    // {{example}}
    const us = [0.9, 0.2, 0.99, 0.5, 0.1];
    const rand = () => us.shift();
    console.log(fullKnapsack([3, 4, 5, 2], 7, rand));   // [ 0, 0, 1, 1 ]
    console.log(onePerRow(2, 3, rand));                // [ [ 0, 1, 0 ], [ 1, 0, 0 ] ]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Inicialización factible: mochila llena desde un orden aleatorio y asignación con un 1 por fila.',
      ref: 'Referencias: Chu, P. C., y Beasley, J. E. (1998); Talbi, E.-G. (2009), §3.1.1; Michalewicz, Z. (1996); Bautista-Valhondo, J. (2020).',
      docPerm: 'Permutación aleatoria de 1, …, n por Fisher–Yates.',
      docKnap: 'Mochila llena: los objetos en un orden aleatorio, cada uno si cabe. Siempre factible y sin sitio para ningún objeto más.',
      docMatrix: 'Matriz n × m con un único 1 por fila, en la máquina 1 + ⌊u · m⌋: una asignación válida, todas igual de probables.',
      example: 'Ejemplo con números aleatorios fijados, para comprobarlo a mano',
    },
    en: {
      title: 'Feasible initialisation: full knapsack from a random order and assignment with one 1 per row.',
      ref: 'References: Chu, P. C., & Beasley, J. E. (1998); Talbi, E.-G. (2009), §3.1.1; Michalewicz, Z. (1996); Bautista-Valhondo, J. (2020).',
      docPerm: 'Random permutation of 1, …, n by Fisher–Yates.',
      docKnap: 'Full knapsack: the items in a random order, each one if it fits. Always feasible, with no room for any other item.',
      docMatrix: 'n × m matrix with a single 1 per row, on machine 1 + ⌊u · m⌋: a valid assignment, all equally likely.',
      example: 'Example with fixed random numbers, to check by hand',
    },
  };

  const references = [
    C.ref('talbi', {
      es: 'Manual de referencia del curso. Trata la población inicial (§3.1.1) y el manejo de restricciones: rechazo, penalización, reparación, decodificadores y operadores que preservan la factibilidad (§1.5).',
      en: 'The course’s reference textbook. Covers the initial population (§3.1.1) and constraint handling: rejection, penalty, repair, decoders and feasibility-preserving operators (§1.5).',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Dedica a los algoritmos genéticos el capítulo 8.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Chapter 8 is devoted to genetic algorithms.',
    }),
    C.ref('chuBeasley1998', {
      es: 'Algoritmo genético para la mochila multidimensional que genera cada individuo inicial añadiendo objetos en un orden aleatorio mientras quepan.',
      en: 'Genetic algorithm for the multidimensional knapsack that generates each initial individual by adding items in a random order while they fit.',
    }),
    C.ref('michalewicz', {
      es: 'Manual clásico de algoritmos genéticos con restricciones: representaciones y operadores que mantienen la factibilidad, reparación y penalización.',
      en: 'Classic textbook on constrained genetic algorithms: representations and operators that preserve feasibility, repair and penalties.',
    }),
    C.ref('kazimipour2014', {
      es: 'Revisión de las técnicas de inicialización de poblaciones, incluida la inicialización con conocimiento del problema.',
      en: 'Review of population initialisation techniques, including problem-specific initialisation.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({
    id: 'feasible', explanation, stages, narration, pseudocode, keywords, stepLines, codeTemplates, references,
  }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).feasible = api;
})(typeof self !== 'undefined' ? self : this);
