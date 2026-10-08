const R = String.raw;

export default {
  id: 't103',
  lead: R`A relaxation makes a problem <b>less restrictive</b>: it keeps every feasible solution of the original and may admit more. It is worth building when the relaxed problem is easier to solve or has structure an algorithm can exploit.`,
  sections: [
    {
      title: 'Definition and the direction of the bound',
      html: R`
<p>The slides state everything for a <b>minimisation</b> problem</p>
$$z^*=\min\{c(x):\ x\in X\}.$$
<p>A relaxation replaces $X$ by a set $R$ with $X\subseteq R$. Minimising over a larger set can only give a smaller (or equal) value:</p>
$$z_R=\min\{c(x):\ x\in R\}\ \le\ z^* .$$
<p>So for a minimisation the relaxed optimum is a <b>lower bound</b>; for a maximisation the same enlargement gives an <b>upper bound</b>.</p>
<p><b>Workshop check.</b> Let $R$ be the continuous region of the workshop example and $X=R\cap\mathbb{Z}^2_+$ the integer plans, so $X\subseteq R$, with the same objective $x+10y$. The LP admits $(1.3,5)$ worth 51.3. Allowing more production plans cannot reduce the maximum profit, so this is an upper bound: $z^*=42\le z_R=51.3$.</p>
<p>A relaxation is used for three things: a <b>bound</b> on the best value still possible, a <b>tractable approximation</b> of a difficult feasible region, and a <b>structured subproblem</b> inside a larger algorithm.</p>`,
    },
    {
      title: 'When the relaxed optimum solves the original problem',
      html: R`
<div class="callout"><div class="callout-title">Key fact</div>If $x_R$ is optimal for a relaxation <b>and</b> satisfies every constraint and variable-domain requirement of the original problem, then $x_R$ is optimal for the original problem.</div>
<p>Why: $x_R$ is feasible for the original problem, so its value is at least $z^*$ (minimisation); the relaxation proves no original solution can be better than $z_R$. Both together give $c(x_R)=z_R=z^*$.</p>
<p>This one-line argument is used again and again: an integer LP optimum in a branch-and-bound node (fathoming by integrality), a master solution that satisfies all omitted subtour rows in row generation, an LP over a totally unimodular matrix.</p>`,
    },
    {
      title: 'Ways to build a relaxation',
      html: R`
<table class="data-table left">
<thead><tr><th>Operation</th><th>Example</th></tr></thead>
<tbody>
<tr><td><b>Continuous relaxation</b> (the most common in MIP)</td><td>$x_j\in\mathbb{Z}\ \to\ x_j\in\mathbb{R}$; for a binary, $x_j\in\{0,1\}\ \to\ 0\le x_j\le 1$. Constraints and objective unchanged.</td></tr>
<tr><td><b>Removing constraints</b></td><td>$X=\{x: Ax\le b,\ Dx\le d\}\ \to\ R=\{x: Ax\le b\}$</td></tr>
<tr><td><b>Weakening constraints</b></td><td>$a^\top x\le 10\ \to\ a^\top x\le 12$</td></tr>
<tr><td><b>Combining</b></td><td>remove some constraints, weaken others, relax selected variable domains</td></tr>
</tbody></table>
<p><b>Conditions for a valid relaxation</b> of this kind: $X\subseteq R$, <b>and</b> every original feasible solution keeps its original objective value. The second condition matters as soon as the objective is modified.</p>
<h3>Lagrangian relaxation</h3>
<p>Selected difficult constraints are moved into the objective and penalised. For $X=\{x\in X_0:\ Ax=b\}$ and any multiplier vector $\lambda$ (unrestricted in sign, because the constraints are equalities):</p>
$$L(\lambda)=\min_{x\in X_0}\big\{c(x)+\lambda^\top(Ax-b)\big\}.$$
<p>For every original feasible $x$ the penalty is zero, so that $x$ keeps its cost and is still available in the larger set $X_0$: hence $L(\lambda)\le z^*$ <b>for every</b> $\lambda$. The objective changes only outside $X$, and the remaining problem over $X_0$ may have a specialised algorithm. Class 8 builds a whole method on this.</p>`,
    },
    {
      title: 'Comparing relaxations',
      html: R`
<p>For a minimisation, if</p>
$$X\subseteq R_1\subseteq R_2\qquad\text{then}\qquad z_{R_2}\le z_{R_1}\le z^* .$$
<p>$R_1$ is the <b>stronger</b> relaxation: the smaller set gives the tighter (larger) lower bound.</p>
<ul>
<li>When two relaxations use the <b>same variables</b>, compare their feasible sets directly.</li>
<li>When they use <b>different variables</b>, compare their <b>projections</b> onto a common space.</li>
<li>The number of variables or constraints alone does <b>not</b> determine strength.</li>
</ul>`,
    },
  ],
  moves: [
    R`To show something is a relaxation, check both conditions: $X\subseteq R$ and the objective is unchanged on $X$ (or, for a minimisation, not larger on $X$).`,
    R`State the direction explicitly: “relaxation of a minimisation, hence a lower bound”.`,
    R`To prove optimality from a relaxation, show the relaxed optimum is feasible for the original problem and quote the key fact.`,
    R`To compare two formulations, prove $R_1\subseteq R_2$ (every point of one satisfies the constraints of the other) and exhibit one point of $R_2$ outside $R_1$ if strictness is asked.`,
  ],
  traps: [
    R`Getting the direction backwards. Memory aid: a relaxation can only make the optimum look <i>better</i> than it really is (lower for a minimisation, higher for a maximisation).`,
    R`Calling something a relaxation after changing the objective on feasible points. The Lagrangian works precisely because the penalty vanishes on $X$.`,
    R`Assuming a relaxed optimum that happens to be integer is optimal even though it violates a constraint that was removed. It must be feasible for the <i>whole</i> original problem.`,
    R`“More constraints means stronger” or “fewer variables means stronger”: neither is a valid argument.`,
    R`For an inequality $Ax\le b$ dualised in a minimisation the multiplier must be sign-restricted ($\lambda\ge 0$ with penalty $\lambda^\top(Ax-b)$); only equalities allow unrestricted multipliers.`,
  ],
  refs: [
    R`Slides 103, <i>Relaxations</i> (T. Schettini), all 6 pages.`,
    R`L. A. Wolsey, <i>Integer Programming</i>, 2nd ed., chapters 1–3 (bounds, relaxations, formulations).`,
  ],
};
