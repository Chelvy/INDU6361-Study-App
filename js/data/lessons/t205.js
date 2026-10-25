const R = String.raw;

export default {
  id: 't205',
  lead: R`Most models mix integer and continuous variables, and the pure-integer rounding rule is no longer valid for their rows. Mixed-integer rounding (MIR) replaces “round the right-hand side” by “split on the integer part and take the convex hull of the two cases”. One formula, $z+u/f\ge k+1$, covers everything.`,
  sections: [
    {
      title: 'A two-variable picture',
      html: R`
$$y\le 10x,\qquad 0\le y\le 14,\qquad x\in\mathbb{Z}_+,\ y\in\mathbb{R}_+ .$$
<p>The integer variable $x$ controls a continuous quantity $y$: the upper bound on $y$ changes at the integer values of $x$. (The app's illustration: $x$ machines of capacity 10, demand capped at 14.) The LP relaxation has the fractional vertex $(1.4,\ 14)$, where $y=10x$ meets $y=14$.</p>
<p>The feasible set consists of vertical segments at $x=0,1,2,\dots$: $x=1\Rightarrow y\le 10$ and $x=2\Rightarrow y\le 14$. The line through $(1,10)$ and $(2,14)$ has slope $(14-10)/(2-1)=4$ and gives the cut</p>
$$\boxed{y\le 6+4x}.$$
<p>This inequality cuts off $(1.4,14)$ (it allows only $y\le 11.6$ there) and is tight at two feasible points with different integer $x$. The segment between them is an edge of the convex hull of the feasible set.</p>`,
    },
    {
      title: 'The same cut, algebraically',
      html: R`
<ol>
<li>Slack of the upper bound: $y+s=14$, $s\ge 0$. Substitute $y=14-s$ into $y\le 10x$: $\ 10x+s\ge 14$.</li>
<li>Divide by 10: $\ x+\dfrac{s}{10}\ge 1.4$, i.e. $x+u\ge 1.4$ with $x$ integer and $u=s/10\ge 0$ continuous.</li>
<li>Two integer cases: $x\ge 2\Rightarrow u\ge 0$ is enough; $x\le 1\Rightarrow u\ge 1.4-x$ (at $x=1$: $u\ge 0.4$).</li>
<li>The line through the closest boundary points $(1,0.4)$ and $(2,0)$ is $u\ge 0.4(2-x)$. It is valid on both branches: for $x\ge 2$ the right-hand side is $\le 0\le u$; for $x\le 1$, $u\ge 1.4-x=0.4(2-x)+0.6(1-x)\ge 0.4(2-x)$. It is tight along the segment joining $(1,0.4)$ and $(2,0)$, and this segment is part of the boundary of the convex hull of the two branches: an edge of the convex hull.</li>
<li>Replace $u=s/10$: $\ x+\dfrac{s}{4}\ge 2$. Replace $s=14-y$: $\ y\le 6+4x$.</li>
</ol>`,
    },
    {
      title: 'The basic MIR inequality',
      html: R`
<div class="callout"><div class="callout-title">MIR rule</div>If
$$z+u\ \ge\ k+f,\qquad z\in\mathbb{Z},\quad u\ge 0,\quad k\in\mathbb{Z},\quad 0\lt f\lt 1,$$
then
$$z+\frac{u}{f}\ \ge\ k+1 .$$
$z$ and $u$ may each be expressions in several model variables.</div>
<p><b>Proof (the split).</b> No integer lies strictly between $k$ and $k+1$, so every feasible point has $z\le k$ or $z\ge k+1$.</p>
<ul>
<li>If $z\ge k+1$: since $u\ge 0$, $z+u/f\ge k+1$.</li>
<li>If $z\le k$: the row gives $u\ge k+f-z=f(k+1-z)+(1-f)(k-z)\ge f(k+1-z)$, because $k-z\ge 0$. Divide by $f$: $z+u/f\ge k+1$.</li>
</ul>
<p>The two branches are in general whole polyhedra, not two points; the inequality is valid for both, hence for their convex hull.</p>
<p><b>The example in these terms:</b> $x+\dfrac{s}{10}\ge 1.4=1+0.4$ has $z=x$, $u=s/10$, $k=1$, $f=0.4$, and the rule gives $x+\dfrac{s}{4}\ge 2$.</p>`,
    },
    {
      title: 'A row with “≤”: the three-variable example, two versions',
      html: R`
<p><b>PDF version of slides 205.</b></p>
$$\max\ x+y-2z\quad\text{s.t.}\quad x+y-z\le 2.5,\quad 0\le x,y\le 2,\quad 0\le z\le 1,\quad x,y\in\mathbb{Z}.$$
<p>Start from the row that creates the fractional LP optimum and turn it into the basic form:</p>
$$x+y-z\le 2.5\ \Longleftrightarrow\ -x-y+z\ \ge\ -2.5=-3+0.5 .$$
<p>Integer expression $w=-x-y$, continuous $u=z\ge 0$, $k=-3$, $f=0.5$. The rule $w+u/f\ge k+1$ gives</p>
$$-x-y+2z\ge -2\ \Longleftrightarrow\ \boxed{x+y-2z\le 2}.$$
<p>An LP optimum, $(2,\ 0.5,\ 0)$, is cut off and the bound falls from 2.5 to 2.</p>
<p><b>Reading version of slides 205: use the upper bound.</b></p>
$$\min\ -x-y-2z\quad\text{s.t.}\quad x+y+z\le 3.5,\quad 0\le x,y\le 2,\quad 0\le z\le 1,\quad x,y\in\mathbb{Z}.$$
<p>Here $z$ has a <b>plus</b> sign in a “$\le$” row. Multiplying by $-1$ gives $-z$, which is never positive, so it cannot be the nonnegative part $u$. Use the bound $z\le1$ instead: the <b>complement</b> $u=1-z$ is $\ge0$ (it measures how far $z$ is below its bound). Adding 1 to both sides of $-x-y-z\ge-3.5$:</p>
$$x+y+z\le 3.5\ \Longleftrightarrow\ -x-y+(1-z)\ \ge\ -2.5=-3+0.5 .$$
<p>So $w=-x-y$, $u=1-z$, $k=-3$, $f=0.5$. The rule gives $-x-y+2(1-z)\ge-2$, that is $\boxed{x+y+2z\le 4}$. The LP optimum named on the slides, $(2,\ 0.5,\ 1)$, has left side $4.5\gt4$, so it is cut off, and the minimisation <b>lower</b> bound rises from $-4.5$ to $-4$.</p>
<p>(Beyond the slides: the two versions are equivalent. Replacing $z$ by $1-z$ turns one into the other; the objective becomes $-(x+y-2z)-2$, and the cuts, points and bounds correspond.)</p>
<div class="callout move"><div class="callout-title">Shortcut (derived in this app, not on the slides)</div>For a row $\sum_ja_jx_j-c\,z\le b$ with integer $a_j$, integer $x$, continuous $z\ge 0$, $c\gt 0$ and fractional $b$: the MIR cut is $\ \sum_ja_jx_j-\dfrac{c}{f}\,z\le\lfloor b\rfloor$ with $f=\lceil b\rceil-b$. Here $f$ is the fractional part of $-b$ (the right side after multiplying by $-1$), <b>not</b> of $b$: for $b=2.3$, $-2.3=-3+0.7$, so $f=0.7$. Some other sources write $f_0=b-\lfloor b\rfloor$ for the “$\le$” row and divide by $1-f_0$; that $1-f_0$ is the slides' $f$. With no continuous variable it is plain integer rounding. For a plus sign on $z$, first complement it as above.</div>`,
    },
    {
      title: 'Worked references: 20E Exercises 7 and 8',
      html: R`
<p><b>Exercise 7 (one integer variable).</b> $\max\ y$ s.t. $y\le 4x$, $y\le 10$, $0\le x\le 3$, $y\ge0$, $x\in\mathbb Z$. The LP has the fractional corner $(2.5,\ 10)$.</p>
<ol>
<li>The bound $y\le10$ gives the slack $s=10-y\ge0$. Substitute into $y\le4x$: $10-s\le 4x$, so $4x+s\ge 10$; divide by 4: $x+\dfrac s4\ge\dfrac52=2+\dfrac12$.</li>
<li>$z=x$, $u=s/4$, $k=2$, $f=\tfrac12$. MIR: $x+\dfrac{s/4}{1/2}\ge 3$, that is $x+\dfrac s2\ge 3$.</li>
<li>Check both sides of the split. If $x\le2$: the row gives $s\ge10-4x$, so $x+s/2\ge 5-x\ge 3$. If $x\ge3$: $x+s/2\ge3$ because $s\ge0$.</li>
<li>Substitute $s=10-y$: $\boxed{y\le 4+2x}$. The line joins $(2,8)$ and $(3,10)$; at $(2.5,10)$ it would need $10\le 9$, so the corner is cut off.</li>
</ol>
<p><b>Exercise 8 (complement with an upper bound).</b> $\max\ x_1+x_2+2y$ s.t. $x_1+x_2+y\le 4.4$, $0\le x_1,x_2\le2$, $0\le y\le1$, $x_1,x_2\in\mathbb Z$, $y$ continuous. The point $(2,\ 1.4,\ 1)$ is feasible for the LP relaxation (the row holds at equality, $2+1.4+1=4.4$), but $x_2$ is fractional.</p>
<ol>
<li>As in the reading version above: $w=-x_1-x_2$ and $u=1-y\ge0$. The row becomes $w+u\ge -3.4=-4+0.6$ (the floor of $-3.4$ is $-4$), so $k=-4$, $f=0.6$.</li>
<li>MIR: $w+u/0.6\ge -3$, that is $-x_1-x_2+\dfrac{1-y}{0.6}\ge -3$. Multiply by 3 (and $3/0.6=5$): $-3x_1-3x_2+5(1-y)\ge -9$, so $\boxed{3x_1+3x_2+5y\le 14}$.</li>
<li>At $(2,1.4,1)$ the left side is $6+4.2+5=15.2\gt14$: cut off.</li>
<li>Check by the split on $r=x_1+x_2$. If $r\le3$: $3r+5y\le 9+5=14$ (using $y\le1$). If $r\ge4$: the row and $y\ge0$ force $r=4$ and $y\le0.4$, so $3r+5y\le 12+2=14$.</li>
</ol>
<p><a href="#/exercises/20e/7">Open 20E Exercise 7</a> · <a href="#/exercises/20e/8">Open 20E Exercise 8</a>.</p>`,
    },
    {
      title: 'MIR inside a solver; the family of rounding cuts',
      html: R`
<p>A solver starts from a tableau row or an aggregation of constraints and then:</p>
<ol>
<li>uses bounds and substitutions to write an integer expression $z$ and a nonnegative continuous expression $u$;</li>
<li>identifies the fractional right-hand side $k+f$;</li>
<li>convexifies the split $z\le k$ or $z\ge k+1$ with the MIR coefficient rule;</li>
<li>substitutes the model variables back and tests whether the current LP solution violates the cut.</li>
</ol>
<p>The cut joins the two branches, as in the two-dimensional example.</p>
<table class="data-table left">
<thead><tr><th>Method</th><th>Variables in the row</th><th>Construction</th></tr></thead>
<tbody>
<tr><td>Gomory fractional</td><td>all integer</td><td>round a fractional tableau row</td></tr>
<tr><td>MIR</td><td>integer and continuous</td><td>transform a suitable mixed-integer row</td></tr>
<tr><td>Gomory mixed-integer</td><td>integer basic variable; mixed nonbasic variables</td><td>apply mixed-integer rules to a tableau row</td></tr>
</tbody></table>
<p>The pure-integer rounding rule <b>does not remain valid</b> when a row contains continuous variables. In a log, “MIR: 17” counts the MIR cuts retained in the final relaxation.</p>`,
    },
  ],
  moves: [
    R`Write the row in the form (integer expression) + (nonnegative continuous expression) $\ge$ (number). For a “$\le$” row multiply by $-1$ first.`,
    R`Get the nonnegative part from a slack ($s=14-y$, $s=10-y$) or, when the continuous variable has a plus sign in a “$\le$” row, from its upper bound ($u=1-z$, $u=1-y$).`,
    R`Split the right-hand side as $k+f$ with $k=\lfloor\text{rhs}\rfloor$ and $0\lt f\lt 1$. For a negative right-hand side be careful: $-2.5=-3+0.5$, $-3.4=-4+0.6$.`,
    R`Apply $z+u/f\ge k+1$, then substitute the original variables back, clear fractions and tidy the signs.`,
    R`Check: prove validity on both sides of the split (as 20E Exercises 7 and 8 do), and show that the fractional LP point violates the cut.`,
  ],
  traps: [
    R`Taking $k=-2$, $f=-0.5$ for $-2.5$. The fractional part must lie in $(0,1)$: $k=-3$, $f=0.5$.`,
    R`Rounding the right-hand side of a row that contains a continuous variable ($x+y-z\le 2.5\ \not\Rightarrow\ x+y-z\le 2$: the point $(2,1,0.5)$ is feasible with left-hand side 2.5).`,
    R`Dividing the integer part by $f$ instead of the continuous part.`,
    R`Forgetting that $u$ must be nonnegative. With $x+y+z\le3.5$ the part $-z$ is not; use the complement $u=1-z$.`,
    R`In the shortcut, taking $f$ as the fractional part of $b$: for $b=2.3$ it is $0.7$, not $0.3$.`,
    R`In the capacity picture, writing the cut through $(1,10)$ and $(1.4,14)$: the cut joins two <i>feasible</i> points with consecutive integer $x$.`,
  ],
  refs: [
    R`Slides 205, <i>Mixed-Integer Rounding Cuts</i> (T. Schettini), all 25 pages; the HTML reading version (October 2026) replaces the three-variable example by the version with $u=1-z$ shown above.`,
    R`Sheet 20E, Exercises 7 (MIR with a slack) and 8 (MIR with a complemented continuous variable).`,
    R`Ş. İ. Birbil, cutting-plane notes; T. Ralphs, ISE 418 lecture 14; Gurobi, “MIP logging” (all cited on the slides).`,
    R`Wolsey, <i>Integer Programming</i>, 2nd ed., chapter 8.`,
  ],
};
