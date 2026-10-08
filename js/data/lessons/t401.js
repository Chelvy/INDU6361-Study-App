const R = String.raw;

export default {
  id: 't401',
  lead: R`Many hard problems are an easy problem plus a few complicating constraints. Lagrangian relaxation removes those constraints and charges a price for violating them. Every price vector gives a valid bound; the best prices give a bound at least as good as the LP relaxation, and sometimes much better.`,
  sections: [
    {
      title: 'Definition and weak duality',
      html: R`
<p>Slides 103 already gave the equality version: for $X=\{x\in X_0:\ Ax=b\}$ and any $\lambda$, $L(\lambda)=\min_{x\in X_0}\{c(x)+\lambda^\top(Ax-b)\}\le z^*$. The general minimisation form with inequalities:</p>
$$z^*=\min\{c^\top x:\ Ax\ge b,\ x\in X\},\qquad L(u)=\min_{x\in X}\ c^\top x+u^\top(b-Ax),\qquad u\ge 0 .$$
<p>$Ax\ge b$ are the <b>complicating</b> constraints; $X$ (which keeps integrality) is the “easy” set.</p>
<div class="callout"><div class="callout-title">Weak duality</div>For every $u\ge 0$, $L(u)\le z^*$. Proof: take an optimal $x^*$. It lies in $X$, and $b-Ax^*\le 0$ with $u\ge 0$ gives $u^\top(b-Ax^*)\le 0$. So $L(u)\le c^\top x^*+u^\top(b-Ax^*)\le z^*$.</div>
<table class="data-table left">
<thead><tr><th>Dualised constraint (minimisation)</th><th>Penalty term</th><th>Multiplier</th></tr></thead>
<tbody>
<tr><td>$Ax\ge b$</td><td>$u^\top(b-Ax)$</td><td>$u\ge 0$</td></tr>
<tr><td>$Ax\le b$</td><td>$u^\top(Ax-b)$</td><td>$u\ge 0$</td></tr>
<tr><td>$Ax=b$</td><td>$u^\top(b-Ax)$</td><td>$u$ free</td></tr>
</tbody></table>
<p>Rule of thumb: a feasible point must never be penalised, so the penalty term is $\le 0$ on feasible points of a minimisation. For a maximisation everything flips: $L(u)$ is an <b>upper</b> bound and one minimises it.</p>`,
    },
    {
      title: 'The Lagrangian dual and how strong it is',
      html: R`
<p>The best bound is the <b>Lagrangian dual</b></p>
$$w_{LD}=\max_{u\ge 0}L(u).$$
<div class="callout"><div class="callout-title">Strength theorem</div>$$w_{LD}=\min\{c^\top x:\ Ax\ge b,\ x\in\operatorname{conv}(X)\}.$$ Hence $z_{LP}\le w_{LD}\le z^*$, and $w_{LD}=z_{LP}$ when the LP relaxation of $X$ already equals $\operatorname{conv}(X)$ (the <b>integrality property</b>).</div>
<p>Consequences for the choice of what to dualise:</p>
<ul>
<li>If the subproblem over $X$ can be solved as an LP (network matrix, simple bounds), Lagrangian relaxation gives exactly the LP bound: no gain in strength, although the bound may be cheaper to compute.</li>
<li>To beat the LP bound the subproblem must be a genuinely integer problem that is still tractable (a knapsack, a spanning tree, a shortest path with a twist).</li>
<li>The trade-off is always: an <b>easier</b> subproblem gives a <b>weaker</b> bound.</li>
</ul>
<p>Classical choices: for the TSP, dualise the degree constraints and keep a 1-tree (Held–Karp bound); for the generalised assignment problem, dualising the assignment rows leaves independent knapsacks (bound stronger than LP), while dualising the knapsack rows leaves a problem with the integrality property (bound equal to LP); for facility location, dualising the customer-assignment rows makes the problem separate by facility.</p>`,
    },
    {
      title: 'Shape of L and the subgradient method',
      html: R`
<p>For each fixed $x\in X$, $c^\top x+u^\top(b-Ax)$ is linear in $u$; $L$ is the minimum of finitely many such functions, so it is <b>concave and piecewise linear</b>. It is not differentiable at the breakpoints, but a <b>subgradient</b> is always available for free:</p>
$$g=b-Ax(u),\qquad x(u)\ \text{an optimal solution of the subproblem at } u .$$
<div class="callout move"><div class="callout-title">Subgradient iteration</div>
<ol>
<li>Solve the subproblem at $u^k$: get $x^k$ and the bound $L(u^k)$. Keep the best bound.</li>
<li>Compute $g^k=b-Ax^k$. If $g^k\le 0$ (so $x^k$ is feasible) and $u^{k\top}g^k=0$, then $x^k$ is optimal: stop.</li>
<li>Update $u^{k+1}=\max\{0,\ u^k+\mu_kg^k\}$ (no projection for equality constraints).</li>
</ol></div>
<p>Reading the update: a violated constraint ($g_i\gt 0$) gets a higher price, an over-satisfied one a lower price. Step sizes: any sequence with $\mu_k\to 0$ and $\sum_k\mu_k=\infty$ converges; in practice $\mu_k=\varepsilon_k\,\dfrac{\bar w-L(u^k)}{\|g^k\|^2}$ with a target value $\bar w$ (for example the best known primal value) and $0\lt\varepsilon_k\le 2$, halved when the bound stalls. $L(u^k)$ does <b>not</b> increase monotonically.</p>`,
    },
    {
      title: 'A complete small example',
      html: R`
$$z^*=\min\ 6x_1+5x_2+8x_3+4x_4\qquad\text{s.t.}\qquad 3x_1+2x_2+4x_3+x_4\ge 6,\qquad x\in\{0,1\}^4 .$$
<p>Dualise the covering constraint: $L(u)=6u+\sum_j\min\{0,\ c_j-ua_j\}$. The subproblem is solved by inspection: set $x_j=1$ exactly when its Lagrangian cost $c_j-ua_j$ is negative.</p>
<table class="data-table">
<thead><tr><th>$u$</th><th>costs $c_j-ua_j$</th><th>$x(u)$</th><th>$L(u)$</th><th>$g=6-a^\top x(u)$</th></tr></thead>
<tbody>
<tr><td>3</td><td>$-3,\ -1,\ -4,\ 1$</td><td>$(1,1,1,0)$</td><td>$18-8=10$</td><td>$6-9=-3$</td></tr>
<tr><td>$3+\tfrac14(-3)=\tfrac94$</td><td>$-\tfrac34,\ \tfrac12,\ -1,\ \tfrac74$</td><td>$(1,0,1,0)$</td><td>$13.5-1.75=11.75$</td><td>$6-7=-1$</td></tr>
<tr><td>2</td><td>$0,\ 1,\ 0,\ 2$</td><td>ties</td><td>$12$</td><td>between $-1$ and $6$</td></tr>
</tbody></table>
<ul>
<li>At $u=3$ the constraint is over-satisfied ($g=-3$): the price is too high, lower it.</li>
<li>The maximum is at the breakpoint $u=2$, where $L=12$. This equals the LP bound (item 1 fully, item 3 at $\tfrac34$: $6+6=12$), as the theorem predicts, because $\{0,1\}^4$ has the integrality property.</li>
<li>By enumeration $z^*=13$ (items 2 and 3). The duality gap $13-12=1$ cannot be closed by any multiplier.</li>
<li>$x(\tfrac94)=(1,0,1,0)$ happens to be feasible with cost 14: a <b>Lagrangian heuristic</b> solution. Then $11.75\le z^*\le 14$ after two evaluations.</li>
</ul>`,
    },
    {
      title: 'Using the bound',
      html: R`
<ul>
<li><b>Inside branch and bound</b>, in place of the LP bound (useful when $w_{LD}\gt z_{LP}$ or when the LP is too large).</li>
<li><b>Lagrangian heuristics:</b> $x(u)$ is integral and “almost feasible”; repair it to obtain a primal bound, then report the gap.</li>
<li><b>Variable fixing:</b> if forcing $x_j=1$ pushes the Lagrangian bound above the incumbent, fix $x_j=0$.</li>
<li><b>Link to column generation:</b> the Dantzig–Wolfe master LP has value exactly $w_{LD}$; the two methods compute the same bound in different ways (class 10).</li>
</ul>`,
    },
  ],
  moves: [
    R`Write the relaxation explicitly: which constraints are dualised, the sign of the multipliers, and the penalty term with the correct sign.`,
    R`Evaluate $L(u)$: Lagrangian costs, subproblem solution $x(u)$, then $L(u)=c^\top x(u)+u^\top(b-Ax(u))$.`,
    R`Give the subgradient $g=b-Ax(u)$, interpret its sign, and apply $u\leftarrow\max\{0,u+\mu g\}$.`,
    R`State which bound it is (lower for a minimisation) and compare with $z_{LP}$ using the integrality-property test.`,
    R`For optimality of $x(u)$ check both feasibility and complementary slackness $u^\top(b-Ax(u))=0$.`,
  ],
  traps: [
    R`Wrong sign of the penalty, which turns the “bound” into something that is not a bound. Test it: a feasible point must not be penalised.`,
    R`Allowing negative multipliers for an inequality.`,
    R`Concluding that $x(u)$ is optimal because it is feasible. Feasible gives a primal bound; optimality also needs $u^\top(b-Ax)=0$ (or $L(u)=c^\top x$).`,
    R`Expecting the bound to improve at every subgradient step. Keep the best value found.`,
    R`Claiming Lagrangian relaxation always beats the LP bound. With the integrality property the two are equal.`,
    R`Forgetting to keep integrality in the subproblem: relaxing it as well just reproduces the LP dual.`,
  ],
  refs: [
    R`Slides 103, <i>Relaxations</i> (definition of the Lagrangian relaxation for equality constraints). Course outline, class 8. Slides for class 8 were not yet released when this lesson was written.`,
    R`L. A. Wolsey, <i>Integer Programming</i>, 2nd ed., chapter 10 (Lagrangian duality): weak duality, the strength theorem, subgradient algorithm.`,
    R`M. L. Fisher (1985), “An applications oriented guide to Lagrangian relaxation”, <i>Interfaces</i> 15(2); several questions in the bank come from it and from KTH SF2812 exams, with their sources.`,
    R`The numerical example is this app's own; it is checked by enumeration in the test suite ($\max_uL(u)$ equals the LP bound on every generated instance).`,
  ],
};
