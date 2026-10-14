/*
 * Contenido docente de «Del genotipo a la aptitud»: explicación, etapas, narración de los pasos, pseudocódigo
 * (según la codificación), código descargable y referencias.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'Evaluar un individuo es pasar de su cromosoma a un número, su aptitud (fitness), que dice lo bueno que es. Es lo único que ve la selección: dos individuos con la misma aptitud son, para el algoritmo, igual de buenos aunque representen soluciones muy distintas. La cadena tiene cuatro eslabones: decodificar el genotipo en el fenotipo (la solución que representa), calcular el objetivo sobre esa solución, comprobar si cumple las restricciones y combinar todo en la aptitud (Talbi, 2009, §1.4.2).',
      'Decodificar puede ser inmediato o no. En la función con vector de reales, genotipo y fenotipo coinciden: los genes son las coordenadas del punto. En la cadena binaria hay que pasar cada grupo de k bits a un entero z y escalarlo al intervalo, x = a + z (b − a)/(2ᵏ − 1). En la mochila, cada 1 mete su objeto; en la asignación, cada gen (o cada fila de la matriz) dice en qué máquina va una tarea; en el viajante, la permutación es el orden de visita. En problemas reales, el fenotipo puede salir de ejecutar otro algoritmo o una simulación con los parámetros que lleva el genotipo.',
      'El objetivo se calcula sobre el fenotipo tal cual, aunque no sea factible: el valor de una mochila que no cabe o el makespan de una matriz con filas sin ningún 1 o con varios. La comprobación de las restricciones mide cuánto se incumplen: el exceso de peso e = máx(0, peso − W) en la mochila y las infracciones v = Σᵢ |Σⱼ yᵢⱼ − 1| en la matriz. Con el vector de enteros de la asignación, la permutación del viajante y la función, toda solución es válida por construcción.',
      'La aptitud combina las dos cosas. Si el individuo es factible, es el propio objetivo; si no, la herramienta usa la penalización lineal de representation-ga, con λ = 1: F = valor − e en la mochila, que se maximiza, y F = Cmax + v en la matriz, que se minimiza. Es una elección, no la única: «Restricciones como penalización» enseña qué pasa al cambiar λ, y la herramienta de representación, cómo reparar o decodificar. En los problemas de minimizar, la aptitud de esta página es el objetivo y se minimiza; para usarla en una ruleta hay que transformarla, como se ve en «Objetivo frente a aptitud».',
      'Cada individuo cuesta una evaluación. En aplicaciones reales, evaluar suele ser el paso más caro del algoritmo: puede ser una subrutina larga, una simulación o un experimento (Talbi, 2009, §1.4.2.6; Luke, 2013). Por eso el esfuerzo de un algoritmo genético se mide en evaluaciones y no en generaciones, y por eso merece la pena no repetir las de individuos ya vistos, como se ve en «Coste de evaluar».',
    ],
    en: [
      'Evaluating an individual means going from its chromosome to a number, its fitness, which says how good it is. It is the only thing selection sees: two individuals with the same fitness are, for the algorithm, equally good even if they represent very different solutions. The chain has four links: decode the genotype into the phenotype (the solution it represents), compute the objective on that solution, check whether it satisfies the constraints, and combine everything into the fitness (Talbi, 2009, §1.4.2).',
      'Decoding may or may not be immediate. For the function with a real vector, genotype and phenotype coincide: the genes are the coordinates of the point. For the bit string, each group of k bits has to be turned into an integer z and scaled to the interval, x = a + z (b − a)/(2ᵏ − 1). In the knapsack, each 1 puts its item in; in the assignment, each gene (or each row of the matrix) says which machine a task goes to; in the travelling salesman, the permutation is the order of visits. In real problems, the phenotype may come from running another algorithm or a simulation with the parameters carried by the genotype.',
      'The objective is computed on the phenotype as it stands, even if it is infeasible: the value of a knapsack that does not fit, or the makespan of a matrix with rows that have no 1 or several. Checking the constraints measures how much they are violated: the excess weight e = max(0, weight − W) in the knapsack and the violations v = Σᵢ |Σⱼ yᵢⱼ − 1| in the matrix. With the integer vector of the assignment, the permutation of the travelling salesman and the function, every solution is valid by construction.',
      'Fitness combines both. If the individual is feasible, it is the objective itself; if not, the tool uses the linear penalty of representation-ga, with λ = 1: F = value − e in the knapsack, which is maximised, and F = Cmax + v in the matrix, which is minimised. It is a choice, not the only one: “Constraints as a penalty” shows what happens when λ changes, and the representation tool shows how to repair or decode. In the minimisation problems, the fitness on this page is the objective and is minimised; to use it on a roulette wheel it has to be transformed, as “Objective versus fitness” shows.',
      'Each individual costs one evaluation. In real applications, evaluation is usually the most expensive step of the algorithm: it may be a long subroutine, a simulation or an experiment (Talbi, 2009, §1.4.2.6; Luke, 2013). That is why the effort of a genetic algorithm is measured in evaluations rather than generations, and why it pays not to repeat those of individuals already seen, as “The cost of evaluating” shows.',
    ],
  };

  const stages = {
    es: ['Población', 'Decodificar', 'Objetivo y restricciones', 'Aptitud', 'Puestos y coste'],
    en: ['Population', 'Decode', 'Objective and constraints', 'Fitness', 'Ranks and cost'],
  };

  const narration = {
    es: {
      e_pop_max: 'Población inicial de N = {N} individuos, generada de forma uniforme. Se ven sus cromosomas, pero aún nadie sabe lo buenos que son. Evaluar es dar a cada uno un número, su aptitud, que aquí se maximiza: decodificar, calcular el objetivo, comprobar las restricciones y combinar.',
      e_pop_min: 'Población inicial de N = {N} individuos, generada de forma uniforme. Se ven sus cromosomas, pero aún nadie sabe lo buenos que son. Evaluar es dar a cada uno un número, su aptitud, que aquí se minimiza: decodificar, calcular el objetivo, comprobar las restricciones y combinar.',
      none: 'ninguno',
      e_decode_knapsack: 'Decodificar el individuo 1, {chrom}: cada 1 mete en la mochila el objeto de su posición. El fenotipo es el conjunto de objetos: {items}.',
      e_decode_int: 'Decodificar el individuo 1, {chrom}: cada gen dice la máquina de una tarea. El fenotipo es el reparto de las tareas: {machines}.',
      e_decode_matrix: 'Decodificar el individuo 1, {chrom}: cada fila es una tarea y sus unos, las máquinas que la hacen: {rows}. Todas las tareas tienen exactamente una máquina.',
      e_decode_matrix_bad: 'Decodificar el individuo 1, {chrom}: cada fila es una tarea y sus unos, las máquinas que la hacen: {rows}. Las tareas {bad} no tienen exactamente una máquina: el fenotipo no es una asignación válida, pero se puede leer tal cual.',
      e_decode_tsp: 'Decodificar el individuo 1, {chrom}: la permutación es el orden de visita. El circuito es {tour}.',
      e_decode_fbits: 'Decodificar el individuo 1: x₁ = {b1} en binario es z = {z1}, y x₁ = {a} + {z1} · {w}/{lev} = {x1}; x₂ = {b2} es z = {z2}, y x₂ = {x2}. El fenotipo es el punto ({x1}; {x2}).',
      e_decode_real: 'Decodificar el individuo 1: no hace falta, porque los genes son directamente las coordenadas. Genotipo y fenotipo coinciden: el punto ({x1}; {x2}).',
      e_objective_knapsack: 'Objetivo del individuo 1: valor = {sumv} = {v}. También se suma el peso, {sumw} = {w}, que hará falta para la restricción.',
      e_objective_int: 'Objetivo del individuo 1: la carga de cada máquina es la suma de los tiempos de sus tareas, {loads}, y el makespan es la mayor, {c}.',
      e_objective_matrix: 'Objetivo del individuo 1, con la matriz tal cual: cada 1 suma su tiempo a su máquina y una tarea sin unos no suma nada. Cargas {loads}; makespan {c}.',
      e_objective_tsp: 'Objetivo del individuo 1: la longitud del circuito es la suma de sus {n} tramos, {legs} = {L}.',
      e_objective_fn: 'Objetivo del individuo 1: f({x1}; {x2}) = {f}.',
      e_cons_knapsack_ok: 'Restricción: el peso, {w}, es como mucho la capacidad, {W}. Cabe: la violación es e = 0.',
      e_cons_knapsack_bad: 'Restricción: el peso, {w}, supera la capacidad, {W}. No cabe: la violación es el exceso, e = {w} − {W} = {e}.',
      e_cons_matrix_ok: 'Restricción: cada tarea en exactamente una máquina. v = {terms} = 0: la matriz es una asignación válida.',
      e_cons_matrix_bad: 'Restricción: cada tarea en exactamente una máquina. v = Σᵢ |unos de la fila i − 1| = {terms} = {v} infracciones.',
      e_cons_int: 'Restricción: cada tarea en exactamente una máquina. Con un entero por tarea se cumple siempre: todo cromosoma es una asignación válida.',
      e_cons_tsp: 'Restricción: visitar cada ciudad exactamente una vez. Toda permutación lo cumple: no hay circuitos infactibles.',
      e_cons_real: 'Restricción: las dos coordenadas deben estar en [{a}, {b}]. La población inicial uniforme está siempre dentro de la caja.',
      e_cons_fbits: 'Restricción: el punto debe estar en la caja. Toda cadena decodifica a un punto de la rejilla de la caja: se cumple por construcción.',
      e_fit_knapsack_ok: 'Aptitud del individuo 1: cabe, así que F = valor = {v}. Primera evaluación hecha.',
      e_fit_knapsack_bad: 'Aptitud del individuo 1: no cabe, así que se penaliza (lineal, λ = 1, como en representation-ga): F = {v} − 1 · {e} = {F}. Primera evaluación hecha.',
      e_fit_matrix_ok: 'Aptitud del individuo 1: es válida, así que F = Cmax = {c}. Primera evaluación hecha.',
      e_fit_matrix_bad: 'Aptitud del individuo 1: no es válida, así que se penaliza (lineal, λ = 1, como en representation-ga): F = {c} + 1 · {v} = {F}. Primera evaluación hecha.',
      e_fit_min: 'Aptitud del individuo 1: sin restricciones que penalizar, F es el propio objetivo, {F}, y cuanto menor, mejor. Primera evaluación hecha.',
      e_ind: 'Individuo {i}: {chrom} → F = {F}. Misma cadena que el primero. Evaluaciones: {k} de {N}.',
      e_ind_bad: 'Individuo {i}: {chrom} → F = {F}, penalizado por una violación de {v}. Evaluaciones: {k} de {N}.',
      e_rank_max: 'Población evaluada. El mejor es I{b}, con F = {Fb}, y el peor I{w}, con F = {Fw}. La columna «Puesto» es lo que usará la selección.',
      e_rank_min: 'Población evaluada. El mejor es I{b}, con F = {Fb} (la menor), y el peor I{w}, con F = {Fw}. La columna «Puesto» es lo que usará la selección.',
      e_rank_bad: 'Población evaluada. El mejor por aptitud es I{b}, con F = {Fb}, ¡y es infactible! Con λ = 1, la penalización no basta para dejarlo detrás de los factibles. «Restricciones como penalización» enseña cómo elegir λ.',
      e_count: 'Coste: {N} evaluaciones, una por individuo. Un algoritmo genético generacional evalúa N individuos en cada generación: con N = {N} y 100 generaciones, {total}. Si cada evaluación fuera una simulación de un minuto, serían unas {hours} horas.',
      e_end: 'La aptitud resume en un número todo lo que la selección sabrá de cada individuo. Aquí es el objetivo, porque toda solución es válida; con restricciones o con selección por ruleta habrá que construirla con más cuidado.',
      e_end_pen: 'La aptitud resume en un número todo lo que la selección sabrá de cada individuo: el objetivo y, si incumple las restricciones, la penalización. Con otro λ, el orden de la población puede cambiar.',
    },
    en: {
      e_pop_max: 'Initial population of N = {N} individuals, generated uniformly. Their chromosomes are visible, but nobody knows yet how good they are. Evaluating means giving each one a number, its fitness, which here is maximised: decode, compute the objective, check the constraints and combine.',
      e_pop_min: 'Initial population of N = {N} individuals, generated uniformly. Their chromosomes are visible, but nobody knows yet how good they are. Evaluating means giving each one a number, its fitness, which here is minimised: decode, compute the objective, check the constraints and combine.',
      none: 'none',
      e_decode_knapsack: 'Decode individual 1, {chrom}: each 1 puts the item in its position into the knapsack. The phenotype is the set of items: {items}.',
      e_decode_int: 'Decode individual 1, {chrom}: each gene gives the machine of one task. The phenotype is the allocation of the tasks: {machines}.',
      e_decode_matrix: 'Decode individual 1, {chrom}: each row is a task and its 1s, the machines that process it: {rows}. Every task has exactly one machine.',
      e_decode_matrix_bad: 'Decode individual 1, {chrom}: each row is a task and its 1s, the machines that process it: {rows}. Tasks {bad} do not have exactly one machine: the phenotype is not a valid assignment, but it can be read as it stands.',
      e_decode_tsp: 'Decode individual 1, {chrom}: the permutation is the order of visits. The tour is {tour}.',
      e_decode_fbits: 'Decode individual 1: x₁ = {b1} in binary is z = {z1}, and x₁ = {a} + {z1} · {w}/{lev} = {x1}; x₂ = {b2} is z = {z2}, and x₂ = {x2}. The phenotype is the point ({x1}; {x2}).',
      e_decode_real: 'Decode individual 1: there is nothing to do, because the genes are the coordinates themselves. Genotype and phenotype coincide: the point ({x1}; {x2}).',
      e_objective_knapsack: 'Objective of individual 1: value = {sumv} = {v}. The weight is added up too, {sumw} = {w}, as the constraint will need it.',
      e_objective_int: 'Objective of individual 1: the load of each machine is the sum of the times of its tasks, {loads}, and the makespan is the largest, {c}.',
      e_objective_matrix: 'Objective of individual 1, with the matrix as it stands: each 1 adds its time to its machine and a task with no 1 adds nothing. Loads {loads}; makespan {c}.',
      e_objective_tsp: 'Objective of individual 1: the length of the tour is the sum of its {n} legs, {legs} = {L}.',
      e_objective_fn: 'Objective of individual 1: f({x1}; {x2}) = {f}.',
      e_cons_knapsack_ok: 'Constraint: the weight, {w}, is at most the capacity, {W}. It fits: the violation is e = 0.',
      e_cons_knapsack_bad: 'Constraint: the weight, {w}, exceeds the capacity, {W}. It does not fit: the violation is the excess, e = {w} − {W} = {e}.',
      e_cons_matrix_ok: 'Constraint: each task on exactly one machine. v = {terms} = 0: the matrix is a valid assignment.',
      e_cons_matrix_bad: 'Constraint: each task on exactly one machine. v = Σᵢ |1s in row i − 1| = {terms} = {v} violations.',
      e_cons_int: 'Constraint: each task on exactly one machine. With one integer per task it always holds: every chromosome is a valid assignment.',
      e_cons_tsp: 'Constraint: visit each city exactly once. Every permutation does: there are no infeasible tours.',
      e_cons_real: 'Constraint: both coordinates must lie in [{a}, {b}]. The uniform initial population is always inside the box.',
      e_cons_fbits: 'Constraint: the point must lie in the box. Every string decodes to a point of the grid over the box: it holds by construction.',
      e_fit_knapsack_ok: 'Fitness of individual 1: it fits, so F = value = {v}. First evaluation done.',
      e_fit_knapsack_bad: 'Fitness of individual 1: it does not fit, so it is penalised (linear, λ = 1, as in representation-ga): F = {v} − 1 · {e} = {F}. First evaluation done.',
      e_fit_matrix_ok: 'Fitness of individual 1: it is valid, so F = Cmax = {c}. First evaluation done.',
      e_fit_matrix_bad: 'Fitness of individual 1: it is not valid, so it is penalised (linear, λ = 1, as in representation-ga): F = {c} + 1 · {v} = {F}. First evaluation done.',
      e_fit_min: 'Fitness of individual 1: with no constraints to penalise, F is the objective itself, {F}, and the smaller the better. First evaluation done.',
      e_ind: 'Individual {i}: {chrom} → F = {F}. Same chain as the first one. Evaluations: {k} of {N}.',
      e_ind_bad: 'Individual {i}: {chrom} → F = {F}, penalised for a violation of {v}. Evaluations: {k} of {N}.',
      e_rank_max: 'Population evaluated. The best is I{b}, with F = {Fb}, and the worst I{w}, with F = {Fw}. The “Rank” column is what selection will use.',
      e_rank_min: 'Population evaluated. The best is I{b}, with F = {Fb} (the smallest), and the worst I{w}, with F = {Fw}. The “Rank” column is what selection will use.',
      e_rank_bad: 'Population evaluated. The best by fitness is I{b}, with F = {Fb}, and it is infeasible! With λ = 1 the penalty is not enough to put it behind the feasible ones. “Constraints as a penalty” shows how to choose λ.',
      e_count: 'Cost: {N} evaluations, one per individual. A generational genetic algorithm evaluates N individuals in every generation: with N = {N} and 100 generations, {total}. If each evaluation were a one-minute simulation, that would be about {hours} hours.',
      e_end: 'Fitness sums up in one number everything selection will know about each individual. Here it is the objective, because every solution is valid; with constraints or with roulette-wheel selection it has to be built with more care.',
      e_end_pen: 'Fitness sums up in one number everything selection will know about each individual: the objective and, if it violates the constraints, the penalty. With a different λ, the order of the population may change.',
    },
  };

  // ---------- Pseudocódigo ----------

  const P = {
    es: {
      sig: 'EVALUAR_POBLACIÓN(P)',
      count0: 'evaluaciones ← 0',
      loop: 'para cada individuo x de P:',
      decode: 's ← DECODIFICAR(x)            // fenotipo: la solución que representa x',
      obj: 'z ← OBJETIVO(s)',
      viol_knapsack: 'v ← máx(0, peso(s) − W)       // exceso de peso',
      viol_matrix: 'v ← Σᵢ |Σⱼ yᵢⱼ − 1|            // filas sin un único 1',
      viol_none: 'v ← 0                         // toda solución es válida',
      fit_knapsack: 'F(x) ← z − λ · v               // se maximiza; λ = 1',
      fit_matrix: 'F(x) ← z + λ · v               // se minimiza; λ = 1',
      fit_none: 'F(x) ← z                       // se minimiza',
      inc: 'evaluaciones ← evaluaciones + 1',
      ret: 'devolver F, evaluaciones',
    },
    en: {
      sig: 'EVALUATE_POPULATION(P)',
      count0: 'evaluations ← 0',
      loop: 'for each individual x in P:',
      decode: 's ← DECODE(x)                 // phenotype: the solution x represents',
      obj: 'z ← OBJECTIVE(s)',
      viol_knapsack: 'v ← max(0, weight(s) − W)     // excess weight',
      viol_matrix: 'v ← Σᵢ |Σⱼ yᵢⱼ − 1|            // rows without exactly one 1',
      viol_none: 'v ← 0                         // every solution is valid',
      fit_knapsack: 'F(x) ← z − λ · v               // maximised; λ = 1',
      fit_matrix: 'F(x) ← z + λ · v               // minimised; λ = 1',
      fit_none: 'F(x) ← z                       // minimised',
      inc: 'evaluations ← evaluations + 1',
      ret: 'return F, evaluations',
    },
  };

  /** variant: la codificación. */
  function pseudocode(lang, variant) {
    const T = P[lang] || P.es;
    const k = variant === 'knapsack-bits' ? 'knapsack' : variant === 'assignment-matrix' ? 'matrix' : 'none';
    return [
      { id: 'sig', indent: 0, text: T.sig },
      { id: 'count0', indent: 1, text: T.count0 },
      { id: 'loop', indent: 1, text: T.loop },
      { id: 'decode', indent: 2, text: T.decode },
      { id: 'obj', indent: 2, text: T.obj },
      { id: 'viol', indent: 2, text: T[`viol_${k}`] },
      { id: 'fit', indent: 2, text: T[`fit_${k}`] },
      { id: 'inc', indent: 2, text: T.inc },
      { id: 'ret', indent: 1, text: T.ret },
    ];
  }

  const keywords = { es: ['para cada', 'devolver'], en: ['for each', 'return'] };
  const stepLines = {
    e_pop: ['sig'],
    e_decode: ['loop', 'decode'],
    e_objective: ['obj'],
    e_cons: ['viol'],
    e_fit: ['fit', 'inc'],
    e_ind: ['loop', 'decode', 'obj', 'viol', 'fit', 'inc'],
    e_rank: ['ret'],
    e_count: ['count0', 'inc', 'ret'],
    e_end: ['ret'],
  };

  // ---------- Código descargable ----------

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'fitness_evaluation.py',
      template: `"""
{{title}}
{{ref}}
"""
import math


def knapsack_fitness(weights, values, capacity, x, lam=1, quadratic=False):
    """{{docKnapsack}}"""
    weight = sum(w for w, b in zip(weights, x) if b)
    value = sum(v for v, b in zip(values, x) if b)
    excess = max(0, weight - capacity)
    if excess == 0:
        return value
    penalty = (lam * excess) ** 2 if quadratic else lam * excess
    return value - penalty


def assignment_makespan(p, a):
    """{{docInt}}"""
    loads = [0] * len(p[0])
    for task, machine in enumerate(a):
        loads[machine - 1] += p[task][machine - 1]
    return max(loads)


def matrix_fitness(p, y, lam=1, quadratic=False):
    """{{docMatrix}}"""
    loads = [0] * len(p[0])
    for i, row in enumerate(y):
        for j, bit in enumerate(row):
            if bit:
                loads[j] += p[i][j]
    cmax = max([0] + loads)
    v = sum(abs(sum(row) - 1) for row in y)   # {{violations}}
    if v == 0:
        return cmax
    penalty = (lam * v) ** 2 if quadratic else lam * v
    return cmax + penalty


def tour_length(coords, tour):
    """{{docTour}}"""
    tenths = 0
    for k in range(len(tour)):
        (x1, y1), (x2, y2) = coords[tour[k] - 1], coords[tour[(k + 1) % len(tour)] - 1]
        tenths += math.floor(math.hypot(x1 - x2, y1 - y2) * 10 + 0.5)
    return tenths / 10


def himmelblau(x1, x2):
    """{{docHimmelblau}}"""
    return (x1 * x1 + x2 - 11) * (x1 * x1 + x2 - 11) + (x1 + x2 * x2 - 7) * (x1 + x2 * x2 - 7)


def rastrigin(x1, x2):
    """{{docRastrigin}}"""
    return 20 + (x1 * x1 - 10 * math.cos(2 * math.pi * x1)) + (x2 * x2 - 10 * math.cos(2 * math.pi * x2))


def decode_bits(bits, k, a, b):
    """{{docDecode}}"""
    point = []
    for start in (0, k):
        z = 0
        for bit in bits[start:start + k]:
            z = z * 2 + bit
        point.append(a + z * (b - a) / (2 ** k - 1))
    return point


def evaluate_population(population, fitness):
    """{{docPop}}"""
    values = [fitness(x) for x in population]
    return values, len(population)


if __name__ == "__main__":
    # {{example}}
    print(knapsack_fitness([3, 4, 5], [4, 5, 6], 8, [1, 1, 1]))   # 15 - 1 * 4 = 11
    print(matrix_fitness([[2, 3], [4, 1]], [[1, 1], [0, 0]]))     # 3 + 1 * 2 = 5
    print(tour_length([[0, 0], [3, 0], [3, 4]], [1, 2, 3]))       # 3 + 4 + 5 = 12.0
    print(decode_bits([1, 1, 1, 0, 0, 0], 3, -5, 5))              # [5.0, -5.0]
    print(evaluate_population([[3, 2], [0, 0]], lambda p: himmelblau(*p)))   # ([0, 170], 2)
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'fitnessEvaluation.js',
      template: `/**
 * {{title}}
 * {{ref}}
 */

/** {{docKnapsack}} */
function knapsackFitness(weights, values, capacity, x, lambda = 1, quadratic = false) {
  let weight = 0;
  let value = 0;
  x.forEach((b, i) => { if (b) { weight += weights[i]; value += values[i]; } });
  const excess = Math.max(0, weight - capacity);
  if (excess === 0) return value;
  const penalty = quadratic ? (lambda * excess) * (lambda * excess) : lambda * excess;
  return value - penalty;
}

/** {{docInt}} */
function assignmentMakespan(p, a) {
  const loads = Array(p[0].length).fill(0);
  a.forEach((machine, task) => { loads[machine - 1] += p[task][machine - 1]; });
  return Math.max(...loads);
}

/** {{docMatrix}} */
function matrixFitness(p, y, lambda = 1, quadratic = false) {
  const loads = Array(p[0].length).fill(0);
  y.forEach((row, i) => row.forEach((bit, j) => { if (bit) loads[j] += p[i][j]; }));
  const cmax = Math.max(0, ...loads);
  const v = y.reduce((s, row) => s + Math.abs(row.reduce((a, b) => a + b, 0) - 1), 0);   // {{violations}}
  if (v === 0) return cmax;
  const penalty = quadratic ? (lambda * v) * (lambda * v) : lambda * v;
  return cmax + penalty;
}

/** {{docTour}} */
function tourLength(coords, tour) {
  let tenths = 0;
  tour.forEach((c, k) => {
    const [x1, y1] = coords[c - 1];
    const [x2, y2] = coords[tour[(k + 1) % tour.length] - 1];
    tenths += Math.round(Math.hypot(x1 - x2, y1 - y2) * 10);
  });
  return tenths / 10;
}

/** {{docHimmelblau}} */
function himmelblau(x1, x2) {
  return (x1 * x1 + x2 - 11) * (x1 * x1 + x2 - 11) + (x1 + x2 * x2 - 7) * (x1 + x2 * x2 - 7);
}

/** {{docRastrigin}} */
function rastrigin(x1, x2) {
  return 20 + (x1 * x1 - 10 * Math.cos(2 * Math.PI * x1)) + (x2 * x2 - 10 * Math.cos(2 * Math.PI * x2));
}

/** {{docDecode}} */
function decodeBits(bits, k, a, b) {
  return [0, k].map((start) => {
    const z = bits.slice(start, start + k).reduce((acc, bit) => acc * 2 + bit, 0);
    return a + z * (b - a) / (2 ** k - 1);
  });
}

/** {{docPop}} */
function evaluatePopulation(population, fitness) {
  return { values: population.map((x) => fitness(x)), evaluations: population.length };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { knapsackFitness, assignmentMakespan, matrixFitness, tourLength, himmelblau, rastrigin, decodeBits, evaluatePopulation };
  if (require.main === module) {
    // {{example}}
    console.log(knapsackFitness([3, 4, 5], [4, 5, 6], 8, [1, 1, 1]));   // 15 - 1 * 4 = 11
    console.log(matrixFitness([[2, 3], [4, 1]], [[1, 1], [0, 0]]));     // 3 + 1 * 2 = 5
    console.log(tourLength([[0, 0], [3, 0], [3, 4]], [1, 2, 3]));       // 3 + 4 + 5 = 12
    console.log(decodeBits([1, 1, 1, 0, 0, 0], 3, -5, 5));              // [ 5, -5 ]
    console.log(evaluatePopulation([[3, 2], [0, 0]], (p) => himmelblau(...p)));   // { values: [ 0, 170 ], evaluations: 2 }
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Del genotipo a la aptitud en los cuatro problemas de representation-ga: mochila, asignación (vector de enteros y matriz binaria), viajante y función 2D (vector de reales y cadena binaria).',
      ref: 'Referencias: Talbi, E.-G. (2009), §1.4.2 y §1.5.2; Bautista-Valhondo, J. (2020); Michalewicz, Z. (1996).',
      docKnapsack: 'Mochila 0/1 (se maximiza): el valor si cabe; si no, el valor menos la penalización lineal λ · e (o cuadrática, (λ · e)²), con e el exceso de peso.',
      docInt: 'Asignación con un vector de enteros (se minimiza): a[i] es la máquina (de 1 a m) de la tarea i; devuelve la mayor carga (makespan).',
      docMatrix: 'Asignación con una matriz binaria (se minimiza): makespan de la matriz tal cual más la penalización λ · v (o (λ · v)²), con v las infracciones.',
      violations: 'una por cada fila sin ningún 1 y una por cada 1 de más',
      docTour: 'Viajante (se minimiza): longitud del circuito cerrado; cada tramo se redondea a décimas, como en la herramienta.',
      docHimmelblau: 'Función de Himmelblau (se minimiza): cuatro mínimos globales de valor 0 en [−5, 5]².',
      docRastrigin: 'Función de Rastrigin en dos variables (se minimiza): mínimo global 0 en el origen.',
      docDecode: 'Decodifica 2k bits (los k primeros, x₁; el primero de cada grupo, el más significativo) en un punto de [a, b]²: x = a + z (b − a)/(2ᵏ − 1).',
      docPop: 'Evalúa toda la población con la función de aptitud dada: devuelve las aptitudes y el número de evaluaciones (una por individuo).',
      example: 'Ejemplos pequeños, para comprobar las cuentas a mano',
    },
    en: {
      title: 'From genotype to fitness for the four problems of representation-ga: knapsack, assignment (integer vector and binary matrix), travelling salesman and 2D function (real vector and bit string).',
      ref: 'References: Talbi, E.-G. (2009), §1.4.2 and §1.5.2; Bautista-Valhondo, J. (2020); Michalewicz, Z. (1996).',
      docKnapsack: '0/1 knapsack (maximised): the value if it fits; otherwise the value minus the linear penalty λ · e (or quadratic, (λ · e)²), where e is the excess weight.',
      docInt: 'Assignment with an integer vector (minimised): a[i] is the machine (1 to m) of task i; returns the largest load (makespan).',
      docMatrix: 'Assignment with a binary matrix (minimised): makespan of the matrix as it stands plus the penalty λ · v (or (λ · v)²), where v is the number of violations.',
      violations: 'one for each row with no 1 and one for each extra 1',
      docTour: 'Travelling salesman (minimised): length of the closed tour; each leg is rounded to one decimal place, as in the tool.',
      docHimmelblau: 'Himmelblau’s function (minimised): four global minima of value 0 in [−5, 5]².',
      docRastrigin: 'Rastrigin’s function in two variables (minimised): global minimum 0 at the origin.',
      docDecode: 'Decodes 2k bits (the first k, x₁; the first bit of each group, the most significant) into a point of [a, b]²: x = a + z (b − a)/(2ᵏ − 1).',
      docPop: 'Evaluates the whole population with the given fitness function: returns the fitness values and the number of evaluations (one per individual).',
      example: 'Small examples, to check the arithmetic by hand',
    },
  };

  const references = [
    C.ref('talbi', {
      es: 'Manual de referencia del curso. El apartado 1.4.2 define la función objetivo y la decodificación del genotipo (§1.4.2.3); el §1.4.2.6 recuerda que evaluar suele ser la parte más cara de una metaheurística, y el §1.5.2, cómo penalizar las soluciones infactibles.',
      en: 'The course’s reference textbook. Section 1.4.2 defines the objective function and the decoding of the genotype (§1.4.2.3); §1.4.2.6 points out that evaluation is usually the most expensive part of a metaheuristic, and §1.5.2 how to penalise infeasible solutions.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Dedica a los algoritmos genéticos el capítulo 8.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Chapter 8 is devoted to genetic algorithms.',
    }),
    C.ref('luke', {
      es: 'Manual libre en línea, citado en las transparencias del curso: la evaluación de la aptitud suele ser el paso más costoso y puede ser una subrutina, un simulador o un proceso externo.',
      en: 'Free online textbook, cited in the course slides: fitness evaluation is usually the most costly step and may be a subroutine, a simulator or an external process.',
    }),
    C.ref('goldberg', {
      es: 'Manual clásico de los algoritmos genéticos. En el capítulo 3 (pp. 75–76) explica por qué la aptitud debe ser una medida no negativa y cómo se obtiene a partir del objetivo.',
      en: 'Classic textbook on genetic algorithms. In Chapter 3 (pp. 75–76) it explains why fitness must be a non-negative figure of merit and how it is obtained from the objective.',
    }),
    C.ref('michalewicz', {
      es: 'Manual que trata a fondo las restricciones en los algoritmos genéticos; la mochila de representation-ga y de esta herramienta sigue sus penalizaciones lineal y cuadrática.',
      en: 'Textbook that covers constraints in genetic algorithms in depth; the knapsack of representation-ga and of this tool follows its linear and quadratic penalties.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({
    id: 'pipeline', explanation, stages, narration, pseudocode, keywords, stepLines, codeTemplates, references,
  }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).pipeline = api;
})(typeof self !== 'undefined' ? self : this);
