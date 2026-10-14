/*
 * Contenido docente de «Restricciones como penalización»: explicación, etapas, narración de los pasos,
 * pseudocódigo (según el problema y el tipo de penalización), código descargable y referencias.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'Cuando la representación puede producir soluciones que no cumplen las restricciones, hay cuatro caminos: rechazarlas, repararlas, usar un decodificador que siempre dé soluciones válidas o dejarlas en la población con una aptitud peor. Penalizar es el más usado (Talbi, 2009, §1.5.2): la aptitud de un infactible es su objetivo empeorado con un término que crece con la violación. Así, un infactible cercano al límite puede seguir aportando genes útiles. Las reparaciones y los decodificadores se ven en la herramienta de representación.',
      'La penalización necesita medir cuánto se incumple. Contar las restricciones violadas no dice si una solución está cerca de ser factible; es mejor una distancia a la factibilidad (Richardson et al., 1989; Talbi, 2009, §1.5.2). En la mochila, el exceso de peso, e = máx(0, peso − W); en la matriz de asignación, las infracciones v = Σᵢ |Σⱼ yᵢⱼ − 1|, una por cada fila sin ningún 1 y una por cada 1 de más.',
      'Con una penalización lineal, P = λ · v, cada unidad de violación cuesta lo mismo: λ unidades del objetivo. Con una cuadrática, P = (λ · v)², una violación pequeña casi no se castiga y una grande, mucho: tolera los infactibles que están cerca del límite y aparta los que están lejos. En la mochila, que se maximiza, la aptitud es F = valor − P; en la asignación, que se minimiza, F = Cmax + P, con el makespan de la matriz leída tal cual.',
      'El peso λ es la decisión difícil. Si es demasiado pequeño, un infactible puede tener mejor aptitud que todos los factibles y la búsqueda acaba en soluciones que no son válidas; si es demasiado grande, todos los infactibles quedan al fondo, la búsqueda se aleja del límite de la región factible, donde suele estar el óptimo, y puede converger a soluciones factibles mediocres (Talbi, 2009, §1.5.2). La herramienta calcula, para la población que se ve, el peso crítico λ*: con λ por encima de él, ningún infactible iguala ni mejora al mejor factible. λ* depende de la población y cambia de una generación a otra; por eso existen penalizaciones dinámicas, que crecen con el tiempo, y adaptativas, que se ajustan según cuántos infactibles aparecen.',
      'En la asignación con matriz, representation-ga da además una cota que no depende de la población: con λ ≥ máxᵢ mínⱼ pᵢⱼ, ninguna matriz penalizada mejora el óptimo, porque cada tarea que falta habría costado al menos su tiempo más rápido. Las penalizaciones más elaboradas (dinámicas, adaptativas, por niveles) se revisan en Coello Coello (2002).',
    ],
    en: [
      'When the representation can produce solutions that violate the constraints, there are four ways forward: reject them, repair them, use a decoder that always yields valid solutions, or keep them in the population with a worse fitness. Penalising is the most widely used (Talbi, 2009, §1.5.2): the fitness of an infeasible individual is its objective made worse by a term that grows with the violation. An infeasible individual close to the boundary can thus still contribute useful genes. Repairs and decoders are covered by the representation tool.',
      'The penalty needs to measure how much the constraints are violated. Counting the violated constraints does not say whether a solution is close to being feasible; a distance to feasibility is better (Richardson et al., 1989; Talbi, 2009, §1.5.2). In the knapsack, the excess weight, e = max(0, weight − W); in the assignment matrix, the violations v = Σᵢ |Σⱼ yᵢⱼ − 1|, one for each row with no 1 and one for each extra 1.',
      'With a linear penalty, P = λ · v, every unit of violation costs the same: λ units of the objective. With a quadratic one, P = (λ · v)², a small violation is barely punished and a large one heavily: it tolerates infeasible individuals close to the boundary and pushes away those far from it. In the knapsack, which is maximised, the fitness is F = value − P; in the assignment, which is minimised, F = Cmax + P, with the makespan of the matrix read as it stands.',
      'The weight λ is the hard decision. If it is too small, an infeasible individual can have a better fitness than every feasible one and the search ends up in solutions that are not valid; if it is too large, all infeasible individuals sink to the bottom, the search moves away from the boundary of the feasible region, where the optimum often lies, and it may converge to mediocre feasible solutions (Talbi, 2009, §1.5.2). For the population on screen, the tool computes the critical weight λ*: above it, no infeasible individual equals or beats the best feasible one. λ* depends on the population and changes from one generation to the next; that is why there are dynamic penalties, which grow over time, and adaptive ones, which adjust to how many infeasible individuals appear.',
      'For the assignment matrix, representation-ga also gives a bound that does not depend on the population: with λ ≥ maxᵢ minⱼ pᵢⱼ, no penalised matrix beats the optimum, because each missing task would have cost at least its fastest time. More elaborate penalties (dynamic, adaptive, multi-level) are reviewed by Coello Coello (2002).',
    ],
  };

  const stages = {
    es: ['Población', 'Violación', 'Penalización', 'Aptitud', 'El peso λ'],
    en: ['Population', 'Violation', 'Penalty', 'Fitness', 'Penalty weight λ'],
  };

  const narration = {
    es: {
      p_pop_knapsack: 'Población inicial uniforme: {f} de los {N} individuos caben en la mochila (W = {W}). El valor de los que no caben se puede calcular igual, y {over} de ellos valen más que el mejor que cabe ({bf}).',
      p_pop_knapsack_none: 'Población inicial uniforme: ninguno de los {N} individuos cabe en la mochila (W = {W}). Todos tienen un valor, pero ninguno es una solución válida.',
      p_pop_matrix: 'Población inicial uniforme: {f} de las {N} matrices son asignaciones válidas. El makespan de la matriz tal cual se puede calcular siempre: cada 1 suma su tiempo y una tarea sin unos no suma nada, así que una matriz infactible puede tener un makespan menor que el óptimo.',
      p_pop_matrix_none: 'Población inicial uniforme: ninguna de las {N} matrices es una asignación válida, como es habitual. El makespan de la matriz tal cual se puede calcular siempre: cada 1 suma su tiempo y una tarea sin unos no suma nada, así que muchas tienen un makespan menor que el óptimo.',
      p_viol_knapsack: 'Violación: el exceso de peso, e = máx(0, peso − W). Es 0 en los {f} que caben y llega a {vmax} en el que más se pasa.',
      p_viol_matrix: 'Violación: v = Σᵢ |Σⱼ yᵢⱼ − 1|, una infracción por cada fila sin ningún 1 y otra por cada 1 de más. En esta población va de {vmin} a {vmax}.',
      p_rule_knapsack_linear: 'Penalización lineal: F = valor − λ · e, con λ = {l}. Cada unidad de exceso cuesta {l} unidades de valor.',
      p_rule_knapsack_quadratic: 'Penalización cuadrática: F = valor − (λ · e)², con λ = {l}. Un exceso pequeño casi no se castiga; uno grande, mucho.',
      p_rule_matrix_linear: 'Penalización lineal: F = Cmax + λ · v, con λ = {l}. Cada infracción cuesta {l} unidades de makespan.',
      p_rule_matrix_quadratic: 'Penalización cuadrática: F = Cmax + (λ · v)², con λ = {l}. Pocas infracciones casi no se castigan; muchas, mucho.',
      p_first_none: 'Los {N} individuos cumplen las restricciones: la penalización no cambia nada en esta población.',
      p_first_knapsack_linear: 'Primer infactible, I{i}: valor {z} y exceso e = {v}. F = {z} − {l} · {v} = {F}.',
      p_first_knapsack_quadratic: 'Primer infactible, I{i}: valor {z} y exceso e = {v}. F = {z} − ({l} · {v})² = {z} − {P} = {F}.',
      p_first_matrix_linear: 'Primer infactible, I{i}: makespan tal cual {z} y v = {v} infracciones. F = {z} + {l} · {v} = {F}.',
      p_first_matrix_quadratic: 'Primer infactible, I{i}: makespan tal cual {z} y v = {v} infracciones. F = {z} + ({l} · {v})² = {z} + {P} = {F}.',
      p_fit_knapsack: 'Aptitudes de toda la población. En el panel, cada infactible baja de su valor (círculo) a su aptitud (rombo); los factibles se quedan donde estaban.',
      p_fit_matrix: 'Aptitudes de toda la población. En el panel, a cada barra del makespan tal cual se le suma, rayada, la penalización.',
      p_best_ok: 'El mejor por aptitud es I{i}, factible, con F = {F}. Con este λ, la penalización deja a todos los infactibles detrás.',
      p_best_bad_knapsack: 'El mejor por aptitud es I{i}, que no cabe en la mochila: F = {F} supera al mejor que cabe ({B}). Con λ = {l}, la penalización es demasiado pequeña: la selección preferiría una solución que no es válida.',
      p_best_bad_matrix: 'El mejor por aptitud es I{i}, que no es una asignación válida: F = {F} es menor que el mejor makespan válido ({B}). Con λ = {l}, la penalización es demasiado pequeña: la selección preferiría una solución que no es válida.',
      p_best_nofeas: 'No hay ningún factible: el mejor por aptitud es I{i}, con F = {F} y {v} de violación. λ = {l} decide cuánto pesa la violación frente al objetivo.',
      p_lambda_nofeas: 'Cada línea es la aptitud de un individuo según λ. Sin factibles no hay λ*: con λ = 0 gana I{a}, el de mejor objetivo tal cual, y con λ = {max}, I{b}, que equilibra mejor objetivo y violación.',
      p_lambda_nofeas_same: 'Cada línea es la aptitud de un individuo según λ. Sin factibles no hay λ*, y aquí gana I{a} con cualquier λ entre 0 y {max}: tiene a la vez buen objetivo tal cual y poca violación.',
      p_lambda_zero: 'Cada línea es la aptitud de un individuo según λ: horizontal si es factible e inclinada (o curva) si no. Aquí ningún infactible mejora al mejor factible ni con λ = 0, así que λ* = 0: cualquier λ > 0 basta en esta población.',
      p_lambda_above: 'Cada línea es la aptitud de un individuo según λ: horizontal si es factible e inclinada (o curva) si no. La negra gruesa marca la mejor aptitud para cada λ. Con λ por encima de λ* = {s}, el mejor es factible. Ahora λ = {l}: por encima.',
      p_lambda_below: 'Cada línea es la aptitud de un individuo según λ: horizontal si es factible e inclinada (o curva) si no. La negra gruesa marca la mejor aptitud para cada λ. Con λ por encima de λ* = {s}, el mejor es factible. Ahora λ = {l}: por debajo, así que gana un infactible.',
      p_lambda_beyond: 'Cada línea es la aptitud de un individuo según λ. Aquí λ* = {s}, más que el máximo del control ({max}): en todo el rango, algún infactible gana a los factibles.',
      p_end: 'Ni muy pequeño ni muy grande: con λ pequeño, la búsqueda acaba en soluciones infactibles; con λ muy grande, los infactibles quedan todos al fondo y se pierden los que están cerca del límite, donde suele estar el óptimo (Talbi, 2009, §1.5.2). Prueba otro λ o la penalización cuadrática.',
    },
    en: {
      p_pop_knapsack: 'Uniform initial population: {f} of the {N} individuals fit in the knapsack (W = {W}). The value of those that do not fit can still be computed, and {over} of them are worth more than the best one that fits ({bf}).',
      p_pop_knapsack_none: 'Uniform initial population: none of the {N} individuals fits in the knapsack (W = {W}). They all have a value, but none is a valid solution.',
      p_pop_matrix: 'Uniform initial population: {f} of the {N} matrices are valid assignments. The makespan of the matrix as it stands can always be computed: each 1 adds its time and a task with no 1 adds nothing, so an infeasible matrix can have a makespan below the optimum.',
      p_pop_matrix_none: 'Uniform initial population: none of the {N} matrices is a valid assignment, as is typical. The makespan of the matrix as it stands can always be computed: each 1 adds its time and a task with no 1 adds nothing, so many of them have a makespan below the optimum.',
      p_viol_knapsack: 'Violation: the excess weight, e = max(0, weight − W). It is 0 for the {f} that fit and reaches {vmax} for the one furthest over the limit.',
      p_viol_matrix: 'Violation: v = Σᵢ |Σⱼ yᵢⱼ − 1|, one violation for each row with no 1 and another for each extra 1. In this population it ranges from {vmin} to {vmax}.',
      p_rule_knapsack_linear: 'Linear penalty: F = value − λ · e, with λ = {l}. Each unit of excess costs {l} units of value.',
      p_rule_knapsack_quadratic: 'Quadratic penalty: F = value − (λ · e)², with λ = {l}. A small excess is barely punished; a large one, heavily.',
      p_rule_matrix_linear: 'Linear penalty: F = Cmax + λ · v, with λ = {l}. Each violation costs {l} units of makespan.',
      p_rule_matrix_quadratic: 'Quadratic penalty: F = Cmax + (λ · v)², with λ = {l}. A few violations are barely punished; many, heavily.',
      p_first_none: 'All {N} individuals satisfy the constraints: the penalty changes nothing in this population.',
      p_first_knapsack_linear: 'First infeasible individual, I{i}: value {z} and excess e = {v}. F = {z} − {l} · {v} = {F}.',
      p_first_knapsack_quadratic: 'First infeasible individual, I{i}: value {z} and excess e = {v}. F = {z} − ({l} · {v})² = {z} − {P} = {F}.',
      p_first_matrix_linear: 'First infeasible individual, I{i}: makespan as it stands {z} and v = {v} violations. F = {z} + {l} · {v} = {F}.',
      p_first_matrix_quadratic: 'First infeasible individual, I{i}: makespan as it stands {z} and v = {v} violations. F = {z} + ({l} · {v})² = {z} + {P} = {F}.',
      p_fit_knapsack: 'Fitness of the whole population. In the panel, each infeasible individual drops from its value (circle) to its fitness (diamond); the feasible ones stay where they were.',
      p_fit_matrix: 'Fitness of the whole population. In the panel, the penalty is added, hatched, to each bar of the makespan as it stands.',
      p_best_ok: 'The best by fitness is I{i}, feasible, with F = {F}. With this λ, the penalty leaves every infeasible individual behind.',
      p_best_bad_knapsack: 'The best by fitness is I{i}, which does not fit in the knapsack: F = {F} beats the best one that fits ({B}). With λ = {l} the penalty is too small: selection would prefer a solution that is not valid.',
      p_best_bad_matrix: 'The best by fitness is I{i}, which is not a valid assignment: F = {F} is below the best valid makespan ({B}). With λ = {l} the penalty is too small: selection would prefer a solution that is not valid.',
      p_best_nofeas: 'There is no feasible individual: the best by fitness is I{i}, with F = {F} and a violation of {v}. λ = {l} decides how much the violation weighs against the objective.',
      p_lambda_nofeas: 'Each line is the fitness of one individual as a function of λ. With no feasible individuals there is no λ*: with λ = 0 the winner is I{a}, the one with the best objective as it stands, and with λ = {max}, I{b}, which balances objective and violation better.',
      p_lambda_nofeas_same: 'Each line is the fitness of one individual as a function of λ. With no feasible individuals there is no λ*, and here I{a} wins for any λ between 0 and {max}: it has both a good objective as it stands and little violation.',
      p_lambda_zero: 'Each line is the fitness of one individual as a function of λ: flat if it is feasible and sloping (or curved) if not. Here no infeasible individual beats the best feasible one even with λ = 0, so λ* = 0: any λ > 0 will do for this population.',
      p_lambda_above: 'Each line is the fitness of one individual as a function of λ: flat if it is feasible and sloping (or curved) if not. The thick black line marks the best fitness for each λ. Above λ* = {s}, the best is feasible. Now λ = {l}: above it.',
      p_lambda_below: 'Each line is the fitness of one individual as a function of λ: flat if it is feasible and sloping (or curved) if not. The thick black line marks the best fitness for each λ. Above λ* = {s}, the best is feasible. Now λ = {l}: below it, so an infeasible individual wins.',
      p_lambda_beyond: 'Each line is the fitness of one individual as a function of λ. Here λ* = {s}, more than the maximum of the control ({max}): over the whole range, some infeasible individual beats the feasible ones.',
      p_end: 'Neither too small nor too large: with a small λ the search ends up in infeasible solutions; with a very large λ all infeasible individuals sink to the bottom and those close to the boundary, where the optimum often lies, are lost (Talbi, 2009, §1.5.2). Try another λ or the quadratic penalty.',
    },
  };

  // ---------- Pseudocódigo ----------

  const P = {
    es: {
      sig: 'APTITUD_PENALIZADA(x, λ)',
      obj_knapsack: 'z ← valor(x)',
      obj_matrix: 'z ← Cmax(x)                  // la matriz tal cual',
      viol_knapsack: 'v ← máx(0, peso(x) − W)       // exceso de peso',
      viol_matrix: 'v ← Σᵢ |Σⱼ yᵢⱼ − 1|            // infracciones',
      none: 'si v = 0: devolver z            // factible: sin penalización',
      pen_linear: 'P ← λ · v',
      pen_quadratic: 'P ← (λ · v)²',
      ret_knapsack: 'devolver z − P                 // se maximiza',
      ret_matrix: 'devolver z + P                 // se minimiza',
      csig: 'PESO_CRÍTICO(población)',
      cbest: 'B ← mejor objetivo entre los factibles (si no hay, λ* no está definido)',
      cloop: 'para cada infactible i:  λᵢ ← (cuánto mejora zᵢ a B) / vᵢ',
      cloop_quadratic: 'para cada infactible i:  λᵢ ← √(cuánto mejora zᵢ a B) / vᵢ',
      cret: 'devolver λ* = máx(0, máxᵢ λᵢ)',
    },
    en: {
      sig: 'PENALISED_FITNESS(x, λ)',
      obj_knapsack: 'z ← value(x)',
      obj_matrix: 'z ← Cmax(x)                  // the matrix as it stands',
      viol_knapsack: 'v ← max(0, weight(x) − W)     // excess weight',
      viol_matrix: 'v ← Σᵢ |Σⱼ yᵢⱼ − 1|            // violations',
      none: 'if v = 0: return z              // feasible: no penalty',
      pen_linear: 'P ← λ · v',
      pen_quadratic: 'P ← (λ · v)²',
      ret_knapsack: 'return z − P                   // maximised',
      ret_matrix: 'return z + P                   // minimised',
      csig: 'CRITICAL_WEIGHT(population)',
      cbest: 'B ← best objective among the feasible ones (if there are none, λ* is undefined)',
      cloop: 'for each infeasible i:  λᵢ ← (how much zᵢ beats B) / vᵢ',
      cloop_quadratic: 'for each infeasible i:  λᵢ ← √(how much zᵢ beats B) / vᵢ',
      cret: 'return λ* = max(0, maxᵢ λᵢ)',
    },
  };

  /** variant: '<codificación>:<tipo>', p. ej. 'knapsack-bits:linear'. */
  function pseudocode(lang, variant) {
    const T = P[lang] || P.es;
    const [enc, type] = String(variant || 'knapsack-bits:linear').split(':');
    const k = enc === 'assignment-matrix' ? 'matrix' : 'knapsack';
    const q = type === 'quadratic' ? 'quadratic' : 'linear';
    return [
      { id: 'sig', indent: 0, text: T.sig },
      { id: 'obj', indent: 1, text: T[`obj_${k}`] },
      { id: 'viol', indent: 1, text: T[`viol_${k}`] },
      { id: 'none', indent: 1, text: T.none },
      { id: 'pen', indent: 1, text: T[`pen_${q}`] },
      { id: 'ret', indent: 1, text: T[`ret_${k}`] },
      { id: 'blank', indent: 0, text: '' },
      { id: 'csig', indent: 0, text: T.csig },
      { id: 'cbest', indent: 1, text: T.cbest },
      { id: 'cloop', indent: 1, text: q === 'quadratic' ? T.cloop_quadratic : T.cloop },
      { id: 'cret', indent: 1, text: T.cret },
    ];
  }

  const keywords = { es: ['para cada', 'si', 'devolver'], en: ['for each', 'if', 'return'] };
  const stepLines = {
    p_pop: ['sig', 'obj'],
    p_viol: ['viol'],
    p_rule: ['pen', 'ret'],
    p_first: ['viol', 'pen', 'ret'],
    p_fit: ['none', 'pen', 'ret'],
    p_best: ['ret'],
    p_lambda: ['csig', 'cbest', 'cloop', 'cret'],
    p_end: ['cret'],
  };

  // ---------- Código descargable ----------

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'penalty_fitness.py',
      template: `"""
{{title}}
{{ref}}
"""
import math


def penalty(v, lam, quadratic=False):
    """{{docPenalty}}"""
    if v == 0:
        return 0
    return (lam * v) ** 2 if quadratic else lam * v


def knapsack_penalised(weights, values, capacity, x, lam, quadratic=False):
    """{{docKnapsack}}"""
    weight = sum(w for w, b in zip(weights, x) if b)
    value = sum(v for v, b in zip(values, x) if b)
    return value - penalty(max(0, weight - capacity), lam, quadratic)


def matrix_penalised(p, y, lam, quadratic=False):
    """{{docMatrix}}"""
    loads = [0] * len(p[0])
    for i, row in enumerate(y):
        for j, bit in enumerate(row):
            if bit:
                loads[j] += p[i][j]
    v = sum(abs(sum(row) - 1) for row in y)
    return max([0] + loads) + penalty(v, lam, quadratic)


def critical_lambda(objectives, violations, maximise, quadratic=False):
    """{{docCritical}}"""
    feasible = [z for z, v in zip(objectives, violations) if v == 0]
    if not feasible:
        return None
    best = max(feasible) if maximise else min(feasible)
    star = 0
    for z, v in zip(objectives, violations):
        if v == 0:
            continue
        d = max(0, z - best) if maximise else max(0, best - z)   # {{beats}}
        star = max(star, (math.sqrt(d) if quadratic else d) / v)
    return star


if __name__ == "__main__":
    # {{example}}
    print(knapsack_penalised([3, 4, 5], [4, 5, 6], 8, [1, 1, 1], 1))         # 15 - 1 * 4 = 11
    print(knapsack_penalised([3, 4, 5], [4, 5, 6], 8, [1, 1, 1], 0.5, True))  # 15 - (0.5 * 4)^2 = 11.0
    print(matrix_penalised([[2, 3], [4, 1]], [[1, 1], [0, 0]], 2))          # 3 + 2 * 2 = 7
    print(critical_lambda([15, 9, 10], [4, 0, 0], True))                    # (15 - 10) / 4 = 1.25
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'penaltyFitness.js',
      template: `/**
 * {{title}}
 * {{ref}}
 */

/** {{docPenalty}} */
function penalty(v, lambda, quadratic = false) {
  if (v === 0) return 0;
  return quadratic ? (lambda * v) * (lambda * v) : lambda * v;
}

/** {{docKnapsack}} */
function knapsackPenalised(weights, values, capacity, x, lambda, quadratic = false) {
  let weight = 0;
  let value = 0;
  x.forEach((b, i) => { if (b) { weight += weights[i]; value += values[i]; } });
  return value - penalty(Math.max(0, weight - capacity), lambda, quadratic);
}

/** {{docMatrix}} */
function matrixPenalised(p, y, lambda, quadratic = false) {
  const loads = Array(p[0].length).fill(0);
  y.forEach((row, i) => row.forEach((bit, j) => { if (bit) loads[j] += p[i][j]; }));
  const v = y.reduce((s, row) => s + Math.abs(row.reduce((a, b) => a + b, 0) - 1), 0);
  return Math.max(0, ...loads) + penalty(v, lambda, quadratic);
}

/** {{docCritical}} */
function criticalLambda(objectives, violations, maximise, quadratic = false) {
  const feasible = objectives.filter((z, i) => violations[i] === 0);
  if (!feasible.length) return null;
  const best = maximise ? Math.max(...feasible) : Math.min(...feasible);
  let star = 0;
  objectives.forEach((z, i) => {
    const v = violations[i];
    if (v === 0) return;
    const d = Math.max(0, maximise ? z - best : best - z);   // {{beats}}
    star = Math.max(star, (quadratic ? Math.sqrt(d) : d) / v);
  });
  return star;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { penalty, knapsackPenalised, matrixPenalised, criticalLambda };
  if (require.main === module) {
    // {{example}}
    console.log(knapsackPenalised([3, 4, 5], [4, 5, 6], 8, [1, 1, 1], 1));         // 15 - 1 * 4 = 11
    console.log(knapsackPenalised([3, 4, 5], [4, 5, 6], 8, [1, 1, 1], 0.5, true));  // 15 - (0.5 * 4)^2 = 11
    console.log(matrixPenalised([[2, 3], [4, 1]], [[1, 1], [0, 0]], 2));          // 3 + 2 * 2 = 7
    console.log(criticalLambda([15, 9, 10], [4, 0, 0], true));                    // (15 - 10) / 4 = 1.25
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Restricciones como penalización: aptitud penalizada (lineal o cuadrática) de la mochila y de la asignación con matriz binaria, y peso crítico λ* de una población.',
      ref: 'Referencias: Talbi, E.-G. (2009), §1.5.2; Bautista-Valhondo, J. (2020); Richardson, J. T., et al. (1989); Michalewicz, Z. (1996).',
      docPenalty: 'Término de penalización: λ · v (lineal) o (λ · v)² (cuadrática); 0 si no hay violación.',
      docKnapsack: 'Mochila (se maximiza): valor menos la penalización del exceso de peso e = máx(0, peso − W).',
      docMatrix: 'Asignación con matriz binaria (se minimiza): makespan de la matriz tal cual más la penalización de las infracciones v = Σᵢ |Σⱼ yᵢⱼ − 1|.',
      docCritical: 'Peso crítico λ*: con λ > λ*, ningún infactible iguala ni mejora al mejor factible. None si no hay factibles.',
      beats: 'cuánto mejora el objetivo de este infactible al mejor factible',
      example: 'Ejemplos pequeños, para comprobar las cuentas a mano',
    },
    en: {
      title: 'Constraints as a penalty: penalised fitness (linear or quadratic) for the knapsack and for the assignment with a binary matrix, and the critical weight λ* of a population.',
      ref: 'References: Talbi, E.-G. (2009), §1.5.2; Bautista-Valhondo, J. (2020); Richardson, J. T., et al. (1989); Michalewicz, Z. (1996).',
      docPenalty: 'Penalty term: λ · v (linear) or (λ · v)² (quadratic); 0 if there is no violation.',
      docKnapsack: 'Knapsack (maximised): value minus the penalty for the excess weight e = max(0, weight − W).',
      docMatrix: 'Assignment with a binary matrix (minimised): makespan of the matrix as it stands plus the penalty for the violations v = Σᵢ |Σⱼ yᵢⱼ − 1|.',
      docCritical: 'Critical weight λ*: with λ > λ*, no infeasible individual equals or beats the best feasible one. None if there are no feasible individuals.',
      beats: 'how much this infeasible individual’s objective beats the best feasible one',
      example: 'Small examples, to check the arithmetic by hand',
    },
  };

  const references = [
    C.ref('talbi', {
      es: 'Manual de referencia del curso. El apartado 1.5 repasa las estrategias para las restricciones (rechazar, penalizar, reparar, decodificar y preservar); el §1.5.2 trata las penalizaciones: por restricciones violadas o por distancia a la factibilidad, y estáticas, dinámicas o adaptativas.',
      en: 'The course’s reference textbook. Section 1.5 reviews the constraint-handling strategies (reject, penalise, repair, decode and preserve); §1.5.2 covers penalties: by number of violated constraints or by distance to feasibility, and static, dynamic or adaptive.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Dedica a los algoritmos genéticos el capítulo 8.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Chapter 8 is devoted to genetic algorithms.',
    }),
    C.ref('richardson', {
      es: 'Pautas para usar penalizaciones en algoritmos genéticos: las basadas en la distancia a la factibilidad funcionan mejor que las que solo cuentan las restricciones violadas.',
      en: 'Guidelines for using penalty functions in genetic algorithms: those based on the distance to feasibility work better than those that only count the violated constraints.',
    }),
    C.ref('michalewicz', {
      es: 'Manual que trata a fondo las restricciones en los algoritmos genéticos, con la mochila como ejemplo; de él sale la penalización cuadrática de la herramienta.',
      en: 'Textbook that covers constraints in genetic algorithms in depth, with the knapsack as an example; the tool’s quadratic penalty comes from it.',
    }),
    C.ref('coello', {
      es: 'Revisión de las técnicas para tratar restricciones en algoritmos evolutivos: penalizaciones estáticas, dinámicas, adaptativas y de muerte, reparaciones y decodificadores.',
      en: 'Survey of constraint-handling techniques in evolutionary algorithms: static, dynamic, adaptive and death penalties, repairs and decoders.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({
    id: 'penalty', explanation, stages, narration, pseudocode, keywords, stepLines, codeTemplates, references,
  }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).penalty = api;
})(typeof self !== 'undefined' ? self : this);
