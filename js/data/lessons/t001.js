const R = String.raw;

export default {
  id: 't001',
  lead: R`The course assumes linear programming. Almost every method in it is LP plus one idea: branch and bound solves LPs at nodes, Gomory cuts read the simplex tableau, Benders cuts are LP dual solutions, column generation prices with LP duals. This page is the minimum to have at your fingertips.`,
  sections: [
    {
      title: 'Geometry: polyhedra and extreme points',
      html: R`
<ul>
<li>The feasible region of an LP is a <b>polyhedron</b>; if bounded, a <b>polytope</b> (slides 102).</li>
<li>If an LP has a finite optimum, some optimal solution is an <b>extreme point</b> (vertex). The simplex method moves from vertex to adjacent vertex.</li>
<li>In two variables, solve graphically: slide the objective line in the improving direction until it last touches the region; the vertex is the intersection of the two <b>tight</b> constraints there. Workshop: $y=x+3.7$ and $y=-x+6.3$ meet at $(1.3,5)$.</li>
<li>An LP can be infeasible, unbounded, or have an optimal face with several optimal solutions.</li>
</ul>`,
    },
    {
      title: 'Standard form and reading a simplex tableau',
      html: R`
<p>Add a nonnegative <b>slack</b> to each “$\le$” row: $a^\top x+s=b$, $s\ge 0$. With $m$ rows, a <b>basic solution</b> sets all but $m$ variables to zero (the <b>nonbasic</b> ones) and solves for the $m$ <b>basic</b> variables.</p>
<p>In the tableau layout used in slides 204 (one row per basic variable, last row for $z$):</p>
<ul>
<li>the basic variable of a row has coefficient 1 in that row and 0 elsewhere;</li>
<li>the <b>RHS</b> column gives the values of the basic variables; nonbasic variables are 0;</li>
<li>each row is an <b>equation</b> that every feasible solution satisfies (that is why it can be rounded into a Gomory cut);</li>
<li>the $z$ row is written as $z+\sum_j\bar d_jx_j=\bar z$: for a maximisation the tableau is optimal when all $\bar d_j\ge 0$, and then $z=\bar z-\sum_j\bar d_jx_j\le\bar z$;</li>
<li>the $z$-row coefficient of a <b>slack</b> is the <b>dual value</b> of its constraint.</li>
</ul>
<p>Example (slides 204, first tableau): $x_1$ row $[1,0,\tfrac17,\tfrac27,0\ |\ \tfrac{20}{7}]$ reads $x_1+\tfrac17s_1+\tfrac27s_2=\tfrac{20}{7}$; with $s_1=s_2=0$, $x_1=\tfrac{20}{7}$. The $z$ row $[0,0,\tfrac47,\tfrac17,0\ |\ \tfrac{59}{7}]$ says the duals of rows (1) and (2) are $\tfrac47$ and $\tfrac17$: indeed $14\cdot\tfrac47+3\cdot\tfrac17=\tfrac{59}{7}$.</p>`,
    },
    {
      title: 'Duality',
      html: R`
<table class="data-table">
<thead><tr><th>Primal</th><th>Dual</th></tr></thead>
<tbody><tr><td>$\max\ c^\top x$ s.t. $Ax\le b,\ x\ge 0$</td><td>$\min\ b^\top y$ s.t. $A^\top y\ge c,\ y\ge 0$</td></tr></tbody></table>
<p>How to dualise anything: one dual variable per primal constraint, one dual constraint per primal variable; for a <b>max</b> primal, a “$\le$” row gives $y_i\ge 0$, a “$\ge$” row gives $y_i\le 0$, an “$=$” row gives $y_i$ free; a variable $x_j\ge 0$ gives a “$\ge$” dual constraint, a free variable gives “$=$”.</p>
<div class="callout"><div class="callout-title">The three facts</div>
<ul>
<li><b>Weak duality:</b> for feasible $x$ and $y$, $c^\top x\le b^\top y$. Any dual feasible solution bounds the primal optimum.</li>
<li><b>Strong duality:</b> if one problem has a finite optimum, so does the other, with equal values.</li>
<li><b>Complementary slackness:</b> feasible $x,y$ are both optimal iff $y_i\,(b_i-a_i^\top x)=0$ for every row and $x_j\,(A_j^\top y-c_j)=0$ for every column: a positive dual value needs a tight constraint; a positive variable needs a tight dual constraint (zero reduced cost).</li>
</ul></div>
<p>Also: primal unbounded ⇒ dual infeasible; primal infeasible ⇒ dual infeasible or unbounded (a dual <b>ray</b> certifies primal infeasibility; this is where Benders feasibility cuts come from).</p>
<p><b>Reduced cost</b> of a variable (max problem): $\bar d_j=A_j^\top y-c_j$. At an optimum all are $\ge 0$ and basic variables have $\bar d_j=0$. Column generation looks for a column whose reduced cost has the “wrong” sign.</p>
<p><b>Shadow price:</b> $y_i$ is the rate of change of the optimal value per unit of $b_i$ (within the range where the basis stays optimal).</p>`,
    },
    {
      title: 'Where LP duality appears in this course',
      html: R`
<table class="data-table left">
<thead><tr><th>Topic</th><th>Use of LP</th></tr></thead>
<tbody>
<tr><td>Branch and bound</td><td>LP relaxation at every node; its value is the node's dual bound.</td></tr>
<tr><td>Hungarian method</td><td>$u_i+v_j\le c_{ij}$ is dual feasibility for the assignment LP; $\sum u+\sum v$ is the dual objective.</td></tr>
<tr><td>Max flow / min cut</td><td>The two LPs are duals of each other; both integral (TU).</td></tr>
<tr><td>Gomory cuts</td><td>Rows of the optimal tableau.</td></tr>
<tr><td>Lagrangian relaxation</td><td>Generalises LP duality by keeping integrality in the subproblem.</td></tr>
<tr><td>Benders</td><td>Optimality cuts from dual optimal solutions, feasibility cuts from dual rays.</td></tr>
<tr><td>Column generation</td><td>Dual values of the restricted master define the pricing problem.</td></tr>
</tbody></table>`,
    },
  ],
  moves: [
    R`Solving a two-variable LP on paper: draw the constraints, identify the optimal vertex with the objective direction, solve the two tight equations, substitute in the objective.`,
    R`Writing a dual: lay out the primal as a table (rows = constraints, columns = variables) and read it transposed, fixing each sign from the rule above.`,
    R`Checking optimality without re-solving: verify primal feasibility, dual feasibility and complementary slackness (or simply equal objective values).`,
  ],
  traps: [
    R`Assuming the LP optimum is where the largest coefficient points. With several tight constraints, check the vertices.`,
    R`Sign errors when dualising “$\ge$” rows of a maximisation or free variables.`,
    R`Reading the value of a nonbasic variable from the tableau: it is zero.`,
    R`Forgetting that an LP may have several optimal solutions; the simplex method returns a vertex, which matters for integrality (slides 106).`,
  ],
  refs: [
    R`Prerequisite material. The tableau conventions are those of slides 204; polytopes and vertices are recalled in slides 102 and 106.`,
    R`Wolsey, <i>Integer Programming</i>, 2nd ed., chapter 2 (LP background). External questions on LP and duality in the bank cite MIT OCW, EPFL and the Rothvoss lecture notes.`,
  ],
};
