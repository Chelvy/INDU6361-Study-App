const R = String.raw;

export default {
  id: 't204',
  lead: R`Subtour inequalities were tailored to the TSP. This lecture asks how to manufacture valid inequalities for <i>any</i> integer program: by rounding. Integer rounding, Chvátal–Gomory cuts and Gomory cuts read off the simplex tableau are the same idea applied to more and more cleverly chosen rows.`,
  sections: [
    {
      title: 'Valid inequalities: three separate questions',
      html: R`
<div class="callout"><div class="callout-title">Definition</div>Let $X$ be the set of feasible integer solutions. An inequality $\alpha^\top x\le\beta$ is <b>valid</b> for $X$ when every $x\in X$ satisfies it. It need not appear in the formulation to be valid.</div>
<p>When adding an inequality, keep three questions apart:</p>
<ol>
<li>Is it satisfied by every feasible integer solution? (<b>validity</b>)</li>
<li>Does it exclude the current LP solution? (is it a <b>cut</b> right now)</li>
<li>How much does it tighten the relaxation? (<b>strength</b>)</li>
</ol>
<p>A valid inequality may already be implied by the constraints of the model, in which case it changes nothing.</p>`,
    },
    {
      title: 'Integer rounding and Chvátal–Gomory cuts',
      html: R`
<p><b>Integer rounding.</b> If $\pi^\top x$ is integer for every $x\in X$, then</p>
$$\pi^\top x\le\delta\ \Longrightarrow\ \pi^\top x\le\lfloor\delta\rfloor .$$
<p>Workshop: $x+y\le 6.3$ with $x,y$ integer gives $x+y\le 6$. The LP point $(1.3,5)$ violates it, every integer point satisfies it, and the LP bound drops from 51.3 to 49.65.</p>
<p><b>Rounding coefficients too.</b> Suppose $x\ge 0$ is integer and $a^\top x\le b$ is valid. Round down (towards $-\infty$):</p>
$$\sum_j\lfloor a_j\rfloor x_j\ \le\ \sum_ja_jx_j\ \le\ b\qquad\Longrightarrow\qquad\sum_j\lfloor a_j\rfloor x_j\le\lfloor b\rfloor .$$
<p>The first step uses <b>nonnegativity</b> ($\lfloor a_j\rfloor x_j\le a_jx_j$ only when $x_j\ge 0$; note $\lfloor -\tfrac12\rfloor=-1$). The second uses <b>integrality</b>: the new left-hand side is an integer.</p>
<div class="callout"><div class="callout-title">Chvátal–Gomory cut</div>For $Ax\le b$ and any multipliers $u\ge 0$, the combination $(u^\top A)x\le u^\top b$ is valid, and so is
$$\sum_j\lfloor u^\top A_j\rfloor\,x_j\ \le\ \lfloor u^\top b\rfloor .$$</div>
<p>Example from slides 206: the workshop rows $x+y\le 6$ and $y-x\le 3$ with $u=(\tfrac12,\tfrac12)$ give $y\le 4.5$, hence $y\le 4$.</p>`,
    },
    {
      title: 'Gomory cuts from the simplex tableau',
      html: R`
<p>Which multipliers $u$? The optimal simplex tableau offers ready-made rows that are guaranteed to give a violated cut.</p>
<div class="callout move"><div class="callout-title">Gomory cut algorithm (pure-integer model, nonnegative variables, integer slacks)</div>
<ol>
<li>Solve the LP and obtain its simplex tableau.</li>
<li>Select a basic integer variable with a fractional right-hand side.</li>
<li>Treat its row as “$\le$” and <b>floor every coefficient and the right-hand side</b>.</li>
<li>Add the cut (with a new integer slack) and reoptimise. Repeat until the LP optimum is integer.</li>
</ol></div>
<p>Why the current vertex is always cut off: in the source row the nonbasic variables are zero, so the left-hand side of the rounded row equals the basic variable's value $\bar b_i$, which exceeds $\lfloor\bar b_i\rfloor$.</p>
<p><b>Row selection (classroom policy).</b> Any basic integer variable with fractional right-hand side gives a violated cut. Among fractional basic <b>decision</b> variables choose the row with the largest fractional part $f_i=\bar b_i-\lfloor\bar b_i\rfloor$; break ties by row order. This maximises the violation of the directly rounded row; it need not give the strongest cut.</p>`,
    },
    {
      title: 'Example 1, in full',
      html: R`
$$\max\ 4x_1-x_2\quad\text{s.t.}\quad 7x_1-2x_2\le 14\ (1),\quad x_2\le 3\ (2),\quad 2x_1-2x_2\le 3\ (3),\quad x_1,x_2\in\mathbb{Z}_+ .$$
<p>Slacks $s_1,s_2,s_3$ are integer whenever $x$ is. LP optimum: rows (1) and (2) tight, $(x_1,x_2)=(20/7,\ 3)$, $z=59/7$.</p>
<table class="tableau">
<thead><tr><th>Basic</th><th>$x_1$</th><th>$x_2$</th><th>$s_1$</th><th>$s_2$</th><th>$s_3$</th><th>RHS</th></tr></thead>
<tbody>
<tr class="hl-row"><th>$x_1$</th><td>1</td><td>0</td><td>1/7</td><td>2/7</td><td>0</td><td class="rhs">20/7</td></tr>
<tr><th>$x_2$</th><td>0</td><td>1</td><td>0</td><td>1</td><td>0</td><td class="rhs">3</td></tr>
<tr><th>$s_3$</th><td>0</td><td>0</td><td>−2/7</td><td>10/7</td><td>1</td><td class="rhs">23/7</td></tr>
<tr class="z-row"><th>$z$</th><td>0</td><td>0</td><td>4/7</td><td>1/7</td><td>0</td><td class="rhs">59/7</td></tr>
</tbody></table>
<p><b>Cut 1.</b> Row of $x_1$: $x_1+\tfrac17s_1+\tfrac27s_2=\tfrac{20}{7}$. Floor: $x_1+0s_1+0s_2\le 2$, i.e. $\boxed{x_1\le 2}$. The LP point has $x_1=20/7\gt 2$. Add $x_1+s_4=2$ and reoptimise: $(2,\tfrac12)$, $z=15/2$.</p>
<table class="tableau">
<thead><tr><th>Basic</th><th>$x_1$</th><th>$x_2$</th><th>$s_1$</th><th>$s_2$</th><th>$s_3$</th><th>$s_4$</th><th>RHS</th></tr></thead>
<tbody>
<tr><th>$x_1$</th><td>1</td><td>0</td><td>0</td><td>0</td><td>0</td><td>1</td><td class="rhs">2</td></tr>
<tr class="hl-row"><th>$x_2$</th><td>0</td><td>1</td><td>0</td><td>0</td><td>−1/2</td><td>1</td><td class="rhs">1/2</td></tr>
<tr><th>$s_1$</th><td>0</td><td>0</td><td>1</td><td>0</td><td>−1</td><td>−5</td><td class="rhs">1</td></tr>
<tr><th>$s_2$</th><td>0</td><td>0</td><td>0</td><td>1</td><td>1/2</td><td>−1</td><td class="rhs">5/2</td></tr>
<tr class="z-row"><th>$z$</th><td>0</td><td>0</td><td>0</td><td>0</td><td>1/2</td><td>3</td><td class="rhs">15/2</td></tr>
</tbody></table>
<p><b>Cut 2.</b> Row of $x_2$: $x_2-\tfrac12s_3+s_4=\tfrac12$. Floor (the negative coefficient rounds <i>down</i> to $-1$): $x_2-s_3+s_4\le 0$. Substitute $s_3=3-2x_1+2x_2$ and $s_4=2-x_1$:</p>
$$x_2-(3-2x_1+2x_2)+(2-x_1)\le 0\ \Longleftrightarrow\ \boxed{x_1-x_2\le 1}.$$
<p>Geometrically this moves row (3) inward to the next integer value of $x_1-x_2$. Reoptimising gives $(2,1)$ with $z=7$: integer, done. The final objective row reads $z=7-3s_4-s_5\le 7$.</p>`,
    },
    {
      title: 'The workshop solved by Gomory cuts',
      html: R`
<p>The rows $-x+y\le 3.7$ and $x+y\le 6.3$ have decimal data, so their slacks would not be integer. <b>Multiply them by 10 first</b>: $x+s_1=3$, $-10x+10y+s_2=37$, $10x+10y+s_3=63$. The LP region is unchanged and every slack is integer at integer $(x,y)$.</p>
<table class="data-table left">
<thead><tr><th>LP solve</th><th>Source row → rounded row</th><th>Cut in $x,y$</th><th>New LP optimum</th><th>Bound</th></tr></thead>
<tbody>
<tr><td>Original</td><td>—</td><td>—</td><td>$(13/10,\ 5)$</td><td>51.3</td></tr>
<tr><td>Cut 1</td><td>$x-\tfrac1{20}s_2+\tfrac1{20}s_3=\tfrac{13}{10}$ → $x-s_2\le 1$</td><td>$-9x+10y\le 38$</td><td>$(25/19,\ 947/190)$</td><td>$972/19\approx 51.158$</td></tr>
<tr><td>Cut 2</td><td>$y+\tfrac9{190}s_3+\tfrac1{19}s_4=\tfrac{947}{190}$ → $y\le 4$</td><td>$y\le 4$</td><td>$(23/10,\ 4)$</td><td>42.3</td></tr>
<tr><td>Cut 3</td><td>$x+\tfrac1{10}s_3-s_5=\tfrac{23}{10}$ → $x-s_5\le 2$</td><td>$x+y\le 6$</td><td>$(2,\ 4)$</td><td>42</td></tr>
</tbody></table>
<p>Substitutions: cut 1 uses $s_2=37+10x-10y$; cut 3 uses $s_5=4-y$. Every cut keeps all integer feasible points; the final LP bound equals the value of the integer plan $(2,4)$, so $z_{IP}=42$ with no branching.</p>`,
      widget: 'gomoryWorkshop',
    },
    {
      title: 'Cutting planes alone, and in solvers',
      html: R`
<ul>
<li>For bounded pure-integer problems with rational data, Gomory's algorithm solves the problem without branching when its finite-convergence rules are followed.</li>
<li>In practice repeated cutting can make slow progress: the first workshop cut moved the bound only from 51.3 to about 51.158. Each cut also makes the LP larger. A valid, violated cut need not give a useful bound improvement.</li>
<li>Modern solvers combine cuts with branch and bound (<b>branch-and-cut</b>); mixed-integer models use the mixed-integer variants (next lesson).</li>
</ul>
<p>A Gurobi log may end with</p>
<pre>Cutting planes:
  Gomory: 1
  MIR: 17</pre>
<p>These counts are the cuts <b>remaining in the final LP relaxation</b>, not every cut generated during the search.</p>`,
    },
  ],
  moves: [
    R`Before reading a tableau row, check that all data are integer; if not, scale the constraints so that the slacks are integer, and say so.`,
    R`Write the source row as an equation, then the floored row as an inequality, coefficient by coefficient. Show $\lfloor -\tfrac12\rfloor=-1$ explicitly when it occurs.`,
    R`Substitute each slack using its defining equation and simplify to an inequality in the original variables.`,
    R`Verify the cut on the current LP point (it must be violated) and on one or two integer feasible points (they must satisfy it).`,
    R`For a Chvátal–Gomory cut: state $u\ge 0$, the combined row, then the two floors and the reason for each.`,
  ],
  traps: [
    R`Rounding a negative coefficient towards zero: $\lfloor -\tfrac12\rfloor$ is $-1$, not $0$.`,
    R`Flooring coefficients when a variable can be negative or continuous. Coefficient rounding needs $x\ge 0$; right-hand-side rounding needs an integer left-hand side. With continuous variables use MIR instead.`,
    R`Using a tableau whose slacks are not integer (decimal data left unscaled).`,
    R`Choosing a source row whose basic variable is already integer: the cut is not violated.`,
    R`Sign slips in the slack substitution: $s_2=37+10x-10y$ comes from $-10x+10y+s_2=37$.`,
    R`Reading “Gomory: 1” in a log as “one Gomory cut was tried”.`,
  ],
  refs: [
    R`Slides 204, <i>Gomory Cuts</i> (T. Schettini), all 49 pages, including both worked examples with every tableau.`,
    R`MIT 15.053 Gomory-cut slides (cited on the slides for the tableau-row arithmetic).`,
    R`Wolsey, <i>Integer Programming</i>, 2nd ed., chapters 3 and 8; Conforti, Cornuéjols and Zambelli, <i>Integer Programming</i>, chapters 5 and 9.`,
  ],
};
