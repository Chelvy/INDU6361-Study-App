const R = String.raw;

export default {
  id: 't402',
  lead: R`Benders decomposition is for models with a few <b>complicating variables</b> (typically integer design decisions) such that, once they are fixed, what remains is an easy linear program. The continuous variables are projected out and replaced by cuts generated from the LP <b>dual</b>: row generation on the value function.`,
  sections: [
    {
      title: 'Setting',
      html: R`
$$z^*=\min\ f^\top y+c^\top x\qquad\text{s.t.}\qquad Ax+By\ge b,\quad x\ge 0,\quad y\in Y .$$
<p>$y$: complicating variables (e.g. which facilities to open), with $Y$ containing integrality and the constraints on $y$ alone. $x$: continuous operating variables. For a <b>fixed</b> $\bar y$ the rest is the linear <b>subproblem</b></p>
$$Q(\bar y)=\min\{c^\top x:\ Ax\ge b-B\bar y,\ x\ge 0\},$$
<p>and the whole problem is $\min_{y\in Y}\ f^\top y+Q(y)$. The difficulty is that $Q$ is known only implicitly.</p>`,
    },
    {
      title: 'The dual subproblem is the key',
      html: R`
$$Q(\bar y)=\max\{u^\top(b-B\bar y):\ u^\top A\le c^\top,\ u\ge 0\}.$$
<div class="callout"><div class="callout-title">Observation</div>The dual feasible region $D=\{u\ge 0:\ u^\top A\le c^\top\}$ <b>does not depend on $y$</b>; only the objective does. So the same finite lists of extreme points $u^p$ and extreme rays $v^r$ of $D$ serve for every $y$.</div>
<ul>
<li>If the dual has a finite optimum it is attained at an extreme point: $Q(y)=\max_pu^{p\top}(b-By)$, a maximum of affine functions of $y$, hence <b>convex and piecewise linear</b>.</li>
<li>The primal subproblem is <b>infeasible</b> for $y$ exactly when the dual is unbounded, i.e. when some ray has $v^{r\top}(b-By)\gt 0$.</li>
</ul>
<p>This gives the <b>Benders reformulation</b> in the variables $(y,\theta)$ only:</p>
$$\min\ f^\top y+\theta\quad\text{s.t.}\quad\theta\ge u^{p\top}(b-By)\ \ \forall p\ \ \text{(optimality cuts)},\qquad 0\ge v^{r\top}(b-By)\ \ \forall r\ \ \text{(feasibility cuts)},\qquad y\in Y .$$
<p>It has exponentially many rows, so they are generated on demand.</p>`,
    },
    {
      title: 'The algorithm',
      html: R`
<ol>
<li><b>Master</b> (relaxed: only the cuts found so far, plus a valid lower bound on $\theta$ so that it is bounded). Solve it: $(\bar y,\bar\theta)$. Its value $f^\top\bar y+\bar\theta$ is a <b>lower bound</b>.</li>
<li><b>Subproblem</b> at $\bar y$ (primal or dual).
 <ul>
 <li>Infeasible: take a dual ray $\bar v$ and add the <b>feasibility cut</b> $\bar v^\top(b-By)\le 0$.</li>
 <li>Feasible with value $Q(\bar y)$ and dual optimum $\bar u$: $f^\top\bar y+Q(\bar y)$ is an <b>upper bound</b> (the pair $(\bar y,x)$ is feasible). If $Q(\bar y)\gt\bar\theta$, add the <b>optimality cut</b> $\theta\ge\bar u^\top(b-By)$.</li>
 </ul></li>
<li>Stop when lower and upper bounds meet (within tolerance); otherwise return to step 1.</li>
</ol>
<p><b>Why the cuts are valid for every $y$:</b> $\bar u$ is dual feasible whatever $y$ is, so by weak LP duality $Q(y)\ge\bar u^\top(b-By)$. The cut is tight at the $\bar y$ that produced it, so it cuts off the current master solution. Finitely many extreme points and rays give finite termination.</p>
<p><b>Structure of the method:</b> the master is a relaxation that grows (lower bounds nondecreasing); the subproblems supply feasible solutions (best upper bound kept). It is the pattern of slides 202 with cuts coming from LP duality instead of connectivity.</p>`,
    },
    {
      title: 'A complete small example',
      html: R`
<p>Two design decisions $y\in\{0,1\}^2$ with fixed costs $f=(10,14)$. Two requirements $h=(6,8)$; design $j$ covers $T_{ij}$ units of requirement $i$; any shortfall $x_i$ is bought at unit cost $c=(3,4)$:</p>
$$Q(y)=\min\ 3x_1+4x_2\quad\text{s.t.}\quad x_1\ge 6-4y_1-2y_2,\quad x_2\ge 8-3y_1-6y_2,\quad x\ge 0 .$$
<p>The subproblem is always feasible (complete recourse), so only optimality cuts occur. Its dual is $\max\ u_1(6-4y_1-2y_2)+u_2(8-3y_1-6y_2)$ with $0\le u_1\le 3$, $0\le u_2\le 4$: set $u_i=c_i$ where the shortfall is positive, $0$ otherwise.</p>
<ol>
<li><b>Master 1</b> (no cuts, $\theta\ge 0$): $\bar y=(0,0)$, $\bar\theta=0$, lower bound 0.</li>
<li><b>Subproblem at $(0,0)$:</b> $x=(6,8)$, $Q=18+32=50$, upper bound $0+50=50$. Dual $\bar u=(3,4)$. Cut: $\theta\ge 3(6-4y_1-2y_2)+4(8-3y_1-6y_2)=50-24y_1-30y_2$.</li>
<li><b>Master 2:</b> $\min\ 10y_1+14y_2+\theta$ with $\theta\ge 50-24y_1-30y_2$, $\theta\ge 0$. Values: $(0,0)$: 50; $(1,0)$: $10+26=36$; $(0,1)$: $14+20=34$; $(1,1)$: $24+0=24$. So $\bar y=(1,1)$, $\bar\theta=0$, lower bound 24.</li>
<li><b>Subproblem at $(1,1)$:</b> shortfalls $6-6=0$ and $8-9\lt 0$, so $x=(0,0)$, $Q=0=\bar\theta$. Upper bound $24+0=24$.</li>
</ol>
<p>Bounds meet: $y^*=(1,1)$ with cost 24, proved with <b>one cut</b> out of the four the full reformulation could need. (Enumeration confirms: 50, 36, 34, 24.)</p>`,
    },
    {
      title: 'Practical points',
      html: R`
<ul>
<li><b>Branch-and-Benders-cut.</b> Instead of re-solving the master MIP from scratch, add Benders cuts as <b>lazy constraints</b> in a callback whenever the solver finds an integer $\bar y$: one search tree, as in slides 202.</li>
<li><b>Separable subproblems.</b> If the subproblem splits by scenario, commodity or customer once $y$ is fixed, solve the pieces independently and add one cut per piece (multi-cut) or their sum (single cut).</li>
<li><b>Cut quality.</b> Degenerate subproblems have many dual optima and not all give equally strong cuts; “Pareto-optimal” cuts and good initial cuts matter in practice. Big-M links between $y$ and $x$ produce weak cuts.</li>
<li><b>Feasibility cuts</b> can often be avoided by adding constraints on $y$ that guarantee a feasible subproblem, or by penalised slack variables (as in the example).</li>
<li><b>Integer subproblems</b> break LP duality; generalisations (logic-based or combinatorial Benders) derive cuts from other arguments.</li>
<li>Benders is the dual counterpart of Dantzig–Wolfe: Benders generates <b>rows</b> of a master in the $y$-space, Dantzig–Wolfe generates <b>columns</b>.</li>
</ul>`,
    },
  ],
  moves: [
    R`Identify the complicating variables $y$, write the subproblem for fixed $y$ and its dual; say that the dual feasible set does not depend on $y$.`,
    R`For an iteration give: master solution and lower bound; subproblem value, dual solution and upper bound; the cut, written in $(y,\theta)$.`,
    R`Justify the cut by weak duality and note that it is tight at the current $\bar y$.`,
    R`Distinguish the two cut types by what the subproblem returned: optimal dual solution → optimality cut; dual ray (primal infeasible) → feasibility cut.`,
    R`Stop when lower bound = upper bound and name the optimal $y$.`,
  ],
  traps: [
    R`Treating the master value as an upper bound. The master is a relaxation: it gives the <b>lower</b> bound of a minimisation.`,
    R`Writing the cut with the numbers $b-B\bar y$ plugged in. The cut must keep $y$ as a variable: $\theta\ge\bar u^\top(b-By)$.`,
    R`Adding an optimality cut when the subproblem is infeasible (there is no finite $Q(\bar y)$): a feasibility cut is needed.`,
    R`Forgetting a lower bound on $\theta$ in the first master, which is then unbounded.`,
    R`Thinking the upper bound decreases monotonically: keep the best one found.`,
    R`Putting integer variables in the subproblem and still using LP duals.`,
  ],
  refs: [
    R`Course outline, class 9 (slides not yet released when this lesson was written).`,
    R`L. A. Wolsey, <i>Integer Programming</i>, 2nd ed., chapter 12 (Benders' algorithm). J. F. Benders (1962), “Partitioning procedures for solving mixed-variables programming problems”, <i>Numerische Mathematik</i> 4.`,
    R`The student project for this course (Bucarey, Fortz, González-Blanco, Labbé and Mesa, “Benders decomposition for network design covering problems”) applies exactly this scheme with branch-and-Benders-cut.`,
    R`The numerical example is this app's own; the test suite checks on random instances that every generated cut underestimates $Q(y)$ for all $y$ and is tight where it was generated.`,
  ],
};
