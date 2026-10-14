/*
 * Contenido docente de «Objetivo frente a aptitud»: explicación, etapas, narración de los pasos, pseudocódigo
 * (según la transformación), código descargable y referencias.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'La selección por ruleta da a cada individuo una probabilidad proporcional a su aptitud, pᵢ = Fᵢ / Σⱼ Fⱼ. Para eso la aptitud tiene que cumplir dos condiciones: cuanto mayor, mejor, y nunca negativa. Pero muchos problemas se plantean como minimizar un coste: el makespan de la asignación, la longitud del circuito del viajante o el valor de una función. Hace falta transformar el objetivo f en una aptitud F (Goldberg, 1989, pp. 75–76).',
      'Cambiar el signo, F = −f, es lo habitual en investigación operativa para pasar de minimizar a maximizar, y conserva el orden; pero las aptitudes salen negativas y la ruleta no se puede construir. Goldberg propone F = C − f, con C el mayor coste de la población actual (o de las últimas generaciones, o un valor fijado): el peor individuo recibe F = 0 y nunca sale en la ruleta, y C cambia en cada generación. Otra opción frecuente es F = 1/(1 + f), siempre positiva si f ≥ 0; con ella, el mejor sale (1 + f del peor)/(1 + f del mejor) veces más que el peor, así que la presión depende de la escala de f: sumar una constante a f, que no cambia el problema, cambia la selección.',
      'La aptitud por rango solo usa el orden: se ordenan los individuos del peor (puesto 1) al mejor (puesto N) y F es el puesto; a igual coste, la media de los puestos. Así, el mejor sale de media 2N/(N + 1) veces en N tiradas, sea cual sea la diferencia con el segundo. Es la clasificación lineal de Baker (1985) con el valor máximo esperado 2N/(N + 1). El rango evita que un individuo extraordinario se lleve casi toda la ruleta y mantiene la presión cuando todos los costes se parecen (Mitchell, 1998).',
      'Las cuatro transformaciones conservan el orden de los individuos: una selección por torneo, que solo compara, elegiría igual con cualquiera de ellas. Con la ruleta, en cambio, reparten las probabilidades de forma muy distinta. Elegir la aptitud es elegir la presión selectiva: demasiada lleva a la convergencia prematura y demasiado poca convierte la búsqueda en un paseo al azar (Talbi, 2009, §3.3.1). La herramienta de selección de la serie compara la ruleta, el torneo y el rango con más detalle.',
      'En un problema de maximizar, como la mochila, el valor ya es una aptitud si no puede ser negativo. Si puede serlo (por ejemplo, tras restar una penalización), se suma una constante, F = u + C, con C el valor absoluto del peor (Goldberg, 1989, p. 76).',
    ],
    en: [
      'Roulette-wheel selection gives each individual a probability proportional to its fitness, pᵢ = Fᵢ / Σⱼ Fⱼ. For that, fitness must satisfy two conditions: the larger the better, and never negative. But many problems are stated as minimising a cost: the makespan of the assignment, the length of the travelling salesman’s tour or the value of a function. The objective f has to be transformed into a fitness F (Goldberg, 1989, pp. 75–76).',
      'Changing the sign, F = −f, is the usual way to turn minimisation into maximisation in operations research, and it keeps the order; but the fitness values come out negative and the wheel cannot be built. Goldberg proposes F = C − f, where C is the largest cost in the current population (or in the last few generations, or a fixed value): the worst individual gets F = 0 and is never drawn, and C changes from one generation to the next. Another common option is F = 1/(1 + f), always positive if f ≥ 0; with it, the best is drawn (1 + f of the worst)/(1 + f of the best) times as often as the worst, so the pressure depends on the scale of f: adding a constant to f, which does not change the problem, changes selection.',
      'Rank-based fitness uses only the order: individuals are sorted from the worst (rank 1) to the best (rank N) and F is the rank; for equal costs, the average of the ranks. The best is then drawn on average 2N/(N + 1) times in N spins, however large its lead over the second. This is Baker’s (1985) linear ranking with maximum expected value 2N/(N + 1). Ranking stops an outstanding individual from taking almost the whole wheel and keeps up the pressure when all costs are alike (Mitchell, 1998).',
      'All four transformations keep the order of the individuals: tournament selection, which only compares, would choose in the same way with any of them. With the roulette wheel, on the other hand, they share out the probabilities very differently. Choosing the fitness means choosing the selection pressure: too much leads to premature convergence and too little turns the search into a random walk (Talbi, 2009, §3.3.1). The selection tool in this series compares the roulette wheel, tournaments and ranking in more detail.',
      'In a maximisation problem, such as the knapsack, the value is already a fitness if it cannot be negative. If it can (for example, after subtracting a penalty), a constant is added, F = u + C, with C the absolute value of the worst (Goldberg, 1989, p. 76).',
    ],
  };

  const stages = {
    es: ['Objetivo', 'Transformación', 'Aptitud', 'Ruleta', 'Comparación'],
    en: ['Objective', 'Transformation', 'Fitness', 'Roulette wheel', 'Comparison'],
  };

  const narration = {
    es: {
      o_obj: 'Población evaluada: N = {N} individuos con su {what}, que se minimiza. El mejor es I{b}, con {fb}, y el peor I{w}, con {fw}. La ruleta reparte probabilidades proporcionales a la aptitud: necesita una aptitud que se maximice y no sea negativa.',
      o_rule_neg: 'Transformación F = −f: el menor coste da la mayor aptitud, como debe ser, pero todas las aptitudes son negativas (o cero).',
      o_rule_cmax: 'Transformación F = C − f, con C el mayor coste de la población, C = {C}. Todas las aptitudes son positivas salvo la del peor, que vale 0. C se recalcula en cada generación.',
      o_rule_inv: 'Transformación F = 1/(1 + f). Siempre es positiva y vale 1 solo si f = 0. La diferencia entre dos individuos depende de la escala de f.',
      o_rule_rank: 'Transformación por rango: se ordenan los individuos del peor (puesto 1) al mejor (puesto N = {N}) y F es el puesto; a igual coste, la media de los puestos. Solo importa el orden.',
      o_first_neg: 'Individuo 1: f = {f}, así que F = −{f} = {F}.',
      o_first_cmax: 'Individuo 1: f = {f}, así que F = {C} − {f} = {F}.',
      o_first_inv: 'Individuo 1: f = {f}, así que F = 1/(1 + {f}) = {F}.',
      o_first_rank: 'Individuo 1: f = {f} ocupa el puesto {F} de {N} contando desde el peor, así que F = {F}.',
      o_all_neg: 'Aptitudes de toda la población: el mejor, I{b}, tiene F = {Fb} y el peor, I{w}, F = {Fw}. El orden es el correcto, pero son números negativos.',
      o_all_cmax: 'Aptitudes de toda la población: el mejor, I{b}, tiene F = {Fb} y el peor, I{w}, F = {Fw}.',
      o_all_inv: 'Aptitudes de toda la población: el mejor, I{b}, tiene F = {Fb} y el peor, I{w}, F = {Fw}.',
      o_all_rank: 'Aptitudes de toda la población: el mejor, I{b}, tiene F = {Fb} y el peor, I{w}, F = {Fw}.',
      o_wheel: 'Ruleta: cada individuo recibe un sector de tamaño pᵢ = Fᵢ / ΣF, con ΣF = {sum}. La columna p da la probabilidad de salir en una tirada; para elegir N = {N} padres se gira N veces.',
      o_wheel_neg: 'Con aptitudes negativas, Fᵢ / ΣF no son probabilidades: la ruleta no se puede construir. F = −f sirve para un torneo o un rango, que solo comparan, pero no para la ruleta.',
      o_wheel_zero: 'Todos los individuos tienen el mismo coste, así que C − f vale 0 para todos y ΣF = 0: la ruleta no se puede construir.',
      o_best: 'El mejor, I{i} (f = {f}), tiene p = {p} %: en N = {N} tiradas saldría {c} veces de media.',
      o_best_none: 'Sin ruleta no hay probabilidades que comparar. Prueba otra transformación.',
      o_worst: 'El peor, I{i} (f = {f}), tiene p = {p} %. El mejor sale {r} veces más que él.',
      o_worst_zero: 'El peor, I{i} (f = {f}), tiene F = 0 y p = 0: con C − f nunca sale, aunque pueda llevar genes útiles.',
      o_worst_none: 'Sin ruleta no hay probabilidades que comparar.',
      o_compare: 'Mismo orden, reparto muy distinto: el mejor se lleva el {pc} % de la ruleta con C − f, el {pi} % con 1/(1 + f) y el {pr} % con el rango. Con el rango y sin empates, el mejor recibe siempre 2/(N + 1) = {prk} %, sea cual sea su ventaja.',
      o_end: 'Conclusión: elegir la aptitud es elegir la presión selectiva. C − f y 1/(1 + f) dependen de los valores del coste; el rango, solo del orden. Una selección por torneo daría lo mismo con las cuatro.',
      o_end_fn: 'Conclusión: elegir la aptitud es elegir la presión selectiva. En la función, f va de 0 a varios cientos: con 1/(1 + f), un individuo cerca de un mínimo se lleva gran parte de la ruleta. El rango, en cambio, solo mira el orden. Una selección por torneo daría lo mismo con las cuatro.',
    },
    en: {
      o_obj: 'Evaluated population: N = {N} individuals with their {what}, which is minimised. The best is I{b}, with {fb}, and the worst I{w}, with {fw}. The roulette wheel shares out probabilities in proportion to fitness: it needs a fitness that is maximised and not negative.',
      o_rule_neg: 'Transformation F = −f: the smallest cost gives the largest fitness, as it should, but every fitness value is negative (or zero).',
      o_rule_cmax: 'Transformation F = C − f, where C is the largest cost in the population, C = {C}. Every fitness value is positive except the worst’s, which is 0. C is recomputed in every generation.',
      o_rule_inv: 'Transformation F = 1/(1 + f). It is always positive and equals 1 only if f = 0. The difference between two individuals depends on the scale of f.',
      o_rule_rank: 'Rank-based transformation: individuals are sorted from the worst (rank 1) to the best (rank N = {N}) and F is the rank; for equal costs, the average of the ranks. Only the order matters.',
      o_first_neg: 'Individual 1: f = {f}, so F = −{f} = {F}.',
      o_first_cmax: 'Individual 1: f = {f}, so F = {C} − {f} = {F}.',
      o_first_inv: 'Individual 1: f = {f}, so F = 1/(1 + {f}) = {F}.',
      o_first_rank: 'Individual 1, with f = {f}, holds rank {F} of {N} counting from the worst, so F = {F}.',
      o_all_neg: 'Fitness of the whole population: the best, I{b}, has F = {Fb} and the worst, I{w}, F = {Fw}. The order is right, but the numbers are negative.',
      o_all_cmax: 'Fitness of the whole population: the best, I{b}, has F = {Fb} and the worst, I{w}, F = {Fw}.',
      o_all_inv: 'Fitness of the whole population: the best, I{b}, has F = {Fb} and the worst, I{w}, F = {Fw}.',
      o_all_rank: 'Fitness of the whole population: the best, I{b}, has F = {Fb} and the worst, I{w}, F = {Fw}.',
      o_wheel: 'Roulette wheel: each individual gets a sector of size pᵢ = Fᵢ / ΣF, with ΣF = {sum}. Column p gives the probability of being drawn in one spin; to choose N = {N} parents the wheel is spun N times.',
      o_wheel_neg: 'With negative fitness values, Fᵢ / ΣF are not probabilities: the wheel cannot be built. F = −f works for a tournament or for ranking, which only compare, but not for the roulette wheel.',
      o_wheel_zero: 'Every individual has the same cost, so C − f is 0 for all of them and ΣF = 0: the wheel cannot be built.',
      o_best: 'The best, I{i} (f = {f}), has p = {p}%: in N = {N} spins it would be drawn {c} times on average.',
      o_best_none: 'Without a wheel there are no probabilities to compare. Try another transformation.',
      o_worst: 'The worst, I{i} (f = {f}), has p = {p}%. The best is drawn {r} times as often.',
      o_worst_zero: 'The worst, I{i} (f = {f}), has F = 0 and p = 0: with C − f it is never drawn, even though it may carry useful genes.',
      o_worst_none: 'Without a wheel there are no probabilities to compare.',
      o_compare: 'Same order, very different shares: the best takes {pc}% of the wheel with C − f, {pi}% with 1/(1 + f) and {pr}% with ranking. With ranking and no ties, the best always gets 2/(N + 1) = {prk}%, whatever its lead.',
      o_end: 'Conclusion: choosing the fitness means choosing the selection pressure. C − f and 1/(1 + f) depend on the values of the cost; ranking only on the order. Tournament selection would give the same result with all four.',
      o_end_fn: 'Conclusion: choosing the fitness means choosing the selection pressure. For the function, f ranges from 0 to several hundred: with 1/(1 + f), an individual near a minimum takes a large share of the wheel. Ranking, by contrast, only looks at the order. Tournament selection would give the same result with all four.',
    },
  };

  // ---------- Pseudocódigo ----------

  const P = {
    es: {
      sig: 'APTITUD_DESDE_COSTE(f₁, …, f_N)        // f se minimiza',
      neg: 'para i = 1, …, N:  Fᵢ ← −fᵢ',
      cmax0: 'C ← máx(f₁, …, f_N)',
      cmax: 'para i = 1, …, N:  Fᵢ ← C − fᵢ',
      inv: 'para i = 1, …, N:  Fᵢ ← 1 / (1 + fᵢ)',
      rank0: 'ordenar los individuos del peor (mayor f) al mejor',
      rank: 'Fᵢ ← puesto de i (1 el peor, N el mejor; a igual f, la media de los puestos)',
      ret: 'devolver F',
      rsig: 'RULETA(F₁, …, F_N)',
      rchk: 'si algún Fᵢ < 0 o ΣF = 0: error, la ruleta no se puede construir',
      rp: 'para i = 1, …, N:  pᵢ ← Fᵢ / ΣF',
      rret: 'devolver p                              // copias esperadas en N tiradas: N · pᵢ',
    },
    en: {
      sig: 'FITNESS_FROM_COST(f₁, …, f_N)          // f is minimised',
      neg: 'for i = 1, …, N:  Fᵢ ← −fᵢ',
      cmax0: 'C ← max(f₁, …, f_N)',
      cmax: 'for i = 1, …, N:  Fᵢ ← C − fᵢ',
      inv: 'for i = 1, …, N:  Fᵢ ← 1 / (1 + fᵢ)',
      rank0: 'sort the individuals from the worst (largest f) to the best',
      rank: 'Fᵢ ← rank of i (1 the worst, N the best; for equal f, the average rank)',
      ret: 'return F',
      rsig: 'ROULETTE(F₁, …, F_N)',
      rchk: 'if some Fᵢ < 0 or ΣF = 0: error, the wheel cannot be built',
      rp: 'for i = 1, …, N:  pᵢ ← Fᵢ / ΣF',
      rret: 'return p                               // expected copies in N spins: N · pᵢ',
    },
  };

  /** variant: la transformación ('neg', 'cmax', 'inv' o 'rank'). */
  function pseudocode(lang, variant) {
    const T = P[lang] || P.es;
    const k = variant || 'cmax';
    const body = k === 'neg' ? [{ id: 'tr', indent: 1, text: T.neg }]
      : k === 'cmax' ? [{ id: 'tr0', indent: 1, text: T.cmax0 }, { id: 'tr', indent: 1, text: T.cmax }]
        : k === 'inv' ? [{ id: 'tr', indent: 1, text: T.inv }]
          : [{ id: 'tr0', indent: 1, text: T.rank0 }, { id: 'tr', indent: 1, text: T.rank }];
    return [{ id: 'sig', indent: 0, text: T.sig }].concat(body, [
      { id: 'ret', indent: 1, text: T.ret },
      { id: 'blank', indent: 0, text: '' },
      { id: 'rsig', indent: 0, text: T.rsig },
      { id: 'rchk', indent: 1, text: T.rchk },
      { id: 'rp', indent: 1, text: T.rp },
      { id: 'rret', indent: 1, text: T.rret },
    ]);
  }

  const keywords = { es: ['para', 'si', 'devolver', 'ordenar', 'error'], en: ['for', 'if', 'return', 'sort', 'error'] };
  const stepLines = {
    o_obj: ['sig'],
    o_rule: ['sig', 'tr'],
    o_first: ['tr'],
    o_all: ['tr', 'ret'],
    o_wheel: ['rsig', 'rchk', 'rp'],
    o_best: ['rp', 'rret'],
    o_worst: ['rp', 'rret'],
    o_compare: ['rret'],
    o_end: ['rret'],
  };

  // ---------- Código descargable ----------

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'cost_to_fitness.py',
      template: `"""
{{title}}
{{ref}}
"""


def negative(costs):
    """{{docNeg}}"""
    return [0 - c for c in costs]


def c_minus_f(costs):
    """{{docCmax}}"""
    c_max = max(costs)
    return [c_max - c for c in costs]


def inverse(costs):
    """{{docInv}}"""
    return [1 / (1 + c) for c in costs]


def rank_fitness(costs):
    """{{docRank}}"""
    n = len(costs)
    order = sorted(range(n), key=lambda i: (-costs[i], i))   # {{worstFirst}}
    ranks = [0] * n
    k = 0
    while k < n:
        e = k
        while e + 1 < n and costs[order[e + 1]] == costs[order[k]]:
            e += 1
        for q in range(k, e + 1):
            ranks[order[q]] = (k + 1 + e + 1) / 2
        k = e + 1
    return ranks


def roulette_probabilities(fitness):
    """{{docRoulette}}"""
    if any(f < 0 for f in fitness):
        raise ValueError("{{errNeg}}")
    total = sum(fitness)
    if total <= 0:
        raise ValueError("{{errZero}}")
    return [f / total for f in fitness]


if __name__ == "__main__":
    # {{example}}
    costs = [4, 1, 3, 1]
    print(c_minus_f(costs))                           # [0, 3, 1, 3]
    print(inverse(costs))                             # [0.2, 0.5, 0.25, 0.5]
    print(rank_fitness(costs))                        # [1.0, 3.5, 2.0, 3.5]
    print(roulette_probabilities(rank_fitness(costs)))  # [0.1, 0.35, 0.2, 0.35]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'costToFitness.js',
      template: `/**
 * {{title}}
 * {{ref}}
 */

/** {{docNeg}} */
function negative(costs) {
  return costs.map((c) => 0 - c);
}

/** {{docCmax}} */
function cMinusF(costs) {
  const cMax = Math.max(...costs);
  return costs.map((c) => cMax - c);
}

/** {{docInv}} */
function inverse(costs) {
  return costs.map((c) => 1 / (1 + c));
}

/** {{docRank}} */
function rankFitness(costs) {
  const n = costs.length;
  const order = costs.map((_, i) => i).sort((i, j) => costs[j] - costs[i] || i - j);   // {{worstFirst}}
  const ranks = Array(n).fill(0);
  for (let k = 0; k < n;) {
    let e = k;
    while (e + 1 < n && costs[order[e + 1]] === costs[order[k]]) e++;
    for (let q = k; q <= e; q++) ranks[order[q]] = (k + 1 + e + 1) / 2;
    k = e + 1;
  }
  return ranks;
}

/** {{docRoulette}} */
function rouletteProbabilities(fitness) {
  if (fitness.some((f) => f < 0)) throw new Error('{{errNeg}}');
  const total = fitness.reduce((a, b) => a + b, 0);
  if (!(total > 0)) throw new Error('{{errZero}}');
  return fitness.map((f) => f / total);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { negative, cMinusF, inverse, rankFitness, rouletteProbabilities };
  if (require.main === module) {
    // {{example}}
    const costs = [4, 1, 3, 1];
    console.log(cMinusF(costs));                              // [ 0, 3, 1, 3 ]
    console.log(inverse(costs));                              // [ 0.2, 0.5, 0.25, 0.5 ]
    console.log(rankFitness(costs));                          // [ 1, 3.5, 2, 3.5 ]
    console.log(rouletteProbabilities(rankFitness(costs)));   // [ 0.1, 0.35, 0.2, 0.35 ]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Del coste f (que se minimiza) a una aptitud F (que se maximiza) y probabilidades de la ruleta: −f, C − f, 1/(1 + f) y rango.',
      ref: 'Referencias: Goldberg, D. E. (1989), pp. 75–76; Baker, J. E. (1985); Talbi, E.-G. (2009), §3.3.1; Bautista-Valhondo, J. (2020).',
      docNeg: 'F = −f: conserva el orden, pero las aptitudes son negativas y no sirven para la ruleta.',
      docCmax: 'F = C − f con C el mayor coste de la población (Goldberg, 1989): el peor recibe 0.',
      docInv: 'F = 1 / (1 + f), para costes no negativos: siempre positiva; depende de la escala de f.',
      docRank: 'F = puesto: 1 el peor (mayor coste), N el mejor; a igual coste, la media de los puestos.',
      worstFirst: 'del peor al mejor; a igualdad, el de menor índice primero',
      docRoulette: 'Probabilidades de la ruleta, p = F / ΣF. Error si alguna aptitud es negativa o todas son 0.',
      errNeg: 'aptitud negativa: la ruleta no se puede construir',
      errZero: 'todas las aptitudes son 0: la ruleta no se puede construir',
      example: 'Ejemplo con cuatro costes y un empate',
    },
    en: {
      title: 'From a cost f (minimised) to a fitness F (maximised) and roulette-wheel probabilities: −f, C − f, 1/(1 + f) and rank.',
      ref: 'References: Goldberg, D. E. (1989), pp. 75–76; Baker, J. E. (1985); Talbi, E.-G. (2009), §3.3.1; Bautista-Valhondo, J. (2020).',
      docNeg: 'F = −f: keeps the order, but the fitness values are negative and useless for the roulette wheel.',
      docCmax: 'F = C − f with C the largest cost in the population (Goldberg, 1989): the worst gets 0.',
      docInv: 'F = 1 / (1 + f), for non-negative costs: always positive; depends on the scale of f.',
      docRank: 'F = rank: 1 the worst (largest cost), N the best; for equal costs, the average rank.',
      worstFirst: 'from the worst to the best; on ties, lower index first',
      docRoulette: 'Roulette-wheel probabilities, p = F / ΣF. Error if any fitness is negative or all are 0.',
      errNeg: 'negative fitness: the wheel cannot be built',
      errZero: 'every fitness is 0: the wheel cannot be built',
      example: 'Example with four costs and one tie',
    },
  };

  const references = [
    C.ref('goldberg', {
      es: 'Origen de la transformación F = C − f. En «Mapping objective functions to fitness form» (pp. 75–76) explica que cambiar el signo no basta, porque la aptitud debe ser no negativa, y cómo elegir C: un valor fijado, el mayor coste observado, el de la población actual o el de las últimas generaciones.',
      en: 'Origin of the transformation F = C − f. In “Mapping objective functions to fitness form” (pp. 75–76) it explains that changing the sign is not enough, because fitness must be non-negative, and how to choose C: a fixed value, the largest cost observed, that of the current population or that of the last few generations.',
    }, { original: true }),
    C.ref('talbi', {
      es: 'Manual de referencia del curso. El apartado 3.3.1 distingue la asignación de aptitud proporcional y por rango y describe la ruleta, el muestreo universal estocástico, el torneo y la selección por rango.',
      en: 'The course’s reference textbook. Section 3.3.1 distinguishes proportional from rank-based fitness assignment and describes the roulette wheel, stochastic universal sampling, tournaments and rank-based selection.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Dedica a los algoritmos genéticos el capítulo 8.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Chapter 8 is devoted to genetic algorithms.',
    }),
    C.ref('baker1985', {
      es: 'Propuesta de la selección por clasificación lineal: el número esperado de copias depende solo del puesto del individuo, no de su aptitud.',
      en: 'Proposal of linear ranking selection: the expected number of copies depends only on the individual’s rank, not on its fitness.',
    }),
    C.ref('mitchell1998', {
      es: 'Manual introductorio. En el capítulo 5 resume la selección por rango de Baker: evita que unos pocos individuos muy buenos se lleven casi toda la descendencia y mantiene la presión cuando las aptitudes se parecen.',
      en: 'Introductory textbook. Chapter 5 summarises Baker’s rank-based selection: it stops a few very fit individuals from taking almost all the offspring and keeps up the pressure when fitness values are alike.',
    }),
    C.ref('goldbergDeb1991', {
      es: 'Análisis comparado de los esquemas de selección (proporcional, por rango y por torneo) a través de su presión selectiva y su tiempo de toma de control.',
      en: 'Comparative analysis of selection schemes (proportional, ranking and tournament) through their selection pressure and takeover time.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({
    id: 'objective', explanation, stages, narration, pseudocode, keywords, stepLines, codeTemplates, references,
  }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).objective = api;
})(typeof self !== 'undefined' ? self : this);
