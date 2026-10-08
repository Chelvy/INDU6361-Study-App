const R = String.raw;

export default {
  id: 't202',
  lead: R`The cutset formulation has $2^n-n-2$ subtour rows, but only a handful matter for any one instance. Row generation starts without them and adds a row only when the current solution violates it. Done inside one branch-and-bound search, with callbacks, this is branch-and-cut.`,
  sections: [
    {
      title: 'Master problem and the loop',
      html: R`
<p>The complete formulation has the degree equations and, for every $S\subset V$ with $2\le|S|\le n-1$, the subtour row</p>
$$x(S)=\sum_{i\in S}\sum_{j\in S\setminus\{i\}}x_{ij}\le|S|-1 .$$
<p>The <b>master</b> keeps only the degree equations and $x_{ij}\in\{0,1\}$. Then:</p>
<ol>
<li>begin with none of the subtour rows;</li>
<li>solve the master to optimality;</li>
<li>find the directed cycles of the solution; if there is a proper subtour, identify one violated row;</li>
<li>add that row and solve again. Stop when the solution is a single tour.</li>
</ol>
<p><b>Lecture demonstration (12 vertices).</b> The first master returns subtours; e.g. $S=\{1,5\}$ gives the row $x_{15}+x_{51}\le 1$. The master objective rises with each added row:</p>
<p style="text-align:center">330.19 → 332.94 → 334.79 → 360.19 → 360.56 → 362.41 → 364.46 → 365.13 → <b>367.21</b></p>
<p>Eight rows and nine solves prove optimality, out of $2^{12}-12-2=4082$ rows in the full family. (A separate picture shows why subtours are tempting only for the relaxation: two cycles costing 277.07 and 284.58, together 561.64, against the optimal tour 367.21.)</p>`,
    },
    {
      title: 'Why it is correct, and why it stops',
      html: R`
<p>Let $M$ be the feasible set of the current master and $F$ that of the complete TSP.</p>
<div class="callout"><div class="callout-title">Correctness</div>The master omits only <i>valid</i> rows, so $F\subseteq M$ and $z_M\le z^*$. If an optimal master solution $\bar x$ satisfies every omitted row, then $\bar x\in F$, and
$$z_M\le z^*\le c^\top\bar x=z_M ,$$
so $\bar x$ is optimal for the complete model.</div>
<p>This is the key fact of slides 103: an optimal solution of a relaxation that is feasible for the original problem is optimal for it. Each master is a minimisation relaxation, so its optimum is a <b>lower bound</b> that can only rise as rows are added.</p>
<p><b>Termination.</b> Every generated row is valid for every tour; every rejected cycle cover is infeasible in all later masters; there are finitely many integer cycle covers; and the algorithm stops only when the optimal master solution is one tour. Hence it terminates with an optimal tour.</p>`,
    },
    {
      title: 'The separation problem',
      html: R`
<div class="callout"><div class="callout-title">Definition</div>Given the current point $\bar x$, the <b>separation problem</b> must either (1) certify that $\bar x$ satisfies the omitted family, or (2) return an inequality of the family violated by $\bar x$.</div>
<p>Its form depends on the family and it is often a combinatorial optimisation problem itself, so families with an efficient separation algorithm are especially valuable.</p>
<p><b>Integer cycle covers: connected components.</b> Take the graph of arcs with $\bar x_{ij}=1$, ignoring direction, and compute its connected components. Each component is a directed cycle.</p>
<ul>
<li>One component: the solution is a tour.</li>
<li>Several components: any component $S\subsetneq V$ violates $x(S)\le|S|-1$, because $x(S)=|S|$. Example: components $\{1,2,3\}$ and $\{4,5,6\}$; $S=\{1,2,3\}$ gives $3\gt 2$.</li>
</ul>
<h3>General rules for exact row generation</h3>
<ol>
<li><b>Complete separation:</b> find a violated row whenever one exists.</li>
<li><b>Valid generation:</b> add only rows satisfied by every feasible solution.</li>
</ol>
<p>With finitely many candidates and optimal master solves, each rejected candidate disappears for good, so the method ends with an optimal solution.</p>`,
    },
    {
      title: 'From repeated solves to one search: global cuts',
      html: R`
<p>Calling the solver again after every row is wasteful: successive masters are almost identical, and each solve repeats search work. Better to add violated rows <b>while one branch-and-bound search stays active</b>.</p>
<p><b>Demonstration on the workshop tree.</b> Root 51.3, children $x\le1$ (48) and $x\ge2$ (45) are open. Take the globally valid inequality $y-x\le 3$ as given and add it to <i>both</i> open nodes:</p>
<ul>
<li>left node: bound falls from 48 to <b>41</b>, so it closes against the incumbent 41 without branching;</li>
<li>right node: bound stays 45; branch on $y$: $y\le4$ gives 42.3, $y\ge5$ infeasible; then $x\le2$ gives the incumbent 42 and $x\ge3$ gives 36.</li>
</ul>
<div class="callout"><div class="callout-title">Global and local cuts</div>A <b>global</b> cut is valid for the whole problem and may be imposed on every subproblem. A <b>local</b> cut is valid only in one node's region and its descendants; applying it elsewhere could remove a feasible solution and invalidate the search.</div>`,
    },
    {
      title: 'Callbacks and branch-and-cut',
      html: R`
<p>A <b>callback</b> is a function you hand to another program, to be invoked when a specified event occurs. The controlling program decides when to call it; the callback receives information about the event, performs a restricted operation, and returns control.</p>
<p>Inside a solver: (1) the solver meets a candidate or node solution; (2) it calls your callback with that point; (3) the callback detects violations and submits permitted rows; (4) control returns to the solver. Separation now happens inside the active search.</p>
<h3>Branch-and-cut flow</h3>
<ol>
<li>Select an open node and solve its relaxation. If it is infeasible or prunable by bound, close it.</li>
<li>If the solution is <b>not integer</b>, branch and add the children.</li>
<li>If it <b>is integer</b>, the <b>lazy callback</b> checks the omitted rows. Violation found: add the violated rows and re-solve the node. No violation: update the incumbent and close the node.</li>
<li>When no open nodes remain, return the incumbent.</li>
</ol>
<p>Integer candidates produced by the solver's <b>heuristics</b> go through the same lazy callback.</p>
<div class="callout warn"><div class="callout-title">Gotchas listed on the slides</div>
<ul>
<li>Use <b>tolerances</b> when testing integrality and row violation.</li>
<li>Enabling lazy constraints <b>disables some Gurobi reductions</b> that are unsafe when feasibility rows are omitted.</li>
<li>Use only the operations the callback interface allows.</li>
<li>Submit a violated lazy row <b>whenever it reappears</b>, even if it was submitted at an earlier callback.</li>
<li>Returning without a violated lazy row leaves the candidate eligible to become an <b>incumbent</b>, even if your separator missed an infeasibility.</li>
</ul></div>`,
    },
  ],
  moves: [
    R`Describe row generation as: master (what is omitted), separation routine (how a violated row is found), stopping test.`,
    R`For correctness quote $F\subseteq M$, $z_M\le z^*$, and the sandwich $z_M\le z^*\le c^\top\bar x=z_M$.`,
    R`For termination give the four facts: valid rows, rejected covers never return, finitely many covers, stop only at a tour.`,
    R`When separating an integer solution by hand: list the cycles, pick $S$, write $x(S)\le|S|-1$ and show the current left-hand side equals $|S|$.`,
    R`State whether a cut is global or local before adding it to nodes of a tree.`,
  ],
  traps: [
    R`Believing all rows must eventually be added. The lecture instance needed 8 of 4082.`,
    R`Stopping when the master's objective stops changing. The stopping test is feasibility of the master solution for the full model (a single tour).`,
    R`Adding a row that is not valid for every tour (for example “forbid this exact cycle cover” written incorrectly): the method could cut off the optimum.`,
    R`Thinking the master objective can go down after adding a row. A relaxation of a minimisation can only get tighter: the bound is nondecreasing.`,
    R`In a lazy callback, returning without adding a row because “this row was already added once”: the candidate is then accepted as incumbent.`,
    R`Applying a local cut globally.`,
  ],
  refs: [
    R`Slides 202, <i>Row Generation</i> (T. Schettini), all 28 pages.`,
    R`Labs 202a (manual separation loop) and 202b (integer lazy-constraint callback) on the directed TSP.`,
    R`JuMP documentation, “Solver-independent Callbacks” and the TSP lazy-constraint tutorial; Gurobi reference manual, “Callbacks”, <code>LazyConstraints</code>, <code>PreCrush</code> (all cited on the slides).`,
  ],
};
