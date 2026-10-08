const R = String.raw;

export default {
  id: 't206a',
  lead: R`General-purpose cuts ignore what the constraints mean. When a model contains a recognisable structure (mutual conflicts, binary items sharing a capacity) a whole <b>family</b> of strong valid inequalities comes with it. This lesson covers the two combinatorial families: cliques and knapsack covers.`,
  sections: [
    {
      title: 'Families of valid inequalities',
      html: R`
<p>An inequality $\alpha^\top x\le\beta$ is valid for $X$ if every feasible point satisfies it ($X$ includes the integrality requirements). If it excludes the current LP solution it is called a <b>cut for that point</b>.</p>
<p>A <b>family</b> is a collection described by a common rule, $\alpha(t)^\top x\le\beta(t)$, $t\in T$: each index $t$ (a subset of items, a clique, a time period) gives one inequality. A family can contain exponentially many members; we search for violated ones as needed.</p>
<table class="data-table left">
<thead><tr><th>Structure in the model</th><th>Valid inequalities</th><th>Why valid</th><th>How to look for a violation</th></tr></thead>
<tbody>
<tr><td>Mutually conflicting choices</td><td>Clique</td><td>pairwise conflicting choices</td><td>weighted clique search</td></tr>
<tr><td>Binary items sharing a capacity</td><td>Cover, extended cover</td><td>selected weights exceed capacity</td><td>knapsack search, then extension</td></tr>
<tr><td></td><td>Lifted cover</td><td>residual capacity limits other choices</td><td>optimise lifting coefficients</td></tr>
<tr><td>Continuous flows with binary activation</td><td>Flow cover</td><td>binary activation limits flow</td><td>candidate cover and violation check</td></tr>
<tr><td>Production, inventory, demand</td><td>Lot sizing</td><td>demand needs production and set-ups</td><td>period and prefix-sum checks</td></tr>
</tbody></table>
<p>These structures can be used even when they appear inside a larger model. <b>Generating cuts, in four steps:</b> identify a structure and state its assumptions; derive an inequality satisfied by every feasible solution; evaluate it at the current LP solution; add a useful violated inequality and reoptimise.</p>
<p><b>Warm-up on the workshop.</b> Both $x+y$ and $y-x$ are integer, so $x+y\le 6.3$ gives $x+y\le 6$ and $y-x\le 3.7$ gives $y-x\le 3$. Adding these two gives $2y\le 9$, hence $y\le 4$. Together the three inequalities describe the integer hull here.</p>`,
    },
    {
      title: 'Clique inequalities',
      html: R`
<p><b>Four meeting requests.</b> Accept as many as possible with no overlap; meetings 1–3 conflict pairwise, meeting 4 conflicts with none.</p>
$$\max\ x_1+x_2+x_3+x_4\quad\text{s.t.}\quad x_1+x_2\le 1,\ \ x_1+x_3\le 1,\ \ x_2+x_3\le 1,\quad x_i\in\{0,1\}.$$
<p>An integer optimum accepts meeting 4 and one of 1–3: value 2. The LP point $\bar x=(\tfrac12,\tfrac12,\tfrac12,1)$ satisfies every edge constraint and has value 2.5.</p>
<div class="callout"><div class="callout-title">Clique inequality</div>A <b>clique</b> $C$ is a set of pairwise adjacent vertices of the conflict graph. Every pair conflicts, so at most one vertex of $C$ can be selected: $\ \sum_{i\in C}x_i\le 1$.</div>
<p>For $C=\{1,2,3\}$: $x_1+x_2+x_3\le 1$. The LP point violates it ($1.5\gt 1$); with it the LP bound drops from 2.5 to 2, attained by $x=(1,0,0,1)$. Meeting 4 is outside the clique and remains available.</p>
<h3>Separation</h3>
<p>Given the LP values $\bar x_i$ as fixed weights, choose the vertices of a clique with binary $z_i$:</p>
$$\max\sum_{i\in V}\bar x_iz_i\qquad\text{s.t.}\qquad z_i+z_j\le 1\ \ \text{for every non-adjacent pair } \{i,j\},\qquad z_i\in\{0,1\}.$$
<p>Two vertices can be chosen together only if they are adjacent. An objective value <b>above 1</b> identifies a violated clique inequality. Lecture instance: the separator finds $C=\{2,5,7,9\}$ with $0.45+0.50+0.40+0.50=1.85\gt 1$, giving the cut $x_2+x_5+x_7+x_9\le 1$.</p>`,
    },
    {
      title: 'Cover inequalities',
      html: R`
$$\max\ 6x_1+6x_2+6x_3+10x_4\qquad\text{s.t.}\qquad 4x_1+4x_2+4x_3+7x_4\le 10,\qquad x\in\{0,1\}^4 .$$
<p>The integer optimum takes two of the first three items: value 12. Profit per unit of weight is 1.5 for items 1–3 and $10/7\approx1.43$ for item 4, so one optimal LP solution is $\bar x=(0.5,1,1,0)$ with $z_{LP}=15$: a root gap of 25%.</p>
<div class="callout"><div class="callout-title">Cover inequality</div>A set $C$ is a <b>cover</b> when $\sum_{j\in C}a_j\gt b$. The items of $C$ cannot all be selected, so $$\sum_{j\in C}x_j\le|C|-1 .$$ <b>Validity:</b> if all items of $C$ were selected their weight would exceed the capacity; so at least one is excluded.</div>
<p>$C=\{1,2,3\}$: $4+4+4=12\gt 10$, so $x_1+x_2+x_3\le 2$. At $\bar x$ the left-hand side is 2.5: violated.</p>
<p>A cover is <b>minimal</b> if removing any one item leaves a set that fits. Here the minimal covers are $\{1,4\},\{2,4\},\{3,4\},\{1,2,3\}$.</p>
<h3>Separation</h3>
<p>To separate $\bar x$ we need a cover ($\sum_Ca_j\gt b$) that is violated ($\sum_C\bar x_j\gt|C|-1$, i.e. $\sum_C(1-\bar x_j)\lt 1$). With integer data, let $z_j=1$ when item $j$ is in the cover:</p>
$$\min\sum_j(1-\bar x_j)\,z_j\qquad\text{s.t.}\qquad\sum_ja_jz_j\ge b+1,\qquad z_j\in\{0,1\}.$$
<p>An optimum <b>below 1</b> identifies a violated cover. Finding it means solving another knapsack problem.</p>
<h3>Adding all minimal covers (static generation)</h3>
<p>For four items one can simply add all four: $x_1+x_4\le1$, $x_2+x_4\le1$, $x_3+x_4\le1$, $x_1+x_2+x_3\le2$. The bound falls only from 15 to $104/7\approx14.86$, still $20/7\approx2.86$ above the optimum.</p>
<ul>
<li>Advantages of static generation: the first LP already contains the inequalities, presolve can use them, they can be inspected, and no separation routine or callback is needed. Some may never be active.</li>
<li>It does not scale: with unit weights and capacity $k$, every subset of size $k+1$ is a minimal cover, $\binom{n}{k+1}$ of them, exponential when $k+1\approx n/2$.</li>
</ul>`,
    },
    {
      title: 'Extended covers',
      html: R`
<p>For nonnegative variables an inequality $\alpha^\top x\le\beta$ is strengthened by reducing the right-hand side or <b>increasing a coefficient</b>, as long as it stays valid.</p>
<div class="callout"><div class="callout-title">Extended cover inequality</div>For a cover $C$ let $M=\max_{i\in C}a_i$ and $E(C)=C\cup\{j\notin C:\ a_j\ge M\}$. Then $$\sum_{j\in E(C)}x_j\le|C|-1 .$$</div>
<p><b>Why:</b> any $|C|$ selected items of $E(C)$ weigh at least as much as the original cover, because each added item can replace a missing cover item without reducing the weight; so they cannot fit.</p>
<p>Example: $C=\{1,2,3\}$ has $M=4$ and item 4 weighs $7\ge 4$, so $E(C)=\{1,2,3,4\}$ and $x_1+x_2+x_3+x_4\le 2$. The LP-feasible point $\bar x=(1,1,0,\tfrac27)$ ($4+4+7\cdot\tfrac27=10$) satisfies the base cover and violates the extension: $1+1+\tfrac27\gt 2$.</p>
<p>The extension gives item 4 the coefficient 1. <b>Lifting</b> (next lesson) finds the largest valid coefficient, here 2.</p>`,
    },
  ],
  moves: [
    R`For a cover: show $\sum_Ca_j\gt b$ (cover), show each $\sum_Ca_j-a_i\le b$ (minimal), then write $\sum_Cx_j\le|C|-1$.`,
    R`To test violation at $\bar x$ compute either $\sum_C\bar x_j$ against $|C|-1$ or $\sum_C(1-\bar x_j)$ against 1.`,
    R`For a clique: check all pairs are edges of the conflict graph, write $\sum_Cx_i\le 1$, evaluate at $\bar x$.`,
    R`For an extended cover: state $M$, list the outside items with $a_j\ge M$, keep the right-hand side $|C|-1$.`,
    R`State the separation problem with its objective, constraint and the threshold (above 1 for cliques, below 1 for covers).`,
  ],
  traps: [
    R`Using “$\ge b$” in the definition of a cover. A cover needs total weight <b>strictly greater</b> than $b$ (with integer data, $\ge b+1$).`,
    R`Changing the right-hand side to $|E(C)|-1$ for an extended cover. It stays $|C|-1$.`,
    R`Writing a clique inequality for a set that is not a clique (one missing edge and both variables can be 1).`,
    R`Thinking that adding all cover inequalities gives the integer hull: the lecture example keeps a gap of 2.86 until the lifted cover is added.`,
    R`Mixing the thresholds: clique separation maximises and compares with 1 from above; cover separation minimises and compares with 1 from below.`,
  ],
  refs: [
    R`Slides 206, <i>Problem-Specific Valid Inequalities</i> (T. Schettini): families, cliques, covers, static generation, extended covers.`,
    R`Wolsey, <i>Integer Programming</i>, 2nd ed., chapters 3 and 8; Nemhauser and Wolsey (1988), chapters I.4 and II.2.`,
  ],
};
