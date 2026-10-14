/*
 * Contenido docente de la aptitud con ruido: explicación, etapas, narración, pseudocódigo, código descargable
 * y referencias.
 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./common.js') : root.GAX.contentCommon;

  const explanation = {
    es: [
      'Muchas aptitudes reales tienen ruido: dos evaluaciones del mismo individuo no dan el mismo número. Ocurre cuando la aptitud sale de una simulación estocástica, de un sensor o de un experimento, o cuando los datos del problema son inciertos (tiempos de proceso variables en una planificación, demandas aleatorias en una ruta). Talbi (2009, §1.2.1) lo escribe como F̃(x) = f(x) + z, con z un ruido que suele suponerse normal de media 0 y desviación σ. La herramienta añade ese ruido a la aptitud real de la función y del viajante.',
      'Con ruido, la selección compara números que no son la aptitud real. Si la diferencia real entre dos individuos es pequeña frente a σ, su orden aparente es casi una moneda al aire: la selección premia a veces a individuos peores y puede elegir como mejor a uno que no lo es. La herramienta cuenta los pares de individuos mal ordenados y calcula la probabilidad de equivocarse con los dos mejores, Φ(−Δ √R / (σ √2)), con Δ su diferencia real.',
      'El remedio más directo es reevaluar: la media de R evaluaciones tiene el mismo valor esperado y una desviación σ/√R. Para reducir el error a la mitad hacen falta cuatro veces más evaluaciones, así que el coste crece deprisa: N individuos con R evaluaciones cada uno son N · R evaluaciones por generación. Hay alternativas más baratas: aumentar el tamaño de la población, que promedia el ruido de forma implícita, o reevaluar solo a los individuos cuyas comparaciones están reñidas (Jin y Branke, 2005).',
      'El ruido también cambia otras decisiones. Una caché de aptitudes ya no sirve, porque guardaría para siempre una evaluación con suerte; el elitismo puede quedarse con un individuo que solo parecía bueno; y conviene evaluar la solución final varias veces antes de darla por buena. Los primeros estudios de algoritmos genéticos con ruido mostraron que, con una población grande, puede compensar evaluar cada individuo una sola vez (Fitzpatrick y Grefenstette, 1988).',
    ],
    en: [
      'Many real fitness functions are noisy: two evaluations of the same individual do not give the same number. This happens when fitness comes from a stochastic simulation, a sensor or an experiment, or when the problem data are uncertain (variable processing times in a schedule, random demands in a route). Talbi (2009, §1.2.1) writes it as F̃(x) = f(x) + z, where z is a noise usually assumed to be normal with mean 0 and standard deviation σ. The tool adds that noise to the true fitness of the function and of the travelling salesman.',
      'With noise, selection compares numbers that are not the true fitness. If the true difference between two individuals is small compared with σ, their apparent order is almost a coin toss: selection sometimes rewards worse individuals and may pick as the best one that is not. The tool counts the pairs of individuals in the wrong order and computes the probability of getting the two best wrong, Φ(−Δ √R / (σ √2)), where Δ is their true difference.',
      'The most direct remedy is to re-evaluate: the mean of R evaluations has the same expected value and a standard deviation of σ/√R. Halving the error takes four times as many evaluations, so the cost grows fast: N individuals with R evaluations each are N · R evaluations per generation. There are cheaper alternatives: increasing the population size, which averages the noise implicitly, or re-evaluating only the individuals whose comparisons are close (Jin & Branke, 2005).',
      'Noise changes other decisions too. A fitness cache no longer works, because it would keep a lucky evaluation for ever; elitism may hold on to an individual that only looked good; and the final solution should be evaluated several times before it is trusted. The first studies of genetic algorithms with noise showed that, with a large population, evaluating each individual only once can pay off (Fitzpatrick & Grefenstette, 1988).',
    ],
  };

  const stages = {
    es: ['Aptitud real', 'Una evaluación', 'Reevaluar', 'Media de R', 'Coste'],
    en: ['True fitness', 'One evaluation', 'Re-evaluate', 'Mean of R', 'Cost'],
  };

  const narration = {
    es: {
      n_true: 'Aptitud real de los {N} individuos (en la práctica no se conoce; aquí sí, para poder comparar). El mejor es I{b}, con {fb}. A partir de ahora, cada evaluación devuelve la aptitud real más un ruido normal de desviación σ = {sigma}.',
      n_one: 'Una evaluación con ruido por individuo: F̃ = f + z. Para I1, f = {f} y z = {z}, así que F̃ = {F}. Los rombos son lo que ve el algoritmo; las rayas, la aptitud real.',
      n_one_zero: 'Con σ = 0 no hay ruido: cada evaluación devuelve la aptitud real. Sube σ para ver qué cambia.',
      n_rank_ok: 'Con una evaluación, {d} de los {pairs} pares de individuos quedan mal ordenados, pero el mejor aparente sigue siendo el real, I{b}.',
      n_rank_bad: 'Con una evaluación, {d} de los {pairs} pares de individuos quedan mal ordenados, y el mejor aparente es I{bs} (aptitud real {fs}), no I{b}. La selección premiaría al equivocado.',
      n_again: 'Reevaluar al individuo 1: sus {R} evaluaciones dan {vals}. Su media es {mean} y su aptitud real, {f}. La media de R evaluaciones varía menos: su desviación es σ/√R = {sigma}/√{R} = {se}.',
      n_again_one: 'Con R = 1 cada individuo se evalúa una sola vez ({vals} para I1, cuya aptitud real es {f}). Sube R para ver cómo la media se acerca a la aptitud real.',
      n_mean: 'Media de {R} evaluaciones para cada individuo (círculos, con un intervalo de ±2σ/√R). Los pares mal ordenados bajan de {d1} a {dR} de {pairs}. El mejor según la media es I{bm}.',
      n_mean_same: 'Media de {R} evaluaciones para cada individuo (círculos, con un intervalo de ±2σ/√R). Los pares mal ordenados pasan de {d1} a {dR} de {pairs}: con tan pocas repeticiones, el ruido aún pesa. El mejor según la media es I{bm}.',
      n_cost: 'Coste: {NR} evaluaciones en lugar de {N}. Los dos mejores, I{b} e I{s}, se diferencian en {gap}: con una evaluación se ordenan mal con probabilidad {p1} %; con la media de {R}, {pR} %. Para bajar del 5 % harían falta {r95} evaluaciones por individuo.',
      n_cost_never: 'Coste: {NR} evaluaciones en lugar de {N}. Los dos mejores, I{b} e I{s}, se diferencian solo en {gap}: con una evaluación se ordenan mal con probabilidad {p1} %; con la media de {R}, {pR} %. Ni con 1000 evaluaciones bajaría del 5 %: para la selección, son igual de buenos.',
      n_cost_zero: 'Sin ruido, una evaluación basta: repetirla da el mismo número y solo gasta {NR} − {N} evaluaciones de más.',
      n_end: 'Con ruido, la aptitud es una estimación. Reevaluar la mejora a un coste que crece con R; una población más grande promedia el ruido sin repetir evaluaciones. La caché de «Coste de evaluar» no sirve: guardaría una evaluación con suerte.',
    },
    en: {
      n_true: 'True fitness of the {N} individuals (unknown in practice; known here so it can be compared). The best is I{b}, with {fb}. From now on, each evaluation returns the true fitness plus normal noise with standard deviation σ = {sigma}.',
      n_one: 'One noisy evaluation per individual: F̃ = f + z. For I1, f = {f} and z = {z}, so F̃ = {F}. The diamonds are what the algorithm sees; the ticks, the true fitness.',
      n_one_zero: 'With σ = 0 there is no noise: each evaluation returns the true fitness. Increase σ to see what changes.',
      n_rank_ok: 'With one evaluation, {d} of the {pairs} pairs of individuals are in the wrong order, but the apparent best is still the true one, I{b}.',
      n_rank_bad: 'With one evaluation, {d} of the {pairs} pairs of individuals are in the wrong order, and the apparent best is I{bs} (true fitness {fs}), not I{b}. Selection would reward the wrong one.',
      n_again: 'Re-evaluate individual 1: its {R} evaluations give {vals}. Their mean is {mean} and its true fitness, {f}. The mean of R evaluations varies less: its standard deviation is σ/√R = {sigma}/√{R} = {se}.',
      n_again_one: 'With R = 1 each individual is evaluated only once ({vals} for I1, whose true fitness is {f}). Increase R to see the mean approach the true fitness.',
      n_mean: 'Mean of {R} evaluations for each individual (circles, with an interval of ±2σ/√R). The pairs in the wrong order fall from {d1} to {dR} of {pairs}. The best according to the mean is I{bm}.',
      n_mean_same: 'Mean of {R} evaluations for each individual (circles, with an interval of ±2σ/√R). The pairs in the wrong order go from {d1} to {dR} of {pairs}: with so few repeats, noise still weighs. The best according to the mean is I{bm}.',
      n_cost: 'Cost: {NR} evaluations instead of {N}. The two best, I{b} and I{s}, differ by {gap}: with one evaluation they are ordered wrongly with probability {p1}%; with the mean of {R}, {pR}%. Getting below 5% would take {r95} evaluations per individual.',
      n_cost_never: 'Cost: {NR} evaluations instead of {N}. The two best, I{b} and I{s}, differ by only {gap}: with one evaluation they are ordered wrongly with probability {p1}%; with the mean of {R}, {pR}%. Not even 1000 evaluations would bring it below 5%: for selection, they are equally good.',
      n_cost_zero: 'Without noise one evaluation is enough: repeating it gives the same number and only wastes {NR} − {N} extra evaluations.',
      n_end: 'With noise, fitness is an estimate. Re-evaluating improves it at a cost that grows with R; a larger population averages the noise without repeating evaluations. The cache of “The cost of evaluating” does not work: it would keep a lucky evaluation.',
    },
  };

  const P = {
    es: {
      sig: 'EVALUAR_CON_RUIDO(x)',
      z: 'z ← σ · √(−2 ln(1 − u₁)) · cos(2π u₂)        // normal N(0, σ) (Box–Muller)',
      ret: 'devolver f(x) + z',
      msig: 'EVALUAR_R_VECES(x, R)',
      loop: 'para r = 1, …, R:  F̃ᵣ ← EVALUAR_CON_RUIDO(x)',
      mean: 'devolver (F̃₁ + … + F̃_R) / R                 // desviación σ / √R',
      psig: 'PROBABILIDAD_DE_EQUIVOCARSE(Δ, σ, R)',
      pret: 'devolver Φ(−Δ · √R / (σ · √2))',
    },
    en: {
      sig: 'NOISY_EVALUATION(x)',
      z: 'z ← σ · √(−2 ln(1 − u₁)) · cos(2π u₂)        // normal N(0, σ) (Box–Muller)',
      ret: 'return f(x) + z',
      msig: 'EVALUATE_R_TIMES(x, R)',
      loop: 'for r = 1, …, R:  F̃ᵣ ← NOISY_EVALUATION(x)',
      mean: 'return (F̃₁ + … + F̃_R) / R                   // standard deviation σ / √R',
      psig: 'PROBABILITY_OF_ERROR(Δ, σ, R)',
      pret: 'return Φ(−Δ · √R / (σ · √2))',
    },
  };
  function pseudocode(lang) {
    const T = P[lang] || P.es;
    return [
      { id: 'sig', indent: 0, text: T.sig }, { id: 'z', indent: 1, text: T.z }, { id: 'ret', indent: 1, text: T.ret },
      { id: 'blank', indent: 0, text: '' },
      { id: 'msig', indent: 0, text: T.msig }, { id: 'loop', indent: 1, text: T.loop }, { id: 'mean', indent: 1, text: T.mean },
      { id: 'blank2', indent: 0, text: '' },
      { id: 'psig', indent: 0, text: T.psig }, { id: 'pret', indent: 1, text: T.pret },
    ];
  }
  const keywords = { es: ['para', 'devolver'], en: ['for', 'return'] };
  const stepLines = {
    n_true: ['sig'],
    n_one: ['sig', 'z', 'ret'],
    n_rank: ['ret'],
    n_again: ['msig', 'loop'],
    n_mean: ['loop', 'mean'],
    n_cost: ['psig', 'pret'],
    n_end: ['mean'],
  };

  const codeTemplates = {
    python: {
      label: 'Python',
      filename: 'noisy_fitness.py',
      template: `"""
{{title}}
{{ref}}
"""
import math


def gaussian_noise(u1, u2, sigma):
    """{{docGauss}}"""
    z = sigma * math.sqrt(-2 * math.log(1 - u1)) * math.cos(2 * math.pi * u2)
    return math.floor(z * 100 + 0.5) / 100            # {{round}}


def noisy_mean(f, sigma, r, rand):
    """{{docMean}}"""
    total = 0
    for _ in range(r):
        u1, u2 = rand(), rand()
        total += f + gaussian_noise(u1, u2, sigma)
    return total / r


def discordant_pairs(true_values, noisy_values):
    """{{docPairs}}"""
    n = len(true_values)
    return sum(1 for i in range(n) for j in range(i + 1, n)
               if true_values[i] != true_values[j]
               and (true_values[i] - true_values[j]) * (noisy_values[i] - noisy_values[j]) < 0)


def probability_of_error(gap, sigma, r):
    """{{docProb}}"""
    x = -gap * math.sqrt(r) / (sigma * math.sqrt(2))
    return (1 + math.erf(x / math.sqrt(2))) / 2      # Φ(x)


if __name__ == "__main__":
    # {{example}}
    print(gaussian_noise(0.5, 0.0, 10))                        # 11.77
    print(discordant_pairs([1, 2, 3, 4], [1.5, 1.2, 3.1, 2.9]))  # 2
    print(round(probability_of_error(2, 10, 1), 3))            # 0.444
`,
    },
    javascript: {
      label: 'JavaScript',
      filename: 'noisyFitness.js',
      template: `/**
 * {{title}}
 * {{ref}}
 */

/** {{docGauss}} */
function gaussianNoise(u1, u2, sigma) {
  const z = sigma * Math.sqrt(-2 * Math.log(1 - u1)) * Math.cos(2 * Math.PI * u2);
  return Math.round(z * 100) / 100 + 0;          // {{round}}
}

/** {{docMean}} */
function noisyMean(f, sigma, r, rand) {
  let total = 0;
  for (let k = 0; k < r; k++) {
    const u1 = rand();
    const u2 = rand();
    total += f + gaussianNoise(u1, u2, sigma);
  }
  return total / r;
}

/** {{docPairs}} */
function discordantPairs(trueValues, noisyValues) {
  let d = 0;
  for (let i = 0; i < trueValues.length; i++) {
    for (let j = i + 1; j < trueValues.length; j++) {
      if (trueValues[i] !== trueValues[j] && (trueValues[i] - trueValues[j]) * (noisyValues[i] - noisyValues[j]) < 0) d++;
    }
  }
  return d;
}

/** Φ(x), {{docPhi}} */
function Phi(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2);
  return x >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

/** {{docProb}} */
function probabilityOfError(gap, sigma, r) {
  return Phi(-gap * Math.sqrt(r) / (sigma * Math.SQRT2));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { gaussianNoise, noisyMean, discordantPairs, Phi, probabilityOfError };
  if (require.main === module) {
    // {{example}}
    console.log(gaussianNoise(0.5, 0, 10));                          // 11.77
    console.log(discordantPairs([1, 2, 3, 4], [1.5, 1.2, 3.1, 2.9]));  // 2
    console.log(probabilityOfError(2, 10, 1).toFixed(3));            // 0.444
  }
}
`,
    },
  };

  const codeComments = {
    es: {
      title: 'Aptitud con ruido: ruido normal (Box–Muller), media de R evaluaciones, pares mal ordenados y probabilidad de equivocarse al comparar.',
      ref: 'Referencias: Talbi, E.-G. (2009), §1.2.1; Jin, Y., y Branke, J. (2005); Fitzpatrick, J. M., y Grefenstette, J. J. (1988); Bautista-Valhondo, J. (2020).',
      docGauss: 'Ruido normal de media 0 y desviación sigma a partir de dos uniformes u1, u2 en [0, 1).',
      round: 'redondeado a centésimas, como en la herramienta',
      docMean: 'Media de r evaluaciones con ruido de un individuo de aptitud real f (rand da uniformes en [0, 1)).',
      docPairs: 'Pares de individuos cuyo orden por la aptitud con ruido no es el de la aptitud real (se minimiza).',
      docPhi: 'función de distribución normal estándar (aproximación de Abramowitz y Stegun, error < 1,5 · 10⁻⁷).',
      docProb: 'Probabilidad de ordenar mal dos individuos con diferencia real gap usando medias de r evaluaciones.',
      example: 'Ejemplos para comprobar a mano',
    },
    en: {
      title: 'Noisy fitness: normal noise (Box–Muller), mean of R evaluations, pairs in the wrong order and probability of a wrong comparison.',
      ref: 'References: Talbi, E.-G. (2009), §1.2.1; Jin, Y., & Branke, J. (2005); Fitzpatrick, J. M., & Grefenstette, J. J. (1988); Bautista-Valhondo, J. (2020).',
      docGauss: 'Normal noise with mean 0 and standard deviation sigma from two uniforms u1, u2 in [0, 1).',
      round: 'rounded to two decimal places, as in the tool',
      docMean: 'Mean of r noisy evaluations of an individual with true fitness f (rand returns uniforms in [0, 1)).',
      docPairs: 'Pairs of individuals whose order by noisy fitness differs from their order by true fitness (minimised).',
      docPhi: 'standard normal distribution function (Abramowitz and Stegun’s approximation, error < 1.5 · 10⁻⁷).',
      docProb: 'Probability of ordering two individuals with true difference gap wrongly when using means of r evaluations.',
      example: 'Examples to check by hand',
    },
  };

  const references = [
    C.ref('talbi', {
      es: 'Manual de referencia del curso. El apartado 1.2.1 define la optimización con incertidumbre: una aptitud con ruido aditivo, normalmente normal, que se aproxima con la media de varias evaluaciones.',
      en: 'The course’s reference textbook. Section 1.2.1 defines optimisation under uncertainty: a fitness with additive noise, usually normal, approximated by the mean of several evaluations.',
    }),
    C.ref('bautista', {
      es: 'Manual en español de metaheurísticas aplicadas a problemas de ingeniería de organización industrial, referencia del curso. Dedica a los algoritmos genéticos el capítulo 8.',
      en: 'Spanish-language textbook on metaheuristics applied to industrial engineering problems, a course reference. Chapter 8 is devoted to genetic algorithms.',
    }),
    C.ref('fitzpatrick1988', {
      es: 'Estudio pionero de los algoritmos genéticos con aptitud ruidosa: el equilibrio entre el tamaño de la población y el número de evaluaciones por individuo.',
      en: 'Pioneering study of genetic algorithms with noisy fitness: the trade-off between population size and the number of evaluations per individual.',
    }, { original: true }),
    C.ref('jinBranke2005', {
      es: 'Revisión de la optimización evolutiva con incertidumbre: ruido, robustez, aptitud aproximada y problemas dinámicos, con las técnicas para cada caso.',
      en: 'Survey of evolutionary optimisation under uncertainty: noise, robustness, approximate fitness and dynamic problems, with the techniques for each case.',
    }),
  ];

  const H = C.makeHelpers(codeTemplates, codeComments, pseudocode);
  const api = Object.assign({
    id: 'noise', explanation, stages, narration, pseudocode, keywords, stepLines, codeTemplates, references,
  }, H);
  if (isNode) module.exports = api;
  else ((root.GAX = root.GAX || {}).content = root.GAX.content || {}).noise = api;
})(typeof self !== 'undefined' ? self : this);
