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
<p>So before any branching we already know $41\le z^*\le 51.3$. In two dimensions the answer can be read from a picture; with thousands of variables it cannot, which is why a systematic method is needed.</p>
<p>The LP region is a <b>polytope</b>: a polyhedron (a region cut out by finitely many linear inequalities) that is bounded. Its geometry is made of vertices (corners), edges and faces, and linear-optimisation algorithms exploit it.</p>`,
      widget: 'bbWorkshop',
    },
    {
      title: 'Where can the optimum lie? The objective band',
      html: R`
<p>Before branching we know two numbers. The <b>incumbent</b> (the best whole-number plan found so far) is $(1,4)$, worth 41. The <b>LP relaxation</b> (the same model with the whole-number rule dropped) gives 51.3. Any plan that beats the incumbent must therefore have an objective value between them:</p>
$$41\le x+10y\le 51.3 .$$
<p>On the slides' picture this is a strip between two parallel objective lines: $x+10y=41$ (red dashed, the incumbent value) and $x+10y=51.3$ (blue dashed, the LP value), cut to the feasible region and shaded gold. The slides call it the <b>band</b>: “The optimal integer solution must lie in the shaded band. Points below it cannot improve the feasible solution we already have.”</p>
<p>Branching splits the region, and each child gets its own band, from the incumbent value up to the child's own LP value. “Any solution that improves on 41 must lie in one of the shaded bands. The best solution in a subproblem may be worse than 41.”</p>
<table class="data-table left">
<thead><tr><th>Node</th><th>Constraints</th><th>Caption in the slides' figure</th></tr></thead>
<tbody>
<tr><td>0</td><td>root</td><td>band $41\le x+10y\le 51.3$</td></tr>
<tr><td>1</td><td>$x\le 1$</td><td>band $41\le x+10y\le 48$</td></tr>
<tr><td>2</td><td>$x\ge 2$</td><td>band $41\le x+10y\le 45$</td></tr>
<tr><td>3</td><td>$x\le 1$, $y\le 4$</td><td>“UB = 41: no improvement”</td></tr>
<tr><td>4</td><td>$x\le 1$, $y\ge 5$</td><td>“Infeasible”</td></tr>
<tr><td>5</td><td>$x\ge 2$, $y\le 4$</td><td>band $41\le x+10y\le 42.3$</td></tr>
<tr><td>6</td><td>$x\ge 2$, $y\ge 5$</td><td>“Infeasible”</td></tr>
<tr><td>7</td><td>$x=2$, $y\le 4$</td><td>“UB = 42: no improvement” (after the new incumbent 42 the band is the single point $(2,4)$)</td></tr>
<tr><td>8</td><td>$x=3$, $y\le 4$</td><td>“UB = 36 &lt; 42: empty band”</td></tr>
</tbody></table>
<p><b>Which subproblems can we discard?</b> “We can discard a subproblem if its band contains no solution better than the incumbent. This happens when the band is empty, or when it contains only solutions with the same value as the incumbent. We also discard a subproblem if its LP is infeasible.”</p>
<h3>When the LP optimum is already integer</h3>
<p>“If the optimal LP solution is integer, it is also optimal for the integer problem. It is feasible, and we already know that no integer solution can have a higher value. The lower and upper bounds are equal.” This is the key fact of slides 103, used at the root.</p>
<p><b>A separate example</b> (reading version of slides 102): maximise $x+10y$ with $0\le x\le 3$, $y\ge 0$, $y\le x+2$ and $x+y\le 6$. The LP optimum is the corner $(2,4)$. It is integer, so $z^*=42$ and we do not need to branch. This is a different region from the workshop: $(1,4)$ is not feasible here, because $4\gt 1+2$.</p>`,
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
<p>Children inherit their parent's bound until their own LP is solved. Example: open nodes with bounds 48 and 45 and incumbent 41 give a global upper bound of 48. “With an incumbent and no open nodes, the search is complete: $UB=z_P=z^*$.”</p>`,
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
<tr><td><b>Integrality</b></td><td>The LP optimum is integer feasible; update the incumbent if it improves. It is the best solution of this subproblem, so nothing below it can be better.</td></tr>
<tr><td><b>Bound</b></td><td>The subproblem cannot improve the incumbent: its local upper bound is at most the incumbent value (maximisation).</td></tr>
</tbody></table>
<p>For the bound test the slides add: “Equality is enough when seeking one optimal solution.” <i>Our inference, beyond the slides:</i> if you wanted <i>every</i> optimal solution, you would have to keep nodes whose bound equals the incumbent.</p>
<h3>The tree of the example</h3>
<ol>
<li>Root: LP value 51.3 at $(1.3,5)$. Branch on $x$.</li>
<li>$x\le 1$: LP value 48 at $(1,4.7)$. &nbsp; $x\ge 2$: LP value 45 at $(2,4.3)$.</li>
<li>Under $x\le 1$, branch on $y$: $y\le 4$ gives 41 at $(1,4)$, integer but not better than the incumbent (figure: “UB = 41: no improvement”); $y\ge 5$ is infeasible.</li>
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
<p>The node-selection rule may vary between solvers and between exercises; the example always takes the best bound. Read the rule in the question before you start.</p>
<p>The slides also draw the Incumbent and Best UB columns as a step plot over the processed nodes 0, 1, 2, 5, 7: the dual bound steps down 51.3, 48, 45, 42.3, 42, while the primal bound stays at 41 and jumps to 42 at node 7. “The shaded region is the optimality gap remaining after each processed node.”</p>`,
    },
    {
      title: 'Absolute and relative gap',
      html: R`
<p>At every step the optimal value lies in the band $z_P\le z^*\le z_D$, where $z_P$ is the incumbent value and $z_D$ the global bound. The width of this band is the <b>absolute optimality gap</b>: “It tells us how much improvement may still be possible.” In the workshop it starts at $51.3-41=10.3$ (thousand dollars) and falls to 0 when the bounds meet; then the incumbent is optimal.</p>
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
<p>As written in the reading version of the slides:</p>
<ol>
<li>Start with an incumbent, if available, and place the original problem in the open list.</li>
<li>Select an open node and solve its LP relaxation.</li>
<li>If its LP optimum is integer feasible and improves the incumbent, update the incumbent.</li>
<li>Fathom the node if its LP is infeasible, its LP optimum is integer feasible, or its bound cannot improve the incumbent. Otherwise, branch on a fractional integer variable and add the children to the open list.</li>
<li>Update the global bound and repeat until the open list is empty.</li>
</ol>
<div class="callout"><div class="callout-title">When the open list is empty</div>“If an incumbent exists at completion, it is optimal. Otherwise, the problem is infeasible. Here all node LPs are bounded” (every node LP has a finite optimum). Compare with the solver table above: a <i>time limit</i> without an incumbent proves nothing, but a <i>completed</i> search without an incumbent proves infeasibility.</div>
<p>The 9 September PDF ended the loop with “repeat until no open node can improve the incumbent”. The two stopping rules give the same result, because a node that cannot improve the incumbent is fathomed and leaves the open list.</p>
<p>If the primal and dual bounds meet, $z_P=z_D=z^*$: that equality is the certificate, and it was obtained without enumerating every feasible solution.</p>
<p><b>A realistic search trace</b> (slides 102, a figure over about 505 seconds of solver time). The global dual bound falls sharply at the root, under the label “root cutting” (our reading: cutting planes added at the root node, the topic of module 2), then slowly during branching. The incumbent improves in a few sudden jumps (“new incumbent”). The relative gap passes a dashed “2% threshold” line and ends at “0.29% at 505 s”.</p>
<div class="callout"><div class="callout-title">Dual bounds are usually the issue</div>Finding a good feasible solution is often much easier than proving that nothing better exists, so the dual bound is typically the slow side of an exact search. <b>Strengthening the formulation</b> (next lectures) targets exactly this side. <b>Heuristics</b> deliberately target the primal side and do not try to produce a certificate.</div>
<p>Branch and bound is not the only kind of certificate: <b>dynamic programming</b> organises the proof differently, with a recurrence that evaluates all relevant states and certifies the value of each subproblem.</p>`,
    },
  ],
  moves: [
    R`State the sense of the problem and which bound is which before computing anything.`,
    R`For every node write: the branching constraints that define it, its LP solution and value, and its fate (branched on which variable, or closed for which of the three reasons).`,
    R`Number nodes in order of creation and keep the incumbent and the best bound up to date after each processed node, as in the log.`,
    R`Use the gap formula with $|z_P|$ in the denominator and say what the percentage certifies.`,
    R`To decide whether a node can be discarded, look at its band $z_P\le c^\top x\le UB_N$: discard it when the band is empty, when it holds only the incumbent value, or when the node LP is infeasible.`,
    R`Finish with one sentence: every leaf is closed (the open list is empty), therefore the incumbent is optimal. If no incumbent was ever found, the problem is infeasible.`,
  ],
  traps: [
    R`Rounding the LP solution: $(1,5)$ is infeasible and the repaired point $(1,4)$ is not optimal. Rounding gives at best a primal bound.`,
    R`Updating the incumbent with a <i>fractional</i> LP value. Only integer-feasible points move the primal bound.`,
    R`Forgetting that a child's LP value can never be better than its parent's: if your child bound exceeds the parent's in a maximisation, there is an arithmetic slip.`,
    R`Closing a <i>fractional</i> node “by integrality”: that is always wrong. An integer node that does not beat the incumbent (node 3 of the workshop) passes both tests: the slides' table files every integer LP optimum under Integrality (“update the incumbent if it improves”), while the figure says “UB = 41: no improvement” and some textbooks call it pruned by bound. The trainer counts it under integrality. On paper write “integer, not better than the incumbent”, which names both.`,
    R`Dividing the gap by $z_D$ instead of $z_P$, or mixing the solver gap with the root gap of a formulation (slides 104), which divides by $\max\{1,|z^*|\}$.`,
    R`Reading “time limit” as “optimal”, or “no incumbent found” as “infeasible”.`,
    R`In a minimisation everything flips: the incumbent is an upper bound, LP values are lower bounds, best-bound selection takes the <i>smallest</i> bound, and a node is closed by bound when its LP value is $\ge$ the incumbent.`,
  ],
  refs: [
    R`Slides 102, <i>Branch and Bound</i> (T. Schettini): the 16-page PDF of 9 September (workshop example, terminology, tree, log, gaps, termination, summary; the term “implicit enumeration” is on its p. 5) and the reading version <code>102-branch-and-bound.reading.html</code>, which adds the objective band, the separate example, the completion rule and new figures.`,
    R`L. A. Wolsey, <i>Integer Programming</i>, 2nd ed., Wiley 2021, chapters 1 and 7–9 (the reference given on the slides).`,
    R`Gurobi Optimizer Reference Manual, parameter <code>MIPGap</code> (cited on the slides for the gap definition).`,
  ],
};
