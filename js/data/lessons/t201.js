const R = String.raw;

export default {
  id: 't201',
  lead: R`The directed TSP shows compactness and strength pulling in opposite directions. Degree constraints alone allow subtours; three different ways of forbidding them (ordering variables, flows, cutsets) give the same tours but very different LP bounds and sizes. The extra slides 202 prove the ranking: the flow model is never weaker than MTZ.`,
  sections: [
    {
      title: 'The directed model and its flaw',
      html: R`
<p>$V=\{1,\dots,n\}$; $A=\{(i,j):\ i\ne j\}$ contains both directions; $c_{ij}$ need not equal $c_{ji}$. $x_{ij}=1$ if the tour uses arc $(i,j)$.</p>
$$\min\sum_{i\in V}\sum_{j\ne i}c_{ij}x_{ij}\qquad\text{s.t.}\qquad\sum_{j\ne i}x_{ij}=1\ \ (i\in V),\qquad\sum_{i\ne j}x_{ij}=1\ \ (j\in V),\qquad x_{ij}\in\{0,1\}.$$
<p>The first family chooses a <b>successor</b> for every vertex, the second a <b>predecessor</b>. Together they produce a collection of vertex-disjoint directed cycles: a <b>cycle cover</b>, which may contain <b>subtours</b> (cycles that miss some vertices). This is an assignment problem (integral LP), but it is not the TSP. Each formulation below adds something that removes every disconnected cycle cover while keeping every tour.</p>
<p><b>Lecture instance (10 vertices).</b> With the degree equations alone, the figure of slides 201 shows five two-vertex cycles: $\{1,10\}$, $\{6,9\}$, $\{3,4\}$, $\{2,5\}$, $\{7,8\}$. Later the slides use $S=\{2,5\}$ as their example of a set that no arc leaves.</p>`,
    },
    {
      title: 'Miller–Tucker–Zemlin (MTZ)',
      html: R`
<p>Use vertex 1 as reference and give every other vertex a continuous position variable $2\le u_i\le n$ ($i=2,\dots,n$): the position at which the tour visits $i$ after leaving vertex 1. (The slide figure counts from 0 at the reference vertex; add 1 to get the model's positions $2,\dots,n$.)</p>
<p>If the tour goes directly from $i$ to $j$ (both different from 1), the position must increase by at least one: $x_{ij}=1\Rightarrow u_j\ge u_i+1$. As a big-M row: $u_i-u_j+1\le M(1-x_{ij})$.</p>
<p><b>Choosing M.</b> When $x_{ij}=0$ the row must not restrict any positions allowed by $2\le u_i,u_j\le n$. The largest left-hand side is $\max\{u_i-u_j+1\}=n-2+1=n-1$. Therefore <b>any $M\ge n-1$ is valid</b>. The slides take the smallest valid value, $M=n-1$:</p>
$$u_i-u_j+(n-1)\,x_{ij}\le n-2\qquad\text{for all distinct } i,j\in V\setminus\{1\}.$$
<p>A value below $n-1$ cuts off tours (next section). A value above $n-1$ is still valid, but, as for every big-M row (slides 104), it can let the LP relaxation grow.</p>
<p>No ordering row is imposed on arcs incident to vertex 1, so the tour can return to its start. The complete model (slides 201, “The MTZ formulation”):</p>
$$\begin{aligned}\min\ &\textstyle\sum_{i\ne j}c_{ij}x_{ij}\\ \text{s.t. }&\textstyle\sum_{j\ne i}x_{ij}=1\ \ (i\in V),\qquad \sum_{i\ne j}x_{ij}=1\ \ (j\in V),\\ &u_i-u_j+(n-1)x_{ij}\le n-2\ \ (i,j\in V\setminus\{1\},\ i\ne j),\\ &2\le u_i\le n\ \ (i\in V\setminus\{1\}),\qquad x_{ij}\in\{0,1\}\ \ ((i,j)\in A).\end{aligned}$$
<p><b>Why subtours die.</b> A cycle $a\to b\to c\to a$ avoiding vertex 1 would need $u_b\ge u_a+1$, $u_c\ge u_b+1$, $u_a\ge u_c+1$. With the slide's values $u_a=1$ and $u_b=2$: $u_c\ge 3$ and $u_c\le 0$. No value works, and shifting all positions by 1 changes nothing. Every cycle that avoids the reference vertex has the same problem. (Adding the rows of a $k$-cycle gives $k(n-1)\le k(n-2)$.)</p>
<p><b>A tour gives positions.</b> The optimal lecture tour (cost 359.81) is $1\to3\to4\to5\to2\to7\to8\to9\to6\to10\to1$, so $u_3=2$, $u_4=3$, $u_5=4$, $u_2=5$, $u_7=6$, $u_8=7$, $u_9=8$, $u_6=9$, $u_{10}=10$.</p>
<p><b>Size:</b> $O(n^2)$ variables and constraints: compact.</p>`,
    },
    {
      title: 'How big must M be? A tour with free positions (20E Exercise 1)',
      html: R`
<p>In this exercise the positions $u_i$ are <b>free</b>: any real numbers, with no bounds $2\le u_i\le n$. Take $n=6$, the rows $u_i-u_j+1\le M(1-x_{ij})$ for $i,j\ne1$, and the tour $1\to2\to3\to4\to5\to6\to1$. Which $M$ lets this tour through?</p>
<ol>
<li><b>Selected arcs.</b> The selected arcs that avoid vertex 1 are $(2,3),(3,4),(4,5),(5,6)$. With $x_{ij}=1$ the right side is $M\cdot0=0$, so each row says $u_j\ge u_i+1$.</li>
<li><b>Add the four rows</b> (rule: inequalities of the same direction may be added): $u_6\ge u_2+4$, that is $u_6-u_2+1\ge 5$.</li>
<li><b>The unselected return arc $(6,2)$.</b> Here $x_{62}=0$, so its row is $u_6-u_2+1\le M$. Together: $5\le u_6-u_2+1\le M$. With $M=4$ no positions work: the violated row is the one of the <b>unselected</b> arc $(6,2)$, not a selected one.</li>
<li><b>$M=5$ works.</b> Choose $u_2=2,\ u_3=3,\ u_4=4,\ u_5=5,\ u_6=6$. Each selected row gives $0\le 0$, and every unselected row has $u_i-u_j+1\le 6-2+1=5$. So the smallest value is $M=5=n-1$.</li>
</ol>
<p>The tour itself forces $M\ge n-1$, even without bounds on the positions. (Beyond the slides: the same argument works for every tour $1\to a_2\to\dots\to a_n\to1$ with $n\ge3$. The $n-2$ selected arcs from $a_2$ to $a_n$ force $u_{a_n}-u_{a_2}\ge n-2$, so the unselected arc $(a_n,a_2)$ needs $M\ge n-1$.) <a href="#/exercises/20e/1">Open 20E Exercise 1</a>.</p>`,
    },
    {
      title: 'Why the MTZ relaxation is weak on the lecture instance',
      html: R`
<p>On the 10-vertex lecture instance the optimum is <b>359.81</b> but the MTZ root bound is <b>282.47</b>, 21.5% below. A closed component of the root solution is $S=\{2,5,7,8\}$ with</p>
$$x_{25}=x_{78}=1,\qquad x_{82}=x_{57}=\tfrac29,\qquad x_{87}=x_{52}=\tfrac79,\qquad u_8=u_5=3,\ u_2=u_7=2 .$$
<p>Every degree sum is 1, yet $S$ is disconnected from vertex 1. The MTZ rows ($u_i-u_j+9x_{ij}\le 8$ for $n=10$) all hold, including the two reverse arcs:</p>
<table class="data-table">
<thead><tr><th>Arc</th><th>$x_{ij}$</th><th>$u_i$</th><th>$u_j$</th><th>$u_i-u_j+9x_{ij}$</th></tr></thead>
<tbody>
<tr><td>$8\to2$</td><td>2/9</td><td>3</td><td>2</td><td>3</td></tr>
<tr><td>$2\to5$</td><td>1</td><td>2</td><td>3</td><td>8</td></tr>
<tr><td>$5\to7$</td><td>2/9</td><td>3</td><td>2</td><td>3</td></tr>
<tr><td>$7\to8$</td><td>1</td><td>2</td><td>3</td><td>8</td></tr>
<tr><td>$5\to2$</td><td>7/9</td><td>3</td><td>2</td><td>$3-2+7=8$</td></tr>
<tr><td>$8\to7$</td><td>7/9</td><td>3</td><td>2</td><td>$3-2+7=8$</td></tr>
</tbody></table>
<p>On an arc with $x_{ij}=2/9$ the position may <i>decrease</i> by as much as 6: $u_j\ge u_i+1-9(1-2/9)=u_i-6$. Fractional arcs let the positions fall back, so the ordering argument no longer bites. This is the usual big-M weakness. The general fact (MTZ is never stronger than the flow model) is proved further down, from the extra slides 202.</p>`,
    },
    {
      title: 'Multicommodity flow',
      html: R`
<p>Let $K=V\setminus\{1\}$. For every destination $k\in K$ and arc $(i,j)$ introduce a continuous flow $f^k_{ij}\ge 0$. Commodity $k$ sends <b>one unit from vertex 1 to vertex $k$</b>.</p>
<p><b>Flow conservation</b> (outflow minus inflow), for every $k\in K$:</p>
$$\sum_{j\ne i}f^k_{ij}-\sum_{j\ne i}f^k_{ji}=\begin{cases}1,&i=1\ \text{(the unit leaves the root)},\\-1,&i=k\ \text{(it arrives)},\\0,&i\in V\setminus\{1,k\}.\end{cases}$$
<p><b>Linking:</b> $0\le f^k_{ij}\le x_{ij}$ for all arcs and all $k$. Flow may use only selected arcs. The complete model is the degree model plus these two families for every $k\in K$, with $x_{ij}\in\{0,1\}$ (slides 201, “The multicommodity formulation”).</p>
<p>The commodities do not share capacity: each one independently tests whether its destination is reachable from vertex 1 through the selected arcs.</p>
<p><b>Subtours are infeasible.</b> Let $S$ be a selected cycle not containing vertex 1, and $k\in S$. Summing commodity $k$'s balance equations over $S$ cancels internal flows: (flow into $S$) − (flow out of $S$) $=1$. A disconnected cycle has $x_{ij}=0$ on every crossing arc, so both sums are zero: $0-0=1$, impossible.</p>
<p><b>Every tour is feasible.</b> Send commodity $k$ along the tour from vertex 1 until it reaches $k$.</p>
<p><b>Size:</b> $O(n^3)$ flow variables and linking rows: larger, but still compact. Auxiliary flow variables enforce global connectivity without enumerating subsets.</p>
<p><b>Strength:</b> on the 10-vertex instance the root bound is 359.81 (gap 0.0%). On a 20-vertex instance the LP bound is 511.43 against an optimum of 515.85: a 0.86% gap. A zero gap on one instance guarantees nothing for another.</p>`,
    },
    {
      title: 'Cutset (subtour elimination) formulation',
      html: R`
<p>Stay in the natural $x$-space. For every nonempty proper subset $S\subset V$, every tour must leave $S$:</p>
$$\sum_{i\in S}\sum_{j\notin S}x_{ij}\ge 1\qquad\text{(cutset form)}.$$
<p>Each vertex of $S$ has exactly one outgoing arc, so $\sum_{i\in S}\sum_{j\ne i}x_{ij}=|S|$; hence the cutset form is equivalent to</p>
$$\sum_{i\in S}\sum_{j\in S\setminus\{i\}}x_{ij}\le|S|-1\qquad\text{(internal form)}.$$
<p>If the vertices of $S$ formed closed cycles, all $|S|$ outgoing arcs would stay inside $S$; the row allows at most $|S|-1$. The full model on the slides is the degree model plus the internal form for every $S\subset V$ with $2\le|S|\le n-1$, and $x_{ij}\in\{0,1\}$. (Singletons are not needed: a vertex has no arc to itself.)</p>
<h3>Proof of correctness (both directions)</h3>
<ol>
<li><b>Every tour is feasible.</b> A tour satisfies the degree equations and must leave every nonempty proper subset, so it satisfies every cutset row.</li>
<li><b>Every integer feasible solution is a tour.</b> The degree equations partition the vertices into directed cycles. If there were more than one, the vertex set of any one cycle would have no outgoing selected arc, violating its cutset row.</li>
</ol>
<p>The objective is unchanged, so the formulation describes exactly the tours with the same costs.</p>
<h3>Same strength as multicommodity flow</h3>
<ul>
<li><b>Flows ⇒ cutsets.</b> Fix $S\subset V\setminus\{1\}$ and $k\in S$. Summing conservation for commodity $k$ over $S$ shows one unit must enter $S$; since $f^k_{ij}\le x_{ij}$, $\sum_{i\notin S,j\in S}x_{ij}\ge 1$. The degree equations make incoming and outgoing $x$-capacities of $S$ equal.</li>
<li><b>Cutsets ⇒ flows.</b> If $x$ satisfies every cutset row, every cut separating 1 from $k$ has capacity at least one, so by <b>max-flow/min-cut</b> the capacities $x_{ij}$ support one unit of flow from 1 to $k$, for each $k$ independently.</li>
</ul>
<p>Hence the multicommodity and cutset LP relaxations describe the <b>same region after projection</b> onto the $x$-space.</p>`,
    },
    {
      title: 'Why the flow model is at least as strong as MTZ (EXTRA-202)',
      html: R`
<p><b>The claim.</b> Use the same costs and relax $x_{ij}\in\{0,1\}$ to $0\le x_{ij}\le1$ in both models (the <b>LP relaxation</b>). Its optimal value is the <b>LP bound</b>. With MTZ written with $M=n-1$:</p>
$$\boxed{z^{MCF}_{LP}\ \ge\ z^{MTZ}_{LP}}.$$
<p><b>Terms.</b> The <b>projection</b> of a relaxation onto $x$ is the set of arc vectors $x$ for which some values of the extra variables (flows $f$, or positions $u$) satisfy every constraint. If one projection sits inside another, it allows no extra points, so its minimum cost is higher or equal: it is <b>at least as strong</b>.</p>
<p><b>Plan.</b> Start from <i>any</i> feasible LP solution $(x,f)$ of the flow model. Build positions $u$ such that $(x,u)$ satisfies every MTZ constraint. The arc values $x$ never change. Then every $x$ allowed by the flow relaxation is also allowed by the MTZ relaxation.</p>
<ol>
<li><b>Add up the commodities.</b> Let $q_{ij}=\sum_{k\ne1}f^k_{ij}$, the total flow on arc $(i,j)$. Adding the $n-1$ balance systems gives
$$\sum_{j\ne i}q_{ij}-\sum_{h\ne i}q_{hi}=\begin{cases}n-1,&i=1,\\-1,&i\ne1.\end{cases}$$
The root sends out $n-1$ units net (one per commodity). Every other vertex keeps one unit (it is the destination of exactly one commodity). Adding the $n-1$ capacity bounds $0\le f^k_{ij}\le x_{ij}$ gives $0\le q_{ij}\le(n-1)x_{ij}$. <i>Rule: a sum of valid equations, or of inequalities in the same direction, is valid.</i> Keeping only the sums loses information, so this is a relaxation of the flow model.</li>
<li><b>Count what enters each vertex.</b> For $i\ne1$ put $v_i=\sum_{h\ne i}q_{hi}$, the total flow into $i$. The summed balance at $i$ says (out) − (in) $=-1$, so $\sum_{h\ne i}q_{ih}=v_i-1$: $v_i$ units arrive, one stays, $v_i-1$ leave. <i>Rule: rearrange the balance equation at $i$.</i></li>
<li><b>Compare two vertices and cancel the shared arc.</b> For distinct $i,j\ne1$, the definition of $v_j$ and step 2 give
$$v_j-v_i+1=\underbrace{\sum_{h\ne j}q_{hj}}_{\text{entering }j}-\underbrace{\sum_{h\ne i}q_{ih}}_{\text{leaving }i}.$$
The arc $(i,j)$ is in both sums ($q_{ij}$ enters $j$ and leaves $i$), so it cancels:
$$v_j-v_i+1=\sum_{h\notin\{i,j\}}q_{hj}-\sum_{h\notin\{i,j\}}q_{ih}.$$
Both sums run over every other vertex $h$, the root $h=1$ included. <i>Rule: substitute the definitions, then cancel the common term.</i></li>
<li><b>Bound the right-hand side.</b>
$$\begin{aligned}v_j-v_i+1&\le\textstyle\sum_{h\notin\{i,j\}}q_{hj}&&\text{drop the subtracted flows (they are nonnegative)}\\&\le(n-1)\textstyle\sum_{h\notin\{i,j\}}x_{hj}&&\text{capacity bounds } q_{hj}\le(n-1)x_{hj}\\&=(n-1)(1-x_{ij})&&\text{in-degree equation at } j.\end{aligned}$$
Last step: all arcs into $j$ add up to 1, so the arcs into $j$ other than $(i,j)$ add up to $1-x_{ij}$. The result contains only $v$ and $x$.</li>
<li><b>Range of $v_i$.</b> Lower: $v_i-1=\sum_{h\ne i}q_{ih}\ge 0$ (outgoing flow is nonnegative), so $v_i\ge1$. Upper: $v_i=\sum_{h\ne i}q_{hi}\le(n-1)\sum_{h\ne i}x_{hi}=n-1$ (capacity bounds, then the in-degree equation at $i$). So $1\le v_i\le n-1$.</li>
<li><b>Change to positions.</b> Put $u_i=n+1-v_i$. Step 5 gives $2\le u_i\le n$. Also $v_j-v_i=(n+1-u_j)-(n+1-u_i)=u_i-u_j$, so step 4 becomes
$$u_i-u_j+1\le(n-1)(1-x_{ij})\quad\Longleftrightarrow\quad u_i-u_j+(n-1)x_{ij}\le n-2,$$
exactly the MTZ row with $M=n-1$. The degree equations did not change.</li>
</ol>
<p><b>Conclusion.</b> Every feasible flow LP solution gives feasible MTZ positions for the same $x$. So the flow relaxation allows a subset of the arc vectors that MTZ allows, and for the same minimisation objective $z^{MCF}_{LP}\ge z^{MTZ}_{LP}$. Together with the previous section: $z^{cutset}_{LP}=z^{MCF}_{LP}\ge z^{MTZ}_{LP}$.</p>
<div class="callout warn"><div class="callout-title">What the proof does not show</div>
<ul>
<li>It goes one way only, from flows to positions. In the slides' words it “does not say that every MTZ-feasible arc vector can be extended to feasible multicommodity flows”. (The title says “MTZ to MCF”, but the construction starts from an MCF solution.)</li>
<li>It does not say that MTZ is always strictly weaker: “The bounds can be equal on a particular instance.”</li>
</ul></div>
<p><b>Remarks (beyond the slides).</b></p>
<ul>
<li>On an integer tour, the vertex in position $p$ receives the commodities of itself and of every later vertex, so $v=n+1-p$ and $u=p$: the construction gives back the tour positions.</li>
<li>An MTZ point with no flows: the MTZ root solution of the lecture instance contains the closed set $S=\{2,5,7,8\}$ (no arc leaves it), while every flow-feasible point satisfies every cutset row (“Flows ⇒ cutsets”). This is how the MTZ bound can fall below the flow bound: 282.47 against 359.81.</li>
<li>Equal bounds happen, for example, when the cheapest cycle cover is already one tour: both relaxations then reach the tour cost.</li>
<li>With a larger $M$ the MTZ rows only get looser, because $(n-1)(1-x_{ij})\le M(1-x_{ij})$. So the result also holds for MTZ with any $M\ge n-1$.</li>
</ul>`,
    },
    {
      title: 'Comparison and the exponential family',
      html: R`
<table class="data-table">
<thead><tr><th>Formulation</th><th>Size</th><th>Root bound</th><th>Root gap</th></tr></thead>
<tbody>
<tr><td>MTZ</td><td>compact, $O(n^2)$</td><td>282.47</td><td>21.5%</td></tr>
<tr><td>Multicommodity flow</td><td>compact, $O(n^3)$</td><td>359.81</td><td>0.0%</td></tr>
<tr><td>Full cutset</td><td>1,012 cutset rows</td><td>359.81</td><td>0.0%</td></tr>
</tbody></table>
<p>All three have integer optimum 359.81: correctness does not determine relaxation strength. In general MTZ is <b>never stronger</b> than the other two (EXTRA-202), and on this instance it is much weaker. The cutset and multicommodity relaxations are <b>not</b> integral in general; their bound merely coincides with the optimum on this instance.</p>
<p><b>Counting rows.</b> Enumerating every $S$ with $2\le|S|\le n-1$:</p>
$$\sum_{k=2}^{n-1}\binom nk=2^n-n-2 .$$
<table class="data-table">
<thead><tr><th>$n$</th><th>6</th><th>10</th><th>15</th><th>20</th><th>25</th><th>30</th></tr></thead>
<tbody><tr><th>rows</th><td>56</td><td>1,012</td><td>32,751</td><td>1,048,554</td><td>33,554,405</td><td>1,073,741,792</td></tr></tbody></table>
<p>This count describes the explicit family; it does not claim that a particular machine fails at a particular $n$. Still, the strong formulation quickly becomes impractical to write in full. But for one current solution most rows are already satisfied, and only a few are violated or become active. <b>An exponential formulation is still useful if violated inequalities can be found without enumerating the family</b>: that is row generation (slides 202).</p>`,
    },
  ],
  moves: [
    R`To prove a formulation correct, write both directions explicitly: every tour is feasible (give the auxiliary values if any), and every integer feasible solution is a tour. Mention that costs are preserved.`,
    R`For MTZ: state the range of $u$, the implication, the largest possible left-hand side $n-1$, hence any $M\ge n-1$ is valid and the slides take $M=n-1$, and the final row.`,
    R`For a given tour and a given $M$ (20E Exercise 1): write the rows of the selected arcs ($u_j\ge u_i+1$), add them along the path, then check the row of the <b>unselected</b> return arc.`,
    R`For a subtour row: name $S$, write either form, and note that the two are equivalent because each vertex of $S$ has out-degree 1.`,
    R`To compare strengths: MCF ≡ cutset (projection, max-flow/min-cut) and MCF ⇒ MTZ (EXTRA-202). So MTZ is never stronger; the bounds can be equal on an instance; on the lecture instance 282.47 against 359.81.`,
    R`For the EXTRA-202 proof, name the rule at each step: sum the commodities; rearrange the balance at $i$; cancel $q_{ij}$; drop the nonnegative flows; capacity bounds; in-degree equation at $j$; $1\le v_i\le n-1$; $u_i=n+1-v_i$.`,
  ],
  traps: [
    R`Writing MTZ rows for arcs that touch vertex 1: the tour could then never close.`,
    R`Calling $M=n$ an error, or taking $M$ below $n-1$. Any $M\ge n-1$ is valid; $M\lt n-1$ cuts off tours (20E Exercise 1: $M=4$ with $n=6$); a larger $M$ is valid but gives a weaker (or equal) relaxation. The slides take the smallest valid value $M=n-1$, giving right-hand side $n-2$.`,
    R`In 20E Exercise 1, looking for the violation in a selected arc's row. The violated row is the one of the unselected arc $(6,2)$.`,
    R`Claiming that the cutset formulation has an integral LP because its gap was 0% on the 10-vertex instance.`,
    R`Counting $2^n$ or $2^n-2$ subtour rows: singletons are useless, so the count is $2^n-n-2$.`,
    R`Calling the multicommodity model “exponential”: $O(n^3)$ is polynomial, so it is compact.`,
    R`Confusing “compact” with “strong”. MTZ is the most compact and never stronger than the other two; on the lecture instance it is much weaker.`,
    R`Reading the title “MTZ to MCF” as “every MTZ point extends to flows”. The proof builds MTZ positions from flows; an MTZ point need not have feasible flows.`,
    R`Saying MTZ is always strictly weaker than MCF. The slides: the bounds can be equal on a particular instance.`,
  ],
  refs: [
    R`Slides 201, <i>Exponential Formulations</i> (T. Schettini), all 59 pages. On seven pages of the PDF (19, 23, 25, 30, 34, 40, 45) the displayed formulas did not render (“Math Processing Error”). They were first reconstructed from the surrounding text; the instructor's HTML reading version (October 2026) shows them and confirms every reconstruction.`,
    R`Extra slides 202, <i>MTZ to MCF Formulation Proof</i> (T. Schettini), 13 pages. Further reading cited there: “The asymmetric travelling salesman problem: on generalizations of disaggregated Miller–Tucker–Zemlin constraints”, <i>Discrete Applied Mathematics</i> (2001), <a href="https://www.sciencedirect.com/science/article/pii/S0166218X00003139" target="_blank" rel="noopener">ScienceDirect</a>.`,
    R`Sheet 20E, Exercise 1 (smallest $M$ for a given tour with free positions).`,
    R`Lab 201, directed TSP formulations.`,
    R`Dantzig, Fulkerson and Johnson (1954); Miller, Tucker and Zemlin (1960); Wolsey, <i>Integer Programming</i>, 2nd ed. (2021), chapters 1–3; JuMP documentation, “Traveling Salesperson Problem” and “Solver-independent Callbacks” (all cited on the slides).`,
  ],
};
