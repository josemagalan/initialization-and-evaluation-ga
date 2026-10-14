/*
 * Textos de la interfaz en español e inglés.
 * t(lang, key, params) sustituye {param} por su valor.
 */
(function (root) {
  'use strict';

  const dict = {
    es: {
      portalHome: 'Herramientas de algoritmos genéticos',
      brand: 'Inicialización y evaluación en algoritmos genéticos',
      homeTitleDoc: 'Inicialización y evaluación · Algoritmos genéticos',
      itemTitleDoc: '{name} · Algoritmos genéticos',
      homeEyebrow: 'Herramienta docente',
      homeTitle: 'Inicialización y evaluación en algoritmos genéticos',
      homeLead: 'Un algoritmo genético empieza creando una población y midiendo la calidad de cada individuo, y vuelve a medirla en cada generación. Cómo se reparte la población inicial por el espacio de soluciones decide cuánta diversidad hay para explorar; cómo se calcula la aptitud decide qué entiende el algoritmo por una buena solución y cuánto cuesta averiguarlo. Elige una estrategia o un aspecto para verlo paso a paso con los mismos cuatro problemas de la herramienta de representación.',
      itemsCount: '{n} disponibles de {total}',
      itemsCountNone: 'En preparación',
      comingSoon: 'Próximamente',
      allItems: 'Inicialización y evaluación',
      levelsLabel: 'Nivel',
      levelB: 'Básico',
      levelA: 'Avanzado',
      'level+': 'Para saber más',
      seriesBefore: 'Antes de inicializar, representar las soluciones:',
      seriesAfter: 'Después de evaluar, los operadores:',
      seriesRepresentation: 'Representación',
      seriesSelection: 'Selección',
      seriesCrossover: 'Cruce',
      seriesMutation: 'Mutación',
      scrollRegion: 'Contenido desplazable en horizontal (flechas ← →)',
    },
    en: {
      portalHome: 'Genetic algorithm tools',
      brand: 'Initialisation and evaluation in genetic algorithms',
      homeTitleDoc: 'Initialisation and evaluation · Genetic algorithms',
      itemTitleDoc: '{name} · Genetic algorithms',
      homeEyebrow: 'Teaching tool',
      homeTitle: 'Initialisation and evaluation in genetic algorithms',
      homeLead: 'A genetic algorithm starts by creating a population and measuring the quality of each individual, and it measures it again in every generation. How the initial population is spread over the solution space decides how much diversity there is to explore; how fitness is computed decides what the algorithm takes to be a good solution and how much it costs to find out. Choose a strategy or an aspect to follow it step by step on the same four problems as the representation tool.',
      itemsCount: '{n} available out of {total}',
      itemsCountNone: 'In preparation',
      comingSoon: 'Coming soon',
      allItems: 'Initialisation and evaluation',
      levelsLabel: 'Level',
      levelB: 'Basic',
      levelA: 'Advanced',
      'level+': 'Further reading',
      seriesBefore: 'Before initialising, representing solutions:',
      seriesAfter: 'After evaluating, the operators:',
      seriesRepresentation: 'Representation',
      seriesSelection: 'Selection',
      seriesCrossover: 'Crossover',
      seriesMutation: 'Mutation',
      scrollRegion: 'Horizontally scrollable content (← → arrow keys)',
    },
  };

  function t(lang, key, params) {
    const table = dict[lang] || dict.es;
    let s = table[key] != null ? table[key] : (dict.es[key] != null ? dict.es[key] : key);
    if (params) s = s.replace(/\{(\w+)\}/g, (m, p) => (params[p] != null ? params[p] : m));
    return s;
  }

  const api = { t, dict, languages: Object.keys(dict) };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.GAX = root.GAX || {}).i18n = api;
})(typeof self !== 'undefined' ? self : this);
