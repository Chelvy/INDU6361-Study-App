// Sheet 20E (Module 2), transcribed from the instructor's "20E: Exercises" and "20E: Solved Exercises".
// Statements and solution steps follow the solved version; wording is simplified, numbers are the instructor's.
import { graphFigure, plotFigure } from '../../viz.js';

const R = String.raw;
const SRC = '20E Solved Exercises (T. Schettini), section';

// ---------------------------------------------------------------- figures
const tourFig = () => graphFigure({
  nodes: ['1', '2', '3', '4', '5', '6'], directed: true, height: 300,
  pos: { 1: [0, 0], 2: [2, 0], 3: [4, -1], 4: [4, -3], 5: [2, -4], 6: [0, -3] },
  edges: [['1', '2'], ['2', '3'], ['3', '4'], ['4', '5'], ['5', '6'], ['6', '1']].map(([u, v]) => ({ u, v, cls: 'sel' })),
  caption: 'Six locations at (0,0), (2,0), (4,1), (4,3), (2,4), (0,3) and the tour 1 → 2 → 3 → 4 → 5 → 6 → 1.',
});

const fracFig = (hl) => graphFigure({
  nodes: ['1', '2', '3', '4'], directed: true, height: 280,
  pos: { 1: [0, 0], 2: [2, 0], 3: [0, 2], 4: [2, 2] },
  nodeCls: hl ? { 1: 'settled', 2: 'settled' } : {},
  edges: [
    { u: '1', v: '2', label: '0.8' }, { u: '2', v: '1', label: '0.8' }, { u: '3', v: '4', label: '0.8' }, { u: '4', v: '3', label: '0.8' },
    { u: '1', v: '3', label: '0.2', cls: hl ? 'hl' : '' }, { u: '3', v: '1', label: '0.2' }, { u: '2', v: '4', label: '0.2', cls: hl ? 'hl' : '' }, { u: '4', v: '2', label: '0.2' },
  ],
  caption: hl ? 'S = {1, 2} (filled). Only the arcs 1→3 and 2→4 leave S, carrying 0.2 + 0.2 = 0.4.' : 'Arc values of the current point. Each pair of opposite arcs has the value shown on each of them.',
});

const cyclesFig = () => graphFigure({
  nodes: ['1', '4', '7', '2', '8', '5', '9', '3', '6'], directed: true, height: 260,
  pos: { 1: [0.5, 0], 4: [1, 1.3], 7: [0, 1.3], 2: [2, 0], 8: [3, 0], 5: [3, 1.3], 9: [2, 1.3], 3: [4.2, 0.2], 6: [4.2, 1.1] },
  edges: [['1', '4'], ['4', '7'], ['7', '1'], ['2', '8'], ['8', '5'], ['5', '9'], ['9', '2'], ['3', '6'], ['6', '3']].map(([u, v]) => ({ u, v, cls: 'sel' })),
  caption: 'Every arc drawn has value 1; all other arcs have value 0.',
});

const roundFig = (extra) => plotFigure({
  xmax: 7, ymax: 5,
  cons: [{ a: 2, b: 3, c: 38 / 3 }, { a: -2, b: -1, c: -2 / 3 }, { a: -0.5, b: 1.5, c: 1.75 }],
  extra: extra || [],
  caption: extra ? 'Dashed: the rounded inequalities. Every integer point that was feasible is still feasible.' : 'Rows (a), (b), (c) with x, y ≥ 0. Black dots: feasible integer points.',
});

const gomory5Fig = (cut) => plotFigure({
  xmax: 3, ymax: 3,
  cons: [{ a: 2, b: 1, c: 4 }, { a: 1, b: 2, c: 4 }],
  extra: cut ? [{ a: 1, b: 1, c: 2.5 }, { a: 1, b: 1, c: 2, cls: 'second' }] : [],
  marks: [{ x: 4 / 3, y: 4 / 3, cls: 'lp', label: '(4/3, 4/3)' }],
  caption: cut ? 'Red dashed: the Gomory cut x + y ≤ 5/2. Green dashed: after further rounding, x + y ≤ 2.' : 'LP region and the fractional optimum (4/3, 4/3).',
});

const gomory6Fig = (cut) => plotFigure({
  xmax: 3, ymax: 3,
  cons: [{ a: 2, b: 1, c: 5 }, { a: -1, b: 2, c: 2 }],
  extra: cut ? [{ a: 0, b: 1, c: 1 }, { a: 0, b: 1, c: 1.5, cls: 'second' }] : [],
  marks: [{ x: 1.6, y: 1.8, cls: 'lp', label: '(8/5, 9/5)' }],
  caption: cut ? 'Red dashed: y ≤ 1 (from the y row). Green dashed: y ≤ 3/2 (from the x row).' : 'LP region and the fractional optimum (8/5, 9/5).',
});

const mir7Fig = (cut) => plotFigure({
  xmax: 3, ymax: 10, lattice: false,
  cons: [{ a: 1, b: 0, c: 3 }, { a: -4, b: 1, c: 0 }, { a: 0, b: 1, c: 10 }],
  extra: cut ? [{ a: -2, b: 1, c: 4 }] : [],
  segments: [{ x1: 0, y1: 0, x2: 0, y2: 0 }, { x1: 1, y1: 0, x2: 1, y2: 4 }, { x1: 2, y1: 0, x2: 2, y2: 8 }, { x1: 3, y1: 0, x2: 3, y2: 10 }],
  marks: [{ x: 2.5, y: 10, cls: 'lp', label: '(2.5, 10)' }],
  caption: cut ? 'The MIR line y = 4 + 2x joins (2, 8) and (3, 10) and removes the corner (2.5, 10).' : 'Shaded: LP relaxation. Black segments: the feasible points (x integer, y continuous).',
});

const mir8Fig = (cut) => plotFigure({
  xmax: 5, ymax: 1, lattice: false, names: ['r = x1 + x2', 'y'],
  cons: [{ a: 1, b: 0, c: 4 }, { a: 1, b: 1, c: 4.4 }],
  extra: cut ? [{ a: 3, b: 5, c: 14 }] : [],
  segments: [0, 1, 2, 3].map((r) => ({ x1: r, y1: 0, x2: r, y2: 1 })).concat([{ x1: 4, y1: 0, x2: 4, y2: 0.4 }]),
  marks: [{ x: 3.4, y: 1, cls: 'lp', label: '(3.4, 1)' }],
  caption: cut ? 'In the sum coordinate r = x1 + x2 the cut 3r + 5y ≤ 14 joins (3, 1) and (4, 0.4).' : 'Projection on r = x1 + x2 and y. Black segments: feasible values of y for each integer r.',
});

const conflictFig = () => graphFigure({
  nodes: ['1', '2', '3', '4', '5'], height: 240,
  pos: { 1: [0, 0], 2: [0, 2], 3: [1.5, 1], 4: [3, 0], 5: [3, 2] },
  edges: [['1', '2'], ['1', '3'], ['2', '3'], ['3', '4'], ['3', '5'], ['4', '5']].map(([u, v]) => ({ u, v })),
  caption: 'Conflict graph: one vertex per job, one edge per pair that cannot both be selected.',
});

const pentagonFig = (step) => plotFigure({
  xmax: 3, ymax: 3,
  cons: [{ a: 1, b: 0, c: 2 }, { a: 0, b: 1, c: 2 }, { a: 1, b: 1, c: 3 }].concat(step >= 1 ? [{ a: 2, b: 1, c: 4.5 }] : []),
  extra: step >= 2 ? [{ a: 2, b: 1, c: 4, cls: 'second' }] : [],
  marks: step >= 1 ? [{ x: 2, y: 1, cls: 'lp', label: '(2, 1) cut off' }] : [],
  caption: step === 0 ? 'The pentagon P with corners (0,0), (2,0), (2,1), (1,2), (0,2).' : step === 1 ? 'P after adding 2x + y ≤ 4.5: the corner (2, 1) is removed.' : 'Green dashed: the edge 2x + y = 4 of the integer hull Q.',
});

const channelsFig = () => graphFigure({
  nodes: ['1', '2', '3', 'W'], directed: true, height: 250,
  pos: { 1: [0, 0], 2: [0, 1], 3: [0, 2], W: [2.6, 1] },
  nodeNames: { W: 'W' },
  edges: [{ u: '1', v: 'W', label: 'y1 ≤ 7x1' }, { u: '2', v: 'W', label: 'y2 ≤ 9x2' }, { u: '3', v: 'W', label: 'y3 ≤ 5x3' }],
  caption: 'Three optional delivery channels into a warehouse W that can receive at most 12 units in total.',
});

// ---------------------------------------------------------------- exercises
export const E20 = [
  {
    n: 1, topic: 't201', title: 'MTZ: how big must M be?', blurb: 'Six cities, one given tour. Show that $M=4$ fails and find the smallest $M$.',
    trainer: { drill: 'mtz', preset: '20e1', label: 'Check the smallest M in the MTZ trainer' },
    src: `${SRC} “TSP formulations”, Exercise 1 (pages “Big-M” to “Check M=5”).`,
    statement: R`<p>Let $V=\{1,\dots,6\}$ and $A=\{(i,j): i\ne j\}$. The model is</p>
$$\begin{aligned}\min\ &\textstyle\sum_{(i,j)\in A}c_{ij}x_{ij}\\ \text{s.t. }&\textstyle\sum_{j\ne i}x_{ij}=1\ \ (i\in V),\qquad \sum_{j\ne i}x_{ji}=1\ \ (i\in V),\\ &u_i-u_j+1\le M(1-x_{ij})\quad (i,j\ne 1,\ i\ne j),\\ &x_{ij}\in\{0,1\}.\end{aligned}$$
<p>The <b>position variables</b> $u_i$ are continuous (any real number). Costs $c_{ij}$ are Euclidean distances. Selected arcs have $x_{ij}=1$, all other arcs $x_{ij}=0$.</p>`,
    figure: tourFig,
    parts: [
      {
        short: 'M = 4', q: R`For the tour $1\to2\to3\to4\to5\to6\to1$, write the MTZ formulation and show that $M=4$ makes this tour infeasible. Name the violated constraint.`,
        hints: [
          R`Only arcs between vertices <b>other than 1</b> have an ordering row. Which selected arcs are those? Write their rows with $x_{ij}=1$: the right-hand side $M(1-1)$ is $0$.`,
          R`Add the four rows of the selected arcs $(2,3),(3,4),(4,5),(5,6)$: you get a bound on $u_6-u_2$. Now look at the row of the <b>unselected</b> arc $(6,2)$, where $x_{62}=0$.`,
        ],
        steps: [
          R`The formulation is the one above, with $u_i\in\mathbb R$ for $i\ne1$. The ordering rows exist only for arcs that do not touch vertex 1.`,
          R`Selected arcs give $u_i-u_j+1\le 0$, that is $u_j\ge u_i+1$: $u_3\ge u_2+1$, $u_4\ge u_3+1$, $u_5\ge u_4+1$, $u_6\ge u_5+1$.`,
          R`Adding the four rows: $u_6\ge u_2+4$, so $u_6-u_2+1\ge 5$.`,
          R`The arc $(6,2)$ is <b>not</b> selected, so $x_{62}=0$ and its row reads $u_6-u_2+1\le M$.`,
          R`With $M=4$ this asks $u_6-u_2+1\le 4$, but the selected arcs force $u_6-u_2+1\ge5$. No choice of positions works: the <b>ordering constraint of arc (6,2)</b> is violated, so the tour is infeasible.`,
        ],
      },
      {
        short: 'smallest M', q: R`Find the smallest $M$ that allows this tour, and give feasible values of $u_2,\dots,u_6$.`,
        hints: [
          R`From part 1, $M\ge u_6-u_2+1\ge 5$. Can you choose positions so that 5 is enough?`,
          R`Only <b>differences</b> of positions appear. Start with any value for $u_2$ and add 1 along each selected arc. Then check every unselected row.`,
        ],
        check: [
          { type: 'int', label: 'Smallest $M$', answer: 5 },
        ],
        steps: [
          R`Choose $u_2=2$ and add one along each selected arc: $u_3=3$, $u_4=4$, $u_5=5$, $u_6=6$.`,
          R`Check the selected rows: each gives $0\le0$. The return row $(6,2)$ gives $6-2+1=5\le M$.`,
          R`Every other unselected row has $u_i-u_j+1\le 6-2+1=5$ as well. So $M=5$ works, and part 1 shows that no smaller value does: the smallest value is $M=5=n-1$.`,
        ],
        after: R`The same number $n-1$ appears in the lesson for another reason: if positions are bounded by $2\le u_i\le n$, the largest left-hand side is $n-1$. Here the positions are free, and the tour itself forces the gap.`,
      },
    ],
    traps: [R`Writing ordering rows for arcs that touch vertex 1 (then no tour could close).`, R`Forgetting the <b>unselected</b> arc $(6,2)$: the violation is in its row, not in a selected one.`],
  },
  {
    n: 2, topic: 't203', title: 'Subtour separation at a fractional point', blurb: 'Four vertices, arc values 0.8 and 0.2. Find a violated subtour row and write the separation problem.',
    trainer: { drill: 'fracsep', preset: '20e2', label: 'Practise the separation on this point' },
    src: `${SRC} “Subtour separation”, Exercise 2.`,
    statement: R`<p>For $V=\{1,2,3,4\}$ and $A=\{(i,j):i\ne j\}$, take the <b>degree relaxation</b> (no subtour rows yet):</p>
$$\min \textstyle\sum c_{ij}x_{ij}\quad\text{s.t.}\quad \sum_{j\ne i}x_{ij}=1,\ \ \sum_{j\ne i}x_{ji}=1\ \ (i\in V),\quad 0\le x_{ij}\le1.$$
<p>The current point has $\bar x_{12}=\bar x_{21}=\bar x_{34}=\bar x_{43}=0.8$ and $\bar x_{13}=\bar x_{31}=\bar x_{24}=\bar x_{42}=0.2$; all other arcs are $0$.</p>`,
    figure: () => fracFig(false),
    parts: [
      {
        short: 'feasibility', q: R`Verify that the point satisfies the formulation as written.`,
        hints: [R`Check, for every vertex, the sum of the values of its outgoing arcs, then of its incoming arcs.`],
        steps: [
          R`Vertex 1: out $\bar x_{12}+\bar x_{13}=0.8+0.2=1$, in $\bar x_{21}+\bar x_{31}=1$. The same for vertices 2, 3 and 4: every sum is $0.8+0.2=1$.`,
          R`Every value lies in $[0,1]$. So the point satisfies the formulation. It is <b>not</b> an integer tour.`,
        ],
      },
      {
        short: 'violated row', q: R`Write a generic subtour-elimination constraint, find one that is violated, and write it in <b>outgoing-cut</b> form and in <b>internal-arc</b> form.`,
        hints: [
          R`A tour must leave every nonempty proper subset $S$ at least once: $\sum_{i\in S}\sum_{j\notin S}x_{ij}\ge1$.`,
          R`Look for a set that the 0.8 arcs keep “closed”. Try $S=\{1,2\}$: which arcs leave it?`,
        ],
        check: [
          { type: 'num', label: R`Value of the outgoing arcs of $S=\{1,2\}$ at $\bar x$`, answer: '2/5' },
          { type: 'num', label: 'Violation of the subtour row (how much is missing)', answer: '3/5' },
        ],
        steps: [
          R`Generic row (cut form), for every nonempty proper $S\subset V$: $\sum_{i\in S}\sum_{j\notin S}x_{ij}\ge1$. Using the outgoing degree equations it is equivalent to the internal form $\sum_{i\in S}\sum_{j\in S\setminus\{i\}}x_{ij}\le|S|-1$.`,
          { html: R`Take $S=\{1,2\}$. Cut form: $x_{13}+x_{14}+x_{23}+x_{24}\ge1$. At $\bar x$ the left side is $0.2+0+0+0.2=0.4$: the row is violated by $0.6$.`, figure: () => fracFig(true) },
          R`Internal form: $x_{12}+x_{21}\le1$. At $\bar x$ the left side is $0.8+0.8=1.6$: violated by the same $0.6$.`,
        ],
      },
      {
        short: 'separation model', q: R`Write the optimization problem that separates subtour inequalities, and explain how its solution gives the subset $S$ and the cut.`,
        hints: [
          R`Use a binary $z_i$ that says “vertex $i$ is in $S$” and a variable $w_{ij}$ that must be 1 on arcs leaving $S$. The values $\bar x_{ij}$ are <b>data</b> here.`,
          R`An arc leaves $S$ exactly when $z_i=1$ and $z_j=0$, that is when $z_i-z_j=1$. Exclude the empty set and the full set with a cardinality constraint.`,
        ],
        check: [{ type: 'num', label: R`Optimal value $\theta(\bar x)$`, answer: '2/5' }],
        steps: [
          R`With $n=4$: $$\theta(\bar x)=\min\ \sum_{i\ne j}\bar x_{ij}w_{ij}\quad\text{s.t.}\quad w_{ij}\ge z_i-z_j\ (i\ne j),\quad 1\le\sum_i z_i\le n-1,\quad z_i\in\{0,1\},\ 0\le w_{ij}\le1.$$`,
          R`An arc with $z_i=1$, $z_j=0$ forces $w_{ij}=1$. All other $w_{ij}$ can be $0$ at an optimum, because their costs $\bar x_{ij}$ are nonnegative. So the objective is the value leaving $S$.`,
          R`Read the set as $S=\{i: z_i=1\}$. If $\theta(\bar x)\lt 1$, return the row $\sum_{i\in S}\sum_{j\notin S}x_{ij}\ge1$. If $\theta(\bar x)\ge1$, no subtour row is violated.`,
          R`Here $z=(1,1,0,0)$ gives $S=\{1,2\}$, forces $w_{13}=w_{14}=w_{23}=w_{24}=1$, and $\theta=0.2+0+0+0.2=0.4$. Any set that splits $\{1,2\}$ or $\{3,4\}$ cuts an arc of value 0.8, and the only other candidates ($\{1,2\}$ and $\{3,4\}$) both give $0.4$. So $0.4$ is optimal and the returned cut is $x_{13}+x_{14}+x_{23}+x_{24}\ge1$.`,
        ],
      },
    ],
    traps: [R`Treating $\bar x$ as variables of the separation problem: they are fixed numbers.`, R`Forgetting $1\le\sum_i z_i\le n-1$: without it, $S=\emptyset$ gives the useless value 0.`],
  },
  {
    n: 3, topic: 't202', title: 'Integer separation: three cycles', blurb: 'Nine vertices form three cycles. List every violated subtour row.',
    src: `${SRC} “Subtour separation”, Exercise 3.`,
    trainer: { drill: 'subtours', preset: '20e3', label: 'Practise the subtour rows on this solution' },
    statement: R`<p>Every arc drawn has value 1 and all other arcs have value 0. The degree equations hold.</p>`,
    figure: cyclesFig,
    parts: [
      {
        short: 'model and solution', q: R`Write the base formulation and read the current solution from the graph.`,
        hints: [R`Before any subtour row is added, the model is the degree model with binary arcs. The solution lists the arcs with value 1.`],
        steps: [
          R`With $V=\{1,\dots,9\}$: $\min\sum c_{ij}x_{ij}$ s.t. $\sum_{j\ne i}x_{ij}=1$, $\sum_{j\ne i}x_{ji}=1$ for all $i$, and $x_{ij}\in\{0,1\}$.`,
          R`Current solution: $\bar x_{14}=\bar x_{47}=\bar x_{71}=1$, $\bar x_{28}=\bar x_{85}=\bar x_{59}=\bar x_{92}=1$, $\bar x_{36}=\bar x_{63}=1$, all others 0. Each vertex has one incoming and one outgoing selected arc.`,
        ],
      },
      {
        short: 'separation process', q: R`Explain the separation process and give two violated inequalities.`,
        hints: [R`At an <b>integer</b> point you do not need an optimization model: follow the selected arcs from an unvisited vertex until you come back.`],
        steps: [
          R`Start at an unvisited vertex, follow selected arcs until the cycle closes, and repeat until every vertex is in a cycle. Here the cycles are $A=\{1,4,7\}$, $B=\{2,5,8,9\}$, $C=\{3,6\}$.`,
          R`A cycle that is not the whole vertex set has no selected arc leaving it, so it violates its subtour row. Two examples: $x_{14}+x_{47}+x_{71}\le2$ (current left side 3) and $x_{36}+x_{63}\le1$ (current left side 2).`,
        ],
      },
      {
        short: 'all violated sets', q: R`List <b>all</b> violated subtour inequalities, including those for unions of cycles.`,
        hints: [
          R`A set $S$ is violated exactly when no selected arc leaves it. What does that say about how $S$ meets each cycle?`,
          R`$S$ must contain each cycle completely or not at all, and must not be empty or all of $V$. With 3 cycles, how many such sets are there?`,
        ],
        check: [{ type: 'int', label: 'Number of violated subsets', answer: 6 }],
        steps: [
          R`A violated set has zero selected arcs leaving it, so it contains either all or none of each cycle. The violated sets are $A,\ B,\ C,\ A\cup B,\ A\cup C,\ B\cup C$ (six sets).`,
          R`With $x(S)=\sum_{i,j\in S,\,i\ne j}x_{ij}$: $x(A)\le2$ (LHS 3), $x(B)\le3$ (LHS 4), $x(C)\le1$ (LHS 2), $x(A\cup B)\le6$ (LHS 7), $x(A\cup C)\le4$ (LHS 5), $x(B\cup C)\le5$ (LHS 6).`,
          R`A component separator returns the three rows for $A$, $B$, $C$. Under the degree equations each union row is equivalent to the row of the complementary component (for example, the outgoing capacity of $A\cup B$ equals that of $C$).`,
          R`In general, with $r$ disjoint cycles there are $2^r-2$ violated subsets. Enumerating every union is unnecessary in a usual integer separator.`,
        ],
      },
    ],
  },
  {
    n: 4, topic: 't204', title: 'Integer rounding of three rows', blurb: 'Round rows (a), (b), (c) in order; then see why scaling before rounding gives a stronger cut.',
    trainer: { drill: 'cg', preset: '20e4', label: 'Practise the four roundings in the trainer' },
    src: `${SRC} “Integer rounding”, Exercise 4.`,
    statement: R`<p>Consider</p>$$\max\ x+y\quad\text{s.t.}\quad 2x+3y\le\tfrac{38}{3}\ \text{(a)},\qquad 2x+y\ge\tfrac23\ \text{(b)},\qquad -\tfrac12x+\tfrac32y\le\tfrac74\ \text{(c)},\qquad x,y\in\mathbb Z_+.$$<p>Round rows (a), (b) and (c), in that order. Keep every inequality obtained before.</p>`,
    figure: () => roundFig(null),
    parts: [
      {
        short: 'row (a)', q: R`Round row (a). Give a point that satisfies all original rows but violates the rounded row.`,
        hints: [R`The coefficients 2 and 3 are integers, so $2x+3y$ is an integer at every integer point. What can you do with the right-hand side?`],
        check: [{ type: 'ineq', label: 'Rounded row (a)', answer: '2x + 3y <= 12', answerText: '2x + 3y <= 12', order: ['x', 'y'] }],
        steps: [
          R`The left side is an integer at integer points, and $38/3\approx12.67$ is not an integer. Round the right side <b>down</b>: $\boxed{2x+3y\le 12}$.`,
          { html: R`The point $(38/6,\,0)$ satisfies all original rows (it lies on row (a)) but violates $2x+3y\le12$, since $2\cdot\tfrac{38}{6}=12.67$.`, figure: () => roundFig([{ a: 2, b: 3, c: 12 }]) },
        ],
      },
      {
        short: 'row (b)', q: R`Round row (b), $2x+y\ge\tfrac23$.`,
        hints: [R`This row points the other way ($\ge$). The left side is still an integer. Which way do you round the right side so that no integer point is lost?`],
        check: [{ type: 'ineq', label: 'Rounded row (b)', answer: '2x + y >= 1', answerText: '2x + y >= 1', order: ['x', 'y'] }],
        steps: [
          R`The left side $2x+y$ is an integer at integer points. For a $\ge$ row we round the right side <b>up</b>: $\boxed{2x+y\ge 1}$.`,
          R`The point $(1/3,\,0)$ survives row (a) but violates the new inequality ($2/3\lt 1$).`,
        ],
      },
      {
        short: 'row (c)', q: R`Round row (c), $-\tfrac12x+\tfrac32y\le\tfrac74$, by flooring its coefficients.`,
        hints: [
          R`Because $x,y\ge0$, replacing each coefficient by its floor can only <b>decrease</b> the left side.`,
          R`Careful: $\lfloor -\tfrac12\rfloor=-1$, not $0$ (the floor goes toward $-\infty$).`,
        ],
        check: [{ type: 'ineq', label: 'Rounded row (c)', answer: '-x + y <= 1', answerText: '-x + y <= 1', order: ['x', 'y'] }],
        steps: [
          R`Since $x,y\ge0$: $-x+y\le -\tfrac12x+\tfrac32y\le\tfrac74$.`,
          { html: R`The new left side has integer coefficients, so round the right side down: $\boxed{-x+y\le 1}$. The original row stays in the model.`, figure: () => roundFig([{ a: 2, b: 3, c: 12 }, { a: -2, b: -1, c: -1 }, { a: -1, b: 1, c: 1 }]) },
        ],
      },
      {
        short: 'scale first', q: R`Instead of flooring the coefficients of (c), multiply (c) by 2 first, then round. Compare the two cuts.`,
        hints: [R`$2\cdot(-\tfrac12x+\tfrac32y)\le 2\cdot\tfrac74$ has integer coefficients already. Only the right side needs rounding.`],
        check: [{ type: 'ineq', label: 'Cut after scaling by 2', answer: '-x + 3y <= 3', answerText: '-x + 3y <= 3', order: ['x', 'y'] }],
        steps: [
          R`$-\tfrac12x+\tfrac32y\le\tfrac74\ \Rightarrow\ -x+3y\le\tfrac72$. The coefficients are integers; round the right side down: $\boxed{-x+3y\le 3}$.`,
          R`This is stronger than $-x+y\le1$: it gives $y\le 1+x/3$, while coefficient flooring gives only $y\le 1+x$.`,
          { html: R`The point $(0,\,7/6)$ is removed by both cuts. The point $(1/2,\,4/3)$ survives coefficient flooring ($-\tfrac12+\tfrac43\le1$) but violates $-x+3y\le3$ ($-\tfrac12+4=3.5$).`, figure: () => roundFig([{ a: -1, b: 1, c: 1 }, { a: -1, b: 3, c: 3, cls: 'second' }]) },
        ],
        after: R`Scaling a row by a positive number before rounding is a Chvátal–Gomory cut with a different multiplier ($u=2$ instead of $u=1$). Different multipliers give different cuts; some are stronger.`,
      },
    ],
    traps: [R`Rounding the right side of a $\ge$ row <b>down</b>: the row stays valid but becomes weaker and removes nothing (here $2x+y\ge0$). A $\ge$ row is strengthened by rounding its right side <b>up</b>.`, R`Truncating $-\tfrac12$ to $0$ instead of flooring it to $-1$: the inequality can then cut off feasible integer points.`],
  },
  {
    n: 5, topic: 't204', title: 'Gomory cut from a tableau row', blurb: 'Derive the cut from the $x$ row, show it is violated, write it in $(x,y)$.',
    src: `${SRC} “Gomory fractional cuts”, Exercise 5.`,
    trainer: { drill: 'gomory', preset: '20e5', label: 'Run the Gomory trainer on this model' },
    statement: R`<p>$$\max\ x+y\quad\text{s.t.}\quad 2x+y\le4,\qquad x+2y\le4,\qquad x,y\in\mathbb Z_+.$$ Add slacks $s_1, s_2$ in this row order. The two rows are binding at the LP optimum $(\bar x,\bar y)=(4/3,4/3)$, with $\bar z=8/3$ and $s_1=s_2=0$. The optimal tableau, written as equations, is</p>
$$\begin{array}{c|rrrrr|r}&x&y&s_1&s_2&z&\text{RHS}\\\hline x&1&0&2/3&-1/3&0&4/3\\ y&0&1&-1/3&2/3&0&4/3\\ z&0&0&1/3&1/3&1&8/3\end{array}$$`,
    figure: () => gomory5Fig(false),
    parts: [
      {
        short: 'cut from the x row', q: R`Use the $x$ row to construct a Gomory cut. Show that the current solution violates it, and express it in $(x,y)$.`,
        hints: [
          R`The slacks $s_1=4-2x-y$ and $s_2=4-x-2y$ are nonnegative integers at every integer point, so you may floor their coefficients.`,
          R`Floor every coefficient and the right side of $x+\tfrac23s_1-\tfrac13s_2=\tfrac43$. Then subtract the floored row from the equation to get the “fractional-part” form.`,
          R`To return to $(x,y)$, substitute the slack definitions and simplify.`,
        ],
        check: [
          { type: 'ineq', label: 'Gomory cut in the slacks', answer: '2/3 s1 + 2/3 s2 >= 1/3', answerText: '2/3 s1 + 2/3 s2 >= 1/3', order: ['s1', 's2'] },
          { type: 'ineq', label: 'The same cut in $(x,y)$', answer: 'x + y <= 5/2', answerText: 'x + y <= 5/2', order: ['x', 'y'] },
        ],
        steps: [
          R`The slacks are $s_1=4-2x-y$ and $s_2=4-x-2y$, nonnegative integers at every integer-feasible point.`,
          R`The row is $x+\tfrac23s_1-\tfrac13s_2=\tfrac43$. Flooring the coefficients and the right side gives $x-s_2\le1$ (note $\lfloor-\tfrac13\rfloor=-1$).`,
          R`Subtract this inequality from the equation: $\boxed{\tfrac23s_1+\tfrac23s_2\ge\tfrac13}$. The coefficients are the fractional parts $\tfrac23$ and $\tfrac23$ (the fractional part of $-\tfrac13$ is $\tfrac23$); the right side is the fractional part of $\tfrac43$.`,
          R`At the LP point $s_1=s_2=0$, so the cut asks $0\ge\tfrac13$: it is violated.`,
          R`Multiply by 3 and substitute: $2(4-2x-y)+2(4-x-2y)\ge1$, that is $16-6x-6y\ge1$, so $\boxed{x+y\le\tfrac52}$. The current point has $x+y=\tfrac83\gt\tfrac52$.`,
        ],
      },
      {
        short: 'further rounding', q: R`Can the cut $x+y\le\tfrac52$ be strengthened? What does that prove?`,
        hints: [R`At integer points, is $x+y$ an integer?`],
        check: [{ type: 'ineq', label: 'Strengthened inequality', answer: 'x + y <= 2', answerText: 'x + y <= 2', order: ['x', 'y'] }],
        steps: [
          R`$x+y$ is an integer at integer points, so a <b>further rounding step</b> gives $x+y\le2$.`,
          { html: R`The integer solution $(2,0)$ has value 2, so this bound certifies optimality: $z^*=2$. Keep the tableau cut and the extra rounding step distinct: they are two different operations.`, figure: () => gomory5Fig(true) },
        ],
      },
    ],
  },
  {
    n: 6, topic: 't204', title: 'Two rows, two Gomory cuts', blurb: 'Cut from the $y$ row, then compare with the cut from the $x$ row.',
    src: `${SRC} “Gomory fractional cuts”, Exercise 6.`,
    trainer: { drill: 'gomory', preset: '20e6', label: 'Run the Gomory trainer on this model' },
    statement: R`<p>$$\max\ x+2y\quad\text{s.t.}\quad 2x+y\le5,\qquad -x+2y\le2,\qquad x,y\in\mathbb Z_+.$$ Slacks $s_1,s_2$ in this row order. The optimal LP tableau is</p>
$$\begin{array}{c|rrrrr|r}&x&y&s_1&s_2&z&\text{RHS}\\\hline x&1&0&2/5&-1/5&0&8/5\\ y&0&1&1/5&2/5&0&9/5\\ z&0&0&4/5&3/5&1&26/5\end{array}$$`,
    figure: () => gomory6Fig(false),
    parts: [
      {
        short: 'y row', q: R`Construct a Gomory cut from the $y$ row. Show that it is violated and substitute out the slacks.`,
        hints: [
          R`Fractional parts of $\tfrac15$, $\tfrac25$ and $\tfrac95$: $\tfrac15$, $\tfrac25$ and $\tfrac45$.`,
          R`$s_1=5-2x-y$ and $s_2=2+x-2y$.`,
        ],
        check: [{ type: 'ineq', label: 'Cut in $(x,y)$', answer: 'y <= 1', answerText: 'y <= 1', order: ['x', 'y'] }],
        steps: [
          R`The $y$ row is $y+\tfrac15s_1+\tfrac25s_2=\tfrac95$. Its Gomory cut is $\tfrac15s_1+\tfrac25s_2\ge\tfrac45$, that is $s_1+2s_2\ge4$.`,
          R`Substitute $s_1=5-2x-y$, $s_2=2+x-2y$: $5-2x-y+4+2x-4y\ge4$, so $9-5y\ge4$, so $\boxed{y\le1}$.`,
          R`At the LP point $y=\tfrac95$ and both slacks are 0: the cut is violated.`,
        ],
      },
      {
        short: 'x row', q: R`Do the same with the $x$ row and compare the two cuts.`,
        hints: [R`The fractional part of a negative coefficient is $a-\lfloor a\rfloor$: for $-\tfrac15$ it is $\tfrac45$.`],
        check: [{ type: 'ineq', label: 'Cut from the $x$ row, in $(x,y)$', answer: 'y <= 3/2', answerText: 'y <= 3/2', order: ['x', 'y'] }],
        steps: [
          R`The $x$ row is $x+\tfrac25s_1-\tfrac15s_2=\tfrac85$. Fractional parts: $\tfrac25$, $\tfrac45$ and $\tfrac35$. Cut: $\tfrac25s_1+\tfrac45s_2\ge\tfrac35$.`,
          R`Substitution: $2s_1+4s_2\ge3 \Rightarrow 2(5-2x-y)+4(2+x-2y)\ge3 \Rightarrow 18-10y\ge3$, so $y\le\tfrac32$.`,
          { html: R`Both cuts exclude the LP point. The $y$-row cut $y\le1$ is stronger (before any further rounding of $y\le\tfrac32$).`, figure: () => gomory6Fig(true) },
        ],
        after: R`Classroom row rule (slides 204): among fractional basic decision variables, take the row with the largest fractional part of the right side; break ties by row order. Here $\tfrac45$ (the $y$ row) beats $\tfrac35$ (the $x$ row).`,
      },
    ],
  },
  {
    n: 7, topic: 't205', title: 'MIR cut with one integer variable', blurb: 'Derive $y\le4+2x$ from $y\le4x$ and $y\le10$.',
    src: `${SRC} “Mixed-integer rounding”, Exercise 7.`,
    trainer: { drill: 'mir', preset: '20e7', label: 'Run the MIR trainer on this row' },
    statement: R`<p>$$\max\ y\quad\text{s.t.}\quad y\le4x,\qquad y\le10,\qquad 0\le x\le3,\qquad y\ge0,\qquad x\in\mathbb Z.$$ The quantity $y$ is continuous; $x$ is integer. Find a valid line that excludes the point $(2.5,\,10)$ and keeps every feasible segment.</p>`,
    figure: () => mir7Fig(false),
    parts: [
      {
        short: 'derive', q: R`Derive an MIR cut using $s=10-y$.`,
        hints: [
          R`Substitute $y=10-s$ into $y\le4x$ and divide by 4 to get the form “integer + nonnegative continuous $\ge$ fractional number”.`,
          R`Write the right side as $k+f$ with $k$ integer and $0\lt f\lt1$, then apply $z+\dfrac{u}{f}\ge k+1$.`,
        ],
        check: [{ type: 'ineq', label: 'MIR cut in $(x,y)$', answer: 'y <= 4 + 2x', answerText: 'y <= 4 + 2x', order: ['x', 'y'] }],
        steps: [
          R`From $y\le10$, the slack $s=10-y\ge0$. Substitute in $y\le4x$: $10-s\le4x$, so $x+\dfrac s4\ge\dfrac52=2+\dfrac12$.`,
          R`Integer part $z=x$, continuous part $u=s/4\ge0$, $k=2$, $f=\tfrac12$. MIR: $x+\dfrac{s/4}{1/2}\ge3$, that is $x+\dfrac s2\ge3$.`,
          R`Check both integer branches. If $x\le2$: the row gives $s\ge10-4x$, so $x+s/2\ge5-x\ge3$. If $x\ge3$: $x+s/2\ge3$ because $s\ge0$.`,
          R`Substitute $s=10-y$: $x+5-\tfrac y2\ge3$, so $\boxed{y\le4+2x}$.`,
        ],
      },
      {
        short: 'violation and picture', q: R`Show that the cut excludes $(2.5,10)$ and draw it.`,
        hints: [R`Plug $x=2.5$ into $4+2x$.`],
        steps: [
          { html: R`At $(2.5,10)$ the cut requires $10\le4+5=9$: false, so the point is cut off. The line joins $(2,8)$ and $(3,10)$, the tops of two feasible segments.`, figure: () => mir7Fig(true) },
        ],
      },
    ],
  },
  {
    n: 8, topic: 't205', title: 'MIR with two integer variables', blurb: 'Build the MIR cut $3x_1+3x_2+5y\le14$ using the complement $1-y$.',
    src: `${SRC} “Mixed-integer rounding”, Exercise 8.`,
    trainer: { drill: 'mir', preset: '20e8', label: 'Run the MIR trainer on this row' },
    statement: R`<p>$$\max\ x_1+x_2+2y\quad\text{s.t.}\quad x_1+x_2+y\le4.4,\quad 0\le x_1\le2,\quad 0\le x_2\le2,\quad 0\le y\le1,\quad x_1,x_2\in\mathbb Z.$$ $y$ is continuous. Use the first row.</p>`,
    figure: () => mir8Fig(false),
    parts: [
      {
        short: 'check the point', q: R`Check the constraints at $(\bar x_1,\bar x_2,\bar y)=(2,1.4,1)$ in the LP relaxation.`,
        hints: [R`Check the bounds, then the first row.`],
        steps: [R`The bounds hold and $2+1.4+1=4.4$: the point is LP-feasible (the first row is tight), but $x_2=1.4$ is not an integer.`],
      },
      {
        short: 'build the cut', q: R`Build an MIR cut from $x_1+x_2+y\le4.4$ and show that it removes the point.`,
        hints: [
          R`The MIR form needs “integer + <b>nonnegative</b> continuous $\ge$ number”. Here $y$ appears with a plus sign on the “$\le$” side. Use the upper bound $y\le1$: the complement $u=1-y$ is nonnegative.`,
          R`Set $w=-x_1-x_2$ (an integer). The row becomes $w+u\ge-3.4$. What are $k$ and $f$? Remember $\lfloor-3.4\rfloor=-4$.`,
        ],
        check: [{ type: 'ineq', label: 'MIR cut', answer: '3x1 + 3x2 + 5y <= 14', answerText: '3x1 + 3x2 + 5y <= 14', order: ['x1', 'x2', 'y'] }],
        steps: [
          R`Let $w=-x_1-x_2\in\mathbb Z$ and $u=1-y\ge0$. The row $x_1+x_2+y\le4.4$ becomes $-w+1-u\le4.4$, that is $w+u\ge-3.4=-4+0.6$.`,
          R`So $k=-4$ and $f=0.6$. MIR gives $w+\dfrac{u}{0.6}\ge-3$.`,
          R`Substitute back: $-x_1-x_2+\dfrac{1-y}{0.6}\ge-3$. Multiply by 3 (so $3/0.6=5$): $-3x_1-3x_2+5-5y\ge-9$, so $\boxed{3x_1+3x_2+5y\le14}$.`,
          R`At $(2,1.4,1)$: $6+4.2+5=15.2\gt14$. The cut removes the point.`,
          { html: R`Independent check with $r=x_1+x_2$: if $r\le3$, then $3r+5y\le9+5=14$. If $r\ge4$, the base row forces $r=4$ and $y\le0.4$, so $3r+5y\le12+2=14$. The cut holds on the whole mixed-integer set.`, figure: () => mir8Fig(true) },
        ],
      },
    ],
    traps: [R`Using $y$ itself as the continuous part: it has the wrong sign. The complement $1-y$ is the nonnegative quantity.`, R`Taking $k=-3$: the floor of $-3.4$ is $-4$, and then $f=0.6$.`],
  },
  {
    n: 9, topic: 't206a', title: 'Conflict graph and maximal cliques', blurb: 'Six pairwise conflicts among five jobs: find the maximal cliques.',
    src: `${SRC} “Cliques and covers”, Exercise 9.`,
    trainer: { drill: 'clique', preset: '20e9', label: 'Find the maximal cliques of this graph in the trainer' },
    statement: R`<p>Five binary variables say whether five jobs are selected. The model contains</p>$$x_1+x_2\le1,\quad x_1+x_3\le1,\quad x_2+x_3\le1,\quad x_3+x_4\le1,\quad x_3+x_5\le1,\quad x_4+x_5\le1.$$`,
    parts: [
      {
        short: 'cliques', q: R`Draw the conflict graph, identify its maximal cliques, and write their inequalities.`,
        hints: [
          R`A <b>clique</b> is a set of vertices that are all pairwise joined. It is <b>maximal</b> when no other vertex can be added.`,
          R`Draw one vertex per job and one edge per constraint. Look for triangles.`,
        ],
        check: [
          { type: 'ineq', label: 'Clique inequality containing job 1', answer: 'x1 + x2 + x3 <= 1', answerText: 'x1 + x2 + x3 <= 1', order: ['x1', 'x2', 'x3', 'x4', 'x5'] },
          { type: 'ineq', label: 'Clique inequality containing job 5', answer: 'x3 + x4 + x5 <= 1', answerText: 'x3 + x4 + x5 <= 1', order: ['x1', 'x2', 'x3', 'x4', 'x5'] },
        ],
        steps: [
          { html: R`The graph is two triangles that share vertex 3.`, figure: conflictFig },
          R`Maximal cliques: $\{1,2,3\}$ and $\{3,4,5\}$. Inequalities: $x_1+x_2+x_3\le1$ and $x_3+x_4+x_5\le1$.`,
          R`Within a clique every pair conflicts, so at most one job is selected. Neither triangle can be extended: no outside vertex is joined to all three of its vertices. Every edge and vertex lies in one of the two triangles, so there are no other maximal cliques.`,
        ],
      },
    ],
  },
  {
    n: 10, topic: 't206a', title: 'All covers of a knapsack', blurb: 'List every cover of $5x_1+6x_2+7x_3+13x_4\le17$ and find the minimal ones.',
    src: `${SRC} “Cliques and covers”, Exercise 10.`,
    trainer: { drill: 'covers', preset: '20e10', label: 'Practise covers on this knapsack' },
    statement: R`<p>Binary knapsack: $$5x_1+6x_2+7x_3+13x_4\le17.$$</p>`,
    parts: [
      {
        short: 'all covers', q: R`List every cover and its cover inequality, and identify all minimal covers.`,
        hints: [
          R`A <b>cover</b> is a set of items whose total weight is <b>more than</b> 17. Its inequality says “not all of them”: $\sum_{j\in C}x_j\le|C|-1$.`,
          R`Go through the 15 nonempty subsets by size. A cover is <b>minimal</b> if removing any single item makes it fit.`,
        ],
        check: [
          { type: 'int', label: 'Number of covers', answer: 8 },
          { type: 'int', label: 'Number of minimal covers', answer: 4 },
        ],
        steps: [
          R`No single item weighs more than 17. Pairs: $\{1,4\}=18$, $\{2,4\}=19$, $\{3,4\}=20$ are covers; $\{1,2\}=11$, $\{1,3\}=12$, $\{2,3\}=13$ are not.`,
          R`Minimal covers and inequalities: $\{1,4\}$: $x_1+x_4\le1$; $\{2,4\}$: $x_2+x_4\le1$; $\{3,4\}$: $x_3+x_4\le1$; $\{1,2,3\}$ (weight 18): $x_1+x_2+x_3\le2$. Removing any item from them leaves weight at most 17.`,
          R`The other covers: $\{1,2,4\}$ (24): $x_1+x_2+x_4\le2$; $\{1,3,4\}$ (25): $x_1+x_3+x_4\le2$; $\{2,3,4\}$ (26): $x_2+x_3+x_4\le2$; $\{1,2,3,4\}$ (31): $x_1+x_2+x_3+x_4\le3$. That is 8 covers in all, 4 of them minimal, and all 15 nonempty subsets have been checked.`,
        ],
      },
      {
        short: 'prove minimality', q: R`Prove that $\{1,2,3\}$ is a minimal cover and that $\{1,2,4\}$ is not.`,
        hints: [R`Minimal: the set is a cover and every set obtained by deleting one item fits. Not minimal: find one item you can delete and still have a cover.`],
        steps: [
          R`$\{1,2,3\}$ weighs $18\gt17$, so it is a cover. Deleting item 1, 2 or 3 leaves 13, 12 or 11, which all fit: it is minimal.`,
          R`$\{1,2,4\}$: deleting item 1 leaves $\{2,4\}$, of weight $19\gt17$, still a cover. So $\{1,2,4\}$ is not minimal.`,
          R`Every cover inequality is valid: selecting every item of the cover would exceed the capacity.`,
        ],
      },
    ],
  },
  {
    n: 11, topic: 't206b', title: 'Extend and lift a cover', blurb: 'Extend the cover $\{1,2,3\}$, then find the largest coefficient of $x_4$.',
    src: `${SRC} “Cliques and covers”, Exercise 11.`,
    trainer: { drill: 'lifting', preset: '20e11', label: 'Run the lifting trainer on this cover' },
    statement: R`<p>Same knapsack $5x_1+6x_2+7x_3+13x_4\le17$, cover $C=\{1,2,3\}$.</p>`,
    parts: [
      {
        short: 'extension', q: R`Extend the cover to include the eligible outside items.`,
        hints: [R`The extension $E(C)$ adds every outside item whose weight is at least the <b>largest</b> weight in $C$.`],
        check: [{ type: 'ineq', label: 'Extended cover inequality', answer: 'x1 + x2 + x3 + x4 <= 2', answerText: 'x1 + x2 + x3 + x4 <= 2', order: ['x1', 'x2', 'x3', 'x4'] }],
        steps: [
          R`The largest cover weight is 7. Item 4 weighs $13\ge7$, so it joins: $\boxed{x_1+x_2+x_3+x_4\le2}$.`,
          R`Any three selected items weigh at least $5+6+7=18\gt17$, so the extension keeps every feasible 0–1 selection.`,
        ],
      },
      {
        short: 'lifting', q: R`Starting from that extension, find the largest valid coefficient $\alpha$ in $x_1+x_2+x_3+\alpha x_4\le2$.`,
        hints: [
          R`Set $x_4=1$. How much capacity is left, and what is then the largest possible value of $x_1+x_2+x_3$?`,
          R`$\alpha=2-\max\{x_1+x_2+x_3:\ x_4=1,\ \text{feasible}\}$.`,
        ],
        check: [{ type: 'int', label: '$\\alpha$', answer: 2 }],
        steps: [
          R`With $x_4=1$ only $17-13=4$ units are left. $\max\{x_1+x_2+x_3:\ 5x_1+6x_2+7x_3\le4\}=0$.`,
          R`So $\alpha=2-0=2$: $\boxed{x_1+x_2+x_3+2x_4\le2}$.`,
          R`Validity: if $x_4=0$ the base cover applies; if $x_4=1$ the other items are all 0. Maximality: the feasible point $(0,0,0,1)$ forces $\alpha\le2$.`,
        ],
      },
    ],
  },
  {
    n: 12, topic: 't206b', title: 'Facets before and after a cut', blurb: 'Facets of a pentagon, then of the integer hull after adding $2x+y\le4.5$.',
    src: `${SRC} “Facets and activated flows”, Exercise 12.`,
    trainer: { drill: 'facets', preset: '20e12', label: 'Practise facets and integer hulls on this polytope' },
    statement: R`<p>The shaded polytope $P$ has corners $(0,0)$, $(2,0)$, $(2,1)$, $(1,2)$, $(0,2)$.</p>`,
    figure: () => pentagonFig(0),
    parts: [
      {
        short: 'facets of P', q: R`Highlight every facet of $P$ and write its inequality.`,
        hints: [
          R`A <b>facet</b> of a 2-dimensional polytope is an edge: a face of dimension $2-1=1$.`,
          R`Write one inequality per edge of the pentagon; check that its “tight” points (where it holds with equality) are two distinct corners.`,
        ],
        steps: [
          R`$P=\{(x,y): x\ge0,\ y\ge0,\ x\le2,\ y\le2,\ x+y\le3\}$.`,
          R`Edges: $x=0$ (corners $(0,0),(0,2)$), $y=0$ ($(0,0),(2,0)$), $x=2$ ($(2,0),(2,1)$), $y=2$ ($(0,2),(1,2)$), $x+y=3$ ($(2,1),(1,2)$).`,
          R`$(0,0)$, $(2,0)$, $(0,2)$ are not on one line, so $\dim P=2$. Each inequality is valid and its tight face contains two distinct points on a line: dimension $1=\dim P-1$. All five are facets.`,
        ],
      },
      {
        short: 'integer hull Q', q: R`Keep only the integer points of $P$ and add $2x+y\le4.5$. Draw their convex hull $Q$ and give its facets.`,
        hints: [
          R`Which integer point of $P$ violates $2x+y\le4.5$? For integers, $2x+y$ is an integer, so $2x+y\le4.5$ means $2x+y\le4$.`,
          R`The <b>convex hull</b> of a set of points is the smallest convex region containing them. Find its corners among the remaining integer points.`,
        ],
        steps: [
          { html: R`$(2,1)$ violates the new row ($4+1=5\gt4.5$). For integer points the row is equivalent to $2x+y\le4$.`, figure: () => pentagonFig(1) },
          R`$Q=\operatorname{conv}\{(0,0),(2,0),(1,2),(0,2)\}$. The other remaining integer points, $(1,0)$, $(0,1)$, $(1,1)$, are in $Q$ but are not corners: $(1,0)$ and $(0,1)$ lie on edges, $(1,1)$ inside.`,
          { html: R`$Q=\{x\ge0,\ y\ge0,\ y\le2,\ 2x+y\le4\}$. Facets: $x=0$ ($(0,0),(0,2)$), $y=0$ ($(0,0),(2,0)$), $y=2$ ($(0,2),(1,2)$), $2x+y=4$ ($(2,0),(1,2)$). $\dim Q=2$ because $(0,0),(2,0),(0,2)\in Q$ are not collinear.`, figure: () => pentagonFig(2) },
        ],
      },
      {
        short: 'which still define facets', q: R`Which original inequalities still define facets of $Q$? Does the added inequality $2x+y\le4.5$ define a facet? Justify mathematically.`,
        hints: [R`For each inequality, find the points of $Q$ where it holds with equality, and the dimension of that set.`],
        steps: [
          R`$x\ge0$, $y\ge0$ and $y\le2$ remain facets: each is tight at two distinct points of $Q$.`,
          R`$x\le2$ is tight only at $(2,0)$: dimension 0, not a facet. $x+y\le3$ is tight only at $(1,2)$: dimension 0, not a facet.`,
          R`Every point of $Q$ satisfies $2x+y\le4$, so $2x+y\le4.5$ is <b>never tight</b> on $Q$: it is valid but not a facet. It cuts $(2,1)$ off $P$ without defining a facet of the remaining integer hull.`,
        ],
      },
    ],
  },
  {
    n: 13, topic: 't206c', title: 'Flow cover with three channels', blurb: 'Capacities 7, 9, 5 into a warehouse of 12: derive and test the flow-cover cut for $C=\{1,2\}$.',
    src: `${SRC} “Facets and activated flows”, Exercise 13.`,
    trainer: { drill: 'flowcover', preset: '20e13', label: 'Run the flow-cover trainer on this instance' },
    statement: R`<p>Flows satisfy $0\le y_j\le a_jx_j$ with $(a_1,a_2,a_3)=(7,9,5)$, $\sum_j y_j\le12$, and $x_j\in\{0,1\}$. Use $C=\{1,2\}$. Test $\bar x=(1,\tfrac12,0)$, $\bar y=(7,\tfrac92,0)$.</p>`,
    figure: channelsFig,
    parts: [
      {
        short: 'derive', q: R`Derive the flow-cover inequality for $C=\{1,2\}$.`,
        hints: [
          R`The <b>excess</b> is $\lambda=\sum_{j\in C}a_j-b$: how much the cover could carry beyond the limit 12.`,
          R`Each closed channel $j\in C$ reduces the allowed flow by $(a_j-\lambda)^+=\max\{a_j-\lambda,0\}$.`,
        ],
        check: [{ type: 'ineq', label: 'Flow-cover inequality', answer: 'y1 + y2 + 3(1 - x1) + 5(1 - x2) <= 12', answerText: 'y1 + y2 - 3x1 - 5x2 <= 4', order: ['y1', 'y2', 'x1', 'x2'] }],
        steps: [
          R`Cover capacity $7+9=16$, excess $\lambda=16-12=4$.`,
          R`Coefficients $(7-4)^+=3$ and $(9-4)^+=5$. The inequality is $\boxed{y_1+y_2+3(1-x_1)+5(1-x_2)\le12}$. Channel 3 stays governed by the original model.`,
          R`Check the four states of $(x_1,x_2)$: $(0,0)$: flow 0, LHS at most $0+3+5=8$; $(1,0)$: flow at most 7, LHS at most $7+0+5=12$; $(0,1)$: at most $9+3=12$; $(1,1)$: at most $12$. Flow on channel 3 can only reduce what channels 1 and 2 may carry.`,
        ],
      },
      {
        short: 'test the point', q: R`Test $\bar x=(1,\tfrac12,0)$, $\bar y=(7,\tfrac92,0)$.`,
        hints: [R`First check the original model, then evaluate the cut's left side.`],
        check: [{ type: 'num', label: 'Left-hand side of the cut at the point', answer: 14 }],
        steps: [
          R`The point satisfies every capacity link and has total flow $11.5\le12$.`,
          R`Cut LHS: $7+4.5+3\cdot0+5\cdot0.5=14\gt12$. Violated by 2.`,
          R`A knapsack-style row $x_1+x_2\le1$ would be <b>invalid</b>: both channels can be open, carrying for example $(6,6)$.`,
        ],
      },
    ],
  },
  {
    n: 14, topic: 't206c', title: 'Lot sizing over three periods', blurb: 'Demands 5, 8, 6 and capacity 12: single-period and cumulative cuts, and a violated point.',
    src: `${SRC} “Lot-sizing”, Exercise 14.`,
    trainer: { drill: 'lotsize', preset: '20e14', label: 'Run the lot-sizing trainer on this instance' },
    statement: R`<p>Three periods with demands $(d_1,d_2,d_3)=(5,8,6)$ and capacity $C=12$ per period. $y_t\ge0$ is production, $s_t\ge0$ inventory, $x_t\in\{0,1\}$ the setup. $s_0=0$, no backlogging, $y_t\le12x_t$.</p>`,
    parts: [
      {
        short: 'inequalities', q: R`Write the inventory balances and derive a single-period inequality and the cumulative setup inequalities.`,
        hints: [
          R`Balance: what you had, plus what you produce, minus what you keep, equals the demand.`,
          R`Sum the balances from period 1 to $t$ and use $y_i\le12x_i$. The number of setups is an integer: round up.`,
        ],
        check: [
          { type: 'int', label: R`Right side of $x_1+x_2\ge\ ?$`, answer: 2 },
          { type: 'int', label: R`Right side of $x_1+x_2+x_3\ge\ ?$`, answer: 2 },
        ],
        steps: [
          R`Balances: $s_{t-1}+y_t-s_t=d_t$ for $t=1,2,3$.`,
          R`Single-period inequality: $\boxed{y_t\le d_tx_t+s_t}$. If $x_t=0$ the capacity link forces $y_t=0$. If $x_t=1$ the balance gives $y_t=d_t+s_t-s_{t-1}\le d_t+s_t$.`,
          R`Summing balances through $t$ with $s_0=0$: $12\sum_{i\le t}x_i\ge\sum_{i\le t}y_i=\sum_{i\le t}d_i+s_t\ge\sum_{i\le t}d_i$.`,
          R`Cumulative demands are 5, 13, 19. Dividing by 12 and rounding up: $\boxed{x_1\ge1,\quad x_1+x_2\ge2,\quad x_1+x_2+x_3\ge2}$.`,
        ],
      },
      {
        short: 'violation', q: R`Test $\bar x=(\tfrac5{12},\tfrac23,\tfrac12)$, $\bar y=(5,8,6)$, $\bar s=(0,0,0)$. Which inequalities are violated? Then explain why positive demand in period 3 does not force $x_3=1$.`,
        hints: [
          R`Evaluate $d_t\bar x_t+\bar s_t$ and compare with $\bar y_t$; then the prefix sums of $\bar x$.`,
          R`For the last question, build a feasible integer plan that produces period 3's demand earlier.`,
        ],
        check: [{ type: 'int', label: 'How many of the six inequalities are violated?', answer: 6 }],
        steps: [
          R`The point satisfies the balances and the capacity links (at equality).`,
          R`Single-period: $5\not\le5\cdot\tfrac5{12}=\tfrac{25}{12}$; $8\not\le8\cdot\tfrac23=\tfrac{16}3$; $6\not\le6\cdot\tfrac12=3$. Cumulative: $\tfrac5{12}\not\ge1$; $\tfrac{13}{12}\not\ge2$; $\tfrac{19}{12}\not\ge2$. All six are violated.`,
          R`A feasible integer plan is $x=(1,1,0)$, $y=(7,12,0)$, $s=(2,6,0)$: the first two periods produce all 19 units, and inventory supplies period 3 with no setup there.`,
          R`The cumulative cuts use three assumptions: zero initial inventory, nonnegative inventory, and the common capacity 12. Each one enters the derivation.`,
        ],
      },
    ],
  },
];
