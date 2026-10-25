const R = String.raw;

export default {
  id: 't103',
  lead: R`A relaxation makes a problem <b>less restrictive</b>: it keeps every feasible solution of the original and may admit more. It is worth building when the relaxed problem is easier to solve or has structure an algorithm can exploit. The slides show five ways to build one: drop integrality, remove constraints, weaken them, <b>aggregate</b> them into one weighted sum (the surrogate relaxation), or move them into the objective (the Lagrangian relaxation).`,
  sections: [
    {
      title: 'Definition and the direction of the bound',
      html: R`
<p>The slides state the theory for a <b>minimisation</b> problem. Here $X$ is the <b>feasible set</b> (all decisions that satisfy every constraint and every variable domain) and $c(x)$ is the objective:</p>
$$z^*=\min\{c(x):\ x\in X\}.$$
<p>A relaxation replaces $X$ by a set $R$ with $X\subseteq R$ (“$X$ is a subset of $R$”: every point of $X$ is also in $R$). Minimising over a larger set can only give a smaller (or equal) value:</p>
$$z_R=\min\{c(x):\ x\in R\}\ \le\ z^* .$$
<p>So for a minimisation the relaxed optimum is a <b>lower bound</b>; for a maximisation the same enlargement gives an <b>upper bound</b>. Both worked examples of the slides (the workshop and the surrogate example) are <b>maximisations</b>, so there the bound points up.</p>
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
<tr><td><b>Surrogate relaxation</b> (next section)</td><td>several inequalities $\to$ one nonnegative weighted sum of them</td></tr>
<tr><td><b>Combining</b></td><td>remove some constraints, weaken others, relax selected variable domains</td></tr>
</tbody></table>
<p>Each operation can only <b>enlarge</b> the feasible set and leaves the objective alone, so each gives a relaxation.</p>`,
    },
    {
      title: 'Surrogate relaxation: one weighted sum instead of several constraints',
      html: R`
<p>A <i>surrogate</i> is a stand-in. A <b>surrogate relaxation</b> “replaces selected inequalities by a single nonnegative weighted sum” (slides 103). The weights are called <b>surrogate multipliers</b>.</p>
<p><b>Set-up.</b> Write the feasible set as $X=\{x\in X_0:\ Ax\le b\}$. The rows of $Ax\le b$ are the selected inequalities $a_i^\top x\le b_i$; the set $X_0$ holds everything we keep unchanged, for example $x\in\mathbb{Z}^n_+$. Choose one weight $u_i\ge 0$ per row and define</p>
$$R(u)=\{x\in X_0:\ u^\top Ax\le u^\top b\}.$$
<p>In words: multiply row $i$ by $u_i$ and add the rows. $u^\top Ax=\sum_iu_i\,a_i^\top x$ and $u^\top b=\sum_iu_ib_i$.</p>
<h3>Why $X\subseteq R(u)$, step by step</h3>
<ol>
<li>Take any $x\in X$. Then $x\in X_0$ and $a_i^\top x\le b_i$ for every row $i$ (definition of $X$).</li>
<li>Multiply row $i$ by $u_i\ge 0$: $u_i\,a_i^\top x\le u_ib_i$. <i>Rule: multiplying both sides of an inequality by a nonnegative number keeps its direction.</i></li>
<li>Add these inequalities: $\sum_iu_i\,a_i^\top x\le\sum_iu_ib_i$, that is $u^\top Ax\le u^\top b$. <i>Rule: inequalities of the same direction can be added.</i></li>
<li>So $x\in R(u)$. Since $x$ was any point of $X$, $X\subseteq R(u)$.</li>
</ol>
<p>The objective and the variable domains in $X_0$ are unchanged, so every original solution keeps its value. Both conditions for a valid relaxation hold. Step 2 also shows why the weights must be nonnegative: a negative weight would flip one inequality, and the sum would no longer follow from $Ax\le b$.</p>
<h3>The slides' example</h3>
$$z^*=\max\{3x+2y:\ 2x+y\le 5,\ x+2y\le 5,\ x,y\in\mathbb{Z}_+\}.$$
<ol>
<li>Weights $u_1=u_2=1$. Add the two rows: $(2x+y)+(x+2y)\le 5+5$, that is $$3x+3y\le 10.$$</li>
<li>The relaxed optimum is $(3,0)$, worth $3\cdot3+2\cdot0=9$. <i>Check by hand (our working; the slide gives the result):</i> $x+y$ is a whole number and $3(x+y)\le 10$, so $x+y\le 3$. Then $3x+2y=2(x+y)+x\le 2\cdot3+3=9$, because $x\le x+y\le 3$. The point $(3,0)$ reaches 9.</li>
<li>$(3,0)$ violates $2x+y\le 5$, because $2\cdot 3+0=6\gt 5$. So it is <b>not</b> feasible for the original problem, and the key fact above does not apply: we only get a bound.</li>
<li>The original optimum is $(2,1)$, worth $3\cdot2+2\cdot1=8$. It satisfies both rows: $2\cdot2+1=5\le 5$ and $2+2\cdot1=4\le 5$.</li>
<li>This is a maximisation, so the surrogate relaxation gives the <b>upper bound</b> $z^*=8\le z_R=9$.</li>
</ol>
<h3>Choosing the multipliers</h3>
<p>“Different nonnegative weights can give different bounds.” For a <b>minimisation</b>, every $u\ge 0$ gives</p>
$$z_S(u)=\min\{c(x):\ x\in R(u)\}\le z^*,$$
<p>and we seek the weights that make this lower bound <b>as large as possible</b> (for a maximisation: the upper bound as small as possible). “Aggregation reduces the number of constraints, but the remaining integer problem may still be difficult” (slides 103): the surrogate problem still has $x,y\in\mathbb{Z}_+$.</p>
<div class="callout"><div class="callout-title">Other weights on the same example (beyond the slides: our own computation, checked by enumeration)</div>
<table class="data-table">
<thead><tr><th>Weights $u$</th><th>Surrogate constraint</th><th>Surrogate optimum</th><th>Upper bound</th></tr></thead>
<tbody>
<tr><td>$(1,1)$ (slides)</td><td>$3x+3y\le 10$</td><td>$(3,0)$</td><td>9</td></tr>
<tr><td>$(2,1)$</td><td>$5x+4y\le 15$</td><td>$(3,0)$</td><td>9</td></tr>
<tr><td>$(3,1)$</td><td>$7x+5y\le 20$</td><td>$(2,1)$ or $(0,4)$</td><td>8 $=z^*$</td></tr>
<tr><td>$(1,0)$</td><td>$2x+y\le 5$</td><td>$(0,5)$</td><td>10</td></tr>
<tr><td>$(0,1)$</td><td>$x+2y\le 5$</td><td>$(5,0)$</td><td>15</td></tr>
</tbody></table>
<p>The weights $(3,1)$ close the gap on this instance, although $(0,4)$ is not feasible for the original problem. A zero weight drops a row: $u=(1,0)$ is exactly “remove $x+2y\le 5$”, and it gives a worse bound than $(1,1)$.</p></div>`,
    },
    {
      title: 'Valid relaxations, and the Lagrangian relaxation',
      html: R`
<div class="callout"><div class="callout-title">Conditions for a valid relaxation (slides 103)</div>For the feasible-set relaxations defined above, the requirements are $X\subseteq R$, <b>and</b> that every original feasible solution retains its original objective value.</div>
<p class="small muted">Textbook generalisation (beyond the slides): Wolsey also accepts a relaxation with a new objective $c'$ when, for a minimisation, $c'(x)\le c(x)$ for every $x\in X$. Lagrangian relaxation of <i>inequalities</i> needs this wider version. In a written answer, quote the slide's version (our advice).</p>
<h3>Lagrangian relaxation</h3>
<p>Selected difficult constraints are moved into the objective and penalised. For $X=\{x\in X_0:\ Ax=b\}$ and any multiplier vector $\lambda$ (unrestricted in sign, because the constraints are equalities):</p>
$$L(\lambda)=\min_{x\in X_0}\big\{c(x)+\lambda^\top(Ax-b)\big\}.$$
<p>For every original feasible $x$ the penalty is zero, so that $x$ keeps its cost and is still available in the larger set $X_0$: hence $L(\lambda)\le z^*$ <b>for every</b> $\lambda$. The objective changes only outside $X$, and the remaining problem over $X_0$ may have a specialised algorithm. Class 8 builds a whole method on this.</p>
<h3>Three ways to relax the same constraints, compared</h3>
<table class="data-table left">
<thead><tr><th></th><th>Remove the rows</th><th>Surrogate</th><th>Lagrangian</th></tr></thead>
<tbody>
<tr><td>What happens to the rows</td><td>deleted</td><td>replaced by one weighted sum $u^\top Ax\le u^\top b$</td><td>moved into the objective as a penalty</td></tr>
<tr><td>Multipliers</td><td>none</td><td>$u\ge 0$</td><td>$\lambda$ unrestricted (equalities, as on the slides)</td></tr>
<tr><td>Objective</td><td>unchanged</td><td>unchanged</td><td>changes outside $X$</td></tr>
<tr><td>What remains to solve</td><td>the other rows over $X_0$</td><td>one aggregated row over $X_0$: still an integer problem</td><td>a problem over $X_0$ alone</td></tr>
</tbody></table>
<p><b>Same weights, which bound is better? (beyond the slides: a short argument of ours)</b> Take a minimisation with inequalities $Ax\le b$, the same weights $u\ge 0$ for both methods, and the Lagrangian $L(u)=\min_{x\in X_0}\{c(x)+u^\top(Ax-b)\}$.</p>
<ol>
<li>$R(u)\subseteq X_0$, and a minimum over a smaller set is larger or equal: $L(u)\le\min_{x\in R(u)}\{c(x)+u^\top(Ax-b)\}$.</li>
<li>Every $x\in R(u)$ has $u^\top Ax\le u^\top b$, so $u^\top(Ax-b)\le 0$ and the penalty can only lower the cost: $\min_{x\in R(u)}\{c(x)+u^\top(Ax-b)\}\le\min_{x\in R(u)}c(x)=z_S(u)$.</li>
<li>Together: $L(u)\le z_S(u)\le z^*$. The surrogate bound is at least as tight; the price is a harder subproblem, because it keeps one constraint.</li>
</ol>`,
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
    R`To show something is a relaxation, check both conditions of the slides: $X\subseteq R$, and every original feasible solution keeps its objective value. (The textbook's wider version, “for a minimisation, not larger on $X$”, is beyond the slides.)`,
    R`State the direction explicitly: “relaxation of a minimisation, hence a lower bound”; “relaxation of a maximisation, hence an upper bound”.`,
    R`To prove optimality from a relaxation, show the relaxed optimum is feasible for the original problem and quote the key fact.`,
    R`To build a surrogate: (1) pick the rows and weights $u_i\ge 0$; (2) multiply each row by its weight and add, giving $u^\top Ax\le u^\top b$; (3) keep $X_0$ and the objective; (4) solve the one-constraint integer problem; (5) state the bound and its direction.`,
    R`After solving a surrogate, test its optimum on every original row. If one fails (slides: $2\cdot3+0=6\gt 5$), you have a bound, not a solution.`,
    R`To compare two formulations, prove $R_1\subseteq R_2$ (every point of one satisfies the constraints of the other) and exhibit one point of $R_2$ outside $R_1$ if strictness is asked.`,
  ],
  traps: [
    R`Getting the direction backwards. Memory aid: a relaxation can only make the optimum look <i>better</i> than it really is (lower for a minimisation, higher for a maximisation).`,
    R`Calling something a relaxation after changing the objective on feasible points. The Lagrangian works precisely because the penalty vanishes on $X$.`,
    R`Assuming a relaxed optimum that happens to be integer is optimal even though it violates a constraint that was removed. It must be feasible for the <i>whole</i> original problem.`,
    R`Reporting the surrogate optimum $(3,0)$ as a solution. It violates $2x+y\le 5$; the surrogate only proves $z^*\le 9$.`,
    R`Using a negative surrogate weight. It flips a row, the sum is no longer implied by $Ax\le b$, and $R(u)$ may cut off feasible points.`,
    R`Dropping integrality when solving the surrogate problem. The surrogate keeps $X_0$ (here $x,y\in\mathbb{Z}_+$). With it, $u=(1,1)$ gives 9; without it you would get the weaker 10 at $(10/3,0)$ (our computation).`,
    R`Mixing up surrogate and Lagrangian: the surrogate keeps the objective and changes the constraints; the Lagrangian changes the objective.`,
    R`“More constraints means stronger” or “fewer variables means stronger”: neither is a valid argument.`,
    R`For an inequality $Ax\le b$ dualised in a minimisation the multiplier must be sign-restricted ($\lambda\ge 0$ with penalty $\lambda^\top(Ax-b)$); only equalities allow unrestricted multipliers. (The slides treat only equalities; the inequality case is class 8 material.)`,
  ],
  refs: [
    R`Slides 103, <i>Relaxations</i> (T. Schettini), revised version: 21 pages (<code>3. Relaxations.pdf</code>), and its reading version <code>103-relaxations.reading.html</code> with the same text. The surrogate relaxation (pp. 12–14) is new in this version; pp. 15–19 hold combining, the validity conditions, the Lagrangian relaxation and strength.`,
    R`F. Glover (1968), “Surrogate Constraints”, <i>Operations Research</i> 16(4), 741–749 (cited on the slides).`,
    R`L. A. Wolsey, <i>Integer Programming</i>, 2nd ed., Wiley 2021, chapters 1–3. Also cited on the slides: Ahuja, Magnanti and Orlin, <i>Network Flows</i> (1993); A. Schrijver, <i>Combinatorial Optimization</i> (2003).`,
  ],
};
