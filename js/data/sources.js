// Coverage ledger shown on the Sources page: what the content is built from, who read it, how it was checked.
const RESOURCES = [
  ['Discrete Mathematics and Its Applications', 1118], ['OptimizationPrinciplesAlgorithms2018', 738], ['bv_cvxbook (Boyd & Vandenberghe, Convex Optimization)', 714],
  ['Algorithms for Decision Making', 700], ['Numerical Optimization', 686], ['Numerical Optimization 2nd Edition', 683], ['Numerical Optimization by NocedalJ', 651],
  ['Algorithms for Optimization', 634], ['Springer Optimization and Its Applications', 603], ['Lectures on Modern Convex Optimization', 537], ['OptimizationBootcamp', 504],
  ['The Design of Approimation Algorithms', 500], ['The Design of Approximation Algorithms', 500], ['IntroOptimization', 495], ['Introduction to Applied Linear Algebra', 473],
  ['Lecture slides for Introduction to Applied Linear Algebra', 470], ['Handbook on Modelling for Discrete Optimization', 443], ['Algorithms for Validation', 442],
  ['Constrained-Opt (scanned)', 410], ['Convex Optimization', 402], ['Elements of Scheduling', 367], ['Advances and Novel Approaches in Discrete Optimization', 356],
  ['Convex Optimization — Slides', 301], ['Discrete Optimization: Theory, Algorithms and Applications', 248], ['Introduction to Combinatorial Optimization', 230],
  ['vmls-python-companion', 192], ['Iterative Methods for Optimization', 188], ['vmls-julia-companion', 180], ['Nonlinear Programming NLP', 172],
  ['Network Optimization — Continuous and Discrete Models', 95], ['textbook Discrete and Continuous Optimization', 85], ['Discrete Optimization — Spring 2017 — Thomas Rothvoss', 84],
  ['vmls-additional-exercises', 77], ['Discrete Optimisation — Exercises Book', 74], ['Discrete Optimization for Agents', 72], ['Discrete Optimization at IBM’s Mathematical Sciences Department', 61],
  ['Optimization for Dummy', 52], ['Convex-Concave Procedure', 45], ['A Practical Guide to Discrete Optimization', 44], ['Discrete Optimization with Decision Diagrams', 37],
  ['CVXR: An R Package for Disciplined Convex Optimization', 34], ['Filter design', 31], ['ℓ1-norm Methods for Convex-Cardinality Problems', 31],
  ['Discrete Optimization — Engineering Design Optimization (Martins & Ning, ch. 8)', 25], ['Convex optimization examples', 24], ['Chance constrained optimization', 22],
  ['Stochastic programming', 21], ['ℓ1-norm Methods for Convex-Cardinality Problems, Part II', 21], ['Rao, Engineering Optimization — Answers to Selected Problems (three copies)', 27],
  ['Rao — Some Computational Aspects of Optimization', 6], ['Rao — Convex and Concave Functions', 5], ['Rao — Introduction to MATLAB', 4], ['Engineering Design Optimization (a one-page error page)', 1],
];

const USED = {
  'Discrete Optimisation — Exercises Book': 'Past-exam exercises: 109 questions in the bank.',
  'Discrete Optimization — Spring 2017 — Thomas Rothvoss': 'Lecture notes: 65 questions (MST, shortest paths, flows, duality, TU, branch and bound, knapsack DP).',
  'Discrete Optimization — Engineering Design Optimization (Martins & Ning, ch. 8)': 'Two complete branch-and-bound examples: 21 questions.',
  'Discrete Optimization at IBM’s Mathematical Sciences Department': 'Solver logs with and without cuts, Gomory–Chvátal derivation: 15 questions.',
  'A Practical Guide to Discrete Optimization': '13 questions (TSP bounds and heuristics).',
  'bv_cvxbook (Boyd & Vandenberghe, Convex Optimization)': 'Background for the tangent-cut and perspective lesson (the instructor cites §3.1.3 and §3.2.6).',
  'The Design of Approimation Algorithms': 'Byte-identical duplicate of “The Design of Approximation Algorithms”: read once.',
  'Numerical Optimization': 'Same text as “Numerical Optimization 2nd Edition” (99.4% overlap of extracted text): read once.',
  'Constrained-Opt (scanned)': 'Scan without a text layer (Bertsekas, Constrained Optimization and Lagrange Multiplier Methods): read page by page as images.',
  'Rao, Engineering Optimization — Answers to Selected Problems (three copies)': 'Three copies of the same 9-page excerpt; compared and read once.',
  'Engineering Design Optimization (a one-page error page)': 'The PDF contains only a web “404” page.',
};

export const SOURCES = {
  sections: [
    {
      title: 'How this trainer was built',
      html: `<p>Everything here was produced by an AI assistant (Claude) working from the files in your INDU 6361 course folder and from web research, in October 2026. The course outline allows generative AI “to support learning”; exams do not allow it, which is why the trainer is designed to make you do the work on paper.</p>
<ul>
<li><b>Lessons, trainers, the course question bank and the cheat sheet</b> for Modules 1 and 2 were written by the lead assistant directly from the text of the instructor’s slides, solved exercises and lab notebooks, which it read in full (twice). Numbers are the instructor’s; wording is paraphrased.</li>
<li><b>Lessons for classes 7–10</b> (heuristics, Lagrangian relaxation, Benders, column generation) were written <b>before the instructor released those slides</b>. They follow the course outline and the textbook, with small examples of the app’s own that are verified by computation. Expect differences in notation and emphasis when the real slides arrive.</li>
<li><b>The 55 PDFs of the Resources folder</b> (14,915 pages) were read by assistant sub-agents that wrote page-referenced notes; the lead assistant did not read those books itself and used the notes only where stated below.</li>
<li><b>External questions</b> come from exams, problem sets and lecture notes of other universities found on the web, and from five documents of the Resources folder. Each one shows its source when you answer it.</li>
</ul>`,
    },
    {
      title: 'Instructor’s material (read directly, in full)',
      table: {
        headers: ['Document', 'Pages', 'Used for'],
        rows: [
          ['Course outline', '5', 'Grading, pass conditions, schedule of the 11 classes, exam period'],
          ['101 Course Introduction', '13', 'Lesson and questions on modelling'],
          ['102 Branch and Bound', '16', 'Lesson, tree/log trainer, gaps trainer'],
          ['103 Relaxations', '6', 'Lesson and questions'],
          ['104 Formulations', '55', 'Lesson, big-M / fixed-charge / facility-location trainers'],
          ['105 Well-Solved Problems (two files)', '84', 'Five lessons and the Dijkstra, Kruskal/Prim, Edmonds–Karp, Hungarian and knapsack trainers'],
          ['106 Integrality Property', '23', 'Lesson, TU and cut trainers'],
          ['10E Solved exercises', '84', 'Presets and tie rules of the algorithm trainers; every trace is reproduced by the test suite'],
          ['201 Exponential formulations', '59', 'Lesson, subtour and MTZ trainers'],
          ['202 Row generation', '28', 'Lesson, row-generation trainer'],
          ['203 Fractional cuts', '18', 'Lesson, fractional-separation trainer'],
          ['204 Gomory cuts', '49', 'Lesson, Chvátal–Gomory and Gomory trainers (all tableaux reproduced exactly)'],
          ['205 MIR cuts', '25', 'Lesson, MIR trainer'],
          ['206 Problem-specific valid inequalities', '76', 'Three lessons; clique, cover, lifting, flow-cover and lot-sizing trainers'],
          ['E201 Cutting planes for nonlinear functions', '74', 'Lesson, Kelley and perspective trainers'],
          ['Lab notebooks 104, 105a–d, 106, 201, 202a, 202b', '10 notebooks', 'Lab data (they sometimes differ from the slides), JuMP/Gurobi page'],
          ['Assignment 1 (Steiner tree)', '1 notebook', 'Read for context only. Your own solution notebook was read too and is deliberately <b>not</b> reproduced anywhere in the app.'],
          ['Project material (proposal, Bucarey et al. 2022, companion manuscript)', '48', 'One reference in the Benders lesson'],
        ],
      },
      after: 'Slides are 610 pages in total. Their text was extracted from the PDFs; a few figure pages were also checked as images (the graphs of solved exercises 1 and 3B, the formulation-strength trees). On five pages of deck 201 and a few others the PDF itself shows “[Math Processing Error]” instead of a formula; those formulas were reconstructed from the surrounding text.',
    },
    {
      title: 'Resources folder (read by sub-agents)',
      html: '<p>All 55 PDFs were processed page by page: 15,601 pages in the whole course folder, 14,915 of them here. The table lists every file so you can see nothing was skipped; “role” says whether it fed the app.</p>',
      table: {
        headers: ['Document', 'Pages', 'Role in the app'],
        rows: RESOURCES.map(([name, pages]) => [name, String(pages), USED[name] || 'Read and summarised; background only (not on the INDU 6361 syllabus, or covered better by the slides).']),
      },
      after: 'Most of these books are about continuous, convex or numerical optimisation, linear algebra or discrete mathematics. They were read as instructed, but they are not exam material for this course and the app does not pretend otherwise.',
    },
    {
      title: 'Web research',
      html: `<p>Two research passes fetched 154 documents successfully (30 more could not be retrieved): exam papers and problem sets with solutions, lecture notes, and solver documentation. <b>No past exam of INDU 6361 or of this instructor was found online.</b> The closest matches in style and content are listed below; the complete per-source table is generated from the question files at the bottom of this page.</p>
<ul>
<li>TU Delft WI4410 <i>Advanced Discrete Optimization</i>, exams 2017–2020 with solutions (Gomory and GMI cuts, cover lifting, flow covers, split cuts).</li>
<li>MIT OCW 15.083J <i>Integer Programming and Combinatorial Optimization</i> (midterm, final, problem sets) and 15.053 (branch and bound, Gomory cuts, IP modelling), all with solutions.</li>
<li>Politecnico di Milano, <i>Foundations of Operations Research</i>, exercises with full branch-and-bound trees and Gomory tableaux.</li>
<li>KTH SF2812 <i>Applied Linear Optimization</i>, final exams 2008–2023 (Lagrangian duals, Dantzig–Wolfe, cutting stock).</li>
<li>EPFL, Bonn, TU Berlin, Simon Fraser, Iowa, Ohio, IISc, NTNU, Chalmers, University of Washington and others; Fisher’s guide to Lagrangian relaxation; the Desrosiers–Lübbecke primer on column generation; JuMP and Gurobi documentation.</li>
</ul>`,
    },
    {
      title: 'How answers were checked',
      html: `<ul>
<li><b>Trainers</b> compute their answer keys in the browser with exact rational arithmetic (no rounding error): an exact simplex method, branch and bound, graph algorithms, cover/lifting enumeration, cut derivations. An automated test suite reproduces every numerical example of the slides and solved exercises (the nine-node workshop tree and its log, both Gomory examples with all tableaux, the Dijkstra, Kruskal, Edmonds–Karp, Hungarian and knapsack traces, the cover/lifting/facet example, the Kelley table, the perspective cuts) and cross-checks random instances against brute force.</li>
<li><b>Every trainer</b> is built on its presets and on 120 random instances in the tests, and each answer key is fed back through its own grader.</li>
<li><b>Course questions</b> use the instructor’s numbers; the few with numbers of the app’s own say so.</li>
<li><b>External questions</b> (679): the answer keys were recomputed by the converting sub-agents (enumeration, exact LPs); 434 use the source’s own solution and 245 a solution worked for the app, and each question says which. Where a source contains a misprint the explanation says so. The lead assistant recomputed a sample by hand and found no error, but did <b>not</b> re-derive all 679.</li>
</ul>`,
    },
    {
      title: 'Known limits',
      html: `<ul>
<li>This is AI-written study material. It can contain mistakes; when a page disagrees with the instructor’s slides, the slides win. External questions use other courses’ notation.</li>
<li>The midterm date, exam duration and permitted materials are not in the outline; set the date in Settings when it is announced.</li>
<li>Trainer conventions follow the solved exercises (alphabetical ties, strict improvement, workers and jobs in numerical order, best-bound node selection). An exam question may state a different rule: read it first.</li>
<li>For the Hungarian method the slides first assign two workers greedily, whereas the solved exercise and the trainer assign workers in numerical order; intermediate steps differ slightly, results do not.</li>
<li>The readiness percentage on the Today page measures first-try accuracy inside this app. It is a study signal, not a grade prediction.</li>
</ul>`,
    },
  ],
};
