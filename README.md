# Initialisation and evaluation in genetic algorithms

Browse the series: [Genetic algorithms, step by step](https://josemagalan.github.io/genetic-algorithms-lab/?lang=en) — teaching tools for representation, selection, crossover, mutation and evolutionary simulations.

[![Tests](https://github.com/josemagalan/initialization-and-evaluation-ga/actions/workflows/tests.yml/badge.svg)](https://github.com/josemagalan/initialization-and-evaluation-ga/actions/workflows/tests.yml)
[![Code: MIT](https://img.shields.io/badge/Code-MIT-yellow.svg)](LICENSE)
[![Content: CC BY 4.0](https://img.shields.io/badge/Content-CC_BY_4.0-lightgrey.svg)](LICENSE-CONTENT.md)
[![D3.js v7 · no build](https://img.shields.io/badge/D3.js_v7-no_build-f9a03c?logo=d3dotjs&logoColor=white)](https://d3js.org/)
[![Languages: ES | EN](https://img.shields.io/badge/Languages-ES_%7C_EN-blue.svg)](#overview)
[![Purpose: Teaching tool](https://img.shields.io/badge/Purpose-Teaching_tool-informational.svg)](#overview)
[![Status: in development](https://img.shields.io/badge/Status-in_development-orange.svg)](#status)
[![Sister tool: representation-ga](https://img.shields.io/badge/Sister_tool-representation--ga-8a2be2?logo=github)](https://github.com/josemagalan/representation-ga)
[![Sister tool: selection-ga](https://img.shields.io/badge/Sister_tool-selection--ga-8a2be2?logo=github)](https://github.com/josemagalan/selection-ga)
[![Sister tool: crossover-ga](https://img.shields.io/badge/Sister_tool-crossover--ga-8a2be2?logo=github)](https://github.com/josemagalan/crossover-ga)
[![Sister tool: mutation-ga](https://img.shields.io/badge/Sister_tool-mutation--ga-8a2be2?logo=github)](https://github.com/josemagalan/mutation-ga)

**José Manuel Galán**¹ · **Silvia Díaz-de la Fuente**² · **Virginia Ahedo**¹ · **María Pereda**³ · **José Ignacio Santos**¹

¹ Universidad de Burgos · ² Universidad de Salamanca · ³ Universidad Politécnica de Madrid
All authors are members of the Los Goonies research group (Group of Organization and Industrial Engineering and Simulation).

---

## Overview

A genetic algorithm starts by creating a population and measuring the quality of each individual, and it measures it again in every generation. How the initial population is spread over the solution space decides how much diversity there is to explore; how fitness is computed decides what the algorithm takes to be a good solution and how much it costs to find out. This interactive tool shows both steps, in Spanish or English, on the same four problems as [Representation in genetic algorithms](https://github.com/josemagalan/representation-ga): the 0/1 knapsack, task-to-machine assignment, the travelling salesman problem and a continuous 2D function.

It completes the series formed by [Representation](https://github.com/josemagalan/representation-ga), [Selection](https://github.com/josemagalan/selection-ga), [Crossover](https://github.com/josemagalan/crossover-ga) and [Mutation in genetic algorithms](https://github.com/josemagalan/mutation-ga), with the same approach and interface. It runs entirely in the browser, with no build step and no server: open `index.html`.

## Planned contents

| Family | Strategy or aspect | Level |
| --- | --- | --- |
| Initialisation | Uniform random (all six encodings) · seeding with a heuristic as a counterexample | Basic |
| | Quasi-random (Halton, Sobol) and Latin hypercube · simple sequential inhibition · feasible initialisation · comparison of every strategy over 1000 replicas | Advanced |
| Evaluation | From genotype to fitness · objective versus fitness · constraints as a penalty · the cost of evaluating | Basic |
| | Fitness landscape · noisy fitness | Advanced |
| | Approximate fitness · several objectives | Further reading |

## Status

In development, with the whole **Initialisation** family and the basic part of the **Evaluation** family available.

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

Each page has a Learn more panel with pseudocode synchronised with the animation and downloadable Python and JavaScript code. The advanced evaluation aspects (fitness landscape, noisy and approximate fitness, several objectives) will be switched on in the next phase and are shown as “coming soon” until then.

## Running locally

Open `index.html` in any modern browser. No server or internet connection is needed: D3 v7 is bundled in `vendor/`.

## Tests

Requires Node.js 22 or later; Python 3 is optional (it is used to test the downloadable Python code as well).

```
npm test
```

The tests check the shared problem layer against representation-ga, that every gene can be recomputed by hand from the random number shown, that the initialisation is uniform (bit, integer and real frequencies; the 120 permutations of five cities with a χ² test), the greedy heuristics on worked examples, the expected takeover against a simulation, the diversity measures against an independent computation, the net properties of the Halton and Sobol points (one point in every elementary box), one individual per stratum in every Latin hypercube, that sequential inhibition accepts a candidate if and only if it is at least δ from every accepted individual, that feasible initialisation always gives full knapsacks and one 1 per row, the comparison means against a replica-by-replica computation, the fitness of the six encodings against an independent computation and worked examples, that the four cost-to-fitness transformations keep the order and give valid roulette-wheel probabilities, that above the critical weight λ* the best individual is feasible and just below it is not, the evaluation counts with and without a cache against an independent recount, that every step has narration and highlights pseudocode lines that exist, and that the downloadable Python and JavaScript code gives exactly the same results as the tool.

## Project structure

| Path | Contents |
| --- | --- |
| `index.html`, `css/` | Page and styles |
| `js/registry.js`, `js/home.js` | Catalogue of families, strategies and encodings; home screen |
| `js/problems/`, `js/assignment.js`, `js/func.js`, `js/cities.js` | The four problems and six encodings of representation-ga: instances, decoding, evaluation and feasibility |
| `js/space.js` | Common layer for populations: instances, quality, optimum, size of the search space, distances and diversity measures |
| `js/fitness.js` | Common layer for evaluation: decoding, objective, violation, penalty and fitness of the six encodings |
| `js/items/` | Logic of each strategy or aspect: the population, the random numbers used and the step-by-step trace |
| `js/compare.js`, `js/ui/compare-page.js` | Comparison of the initialisation strategies over 1000 replicas: logic and page |
| `js/content/` | Teaching content of each strategy or aspect: explanation, narration, pseudocode, downloadable code and references |
| `js/viz/`, `js/ui/` | D3 view of a population; controls, narration and measures of each page (`population.js` for the basic strategies, `init-items.js` for the advanced ones, `eval-items.js` for the evaluation aspects) |
| `js/learn.js` | Learn more panel |
| `js/about.js`, `js/app.js` | About page and footer, page controller |
| `js/a11y.js` | Keyboard access to scrollable regions and the role of the main figure |
| `js/i18n.js`, `js/rng.js` | Spanish and English texts; seeded random generator |
| `img/logos/`, `vendor/` | Institution logos; D3.js v7 |
| `tests/` | Tests with `node:test` |

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
