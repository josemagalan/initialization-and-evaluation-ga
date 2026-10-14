/*
 * Contenido docente de la inicialización aleatoria uniforme: explicación, etapas, narración de los pasos,
 * pseudocódigo (según el tipo de gen), código descargable y referencias.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'Un algoritmo genético no empieza con una solución, sino con una población: N individuos que serán los primeros padres. Lo habitual, y lo que recomienda el curso, es generarlos al azar y de forma uniforme por todo el espacio de soluciones, de modo que la población sea lo más diversa posible. La población inicial no tiene que ser buena: tiene que dar material variado a la selección, el cruce y la mutación. Si está poco diversificada, el algoritmo puede converger antes de tiempo (Talbi, 2009, §3.1.1).',
      'Uniforme quiere decir que cada cromosoma tiene la misma probabilidad de salir. Basta con sortear cada gen por separado con la regla de su tipo: un bit vale 1 con probabilidad 0,5; un entero de 1 a m se obtiene como 1 + ⌊u · m⌋; un real del intervalo [a, b], como a + u (b − a). En los tres casos u es un número aleatorio uniforme entre 0 y 1, y los genes son independientes entre sí.',
      'Las permutaciones no se pueden sortear gen a gen, porque los genes no son independientes: una ciudad que ya ha salido no puede volver a salir. El método estándar es el de Fisher y Yates (1938), en la versión de Durstenfeld (1964): se parte de (1, 2, …, n) y, desde la última posición hasta la segunda, se intercambia la posición k con una posición j sorteada entre 1 y k. Con n − 1 números aleatorios, cada una de las n! permutaciones tiene la misma probabilidad. Ordenar las ciudades por un número aleatorio también funciona, pero cuesta O(n log n); intercambiar con una posición cualquiera de 1 a n en cada paso parece equivalente y no lo es: da unas permutaciones más a menudo que otras.',
      'Uniforme sobre los cromosomas no es lo mismo que uniforme sobre las soluciones factibles. En la mochila, muchos cromosomas no caben; en la asignación con matriz binaria, casi ninguna matriz tiene exactamente un 1 por fila, y la población inicial sale entera infactible. Con la representación entera de la asignación o con la permutación del viajante, en cambio, todo cromosoma es una solución válida: es una ventaja de esas codificaciones. Cuando la factibilidad importa, se puede inicializar respetando las restricciones o tratarlas en la evaluación, como se ve en las otras estrategias de esta herramienta y en la de representación.',
      'Para medir la diversidad se usa la distancia entre dos individuos, normalizada entre 0 (iguales) y 1 (lo más distintos posible): en las cadenas de bits y de enteros, la proporción de genes que cambian (distancia de Hamming); en el viajante, la proporción de tramos de un circuito que no están en el otro, de modo que los 2n cromosomas de un mismo circuito están a distancia 0; en la función, la distancia entre los puntos dividida por la diagonal de la caja. La media de esa distancia en toda la población y el número de individuos distintos resumen cuánta variedad hay. Para individuos uniformes, la distancia media esperada es 0,5 en los bits, 1 − 1/m en los enteros, 1 − 2/(n − 1) en el viajante y unos 0,37 en la función.',
      'Los números aleatorios de la herramienta se muestran y se usan con dos o tres decimales, para que cada gen se pueda comprobar a mano. Con tres decimales, cada resultado de ⌊u · k⌋ recibe 100 o 101 de los 1000 valores posibles de u cuando k = 10: un sesgo de una milésima como mucho. El código descargable usa números aleatorios con toda la precisión de la máquina.',
    ],
    en: [
      'A genetic algorithm starts not from a solution but from a population: N individuals that will be the first parents. The usual approach, and the one the course recommends, is to generate them at random and uniformly over the whole solution space, so that the population is as diverse as possible. The initial population does not need to be good: it needs to give selection, crossover and mutation varied material to work with. If it is poorly diversified, the algorithm may converge prematurely (Talbi, 2009, §3.1.1).',
      'Uniform means that every chromosome has the same probability of being drawn. It is enough to draw each gene separately with the rule for its type: a bit is 1 with probability 0.5; an integer from 1 to m is obtained as 1 + ⌊u · m⌋; a real number in the interval [a, b], as a + u (b − a). In all three cases u is a uniform random number between 0 and 1, and the genes are independent of one another.',
      'Permutations cannot be drawn gene by gene, because their genes are not independent: a city that has already been drawn cannot be drawn again. The standard method is Fisher and Yates’s (1938), in Durstenfeld’s (1964) version: start from (1, 2, …, n) and, from the last position down to the second, swap position k with a position j drawn between 1 and k. With n − 1 random numbers, each of the n! permutations has the same probability. Sorting the cities by a random key also works but costs O(n log n); swapping with any position from 1 to n at every step looks equivalent but is not: it produces some permutations more often than others.',
      'Uniform over chromosomes is not the same as uniform over feasible solutions. In the knapsack problem many chromosomes do not fit; in the assignment problem with a binary matrix, almost no matrix has exactly one 1 per row, and the whole initial population comes out infeasible. With the integer encoding of the assignment or the permutation of the travelling salesman, on the other hand, every chromosome is a valid solution: that is an advantage of those encodings. When feasibility matters, the population can be initialised so that it satisfies the constraints, or the constraints can be handled in the evaluation, as the other strategies in this tool and the representation tool show.',
      'Diversity is measured with the distance between two individuals, normalised between 0 (identical) and 1 (as different as possible): for bit and integer strings, the proportion of genes that differ (Hamming distance); for the travelling salesman, the proportion of legs of one tour that are not in the other, so that the 2n chromosomes of the same tour are at distance 0; for the function, the distance between the points divided by the diagonal of the box. The mean of that distance over the population and the number of distinct individuals summarise how much variety there is. For uniform individuals, the expected mean distance is 0.5 for bits, 1 − 1/m for integers, 1 − 2/(n − 1) for the travelling salesman and about 0.37 for the function.',
      'The tool shows and uses its random numbers with two or three decimal places, so that every gene can be checked by hand. With three decimal places, each outcome of ⌊u · k⌋ receives 100 or 101 of the 1000 possible values of u when k = 10: a bias of one thousandth at most. The downloadable code uses random numbers with full machine precision.',
    ],
  };

  const stages = {
    es: ['Espacio', 'Regla', 'Primer individuo', 'Población', 'Diversidad'],
    en: ['Space', 'Rule', 'First individual', 'Population', 'Diversity'],
  };

  // Narración: claves por paso y, cuando hace falta, por tipo de gen (sufijo _bits, _int, _matrix, _perm, _real, _fbits)
  const narration = {
    es: {
      space_knapsack: 'La mochila tiene {n} objetos y capacidad {W}. Un cromosoma es una cadena de {n} bits: hay 2ⁿ = {total} cromosomas, de los que {feasible} ({share} %) caben en la mochila. La población inicial es una muestra de N = {N} de ellos.',
      space_int: 'Hay {n} tareas y {m} máquinas. Cada gen dice a qué máquina va una tarea: hay mⁿ = {total} cromosomas y todos son asignaciones válidas. La población inicial es una muestra de N = {N} de ellos.',
      space_matrix: 'Hay {n} tareas y {m} máquinas, y el cromosoma es una matriz de n · m = {nm} bits: hay 2ⁿᵐ = {total} matrices, pero solo {feasible} ({share} %) tienen exactamente un 1 en cada fila y son asignaciones válidas. La población inicial es una muestra de N = {N} de ellas.',
      space_perm: 'Hay {n} ciudades. Un cromosoma es una permutación: hay {n}! = {total} permutaciones, que describen {tours} circuitos distintos, todos válidos. La población inicial es una muestra de N = {N} de ellas.',
      space_real: 'Cada individuo es un punto (x₁, x₂) de la caja [{a}, {b}]², sobre el mapa de la función. Uniforme quiere decir que dos zonas de la caja del mismo tamaño tienen la misma probabilidad de recibir un individuo. Vamos a generar N = {N}.',
      space_fbits: 'Cada variable se codifica con k = {k} bits, así que el cromosoma tiene 2k = {bits} bits y representa uno de los 2²ᵏ = {total} puntos de una rejilla de la caja [{a}, {b}]². Vamos a generar N = {N}.',
      rule_bits: 'Regla: para cada gen se sortea un número u uniforme entre 0 y 1; si u < 0,5 el gen vale 1 y, si no, 0. Cada bit es 1 con probabilidad 0,5 y los genes son independientes, así que todos los cromosomas son igual de probables.',
      rule_int: 'Regla: para cada tarea se sortea u y la máquina es 1 + ⌊u · {m}⌋. Cada máquina recibe la tarea con probabilidad 1/{m}, y todas las asignaciones son igual de probables.',
      rule_matrix: 'Regla: cada uno de los {nm} bits vale 1 si u < 0,5. Así todas las matrices son igual de probables, pero no todas las asignaciones: la mayoría de las matrices tienen filas sin ningún 1 o con varios.',
      rule_perm: 'Regla de Fisher y Yates: se parte de (1, 2, …, {n}) y, desde la posición k = {n} hasta la 2, se sortea j = 1 + ⌊u · k⌋ y se intercambian las posiciones j y k. Son {draws} sorteos, y cada una de las {n}! permutaciones sale con la misma probabilidad.',
      rule_real: 'Regla: cada variable vale xᵢ = a + u (b − a) = {a} + u · {w}, redondeada a centésimas. Es un número uniforme en [{a}, {b}].',
      rule_fbits: 'Regla: cada uno de los {bits} bits vale 1 si u < 0,5. Así cada punto de la rejilla sale con la misma probabilidad, 1/{total}.',
      gene_bits: 'Gen {g}: u = {u} {cmp} 0,5, así que el gen vale {v}.',
      gene_int: 'Tarea {g}: u = {u}; 1 + ⌊{u} · {m}⌋ = 1 + {fl} = {v}. La tarea {g} va a la máquina {v}.',
      gene_matrix: 'Tarea {i}, máquina {j}: u = {u} {cmp} 0,5, así que y{i}{j} = {v}.',
      gene_real: 'x{g}: u = {u}; {a} + {u} · {w} = {v}.',
      swap_move: 'k = {k}: u = {u} y j = 1 + ⌊{u} · {k}⌋ = {j}. Se intercambian las posiciones {j} y {k}: la ciudad {city} queda fija en la posición {k}.',
      swap_stay: 'k = {k}: u = {u} y j = 1 + ⌊{u} · {k}⌋ = {k}. La ciudad {city} se queda en la posición {k}.',
      first: 'Primer individuo completo: {chrom}. {q}',
      ind: 'Individuo {i}: {chrom}. {q} Se ha generado igual que el primero, con números aleatorios nuevos e independientes.',
      pop_map: 'Población inicial completa: {N} individuos repartidos por la caja, sin preferir ninguna zona. Ninguno está cerca del mínimo por haberlo buscado: si alguno lo está, es por azar.',
      pop_routes: 'Población inicial completa: {N} circuitos, cada uno con su propio orden. Son rutas muy largas y enredadas: el azar no sabe nada de distancias.',
      pop_knapsack: 'Población inicial completa: {N} individuos en el plano peso–valor. Los que quedan a la derecha de la línea de capacidad no caben en la mochila.',
      pop_assign: 'Población inicial completa: {N} individuos con su makespan. La línea marca el óptimo.',
      feasible_some: 'Factibilidad: {f} de los {N} individuos ({sharePop} %) cumplen las restricciones; en todo el espacio lo hacen el {share} % de los cromosomas. Uniforme sobre los cromosomas no es uniforme sobre las soluciones factibles.',
      feasible_none: 'Factibilidad: ninguno de los {N} individuos es una asignación válida, como cabía esperar: solo el {share} % de las matrices lo son. Habrá que repararlas o penalizarlas al evaluar, o inicializar de otra forma.',
      feasible_all: 'Factibilidad: los {N} individuos son soluciones válidas. Con esta codificación no hay cromosomas infactibles.',
      distance: 'Diversidad: la distancia media entre dos individuos es {mean} y la mínima, {min} (0 = iguales, 1 = lo más distintos posible). {distinct} de los {N} individuos son distintos. Para individuos uniformes, la media esperada es {expected}.',
      quality_max: 'Calidad: entre los factibles, el mejor vale {best}, la media {mean} y el peor {worst}; el óptimo es {opt}. Una población aleatoria no busca ser buena, sino diversa: mejorarla es trabajo de la selección, el cruce y la mutación.',
      quality_min: 'Calidad: el mejor individuo vale {best}, la media {mean} y el peor {worst}; el óptimo es {opt} (se minimiza). Una población aleatoria no busca ser buena, sino diversa: mejorarla es trabajo de la selección, el cruce y la mutación.',
      quality_none: 'Calidad: sin individuos factibles no hay objetivo que comparar. Al evaluar, una penalización o una reparación les dará una aptitud.',
    },
    en: {
      space_knapsack: 'The knapsack has {n} items and capacity {W}. A chromosome is a string of {n} bits: there are 2ⁿ = {total} chromosomes, of which {feasible} ({share}%) fit in the knapsack. The initial population is a sample of N = {N} of them.',
      space_int: 'There are {n} tasks and {m} machines. Each gene says which machine a task goes to: there are mⁿ = {total} chromosomes and all of them are valid assignments. The initial population is a sample of N = {N} of them.',
      space_matrix: 'There are {n} tasks and {m} machines, and the chromosome is a matrix of n · m = {nm} bits: there are 2ⁿᵐ = {total} matrices, but only {feasible} ({share}%) have exactly one 1 in each row and are valid assignments. The initial population is a sample of N = {N} of them.',
      space_perm: 'There are {n} cities. A chromosome is a permutation: there are {n}! = {total} permutations, describing {tours} different tours, all of them valid. The initial population is a sample of N = {N} of them.',
      space_real: 'Each individual is a point (x₁, x₂) in the box [{a}, {b}]², on the map of the function. Uniform means that two regions of the box of the same size have the same probability of receiving an individual. We are going to generate N = {N}.',
      space_fbits: 'Each variable is encoded with k = {k} bits, so the chromosome has 2k = {bits} bits and represents one of the 2²ᵏ = {total} points of a grid over the box [{a}, {b}]². We are going to generate N = {N}.',
      rule_bits: 'Rule: for each gene a uniform random number u between 0 and 1 is drawn; if u < 0.5 the gene is 1, otherwise 0. Each bit is 1 with probability 0.5 and the genes are independent, so every chromosome is equally likely.',
      rule_int: 'Rule: for each task u is drawn and the machine is 1 + ⌊u · {m}⌋. Each machine receives the task with probability 1/{m}, and every assignment is equally likely.',
      rule_matrix: 'Rule: each of the {nm} bits is 1 if u < 0.5. Every matrix is then equally likely, but not every assignment: most matrices have rows with no 1 or with several.',
      rule_perm: 'Fisher and Yates’s rule: start from (1, 2, …, {n}) and, from position k = {n} down to 2, draw j = 1 + ⌊u · k⌋ and swap positions j and k. That makes {draws} draws, and each of the {n}! permutations comes out with the same probability.',
      rule_real: 'Rule: each variable is xᵢ = a + u (b − a) = {a} + u · {w}, rounded to two decimal places. It is a uniform number in [{a}, {b}].',
      rule_fbits: 'Rule: each of the {bits} bits is 1 if u < 0.5. Every point of the grid is then equally likely, with probability 1/{total}.',
      gene_bits: 'Gene {g}: u = {u} {cmp} 0.5, so the gene is {v}.',
      gene_int: 'Task {g}: u = {u}; 1 + ⌊{u} · {m}⌋ = 1 + {fl} = {v}. Task {g} goes to machine {v}.',
      gene_matrix: 'Task {i}, machine {j}: u = {u} {cmp} 0.5, so y{i}{j} = {v}.',
      gene_real: 'x{g}: u = {u}; {a} + {u} · {w} = {v}.',
      swap_move: 'k = {k}: u = {u} and j = 1 + ⌊{u} · {k}⌋ = {j}. Positions {j} and {k} are swapped: city {city} is now fixed in position {k}.',
      swap_stay: 'k = {k}: u = {u} and j = 1 + ⌊{u} · {k}⌋ = {k}. City {city} stays in position {k}.',
      first: 'First individual complete: {chrom}. {q}',
      ind: 'Individual {i}: {chrom}. {q} It was generated like the first one, with new, independent random numbers.',
      pop_map: 'Initial population complete: {N} individuals spread over the box, with no region preferred. None of them is near the minimum because it was looked for: if one is, it is by chance.',
      pop_routes: 'Initial population complete: {N} tours, each with its own order. They are long, tangled routes: chance knows nothing about distances.',
      pop_knapsack: 'Initial population complete: {N} individuals on the weight–value plane. Those to the right of the capacity line do not fit in the knapsack.',
      pop_assign: 'Initial population complete: {N} individuals with their makespan. The line marks the optimum.',
      feasible_some: 'Feasibility: {f} of the {N} individuals ({sharePop}%) satisfy the constraints; over the whole space, {share}% of the chromosomes do. Uniform over chromosomes is not uniform over feasible solutions.',
      feasible_none: 'Feasibility: none of the {N} individuals is a valid assignment, as was to be expected: only {share}% of the matrices are. They will have to be repaired or penalised when evaluated, or the population initialised differently.',
      feasible_all: 'Feasibility: all {N} individuals are valid solutions. With this encoding there are no infeasible chromosomes.',
      distance: 'Diversity: the mean distance between two individuals is {mean} and the minimum, {min} (0 = identical, 1 = as different as possible). {distinct} of the {N} individuals are distinct. For uniform individuals, the expected mean is {expected}.',
      quality_max: 'Quality: among the feasible ones, the best is worth {best}, the mean {mean} and the worst {worst}; the optimum is {opt}. A random population is not meant to be good but diverse: improving it is the job of selection, crossover and mutation.',
      quality_min: 'Quality: the best individual is worth {best}, the mean {mean} and the worst {worst}; the optimum is {opt} (minimised). A random population is not meant to be good but diverse: improving it is the job of selection, crossover and mutation.',
      quality_none: 'Quality: with no feasible individuals there is no objective to compare. When they are evaluated, a penalty or a repair will give them a fitness.',
    },
  };

  // ---------- Pseudocódigo ----------

  const P = {
    es: {
      sig: 'INICIALIZAR_POBLACIÓN(N)',
      pinit: 'P ← ∅',
      pfor: 'para i = 1, …, N:',
      pcall: 'x ← INDIVIDUO_ALEATORIO()',
      padd: 'P ← P ∪ {x}',
      pret: 'devolver P',
      isig: 'INDIVIDUO_ALEATORIO()',
      ifor_bits: 'para g = 1, …, L:',
      ifor_matrix: 'para i = 1, …, n;  para j = 1, …, m:',
      ifor_real: 'para i = 1, 2:',
      iu: 'u ← número aleatorio uniforme en [0, 1)',
      iset_bits: 'x[g] ← 1 si u < 0,5; si no, 0',
      iset_int: 'x[g] ← 1 + ⌊u · m⌋        // máquina de la tarea g',
      iset_matrix: 'y[i][j] ← 1 si u < 0,5; si no, 0',
      iset_real: 'x[i] ← a + u · (b − a)',
      perm0: 'π ← (1, 2, …, n)',
      pfork: 'para k = n, n − 1, …, 2:',
      pj: 'j ← 1 + ⌊u · k⌋        // posición entre 1 y k',
      pswap: 'intercambiar π[k] y π[j]',
      iret: 'devolver x',
      iretp: 'devolver π',
    },
    en: {
      sig: 'INITIALISE_POPULATION(N)',
      pinit: 'P ← ∅',
      pfor: 'for i = 1, …, N:',
      pcall: 'x ← RANDOM_INDIVIDUAL()',
      padd: 'P ← P ∪ {x}',
      pret: 'return P',
      isig: 'RANDOM_INDIVIDUAL()',
      ifor_bits: 'for g = 1, …, L:',
      ifor_matrix: 'for i = 1, …, n;  for j = 1, …, m:',
      ifor_real: 'for i = 1, 2:',
      iu: 'u ← uniform random number in [0, 1)',
      iset_bits: 'x[g] ← 1 if u < 0.5; otherwise 0',
      iset_int: 'x[g] ← 1 + ⌊u · m⌋        // machine for task g',
      iset_matrix: 'y[i][j] ← 1 if u < 0.5; otherwise 0',
      iset_real: 'x[i] ← a + u · (b − a)',
      perm0: 'π ← (1, 2, …, n)',
      pfork: 'for k = n, n − 1, …, 2:',
      pj: 'j ← 1 + ⌊u · k⌋        // position between 1 and k',
      pswap: 'swap π[k] and π[j]',
      iret: 'return x',
      iretp: 'return π',
    },
  };

  /** variant: tipo de gen ('bits', 'int', 'matrix', 'real' o 'perm'). */
  function pseudocode(lang, variant) {
    const T = P[lang] || P.es;
    const kind = variant || 'bits';
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
    if (kind === 'perm') {
      return head.concat([
        { id: 'perm0', indent: 1, text: T.perm0 },
        { id: 'ifor', indent: 1, text: T.pfork },
        { id: 'iu', indent: 2, text: T.iu },
        { id: 'pj', indent: 2, text: T.pj },
        { id: 'iset', indent: 2, text: T.pswap },
        { id: 'iret', indent: 1, text: T.iretp },
      ]);
    }
    const forKey = kind === 'matrix' ? 'ifor_matrix' : kind === 'real' ? 'ifor_real' : 'ifor_bits';
    return head.concat([
      { id: 'ifor', indent: 1, text: T[forKey] },
      { id: 'iu', indent: 2, text: T.iu },
      { id: 'iset', indent: 2, text: T[`iset_${kind}`] || T.iset_bits },
      { id: 'iret', indent: 1, text: T.iret },
    ]);
  }

  const keywords = { es: ['para', 'si no', 'si', 'devolver', 'intercambiar'], en: ['for', 'if', 'otherwise', 'return', 'swap'] };
  const stepLines = {
    space: ['sig'],
    rule: ['isig', 'ifor', 'iu', 'iset'],
    gene: ['ifor', 'iu', 'iset'],
    swap: ['ifor', 'iu', 'pj', 'iset'],
    first: ['iret', 'padd'],
    ind: ['pfor', 'pcall', 'padd'],
    pop: ['pret'],
    feasible: ['pret'],
    distance: ['pret'],
    quality: ['pret'],
  };

  // ---------- Código descargable ----------

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'uniform_initialisation.py',
      template: `"""
{{title}}
{{ref}}
"""
import math
import random


def random_bits(length, p=0.5, rand=random.random):
    """{{docBits}}"""
    return [1 if rand() < p else 0 for _ in range(length)]


def random_ints(length, m, rand=random.random):
    """{{docInts}}"""
    return [1 + math.floor(rand() * m) for _ in range(length)]


def random_reals(length, a, b, rand=random.random, decimals=2):
    """{{docReals}}"""
    scale = 10 ** decimals
    return [math.floor((a + rand() * (b - a)) * scale + 0.5) / scale for _ in range(length)]


def random_permutation(n, rand=random.random):
    """{{docPerm}}"""
    perm = list(range(1, n + 1))
    for k in range(n, 1, -1):          # k = n, n - 1, ..., 2
        j = 1 + math.floor(rand() * k)  # {{posJ}}
        perm[k - 1], perm[j - 1] = perm[j - 1], perm[k - 1]
    return perm


def initial_population(size, new_individual):
    """{{docPop}}"""
    return [new_individual() for _ in range(size)]


if __name__ == "__main__":
    # {{example}}
    us = iter([0.37, 0.81, 0.05, 0.62, 0.29, 0.94, 0.41, 0.73, 0.12, 0.58])
    rand = lambda: next(us)
    print(random_bits(4, rand=rand))         # [1, 0, 1, 0]
    print(random_ints(3, 3, rand=rand))      # [1, 3, 2]
    print(random_permutation(3, rand=rand))  # [2, 1, 3]
    print(initial_population(2, lambda: random_bits(5)))
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'uniformInitialisation.js',
      template: `/**
 * {{title}}
 * {{ref}}
 */

/** {{docBits}} */
function randomBits(length, p = 0.5, rand = Math.random) {
  return Array.from({ length }, () => (rand() < p ? 1 : 0));
}

/** {{docInts}} */
function randomInts(length, m, rand = Math.random) {
  return Array.from({ length }, () => 1 + Math.floor(rand() * m));
}

/** {{docReals}} */
function randomReals(length, a, b, rand = Math.random, decimals = 2) {
  const scale = 10 ** decimals;
  return Array.from({ length }, () => Math.floor((a + rand() * (b - a)) * scale + 0.5) / scale);
}

/** {{docPerm}} */
function randomPermutation(n, rand = Math.random) {
  const perm = Array.from({ length: n }, (_, i) => i + 1);
  for (let k = n; k >= 2; k--) {
    const j = 1 + Math.floor(rand() * k);   // {{posJ}}
    [perm[k - 1], perm[j - 1]] = [perm[j - 1], perm[k - 1]];
  }
  return perm;
}

/** {{docPop}} */
function initialPopulation(size, newIndividual) {
  return Array.from({ length: size }, () => newIndividual());
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { randomBits, randomInts, randomReals, randomPermutation, initialPopulation };
  if (require.main === module) {
    // {{example}}
    const us = [0.37, 0.81, 0.05, 0.62, 0.29, 0.94, 0.41, 0.73, 0.12, 0.58];
    const rand = () => us.shift();
    console.log(randomBits(4, 0.5, rand));       // [ 1, 0, 1, 0 ]
    console.log(randomInts(3, 3, rand));         // [ 1, 3, 2 ]
    console.log(randomPermutation(3, rand));     // [ 2, 1, 3 ]
    console.log(initialPopulation(2, () => randomBits(5)));
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Inicialización aleatoria uniforme de una población: bits, enteros, reales y permutaciones (Fisher–Yates).',
      ref: 'Referencias: Fisher, R. A., y Yates, F. (1938); Durstenfeld, R. (1964); Talbi, E.-G. (2009), §3.1.1; Bautista-Valhondo, J. (2020).',
      docBits: 'Cadena de bits: cada gen vale 1 con probabilidad p (0,5 para que todas las cadenas sean igual de probables).',
      docInts: 'Vector de enteros de 1 a m: cada gen vale 1 + ⌊u · m⌋, con u uniforme en [0, 1).',
      docReals: 'Vector de reales en [a, b]: cada gen vale a + u (b − a), redondeado a los decimales indicados.',
      docPerm: 'Permutación aleatoria de 1, …, n por el método de Fisher y Yates (versión de Durstenfeld): todas las n! son igual de probables.',
      posJ: 'posición entre 1 y k, ambas incluidas',
      docPop: 'Población inicial: size individuos generados de forma independiente.',
      example: 'Ejemplo con números aleatorios fijados, para comprobar las reglas a mano',
    },
    en: {
      title: 'Uniform random initialisation of a population: bits, integers, reals and permutations (Fisher–Yates).',
      ref: 'References: Fisher, R. A., & Yates, F. (1938); Durstenfeld, R. (1964); Talbi, E.-G. (2009), §3.1.1; Bautista-Valhondo, J. (2020).',
      docBits: 'Bit string: each gene is 1 with probability p (0.5 so that every string is equally likely).',
      docInts: 'Vector of integers from 1 to m: each gene is 1 + ⌊u · m⌋, with u uniform in [0, 1).',
      docReals: 'Vector of reals in [a, b]: each gene is a + u (b − a), rounded to the given number of decimal places.',
      docPerm: 'Random permutation of 1, …, n by Fisher and Yates’s method (Durstenfeld’s version): all n! are equally likely.',
      posJ: 'position between 1 and k, both included',
      docPop: 'Initial population: size individuals generated independently.',
      example: 'Example with fixed random numbers, to check the rules by hand',
    },
  };

  const references = [
    C.ref('talbi', {
      es: 'Manual de referencia del curso. El apartado 3.1.1 trata la población inicial: la diversificación como criterio principal, el riesgo de convergencia prematura y las estrategias aleatoria, de diversificación secuencial y paralela y heurística.',
      en: 'The course’s reference textbook. Section 3.1.1 covers the initial population: diversification as the main criterion, the risk of premature convergence and the random, sequential and parallel diversification and heuristic strategies.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Dedica a los algoritmos genéticos el capítulo 8.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Chapter 8 is devoted to genetic algorithms.',
    }),
    C.ref('fisherYates1938', {
      es: 'Origen del método para barajar una lista al azar tachando elementos de una tabla, que da todas las permutaciones con la misma probabilidad.',
      en: 'Origin of the method for shuffling a list at random by striking out elements from a table, which gives every permutation with the same probability.',
    }, { original: true }),
    C.ref('durstenfeld1964', {
      es: 'Versión del método para ordenador, intercambiando posiciones dentro del propio vector en O(n). Es la que usa la herramienta.',
      en: 'Computer version of the method, swapping positions within the array itself in O(n). It is the one the tool uses.',
    }),
    C.ref('holland', {
      es: 'Obra fundacional de los algoritmos genéticos, que parten de una población de cadenas generadas al azar.',
      en: 'Founding work on genetic algorithms, which start from a population of randomly generated strings.',
    }),
    C.ref('eiben', {
      es: 'Manual de computación evolutiva. Recomienda mantener sencilla la inicialización, normalmente aleatoria, y discute cuándo compensa sembrar la población con soluciones conocidas.',
      en: 'Textbook on evolutionary computing. Recommends keeping initialisation simple, usually random, and discusses when it pays to seed the population with known solutions.',
    }),
    C.ref('kazimipour2014', {
      es: 'Revisión de las técnicas de inicialización de poblaciones en algoritmos evolutivos: generadores pseudoaleatorios y cuasialeatorios, diseños de muestreo y otras.',
      en: 'Review of population initialisation techniques for evolutionary algorithms: pseudo-random and quasi-random generators, sampling designs and others.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({
    id: 'uniform', explanation, stages, narration, pseudocode, keywords, stepLines, codeTemplates, references,
  }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).uniform = api;
})(typeof self !== 'undefined' ? self : this);
