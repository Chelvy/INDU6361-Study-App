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
<p><b>Why not write every row?</b> The slides draw a cycle cover of the 12-vertex lecture instance with two six-vertex cycles, each the cheapest cycle on its own vertices: red 277.07 and blue 284.58, together <b>561.64</b>. The optimal tour costs only <b>367.21</b>. Every master below still allows the optimal tour, so a master optimum never costs more than 367.21, and this cover never appears as a master solution. Such subtours “do not make sense” for the optimum. So instead of listing the whole family we generate only what is needed: the rows that the current master solution violates. The run below needs 8 rows.</p>
<p>The <b>master</b> keeps only the degree equations and $x_{ij}\in\{0,1\}$. Then:</p>
<ol>
<li>begin with none of the subtour rows;</li>
<li>solve the master to optimality;</li>
<li>find the directed cycles of the solution; if there is a proper subtour, identify one violated row;</li>
<li>add that row and solve again. Stop when the solution is a single tour.</li>
</ol>
<p><b>Lecture run (12 vertices).</b> Lab 202a picks the subtour by the rule “Choose a shortest proper cycle, breaking ties by its smallest vertex”.</p>
<table class="data-table">
<thead><tr><th>Solve</th><th>Objective</th><th>Chosen $S$</th><th>Row added</th></tr></thead>
<tbody>
<tr><td>1</td><td>330.19</td><td>$\{1,5\}$ (five subtours)</td><td>$x_{15}+x_{51}\le 1$</td></tr>
<tr><td>2</td><td>332.94</td><td>$\{2,8\}$ (four subtours)</td><td>$x(S)\le 1$</td></tr>
<tr><td>3</td><td>334.79</td><td>$\{4,7,12\}$</td><td>$x(S)\le 2$</td></tr>
<tr><td>4</td><td>360.19</td><td>$\{1,11\}$</td><td>$x(S)\le 1$</td></tr>
<tr><td>5</td><td>360.56</td><td>$\{3,10\}$</td><td>$x(S)\le 1$</td></tr>
<tr><td>6</td><td>362.41</td><td>$\{4,12\}$</td><td>$x(S)\le 1$</td></tr>
<tr><td>7</td><td>364.46</td><td>$\{6,9,11\}$</td><td>$x(S)\le 2$</td></tr>
<tr><td>8</td><td>365.13</td><td>$\{2,3\}$</td><td>$x(S)\le 1$</td></tr>
<tr><td>9</td><td><b>367.21</b></td><td colspan="2">one tour remains: stop</td></tr>
</tbody></table>
<p>Eight rows and nine solves prove optimality, out of $2^{12}-12-2=4082$ rows in the full family. Two things to notice:</p>
<ul>
<li>The objective never goes down: each master is the previous one plus one row, a smaller feasible set.</li>
<li>A row on a set does not forbid smaller subtours inside it. After $x(\{4,7,12\})\le 2$ at solve 3, solve 6 still returns the subtour $\{4,12\}$, which needs its own row.</li>
</ul>`,
    },
    {
      title: 'Why it is correct, and why it stops',
      html: R`
<p>Let $M$ be the feasible set of the current master and $F$ that of the complete TSP.</p>
<div class="callout"><div class="callout-title">Correctness</div>The master omits only <i>valid</i> rows, so $F\subseteq M$ and $z_M\le z^*$. If an optimal master solution $\bar x$ satisfies every omitted row, then $\bar x\in F$, and
$$z_M\le z^*\le c^\top\bar x=z_M ,$$
so $\bar x$ is optimal for the complete model.</div>
<p>This is the key fact of slides 103: an optimal solution of a relaxation that is feasible for the original problem is optimal for it. Each master is a minimisation relaxation of the complete TSP, so its optimum is a <b>lower bound</b> on the tour value (367.21 in the lecture run). The bound can only rise as rows are added, because each new master is the previous one plus a row (a smaller feasible set).</p>
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
      title: 'Integer separation with several cycles (20E Exercise 3)',
      html: R`
<p>Nine vertices; every drawn arc has value 1 and the degree equations hold. Following the selected arcs from an unvisited vertex until the cycle closes gives three cycles:</p>
$$A=\{1,4,7\}\ (1\to4\to7\to1),\qquad B=\{2,5,8,9\}\ (2\to8\to5\to9\to2),\qquad C=\{3,6\}\ (3\to6\to3).$$
<ol>
<li><b>Which sets are violated?</b> At an integer point a set $S$ violates its row exactly when <b>no selected arc leaves it</b> (cut form: left side 0). If $S$ took only part of a cycle, that cycle would leave $S$ somewhere. So a violated set contains <b>each cycle completely or not at all</b>, and it is neither empty nor all of $V$.</li>
<li><b>How many?</b> Each of the $r$ cycles is either in or out: $2^r$ choices, minus the empty set and $V$. That gives $2^r-2$ violated sets; here $2^3-2=6$.</li>
</ol>
<table class="data-table">
<thead><tr><th>$S$</th><th>$A$</th><th>$B$</th><th>$C$</th><th>$A\cup B$</th><th>$A\cup C$</th><th>$B\cup C$</th></tr></thead>
<tbody>
<tr><th>row $x(S)\le|S|-1$</th><td>$\le 2$</td><td>$\le 3$</td><td>$\le 1$</td><td>$\le 6$</td><td>$\le 4$</td><td>$\le 5$</td></tr>
<tr><th>current $x(S)$</th><td>3</td><td>4</td><td>2</td><td>7</td><td>5</td><td>6</td></tr>
</tbody></table>
<ul>
<li><b>Union rows add nothing new.</b> Under the degree equations a set and its complement send out the same value (slides 203). The complement of $A\cup B$ is $C$, so the row of $A\cup B$ is equivalent to the row of $C$; the same holds for the other unions.</li>
<li><b>What a separator returns.</b> A component separator returns one row per cycle: here the rows of $A$, $B$ and $C$. Enumerating every union is unnecessary.</li>
</ul>
<p><a href="#/exercises/20e/3">Open 20E Exercise 3</a>.</p>`,
    },
    {
      title: 'From repeated solves to one search: global cuts',
      html: R`
<p>Calling the solver again after every row is wasteful: successive masters are almost identical, and each solve repeats search work. Better to add violated rows <b>while one branch-and-bound search stays active</b>.</p>
<p><b>Demonstration on the workshop tree</b> ($\max\ x+10y$, slides 102). Root 51.3, incumbent $(1,4)$ with value 41. The children $x\le1$ (bound 48, LP optimum $(1,4.7)$) and $x\ge2$ (bound 45, LP optimum $(2,4.3)$) are open. Take the globally valid inequality $y-x\le 3$ as given and add it to <i>both</i> open nodes. In the tree a <b>dashed edge</b> is a <b>cut update</b>: the same subproblem with one more row, not a new branch.</p>
<ul>
<li>Left node: the optimum moves to $(1,4)$ and the bound falls from 48 to <b>41</b>, so it closes against the incumbent 41 without branching.</li>
<li>Right node: its optimum $(2,4.3)$ already satisfies the cut (the cut is redundant there), so the bound stays 45. Branch on $y$: $y\le4$ gives 42.3 at $(2.3,4)$, $y\ge5$ is infeasible. Then $x\le2$ gives the new incumbent $(2,4)$ with value 42, and $x\ge3$ gives bound 36, so it closes. Optimum: 42.</li>
</ul>
<p>(Why $y-x\le3$ is valid, which the slides take as given: every integer feasible point has $y-x\le 3.7$, and $y-x$ is an integer, so $y-x\le3$. Slides 204 develop this rounding argument.)</p>
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
<p>Integer candidates produced by the solver's <b>heuristics</b> go through the same lazy callback. In the manual loop of lab 202a one row is added per solve; in the lazy callback of lab 202b a row is submitted for <b>every</b> proper cycle of the candidate.</p>
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
    R`Asked for <b>all</b> violated rows of an integer solution with $r$ cycles: the violated sets are the unions of whole cycles, $2^r-2$ of them; a separator returns one row per cycle, because each union row is equivalent to the row of its complement.`,
    R`State whether a cut is global or local before adding it to nodes of a tree.`,
  ],
  traps: [
    R`Believing all rows must eventually be added. The lecture instance needed 8 of 4082.`,
    R`Stopping when the master's objective stops changing. The stopping test is feasibility of the master solution for the full model (a single tour).`,
    R`Adding a row that is not valid for every tour (for example “forbid this exact cycle cover” written incorrectly): the method could cut off the optimum.`,
    R`Thinking the master objective can go down after adding a row. A relaxation of a minimisation can only get tighter: the bound is nondecreasing.`,
    R`Expecting the row of a set to forbid subtours on smaller sets inside it: after the row for $\{4,7,12\}$ the lecture run still needs a row for $\{4,12\}$.`,
    R`Counting a set that cuts through a cycle as violated: some selected arc then leaves it.`,
    R`In a lazy callback, returning without adding a row because “this row was already added once”: the candidate is then accepted as incumbent.`,
    R`Applying a local cut globally.`,
  ],
  refs: [
    R`Slides 202, <i>Row Generation</i> (T. Schettini), all 28 pages; the HTML reading version (October 2026) shows all nine solves of the lecture run.`,
    R`Sheet 20E, Exercise 3 (integer separation with three cycles).`,
    R`Labs 202a (manual separation loop, tie rule) and 202b (integer lazy-constraint callback) on the directed TSP.`,
    R`Wolsey, <i>Integer Programming</i>, 2nd ed. (2021), chapters 1–3; Dantzig, Fulkerson and Johnson (1954), <i>Operations Research</i> 2(4), 393–410 (both cited on the slides).`,
    R`JuMP documentation, “Solver-independent Callbacks” and the TSP lazy-constraint tutorial; Gurobi reference manual, “Callbacks”, <code>LazyConstraints</code>, <code>PreCrush</code> (all cited on the slides).`,
  ],
};
