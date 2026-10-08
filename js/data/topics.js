// Syllabus map. "released" = the instructor's slides for the topic were available when this app was built
// (8 October 2026). "weight" is this app's planning weight for the study plan, not an official exam weight.
export const MODULES = [
  { id: 'm1', title: 'Module 1 · Foundations', note: 'Slides 101–106 and the solved exercises (10E).' },
  { id: 'm2', title: 'Module 2 · Exponential formulations and cutting planes', note: 'Slides 201–206 and E201.' },
  { id: 'm3', title: 'Module 3 · Heuristics and decomposition', note: 'Classes 7–10 of the outline. The slides were not yet released when this app was built, so these lessons follow the course outline and the textbook (Wolsey), not the instructor’s own examples.' },
  { id: 'm0', title: 'Refreshers and tools', note: 'Prerequisites the course assumes, and the software used in the labs.' },
];

export const TOPICS = [
  { id: 't101', module: 'm1', code: '101', title: 'Modelling and problem classes', short: 'Modelling', released: true, weight: 2,
    blurb: 'LP, IP, BP and MIP; knapsack, assignment and set covering; why enumeration fails.' },
  { id: 't102', module: 'm1', code: '102', title: 'Branch and bound', short: 'Branch & bound', released: true, weight: 5,
    blurb: 'Primal and dual bounds, incumbents, fathoming, gaps, the search-tree log and solver termination.' },
  { id: 't103', module: 'm1', code: '103', title: 'Relaxations', short: 'Relaxations', released: true, weight: 3,
    blurb: 'What a relaxation is, which way its bound points, when its optimum is optimal, and how to compare two relaxations.' },
  { id: 't104', module: 'm1', code: '104', title: 'Formulations and their strength', short: 'Formulations', released: true, weight: 5,
    blurb: 'Root gap, integer hull, fixed charges, disjunctions, the smallest valid big-M, extended formulations and projection.' },
  { id: 't105a', module: 'm1', code: '105', title: 'Shortest paths: Dijkstra', short: 'Dijkstra', released: true, weight: 4,
    blurb: 'Label-setting with the exam tie rules; predecessors and path recovery.' },
  { id: 't105b', module: 'm1', code: '105', title: 'Minimum spanning trees: Kruskal and Prim', short: 'Spanning trees', released: true, weight: 4,
    blurb: 'Greedy edge selection, cycle test, the cut property and uniqueness.' },
  { id: 't105c', module: 'm1', code: '105', title: 'Maximum flow and minimum cut', short: 'Max flow', released: true, weight: 4,
    blurb: 'Edmonds–Karp augmentations, residual and reverse arcs, the minimum cut as a certificate.' },
  { id: 't105d', module: 'm1', code: '105', title: 'Assignment: the Hungarian method', short: 'Hungarian', released: true, weight: 4,
    blurb: 'Reductions, alternating paths, the Δ update and the dual lower bound.' },
  { id: 't105e', module: 'm1', code: '105', title: 'Knapsack by dynamic programming', short: 'Knapsack DP', released: true, weight: 4,
    blurb: 'The F(i, c) table, reconstruction with the tie rule, pseudo-polynomial running time.' },
  { id: 't106', module: 'm1', code: '106', title: 'Integrality and total unimodularity', short: 'Integrality & TU', released: true, weight: 4,
    blurb: 'Integral polyhedra, network flow models, min-cut as an integer program, recognising TU matrices.' },

  { id: 't201', module: 'm2', code: '201', title: 'TSP and exponential formulations', short: 'TSP formulations', released: true, weight: 5,
    blurb: 'Degree constraints and cycle covers; MTZ, multicommodity flow and cutset formulations and their strength.' },
  { id: 't202', module: 'm2', code: '202', title: 'Row generation and lazy constraints', short: 'Row generation', released: true, weight: 4,
    blurb: 'Master problem, separation, correctness and termination; callbacks and branch-and-cut.' },
  { id: 't203', module: 'm2', code: '203', title: 'Separating fractional points', short: 'Fractional cuts', released: true, weight: 3,
    blurb: 'Subtour separation as a minimum cut; lazy constraints versus user cuts.' },
  { id: 't204', module: 'm2', code: '204', title: 'Rounding, Chvátal–Gomory and Gomory cuts', short: 'Gomory cuts', released: true, weight: 5,
    blurb: 'Integer rounding, CG multipliers, cuts from a simplex tableau row and substitution of the slacks.' },
  { id: 't205', module: 'm2', code: '205', title: 'Mixed-integer rounding', short: 'MIR cuts', released: true, weight: 3,
    blurb: 'The basic MIR inequality z + u/f ≥ k + 1 and how to bring a row into that form.' },
  { id: 't206a', module: 'm2', code: '206', title: 'Clique and cover inequalities', short: 'Cliques & covers', released: true, weight: 5,
    blurb: 'Conflict cliques; covers, minimal covers, extended covers and their separation problems.' },
  { id: 't206b', module: 'm2', code: '206', title: 'Lifting, facets and dominance', short: 'Lifting & facets', released: true, weight: 4,
    blurb: 'Sequential lifting coefficients, faces and facets by affine independence, comparing inequalities.' },
  { id: 't206c', module: 'm2', code: '206', title: 'Flow cover and lot-sizing inequalities', short: 'Flow cover & lot sizing', released: true, weight: 3,
    blurb: 'Fixed-charge flow structures and cumulative set-up bounds.' },
  { id: 'tE201', module: 'm2', code: 'E201', title: 'Cutting planes for convex functions', short: 'Tangent cuts', released: true, weight: 3,
    blurb: 'Epigraph form, tangent cuts, the Kelley loop with its bounds, perspective cuts for on/off variables.' },

  { id: 't301', module: 'm3', code: 'Class 7', title: 'Heuristics', short: 'Heuristics', released: false, weight: 3,
    blurb: 'Constructive methods, local search, metaheuristics, rounding and repair, MIP starts.' },
  { id: 't401', module: 'm3', code: 'Class 8', title: 'Lagrangian relaxation', short: 'Lagrangian', released: false, weight: 4,
    blurb: 'Dualising constraints, the Lagrangian dual, subgradient steps, strength versus the LP bound.' },
  { id: 't402', module: 'm3', code: 'Class 9', title: 'Benders decomposition', short: 'Benders', released: false, weight: 4,
    blurb: 'Master and subproblem, optimality and feasibility cuts from dual solutions and rays.' },
  { id: 't403', module: 'm3', code: 'Class 10', title: 'Dantzig–Wolfe and column generation', short: 'Column generation', released: false, weight: 4,
    blurb: 'Reformulation by extreme points, restricted master, pricing by reduced cost, branch-and-price.' },

  { id: 't001', module: 'm0', code: 'Prereq', title: 'Linear programming and duality refresher', short: 'LP & duality', released: true, weight: 2,
    blurb: 'Extreme points, the simplex tableau, weak and strong duality, complementary slackness.' },
  { id: 't002', module: 'm0', code: 'Prereq', title: 'Complexity and graph vocabulary', short: 'Complexity & graphs', released: true, weight: 1,
    blurb: 'Polynomial versus pseudo-polynomial algorithms, NP-hardness, cuts, cycles and trees.' },
  { id: 't501', module: 'm0', code: 'Labs', title: 'Julia, JuMP and Gurobi in the labs', short: 'JuMP & Gurobi', released: true, weight: 1,
    blurb: 'Building models, reading the solver log, termination status, callbacks.' },
];

export const topicById = (id) => TOPICS.find((t) => t.id === id) || null;
export const topicsOfModule = (m) => TOPICS.filter((t) => t.module === m);
export const moduleById = (id) => MODULES.find((m) => m.id === id) || null;

// Scopes used by the exam simulator and the study plan.
export const SCOPES = {
  m1: { label: 'Module 1 only', topics: TOPICS.filter((t) => t.module === 'm1').map((t) => t.id) },
  m12: { label: 'Modules 1 and 2 (everything released so far)', topics: TOPICS.filter((t) => t.module === 'm1' || t.module === 'm2').map((t) => t.id) },
  all: { label: 'Whole course (final exam)', topics: TOPICS.filter((t) => t.module !== 'm0').map((t) => t.id) },
};
