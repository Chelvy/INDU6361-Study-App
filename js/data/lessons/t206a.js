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
<p><b>Four meeting requests.</b> Accept as many as possible with no overlap. Meeting 1 runs 09:00–10:00, meeting 2 09:30–10:30, meeting 3 09:45–10:15 and meeting 4 11:00–11:45. Meetings 1–3 are all running between 09:45 and 10:00, so every pair of them conflicts. Meeting 4 conflicts with none.</p>
$$\max\ x_1+x_2+x_3+x_4\quad\text{s.t.}\quad x_1+x_2\le 1,\ \ x_1+x_3\le 1,\ \ x_2+x_3\le 1,\quad x_i\in\{0,1\}.$$
<p>An integer optimum accepts meeting 4 and one of 1–3: value 2. The LP point $\bar x=(\tfrac12,\tfrac12,\tfrac12,1)$ satisfies every edge constraint and has value 2.5.</p>
<div class="callout"><div class="callout-title">Clique inequality</div>A <b>clique</b> $C$ is a set of pairwise adjacent vertices of the conflict graph. Every pair conflicts, so at most one vertex of $C$ can be selected: $\ \sum_{i\in C}x_i\le 1$.</div>
<p>For $C=\{1,2,3\}$: $x_1+x_2+x_3\le 1$. The LP point violates it ($1.5\gt 1$); with it the LP bound drops from 2.5 to 2, attained by $x=(1,0,0,1)$. Meeting 4 is outside the clique and remains available.</p>
<h3>Reading the conflict graph off a model</h3>
<p>Draw one vertex per binary variable. Join $i$ and $j$ by an edge when the model forbids $x_i=x_j=1$, for example through a row $x_i+x_j\le 1$. A clique is <b>maximal</b> when no other vertex can be added to it: no outside vertex is joined to every member.</p>
<div class="callout"><div class="callout-title">Worked example: 20E, Exercise 9</div>Five jobs with the pair rows $x_1+x_2\le1$, $x_1+x_3\le1$, $x_2+x_3\le1$, $x_3+x_4\le1$, $x_3+x_5\le1$, $x_4+x_5\le1$. The graph is two triangles that share vertex 3. The maximal cliques are $\{1,2,3\}$ and $\{3,4,5\}$, so the clique inequalities are $x_1+x_2+x_3\le1$ and $x_3+x_4+x_5\le1$.<br><b>Why the list is complete.</b> Neither triangle can be extended: no outside vertex is joined to all three of its vertices (job 4, for example, is not joined to jobs 1 and 2). And every edge lies in one of the two triangles, so no other maximal clique exists. <a href="#/exercises/20e/9">Open the exercise</a>.</div>
<p>(Beyond the slides.) A smaller clique gives a weaker row. If $K\subset K'$, then $\sum_{i\in K}x_i\le\sum_{i\in K'}x_i\le 1$, because every $x_i\ge 0$. That is why we look for <i>maximal</i> cliques. In Exercise 9 each pair row is implied by the clique row that contains its edge.</p>
<h3>Separation</h3>
<p>Given the LP values $\bar x_i$ as fixed weights, choose the vertices of a clique with binary $z_i$:</p>
$$\max\sum_{i\in V}\bar x_iz_i\qquad\text{s.t.}\qquad z_i+z_j\le 1\ \ \text{for every non-adjacent pair } \{i,j\},\qquad z_i\in\{0,1\}.$$
<p>Two vertices can be chosen together only if they are adjacent. An objective value <b>above 1</b> identifies a violated clique inequality. Lecture instance (11 vertices): every edge row $x_i+x_j\le1$ holds at $\bar x$ (the largest pair sum is $0.50+0.50=1$). Yet the separator finds $C=\{2,5,7,9\}$ with $0.45+0.50+0.40+0.50=1.85\gt 1$, giving the cut $x_2+x_5+x_7+x_9\le 1$. Pair rows cannot see a conflict among four jobs.</p>`,
    },
    {
      title: 'Cover inequalities',
      html: R`
$$\max\ 6x_1+6x_2+6x_3+10x_4\qquad\text{s.t.}\qquad 4x_1+4x_2+4x_3+7x_4\le 10,\qquad x\in\{0,1\}^4 .$$
<p>The integer optimum takes two of the first three items: value 12. Profit per unit of weight is 1.5 for items 1–3 and $10/7\approx1.43$ for item 4, so one optimal LP solution is $\bar x=(0.5,1,1,0)$ with $z_{LP}=15$: a root gap of 25%. (Items 1–3 tie, so other LP optima exist, such as $(1,1,0.5,0)$. The slides pick $(0.5,1,1,0)$.)</p>
<div class="callout"><div class="callout-title">Cover inequality</div>A set $C$ is a <b>cover</b> when $\sum_{j\in C}a_j\gt b$. The items of $C$ cannot all be selected, so $$\sum_{j\in C}x_j\le|C|-1 .$$ <b>Validity:</b> if all items of $C$ were selected their weight would exceed the capacity; so at least one is excluded.</div>
<p>$C=\{1,2,3\}$: $4+4+4=12\gt 10$, so $x_1+x_2+x_3\le 2$. At $\bar x$ the left-hand side is 2.5: violated.</p>
<p>A cover is <b>minimal</b> if removing any one item leaves a set that fits. Here the minimal covers are $\{1,4\},\{2,4\},\{3,4\},\{1,2,3\}$.</p>
<div class="callout"><div class="callout-title">Worked example: list every cover (20E, Exercise 10)</div>Knapsack $5x_1+6x_2+7x_3+13x_4\le 17$. Go through the 15 nonempty subsets by size and write each weight.
<ul>
<li>One item: the heaviest weighs 13, which fits. No cover.</li>
<li>Two items: $\{1,4\}=18$, $\{2,4\}=19$, $\{3,4\}=20$ are covers. $\{1,2\}=11$, $\{1,3\}=12$, $\{2,3\}=13$ fit.</li>
<li>Three items: $\{1,2,3\}=18$, $\{1,2,4\}=24$, $\{1,3,4\}=25$, $\{2,3,4\}=26$. All are covers.</li>
<li>Four items: 31, a cover.</li>
</ul>
So there are <b>8 covers</b>. The <b>4 minimal</b> ones give $x_1+x_4\le1$, $x_2+x_4\le1$, $x_3+x_4\le1$, $x_1+x_2+x_3\le2$. The others give $x_1+x_2+x_4\le2$, $x_1+x_3+x_4\le2$, $x_2+x_3+x_4\le2$, $x_1+x_2+x_3+x_4\le3$.<br>
<b>Proving minimality needs every removal.</b> From $\{1,2,3\}$ (weight $18\gt17$), removing item 1, 2 or 3 leaves 13, 12 or 11. All fit, so it is minimal.<br>
<b>Proving non-minimality needs one removal.</b> Removing item 1 from $\{1,2,4\}$ leaves $\{2,4\}$, of weight $19\gt17$: still a cover. So $\{1,2,4\}$ is not minimal.<br>
(Beyond the slides.) A non-minimal cover gives a weaker row: $x_1+x_2+x_4\le2$ is the sum of $x_2+x_4\le1$ and $x_1\le1$. <a href="#/exercises/20e/10">Open the exercise</a>.</div>
<h3>Separation</h3>
<p>To separate $\bar x$ we need a cover ($\sum_Ca_j\gt b$) that is violated ($\sum_C\bar x_j\gt|C|-1$, i.e. $\sum_C(1-\bar x_j)\lt 1$). With integer data, let $z_j=1$ when item $j$ is in the cover:</p>
$$\min\sum_j(1-\bar x_j)\,z_j\qquad\text{s.t.}\qquad\sum_ja_jz_j\ge b+1,\qquad z_j\in\{0,1\}.$$
<p>An optimum <b>below 1</b> identifies a violated cover. Finding it means solving another knapsack problem.</p>
<h3>Adding all minimal covers (static generation)</h3>
<p>For four items one can simply add all four: $x_1+x_4\le1$, $x_2+x_4\le1$, $x_3+x_4\le1$, $x_1+x_2+x_3\le2$. In JuMP (slides 206) it is a loop that writes every cover row into the model before the first solve:</p>
<pre>covers = minimal_covers(instance)
model, x = knapsack_model(instance)
for C in covers
    @constraint(model, sum(x[j] for j in C) &lt;= length(C) - 1)
end
optimize!(model)</pre>
<p>The opposite approach is <b>separation</b>: add only the violated members found at the current LP point.</p>
<p>The bound falls only from 15 to $104/7\approx14.86$, still $20/7\approx2.86$ above the optimum. In fact the single cover $x_1+x_2+x_3\le2$ already gives $104/7$ (an optimal point is $(1,1,0,\tfrac27)$). The other three covers do not change the bound; the LP just moves to $(\tfrac57,\tfrac57,\tfrac47,\tfrac27)$.</p>
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
<p><b>Practice (20E, Exercise 11, first part).</b> Knapsack $5x_1+6x_2+7x_3+13x_4\le17$, cover $C=\{1,2,3\}$. The largest weight in $C$ is $M=7$. Item 4 weighs $13\ge7$, so it joins: $x_1+x_2+x_3+x_4\le2$. Check: any three of the four items weigh at least $5+6+7=18\gt17$. <a href="#/exercises/20e/11">Open the exercise</a>.</p>
<p>The extension gives item 4 the coefficient 1. <b>Lifting</b> (next lesson) finds the largest valid coefficient, here 2.</p>`,
    },
    {
      title: 'Root bounds: how much each cut helps',
      html: R`
<p>The <b>root bound</b> is the LP value before any branching. On the lecture knapsack, add the cuts one after another and solve the LP again each time (slides 206, charts of the root bounds; the row with the extended cover, bound 14, is only in the HTML reading version, while the PDF goes from 14.86 straight to the lifted cover):</p>
<table class="data-table">
<thead><tr><th>Cuts in the LP (cumulative)</th><th>Root bound</th><th>An optimal LP point</th></tr></thead>
<tbody>
<tr><td>none</td><td>15</td><td>$(\tfrac12,1,1,0)$</td></tr>
<tr><td>the cover $x_1+x_2+x_3\le2$</td><td>$104/7\approx14.86$</td><td>$(1,1,0,\tfrac27)$</td></tr>
<tr><td>all four minimal covers</td><td>$104/7\approx14.86$</td><td>$(\tfrac57,\tfrac57,\tfrac47,\tfrac27)$</td></tr>
<tr><td>+ extended cover $x_1+x_2+x_3+x_4\le2$</td><td>14</td><td>$(\tfrac12,\tfrac12,\tfrac12,\tfrac12)$</td></tr>
<tr><td>+ lifted cover $x_1+x_2+x_3+2x_4\le2$</td><td>12</td><td>$(1,1,0,0)$</td></tr>
</tbody></table>
<p>Read it from top to bottom. The point $(1,1,0,\tfrac27)$ that the single cover allows is exactly the point the extended cover cuts off. The extended cover still leaves a gap of 2. The lifted cover closes it: 12 is the integer optimum.</p>
<p>(Beyond the slides.) <b>Why 14 and not less.</b> Take 4 times the extended cover and 2 times each of $x_1+x_4\le1$, $x_2+x_4\le1$, $x_3+x_4\le1$. The left-hand sides add up to $6x_1+6x_2+6x_3+10x_4$, the objective. The right-hand sides add up to $4\cdot2+2\cdot3=14$. So no LP point can do better than 14, and $(\tfrac12,\tfrac12,\tfrac12,\tfrac12)$ reaches it.</p>`,
    },
  ],
  moves: [
    R`For a cover: show $\sum_Ca_j\gt b$ (cover), show each $\sum_Ca_j-a_i\le b$ (minimal), then write $\sum_Cx_j\le|C|-1$.`,
    R`To list every cover: go through the subsets by size, write each weight, mark the ones above $b$, and say how many subsets you checked ($2^n-1$ nonempty ones).`,
    R`To test violation at $\bar x$ compute either $\sum_C\bar x_j$ against $|C|-1$ or $\sum_C(1-\bar x_j)$ against 1.`,
    R`For a clique: check all pairs are edges of the conflict graph, write $\sum_Cx_i\le 1$, evaluate at $\bar x$.`,
    R`For “all maximal cliques”: draw the conflict graph from the pair rows; for each clique show that no outside vertex is joined to all its members; then show every edge lies in a listed clique, so the list is complete.`,
    R`For an extended cover: state $M$, list the outside items with $a_j\ge M$, keep the right-hand side $|C|-1$.`,
    R`State the separation problem with its objective, constraint and the threshold (above 1 for cliques, below 1 for covers).`,
  ],
  traps: [
    R`Using “$\ge b$” in the definition of a cover. A cover needs total weight <b>strictly greater</b> than $b$ (with integer data, $\ge b+1$).`,
    R`Proving minimality with a single removal. Minimal needs <b>every</b> one-item removal to fit; non-minimal needs only <b>one</b> removal that still exceeds $b$.`,
    R`Listing only the minimal covers when the question asks for every cover. 20E, Exercise 10 has 8 covers, 4 of them minimal.`,
    R`Changing the right-hand side to $|E(C)|-1$ for an extended cover. It stays $|C|-1$.`,
    R`Writing a clique inequality for a set that is not a clique (one missing edge and both variables can be 1).`,
    R`Calling a clique maximal because it is large. Maximal means that no outside vertex is joined to all its members.`,
    R`Thinking that adding all cover inequalities gives the integer hull. In the lecture example all minimal covers leave a gap of $20/7\approx2.86$; the extended cover brings the bound to 14 (gap 2), and only the lifted cover reaches 12.`,
    R`Mixing the thresholds: clique separation maximises and compares with 1 from above; cover separation minimises and compares with 1 from below.`,
  ],
  refs: [
    R`Slides 206, <i>Problem-Specific Valid Inequalities</i> (T. Schettini): families, cliques, covers, static generation, extended covers, and the root-bound charts (PDF pp. 9–38; reading version “Extended cover: root bound” and “LP bound with lifting”).`,
    R`Sheet 20E, solved exercises 9 (maximal cliques), 10 (all covers) and 11 (extension).`,
    R`Wolsey, <i>Integer Programming</i>, 2nd ed., chapters 3 and 8; Nemhauser and Wolsey (1988), chapters I.4 and II.2.`,
  ],
};
