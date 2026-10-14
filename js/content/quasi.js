/*
 * Contenido docente de la inicialización cuasialeatoria (Halton, Sobol) y por hipercubo latino: explicación,
 * etapas, narración, pseudocódigo (según el método), código descargable y referencias.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'Una población aleatoria uniforme es uniforme en promedio, no en cada muestra. Con pocos individuos, el azar deja huecos grandes en unas zonas y amontona individuos en otras: si se divide cada eje en N franjas iguales, con N puntos al azar queda vacía, en promedio, alrededor de un tercio de ellas, porque (1 − 1/N)ᴺ ≈ 1/e ≈ 0,37. Talbi (2009, §3.1.1) llama diversificación en paralelo a las estrategias que reparten toda la población de una vez por el espacio para evitarlo.',
      'Las secuencias cuasialeatorias, o de baja discrepancia, son sucesiones deterministas de puntos que van llenando el cuadrado unidad de forma pareja: cada punto nuevo cae en los huecos que dejan los anteriores. La de Halton (1960) usa en cada coordenada el inverso radical de i en una base prima distinta (2 y 3 en el plano): se escribe i en esa base y se dan la vuelta a sus dígitos detrás de la coma. Así, en base 2, i = 1, 2, 3, 4 dan 0,5; 0,25; 0,75; 0,125: primero la mitad, luego los cuartos que faltan, luego los octavos.',
      'La de Sobol (1967) usa base 2 en todas las coordenadas. La primera es la misma que la de Halton; la segunda combina con un o exclusivo bit a bit (⊕) unos números directores vₖ, uno por cada bit de i que vale 1. Los números directores salen de un polinomio primitivo: para la segunda coordenada, x + 1, que da m = 1, 3, 5, 15, 17… y vₖ = mₖ / 2ᵏ (Joe y Kuo, 2008). La herramienta usa la versión directa, sin código Gray, que da los mismos 2ᵐ primeros puntos en otro orden. Su propiedad característica: los puntos 0, …, 2ᵐ − 1 dejan exactamente uno en cada rectángulo de área 2⁻ᵐ de lados potencias de 2. Halton y Sobol se empiezan en i = 1 porque el punto 0 es la esquina (0, 0).',
      'El muestreo por hipercubo latino (McKay, Beckman y Conover, 1979) sí es aleatorio: cada eje se divide en N estratos iguales y se sortean dos permutaciones que deciden el estrato de cada individuo en cada eje; dentro del estrato, la posición se sortea de forma uniforme. Así cada estrato de cada eje recibe exactamente un individuo, como las torres de un tablero de N × N en el que ninguna amenaza a otra. No garantiza que el plano quede bien cubierto (todos los individuos podrían caer en la diagonal), pero nunca deja una franja vacía.',
      'Para comparar, la herramienta mide tres cosas en la población cuasialeatoria y en la uniforme de la misma semilla: el mayor hueco, que es la distancia desde el punto de la caja más alejado de todos los individuos al más cercano (en diagonales de la caja; cuanto menor, mejor cubierta); cuántas de las N franjas de cada eje están ocupadas; y la distancia mínima entre dos individuos, que dice si hay individuos amontonados. Las tres mejoran en promedio, aunque no en cada caso: con N pequeño y un número de puntos que no es potencia de la base, Halton y Sobol dejan algún estrato vacío.',
      'En un algoritmo genético la ventaja es modesta y se nota sobre todo con poblaciones pequeñas y en problemas continuos de pocas dimensiones (Maaranen, Miettinen y Mäkelä, 2004; Kazimipour, Li y Qin, 2014). Halton pierde uniformidad en dimensiones altas, donde las bases son grandes, y hay que aleatorizar las secuencias si se quieren réplicas distintas: tal como están, Halton y Sobol dan siempre la misma población, sea cual sea la semilla.',
    ],
    en: [
      'A uniform random population is uniform on average, not in every sample. With few individuals, chance leaves large gaps in some regions and crowds individuals in others: if each axis is split into N equal strips, N random points leave on average about a third of them empty, because (1 − 1/N)ᴺ ≈ 1/e ≈ 0.37. Talbi (2009, §3.1.1) calls parallel diversification the strategies that spread the whole population over the space at once to avoid this.',
      'Quasi-random, or low-discrepancy, sequences are deterministic sequences of points that fill the unit square evenly: each new point falls into the gaps left by the previous ones. Halton’s (1960) uses, for each coordinate, the radical inverse of i in a different prime base (2 and 3 in the plane): i is written in that base and its digits are reversed after the point. In base 2, i = 1, 2, 3, 4 give 0.5, 0.25, 0.75, 0.125: first the half, then the missing quarters, then the eighths.',
      'Sobol’s (1967) uses base 2 in every coordinate. The first is the same as Halton’s; the second combines with a bitwise exclusive or (⊕) some direction numbers vₖ, one for each bit of i that is 1. The direction numbers come from a primitive polynomial: for the second coordinate, x + 1, which gives m = 1, 3, 5, 15, 17… and vₖ = mₖ / 2ᵏ (Joe and Kuo, 2008). The tool uses the direct version, without Gray code, which gives the same first 2ᵐ points in a different order. Its defining property: points 0, …, 2ᵐ − 1 leave exactly one point in each rectangle of area 2⁻ᵐ whose sides are powers of 2. Halton and Sobol start at i = 1 because point 0 is the corner (0, 0).',
      'Latin hypercube sampling (McKay, Beckman and Conover, 1979) is random: each axis is split into N equal strata and two permutations are drawn that decide the stratum of each individual on each axis; within the stratum, the position is drawn uniformly. Each stratum of each axis then receives exactly one individual, like rooks on an N × N board none of which attacks another. It does not guarantee that the plane is well covered (all the individuals could fall on the diagonal), but it never leaves a strip empty.',
      'To compare, the tool measures three things in the quasi-random population and in the uniform one with the same seed: the largest gap, which is the distance from the point of the box farthest from all the individuals to the nearest one (in box diagonals; the smaller, the better covered); how many of the N strips of each axis are occupied; and the minimum distance between two individuals, which tells whether some individuals are crowded together. All three improve on average, though not in every case: with small N and a number of points that is not a power of the base, Halton and Sobol leave some stratum empty.',
      'In a genetic algorithm the advantage is modest and shows mainly with small populations and continuous problems of few dimensions (Maaranen, Miettinen and Mäkelä, 2004; Kazimipour, Li and Qin, 2014). Halton loses uniformity in high dimensions, where the bases are large, and the sequences must be randomised to get different replicas: as they are, Halton and Sobol always give the same population, whatever the seed.',
    ],
  };

  const stages = {
    es: ['La caja', 'Regla', 'Primer individuo', 'Población', 'Cobertura'],
    en: ['The box', 'Rule', 'First individual', 'Population', 'Coverage'],
  };

  const narration = {
    es: {
      m_halton: 'Halton', m_sobol: 'Sobol', m_lhs: 'el hipercubo latino',
      q_space: 'Cada individuo es un punto (x₁, x₂) de la caja [{a}, {b}]². Vamos a generar N = {N} sin dejarlo todo al azar: con N puntos uniformes, queda vacía en promedio más de un tercio de las N franjas de cada eje.',
      q_space_lhs: 'Cada individuo es un punto (x₁, x₂) de la caja [{a}, {b}]². Las líneas dividen cada eje en N = {N} estratos iguales: el hipercubo latino pondrá exactamente un individuo en cada franja vertical y en cada franja horizontal.',
      q_rule_halton: 'Regla de Halton: el individuo i es u = (φ₂(i), φ₃(i)), el inverso radical de i en base 2 y en base 3: se escribe i en esa base y se dan la vuelta a sus dígitos detrás de la coma. Después, xⱼ = a + uⱼ (b − a) = {a} + uⱼ · {w}. No se sortea nada.',
      q_rule_sobol: 'Regla de Sobol: u₁ = φ₂(i), como en Halton, y u₂ = ⊕ vₖ para cada bit k de i que vale 1, con los números directores v = 1/2, 3/4, 5/8, 15/16, 17/32 (⊕ es el o exclusivo bit a bit). Después, xⱼ = {a} + uⱼ · {w}. No se sortea nada.',
      q_rule_lhs: 'Regla del hipercubo latino: dos permutaciones al azar (Fisher–Yates) dan el estrato de cada individuo en cada eje: π₁ = ({p1}) y π₂ = ({p2}). Dentro de su estrato s, cada coordenada se sortea uniforme: u = (s − 1 + v) / {N}, con v entre 0 y 1.',
      q_coord_halton: 'x{g} del individuo 1: i = {i} se escribe {digits} en base {base}; con los dígitos al revés detrás de la coma, u = 0,{rev} en base {base} = {frac} ≈ {u}. x{g} = {a} + {u} · {w} = {x}.',
      q_coord_sobol: 'x₂ del individuo 1: i = {i} = {bits} en binario. Se combinan con ⊕ los números directores de los bits que valen 1 ({terms}): u = {res} en binario = {frac} ≈ {u}. x₂ = {a} + {u} · {w} = {x}.',
      q_coord_lhs: 'x{g} del individuo 1: va al estrato π{g}(1) = {s} de {N}; dentro, v = {v}, así que u = ({s} − 1 + {v}) / {N} = {u} y x{g} = {a} + {u} · {w} = {x}.',
      first: 'Primer individuo completo: {chrom}. {q}',
      q_ind: 'Individuo {i}: u = ({u1}; {u2}), el punto {chrom}. {q} Cae en un hueco que dejaban los anteriores.',
      q_ind_lhs: 'Individuo {i}: estratos {s1} en x₁ y {s2} en x₂, el punto {chrom}. {q}',
      q_pop: 'Población completa: {N} puntos repartidos por toda la caja, sin amontonarse. Con la misma N, la secuencia da siempre estos mismos puntos.',
      q_pop_lhs: 'Población completa: cada franja vertical y cada franja horizontal tiene exactamente un individuo, como torres en un tablero de {N} × {N} que no se amenazan.',
      q_hole: 'Mayor hueco: el punto de la caja más alejado de todos los individuos está a {hq} (en diagonales de la caja) con {method} y a {hu} en la población uniforme con la misma semilla (puntos huecos). Cuanto menor, mejor cubierta está la caja.',
      q_strata: 'Estratos: de las {N} franjas de cada eje, {method} ocupa {sq1} en x₁ y {sq2} en x₂; la población uniforme, {su1} y {su2}. Con puntos al azar quedan vacías, en promedio, alrededor de un tercio.',
      q_hole_worse: 'Mayor hueco: el punto de la caja más alejado de todos los individuos está a {hq} (en diagonales de la caja) con {method} y a {hu} en la población uniforme con la misma semilla (puntos huecos). Esta vez el azar ha tenido suerte: en promedio, el hueco es menor con {method}, como muestra la página «Comparar estrategias».',
      q_dist_close: 'Distancias: la mínima entre dos individuos es {qmin} con {method} frente a {umin} en la uniforme, y la media, {qmean} frente a {umean}. Esta vez apenas hay diferencia: {method} reparte por franjas, pero no impide que dos individuos queden cerca.',
      q_dist: 'Distancias: la mínima entre dos individuos es {qmin} con {method} frente a {umin} en la uniforme, y la media, {qmean} frente a {umean}. Los individuos no se amontonan, pero la distancia media apenas cambia: lo que mejora es el reparto, no la separación típica.',
      q_end: 'Halton y Sobol son deterministas: «Sortear la población» no cambia nada, siempre salen los mismos {N} puntos. Para tener réplicas distintas hay que aleatorizarlos (por ejemplo, con un desplazamiento aleatorio). Su ventaja en un algoritmo genético es modesta y se nota sobre todo con poblaciones pequeñas y pocas variables.',
      q_end_lhs: 'El hipercubo latino es aleatorio, así que cada semilla da otra población, pero siempre con un individuo por estrato en cada eje. No garantiza que el plano quede bien cubierto (podrían caer todos en la diagonal), solo que ninguna franja queda vacía. Su ventaja en un algoritmo genético es modesta y se nota sobre todo con poblaciones pequeñas.',
    },
    en: {
      m_halton: 'Halton', m_sobol: 'Sobol', m_lhs: 'the Latin hypercube',
      q_space: 'Each individual is a point (x₁, x₂) in the box [{a}, {b}]². We are going to generate N = {N} without leaving everything to chance: with N uniform points, on average more than a third of the N strips of each axis stay empty.',
      q_space_lhs: 'Each individual is a point (x₁, x₂) in the box [{a}, {b}]². The lines split each axis into N = {N} equal strata: the Latin hypercube will put exactly one individual in each vertical strip and in each horizontal strip.',
      q_rule_halton: 'Halton’s rule: individual i is u = (φ₂(i), φ₃(i)), the radical inverse of i in base 2 and in base 3: i is written in that base and its digits are reversed after the point. Then xⱼ = a + uⱼ (b − a) = {a} + uⱼ · {w}. Nothing is drawn at random.',
      q_rule_sobol: 'Sobol’s rule: u₁ = φ₂(i), as in Halton, and u₂ = ⊕ vₖ for each bit k of i that is 1, with the direction numbers v = 1/2, 3/4, 5/8, 15/16, 17/32 (⊕ is the bitwise exclusive or). Then xⱼ = {a} + uⱼ · {w}. Nothing is drawn at random.',
      q_rule_lhs: 'Latin hypercube rule: two random permutations (Fisher–Yates) give the stratum of each individual on each axis: π₁ = ({p1}) and π₂ = ({p2}). Within its stratum s, each coordinate is drawn uniformly: u = (s − 1 + v) / {N}, with v between 0 and 1.',
      q_coord_halton: 'x{g} of individual 1: i = {i} is written {digits} in base {base}; with the digits reversed after the point, u = 0.{rev} in base {base} = {frac} ≈ {u}. x{g} = {a} + {u} · {w} = {x}.',
      q_coord_sobol: 'x₂ of individual 1: i = {i} = {bits} in binary. The direction numbers of the bits that are 1 are combined with ⊕ ({terms}): u = {res} in binary = {frac} ≈ {u}. x₂ = {a} + {u} · {w} = {x}.',
      q_coord_lhs: 'x{g} of individual 1: it goes to stratum π{g}(1) = {s} of {N}; within it, v = {v}, so u = ({s} − 1 + {v}) / {N} = {u} and x{g} = {a} + {u} · {w} = {x}.',
      first: 'First complete individual: {chrom}. {q}',
      q_ind: 'Individual {i}: u = ({u1}; {u2}), the point {chrom}. {q} It falls into a gap left by the previous ones.',
      q_ind_lhs: 'Individual {i}: strata {s1} in x₁ and {s2} in x₂, the point {chrom}. {q}',
      q_pop: 'Complete population: {N} points spread over the whole box, without crowding. With the same N, the sequence always gives these same points.',
      q_pop_lhs: 'Complete population: each vertical strip and each horizontal strip holds exactly one individual, like rooks on a {N} × {N} board that do not attack one another.',
      q_hole: 'Largest gap: the point of the box farthest from all the individuals is {hq} away (in box diagonals) with {method} and {hu} away in the uniform population with the same seed (hollow points). The smaller, the better covered the box.',
      q_strata: 'Strata: of the {N} strips of each axis, {method} occupies {sq1} in x₁ and {sq2} in x₂; the uniform population, {su1} and {su2}. With random points, about a third stay empty on average.',
      q_hole_worse: 'Largest gap: the point of the box farthest from all the individuals is {hq} away (in box diagonals) with {method} and {hu} away in the uniform population with the same seed (hollow points). This time chance has been lucky: on average, the gap is smaller with {method}, as the “Compare strategies” page shows.',
      q_dist_close: 'Distances: the minimum between two individuals is {qmin} with {method} against {umin} in the uniform population, and the mean, {qmean} against {umean}. This time there is hardly any difference: {method} spreads the points by strips, but does not stop two individuals from ending up close.',
      q_dist: 'Distances: the minimum between two individuals is {qmin} with {method} against {umin} in the uniform population, and the mean, {qmean} against {umean}. The individuals do not crowd together, but the mean distance hardly changes: what improves is the spread, not the typical separation.',
      q_end: 'Halton and Sobol are deterministic: “Draw the population” changes nothing, the same {N} points always come out. To get different replicas they must be randomised (for instance, with a random shift). Their advantage in a genetic algorithm is modest and shows mainly with small populations and few variables.',
      q_end_lhs: 'The Latin hypercube is random, so each seed gives another population, but always with one individual per stratum on each axis. It does not guarantee that the plane is well covered (they could all fall on the diagonal), only that no strip is left empty. Its advantage in a genetic algorithm is modest and shows mainly with small populations.',
    },
  };

  // ---------- Pseudocódigo ----------

  const P = {
    es: {
      sig_halton: 'INICIALIZAR_HALTON(N)', sig_sobol: 'INICIALIZAR_SOBOL(N)', sig_lhs: 'HIPERCUBO_LATINO(N)',
      pinit: 'P ← ∅',
      pfor: 'para i = 1, …, N:',
      u_halton: 'u ← (φ(i, 2), φ(i, 3))',
      u_sobol: 'u ← (φ(i, 2), ⊕ { vₖ : el bit k de i vale 1 })        // v = 1/2, 3/4, 5/8, 15/16, 17/32',
      lperm: 'π₁ ← PERMUTACIÓN_ALEATORIA(N);  π₂ ← PERMUTACIÓN_ALEATORIA(N)        // Fisher–Yates',
      u_lhs: 'para d = 1, 2:  v ← número aleatorio uniforme en [0, 1);  u_d ← (π_d[i] − 1 + v) / N',
      ux: 'x ← (a + u₁ (b − a), a + u₂ (b − a))',
      padd: 'P ← P ∪ {x}',
      pret: 'devolver P',
      rsig: 'φ(i, b)        // inverso radical: los dígitos de i en base b, al revés, detrás de la coma',
      r0: 'u ← 0;  f ← 1 / b',
      rwhile: 'mientras i > 0:',
      racc: 'u ← u + f · (i mod b)',
      rdiv: 'i ← ⌊i / b⌋;  f ← f / b',
      rret: 'devolver u',
    },
    en: {
      sig_halton: 'INITIALISE_HALTON(N)', sig_sobol: 'INITIALISE_SOBOL(N)', sig_lhs: 'LATIN_HYPERCUBE(N)',
      pinit: 'P ← ∅',
      pfor: 'for i = 1, …, N:',
      u_halton: 'u ← (φ(i, 2), φ(i, 3))',
      u_sobol: 'u ← (φ(i, 2), ⊕ { vₖ : bit k of i is 1 })        // v = 1/2, 3/4, 5/8, 15/16, 17/32',
      lperm: 'π₁ ← RANDOM_PERMUTATION(N);  π₂ ← RANDOM_PERMUTATION(N)        // Fisher–Yates',
      u_lhs: 'for d = 1, 2:  v ← uniform random number in [0, 1);  u_d ← (π_d[i] − 1 + v) / N',
      ux: 'x ← (a + u₁ (b − a), a + u₂ (b − a))',
      padd: 'P ← P ∪ {x}',
      pret: 'return P',
      rsig: 'φ(i, b)        // radical inverse: the digits of i in base b, reversed, after the point',
      r0: 'u ← 0;  f ← 1 / b',
      rwhile: 'while i > 0:',
      racc: 'u ← u + f · (i mod b)',
      rdiv: 'i ← ⌊i / b⌋;  f ← f / b',
      rret: 'return u',
    },
  };

  /** variant: método ('halton', 'sobol' o 'lhs'). */
  function pseudocode(lang, variant) {
    const T = P[lang] || P.es;
    const m = ['halton', 'sobol', 'lhs'].indexOf(variant) !== -1 ? variant : 'halton';
    const lines = [{ id: 'sig', indent: 0, text: T[`sig_${m}`] }];
    if (m === 'lhs') lines.push({ id: 'lperm', indent: 1, text: T.lperm });
    lines.push(
      { id: 'pinit', indent: 1, text: T.pinit },
      { id: 'pfor', indent: 1, text: T.pfor },
      { id: 'ucoord', indent: 2, text: T[`u_${m}`] },
      { id: 'ux', indent: 2, text: T.ux },
      { id: 'padd', indent: 2, text: T.padd },
      { id: 'pret', indent: 1, text: T.pret },
    );
    if (m !== 'lhs') {
      lines.push(
        { id: 'blank', indent: 0, text: '' },
        { id: 'rsig', indent: 0, text: T.rsig },
        { id: 'r0', indent: 1, text: T.r0 },
        { id: 'rwhile', indent: 1, text: T.rwhile },
        { id: 'racc', indent: 2, text: T.racc },
        { id: 'rdiv', indent: 2, text: T.rdiv },
        { id: 'rret', indent: 1, text: T.rret },
      );
    }
    return lines;
  }

  const keywords = { es: ['para', 'mientras', 'devolver', 'mod'], en: ['for', 'while', 'return', 'mod'] };
  const stepLines = {
    q_space: ['sig'],
    q_rule: ['sig', 'ucoord'],
    q_coord: ['ucoord', 'ux'],
    first: ['padd'],
    q_ind: ['pfor', 'ucoord', 'ux', 'padd'],
    q_pop: ['pret'],
    q_hole: ['pret'],
    q_strata: ['pret'],
    q_dist: ['pret'],
    q_end: ['pret'],
  };

  // ---------- Código descargable ----------

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'quasi_random_initialisation.py',
      template: `"""
{{title}}
{{ref}}
"""
import math
import random

SOBOL_M = [1, 3, 5, 15, 17, 51, 85, 255]  # {{dirs}}


def radical_inverse(i, base):
    """{{docRadical}}"""
    num, den = 0, 1
    while i > 0:
        num, den, i = num * base + i % base, den * base, i // base
    return num / den  # {{exact}}


def sobol_second(i):
    """{{docSobol}}"""
    bits = len(SOBOL_M)
    acc, k = 0, 0
    while i > 0:
        if i % 2:
            acc ^= SOBOL_M[k] << (bits - k - 1)  # v_k = m_k / 2^k
        i //= 2
        k += 1
    return acc / 2 ** bits


def round2(v):
    """{{docRound}}"""
    return math.floor(v * 100 + 0.5) / 100


def to_box(u, a, b):
    """{{docBox}}"""
    return round2(a + u * (b - a))


def halton_population(n, a, b):
    """{{docHalton}}"""
    return [[to_box(radical_inverse(i, 2), a, b), to_box(radical_inverse(i, 3), a, b)] for i in range(1, n + 1)]


def sobol_population(n, a, b):
    """{{docSobolPop}}"""
    return [[to_box(radical_inverse(i, 2), a, b), to_box(sobol_second(i), a, b)] for i in range(1, n + 1)]


def random_permutation(n, rand=random.random):
    """{{docPerm}}"""
    perm = list(range(1, n + 1))
    for k in range(n, 1, -1):
        j = 1 + math.floor(rand() * k)
        perm[k - 1], perm[j - 1] = perm[j - 1], perm[k - 1]
    return perm


def stratum(x, n, a, b):
    """{{docStratum}}"""
    return max(0, min(n - 1, math.floor((x - a) / (b - a) * n + 1e-9)))


def latin_hypercube(n, a, b, rand=random.random):
    """{{docLhs}}"""
    perms = [random_permutation(n, rand), random_permutation(n, rand)]
    pop = []
    for i in range(n):
        point = []
        for d in range(2):
            s = perms[d][i]
            x = to_box((s - 1 + rand()) / n, a, b)
            while stratum(x, n, a, b) < s - 1:  # {{nudge}}
                x = round2(x + 0.01)
            while stratum(x, n, a, b) > s - 1:
                x = round2(x - 0.01)
            point.append(x)
        pop.append(point)
    return pop


if __name__ == "__main__":
    # {{example}}
    print([radical_inverse(i, 2) for i in range(1, 5)])  # [0.5, 0.25, 0.75, 0.125]
    print([sobol_second(i) for i in range(1, 5)])        # [0.5, 0.75, 0.25, 0.625]
    print(halton_population(3, -5, 5))                  # [[0.0, -1.67], [-2.5, 1.67], [2.5, -3.89]]
    print(latin_hypercube(4, 0, 1))
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'quasiRandomInitialisation.js',
      template: `/**
 * {{title}}
 * {{ref}}
 */

const SOBOL_M = [1, 3, 5, 15, 17, 51, 85, 255];   // {{dirs}}

/** {{docRadical}} */
function radicalInverse(i, base) {
  let num = 0;
  let den = 1;
  for (; i > 0; i = Math.floor(i / base)) {
    num = num * base + (i % base);
    den *= base;
  }
  return num / den;   // {{exact}}
}

/** {{docSobol}} */
function sobolSecond(i) {
  const bits = SOBOL_M.length;
  let acc = 0;
  for (let k = 0; i > 0; k++, i = Math.floor(i / 2)) {
    if (i % 2) acc ^= SOBOL_M[k] << (bits - k - 1);   // v_k = m_k / 2^k
  }
  return acc / 2 ** bits;
}

/** {{docRound}} */
function round2(v) {
  return Math.floor(v * 100 + 0.5) / 100;
}

/** {{docBox}} */
function toBox(u, a, b) {
  return round2(a + u * (b - a));
}

/** {{docHalton}} */
function haltonPopulation(n, a, b) {
  return Array.from({ length: n }, (_, k) => [toBox(radicalInverse(k + 1, 2), a, b), toBox(radicalInverse(k + 1, 3), a, b)]);
}

/** {{docSobolPop}} */
function sobolPopulation(n, a, b) {
  return Array.from({ length: n }, (_, k) => [toBox(radicalInverse(k + 1, 2), a, b), toBox(sobolSecond(k + 1), a, b)]);
}

/** {{docPerm}} */
function randomPermutation(n, rand = Math.random) {
  const perm = Array.from({ length: n }, (_, i) => i + 1);
  for (let k = n; k >= 2; k--) {
    const j = 1 + Math.floor(rand() * k);
    [perm[k - 1], perm[j - 1]] = [perm[j - 1], perm[k - 1]];
  }
  return perm;
}

/** {{docStratum}} */
function stratum(x, n, a, b) {
  return Math.max(0, Math.min(n - 1, Math.floor(((x - a) / (b - a)) * n + 1e-9)));
}

/** {{docLhs}} */
function latinHypercube(n, a, b, rand = Math.random) {
  const perms = [randomPermutation(n, rand), randomPermutation(n, rand)];
  const pop = [];
  for (let i = 0; i < n; i++) {
    pop.push([0, 1].map((d) => {
      const s = perms[d][i];
      let x = toBox((s - 1 + rand()) / n, a, b);
      while (stratum(x, n, a, b) < s - 1) x = round2(x + 0.01);   // {{nudge}}
      while (stratum(x, n, a, b) > s - 1) x = round2(x - 0.01);
      return x;
    }));
  }
  return pop;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { radicalInverse, sobolSecond, round2, toBox, haltonPopulation, sobolPopulation, randomPermutation, stratum, latinHypercube };
  if (require.main === module) {
    // {{example}}
    console.log([1, 2, 3, 4].map((i) => radicalInverse(i, 2)));   // [ 0.5, 0.25, 0.75, 0.125 ]
    console.log([1, 2, 3, 4].map(sobolSecond));                  // [ 0.5, 0.75, 0.25, 0.625 ]
    console.log(haltonPopulation(3, -5, 5));                     // [ [ 0, -1.67 ], [ -2.5, 1.67 ], [ 2.5, -3.89 ] ]
    console.log(latinHypercube(4, 0, 1));
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Inicialización cuasialeatoria (Halton y Sobol) y por hipercubo latino de una población de puntos en la caja [a, b]².',
      ref: 'Referencias: Halton, J. H. (1960); Sobol, I. M. (1967); Joe, S., y Kuo, F. Y. (2008); McKay, M. D., Beckman, R. J., y Conover, W. J. (1979); Talbi, E.-G. (2009), §3.1.1; Bautista-Valhondo, J. (2020).',
      dirs: 'números directores m_k de la segunda coordenada de Sobol (polinomio x + 1): m_k = 2 m_(k-1) XOR m_(k-1)',
      docRadical: 'Inverso radical de i en base b: los dígitos de i en esa base, al revés, detrás de la coma.',
      docSobol: 'Segunda coordenada del punto i de Sobol (versión directa, sin código Gray): XOR de los v_k de los bits de i a 1.',
      docRound: 'Redondeo a centésimas (la mitad, hacia arriba), como la herramienta.',
      docBox: 'Lleva u de [0, 1) a [a, b], en centésimas.',
      exact: 'fracción exacta num / b^k, como en la herramienta',
      docHalton: 'Puntos 1, …, n de Halton en bases 2 y 3, en la caja [a, b]².',
      docSobolPop: 'Puntos 1, …, n de Sobol en dos dimensiones, en la caja [a, b]².',
      docPerm: 'Permutación aleatoria de 1, …, n por Fisher–Yates.',
      docStratum: 'Estrato (0, …, n − 1) de x entre los n intervalos iguales de [a, b].',
      docLhs: 'Hipercubo latino: un individuo en cada estrato de cada eje; dentro del estrato, posición uniforme.',
      nudge: 'si el redondeo saca x de su estrato, se devuelve una centésima',
      example: 'Ejemplo pequeño, para comprobarlo a mano',
    },
    en: {
      title: 'Quasi-random (Halton and Sobol) and Latin hypercube initialisation of a population of points in the box [a, b]².',
      ref: 'References: Halton, J. H. (1960); Sobol, I. M. (1967); Joe, S., & Kuo, F. Y. (2008); McKay, M. D., Beckman, R. J., & Conover, W. J. (1979); Talbi, E.-G. (2009), §3.1.1; Bautista-Valhondo, J. (2020).',
      dirs: 'direction numbers m_k of Sobol’s second coordinate (polynomial x + 1): m_k = 2 m_(k-1) XOR m_(k-1)',
      docRadical: 'Radical inverse of i in base b: the digits of i in that base, reversed, after the point.',
      docSobol: 'Second coordinate of Sobol point i (direct version, without Gray code): XOR of the v_k of the bits of i that are 1.',
      docRound: 'Rounding to two decimal places (halves upwards), like the tool.',
      docBox: 'Maps u from [0, 1) to [a, b], to two decimal places.',
      exact: 'exact fraction num / b^k, as in the tool',
      docHalton: 'Halton points 1, …, n in bases 2 and 3, in the box [a, b]².',
      docSobolPop: 'Two-dimensional Sobol points 1, …, n, in the box [a, b]².',
      docPerm: 'Random permutation of 1, …, n by Fisher–Yates.',
      docStratum: 'Stratum (0, …, n − 1) of x among the n equal intervals of [a, b].',
      docLhs: 'Latin hypercube: one individual in each stratum of each axis; within the stratum, a uniform position.',
      nudge: 'if rounding takes x out of its stratum, it is moved back by one hundredth',
      example: 'Small example, to check by hand',
    },
  };

  const references = [
    C.ref('halton1960', {
      es: 'Origen de la secuencia de Halton: el inverso radical en una base prima distinta para cada coordenada, para integrar en varias dimensiones con menos error que con puntos al azar.',
      en: 'Origin of the Halton sequence: the radical inverse in a different prime base for each coordinate, to integrate in several dimensions with less error than with random points.',
    }, { original: true }),
    C.ref('talbi', {
      es: 'Manual de referencia del curso. El apartado 3.1.1 distingue la inicialización aleatoria, la diversificación secuencial y la diversificación en paralelo (muestreo uniforme, hipercubo latino) y las compara por diversidad, coste y calidad.',
      en: 'The course’s reference textbook. Section 3.1.1 distinguishes random initialisation, sequential diversification and parallel diversification (uniform sampling, Latin hypercube) and compares them by diversity, cost and quality.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Dedica a los algoritmos genéticos el capítulo 8.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Chapter 8 is devoted to genetic algorithms.',
    }),
    C.ref('sobol1967', {
      es: 'Origen de las secuencias de Sobol: puntos en base 2 construidos con números directores, con buena uniformidad en los intervalos elementales.',
      en: 'Origin of Sobol sequences: base-2 points built from direction numbers, with good uniformity over elementary intervals.',
    }, { original: true }),
    C.ref('joeKuo2008', {
      es: 'Números directores de Sobol muy usados hoy (los de la herramienta, para la segunda coordenada: polinomio x + 1, m₁ = 1).',
      en: 'Widely used Sobol direction numbers today (those of the tool for the second coordinate: polynomial x + 1, m₁ = 1).',
    }),
    C.ref('mckay1979', {
      es: 'Origen del muestreo por hipercubo latino, propuesto para elegir las entradas de un modelo de simulación.',
      en: 'Origin of Latin hypercube sampling, proposed to choose the inputs of a simulation model.',
    }, { original: true }),
    C.ref('maaranen2004', {
      es: 'Prueba poblaciones iniciales cuasialeatorias en un algoritmo genético: mejoran algo los resultados en problemas continuos.',
      en: 'Tests quasi-random initial populations in a genetic algorithm: they somewhat improve the results on continuous problems.',
    }),
    C.ref('kazimipour2014', {
      es: 'Revisión de las técnicas de inicialización: generadores cuasialeatorios, diseños de muestreo como el hipercubo latino y otras.',
      en: 'Review of initialisation techniques: quasi-random generators, sampling designs such as the Latin hypercube, and others.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({
    id: 'quasi', explanation, stages, narration, pseudocode, keywords, stepLines, codeTemplates, references,
  }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).quasi = api;
})(typeof self !== 'undefined' ? self : this);
