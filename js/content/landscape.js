/*
 * Contenido docente del paisaje de aptitud: explicación, etapas, narración, pseudocódigo (según la codificación),
 * código descargable y referencias.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'Un paisaje de aptitud lo forman tres cosas: el espacio de los cromosomas, una relación de vecindad (quién se puede alcanzar desde quién con un cambio pequeño) y la aptitud de cada cromosoma (Talbi, 2009, §2.2). Si se imagina cada cromosoma a una altura igual a su aptitud, aparecen valles, picos, mesetas y acantilados. La idea viene de la biología: Wright (1932) la usó para explicar cómo la mutación y la selección mueven a una población por un paisaje de genotipos.',
      'El paisaje no es una propiedad del problema solo: depende también de la representación y de la vecindad. La herramienta usa la vecindad a un gen de cada codificación: cambiar un bit, mover una tarea a otra máquina, intercambiar dos ciudades o mover una coordenada 0,1. Con la cadena binaria se ve bien: dos puntos vecinos en el plano pueden estar a varios bits de distancia, y cambiar el primer bit de una variable salta media caja.',
      'Un óptimo local es un cromosoma sin ningún vecino mejor. Una búsqueda local que siempre pasa al mejor vecino acaba en el óptimo local de la cuenca en la que empezó; si hay muchos óptimos locales (un paisaje rugoso, como la función de Rastrigin), cada punto de partida acaba en uno distinto y casi nunca en el global. La función de Himmelblau, en cambio, tiene pocas cuencas y todas llevan a un mínimo global. Un algoritmo genético se mueve por el paisaje con una población entera y con el cruce, que salta entre cuencas, pero la forma del paisaje sigue decidiendo lo difícil que es el problema.',
      'Para resumir la forma del paisaje sin dibujarlo, Jones y Forrest (1995) propusieron la correlación aptitud-distancia (FDC): la correlación entre la aptitud de muchos cromosomas y su distancia al óptimo más cercano. Con la aptitud orientada a minimizar, una correlación claramente positiva indica que acercarse al óptimo mejora la aptitud (problema guiado); cerca de cero, que la aptitud no orienta; negativa, que engaña. Su gran limitación es que hace falta conocer el óptimo, así que sirve para estudiar problemas de prueba más que para resolver uno nuevo (Talbi, 2009, §2.2.2).',
      'En la mochila y la matriz, el paisaje es el de la aptitud penalizada con λ = 1, que es lo que ve el algoritmo: su mejor cromosoma puede no ser una solución válida. En los espacios pequeños (mochila, asignación con enteros y cadena binaria, hasta 20 000 cromosomas) la herramienta los recorre enteros y cuenta los óptimos locales.',
    ],
    en: [
      'A fitness landscape is made of three things: the space of chromosomes, a neighbourhood relation (which chromosomes can be reached from which with a small change) and the fitness of each chromosome (Talbi, 2009, §2.2). If each chromosome is pictured at a height equal to its fitness, valleys, peaks, plateaus and cliffs appear. The idea comes from biology: Wright (1932) used it to explain how mutation and selection move a population across a landscape of genotypes.',
      'The landscape is not a property of the problem alone: it also depends on the representation and the neighbourhood. The tool uses the one-gene neighbourhood of each encoding: flipping a bit, moving a task to another machine, swapping two cities or moving one coordinate by 0.1. The bit string shows it well: two neighbouring points in the plane may be several bits apart, and flipping the first bit of a variable jumps half the box.',
      'A local optimum is a chromosome with no better neighbour. A local search that always moves to the best neighbour ends in the local optimum of the basin where it started; if there are many local optima (a rugged landscape, such as Rastrigin’s function), each starting point ends in a different one and hardly ever in the global one. Himmelblau’s function, by contrast, has few basins and all of them lead to a global minimum. A genetic algorithm moves across the landscape with a whole population and with crossover, which jumps between basins, but the shape of the landscape still decides how hard the problem is.',
      'To summarise the shape of a landscape without drawing it, Jones and Forrest (1995) proposed the fitness-distance correlation (FDC): the correlation between the fitness of many chromosomes and their distance to the nearest optimum. With fitness oriented towards minimisation, a clearly positive correlation means that getting closer to the optimum improves fitness (a guided problem); near zero, that fitness gives no direction; negative, that it is deceptive. Its great limitation is that the optimum has to be known, so it is useful for studying test problems rather than for solving a new one (Talbi, 2009, §2.2.2).',
      'In the knapsack and the matrix, the landscape is that of the fitness penalised with λ = 1, which is what the algorithm sees: its best chromosome may not be a valid solution. In small spaces (knapsack, integer assignment and bit strings, up to 20,000 chromosomes), the tool goes through all of them and counts the local optima.',
    ],
  };

  const stages = {
    es: ['Paisaje', 'Vecinos', 'Búsqueda local', 'Cuencas', 'Correlación'],
    en: ['Landscape', 'Neighbours', 'Local search', 'Basins', 'Correlation'],
  };

  const narration = {
    es: {
      nb_bits: 'cambiar un bit',
      nb_matrix: 'cambiar un bit de la matriz',
      nb_int: 'pasar una tarea a otra máquina',
      nb_perm: 'intercambiar dos ciudades del circuito',
      nb_real: 'subir o bajar una coordenada 0,1',
      l_space: 'Paisaje de aptitud: los cromosomas, la vecindad y la aptitud. Aquí, dos cromosomas son vecinos si se pasa de uno a otro al {nbdesc}, así que cada uno tiene {k} vecinos. La población inicial (N = {N}) son {N} puntos de partida en ese paisaje.',
      l_neigh: 'Vecinos del individuo 1, {chrom} (F = {F}). De sus {k} vecinos, mejores que él: {b}. El mejor es el de {label}, con F = {bestF}. La línea marca la aptitud de I1.',
      l_neigh_local: 'Vecinos del individuo 1, {chrom} (F = {F}): ninguno de sus {k} vecinos es mejor. I1 ya es un óptimo local.',
      l_neigh_real: 'Individuo 1, el punto ({x1}; {x2}) con F = {F}. Los cortes de la función por I1 enseñan su forma a lo largo de cada eje. De sus {k} vecinos (±0,1 en cada coordenada), mejores que él: {b}.',
      l_neigh_real_local: 'Individuo 1, el punto ({x1}; {x2}) con F = {F}. Ninguno de sus {k} vecinos (±0,1 en cada coordenada) es mejor: está en el fondo de un valle.',
      l_neigh_fbits: 'Vecinos del individuo 1, {chrom} (F = {F}). De sus {k} vecinos, mejores que él: {b}; el mejor, el de {label}, con F = {bestF}. Cambiar un bit puede saltar lejos: el vecino más alejado está a {jump} en el plano.',
      l_climb_zero: 'Búsqueda local desde el individuo 1: no da ningún paso, porque ya es un óptimo local (F = {F0}).',
      l_climb_opt: 'Búsqueda local desde el individuo 1: pasa {s} veces al mejor vecino, de F = {F0} a F = {F1}, y llega a un óptimo del problema ({opt}).',
      l_climb_local: 'Búsqueda local desde el individuo 1: pasa {s} veces al mejor vecino, de F = {F0} a F = {F1}, y se queda en un óptimo local: ningún vecino es mejor, pero el óptimo del problema es {opt}.',
      l_pop: 'Búsqueda local desde cada individuo de la población: acaban en {d} óptimos locales distintos y solo {r} de los {N} llegan a un óptimo del problema. De media, {mean} pasos. Cada punto de partida tiene su cuenca.',
      l_pop_all: 'Búsqueda local desde cada individuo de la población: los {N} llegan a un óptimo del problema, a través de {d} finales distintos, en {mean} pasos de media. El paisaje está bien guiado para esta vecindad.',
      l_pop_none: 'Búsqueda local desde cada individuo de la población: acaban en {d} óptimos locales distintos y ninguno llega a un óptimo del problema. Paisaje rugoso: la búsqueda local sola no basta.',
      l_fdc_easy: 'Correlación aptitud-distancia en {n} cromosomas uniformes (los grises; los oscuros son la población): r = {r}. Positiva: cuanto más cerca del óptimo, mejor aptitud, así que la aptitud guía la búsqueda.',
      l_fdc_flat: 'Correlación aptitud-distancia en {n} cromosomas uniformes (los grises; los oscuros son la población): r = {r}. Cerca de 0: la aptitud apenas dice lo lejos que está el óptimo.',
      l_fdc_mislead: 'Correlación aptitud-distancia en {n} cromosomas uniformes (los grises; los oscuros son la población): r = {r}. Negativa: los mejores cromosomas tienden a estar lejos del óptimo; la aptitud engaña.',
      l_fdc_none: 'La correlación aptitud-distancia no está definida: todos los cromosomas de la muestra tienen la misma aptitud o la misma distancia.',
      l_end_count: 'El espacio entero tiene {s} cromosomas y {l} óptimos locales, de los que {g} tienen la mejor aptitud. Cuantos más óptimos locales, más rugoso es el paisaje y más falta hace la diversidad de la población.',
      l_end_nocount: 'Este espacio es demasiado grande (o continuo) para recorrerlo entero, pero las búsquedas desde la población y la correlación aptitud-distancia ya enseñan su forma. Cuantos más óptimos locales, más falta hace la diversidad de la población.',
    },
    en: {
      nb_bits: 'flip one bit',
      nb_matrix: 'flip one bit of the matrix',
      nb_int: 'move one task to another machine',
      nb_perm: 'swap two cities of the tour',
      nb_real: 'move one coordinate up or down by 0.1',
      l_space: 'Fitness landscape: the chromosomes, the neighbourhood and the fitness. Here two chromosomes are neighbours if one becomes the other when you {nbdesc}, so each has {k} neighbours. The initial population (N = {N}) is {N} starting points in that landscape.',
      l_neigh: 'Neighbours of individual 1, {chrom} (F = {F}). Better neighbours: {b} of {k}. The best is {label}, with F = {bestF}. The line marks the fitness of I1.',
      l_neigh_local: 'Neighbours of individual 1, {chrom} (F = {F}): none of its {k} neighbours is better. I1 is already a local optimum.',
      l_neigh_real: 'Individual 1, the point ({x1}; {x2}) with F = {F}. The cross-sections of the function through I1 show its shape along each axis. Better neighbours (±0.1 in each coordinate): {b} of {k}.',
      l_neigh_real_local: 'Individual 1, the point ({x1}; {x2}) with F = {F}. None of its {k} neighbours (±0.1 in each coordinate) is better: it lies at the bottom of a valley.',
      l_neigh_fbits: 'Neighbours of individual 1, {chrom} (F = {F}). Better neighbours: {b} of {k}; the best, {label}, has F = {bestF}. Flipping one bit may jump far: the most distant neighbour is {jump} away in the plane.',
      l_climb_zero: 'Local search from individual 1: it takes no step, because it is already a local optimum (F = {F0}).',
      l_climb_opt: 'Local search from individual 1: it moves {s} times to the best neighbour, from F = {F0} to F = {F1}, and reaches an optimum of the problem ({opt}).',
      l_climb_local: 'Local search from individual 1: it moves {s} times to the best neighbour, from F = {F0} to F = {F1}, and gets stuck in a local optimum: no neighbour is better, but the optimum of the problem is {opt}.',
      l_pop: 'Local search from every individual of the population: they end in {d} different local optima and only {r} of the {N} reach an optimum of the problem. On average, {mean} steps. Each starting point has its basin.',
      l_pop_all: 'Local search from every individual of the population: all {N} reach an optimum of the problem, through {d} different end points, in {mean} steps on average. The landscape is well guided for this neighbourhood.',
      l_pop_none: 'Local search from every individual of the population: they end in {d} different local optima and none reaches an optimum of the problem. A rugged landscape: local search alone is not enough.',
      l_fdc_easy: 'Fitness-distance correlation over {n} uniform chromosomes (grey; the dark ones are the population): r = {r}. Positive: the closer to the optimum, the better the fitness, so fitness guides the search.',
      l_fdc_flat: 'Fitness-distance correlation over {n} uniform chromosomes (grey; the dark ones are the population): r = {r}. Close to 0: fitness says little about how far away the optimum is.',
      l_fdc_mislead: 'Fitness-distance correlation over {n} uniform chromosomes (grey; the dark ones are the population): r = {r}. Negative: the best chromosomes tend to lie far from the optimum; fitness is deceptive.',
      l_fdc_none: 'The fitness-distance correlation is undefined: every chromosome in the sample has the same fitness or the same distance.',
      l_end_count: 'The whole space has {s} chromosomes and {l} local optima, {g} of which have the best fitness. The more local optima, the more rugged the landscape and the more the population needs diversity.',
      l_end_nocount: 'This space is too large (or continuous) to go through entirely, but the searches from the population and the fitness-distance correlation already show its shape. The more local optima, the more the population needs diversity.',
    },
  };

  // ---------- Pseudocódigo ----------

  const P = {
    es: {
      nsig: 'VECINOS(x)',
      n_bits: 'para cada gen g:  copia de x con el bit g cambiado',
      n_matrix: 'para cada posición (i, j):  copia de x con yᵢⱼ cambiado',
      n_int: 'para cada tarea i y cada máquina j ≠ xᵢ:  copia de x con xᵢ ← j',
      n_perm: 'para cada par de posiciones i < j:  copia de x con xᵢ y xⱼ intercambiados',
      n_real: 'para cada coordenada i y s = ±0,1:  copia de x con xᵢ ← xᵢ + s (si sigue en la caja)',
      lsig: 'BÚSQUEDA_LOCAL(x)',
      loop: 'repetir:',
      best: 'y ← el mejor de VECINOS(x)',
      stop: 'si F(y) no es mejor que F(x):  devolver x          // óptimo local',
      move: 'x ← y',
      fsig: 'FDC(muestra)',
      fd: 'para cada x de la muestra:  dₓ ← distancia de x al óptimo más cercano',
      fr: 'devolver correlación(F, d)                       // F orientada a minimizar',
    },
    en: {
      nsig: 'NEIGHBOURS(x)',
      n_bits: 'for each gene g:  copy of x with bit g flipped',
      n_matrix: 'for each position (i, j):  copy of x with yᵢⱼ flipped',
      n_int: 'for each task i and each machine j ≠ xᵢ:  copy of x with xᵢ ← j',
      n_perm: 'for each pair of positions i < j:  copy of x with xᵢ and xⱼ swapped',
      n_real: 'for each coordinate i and s = ±0.1:  copy of x with xᵢ ← xᵢ + s (if still in the box)',
      lsig: 'LOCAL_SEARCH(x)',
      loop: 'repeat:',
      best: 'y ← the best of NEIGHBOURS(x)',
      stop: 'if F(y) is not better than F(x):  return x       // local optimum',
      move: 'x ← y',
      fsig: 'FDC(sample)',
      fd: 'for each x in the sample:  dₓ ← distance from x to the nearest optimum',
      fr: 'return correlation(F, d)                         // F oriented to minimise',
    },
  };

  /** variant: la codificación. */
  function pseudocode(lang, variant) {
    const T = P[lang] || P.es;
    const k = variant === 'tsp-perm' ? 'perm' : variant === 'assignment-int' ? 'int' : variant === 'assignment-matrix' ? 'matrix' : variant === 'function-real' ? 'real' : 'bits';
    return [
      { id: 'nsig', indent: 0, text: T.nsig },
      { id: 'nbody', indent: 1, text: T[`n_${k}`] },
      { id: 'blank', indent: 0, text: '' },
      { id: 'lsig', indent: 0, text: T.lsig },
      { id: 'loop', indent: 1, text: T.loop },
      { id: 'best', indent: 2, text: T.best },
      { id: 'stop', indent: 2, text: T.stop },
      { id: 'move', indent: 2, text: T.move },
      { id: 'blank2', indent: 0, text: '' },
      { id: 'fsig', indent: 0, text: T.fsig },
      { id: 'fd', indent: 1, text: T.fd },
      { id: 'fr', indent: 1, text: T.fr },
    ];
  }

  const keywords = { es: ['para cada', 'repetir', 'si', 'devolver'], en: ['for each', 'repeat', 'if', 'return'] };
  const stepLines = {
    l_space: ['nsig', 'nbody'],
    l_neigh: ['nsig', 'nbody'],
    l_climb: ['lsig', 'loop', 'best', 'stop', 'move'],
    l_pop: ['lsig', 'stop'],
    l_fdc: ['fsig', 'fd', 'fr'],
    l_end: ['fr'],
  };

  // ---------- Código descargable ----------

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'fitness_landscape.py',
      template: `"""
{{title}}
{{ref}}
"""
import math


def bit_flip_neighbours(x):
    """{{docBits}}"""
    return [x[:g] + [1 - x[g]] + x[g + 1:] for g in range(len(x))]


def machine_neighbours(x, m):
    """{{docInt}}"""
    return [x[:i] + [j] + x[i + 1:] for i in range(len(x)) for j in range(1, m + 1) if j != x[i]]


def swap_neighbours(x):
    """{{docSwap}}"""
    out = []
    for i in range(len(x)):
        for j in range(i + 1, len(x)):
            y = list(x)
            y[i], y[j] = y[j], y[i]
            out.append(y)
    return out


def local_search(x, fitness, neighbours, maximise=False):
    """{{docLocal}}"""
    better = (lambda a, b: a > b) if maximise else (lambda a, b: a < b)
    path = [x]
    fx = fitness(x)
    while True:
        best, fbest = None, None
        for y in neighbours(x):
            fy = fitness(y)
            if better(fy, fx) and (best is None or better(fy, fbest)):   # {{tie}}
                best, fbest = y, fy
        if best is None:
            return path          # {{localOpt}}
        x, fx = best, fbest
        path.append(x)


def fitness_distance_correlation(fitness_values, distances, maximise=False):
    """{{docFdc}}"""
    f = [-v for v in fitness_values] if maximise else list(fitness_values)
    n = len(f)
    mf, md = sum(f) / n, sum(distances) / n
    sfd = sum((a - mf) * (b - md) for a, b in zip(f, distances))
    sff = sum((a - mf) ** 2 for a in f)
    sdd = sum((b - md) ** 2 for b in distances)
    return sfd / math.sqrt(sff * sdd) if sff > 0 and sdd > 0 else None


if __name__ == "__main__":
    # {{example}}
    onemax = lambda x: sum(x)
    print(local_search([0, 1, 0], onemax, bit_flip_neighbours, maximise=True))   # [[0, 1, 0], [1, 1, 0], [1, 1, 1]]
    print(len(swap_neighbours([1, 2, 3, 4])))                                      # 6
    print(fitness_distance_correlation([3, 2, 1], [1.0, 0.5, 0.0]))                 # 1.0
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'fitnessLandscape.js',
      template: `/**
 * {{title}}
 * {{ref}}
 */

/** {{docBits}} */
function bitFlipNeighbours(x) {
  return x.map((b, g) => x.map((v, k) => (k === g ? 1 - v : v)));
}

/** {{docInt}} */
function machineNeighbours(x, m) {
  const out = [];
  x.forEach((v, i) => { for (let j = 1; j <= m; j++) if (j !== v) out.push(x.map((w, k) => (k === i ? j : w))); });
  return out;
}

/** {{docSwap}} */
function swapNeighbours(x) {
  const out = [];
  for (let i = 0; i < x.length; i++) {
    for (let j = i + 1; j < x.length; j++) {
      const y = x.slice();
      [y[i], y[j]] = [y[j], y[i]];
      out.push(y);
    }
  }
  return out;
}

/** {{docLocal}} */
function localSearch(x, fitness, neighbours, maximise = false) {
  const better = maximise ? (a, b) => a > b : (a, b) => a < b;
  const path = [x];
  let fx = fitness(x);
  for (;;) {
    let best = null;
    let fbest = null;
    for (const y of neighbours(x)) {
      const fy = fitness(y);
      if (better(fy, fx) && (best === null || better(fy, fbest))) { best = y; fbest = fy; }   // {{tie}}
    }
    if (best === null) return path;   // {{localOpt}}
    x = best;
    fx = fbest;
    path.push(x);
  }
}

/** {{docFdc}} */
function fitnessDistanceCorrelation(fitnessValues, distances, maximise = false) {
  const f = maximise ? fitnessValues.map((v) => -v) : fitnessValues.slice();
  const n = f.length;
  const mf = f.reduce((a, b) => a + b, 0) / n;
  const md = distances.reduce((a, b) => a + b, 0) / n;
  let sfd = 0;
  let sff = 0;
  let sdd = 0;
  for (let i = 0; i < n; i++) { sfd += (f[i] - mf) * (distances[i] - md); sff += (f[i] - mf) ** 2; sdd += (distances[i] - md) ** 2; }
  return sff > 0 && sdd > 0 ? sfd / Math.sqrt(sff * sdd) : null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { bitFlipNeighbours, machineNeighbours, swapNeighbours, localSearch, fitnessDistanceCorrelation };
  if (require.main === module) {
    // {{example}}
    const onemax = (x) => x.reduce((a, b) => a + b, 0);
    console.log(localSearch([0, 1, 0], onemax, bitFlipNeighbours, true));   // [ [ 0, 1, 0 ], [ 1, 1, 0 ], [ 1, 1, 1 ] ]
    console.log(swapNeighbours([1, 2, 3, 4]).length);                      // 6
    console.log(fitnessDistanceCorrelation([3, 2, 1], [1, 0.5, 0]));        // 1
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Paisaje de aptitud: vecinos a un gen, búsqueda local de máximo descenso (o ascenso) y correlación aptitud-distancia.',
      ref: 'Referencias: Wright, S. (1932); Jones, T., y Forrest, S. (1995); Talbi, E.-G. (2009), §2.2; Bautista-Valhondo, J. (2020).',
      docBits: 'Vecinos de una cadena de bits (o de una matriz aplanada): cambiar un bit.',
      docInt: 'Vecinos de una asignación con enteros de 1 a m: una tarea pasa a otra máquina.',
      docSwap: 'Vecinos de una permutación: intercambiar dos posiciones.',
      docLocal: 'Pasa al mejor vecino mientras mejore estrictamente; devuelve el camino hasta el óptimo local.',
      tie: 'a igualdad, el primero en el orden de los vecinos',
      localOpt: 'ningún vecino es mejor: óptimo local',
      docFdc: 'Correlación de Pearson entre la aptitud (orientada a minimizar) y la distancia al óptimo más cercano.',
      example: 'Ejemplos pequeños: OneMax con tres bits, vecinos de una permutación y una correlación perfecta',
    },
    en: {
      title: 'Fitness landscape: one-gene neighbours, steepest descent (or ascent) local search and fitness-distance correlation.',
      ref: 'References: Wright, S. (1932); Jones, T., & Forrest, S. (1995); Talbi, E.-G. (2009), §2.2; Bautista-Valhondo, J. (2020).',
      docBits: 'Neighbours of a bit string (or of a flattened matrix): flip one bit.',
      docInt: 'Neighbours of an assignment with integers from 1 to m: one task moves to another machine.',
      docSwap: 'Neighbours of a permutation: swap two positions.',
      docLocal: 'Moves to the best neighbour while it strictly improves; returns the path to the local optimum.',
      tie: 'ties: the first one in the order of the neighbours',
      localOpt: 'no neighbour is better: local optimum',
      docFdc: 'Pearson correlation between fitness (oriented to minimise) and the distance to the nearest optimum.',
      example: 'Small examples: OneMax with three bits, neighbours of a permutation and a perfect correlation',
    },
  };

  const references = [
    C.ref('wright1932', {
      es: 'Origen de la metáfora del paisaje: el genotipo como lugar y la aptitud como altura, con la población moviéndose por picos y valles.',
      en: 'Origin of the landscape metaphor: the genotype as a place and fitness as height, with the population moving across peaks and valleys.',
    }, { original: true }),
    C.ref('talbi', {
      es: 'Manual de referencia del curso. El apartado 2.2 define el paisaje de aptitud como el espacio de búsqueda con su vecindad más la función objetivo, y presenta las medidas de distribución y de correlación, entre ellas la FDC.',
      en: 'The course’s reference textbook. Section 2.2 defines the fitness landscape as the search space with its neighbourhood plus the objective function, and presents the distribution and correlation measures, the FDC among them.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Dedica a los algoritmos genéticos el capítulo 8.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Chapter 8 is devoted to genetic algorithms.',
    }),
    C.ref('jonesForrest1995', {
      es: 'Propuesta de la correlación aptitud-distancia como medida de la dificultad de un problema para los algoritmos genéticos.',
      en: 'Proposal of the fitness-distance correlation as a measure of how hard a problem is for genetic algorithms.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({
    id: 'landscape', explanation, stages, narration, pseudocode, keywords, stepLines, codeTemplates, references,
  }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).landscape = api;
})(typeof self !== 'undefined' ? self : this);
