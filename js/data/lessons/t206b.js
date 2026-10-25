const R = String.raw;

export default {
  id: 't206b',
  lead: R`Not all valid inequalities are equally useful. <b>Lifting</b> makes an inequality as strong as possible in a variable it ignored; <b>dominance</b> compares two inequalities; <b>facets</b> are the inequalities that cannot be improved at all, the true boundaries of the integer hull.`,
  sections: [
    {
      title: 'Lifting a cover inequality',
      html: R`
<p>The slides define <b>lifting</b> as giving coefficients to variables that were <b>fixed or omitted</b> when the inequality was derived; each coefficient comes from the feasible choices in which that variable is used. In the lecture the variable is omitted. (Beyond the slides: a variable that was held at 0 or 1 is lifted with the same idea, a maximisation over the other choices. Two external bank questions practise this: one lifts a variable held at 0, the other (“down-lifting”) a variable held at 1.)</p>
<p>Knapsack $4x_1+4x_2+4x_3+7x_4\le 10$ and the cover inequality $x_1+x_2+x_3\le 2$. Item 4 does not appear. Look for the <b>largest</b> coefficient $\alpha_4$ such that</p>
$$x_1+x_2+x_3+\alpha_4x_4\le 2$$
<p>is still valid.</p>
<ul>
<li>If $x_4=0$ the original cover inequality applies, whatever $\alpha_4$ is.</li>
<li>If $x_4=1$ only $10-7=3$ units of capacity remain. Each other item weighs 4, so $x_1+x_2+x_3=0$. The inequality reads $0+\alpha_4\le 2$: $\alpha_4=2$ is valid and tight.</li>
</ul>
$$\boxed{x_1+x_2+x_3+2x_4\le 2}\qquad\text{(lifted cover)}$$
<p><b>Why not larger?</b> The feasible point $(0,0,0,1)$ turns the inequality into $\alpha_4\le 2$. One feasible point is enough to show that 2 is the largest valid coefficient.</p>
<p><b>Effect on the bound.</b> Write $s=x_1+x_2+x_3$. The lifted cover gives $s+2x_4\le 2$, and since $x_4\ge 0$,</p>
$$6s+10x_4=6(s+2x_4)-2x_4\le 12 .$$
<p>The integer solution $(1,1,0,0)$ attains 12: the LP with this single inequality has bound 12, equal to the integer optimum. Added after the covers and the extended cover, it lowers the root bound from 14 to 12 (the full table of root bounds is in the cliques-and-covers lesson). The extended cover gives $x_4$ the coefficient 1; lifting gives 2.</p>
<div class="callout"><div class="callout-title">Worked example: 20E, Exercise 11</div>Knapsack $5x_1+6x_2+7x_3+13x_4\le17$. Start from the extension $x_1+x_2+x_3+x_4\le2$ and find the largest valid $\alpha$ in $x_1+x_2+x_3+\alpha x_4\le2$.
<ol>
<li>Set $x_4=1$. The residual capacity is $17-13=4$.</li>
<li>Every other item weighs at least 5, so $\max\{x_1+x_2+x_3:\ 5x_1+6x_2+7x_3\le4\}=0$.</li>
<li>Lifting formula: $\alpha=2-0=2$, so $\boxed{x_1+x_2+x_3+2x_4\le2}$.</li>
<li>Validity by cases: if $x_4=0$ the base cover applies; if $x_4=1$ the other items are all 0.</li>
<li>Maximality: the feasible point $(0,0,0,1)$ forces $\alpha\le2$.</li>
</ol>
<a href="#/exercises/20e/11">Open the exercise</a>.</div>`,
    },
    {
      title: 'Sequential lifting in general',
      html: R`
<div class="callout"><div class="callout-title">Lifting formula</div>Let $X\subseteq\{0,1\}^n$ and suppose $\sum_jc_jx_j\le\beta$ is valid with $c_k=0$. If some $x\in X$ has $x_k=1$, set
$$\alpha_k=\beta-\max\Big\{\sum_jc_jx_j:\ x\in X,\ x_k=1\Big\}$$
and add the term $\alpha_kx_k$.</div>
<p><b>Why valid:</b> when $x_k=0$ the previous inequality applies; when $x_k=1$ the maximisation shows the other terms are at most $\beta-\alpha_k$.</p>
<p>For a knapsack, “$x\in X,\ x_k=1$” means: the remaining items must fit in the residual capacity $b-a_k$. So each lifting coefficient is found by a small knapsack: <i>how much of the current left-hand side can still be collected once item $k$ is in?</i></p>
<p><b>Sequential</b> lifting repeats this for one omitted variable at a time, using the coefficients already computed (including earlier lifted terms). The result <b>can depend on the lifting order</b>. (Beyond the slides: a variable lifted earlier never gets a smaller coefficient than it would get later, because later maximisations include more terms with nonnegative coefficients, so their maximum can only be larger.)</p>`,
    },
    {
      title: 'Dominance',
      html: R`
<div class="callout"><div class="callout-title">Definition</div>Within a relaxation $R$, inequality $A$ <b>dominates</b> inequality $B$ when $R\cap A\subseteq R\cap B$, and <b>strictly</b> dominates it when $R\cap A\subsetneq R\cap B$: some point of $R$ satisfies $B$ but violates $A$.</div>
<ul>
<li>The lifted cover dominates the base cover: since $x_4\ge 0$, $x_1+x_2+x_3+2x_4\le 2$ implies $x_1+x_2+x_3\le 2$.</li>
<li><b>Strictly:</b> $\bar x=(0.75,0,0,1)$ uses the full capacity ($4\cdot0.75+7=10$), satisfies the base cover ($0.75\le 2$) and violates the lifted cover ($0.75+2=2.75\gt 2$).</li>
<li><b>But not everything:</b> $\bar x=(1,0,0,\tfrac12)$ satisfies the knapsack ($7.5\le 10$) and the lifted cover ($1+1=2$), yet the cover inequality $x_1+x_4\le 1$ excludes it ($1.5\gt 1$). The lifted cover dominates the base cover $\{1,2,3\}$ but does <b>not</b> dominate the cover $\{1,4\}$.</li>
</ul>
<p>Dominance is always relative to the relaxation $R$ in which the comparison is made (here: the knapsack row and the bounds).</p>`,
    },
    {
      title: 'Faces and facets',
      html: R`
<p>Let $P_I=\operatorname{conv}(X)$. An <b>ideal</b> formulation describes $P_I$ exactly; valid inequalities tighten the relaxation towards it.</p>
<div class="callout"><div class="callout-title">Definitions</div>For a valid inequality $\alpha^\top x\le\beta$, the set $F=\{x\in P_I:\ \alpha^\top x=\beta\}$ is a <b>face</b>. If $P_I$ is full-dimensional in $\mathbb{R}^n$, the inequality defines a <b>facet</b> when $\dim F=n-1$: a maximal-dimensional proper face. In two dimensions facets are edges; in three dimensions they are flat faces.</div>
<p><b>How to compute a dimension.</b> A set of points has dimension $d$ when it contains $d+1$ <b>affinely independent</b> points and no more. So a facet in $\mathbb{R}^n$ needs $n$ affinely independent feasible points satisfying the inequality with equality. (Points $p_0,\dots,p_d$ are affinely independent when $p_1-p_0,\dots,p_d-p_0$ are linearly independent.) If these words are rusty, read the <a href="#/learn/t003">geometry refresher</a> first.</p>
<h3>In the plane: the workshop</h3>
<p>The workshop's integer hull is the polygon with corners $(0,0)$, $(3,0)$, $(3,3)$, $(2,4)$, $(1,4)$, $(0,3)$. It is described by $0\le x\le3$, $y\ge0$, $y-x\le3$, $x+y\le6$ and $y\le4$.</p>
<ul>
<li>$y\le4$ holds with equality at the integer points $(1,4)$ and $(2,4)$. Its face is the segment joining them: dimension <b>1</b>.</li>
<li>The hull has dimension <b>2</b>: it contains $(0,0)$, $(3,0)$, $(0,3)$, which are not on one line.</li>
<li>Since $1=2-1$, $y\le4$ defines a facet.</li>
</ul>
<h3>In four dimensions: the lecture knapsack</h3>
<p>Here $n=4$ and $P_I$ has dimension 4 (it contains $0$ and the four unit vectors).</p>
<ul>
<li><b>Base cover</b> $x_1+x_2+x_3\le 2$: the feasible points on it are $(1,1,0,0)$, $(1,0,1,0)$, $(0,1,1,0)$ (with $x_4=1$ nothing else fits). Three affinely independent points span a face of dimension 2. Not a facet.</li>
<li><b>Lifted cover</b> $x_1+x_2+x_3+2x_4\le 2$: tight at $(1,1,0,0)$, $(1,0,1,0)$, $(0,1,1,0)$ and $(0,0,0,1)$. These four points are affinely independent, so the face has dimension 3 $=n-1$: a <b>facet</b>.</li>
</ul>
<p><b>Check yourself</b> (derived with the slides' definitions; not on the slides). The extended cover $x_1+x_2+x_3+x_4\le2$ is tight at the same three points as the base cover: with $x_4=1$ no other item fits, so its left-hand side is only 1. It is not a facet either; the coefficient 2 is needed. The cover $x_1+x_4\le1$, on the other hand, <i>is</i> a facet: it is tight at $(1,0,0,0)$, $(1,1,0,0)$, $(1,0,1,0)$, $(0,0,0,1)$, four affinely independent points. This is consistent with the dominance slide, where $(1,0,0,\tfrac12)$ satisfies the lifted cover but violates $x_1+x_4\le1$.</p>
<p>(Beyond the slides.) For a full-dimensional integer hull, the facet-defining inequalities are exactly the ones a smallest description of the hull needs; a valid inequality that is not a facet is implied by the facet-defining ones.</p>`,
    },
    {
      title: 'Facets before and after a cut (20E, Exercise 12)',
      html: R`
<p>The pentagon $P$ has corners $(0,0)$, $(2,0)$, $(2,1)$, $(1,2)$, $(0,2)$, and $P=\{x\ge0,\ y\ge0,\ x\le2,\ y\le2,\ x+y\le3\}$.</p>
<ol>
<li><b>Dimension of $P$.</b> $(0,0)$, $(2,0)$, $(0,2)$ lie in $P$ and are not on one line, so $\dim P=2$. A facet must have dimension $2-1=1$: an edge.</li>
<li><b>Facets of $P$.</b> Each of the five rows is valid and holds with equality at two different corners: $x=0$ at $(0,0),(0,2)$; $y=0$ at $(0,0),(2,0)$; $x=2$ at $(2,0),(2,1)$; $y=2$ at $(0,2),(1,2)$; $x+y=3$ at $(2,1),(1,2)$. Two different points span a segment of dimension 1. All five are facets.</li>
<li><b>Add $2x+y\le4.5$ and keep only the integer points.</b> Only $(2,1)$ is removed: $2\cdot2+1=5\gt4.5$. For integer $x,y$ the left-hand side is an integer, so the row means $2x+y\le4$ (round the right-hand side down).</li>
<li><b>The integer hull of what is left.</b> $Q=\operatorname{conv}\{(0,0),(2,0),(1,2),(0,2)\}=\{x\ge0,\ y\ge0,\ y\le2,\ 2x+y\le4\}$. It still has dimension 2.</li>
<li><b>Which rows are facets of $Q$?</b> $x\ge0$, $y\ge0$ and $y\le2$ stay facets: each is still tight at two corners. The new edge $2x+y\le4$, tight at $(2,0)$ and $(1,2)$, is a facet too. But $x\le2$ now touches $Q$ only at $(2,0)$, and $x+y\le3$ only at $(1,2)$. A single point has dimension 0, so these two rows are still valid but no longer facets.</li>
<li><b>The added row itself.</b> Every point of $Q$ satisfies $2x+y\le4$, so $2x+y\le4.5$ is <b>never tight</b> on $Q$: its face is empty. It cuts $(2,1)$ off $P$, but it does not define a facet of the integer hull. Its rounded version $2x+y\le4$ does.</li>
</ol>
<p>(Beyond the slides, computed here.) For the <i>LP</i> polygon $P\cap\{2x+y\le4.5\}$, with corners $(0,0)$, $(2,0)$, $(2,\tfrac12)$, $(\tfrac32,\tfrac32)$, $(1,2)$, $(0,2)$, the added row <i>is</i> an edge, from $(\tfrac32,\tfrac32)$ to $(2,\tfrac12)$. Being a facet depends on which set you look at; the exercise asks about the integer hull.</p>
<p><a href="#/exercises/20e/12">Open the exercise</a>.</p>`,
    },
  ],
  moves: [
    R`Lifting: write the current inequality, set $x_k=1$, compute the residual capacity, maximise the current left-hand side in that capacity, then $\alpha_k=\beta-\max$.`,
    R`State the two cases explicitly ($x_k=0$: old inequality; $x_k=1$: by the maximisation) when asked to justify validity.`,
    R`Show the coefficient is the largest possible with one feasible point that has $x_k=1$ and makes the inequality tight (here $(0,0,0,1)$).`,
    R`Dominance: show the implication algebraically, then give one point for strictness.`,
    R`Facet: (1) state $\dim P_I$; (2) list $n$ feasible points with equality; (3) show affine independence (subtract one point and check the differences are linearly independent).`,
    R`Facet in the plane: name three points of the polygon that are not on one line (dimension 2), then two different points of the polygon where the row is tight (dimension 1).`,
    R`Before calling a valid row a facet, list its tight points: none (never tight), a single corner (dimension 0) or a whole edge.`,
  ],
  traps: [
    R`Using the full capacity $b$ instead of the residual $b-a_k$ in the lifting maximisation.`,
    R`Reporting the maximum as the coefficient. The coefficient is $\beta$ <i>minus</i> the maximum.`,
    R`In sequential lifting, forgetting that already-lifted variables now carry their coefficients in the next maximisation.`,
    R`Counting tight points that are not feasible, or counting linearly instead of affinely independent points. $n$ affinely independent points are needed for a facet in dimension $n$.`,
    R`“The lifted cover dominates all cover inequalities.” The slide's counter-example: $(1,0,0,\tfrac12)$ violates $x_1+x_4\le 1$ only.`,
    R`Assuming the extended cover (coefficient 1) is the best possible: lifting gave 2, and only the lifted cover is a facet.`,
    R`Thinking a valid inequality must touch the integer hull. $2x+y\le4.5$ is valid for $Q$ but never tight; its rounded version $2x+y\le4$ is the facet.`,
    R`Assuming a facet stays a facet after a cut. $x\le2$ was a facet of the pentagon but touches $Q$ only at $(2,0)$.`,
  ],
  refs: [
    R`Slides 206, <i>Problem-Specific Valid Inequalities</i> (T. Schettini): lifting item 4, sequential lifting, dominance, faces and facets (PDF pp. 35–51; reading version “Integer hull: workshop” and “A workshop facet”).`,
    R`Sheet 20E, solved exercises 11 (lifting from the extension) and 12 (facets of a pentagon and of the integer hull after a cut).`,
    R`Wolsey, <i>Integer Programming</i>, 2nd ed., chapters 8 and 9. For the geometry words, see the refresher lesson “Geometry refresher: convex hulls, dimension and faces”.`,
  ],
};
