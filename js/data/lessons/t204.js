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
      title: 'Integer rounding',
      html: R`
<p><b>Rule.</b> If $\pi^\top x$ is integer for every $x\in X$, then</p>
$$\pi^\top x\le\delta\ \Longrightarrow\ \pi^\top x\le\lfloor\delta\rfloor .$$
<p>Workshop: $\max\ x+10y$ s.t. $x\le3$, $-x+y\le3.7$, $x+y\le6.3$, $x,y\in\mathbb Z_+$, with LP optimum $(1.3,5)$ and bound 51.3. Since $x+y$ is an integer, $x+y\le 6.3$ gives $x+y\le 6$. The LP point violates it, every integer point satisfies it, and the LP bound drops from 51.3 to 49.65.</p>
<p><b>Round both rows</b> (reading version of slides 204). Both left-hand sides are integers at integer points, so $-x+y\le3.7\Rightarrow -x+y\le 3$ and $x+y\le6.3\Rightarrow x+y\le 6$. The two new boundary lines meet at $(1.5,\ 4.5)$, which is still fractional. The LP bound falls to $1.5+10(4.5)=46.5$. Rounding rows one at a time is not enough; next we <i>combine</i> rows.</p>
<p><b>A row with “$\ge$”: round the right side up</b> (20E Exercise 4(b)). If $\pi^\top x$ is an integer and $\pi^\top x\ge\delta$, then $\pi^\top x\ge\lceil\delta\rceil$: an integer that is at least $\tfrac23$ is at least 1. So $2x+y\ge\tfrac23$ gives $2x+y\ge1$, which removes the point $(\tfrac13,0)$. Rounding down instead would give the weaker row $2x+y\ge 0$, which removes nothing. (Lesson 206c uses the same rule for its cumulative lot-sizing cut.)</p>`,
    },
    {
      title: 'Rounding coefficients and Chvátal–Gomory cuts',
      html: R`
<p><b>Rounding coefficients too.</b> Rounding the right-hand side needs a left-hand side that is an integer at every integer point; integer coefficients ensure this. Suppose $x\ge 0$ is integer and $a^\top x\le b$ is valid. Round the coefficients down (towards $-\infty$):</p>
$$\sum_j\lfloor a_j\rfloor x_j\ \le\ \sum_ja_jx_j\ \le\ b\qquad\Longrightarrow\qquad\sum_j\lfloor a_j\rfloor x_j\le\lfloor b\rfloor .$$
<p>The first step uses <b>nonnegativity</b> ($\lfloor a_j\rfloor x_j\le a_jx_j$ only when $x_j\ge 0$). The second uses <b>integrality</b>: the new left-hand side is an integer.</p>
<p><b>Floor, not truncation.</b> The floor $\lfloor a\rfloor$ is the largest integer not above $a$, so $\lfloor -\tfrac12\rfloor=-1$, not 0. For $x_j\ge0$, replacing $-\tfrac12x_j$ by $-x_j$ decreases the left-hand side (safe). Replacing it by $0$ (truncation toward zero) would increase it and could exclude an integer-feasible point. (Beyond the slides, an example: truncating Example 1's row $x_2-\tfrac12s_3+s_4=\tfrac12$ below gives $x_2+s_4\le0$, that is $x_1-x_2\ge2$, which removes every integer feasible point, the optimum $(2,1)$ included.)</p>
<div class="callout"><div class="callout-title">Chvátal–Gomory cut</div>For $Ax\le b$ and any multipliers $u\ge 0$, the combination $(u^\top A)x\le u^\top b$ is valid, and so is
$$\sum_j\lfloor u^\top A_j\rfloor\,x_j\ \le\ \lfloor u^\top b\rfloor .$$</div>
<p><b>Combining the rounded rows</b> (slides 204 reading version, “Combining the rounded constraints”; also slides 206). Take one half of $-x+y\le 3$ and one half of $x+y\le 6$:</p>
$$\tfrac12(-x+y)+\tfrac12(x+y)\le\tfrac12(3)+\tfrac12(6)\ \Longrightarrow\ y\le 4.5\ \Longrightarrow\ \boxed{y\le 4}.$$
<p>This cut removes the corner $(1.5,4.5)$ of the strengthened relaxation, and also the original LP optimum $(1.3,5)$, because both have $y\gt4$.</p>
<p><b>Scaling before rounding can give a stronger cut</b> (20E Exercise 4(c)). Row (c) is $-\tfrac12x+\tfrac32y\le\tfrac74$ with $x,y\in\mathbb Z_+$.</p>
<ul>
<li>Floor the coefficients: $-x+y\le -\tfrac12x+\tfrac32y\le\tfrac74$, then round the right side: $-x+y\le 1$, that is $y\le 1+x$.</li>
<li>Multiply by 2 first (a Chvátal–Gomory multiplier $u=2$): $-x+3y\le\tfrac72$. The coefficients are already integers, so only the right side rounds: $-x+3y\le 3$, that is $y\le 1+\tfrac x3$.</li>
<li>The second cut is stronger: the point $(\tfrac12,\tfrac43)$ satisfies $-x+y\le1$ ($\tfrac56\le1$) but violates $-x+3y\le3$ ($3.5\gt3$). (Beyond the slides: the line $-x+3y=3$ passes through the feasible integer points $(0,1)$ and $(3,2)$, so it is an edge of the integer hull.)</li>
</ul>
<p><a href="#/exercises/20e/4">Open 20E Exercise 4</a>.</p>`,
    },
    {
      title: 'Gomory cuts from the simplex tableau',
      html: R`
<p><b>Which multipliers $u$?</b> Each simplex tableau row is a combination of the model's equations (slacks included). It writes one <b>basic</b> variable in terms of the <b>nonbasic</b> ones (those fixed at 0 in the current corner). At the LP optimum the nonbasic variables are 0, so the right side is the basic variable's current value. If that variable must be an integer and its value is fractional, rounding this row gives a valid inequality that removes the current point.</p>
<div class="callout move"><div class="callout-title">Gomory cut algorithm (pure-integer model, nonnegative variables, integer slacks)</div>
<ol>
<li>Solve the LP and obtain its simplex tableau.</li>
<li>Select a basic integer variable with a fractional right-hand side.</li>
<li>Treat its row as “$\le$” and <b>floor every coefficient and the right-hand side</b>.</li>
<li>Add the cut (with a new integer slack) and reoptimise. Repeat until the LP optimum is integer.</li>
</ol></div>
<p>Why the current vertex is always cut off: in the source row the nonbasic variables are zero, so the left-hand side of the rounded row equals the basic variable's value $\bar b_i$, which exceeds $\lfloor\bar b_i\rfloor$.</p>
<h3>The same cut in fractional-part form (20E Exercise 5)</h3>
<p>Write the source row as $x_B+\sum_ja_js_j=b$, where the $s_j$ are the nonbasic variables. Step 3 gives $x_B+\sum_j\lfloor a_j\rfloor s_j\le\lfloor b\rfloor$. Now <b>subtract this inequality from the equation</b> (rule: if $L=b$ and $L'\le b'$, then $L-L'\ge b-b'$):</p>
$$\sum_j f_j\,s_j\ \ge\ f_0,\qquad f_j=a_j-\lfloor a_j\rfloor,\quad f_0=b-\lfloor b\rfloor .$$
<ul>
<li><b>It is the same cut.</b> Every point we work with satisfies the tableau equation, and adding that equation back gives the floored form again. So both forms keep and remove exactly the same points.</li>
<li><b>Violation is easy to see.</b> At the current LP point every $s_j=0$, so the left side is 0 and the cut asks $0\ge f_0\gt 0$: violated by $f_0$.</li>
<li><b>Fractional part of a negative number</b> (20E Exercise 6): $f=a-\lfloor a\rfloor$, which always lies in $[0,1)$. For $-\tfrac13$: $-\tfrac13-(-1)=\tfrac23$. For $-\tfrac15$: $\tfrac45$. It is not $\tfrac13$ or $\tfrac15$.</li>
</ul>
<p><b>Adding the cut to the tableau.</b> The slides add the cut with a new slack, replace the current basic variables by their rows, and get a row with a negative right-hand side, which calls for reoptimisation. Example 1, cut 2: $-\tfrac12s_3+0s_4+s_5=-\tfrac12$. (Beyond the slides: this new row is exactly $-\sum_jf_js_j+s_{\text{new}}=-f_0$, the fractional-part form with its slack.)</p>
<p><b>Tableau layout.</b> The slides' tableaux also carry a $z$ column (0 in every constraint row, 1 in the $z$ row): “We retain every variable column and the objective row”. The tables below leave that column out.</p>
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
<p><b>Cut 1.</b> Row of $x_1$: $x_1+\tfrac17s_1+\tfrac27s_2=\tfrac{20}{7}$. Floor: $x_1+0s_1+0s_2\le 2$, i.e. $\boxed{x_1\le 2}$. The LP point has $x_1=20/7\gt 2$. (In fractional-part form: $\tfrac17s_1+\tfrac27s_2\ge\tfrac67$, the same cut.) Add $x_1+s_4=2$ and reoptimise: $(2,\tfrac12)$, $z=15/2$.</p>
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
      title: 'Sheet 20E, Exercises 5 and 6: two more tableau cuts',
      html: R`
<p><b>Exercise 5.</b> $\max\ x+y$ s.t. $2x+y\le4$, $x+2y\le4$, $x,y\in\mathbb Z_+$. LP optimum $(\tfrac43,\tfrac43)$, $\bar z=\tfrac83$, slacks $s_1=4-2x-y$, $s_2=4-x-2y$ (nonnegative integers at integer points).</p>
<ol>
<li>Source row (the $x$ row): $x+\tfrac23s_1-\tfrac13s_2=\tfrac43$.</li>
<li>Floor every coefficient and the right side: $\lfloor\tfrac23\rfloor=0$, $\lfloor-\tfrac13\rfloor=-1$, $\lfloor\tfrac43\rfloor=1$, so $x-s_2\le 1$.</li>
<li>Subtract from the equation: $\boxed{\tfrac23s_1+\tfrac23s_2\ge\tfrac13}$. At the LP point $s_1=s_2=0$, so it asks $0\ge\tfrac13$: violated.</li>
<li>Back to $(x,y)$: multiply by 3 and substitute the slacks: $2(4-2x-y)+2(4-x-2y)\ge1$, so $16-6x-6y\ge1$, so $\boxed{x+y\le\tfrac52}$. The LP point has $x+y=\tfrac83\gt\tfrac52$.</li>
<li><b>A further rounding step</b>, separate from the tableau cut: $x+y$ is an integer at integer points, so $x+y\le 2$. The integer point $(2,0)$ has value 2, so this bound proves optimality. Keep the two steps distinct: the Gomory cut is $x+y\le\tfrac52$.</li>
</ol>
<p><b>Exercise 6: comparing cuts from different rows.</b> $\max\ x+2y$ s.t. $2x+y\le5$, $-x+2y\le2$, $x,y\in\mathbb Z_+$; slacks $s_1=5-2x-y$, $s_2=2+x-2y$. Optimal rows: $x+\tfrac25s_1-\tfrac15s_2=\tfrac85$ and $y+\tfrac15s_1+\tfrac25s_2=\tfrac95$.</p>
<table class="data-table left">
<thead><tr><th>Source row</th><th>Fractional parts</th><th>Cut in the slacks</th><th>Cut in $(x,y)$</th></tr></thead>
<tbody>
<tr><td>$y$ row</td><td>$\tfrac15,\ \tfrac25;\ f_0=\tfrac45$</td><td>$\tfrac15s_1+\tfrac25s_2\ge\tfrac45$, i.e. $s_1+2s_2\ge4$</td><td>$9-5y\ge4$, i.e. $\boxed{y\le 1}$</td></tr>
<tr><td>$x$ row</td><td>$\tfrac25,\ \tfrac45$ (from $-\tfrac15$)$;\ f_0=\tfrac35$</td><td>$\tfrac25s_1+\tfrac45s_2\ge\tfrac35$</td><td>$18-10y\ge3$, i.e. $y\le\tfrac32$</td></tr>
</tbody></table>
<p>Both cuts exclude the LP point $(\tfrac85,\tfrac95)$. The $y$-row cut $y\le1$ is stronger (before any further rounding). The classroom rule also picks the $y$ row here: its fractional part $\tfrac45$ beats $\tfrac35$. (Beyond the slides: a further rounding step would turn $y\le\tfrac32$ into $y\le1$ too.)</p>
<p><a href="#/exercises/20e/5">Open 20E Exercise 5</a> · <a href="#/exercises/20e/6">Open 20E Exercise 6</a>.</p>`,
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
<p>Substitutions: cut 1 uses $s_2=37+10x-10y$; cut 3 uses $s_5=4-y$. Every cut keeps all integer feasible points; the final objective row reads $z=42-9s_5-s_6\le 42$, and the final LP optimum is the integer plan $(2,4)$, so $z_{IP}=42$ with no branching.</p>`,
      widget: 'gomoryWorkshop',
    },
    {
      title: 'Cutting planes alone, and in solvers',
      html: R`
<ul>
<li>For bounded pure-integer problems with rational data, Gomory's algorithm solves the problem without branching when its finite-convergence rules are followed.</li>
<li>Convergence can be slow: at each fractional LP optimum a row of a fractional integer variable gives a violated Gomory cut, but the violation may be small, so the bound may improve only slightly. The first workshop cut moved the bound only from 51.3 to about 51.158. Each cut also makes the LP larger.</li>
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
    R`If asked for the fractional-part form: subtract the floored row from the equation, giving $\sum_jf_js_j\ge f_0$ with $f=a-\lfloor a\rfloor$; at the LP point the left side is 0, so the violation is $f_0$.`,
    R`Substitute each slack using its defining equation and simplify to an inequality in the original variables. Any further rounding of the result is a separate, named step.`,
    R`Verify the cut on the current LP point (it must be violated) and on one or two integer feasible points (they must satisfy it).`,
    R`For a Chvátal–Gomory cut: state $u\ge 0$, the combined row, then the two floors and the reason for each. For a “$\ge$” row with an integer left side, round the right side up.`,
  ],
  traps: [
    R`Rounding a negative coefficient towards zero: $\lfloor -\tfrac12\rfloor$ is $-1$, not $0$.`,
    R`Taking the fractional part of $-\tfrac13$ as $\tfrac13$. It is $-\tfrac13-\lfloor-\tfrac13\rfloor=\tfrac23$.`,
    R`Rounding the right side of a “$\ge$” row down: the result is valid but removes nothing. Round up: $2x+y\ge\tfrac23$ gives $2x+y\ge1$.`,
    R`Flooring coefficients when a variable can be negative or continuous. Coefficient rounding needs $x\ge 0$; right-hand-side rounding needs an integer left-hand side. With continuous variables use MIR instead.`,
    R`Merging the tableau cut with the further rounding step: in 20E Exercise 5 the Gomory cut is $x+y\le\tfrac52$; $x+y\le2$ comes from rounding it again.`,
    R`Using a tableau whose slacks are not integer (decimal data left unscaled).`,
    R`Choosing a source row whose basic variable is already integer: the cut is not violated.`,
    R`Sign slips in the slack substitution: $s_2=37+10x-10y$ comes from $-10x+10y+s_2=37$.`,
    R`Reading “Gomory: 1” in a log as “one Gomory cut was tried”.`,
  ],
  refs: [
    R`Slides 204, <i>Gomory Cuts</i> (T. Schettini), all 49 pages, including both worked examples with every tableau; the HTML reading version (October 2026) adds “Rounding both constraints” (bound 46.5), “Combining the rounded constraints” ($y\le4$) and the warning against truncation.`,
    R`Sheet 20E, Exercises 4 (rounding, scaling first), 5 (fractional-part form, further rounding) and 6 (comparing rows).`,
    R`MIT 15.053 Gomory-cut slides (cited on the slides for the tableau-row arithmetic).`,
    R`Wolsey, <i>Integer Programming</i>, 2nd ed., chapters 3 and 8; Conforti, Cornuéjols and Zambelli, <i>Integer Programming</i>, chapters 5 and 9.`,
  ],
};
