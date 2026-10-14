/*
 * Contenido docente de «Varios objetivos»: explicación, etapas, narración, pseudocódigo, código descargable
 * y referencias.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'Muchos problemas reales tienen varios objetivos en conflicto: más valor en la mochila pesa más; repartir las tareas para acabar antes (makespan) obliga a usar máquinas más lentas y sube el tiempo total. Ya no hay una solución mejor que todas, sino un conjunto de compromisos. La herramienta usa la mochila sin capacidad, con el peso como segundo objetivo, y la asignación con el makespan y el tiempo total.',
      'La forma más sencilla de evaluar es la suma ponderada: normalizar cada objetivo y combinarlos, s = w · n₁ + (1 − w) · n₂ (Talbi, 2009, §4.4.1.1). El peso w expresa la preferencia de quien decide y convierte el problema en uno de un solo objetivo, así que todo lo visto antes sirve. Su inconveniente es que solo encuentra soluciones soportadas, las de la parte convexa del frente: hay compromisos que ningún w elige.',
      'La alternativa es la dominancia de Pareto: un individuo domina a otro si no es peor en ningún objetivo y es mejor en alguno (Talbi, 2009, §4.1). Los no dominados forman el primer frente; si se quitan, los no dominados que quedan forman el segundo, y así sucesivamente. Esta profundidad de dominancia da a cada individuo una aptitud que no depende de pesos ni de escalas; la propuso Goldberg (1989) y la usa, por ejemplo, NSGA-II (Deb, 2001).',
      'Con la dominancia, una sola ejecución del algoritmo genético puede devolver muchos compromisos a la vez, también los no soportados. A cambio hace falta mantener la diversidad a lo largo del frente, con técnicas como la distancia de hacinamiento de NSGA-II, que quedan fuera de esta herramienta. En los espacios pequeños la herramienta recorre todos los cromosomas y dibuja el frente de Pareto verdadero, para ver cuánto se acerca a él la población inicial.',
    ],
    en: [
      'Many real problems have several conflicting objectives: more value in the knapsack weighs more; sharing tasks out to finish earlier (makespan) forces the use of slower machines and raises the total time. There is no longer one solution better than all the others, but a set of trade-offs. The tool uses the knapsack without capacity, with the weight as a second objective, and the assignment with the makespan and the total time.',
      'The simplest way to evaluate is the weighted sum: normalise each objective and combine them, s = w · n₁ + (1 − w) · n₂ (Talbi, 2009, §4.4.1.1). The weight w expresses the decision maker’s preference and turns the problem into a single-objective one, so everything seen before still applies. Its drawback is that it only finds supported solutions, those on the convex part of the front: some trade-offs are chosen by no w.',
      'The alternative is Pareto dominance: an individual dominates another if it is no worse in any objective and better in at least one (Talbi, 2009, §4.1). The non-dominated individuals form the first front; if they are removed, the non-dominated ones left form the second, and so on. This dominance depth gives each individual a fitness that depends on no weights or scales; it was proposed by Goldberg (1989) and is used, for example, by NSGA-II (Deb, 2001).',
      'With dominance, a single run of a genetic algorithm can return many trade-offs at once, including the unsupported ones. In exchange, diversity has to be kept along the front, with techniques such as NSGA-II’s crowding distance, which are outside the scope of this tool. In small spaces the tool goes through every chromosome and draws the true Pareto front, to show how close the initial population gets to it.',
    ],
  };

  const stages = {
    es: ['Dos objetivos', 'Suma ponderada', 'Dominancia', 'Frentes', 'Soportados'],
    en: ['Two objectives', 'Weighted sum', 'Dominance', 'Fronts', 'Supported'],
  };

  const narration = {
    es: {
      onTrue: '{n} de ellos están en el frente verdadero',
      m_objs_knapsack: 'Dos objetivos para cada uno de los {N} individuos: el valor, que se maximiza, y el peso, que se minimiza (ahora sin capacidad). Lo mejor está arriba a la izquierda: mucho valor y poco peso. Pero más valor suele pesar más.',
      m_objs_assign: 'Dos objetivos para cada uno de los {N} individuos: el makespan y el tiempo total de proceso, los dos a minimizar. Lo mejor está abajo a la izquierda. Acabar antes obliga a repartir las tareas, aunque sea en máquinas más lentas.',
      m_weighted: 'Suma ponderada con w = {w}: s = {w} · n₁ + {w2} · n₂, con cada objetivo normalizado entre 0 (el mejor de la población) y 1 (el peor). La mejor es I{i} ({a}; {b}), con s = {s}. La línea marca todos los puntos con esa misma s.',
      m_dom_dominated: 'Dominancia: I1 ({a}; {b}) está dominado por {by} ({nby}): cada uno es al menos igual de bueno en los dos objetivos y mejor en alguno (zona verde). A su vez, I1 domina a {of} ({nof}), en la zona roja.',
      m_dom_dominated_none: 'Dominancia: I1 ({a}; {b}) está dominado por {by} ({nby}): cada uno es al menos igual de bueno en los dos objetivos y mejor en alguno (zona verde). I1 no domina a nadie: la zona roja está vacía.',
      m_dom_front_none: 'Dominancia: nadie domina a I1 ({a}; {b}) y I1 tampoco domina a nadie: las zonas verde y roja están vacías. Es un compromiso que no se puede mejorar en un objetivo sin empeorar el otro.',
      m_dom_front: 'Dominancia: nadie domina a I1 ({a}; {b}): no hay ningún individuo en la zona verde. I1 domina a {of} ({nof}), en la zona roja. Es un compromiso que no se puede mejorar en un objetivo sin empeorar el otro.',
      m_front: 'Frentes: los {k} no dominados ({f}) forman el primer frente, la línea escalonada. Quitándolos y repitiendo salen {nf} frentes en total; el número de frente es una aptitud que no necesita pesos.',
      m_front_one: 'Frentes: un solo individuo, {f}, domina a todos los demás y forma él solo el primer frente. Quitándolo y repitiendo salen {nf} frentes en total.',
      m_sweep_some: 'Al variar w de 0 a 1, la suma ponderada solo elige a {s} (anillo continuo). {u} están en el primer frente pero ningún w los elige (anillo discontinuo): son compromisos no soportados, en una parte cóncava del frente.',
      m_sweep_all: 'Al variar w de 0 a 1, la suma ponderada elige a todos los del primer frente ({s}): aquí el frente es convexo. No siempre es así: si el frente tiene partes cóncavas, algunos compromisos no los elige ningún w.',
      m_end: 'El frente de Pareto verdadero de esta instancia (línea gris) tiene {t} puntos; el primer frente de la población inicial tiene {k} y {onf}. Un algoritmo genético con aptitud por dominancia empuja la población hacia ese frente.',
      m_end_notrue: 'El espacio es demasiado grande para dibujar el frente verdadero. El primer frente de la población inicial tiene {k} individuos; un algoritmo genético con aptitud por dominancia empuja la población hacia el frente verdadero.',
    },
    en: {
      onTrue: '{n} of them lie on the true front',
      m_objs_knapsack: 'Two objectives for each of the {N} individuals: the value, which is maximised, and the weight, which is minimised (now with no capacity). The best is top left: much value and little weight. But more value usually weighs more.',
      m_objs_assign: 'Two objectives for each of the {N} individuals: the makespan and the total processing time, both minimised. The best is bottom left. Finishing earlier means spreading the tasks, even onto slower machines.',
      m_weighted: 'Weighted sum with w = {w}: s = {w} · n₁ + {w2} · n₂, with each objective normalised between 0 (the best in the population) and 1 (the worst). The best is I{i} ({a}; {b}), with s = {s}. The line marks every point with that same s.',
      m_dom_dominated: 'Dominance: I1 ({a}; {b}) is dominated by {by} ({nby}): each of them is at least as good in both objectives and better in one (green area). In turn, I1 dominates {of} ({nof}), in the red area.',
      m_dom_dominated_none: 'Dominance: I1 ({a}; {b}) is dominated by {by} ({nby}): each of them is at least as good in both objectives and better in one (green area). I1 dominates nobody: the red area is empty.',
      m_dom_front_none: 'Dominance: nobody dominates I1 ({a}; {b}) and I1 dominates nobody either: the green and red areas are empty. It is a trade-off that cannot be improved in one objective without worsening the other.',
      m_dom_front: 'Dominance: nobody dominates I1 ({a}; {b}): there is no individual in the green area. I1 dominates {of} ({nof}), in the red area. It is a trade-off that cannot be improved in one objective without worsening the other.',
      m_front: 'Fronts: the {k} non-dominated individuals ({f}) form the first front, the stepped line. Removing them and repeating gives {nf} fronts in all; the front number is a fitness that needs no weights.',
      m_front_one: 'Fronts: a single individual, {f}, dominates all the others and forms the first front on its own. Removing it and repeating gives {nf} fronts in all.',
      m_sweep_some: 'As w goes from 0 to 1, the weighted sum only picks {s} (solid ring). {u} are on the first front but no w picks them (dashed ring): they are unsupported trade-offs, on a concave part of the front.',
      m_sweep_all: 'As w goes from 0 to 1, the weighted sum picks every member of the first front ({s}): here the front is convex. It is not always so: if the front has concave parts, some trade-offs are picked by no w.',
      m_end: 'The true Pareto front of this instance (grey line) has {t} points; the first front of the initial population has {k}, and {onf}. A genetic algorithm with dominance-based fitness pushes the population towards that front.',
      m_end_notrue: 'The space is too large to draw the true front. The first front of the initial population has {k} individuals; a genetic algorithm with dominance-based fitness pushes the population towards the true front.',
    },
  };

  const P = {
    es: {
      dsig: 'DOMINA(u, v)                                   // los dos objetivos se minimizan',
      dret: 'devolver (u₁ ≤ v₁ y u₂ ≤ v₂) y (u₁ < v₁ o u₂ < v₂)',
      fsig: 'FRENTES(P)',
      k0: 'k ← 1',
      loop: 'mientras queden individuos en P:',
      front: 'frente k ← los individuos de P a los que no domina ningún otro de P',
      drop: 'quitarlos de P;  k ← k + 1',
      wsig: 'SUMA_PONDERADA(x, w)',
      wnorm: 'nᵢ ← (oᵢ(x) − mín oᵢ) / (máx oᵢ − mín oᵢ)      // en la población',
      wret: 'devolver w · n₁ + (1 − w) · n₂',
    },
    en: {
      dsig: 'DOMINATES(u, v)                                // both objectives minimised',
      dret: 'return (u₁ ≤ v₁ and u₂ ≤ v₂) and (u₁ < v₁ or u₂ < v₂)',
      fsig: 'FRONTS(P)',
      k0: 'k ← 1',
      loop: 'while individuals remain in P:',
      front: 'front k ← the individuals of P dominated by no other individual of P',
      drop: 'remove them from P;  k ← k + 1',
      wsig: 'WEIGHTED_SUM(x, w)',
      wnorm: 'nᵢ ← (oᵢ(x) − min oᵢ) / (max oᵢ − min oᵢ)      // over the population',
      wret: 'return w · n₁ + (1 − w) · n₂',
    },
  };
  function pseudocode(lang) {
    const T = P[lang] || P.es;
    return [
      { id: 'wsig', indent: 0, text: T.wsig }, { id: 'wnorm', indent: 1, text: T.wnorm }, { id: 'wret', indent: 1, text: T.wret },
      { id: 'blank', indent: 0, text: '' },
      { id: 'dsig', indent: 0, text: T.dsig }, { id: 'dret', indent: 1, text: T.dret },
      { id: 'blank2', indent: 0, text: '' },
      { id: 'fsig', indent: 0, text: T.fsig }, { id: 'k0', indent: 1, text: T.k0 }, { id: 'loop', indent: 1, text: T.loop },
      { id: 'front', indent: 2, text: T.front }, { id: 'drop', indent: 2, text: T.drop },
    ];
  }
  const keywords = { es: ['mientras', 'devolver', 'quitarlos'], en: ['while', 'return', 'remove'] };
  const stepLines = {
    m_objs: ['wsig'],
    m_weighted: ['wsig', 'wnorm', 'wret'],
    m_dom: ['dsig', 'dret'],
    m_front: ['fsig', 'k0', 'loop', 'front', 'drop'],
    m_sweep: ['wret', 'front'],
    m_end: ['front'],
  };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'multiobjective_fitness.py',
      template: `"""
{{title}}
{{ref}}
"""


def dominates(u, v):
    """{{docDom}}"""
    return all(a <= b for a, b in zip(u, v)) and any(a < b for a, b in zip(u, v))


def nondominated_fronts(objectives):
    """{{docFronts}}"""
    rank = [0] * len(objectives)
    left = list(range(len(objectives)))
    k = 0
    while left:
        k += 1
        front = [i for i in left if not any(j != i and dominates(objectives[j], objectives[i]) for j in left)]
        for i in front:
            rank[i] = k
        left = [i for i in left if rank[i] == 0]
    return rank


def weighted_sum(objectives, w):
    """{{docSum}}"""
    norm = []
    for k in range(2):
        lo = min(o[k] for o in objectives)
        hi = max(o[k] for o in objectives)
        norm.append([(o[k] - lo) / (hi - lo) if hi > lo else 0 for o in objectives])
    return [w * a + (1 - w) * b for a, b in zip(norm[0], norm[1])]


if __name__ == "__main__":
    # {{example}}
    objs = [[1, 5], [2, 2], [5, 1], [3, 4], [4, 4]]
    print(dominates(objs[1], objs[3]))              # True
    print(nondominated_fronts(objs))                # [1, 1, 1, 2, 3]
    print(weighted_sum(objs, 0.5))                  # [0.5, 0.25, 0.5, 0.625, 0.75]
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'multiobjectiveFitness.js',
      template: `/**
 * {{title}}
 * {{ref}}
 */

/** {{docDom}} */
function dominates(u, v) {
  return u.every((a, k) => a <= v[k]) && u.some((a, k) => a < v[k]);
}

/** {{docFronts}} */
function nondominatedFronts(objectives) {
  const rank = Array(objectives.length).fill(0);
  let left = objectives.map((_, i) => i);
  let k = 0;
  while (left.length) {
    k++;
    const front = left.filter((i) => !left.some((j) => j !== i && dominates(objectives[j], objectives[i])));
    front.forEach((i) => { rank[i] = k; });
    left = left.filter((i) => rank[i] === 0);
  }
  return rank;
}

/** {{docSum}} */
function weightedSum(objectives, w) {
  const norm = [0, 1].map((k) => {
    const lo = Math.min(...objectives.map((o) => o[k]));
    const hi = Math.max(...objectives.map((o) => o[k]));
    return objectives.map((o) => (hi > lo ? (o[k] - lo) / (hi - lo) : 0));
  });
  return norm[0].map((a, i) => w * a + (1 - w) * norm[1][i]);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { dominates, nondominatedFronts, weightedSum };
  if (require.main === module) {
    // {{example}}
    const objs = [[1, 5], [2, 2], [5, 1], [3, 4], [4, 4]];
    console.log(dominates(objs[1], objs[3]));     // true
    console.log(nondominatedFronts(objs));        // [ 1, 1, 1, 2, 3 ]
    console.log(weightedSum(objs, 0.5));          // [ 0.5, 0.25, 0.5, 0.625, 0.75 ]
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Varios objetivos: dominancia de Pareto, ordenación en frentes no dominados y suma ponderada normalizada (los objetivos se minimizan).',
      ref: 'Referencias: Goldberg, D. E. (1989); Deb, K. (2001); Talbi, E.-G. (2009), cap. 4; Bautista-Valhondo, J. (2020).',
      docDom: '¿Domina u a v? No es peor en ningún objetivo y es mejor en alguno (se minimiza; para maximizar, cambiar el signo).',
      docFronts: 'Número de frente de cada individuo: 1 los no dominados; se quitan y se repite.',
      docSum: 'Suma ponderada de dos objetivos normalizados entre 0 (mejor de la población) y 1 (peor).',
      example: 'Ejemplo con cinco individuos (los dos objetivos se minimizan)',
    },
    en: {
      title: 'Several objectives: Pareto dominance, sorting into non-dominated fronts and normalised weighted sum (objectives minimised).',
      ref: 'References: Goldberg, D. E. (1989); Deb, K. (2001); Talbi, E.-G. (2009), ch. 4; Bautista-Valhondo, J. (2020).',
      docDom: 'Does u dominate v? It is no worse in any objective and better in at least one (minimised; to maximise, change the sign).',
      docFronts: 'Front number of each individual: 1 for the non-dominated ones; they are removed and the process repeated.',
      docSum: 'Weighted sum of two objectives normalised between 0 (best in the population) and 1 (worst).',
      example: 'Example with five individuals (both objectives minimised)',
    },
  };

  const references = [
    C.ref('goldberg', {
      es: 'Manual clásico de los algoritmos genéticos. Propone asignar la aptitud por dominancia de Pareto, ordenando la población en frentes, en lugar de combinar los objetivos.',
      en: 'Classic textbook on genetic algorithms. It proposes assigning fitness by Pareto dominance, sorting the population into fronts, instead of combining the objectives.',
    }, { original: true }),
    C.ref('talbi', {
      es: 'Manual de referencia del curso. El capítulo 4 define la dominancia y el frente de Pareto (§4.1), la suma ponderada y su limitación a las soluciones soportadas (§4.4.1.1) y la aptitud por dominancia: rango, profundidad y cuenta (§4.4.3).',
      en: 'The course’s reference textbook. Chapter 4 defines dominance and the Pareto front (§4.1), the weighted sum and its restriction to supported solutions (§4.4.1.1) and dominance-based fitness: rank, depth and count (§4.4.3).',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Dedica a los algoritmos genéticos el capítulo 8.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Chapter 8 is devoted to genetic algorithms.',
    }),
    C.ref('deb2001', {
      es: 'Manual de referencia de la optimización multiobjetivo con algoritmos evolutivos, con la ordenación no dominada y NSGA-II.',
      en: 'Reference textbook on multi-objective optimisation with evolutionary algorithms, with non-dominated sorting and NSGA-II.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({
    id: 'multi', explanation, stages, narration, pseudocode, keywords, stepLines, codeTemplates, references,
  }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).multi = api;
})(typeof self !== 'undefined' ? self : this);
