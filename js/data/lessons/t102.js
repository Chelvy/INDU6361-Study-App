const R = String.raw;

export default {
  id: 't102',
  lead: R`Branch and bound is <b>implicit enumeration</b>: split the problem into subproblems, bound each one with a relaxation, and discard every subproblem that provably cannot beat the best solution already known. The finished tree is a proof of optimality.`,
  sections: [
    {
      title: 'The workshop example',
      html: R`
<p>Every idea in this lecture is shown on one model. A workshop makes $x$ lots of standard desks (worth 1 each, in thousands of dollars) and $y$ lots of premium desks (worth 10 each); lots cannot be split.</p>
$$\max\ x+10y\qquad\text{s.t.}\qquad 0\le x\le 3,\quad y\le x+3.7,\quad y\le -x+6.3,\quad x,y\in\mathbb{Z}_+ .$$
<ul>
<li>Ignoring integrality (the LP relaxation) gives $(1.3,\ 5)$ with value $51.3$.</li>
<li>The best integer plan is $(2,4)$ with value $42$. It is <i>not</i> a rounding of the LP solution.</li>
<li>Rounding and repairing the LP point gives the feasible plan $(1,4)$ with value $41$. Rounding alone need not stay feasible: $(1,5)$ violates $y\le x+3.7$.</li>
</ul>
<p>So before any branching we already know $41\le z^*\le 51.3$. In two dimensions the answer can be read from a picture; with thousands of variables it cannot, which is why a systematic method is needed.</p>`,
      widget: 'bbWorkshop',
    },
    {
      title: 'Vocabulary: two bounds that move towards each other',
      html: R`
<table class="data-table left">
<thead><tr><th>Term</th><th>Meaning</th><th>In the example (a maximisation)</th></tr></thead>
<tbody>
<tr><td><b>Relaxation</b></td><td>Keeps every feasible integer solution and allows more (here: fractional lots).</td><td>the LP</td></tr>
<tr><td><b>Incumbent</b></td><td>Best feasible integer solution found so far.</td><td>$(1,4)$, later $(2,4)$</td></tr>
<tr><td><b>Primal bound</b> $z_P$</td><td>Value of the incumbent.</td><td>lower bound, 41</td></tr>
<tr><td><b>Dual bound</b> $z_D$</td><td>A limit on the best value still possible, from relaxations.</td><td>upper bound, 51.3</td></tr>
<tr><td><b>Gap</b></td><td>Distance between the two bounds.</td><td>$51.3-41=10.3$</td></tr>
</tbody></table>
<p>The words <i>primal</i> and <i>dual</i> never change; their <i>directions</i> do:</p>
<table class="data-table">
<thead><tr><th>Problem</th><th>Primal bound (feasible solution)</th><th>Dual bound (relaxation)</th></tr></thead>
<tbody><tr><td>Minimisation</td><td>upper bound</td><td>lower bound</td></tr><tr><td>Maximisation</td><td>lower bound</td><td>upper bound</td></tr></tbody></table>
<p>“Dual bound” is MIP vocabulary for <i>any</i> valid bound on the best possible objective; it is not necessarily the value of an LP dual that someone wrote down.</p>
<h3>Node bound and global bound</h3>
<p>A <b>node</b> is a subproblem created by branching. Its LP optimum is a <b>local</b> bound: no integer solution <i>inside that node</i> can do better. The <b>global</b> bound must cover everything that is still unexplored:</p>
$$UB=\max\Big\{z_P,\ \max_{N\in\mathcal{O}}UB_N\Big\},\qquad \mathcal{O}=\text{set of open nodes}.$$
<p>Children inherit their parent's bound until their own relaxation is solved. Example: open nodes with bounds 48 and 45 and incumbent 41 give a global upper bound of 48. When no node is open, $UB=z_P$ and the incumbent is optimal.</p>`,
    },
    {
      title: 'Branching and fathoming',
      html: R`
<p>If an integer variable has the fractional LP value $\bar x_j$, create two subproblems:</p>
$$x_j\le\lfloor\bar x_j\rfloor\qquad\text{or}\qquad x_j\ge\lceil\bar x_j\rceil .$$
<p>Every integer value lies in exactly one branch, and the current fractional value lies in neither, so nothing feasible is lost and the LP point is cut away. In the example $\bar x=1.3$ gives the branches $x\le 1$ and $x\ge 2$.</p>
<p>A node is <b>fathomed</b> (closed) for one of exactly three reasons:</p>
<table class="data-table left">
<thead><tr><th>Reason</th><th>What the relaxation proves</th></tr></thead>
<tbody>
<tr><td><b>Infeasibility</b></td><td>The subproblem contains no feasible solution at all.</td></tr>
<tr><td><b>Integrality</b></td><td>The relaxed optimum is integer feasible: it is the best solution of this subproblem, nothing below it can be better.</td></tr>
<tr><td><b>Bound</b></td><td>The node's bound is no better than the incumbent: the subproblem cannot improve it.</td></tr>
</tbody></table>
<h3>The tree of the example</h3>
<ol>
<li>Root: LP value 51.3 at $(1.3,5)$. Branch on $x$.</li>
<li>$x\le 1$: LP value 48 at $(1,4.7)$. &nbsp; $x\ge 2$: LP value 45 at $(2,4.3)$.</li>
<li>Under $x\le 1$, branch on $y$: $y\le 4$ gives 41 at $(1,4)$, integer but not better than the incumbent; $y\ge 5$ is infeasible.</li>
<li>Under $x\ge 2$, branch on $y$: $y\le 4$ gives 42.3 at $(2.3,4)$; $y\ge 5$ is infeasible.</li>
<li>Under $x\ge 2,\ y\le 4$, branch on $x$: $x\le 2$ gives the integer point $(2,4)$ with value <b>42</b>, the new incumbent; $x\ge 3$ gives 36, closed by bound.</li>
</ol>
<p>All leaves are closed, so $z^*=42$. The tree is an <b>optimality certificate</b>: it shows why no other region can contain a better plan, without listing every plan.</p>`,
    },
    {
      title: 'The search as a log',
      html: R`
<p>The same search written the way a solver prints it. Nodes are numbered in the order they are created; a row is written when a node is processed.</p>
<table class="data-table">
<thead><tr><th>Node</th><th>Depth</th><th>Local UB</th><th>Incumbent</th><th>Best UB</th><th>Gap</th><th>Action</th></tr></thead>
<tbody>
<tr><td>0</td><td>0</td><td>51.3</td><td>41.0</td><td>51.3</td><td>25.1%</td><td>branch on $x$</td></tr>
<tr><td>1</td><td>1</td><td>48.0</td><td>41.0</td><td>48.0</td><td>17.1%</td><td>branch; close 3 and 4</td></tr>
<tr><td>2</td><td>1</td><td>45.0</td><td>41.0</td><td>45.0</td><td>9.8%</td><td>branch; close 6</td></tr>
<tr><td>5</td><td>2</td><td>42.3</td><td>41.0</td><td>42.3</td><td>3.2%</td><td>branch on $x$</td></tr>
<tr><td>7</td><td>3</td><td>42.0</td><td>42.0</td><td>42.0</td><td>0.0%</td><td>incumbent; close 8</td></tr>
</tbody></table>
<p>How to read it: at each row the open node with the <b>largest</b> local upper bound is processed next (best-bound selection), so “Best UB” is that node's bound. Children that close immediately are recorded in the Action column. The gap column is $(\text{Best UB}-\text{Incumbent})/\text{Incumbent}$: $(51.3-41)/41=25.1\%$, $(48-41)/41=17.1\%$, and so on down to zero.</p>
<p>The node-selection rule may vary between solvers and between exercises; the example always takes the best bound. Read the rule in the question before you start.</p>`,
    },
    {
      title: 'Absolute and relative gap',
      html: R`
<p>With $z_P$ the incumbent value and $z_D$ the global bound:</p>
$$\Delta_{MIP}=|z_P-z_D|,\qquad g_{MIP}=\frac{|z_P-z_D|}{|z_P|}\quad\text{(Gurobi's definition, for }z_P\ne 0).$$
<ul>
<li>If both bounds are zero the gap is zero; if only the incumbent is zero it is infinite.</li>
<li>Before an incumbent exists there is no finite relative-gap certificate.</li>
</ul>
<p><b>What a 2% gap means.</b> A maximisation with $z_P=1000$ and $z_D=1020$ has $1000\le z^*\le 1020$, $\Delta_{MIP}=20$ and $g_{MIP}=2\%$. The incumbent is feasible, and the certificate proves that no solution can improve it by more than 20 units, i.e. 2% of its current value.</p>`,
    },
    {
      title: 'What the solver tells you when it stops',
      html: R`
<table class="data-table left">
<thead><tr><th>Reported outcome</th><th>What you may conclude</th></tr></thead>
<tbody>
<tr><td>Optimal</td><td>The solver has met its optimality tolerances.</td></tr>
<tr><td>Time limit, with an incumbent</td><td>A feasible solution is available: report its value, the bound and the gap.</td></tr>
<tr><td>Time limit, without an incumbent</td><td>No feasible solution was found. Infeasibility is <b>not</b> proved.</td></tr>
<tr><td>Infeasible</td><td>The solver has proved the model has no feasible solution.</td></tr>
</tbody></table>
<p>Check the termination status and whether a solution exists <i>before</i> reading variable values.</p>`,
    },
    {
      title: 'The algorithm in five steps, and where the effort goes',
      html: R`
<ol>
<li>Start with an incumbent if a feasible solution is available; put the original problem in the list of open nodes.</li>
<li>Select an open node and solve its relaxation.</li>
<li>Close the node if its relaxation is infeasible, its relaxed optimum is integer feasible, or its bound cannot improve the incumbent.</li>
<li>Otherwise branch on a fractional decision and add the subproblems to the open list.</li>
<li>Update the incumbent and the global bound; repeat until no open node can improve the incumbent.</li>
</ol>
<p>If the primal and dual bounds meet, $z_P=z_D=z^*$: that equality is the certificate, and it was obtained without enumerating every feasible solution.</p>
<div class="callout"><div class="callout-title">Dual bounds are usually the issue</div>Finding a good feasible solution is often much easier than proving that nothing better exists, so the dual bound is typically the slow side of an exact search. <b>Strengthening the formulation</b> (next lectures) targets exactly this side. <b>Heuristics</b> deliberately target the primal side and do not try to produce a certificate.</div>
<p>Branch and bound is not the only kind of certificate: <b>dynamic programming</b> organises the proof differently, with a recurrence that evaluates all relevant states and certifies the value of each subproblem.</p>`,
    },
  ],
  moves: [
    R`State the sense of the problem and which bound is which before computing anything.`,
    R`For every node write: the branching constraints that define it, its LP solution and value, and its fate (branched on which variable, or closed for which of the three reasons).`,
    R`Number nodes in order of creation and keep the incumbent and the best bound up to date after each processed node, as in the log.`,
    R`Use the gap formula with $|z_P|$ in the denominator and say what the percentage certifies.`,
    R`Finish with one sentence: every leaf is closed, therefore the incumbent is optimal.`,
  ],
  traps: [
    R`Rounding the LP solution: $(1,5)$ is infeasible and the repaired point $(1,4)$ is not optimal. Rounding gives at best a primal bound.`,
    R`Updating the incumbent with a <i>fractional</i> LP value. Only integer-feasible points move the primal bound.`,
    R`Forgetting that a child's LP value can never be better than its parent's: if your child bound exceeds the parent's in a maximisation, there is an arithmetic slip.`,
    R`Closing an integer node “by bound” or a fractional node “by integrality”: give the right reason.`,
    R`Dividing the gap by $z_D$ instead of $z_P$, or mixing the solver gap with the root gap of a formulation (slides 104), which divides by $\max\{1,|z^*|\}$.`,
    R`Reading “time limit” as “optimal”, or “no incumbent found” as “infeasible”.`,
    R`In a minimisation everything flips: the incumbent is an upper bound, LP values are lower bounds, best-bound selection takes the <i>smallest</i> bound, and a node is closed by bound when its LP value is $\ge$ the incumbent.`,
  ],
  refs: [
    R`Slides 102, <i>Branch and Bound</i> (T. Schettini), all 16 pages: workshop example, terminology, tree, log, gaps, termination, summary.`,
    R`L. A. Wolsey, <i>Integer Programming</i>, 2nd ed., Wiley 2021, chapters 1 and 7.`,
    R`Gurobi Optimizer Reference Manual, parameter <code>MIPGap</code> (cited on the slides for the gap definition).`,
  ],
};
