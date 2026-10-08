const R = String.raw;

export default {
  id: 't205',
  lead: R`Most models mix integer and continuous variables, and the pure-integer rounding rule is no longer valid for their rows. Mixed-integer rounding (MIR) replaces “round the right-hand side” by “split on the integer part and take the convex hull of the two cases”. One formula, $z+u/f\ge k+1$, covers everything.`,
  sections: [
    {
      title: 'A two-variable picture',
      html: R`
$$y\le 10x,\qquad 0\le y\le 14,\qquad x\in\mathbb{Z}_+,\ y\in\mathbb{R}_+ .$$
<p>The integer variable $x$ controls a continuous quantity $y$ (think: $x$ machines of capacity 10, demand cap 14). The LP relaxation has the fractional vertex $(1.4,\ 14)$, where $y=10x$ meets $y=14$.</p>
<p>The feasible set consists of vertical segments at $x=0,1,2,\dots$: $x=1\Rightarrow y\le 10$ and $x=2\Rightarrow y\le 14$. Its convex hull has the edge through $(1,10)$ and $(2,14)$, a line of slope $(14-10)/(2-1)=4$:</p>
$$\boxed{y\le 6+4x}.$$
<p>This inequality cuts off $(1.4,14)$ (it allows only $y\le 11.6$ there) and is tight at two feasible points with different integer $x$.</p>`,
    },
    {
      title: 'The same cut, algebraically',
      html: R`
<ol>
<li>Slack of the upper bound: $y+s=14$, $s\ge 0$. Substitute $y=14-s$ into $y\le 10x$: $\ 10x+s\ge 14$.</li>
<li>Divide by 10: $\ x+\dfrac{s}{10}\ge 1.4$, i.e. $x+u\ge 1.4$ with $x$ integer and $u=s/10\ge 0$ continuous.</li>
<li>Two integer cases: $x\ge 2\Rightarrow u\ge 0$ is enough; $x\le 1\Rightarrow u\ge 1.4-x$ (at $x=1$: $u\ge 0.4$).</li>
<li>The line through the closest boundary points $(1,0.4)$ and $(2,0)$ is $u\ge 0.4(2-x)$. It is valid on both branches: for $x\ge 2$ the right-hand side is $\le 0\le u$; for $x\le 1$, $u\ge 1.4-x=0.4(2-x)+0.6(1-x)\ge 0.4(2-x)$.</li>
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
      title: 'A row with “≤”: the three-variable example',
      html: R`
$$\max\ x+y-2z\quad\text{s.t.}\quad x+y-z\le 2.5,\quad 0\le x,y\le 2,\quad 0\le z\le 1,\quad x,y\in\mathbb{Z}.$$
<p>Start from the row that creates the fractional LP optimum and turn it into the basic form:</p>
$$x+y-z\le 2.5\ \Longleftrightarrow\ -x-y+z\ \ge\ -2.5=-3+0.5 .$$
<p>Integer expression $w=-x-y$, continuous $u=z\ge 0$, $k=-3$, $f=0.5$. The rule $w+u/f\ge k+1$ gives</p>
$$-x-y+2z\ge -2\ \Longleftrightarrow\ \boxed{x+y-2z\le 2}.$$
<p>The LP optimum $(2,\ 0.5,\ 0)$ is cut off and the bound falls from 2.5 to 2.</p>
<div class="callout move"><div class="callout-title">Shortcut worth knowing</div>For a row $\sum_ja_jx_j-c\,z\le b$ with integer $a_j$, integer $x$, continuous $z\ge 0$, $c\gt 0$ and fractional $b$: the MIR cut is $\ \sum_ja_jx_j-\dfrac{c}{f}\,z\le\lfloor b\rfloor$ with $f=\lceil b\rceil-b$. With no continuous variable it is plain integer rounding.</div>`,
    },
    {
      title: 'MIR inside a solver; the family of rounding cuts',
      html: R`
<p>A solver starts from a tableau row or an aggregation of constraints and then:</p>
<ol>
<li>uses bounds and substitutions to expose an integer-valued expression $z$ and a nonnegative continuous activity $u$;</li>
<li>identifies the fractional right-hand side $k+f$;</li>
<li>convexifies the split $z\le k$ or $z\ge k+1$ with the MIR coefficient rule;</li>
<li>substitutes the model variables back and tests whether the current LP solution violates the cut.</li>
</ol>
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
    R`Split the right-hand side as $k+f$ with $k=\lfloor\text{rhs}\rfloor$ and $0\lt f\lt 1$. For a negative right-hand side be careful: $-2.5=-3+0.5$.`,
    R`Apply $z+u/f\ge k+1$, then substitute the original variables back and tidy the signs.`,
    R`Check: the fractional LP point must violate the cut; one feasible point on each side of the split should satisfy it (ideally with equality).`,
  ],
  traps: [
    R`Taking $k=-2$, $f=-0.5$ for $-2.5$. The fractional part must lie in $(0,1)$: $k=-3$, $f=0.5$.`,
    R`Rounding the right-hand side of a row that contains a continuous variable ($x+y-z\le 2.5\ \not\Rightarrow\ x+y-z\le 2$: the point $(2,1,0.5)$ is feasible with left-hand side 2.5).`,
    R`Dividing the integer part by $f$ instead of the continuous part.`,
    R`Forgetting that $u$ must be nonnegative: use a slack or a bound substitution to get it.`,
    R`In the capacity picture, writing the cut through $(1,10)$ and $(1.4,14)$: the cut joins two <i>feasible</i> points with consecutive integer $x$.`,
  ],
  refs: [
    R`Slides 205, <i>Mixed-Integer Rounding Cuts</i> (T. Schettini), all 25 pages.`,
    R`Ş. İ. Birbil, cutting-plane notes, and T. Ralphs, ISE 418 lecture 14 (both cited on the slides).`,
    R`Wolsey, <i>Integer Programming</i>, 2nd ed., chapter 8.`,
  ],
};
