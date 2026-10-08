const R = String.raw;

export default {
  id: 't206b',
  lead: R`Not all valid inequalities are equally useful. <b>Lifting</b> makes an inequality as strong as possible in a variable it ignored; <b>dominance</b> compares two inequalities; <b>facets</b> are the inequalities that cannot be improved at all, the true boundaries of the integer hull.`,
  sections: [
    {
      title: 'Lifting a cover inequality',
      html: R`
<p>Knapsack $4x_1+4x_2+4x_3+7x_4\le 10$ and the cover inequality $x_1+x_2+x_3\le 2$. Item 4 does not appear. Look for the <b>largest</b> coefficient $\alpha_4$ such that</p>
$$x_1+x_2+x_3+\alpha_4x_4\le 2$$
<p>is still valid.</p>
<ul>
<li>If $x_4=0$ the original cover inequality applies, whatever $\alpha_4$ is.</li>
<li>If $x_4=1$ only $10-7=3$ units of capacity remain. Each other item weighs 4, so $x_1+x_2+x_3=0$. The inequality reads $0+\alpha_4\le 2$: $\alpha_4=2$ is valid and tight.</li>
</ul>
$$\boxed{x_1+x_2+x_3+2x_4\le 2}\qquad\text{(lifted cover)}$$
<p><b>Effect on the bound.</b> Write $s=x_1+x_2+x_3$. The lifted cover gives $s+2x_4\le 2$, and since $x_4\ge 0$,</p>
$$6s+10x_4=6(s+2x_4)-2x_4\le 12 .$$
<p>The integer solution $(1,1,0,0)$ attains 12: the LP with this single inequality has bound 12, equal to the integer optimum. Compare: no cut 15; all four minimal covers 14.86; extended cover coefficient 1; lifted coefficient 2.</p>`,
    },
    {
      title: 'Sequential lifting in general',
      html: R`
<div class="callout"><div class="callout-title">Lifting formula</div>Let $X\subseteq\{0,1\}^n$ and suppose $\sum_jc_jx_j\le\beta$ is valid with $c_k=0$. If some $x\in X$ has $x_k=1$, set
$$\alpha_k=\beta-\max\Big\{\sum_jc_jx_j:\ x\in X,\ x_k=1\Big\}$$
and add the term $\alpha_kx_k$.</div>
<p><b>Why valid:</b> when $x_k=0$ the previous inequality applies; when $x_k=1$ the maximisation shows the other terms are at most $\beta-\alpha_k$.</p>
<p>For a knapsack, “$x\in X,\ x_k=1$” means: the remaining items must fit in the residual capacity $b-a_k$. So each lifting coefficient is found by a small knapsack: <i>how much of the current left-hand side can still be collected once item $k$ is in?</i></p>
<p><b>Sequential</b> lifting repeats this for one omitted variable at a time, using the coefficients already computed (including earlier lifted terms). The result <b>can depend on the lifting order</b>: a variable lifted early tends to get a larger coefficient.</p>`,
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
<div class="callout"><div class="callout-title">Definitions</div>For a valid inequality $\alpha^\top x\le\beta$, the set $F=\{x\in P_I:\ \alpha^\top x=\beta\}$ is a <b>face</b>. If $P_I$ is full-dimensional in $\mathbb{R}^n$, the inequality defines a <b>facet</b> when $\dim F=n-1$: a maximal-dimensional proper face.</div>
<p><b>How to compute a dimension.</b> A set of points has dimension $d$ when it contains $d+1$ <b>affinely independent</b> points and no more. So a facet in $\mathbb{R}^n$ needs $n$ affinely independent feasible points satisfying the inequality with equality. (Points $p_0,\dots,p_d$ are affinely independent when $p_1-p_0,\dots,p_d-p_0$ are linearly independent.)</p>
<p>In the example $n=4$ and $P_I$ has dimension 4 (it contains $0$ and the four unit vectors).</p>
<ul>
<li><b>Base cover</b> $x_1+x_2+x_3\le 2$: the feasible points on it are $(1,1,0,0)$, $(1,0,1,0)$, $(0,1,1,0)$ (with $x_4=1$ nothing else fits). Three affinely independent points span a face of dimension 2. Not a facet.</li>
<li><b>Lifted cover</b> $x_1+x_2+x_3+2x_4\le 2$: tight at $(1,1,0,0)$, $(1,0,1,0)$, $(0,1,1,0)$ and $(0,0,0,1)$. These four points are affinely independent, so the face has dimension 3 $=n-1$: a <b>facet</b>.</li>
</ul>
<p>Facet-defining inequalities are the ones that appear in a minimal description of the integer hull; an inequality that is not a facet is implied by others and can be strengthened.</p>`,
    },
  ],
  moves: [
    R`Lifting: write the current inequality, set $x_k=1$, compute the residual capacity, maximise the current left-hand side in that capacity, then $\alpha_k=\beta-\max$.`,
    R`State the two cases explicitly ($x_k=0$: old inequality; $x_k=1$: by the maximisation) when asked to justify validity.`,
    R`Dominance: show the implication algebraically, then give one point for strictness.`,
    R`Facet: (1) state $\dim P_I$; (2) list $n$ feasible points with equality; (3) show affine independence (subtract one point and check the differences are linearly independent).`,
  ],
  traps: [
    R`Using the full capacity $b$ instead of the residual $b-a_k$ in the lifting maximisation.`,
    R`Reporting the maximum as the coefficient. The coefficient is $\beta$ <i>minus</i> the maximum.`,
    R`In sequential lifting, forgetting that already-lifted variables now carry their coefficients in the next maximisation.`,
    R`Counting tight points that are not feasible, or counting linearly instead of affinely independent points. $n$ affinely independent points are needed for a facet in dimension $n$.`,
    R`“The lifted cover dominates all cover inequalities.” The slide's counter-example: $(1,0,0,\tfrac12)$ violates $x_1+x_4\le 1$ only.`,
    R`Assuming the extended cover (coefficient 1) is the best possible: lifting gave 2.`,
  ],
  refs: [
    R`Slides 206, <i>Problem-Specific Valid Inequalities</i> (T. Schettini): lifting item 4, sequential lifting, dominance, faces and facets.`,
    R`Wolsey, <i>Integer Programming</i>, 2nd ed., chapters 8 and 9.`,
  ],
};
