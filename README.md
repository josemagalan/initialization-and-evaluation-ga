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
| | Quasi-random (Halton, Sobol) and Latin hypercube · simple sequential inhibition · feasible initialisation | Advanced |
| Evaluation | From genotype to fitness · objective versus fitness · constraints as a penalty · the cost of evaluating | Basic |
| | Fitness landscape · noisy fitness | Advanced |
| | Approximate fitness · several objectives | Further reading |

## Status

In development. The structure, the shared problem layer (taken from representation-ga) and the home page are in place; strategies and aspects will be switched on phase by phase and are shown as “coming soon” until then.

## Running locally

Open `index.html` in any modern browser. No server or internet connection is needed: D3 v7 is bundled in `vendor/`.

## Tests

Requires Node.js 22 or later.

```
npm test
```

## Project structure

| Path | Contents |
| --- | --- |
| `index.html`, `css/` | Page and styles |
| `js/registry.js`, `js/home.js` | Catalogue of families, strategies and encodings; home screen |
| `js/problems/`, `js/assignment.js`, `js/func.js`, `js/cities.js` | The four problems and six encodings of representation-ga: instances, decoding, evaluation and feasibility |
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
