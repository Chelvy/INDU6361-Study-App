const R = String.raw;

export default {
  id: 't201',
  lead: R`The directed TSP shows compactness and strength pulling in opposite directions. Degree constraints alone allow subtours; three different ways of forbidding them (ordering variables, flows, cutsets) give the same tours but very different LP bounds and sizes.`,
  sections: [
    {
      title: 'The directed model and its flaw',
      html: R`
<p>$V=\{1,\dots,n\}$; $A=\{(i,j):\ i\ne j\}$ contains both directions; $c_{ij}$ need not equal $c_{ji}$. $x_{ij}=1$ if the tour uses arc $(i,j)$.</p>
$$\min\sum_{i\in V}\sum_{j\ne i}c_{ij}x_{ij}\qquad\text{s.t.}\qquad\sum_{j\ne i}x_{ij}=1\ \ (i\in V),\qquad\sum_{i\ne j}x_{ij}=1\ \ (j\in V),\qquad x_{ij}\in\{0,1\}.$$
<p>The first family chooses a <b>successor</b> for every vertex, the second a <b>predecessor</b>. Together they produce a collection of vertex-disjoint directed cycles: a <b>cycle cover</b>, which may contain <b>subtours</b>. This is an assignment problem (integral LP), but it is not the TSP. Each formulation below adds something that removes every disconnected cycle cover while keeping every tour.</p>`,
    },
    {
      title: 'Miller–Tucker–Zemlin (MTZ)',
      html: R`
<p>Use vertex 1 as reference and give every other vertex a continuous position variable $2\le u_i\le n$ ($i=2,\dots,n$): the position at which the tour visits $i$ after leaving vertex 1.</p>
<p>If the tour goes directly from $i$ to $j$ (both different from 1), the position must increase by at least one: $x_{ij}=1\Rightarrow u_j\ge u_i+1$. As a big-M row: $u_i-u_j+1\le M(1-x_{ij})$.</p>
<p><b>Choosing M.</b> When $x_{ij}=0$ the row must not restrict any positions in $[2,n]$. The largest left-hand side is $\max\{u_i-u_j+1\}=n-2+1=n-1$, so $M=n-1$ is the smallest valid value:</p>
$$u_i-u_j+(n-1)\,x_{ij}\le n-2\qquad\text{for all distinct } i,j\in V\setminus\{1\}.$$
<p>No ordering row is imposed on arcs incident to vertex 1, so the tour can return to its start.</p>
<p><b>Why subtours die.</b> A cycle $a\to b\to c\to a$ avoiding vertex 1 would need $u_b\ge u_a+1$, $u_c\ge u_b+1$, $u_a\ge u_c+1$: positions cannot increase all the way around a closed cycle. (Adding the rows of a $k$-cycle gives $k(n-1)\le k(n-2)$.)</p>
<p><b>Size:</b> $O(n^2)$ variables and constraints: compact.</p>
<h3>Why the relaxation is weak</h3>
<p>On the 10-vertex lecture instance the optimum is <b>359.81</b> but the MTZ root bound is <b>282.47</b>, 21.5% below. A closed component of the root solution is $S=\{2,5,7,8\}$ with</p>
$$x_{25}=x_{78}=1,\qquad x_{82}=x_{57}=\tfrac29,\qquad x_{87}=x_{52}=\tfrac79,\qquad u_8=u_5=3,\ u_2=u_7=2 .$$
<p>Every degree sum is 1, yet $S$ is disconnected from vertex 1. The MTZ rows ($u_i-u_j+9x_{ij}\le 8$ for $n=10$) all hold:</p>
<table class="data-table">
<thead><tr><th>Arc</th><th>$x_{ij}$</th><th>$u_i$</th><th>$u_j$</th><th>$u_i-u_j+9x_{ij}$</th></tr></thead>
<tbody>
<tr><td>$8\to2$</td><td>2/9</td><td>3</td><td>2</td><td>3</td></tr>
<tr><td>$2\to5$</td><td>1</td><td>2</td><td>3</td><td>8</td></tr>
<tr><td>$5\to7$</td><td>2/9</td><td>3</td><td>2</td><td>3</td></tr>
<tr><td>$7\to8$</td><td>1</td><td>2</td><td>3</td><td>8</td></tr>
</tbody></table>
<p>On an arc with $x_{ij}=2/9$ the position may <i>decrease</i> by as much as 6: $u_j\ge u_i+1-9(1-2/9)=u_i-6$. Fractional arcs let the positions fall back, so the ordering argument no longer bites. This is the usual big-M weakness.</p>`,
    },
    {
      title: 'Multicommodity flow',
      html: R`
<p>Let $K=V\setminus\{1\}$. For every destination $k\in K$ and arc $(i,j)$ introduce a continuous flow $f^k_{ij}\ge 0$. Commodity $k$ sends <b>one unit from vertex 1 to vertex $k$</b>:</p>
<ul>
<li><b>conservation:</b> for each $k$, one unit leaves vertex 1, one unit arrives at $k$, and flow is conserved at every other vertex;</li>
<li><b>linking:</b> $0\le f^k_{ij}\le x_{ij}$ for all arcs and all $k$. Flow may use only selected arcs.</li>
</ul>
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
<p>If the vertices of $S$ formed closed cycles, all $|S|$ outgoing arcs would stay inside $S$; the row allows at most $|S|-1$.</p>
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
      title: 'Comparison and the exponential family',
      html: R`
<table class="data-table">
<thead><tr><th>Formulation</th><th>Size</th><th>Root bound</th><th>Root gap</th></tr></thead>
<tbody>
<tr><td>MTZ</td><td>compact, $O(n^2)$</td><td>282.47</td><td>21.5%</td></tr>
<tr><td>Multicommodity flow</td><td>compact, $O(n^3)$</td><td>359.81</td><td>0.0%</td></tr>
<tr><td>Full cutset</td><td>1,012 cutset rows</td><td>359.81</td><td>0.0%</td></tr>
</tbody></table>
<p>All three have integer optimum 359.81: correctness does not determine relaxation strength. The cutset and multicommodity relaxations are <b>not</b> integral in general; their bound merely coincides with the optimum on this instance.</p>
<p><b>Counting rows.</b> Enumerating every $S$ with $2\le|S|\le n-1$:</p>
$$\sum_{k=2}^{n-1}\binom nk=2^n-n-2 .$$
<table class="data-table">
<thead><tr><th>$n$</th><th>6</th><th>10</th><th>15</th><th>20</th><th>25</th><th>30</th></tr></thead>
<tbody><tr><th>rows</th><td>56</td><td>1,012</td><td>32,751</td><td>1,048,554</td><td>33,554,405</td><td>1,073,741,792</td></tr></tbody></table>
<p>The strong formulation quickly becomes impractical to write in full. But for one current solution most rows are already satisfied, and only a few are violated or become active. <b>An exponential formulation is still useful if violated inequalities can be found without enumerating the family</b>: that is row generation (slides 202).</p>`,
    },
  ],
  moves: [
    R`To prove a formulation correct, write both directions explicitly: every tour is feasible (give the auxiliary values if any), and every integer feasible solution is a tour. Mention that costs are preserved.`,
    R`For MTZ: state the range of $u$, the implication, the largest possible left-hand side, hence $M=n-1$, and the final row.`,
    R`For a subtour row: name $S$, write either form, and note that the two are equivalent because each vertex of $S$ has out-degree 1.`,
    R`To compare strengths, quote the projection result (MCF ≡ cutset) and the big-M weakness of MTZ, with the lecture numbers if asked for evidence.`,
  ],
  traps: [
    R`Writing MTZ rows for arcs that touch vertex 1: the tour could then never close.`,
    R`Using $M=n$ or “a large number” in MTZ. The smallest valid value is $n-1$, giving right-hand side $n-2$.`,
    R`Claiming that the cutset formulation has an integral LP because its gap was 0% on the 10-vertex instance.`,
    R`Counting $2^n$ or $2^n-2$ subtour rows: singletons are useless, so the count is $2^n-n-2$.`,
    R`Calling the multicommodity model “exponential”: $O(n^3)$ is polynomial, so it is compact.`,
    R`Confusing “compact” with “strong”. MTZ is the most compact and the weakest of the three.`,
  ],
  refs: [
    R`Slides 201, <i>Exponential Formulations</i> (T. Schettini), all 59 pages. Note: on five pages of the PDF the displayed model did not render (“Math Processing Error”); the formulas above are reconstructed from the surrounding text of the slides.`,
    R`Lab 201, directed TSP formulations.`,
    R`Dantzig, Fulkerson and Johnson (1954); Miller, Tucker and Zemlin (1960), both cited on the slides.`,
  ],
};
