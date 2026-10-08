const R = String.raw;

export default {
  id: 't403',
  lead: R`Row generation handles formulations with too many <b>constraints</b>. Column generation is its mirror image for formulations with too many <b>variables</b>: keep a small restricted master, and let a <b>pricing</b> problem find a column with negative reduced cost, or prove that none exists. Dantzig–Wolfe reformulation is the systematic way to obtain such strong, column-heavy formulations.`,
  sections: [
    {
      title: 'Dantzig–Wolfe reformulation',
      html: R`
$$z^*=\min\{c^\top x:\ Ax=b\ \text{(linking)},\ x\in X\},\qquad X=\{x\in\mathbb{Z}^n_+:\ Dx\le d\}\ \text{bounded}.$$
<p>Every point of $\operatorname{conv}(X)$ is a convex combination of its extreme points $x^1,\dots,x^P$ (which are points of $X$). Substituting $x=\sum_p\lambda_px^p$ gives the <b>master problem</b> in the weights $\lambda$:</p>
$$\min\sum_p(c^\top x^p)\,\lambda_p\qquad\text{s.t.}\qquad\sum_p(Ax^p)\,\lambda_p=b,\qquad\sum_p\lambda_p=1,\qquad\lambda\ge 0\ \ (+\ \text{integrality}).$$
<ul>
<li>Few rows (the linking constraints plus one <b>convexity</b> row), but one column per point of $X$: far too many to write down.</li>
<li>Its LP relaxation optimises over $\{x:\ Ax=b,\ x\in\operatorname{conv}(X)\}$. That is exactly the set in the Lagrangian strength theorem, so <b>the Dantzig–Wolfe LP bound equals the Lagrangian dual bound</b> $w_{LD}$: at least as strong as the LP relaxation of the original formulation, and equal to it when $X$ has the integrality property.</li>
<li>When the model has several identical blocks (machines, vehicles, rolls) the reformulation also removes the symmetry between them.</li>
</ul>`,
    },
    {
      title: 'Column generation',
      html: R`
<ol>
<li><b>Restricted master problem (RMP):</b> the master LP with only a subset of columns (enough to be feasible). Solve it; get the primal $\lambda$ and the <b>dual values</b> $\pi$ of the linking rows and $\pi_0$ of the convexity row.</li>
<li><b>Pricing problem:</b> the reduced cost of the column of point $x$ is $(c^\top-\pi^\top A)x-\pi_0$. Find the most negative one: $$\zeta=\min\{(c^\top-\pi^\top A)\,x:\ x\in X\}-\pi_0 .$$ This is an optimisation over the easy set $X$, with modified costs.</li>
<li>If $\zeta\lt 0$, add that column to the RMP and go to 1. If $\zeta\ge 0$, <b>no column can improve</b>: the RMP solution is optimal for the full master LP.</li>
</ol>
<div class="callout"><div class="callout-title">Bounds during the loop (minimisation)</div>Each RMP value is an <b>upper</b> bound on the master LP value $z_{LPM}$ (fewer columns, so a restriction). The Lagrangian bound $\pi^\top b+\min_{x\in X}(c^\top-\pi^\top A)x=z_{RMP}+\zeta$ is a <b>lower</b> bound on $z_{LPM}$. They meet when $\zeta=0$. In practice the RMP value decreases slowly near the end (tailing-off), so the lower bound is used to stop early.</div>
<p><b>Duality with row generation.</b> A column of the primal is a row of the dual: adding a column with negative reduced cost is adding a violated dual constraint. Pricing <i>is</i> separation for the dual LP. Likewise Benders generates rows of a master in $y$, Dantzig–Wolfe generates columns of a master in $\lambda$.</p>`,
    },
    {
      title: 'Cutting stock: the standard example',
      html: R`
<p>Rolls of width $W$ are cut into items; item $i$ has width $w_i$ and demand $d_i$. A <b>pattern</b> $a=(a_1,\dots,a_m)$ gives the number of pieces of each item cut from one roll; it is feasible if $\sum_iw_ia_i\le W$ with $a$ nonnegative integer. With $\lambda_p$ the number of rolls cut with pattern $p$:</p>
$$\min\sum_p\lambda_p\qquad\text{s.t.}\qquad\sum_pa_{ip}\lambda_p\ge d_i\ \ (i=1,\dots,m),\qquad\lambda_p\in\mathbb{Z}_+ .$$
<p>Every column costs 1, so its reduced cost is $1-\sum_i\pi_ia_i$, and the pricing problem is an <b>integer knapsack</b>:</p>
$$\max\Big\{\sum_i\pi_ia_i:\ \sum_iw_ia_i\le W,\ a\in\mathbb{Z}^m_+\Big\}.$$
<p>A column enters if this value exceeds 1.</p>
<h3>Worked through to the end</h3>
<p>$W=10$, widths $w=(6,4,3)$, demands $d=(3,6,9)$.</p>
<table class="data-table left">
<thead><tr><th>RMP</th><th>Columns</th><th>LP solution</th><th>Rolls</th><th>Duals $\pi$</th><th>Pricing</th></tr></thead>
<tbody>
<tr><td>1</td><td>$(1,0,0)$, $(0,2,0)$, $(0,0,3)$</td><td>$\lambda=(3,3,3)$</td><td>9</td><td>$(1,\tfrac12,\tfrac13)$</td><td>$(1,1,0)$: value $1.5\gt 1$, reduced cost $-\tfrac12$ → add</td></tr>
<tr><td>2</td><td>+ $(1,1,0)$</td><td>$\lambda_{(1,1,0)}=3$, $\lambda_{(0,2,0)}=1.5$, $\lambda_{(0,0,3)}=3$</td><td>7.5</td><td>$(\tfrac12,\tfrac12,\tfrac13)$</td><td>$(0,1,2)$: value $\tfrac76\gt 1$, reduced cost $-\tfrac16$ → add</td></tr>
<tr><td>3</td><td>+ $(0,1,2)$</td><td>$\lambda_{(1,1,0)}=3$, $\lambda_{(0,1,2)}=3$, $\lambda_{(0,0,3)}=1$</td><td>7</td><td>$(\tfrac23,\tfrac13,\tfrac13)$</td><td>best value 1: no negative reduced cost → stop</td></tr>
</tbody></table>
<ul>
<li>The duals of RMP 1 come from “basic columns have zero reduced cost”: $1-\pi_1=0$, $1-2\pi_2=0$, $1-3\pi_3=0$. In RMP 3: $\pi_1+\pi_2=1$, $\pi_2+2\pi_3=1$, $3\pi_3=1$. Check with LP duality: $\pi^\top d=2+2+3=7$.</li>
<li>The master LP value is 7, so at least $\lceil 7\rceil=7$ rolls are needed. The LP solution of RMP 3 happens to be integer: <b>7 rolls is optimal</b>. (The material bound agrees: $(6\cdot3+4\cdot6+3\cdot9)/10=6.9$, rounded up to 7.)</li>
<li>Three pricing problems replaced the enumeration of all patterns.</li>
</ul>`,
    },
    {
      title: 'From the LP to integer solutions: branch-and-price',
      html: R`
<p>Column generation solves the <b>LP relaxation</b> of the master. Its solution is usually fractional (RMP 2 above uses 1.5 rolls of a pattern).</p>
<ul>
<li><b>Rounding heuristics.</b> Round the $\lambda$ up, or solve the RMP as an integer program over the columns generated so far: a feasible solution, not a proof (the column needed for the optimum may be missing).</li>
<li><b>Branch-and-price.</b> Branch and bound in which the LP at <i>every node</i> is solved by column generation. The branching rule must be compatible with the pricing problem: branching directly on a master variable ($\lambda_p\le 0$) would require the pricing problem to avoid regenerating exactly that column. One branches instead on the <b>original variables</b> (or, in set-partitioning masters, on whether two items are covered by the same column, the Ryan–Foster rule), which can be enforced inside the subproblem.</li>
<li>Adding cuts as well gives branch-price-and-cut.</li>
</ul>`,
    },
    {
      title: 'One table for the three decompositions',
      html: R`
<table class="data-table left">
<thead><tr><th></th><th>Lagrangian relaxation</th><th>Dantzig–Wolfe / column generation</th><th>Benders</th></tr></thead>
<tbody>
<tr><td>Complication</td><td>linking <b>constraints</b></td><td>linking <b>constraints</b></td><td>linking <b>variables</b></td></tr>
<tr><td>What is generated</td><td>multipliers (prices)</td><td><b>columns</b></td><td><b>rows</b> (cuts)</td></tr>
<tr><td>Subproblem</td><td>$\min_{x\in X}(c-u^\top A)x$</td><td>the same, with $u=\pi$ from the RMP</td><td>LP in $x$ for fixed $y$</td></tr>
<tr><td>Master</td><td>update of $u$ (subgradient)</td><td>LP over the columns found</td><td>MIP over the cuts found</td></tr>
<tr><td>Bound obtained</td><td>$w_{LD}$</td><td>$w_{LD}$ (same value)</td><td>exact reformulation: $z^*$ at convergence</td></tr>
</tbody></table>`,
    },
  ],
  moves: [
    R`Describe column generation by its three parts: restricted master, dual values, pricing problem; give the reduced-cost formula for the problem at hand.`,
    R`For cutting stock: check a pattern's feasibility, compute $\sum_i\pi_ia_i$, reduced cost $1-\sum_i\pi_ia_i$, and state whether it enters.`,
    R`Get the duals of an RMP by hand from “every basic column has reduced cost zero”.`,
    R`State the stopping test (no negative reduced cost) and what it proves (optimality for the master <b>LP</b>).`,
    R`For an integer answer: round up the LP value for a bound, and say how an integer solution is obtained (heuristic or branch-and-price).`,
  ],
  traps: [
    R`Saying column generation solved the integer problem. It solves the LP relaxation of the master.`,
    R`Sign of the reduced cost: for a minimisation a column is attractive when its reduced cost is <b>negative</b> (pricing value $\gt 1$ in cutting stock).`,
    R`Using the RMP value as a lower bound before pricing has proved optimality. Until then it is an upper bound on the master LP value.`,
    R`Solving the final RMP as an integer program and calling the result optimal.`,
    R`Branching on $\lambda$ variables as if they were ordinary variables.`,
    R`Pricing with a 0–1 knapsack in cutting stock: a pattern may contain several pieces of the same item (integer knapsack).`,
  ],
  refs: [
    R`Course outline, class 10: “Dantzig–Wolfe reformulation and column generation: restricted master, pricing, and a brief connection to branch-and-price” (slides not yet released when this lesson was written).`,
    R`L. A. Wolsey, <i>Integer Programming</i>, 2nd ed., chapter 11 (column generation algorithms).`,
    R`J. Desrosiers and M. E. Lübbecke, “A primer in column generation” (2005); P. C. Gilmore and R. E. Gomory (1961) for cutting stock. Several bank questions are taken from the primer and from KTH SF2812 exams, with their sources.`,
    R`The cutting-stock example is this app's own; every restricted master, dual solution and pricing optimum in the table was recomputed by hand and the pricing step is checked by enumeration in the test suite.`,
  ],
};
