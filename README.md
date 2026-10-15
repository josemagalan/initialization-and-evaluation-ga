# Initialisation and evaluation in genetic algorithms

Browse the series: [Genetic Algorithms Lab](https://josemagalan.github.io/genetic-algorithms-lab/?lang=en) — five interactive modules, two simulators and a book, *Evolución a la vista* (in Spanish).

[![Live demo](https://img.shields.io/badge/Live_demo-GitHub_Pages-2ea44f?logo=github)](https://josemagalan.github.io/initialization-and-evaluation-ga/)
[![Tests](https://github.com/josemagalan/initialization-and-evaluation-ga/actions/workflows/tests.yml/badge.svg)](https://github.com/josemagalan/initialization-and-evaluation-ga/actions/workflows/tests.yml)
[![Code: MIT](https://img.shields.io/badge/Code-MIT-yellow.svg)](LICENSE)
[![Content: CC BY 4.0](https://img.shields.io/badge/Content-CC_BY_4.0-lightgrey.svg)](LICENSE-CONTENT.md)
[![D3.js v7 · no build](https://img.shields.io/badge/D3.js_v7-no_build-f9a03c?logo=d3dotjs&logoColor=white)](https://d3js.org/)
[![Languages: ES | EN](https://img.shields.io/badge/Languages-ES_%7C_EN-blue.svg)](#overview)
[![Purpose: Teaching tool](https://img.shields.io/badge/Purpose-Teaching_tool-informational.svg)](#overview)
[![Status: public beta](https://img.shields.io/badge/Status-public_beta-orange.svg)](#status)
[![Accessibility: WCAG 2.2 AA checked with axe](https://img.shields.io/badge/Accessibility-WCAG_2.2_AA_(axe)-0b7285.svg)](#accessibility)

**José Manuel Galán**¹ · **Silvia Díaz-de la Fuente**² · **Virginia Ahedo**¹ · **María Pereda**³ · **José Ignacio Santos**¹

¹ Universidad de Burgos · ² Universidad de Salamanca · ³ Universidad Politécnica de Madrid
All authors are members of the Los Goonies research group (Group of Organization and Industrial Engineering and Simulation).

---

## Overview

A genetic algorithm starts by creating a population and measuring the quality of each individual, and it repeats the measurement in every generation. How the initial population is spread over the solution space decides how much diversity there is to explore; how fitness is computed decides what the algorithm takes to be a good solution and how much it costs to find out. This interactive tool shows both steps, in Spanish or English, on the same four problems as [Representation in genetic algorithms](https://github.com/josemagalan/representation-ga): the 0/1 knapsack, task-to-machine assignment, the travelling salesman problem and a continuous 2D function.

This tool is part of the five-module series on representation, initialisation and evaluation, selection, crossover and mutation, with a shared approach and interface. It runs entirely in the browser, with no build step and no server: open `index.html`.

## Contents

| Family | Strategy or aspect | Level |
| --- | --- | --- |
| Initialisation | Uniform random (all six encodings) · seeding with a heuristic as a counterexample | Basic |
| | Quasi-random (Halton, Sobol) and Latin hypercube · simple sequential inhibition · feasible initialisation · comparison of every strategy over 1000 runs | Advanced |
| Evaluation | From genotype to fitness · objective versus fitness · constraints as a penalty · the cost of evaluating | Basic |
| | Fitness landscape · noisy fitness | Advanced |
| | Approximate fitness · several objectives | Further reading |

## Status

Public beta. Both families are complete — every **Initialisation** strategy and every **Evaluation** aspect — with step by step, Learn more, practice mode on every page, Compare strategies and the Moodle question banks. The English text has been revised; the Spanish text is awaiting review by the teaching team, some references still have to be checked against the original sources, and a question bank still has to be tried out in a production Moodle. Version 1.0 will follow those reviews. Comments and corrections are welcome as [GitHub issues](https://github.com/josemagalan/initialization-and-evaluation-ga/issues).

Initialisation:

- **Uniform random initialisation** for the six encodings (gene by gene, with the random numbers shown, Fisher–Yates for permutations).
- The **seeding counterexample**: a greedy solution copied K times into the population and its expected takeover under binary tournament selection.
- **Quasi-random and Latin hypercube initialisation** for the continuous function: Halton and Sobol sequences, worked out digit by digit, and Latin hypercube sampling, compared with the uniform population for the largest gap, the occupied strips of each axis and the minimum distance.
- **Sequential diversification** (simple sequential inhibition) for the six encodings: candidates are accepted only if they lie at least δ from every individual already in the population, with its cost in candidates.
- **Feasible initialisation**: full knapsacks from a random order and one 1 per row in the assignment matrix.
- **Compare strategies**: every strategy that supports the chosen encoding, 1000 populations each on the same instance, with the means of diversity, feasibility, initial quality, coverage and cost.

Evaluation:

- **From genotype to fitness** for the six encodings: decode, compute the objective, check the constraints and combine them into the fitness, link by link for the first individual and then for the whole population, with the ranks and the number of evaluations.
- **Objective versus fitness**: four ways of turning a cost that is minimised into a fitness (−f, C − f, 1/(1 + f) and rank) and how each one shares out the roulette wheel.
- **Constraints as a penalty** for the knapsack and the assignment matrix: linear or quadratic penalty, the weight λ, the fitness of every individual as a function of λ and the critical weight λ* above which the best individual is feasible.
- **The cost of evaluating**: the budget N · (G + 1), a minimal genetic algorithm that shows how many evaluations repeat, and how far a cache gets with the same budget.

- **Fitness landscape** for the six encodings: one-gene neighbours, steepest-descent local search from each individual, basins and local optima (counted over the whole space when it is small) and the fitness–distance correlation over a uniform sample.
- **Noisy fitness** for the function and the travelling salesman: one noisy evaluation, re-evaluation and the mean of R evaluations, pairs in the wrong order, the probability of misordering the two best and the cost.
- **Approximate fitness** for the function: nearest-neighbour and inverse distance weighting meta-models built on the evaluated initial population, their error and rank correlation, and pre-selection of the candidates worth evaluating.
- **Several objectives** for the knapsack (value and weight) and the assignment (makespan and total time): normalised weighted sum, Pareto dominance, non-dominated fronts, supported and unsupported solutions and, in small spaces, the true Pareto front.

Each page has a Learn more panel with pseudocode synchronised with the animation and downloadable Python and JavaScript code.

Practice and Moodle:

- **Practice mode** on all thirteen pages, with sixteen exercise types that have a single answer and are marked box by box: generating individuals from given random numbers, measuring diversity, applying the greedy heuristic, the expected copies of the seed, Halton, Sobol and Latin hypercube points, accepting or rejecting candidates in sequential inhibition, building feasible individuals, the chain from genotype to fitness, ranking, cost-to-fitness transformations and roulette-wheel probabilities, penalised fitness and λ*, counting evaluations with a cache, one-gene neighbours and local optima, averaging noisy evaluations, meta-model estimates, and Pareto fronts with the weighted sum. Each exercise uses the page’s instance, population and settings, and “Show the solution” jumps to the matching step.
- **Moodle question banks** (Moodle XML, embedded answers/Cloze) in three difficulty levels, generated from the same exercises: one category per page, exercise type, encoding and level, partial credit per box, and general feedback with the solution and links to the step-by-step solution and to the exercise in the tool.

## Running locally

Open `index.html` in any modern browser. No server or internet connection is needed: D3 v7 is bundled in `vendor/`. The live version is at <https://josemagalan.github.io/initialization-and-evaluation-ga/>; every page keeps its example (instance, population, settings and step) in the address, ready to project in class or share.

Keyboard: ← → step back/forward, Space play/pause, Home back to the start; Tab reaches every control, practice box and code tab.

## Accessibility

Every view (home, every step of the thirteen pages with each encoding and setting, practice mode before and after checking, Compare strategies, the Moodle page and About), in both languages, light and dark themes and at 1280 and 375 px wide, is checked with [axe-core](https://github.com/dequelabs/axe-core) against WCAG 2.2 AA and best-practice rules, with no violations. Everything that can be done with a mouse can also be done with the keyboard, the figure carries a text description that follows the narration, colours follow the Okabe–Ito palette, which stays distinguishable with the common colour-vision deficiencies, text meets the AA contrast ratio in both themes, and animations respect the reduced-motion setting.

## Tests

Requires Node.js 22 or later; Python 3 is optional (it is used to test the downloadable Python code as well).

```
npm test
```

The tests check the shared problem layer against representation-ga, that every gene can be recomputed by hand from the random number shown, that the initialisation is uniform (bit, integer and real frequencies; the 120 permutations of five cities with a χ² test), the greedy heuristics on worked examples, the expected takeover against a simulation, the diversity measures against an independent computation, the net properties of the Halton and Sobol points (one point in every elementary box), one individual per stratum in every Latin hypercube, that sequential inhibition accepts a candidate if and only if it is at least δ from every accepted individual, that feasible initialisation always gives full knapsacks and one 1 per row, the comparison means against a run-by-run computation, the fitness of the six encodings against an independent computation and worked examples, that the four cost-to-fitness transformations keep the order and give valid roulette-wheel probabilities, that above the critical weight λ* the best individual is feasible and just below it is not, the evaluation counts with and without a cache against an independent recount, that local search improves at every step and ends in a local optimum, the number of local optima against an independent enumeration, the normal noise (mean and standard deviation), the meta-model estimates against their formulas, that every individual of a front is dominated by some individual of the previous front, the true Pareto front against an independent enumeration, that every step has narration and highlights pseudocode lines that exist, that the downloadable Python and JavaScript code gives exactly the same results as the tool, that every practice answer can be recomputed independently from the data the exercise gives, that marking follows the announced tolerances, and that every Moodle box holds the exercise’s answer and every link reproduces the exercise.

## Project structure

| Path | Contents |
| --- | --- |
| `index.html`, `css/` | Page and styles |
| `js/registry.js`, `js/home.js` | Catalogue of families, strategies and encodings; home screen |
| `js/problems/`, `js/assignment.js`, `js/func.js`, `js/cities.js` | The four problems and six encodings of representation-ga: instances, decoding, evaluation and feasibility |
| `js/space.js` | Common layer for populations: instances, quality, optimum, size of the search space, distances and diversity measures |
| `js/fitness.js` | Common layer for evaluation: decoding, objective, violation, penalty and fitness of the six encodings |
| `js/items/` | Logic of each strategy or aspect: the population, the random numbers used and the step-by-step trace |
| `js/compare.js`, `js/ui/compare-page.js` | Comparison of the initialisation strategies over 1000 runs: logic and page |
| `js/content/` | Teaching content of each strategy or aspect: explanation, narration, pseudocode, downloadable code and references |
| `js/viz/`, `js/ui/` | D3 view of a population and the panels of the advanced evaluation (`eval-panels.js`); controls, narration and measures of each page (`population.js` for the basic strategies, `init-items.js` for the advanced ones, `eval-items.js` and `eval-advanced.js` for the evaluation aspects) |
| `js/practice.js`, `js/practice-text.js`, `js/practice-ui.js` | Practice mode: exercises with a single answer and box-by-box marking (logic, Spanish and English texts, card) |
| `js/moodle.js`, `js/moodle-page.js` | Moodle question banks: generator of Moodle XML (Cloze) in three levels and its page |
| `js/learn.js` | Learn more panel |
| `js/about.js`, `js/app.js` | About page and footer, page controller |
| `js/a11y.js` | Keyboard access to scrollable regions and the role of the main figure, updated as the page changes |
| `js/i18n.js`, `js/rng.js` | Spanish and English texts; seeded random generator |
| `img/logos/`, `vendor/` | Institution logos; D3.js v7 |
| `tests/` | Tests with `node:test` |

<!-- ga-series-links:start -->
## Teaching resources / Materiales docentes

[Portal en español](https://josemagalan.github.io/genetic-algorithms-lab/?lang=es) · [Portal in English](https://josemagalan.github.io/genetic-algorithms-lab/?lang=en)

| Resource / Recurso | Use or read / Usar o leer | Repository / Repositorio |
| --- | --- | --- |
| Portal: Genetic Algorithms Lab / Laboratorio de algoritmos genéticos | [Open / Abrir](https://josemagalan.github.io/genetic-algorithms-lab/) | [GitHub](https://github.com/josemagalan/genetic-algorithms-lab) |
| Representation / Representación | [Open / Abrir](https://josemagalan.github.io/representation-ga/) | [GitHub](https://github.com/josemagalan/representation-ga) |
| Initialisation and evaluation / Inicialización y evaluación | [Open / Abrir](https://josemagalan.github.io/initialization-and-evaluation-ga/) | [GitHub](https://github.com/josemagalan/initialization-and-evaluation-ga) |
| Selection / Selección | [Open / Abrir](https://josemagalan.github.io/selection-ga/) | [GitHub](https://github.com/josemagalan/selection-ga) |
| Crossover / Cruce | [Open / Abrir](https://josemagalan.github.io/crossover-ga/) | [GitHub](https://github.com/josemagalan/crossover-ga) |
| Mutation / Mutación | [Open / Abrir](https://josemagalan.github.io/mutation-ga/) | [GitHub](https://github.com/josemagalan/mutation-ga) |
| EvoTraveller | [Open / Abrir](https://evotraveller.streamlit.app/) | [GitHub](https://github.com/jismartin/evotraveller) |
| SelectionMechanisms | [Open / Abrir](https://josemagalan.shinyapps.io/SelectionMechanisms/) | [GitHub](https://github.com/josemagalan/SelectionMechanisms) |
| Book / Libro: *Evolución a la vista* | [Read / Leer](https://josemagalan.github.io/genetic-algorithms-lab-book/) | [GitHub](https://github.com/josemagalan/genetic-algorithms-lab-book) |

El libro está en construcción: su contenido y estructura pueden cambiar. / The book, in Spanish, is a work in progress: its content and structure may change.
<!-- ga-series-links:end -->

## License

- Code, including the downloadable Python and JavaScript implementations: MIT (see [LICENSE](LICENSE)).
- Teaching texts (explanations, step narration and pseudocode): CC BY 4.0 (see [LICENSE-CONTENT.md](LICENSE-CONTENT.md)).
- D3.js: ISC licence (see [vendor/d3-LICENSE](vendor/d3-LICENSE)).

## Acknowledgements

We thank Anthropic’s Claude for Science programme for supporting the development of this tool, which was built with the help of Claude.

<p>
  <img src="img/logos/ubu.png" alt="Universidad de Burgos" height="56">&nbsp;&nbsp;
  <img src="img/logos/usal.png" alt="Universidad de Salamanca" height="44">&nbsp;&nbsp;
  <img src="img/logos/upm.png" alt="Universidad Politécnica de Madrid" height="44">&nbsp;&nbsp;
  <img src="img/logos/goonies.png" alt="Los Goonies research group" height="44">
</p>
