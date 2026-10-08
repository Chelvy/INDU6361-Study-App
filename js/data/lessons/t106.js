const R = String.raw;

export default {
  id: 't106',
  lead: R`The second route to tractability: sometimes the continuous relaxation is <i>already</i> the convex hull of its integer points. Then linear programming returns an integer solution and no branching is needed. This property is “fortunate rather than automatic”; total unimodularity is the standard way to recognise it.`,
  sections: [
    {
      title: 'Integral polyhedra',
      html: R`
<div class="callout"><div class="callout-title">Definition</div>A polyhedron $P$ is <b>integral</b> when $P=\operatorname{conv}(P\cap\mathbb{Z}^n)$. For a nonempty polytope this is equivalent to: <b>all extreme points are integer</b>.</div>
<p>If an LP has an integral feasible polyhedron and a finite optimum, at least one optimal solution is integer, and an optimal <b>extreme point</b> gives it. An arbitrary point of an optimal <b>face</b> can still be fractional.</p>
<p><b>Example: rank assignment with two jobs</b> and $c_1=c_2=1$. Every feasible rank assignment has value $1+2=3$. Both permutation matrices are optimal, and so is their average:</p>
$$\tfrac12\begin{pmatrix}1&0\\0&1\end{pmatrix}+\tfrac12\begin{pmatrix}0&1\\1&0\end{pmatrix}=\begin{pmatrix}\tfrac12&\tfrac12\\\tfrac12&\tfrac12\end{pmatrix}.$$
<p>The two permutation matrices are integer optimal vertices; the fractional average lies between them on the same optimal face. Either vertex supplies a rank assignment. A formulation with the integrality property “can be solved without branch and bound”.</p>`,
    },
    {
      title: 'LP is polynomial, simplex is not (in the worst case)',
      html: R`
<ul>
<li>The linear programming <b>problem</b> can be solved in time polynomial in the encoded input size. The <b>ellipsoid method</b> gave the first proof: it uses separating hyperplanes to build a sequence of shrinking ellipsoids containing the solutions of interest.</li>
<li>This is a statement about the problem, not about every algorithm. The <b>simplex method</b> moves between adjacent extreme points and is very effective in practice (bases, warm starts, sensitivity information), but standard pivot rules have examples that visit exponentially many extreme points: no polynomial worst-case guarantee.</li>
<li>Modern solvers offer simplex variants and polynomial-time <b>interior-point</b> methods, with extensive preprocessing.</li>
</ul>
<p>Consequence: “integral polyhedron” really does mean “solvable in polynomial time”.</p>`,
    },
    {
      title: 'Network flow models',
      html: R`
<p><b>Minimum-cost flow.</b> Directed network $G=(V,A)$; $b_i$ is supply (positive) or demand (negative); $u_a$ the arc capacity; $\delta^+(i)$ and $\delta^-(i)$ the arcs leaving and entering $i$:</p>
$$\min\sum_{a\in A}c_ax_a\qquad\text{s.t.}\qquad\sum_{a\in\delta^+(i)}x_a-\sum_{a\in\delta^-(i)}x_a=b_i\ \ (i\in V),\qquad 0\le x_a\le u_a .$$
<p><b>Four-node example.</b> Capacities $sa\,3$, $sb\,2$, $ab\,1$, $at\,2$, $bt\,3$. The flow that saturates every arc is feasible: at $a$, $3=1+2$; at $b$, $2+1=3$. The source sends 5 and the sink receives 5.</p>
<h3>The minimum cut as an integer program</h3>
<p>$z_v=1$ when vertex $v$ is on the source side $S$, and $y_{ij}$ charges the arcs that leave $S$:</p>
$$\min\sum_{(i,j)\in A}u_{ij}y_{ij}\qquad\text{s.t.}\qquad y_{ij}\ge z_i-z_j,\quad z_s=1,\ z_t=0,\quad z_v\in\{0,1\},\ y_{ij}\ge 0 .$$
<p>An arc leaving $S$ has $z_i-z_j=1$ and forces $y_{ij}\ge 1$, so its capacity is charged; for every other arc the right-hand side is $0$ or $-1$ and $y_{ij}=0$ is allowed.</p>
<p>In the example, $S=\{s,a\}$ means $z_s=z_a=1$, $z_b=z_t=0$; the outgoing arcs are $(s,b),(a,b),(a,t)$ and the objective is $2+1+2=5$.</p>
<div class="callout"><div class="callout-title">Max-flow / min-cut theorem</div>The maximum flow value equals the minimum $s$–$t$ cut capacity. Here a flow of value 5 and a cut of capacity 5 prove optimality on both sides.</div>
<p>This theorem is reused in slides 203: a fractional TSP solution $\bar x$ supplies the arc capacities, and a cut of capacity below 1 identifies a violated connectivity inequality.</p>
<h3>Network-flow integrality</h3>
<p>With <b>integer</b> supplies, demands and capacities, the feasible polyhedron of the minimum-cost flow formulation is integral, so every linear objective with a finite optimum has an integer optimal solution. This covers assignment, transportation, shortest path and many flow problems.</p>
<p><b>Lab 106</b> shows both sides. A 10-arc network sending 5 units has LP optimum = IP optimum = 25 with an integer flow. Changing a single capacity to the fractional value 2.5 gives an LP optimum of 27.5 with fractional flows, while the integer optimum is 30: integer data is part of the hypothesis.</p>`,
    },
    {
      title: 'Total unimodularity',
      html: R`
<div class="callout"><div class="callout-title">Definition and theorem</div>A matrix is <b>totally unimodular</b> (TU) if every square submatrix has determinant $0$, $1$ or $-1$. If $A$ is TU and $b$ is integer, then $\{x:\ Ax\le b,\ x\ge 0\}$ is integral.</div>
<p>TU is one <i>sufficient</i> condition for the integrality property. A sufficient condition for TU itself, as taught:</p>
<div class="callout move"><div class="callout-title">Recognition criterion</div>A matrix is TU if every coefficient is in $\{-1,0,1\}$ <b>and</b> every column contains at most one $+1$ and at most one $-1$.</div>
<p>It applies immediately to the node–arc incidence matrix of a directed network. For the arcs $sa,sb,ab,at,bt$ with the inflow-minus-outflow convention:</p>
<table class="data-table">
<thead><tr><th>Node</th><th>$sa$</th><th>$sb$</th><th>$ab$</th><th>$at$</th><th>$bt$</th></tr></thead>
<tbody>
<tr><th>$s$</th><td>−1</td><td>−1</td><td>0</td><td>0</td><td>0</td></tr>
<tr><th>$a$</th><td>1</td><td>0</td><td>−1</td><td>−1</td><td>0</td></tr>
<tr><th>$b$</th><td>0</td><td>1</td><td>1</td><td>0</td><td>−1</td></tr>
<tr><th>$t$</th><td>0</td><td>0</td><td>0</td><td>1</td><td>1</td></tr>
</tbody></table>
<p>Each column has one $-1$ and one $+1$.</p>
<ul>
<li>The criterion is <b>sufficient, not necessary</b>: it does not characterise every TU matrix. The assignment constraint matrix has two $+1$ in every column and is nevertheless TU (multiply the job rows by $-1$: determinants only change sign and the criterion then applies).</li>
<li>Network incidence matrices and the assignment matrix are TU; with integer right-hand sides their LP extreme points are integer. TU is the structural explanation of the integrality property.</li>
<li>The course uses TU “as a recognition tool rather than developing general TU proofs”.</li>
</ul>
<p>To show a matrix is <b>not</b> TU, exhibit one square submatrix with determinant outside $\{-1,0,1\}$. An entry equal to 2 is already a $1\times1$ counterexample; the classic $3\times3$ one is the triangle matrix $\begin{pmatrix}1&1&0\\0&1&1\\1&0&1\end{pmatrix}$ with determinant 2.</p>`,
    },
    {
      title: 'Limits of integrality',
      html: R`
<div class="callout trap"><div class="callout-title">From the slides</div>Integrality and other structural properties belong to the <b>complete</b> formulation. Changing even one constraint may destroy the property. Recheck the complete model after every material change.</div>
<p>Typical ways to lose it: adding a budget or side constraint to an assignment or flow model, a fractional capacity, or a coefficient other than $0,\pm1$. The TSP is the standard example: the degree constraints alone form an assignment problem (integral, but it allows subtours); adding connectivity constraints makes the model correct and destroys LP integrality.</p>`,
    },
  ],
  moves: [
    R`To claim integrality: (1) name the structure (network matrix / assignment matrix), (2) check the criterion column by column or cite TU, (3) check that the right-hand side and bounds are integer, (4) conclude “every extreme point is integer, so the LP optimum found by simplex is integer”.`,
    R`To refute TU: write down the submatrix and compute its determinant.`,
    R`For a cut in the min-cut IP: give $z$ for each vertex, list the arcs with $y=1$, add their capacities.`,
    R`When asked whether LP = IP for a modified model, look for what was added to the pure network structure.`,
  ],
  traps: [
    R`“The criterion fails, so the matrix is not TU.” The criterion is only sufficient.`,
    R`Forgetting the hypothesis that $b$ (supplies, demands, capacities) is integer. Lab 106: one capacity of 2.5 gives LP 27.5 against IP 30.`,
    R`“The LP solution is fractional, so the polyhedron is not integral.” A point on an optimal face may be fractional; integrality is about <b>extreme points</b>.`,
    R`Assuming a model keeps the integrality property after a side constraint is added.`,
    R`Saying “LP is polynomial because simplex is polynomial”. Polynomiality of LP comes from the ellipsoid (and interior-point) methods.`,
    R`Counting arcs entering $S$ in a cut: in the min-cut IP they have $z_i-z_j=-1$ and are not charged.`,
  ],
  refs: [
    R`Slides 106, <i>The Integrality Property</i> (T. Schettini), all 23 pages.`,
    R`Lab 106, network-flow integrality (min-cost flow with integer and fractional capacities).`,
    R`L. A. Wolsey, <i>Integer Programming</i>, 2nd ed., chapter 3; Ahuja, Magnanti and Orlin, <i>Network Flows</i>.`,
  ],
};
