// Coverage ledger shown on the Sources page: what the content is built from, who read it, how it was checked.
// State of 24 October 2026 (first version 8 October 2026).
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
      html: `<p>Everything here was produced by an AI assistant (Claude) working from the files in your INDU 6361 course folder and from web research, in October 2026 (first version 8 October, update 24 October). The course outline allows generative AI “to support learning”; exams do not allow it, which is why the trainer is designed to make you do the work on paper.</p>
<ul>
<li><b>Lessons, trainers, the course question bank and the cheat sheet</b> for Modules 1 and 2 were written by the lead assistant directly from the text of the instructor’s slides, solved exercises and lab notebooks, which it read in full (twice). Numbers are the instructor’s; wording is paraphrased.</li>
<li><b>The update of 24 October 2026</b> added the instructor’s new material: the HTML reading versions of the decks and exercise sheets, the longer deck 103, the extra decks EXTRA-201 and EXTRA-202, and the exercise sheets 10E and 20E. It also added the <b>Exercises</b> page (all 22 exercises of 10E and 20E, with hints and the instructor’s solutions step by step) and a glossary of the technical terms. The section “Update of 24 October 2026” below lists what changed and how it was checked.</li>
<li><b>Lessons for classes 7–10</b> (heuristics, Lagrangian relaxation, Benders, column generation) were written <b>before the instructor released those slides</b>, and those slides were still not in the course folder on 24 October. They follow the course outline and the textbook, with small examples of the app’s own that are verified by computation. Expect differences in notation and emphasis when the real slides arrive.</li>
<li><b>The 55 PDFs of the Resources folder</b> (14,915 pages) were read by assistant sub-agents that wrote page-referenced notes; the lead assistant did not read those books itself and used the notes only where stated below.</li>
<li><b>External questions</b> come from exams, problem sets and lecture notes of other universities found on the web, and from five documents of the Resources folder. Each one shows its source when you answer it. Where a source uses other letters or another convention than the slides, its explanation now says so.</li>
<li><b>Your own notes</b> in the course folder, <code>claude.md</code> (your tutoring brief) and <code>study-notes/course-inventory.md</code>, are not instructor material. They were read only to shape the style of the explanations: short sentences, every term defined, steps named, and “(beyond the slides)” on anything the instructor did not teach.</li>
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
          ['103 Relaxations', '21', 'Lesson and questions. The deck grew from 6 to 21 pages; the new material is the surrogate relaxation (pp. 12–14) and the reference Glover (1968), <i>Surrogate Constraints</i>, Operations Research 16(4)'],
          ['104 Formulations', '55', 'Lesson, big-M / fixed-charge / facility-location trainers'],
          ['105 Well-Solved Problems (two files)', '84', 'Five lessons and the Dijkstra, Kruskal/Prim, Edmonds–Karp, Hungarian and knapsack trainers. <code>105-well-solved-problems.pdf</code> and <code>5. Well-Solved-Problems.pdf</code> are byte-identical (same MD5 checksum)'],
          ['106 Integrality Property', '23', 'Lesson, TU and cut trainers'],
          ['10E Exercises (statements only, new)', '13', 'The eight exercises of 10E (1, 1B, 2, 2B, 3, 3B, 4, 5) without solutions, word for word the statement pages of the solved file: practise them cold on the Exercises page'],
          ['10E Solved exercises (two copies)', '84', 'Presets and tie rules of the algorithm trainers; every trace is reproduced by the test suite. The copy re-issued on 19 October in <i>Sample Exercises</i> has the same text and pixel-identical figures; only the typesetting changed and the final answers are now boxed'],
          ['201 Exponential formulations', '59', 'Lesson, subtour and MTZ trainers'],
          ['202 Row generation', '28', 'Lesson, row-generation trainer'],
          ['203 Fractional cuts', '18', 'Lesson, fractional-separation trainer'],
          ['204 Gomory cuts', '49', 'Lesson, Chvátal–Gomory and Gomory trainers. The trainers show the optimal tableau before each cut exactly as on the slides (without the slides’ $z$ column); the tests also check both final tableaux'],
          ['205 MIR cuts', '25', 'Lesson, MIR trainer'],
          ['206 Problem-specific valid inequalities', '76', 'Three lessons; clique, cover, lifting, flow-cover and lot-sizing trainers'],
          ['EXTRA-201 Nonlinear Cutting Planes (formerly E201)', '74', 'Lesson, tangent-cut (“Kelley”) and perspective trainers. A cosmetic revision of E201: new title, serif figure labels, logo moved; no slide added, removed or reworded. The old E201 file is still in the folder'],
          ['EXTRA-202 MTZ to MCF formulation proof (new)', '13', 'TSP lesson and cheat sheet: the proof that the multicommodity-flow LP bound is at least the MTZ LP bound with $M=n-1$. Further reading on its last page: <i>Discrete Applied Mathematics</i> (2001), https://www.sciencedirect.com/science/article/pii/S0166218X00003139'],
          ['20E Exercises (statements only, new)', '40', 'The 14 Module 2 exercise statements without solutions'],
          ['20E Solved exercises (new)', '104', 'The Exercises page (all 14 exercises with the instructor’s solutions step by step), a trainer preset for each exercise (ids 20e1–20e14), cheat-sheet lines, lesson additions'],
          ['Lab notebooks 104, 105a–d, 106, 201, 202a, 202b', '9 notebooks', 'Lab data (they sometimes differ from the slides), JuMP/Gurobi page'],
          ['Assignment 1 (Steiner tree)', '1 notebook', 'Read for context only. Your own solution notebook was read too and is deliberately <b>not</b> reproduced anywhere in the app.'],
          ['Project material (proposal, Bucarey et al. 2022, companion manuscript)', '48', 'One reference in the Benders lesson'],
        ],
      },
      after: 'The slides are 554 pages in total (14 decks: 101–106, 201–206, EXTRA-201 and EXTRA-202; the two identical 105 files count once, and the old E201 is not counted again) and the exercise sheets 241 pages (10E: 13 + 84; 20E: 40 + 104). Their text was extracted from the PDFs, and the readers of the update also viewed the pages as images. On seven pages of deck 201 (pp. 19, 23, 25, 30, 34, 40, 45), and on no other deck, the PDF shows “[Math Processing Error]” instead of a formula. The app first reconstructed those formulas from the surrounding text; the reading version renders all seven, and every reconstruction matched.',
    },
    {
      title: 'Update of 24 October 2026: the reading versions',
      html: '<p>The instructor added an HTML “reading” version (<code>.reading.html</code>) next to 17 documents: decks 101, 102, 103, 104, 106 (there is none for 105), 201–206, EXTRA-201, EXTRA-202, and the four 10E and 20E sheets. Each one was compared line by line with its PDF. Apart from rewording, they contain the same material as the PDFs. The table lists every difference that matters for study. Where a reading version drops something that the PDF has, the app keeps it, because it is still the instructor’s material.</p>',
      table: {
        headers: ['Reading version', 'Compared with', 'What is different'],
        rows: [
          ['101 Introduction', 'PDF, 13 pp.', 'The readiness check is now “Preliminary knowledge”, with answers; its question 4 (a small directed network) was dropped. Everything else is word for word the same.'],
          ['102 Branch and bound', 'PDF, 16 pp.', 'Restructured. New: the “band” pictures ($41\\le x+10y\\le51.3$ and the narrower bands of the children), a separate example whose LP optimum $(2,4)$ is already integer, the completion rule (an incumbent at the end is optimal; no incumbent means infeasible) and “equality is enough when seeking one optimal solution”. Dropped: the “implicit enumeration” slide and the terminology table. All tree and log numbers are identical.'],
          ['103 Relaxations', 'PDF, 21 pp.', 'Same text as the new 21-page PDF; only the link to Glover (1968) is added.'],
          ['104 Formulations', 'PDF, 55 pp.', 'New short slides: choosing the coefficients $M_1=6$, $M_2=5$; computing $M^*$ is itself an optimisation problem; the mixed-integer hull does not move when $M$ grows; weak big-M rows mean branching on activation variables. Sliders let you change $M=\\alpha U$. Dropped: the optimal-face sentence and the p. 33 box (kept in the app).'],
          ['106 Integrality property', 'PDF, 23 pp.', 'Same text; one figure title is fully legible.'],
          ['201 Exponential formulations', 'PDF, 59 pp.', 'Same prose. It renders the seven formulas that the PDF shows as “[Math Processing Error]”. One image description says “three cycles” where the figure shows five 2-cycles; the figure is right.'],
          ['202 Row generation', 'PDF, 28 pp.', 'Same text, plus all 12 frames of the lecture run (9 solves, 8 rows, bound 330.19 → 367.21); the PDF shows only the last frame.'],
          ['203 Fractional cuts', 'PDF, 18 pp.', 'Restructured. New: the separation problem written as an integer program $\\theta(\\bar x)$ and read as a minimum-capacity cut; the two ways an integer candidate reaches the lazy callback; “judge by total solution time”; two research references (2022). Dropped (kept in the app): the proof that MCF points satisfy every subtour row, the numbers 511.43 / 515.85, the “most violated row” slide and the lazy-versus-user paragraph.'],
          ['204 Gomory cuts', 'PDF, 49 pp.', 'New: rounding both sloping rows (corner $(1.5,4.5)$, bound 46.5), the combination that gives $y\\le4$ (before only in 206), why coefficients round toward $-\\infty$. All tableaux are character for character the same.'],
          ['205 MIR cuts', 'PDF, 25 pp.', 'The three-variable example is replaced by an equivalent one that uses an upper bound: $x+y+z\\le3.5$, $u=1-z$, cut $x+y+2z\\le4$, bound $-4.5\\to-4$. The rest is reworded.'],
          ['206 Valid inequalities', 'PDF, 76 pp.', 'New: the root bound 14 with the extended cover, the workshop integer hull and the facet $y\\le4$ in the plane. Dropped (kept in the app): the algebraic proof of the bound 12 and the slide with $26/3$.'],
          ['EXTRA-201, EXTRA-202', 'PDFs, 74 and 13 pp.', 'Same text as the PDFs.'],
          ['10E, 20E (statements and solved)', 'PDFs, 13, 84, 40, 104 pp.', 'Same text as the PDFs. Some data (the graphs of 10E 2B and 3B, the full knapsack table) appear only in the figures; the app states them in text.'],
        ],
      },
    },
    {
      title: 'Update of 24 October 2026: how it was checked',
      html: `<ul>
<li><b>Ten reading groups.</b> Ten assistant sub-agents each took one group of documents (101–102; 103–104; 106, 201 and EXTRA-202; 202–203; 204–205; 206; EXTRA-201; 10E; 20E exercises 1–6; 20E exercises 7–14). Each read every line of its reading versions and PDFs, viewed the PDF pages as images, and wrote a report: what changed, what the app lacked, where the app disagreed with the instructor, and every worked example recomputed.</li>
<li><b>Ten independent audits.</b> A second sub-agent re-read the same documents for each report, without trusting it, and marked every item confirmed, corrected or refuted. Only confirmed or corrected items were put into the app; refuted items were not.</li>
<li><b>Recomputation.</b> Every number of the new material (tableaux, cuts, bounds, covers, flows, the EXTRA-202 proof on random instances) was recomputed by the readers, mostly with the app’s own exact rational solvers, and again by the auditors with code of their own.</li>
<li><b>No wrong instructor number was found.</b> The app had a few statements that were outdated or too strong (for example “using $M=n$ in MTZ is a mistake”: the slides say any $M\\ge n-1$ is valid); the update corrects them.</li>
</ul>`,
    },
    {
      title: 'Resources folder (read by sub-agents)',
      html: '<p>All 55 PDFs were processed page by page: 14,915 pages here, out of 16,028 pages in 85 PDFs in the whole course folder on 24 October 2026. The table lists every file so you can see nothing was skipped; “role” says whether it fed the app.</p>',
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
<li><b>Trainers</b> compute their answer keys in the browser with exact rational arithmetic (no rounding error): an exact simplex method, branch and bound, graph algorithms, cover/lifting enumeration, cut derivations. An automated test suite reproduces every numerical example of the slides and solved exercises (the nine-node workshop tree and its log, both Gomory examples with their optimal and final tableaux, the Dijkstra, Kruskal, Edmonds–Karp, Hungarian and knapsack traces, the cover/lifting/facet example, the Kelley table, the perspective cuts) and cross-checks random instances against brute force.</li>
<li><b>Every trainer</b> is built on its presets and on 120 random instances in the tests, and each answer key is fed back through its own grader.</li>
<li><b>Exercises</b> (10E and 20E): the self-check fields of every exercise are fed through the same grader in the tests, and every trainer link must open an existing preset.</li>
<li><b>Course questions</b> use the instructor’s numbers; the few with numbers of the app’s own say so.</li>
<li><b>External questions</b> (679): the answer keys were recomputed by the converting sub-agents (enumeration, exact LPs); 434 use the source’s own solution and 245 a solution worked for the app, and each question says which. Where a source contains a misprint the explanation says so. The lead assistant recomputed a sample by hand and found no error, but did <b>not</b> re-derive all 679.</li>
</ul>`,
    },
    {
      title: 'Known limits',
      html: `<ul>
<li>This is AI-written study material. It can contain mistakes; when a page disagrees with the instructor’s slides, the slides win. External questions use other courses’ notation; the most confusing differences are flagged in their explanations.</li>
<li>The slides of classes 7–10 were still not in the course folder on 24 October 2026, so those lessons are “ahead of the slides”.</li>
<li>The midterm date, exam duration and permitted materials are not in the outline or in any of the new documents; set the date in Settings when it is announced.</li>
<li>Lab 202b announces a notebook 202c (fractional separation); it is not in the course folder, so the app could not use it.</li>
<li>Trainer conventions follow the solved exercises (alphabetical ties, strict improvement, workers and jobs in numerical order, best-bound node selection). An exam question may state a different rule: read it first.</li>
<li>For the Hungarian method the slides first assign two workers greedily, whereas the solved exercise and the trainer assign workers in numerical order; intermediate steps differ slightly, results do not.</li>
<li>Where the PDF and the reading version of a deck differ (102, 104, 203 and 205 most of all), both are the instructor’s material: the app keeps what the PDF has and adds what the reading version adds. An exam may use either wording.</li>
<li>The readiness percentage on the Today page measures first-try accuracy inside this app. It is a study signal, not a grade prediction.</li>
</ul>`,
    },
  ],
};
