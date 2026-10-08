# INDU 6361 · Discrete Optimization Trainer

An exam-preparation app for Concordia University's INDU 6361 Discrete Optimization (Fall 2026).
It is a static site: plain HTML, CSS and JavaScript modules, no build step, no server, no account.
Progress is stored in the browser only.

Live site: https://chelvy.github.io/INDU6361-Study-App/

## What is in it

| Page | What it does |
| --- | --- |
| **Today** | Readiness score, a study plan sized to your daily minutes and exam dates, reviews that are due. |
| **Learn** | 26 lessons, one per syllabus topic, in the course notation, with interactive figures, exam moves, traps and a self-check. |
| **Train** | 31 step-by-step trainers that grade every intermediate result: branch and bound (tree and log), bounds and gaps, big-M and fixed-charge modelling, facility location, Dijkstra, Kruskal, Prim, max-flow/min-cut, the Hungarian method, knapsack DP, total unimodularity, cut validity, subtours, MTZ, row generation, fractional separation, Chvátal–Gomory, Gomory cuts, MIR, cliques, covers, lifting, flow covers, lot sizing (ℓ,S), Kelley's cutting planes, perspective cuts, 2-opt, Lagrangian relaxation, Benders cuts and column-generation pricing. Each has the lecture instance, unlimited random instances at three levels, and (where it makes sense) your own data. |
| **Questions** | 898 questions: 219 written for this course and 679 converted from published exercises, exams and quizzes, each with its source. Spaced repetition schedules the reviews. |
| **Mock exam** | Timed papers of 30, 60, 90 or 120 minutes mixing quick questions, full trainers and open questions; answers are revealed only after you submit. |
| **Mistakes** | Everything you got wrong, with a link back to the same instance. |
| **Cheat sheet** | 25 printable sections of definitions, formulas and procedures. |
| **Sources** | What was read to build the app, where each external question comes from, how answers were checked, and the known limits. |

## How the answers are checked

All arithmetic in the trainers is exact (rational numbers on big integers), so a tableau entry such as 7/22 is graded as 7/22, not as 0.318.
The answer keys are produced by the same solvers the tests exercise:

```bash
node --test tests/*.test.js
```

The suite (Node 20 or later, no dependencies) runs every trainer on its lecture instances and on random instances, feeds each answer key back through its own grader, compares the solvers with brute force on small cases, and checks every lesson, question and formula for broken markup.

## Run it locally

ES modules need an HTTP server (opening `index.html` from the file system will not work):

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy on GitHub Pages

The site is served as-is from the repository root: **Settings → Pages → Deploy from a branch → `main` / `/ (root)`**.
The empty `.nojekyll` file is required: without it GitHub's Jekyll step drops files whose names start with an underscore.

The only external dependency is KaTeX, loaded from the jsDelivr CDN, so formulas need a network connection on first load.

## Layout

```
index.html            shell
css/app.css           all styles (light and dark)
js/app.js             router and navigation
js/views/             one module per page
js/drills/            the trainers (instance → graded steps)
js/math/              exact arithmetic, simplex, branch and bound, graphs, cuts, TSP, TU, convex
js/data/              topics, lessons, course question bank, cheat sheet, sources ledger
data/ext/             external question bank (JSON, one file per batch, each item with its source)
tests/                node:test suites
```

## Honest limits

- No past INDU 6361 exam was found online; exam-style questions are modelled on the course's own workshops, labs and solved exercises and on comparable courses.
- Lessons for classes whose slides were not yet released when the app was built (Lagrangian relaxation, Benders, column generation, heuristics) follow the course outline and the textbook, and are marked "Ahead of released slides" in the app.
- The midterm date is not in the course outline. Enter it under Settings when it is announced.
- This is a personal study aid, not official course material. Course slides are not redistributed here.
