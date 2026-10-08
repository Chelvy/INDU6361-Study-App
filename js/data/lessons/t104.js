const R = String.raw;

export default {
  id: 't104',
  lead: R`The same set of integer solutions can be described by many correct formulations, and their LP relaxations can differ enormously. This lecture explains how to compare formulations, how to model fixed charges and either/or logic with binary variables, why the big-M constant must be as small as possible, and when extra variables give a better model.`,
  sections: [
    {
      title: 'Correct formulations and their strength',
      html: R`
<p>A formulation is <b>correct</b> if its feasible solutions represent exactly the intended decisions and their objective values, with all variable domains enforced. Different continuous regions can contain exactly the same integer points, so correctness says nothing about the quality of the relaxation.</p>
<p>Suppose two correct formulations use the <b>same variables</b> and have continuous relaxations $R_A$ and $R_B$.</p>
<div class="callout"><div class="callout-title">Definition</div>Formulation $A$ is <b>at least as strong</b> as $B$ when $R_A\subseteq R_B$; the dominance is strict when $R_A\subsetneq R_B$. For a maximisation, the stronger formulation gives an upper bound no larger than the weaker one <b>for every linear objective</b>.</div>
<h3>The root gap</h3>
<p>For a fixed instance with root-relaxation value $z_R$ and integer optimum $z^*$:</p>
$$g_{root}=\frac{|z_R-z^*|}{\max\{1,|z^*|\}} .$$
<p>On the workshop example ($z^*=42$):</p>
<table class="data-table">
<thead><tr><th>Formulation</th><th>Root UB</th><th>Root gap</th><th>Nodes in the lecture's trace</th></tr></thead>
<tbody>
<tr><td>Natural relaxation</td><td>51.3</td><td>22.1%</td><td>9</td></tr>
<tr><td>Add $x+y\le 6$</td><td>49.65</td><td>18.2%</td><td>5</td></tr>
<tr><td>Add $y\le x+3$</td><td>48.15</td><td>14.6%</td><td>5</td></tr>
<tr><td>Integer hull</td><td>42</td><td>0%</td><td>1</td></tr>
</tbody></table>
<p>Adding $x+y\le 6$ keeps every feasible integer point but lowers the root bound from 51.3 to 49.65; the tree then has the root, $x\le 1$ (48) and $x\ge 2$ (integer, 42), and under $x\le 1$ the children $y\le 4$ (41) and $y\ge 5$ (infeasible). The root gap measures strength for one instance and one objective; a smaller gap does not guarantee a shorter solution time.</p>`,
      widget: 'strength',
    },
    {
      title: 'The integer hull',
      html: R`
<p>The <b>integer hull</b> of an integer feasible set $X_I$ is $P_I=\operatorname{conv}(X_I)$: the smallest convex set containing all feasible integer points. It is the strongest possible convex (hence linear) relaxation in the original variables.</p>
<ul>
<li>When it is nonempty and bounded, a linear objective attains its optimum at an extreme point, and all extreme points are integer feasible: solving the LP over $P_I$ solves the integer program.</li>
<li>An optimal <i>face</i> may still contain fractional points; choosing an optimal <i>extreme point</i> gives an integer decision.</li>
<li>The catch: $P_I$ may need <b>exponentially many</b> inequalities, and finding them can be as hard as solving the integer problem.</li>
</ul>
<p>For the workshop the hull is described by $x\le 3$, $x+y\le 6$, $y\le x+3$ and $y\le 4$ (slides 206 derive the last three by rounding).</p>`,
    },
    {
      title: 'Natural and extended formulations',
      html: R`
<p>A <b>natural</b> formulation uses variables that directly represent the original decisions (quantities to make, facilities to open, edges of a tour). It is interpretable, but may be large or hard to solve.</p>
<p>An <b>extended</b> formulation adds auxiliary variables $w$ to the original $x$:</p>
$$Q=\{(x,w):\ Ax+Bw\le b,\ (x,w)_I\in\mathbb{Z}^{|I|}\},$$
<p>and dropping integrality gives the polyhedron $Q_{LP}$. Auxiliary variables are used when</p>
<ol>
<li>nonconvex logic cannot be expressed by continuous linear constraints in the natural variables, or</li>
<li>the natural-variable description needs exponentially many inequalities.</li>
</ol>`,
    },
    {
      title: 'Fixed charges',
      html: R`
<p>An order of $q\gt 0$ units at unit price $c$ with a delivery fee $F\gt 0$ costs $cq+F$; nothing is paid when nothing is ordered. The cost jumps at zero, so it is not linear in $q$.</p>
<p>Add a binary $y$ that records activation, and put $Fy$ in the objective. With unit revenue $p$, unit cost $c$ and capacity $U$, the two operating modes are $(y,q)=(0,0)$ or $y=1,\ 0\le q\le U$:</p>
$$\max\ (p-c)q-Fy\qquad\text{s.t.}\qquad 0\le q\le Uy,\quad y\in\{0,1\}.$$
<ul>
<li>$q\le Uy$ is a <b>linking constraint</b>: positive production forces $y=1$.</li>
<li>At $q=0$ either value of $y$ is feasible; the positive fixed cost makes $y=0$ optimal.</li>
<li>Since $(y,q)=(1,U)$ must stay feasible, $U$ is the <b>smallest valid big-M</b> coefficient.</li>
<li>With $q\le U$ kept, any $q\le My$ with $M\ge U$ gives the same binary-feasible decisions, but a larger $M$ allows <b>smaller fractional $y$</b> in the LP: for $q\le\alpha Uy$ the relaxation needs only $y\ge q/(\alpha U)$.</li>
</ul>`,
    },
    {
      title: 'Disjunctions and implications',
      html: R`
<p><b>Exclusive production.</b> A shift makes either product 1 or product 2:</p>
$$\max\ 4x_1+3x_2\qquad\text{s.t.}\qquad 0\le x_1\le 6,\quad 0\le x_2\le 5,\quad x_1=0\ \text{or}\ x_2=0 .$$
<p>The feasible set is the union of two segments on the axes. It is <b>not convex</b>: $(6,0)$ and $(0,5)$ are feasible but their midpoint $(3,2.5)$ is not. No set of linear constraints in $(x_1,x_2)$ alone can describe it. A binary $z$ selects the mode:</p>
$$0\le x_1\le 6z,\qquad 0\le x_2\le 5(1-z),\qquad z\in\{0,1\}.$$
<p><b>Implications.</b> For a binary $z$,</p>
$$z=1\ \Longrightarrow\ a^\top x\le b\qquad\text{is modelled by}\qquad a^\top x\le b+M(1-z),$$
<p>provided $M$ bounds the largest possible violation when $z=0$. At $z=1$ the constraint is the original one; at $z=0$ the added $M$ switches it off.</p>
<ul>
<li>Fixed cost as an implication: $q\gt 0\Rightarrow y=1$, equivalently $y=0\Rightarrow q=0$; with $0\le q\le U$ the constraint $q\le Uy$ enforces it.</li>
<li>Either/or with one binary: $a_1^\top x\le b_1+M_1z$ and $a_2^\top x\le b_2+M_2(1-z)$. With $z=0$ the first constraint holds, with $z=1$ the second.</li>
</ul>
<h3>The value of M</h3>
<p>Let $X_0$ contain the decisions permitted when $z=0$. The smallest valid coefficient is</p>
$$M^*=\max\Big\{0,\ \max_{x\in X_0}\,(a^\top x-b)\Big\}.$$
<p>Any $M\ge M^*$ keeps the same feasible solutions; increasing $M$ enlarges the relaxation unless other constraints already exclude the added points. In the exclusive-production example mode 1 contains $(x_1,z)=(6,1)$, so $M_1\ge 6$; mode 2 contains $(x_2,z)=(5,0)$, so $M_2\ge 5$.</p>
<div class="callout warn"><div class="callout-title">Big-M in practice</div>
<ul>
<li>Use the smallest valid coefficient for each constraint. Larger values weaken the bound and cause numerical difficulties.</li>
<li>Big-M relaxations are often weak because fractional binaries allow incompatible decisions at the same time.</li>
<li>With several interacting resource constraints, even the smallest valid constant can give a weak relaxation.</li>
<li>If no useful finite bound is available, reconsider the formulation: an arbitrarily large constant does not solve the problem.</li>
</ul></div>`,
    },
    {
      title: 'When the smallest M is still loose: the production mix',
      html: R`
$$\max\ 5q+3t-6y\qquad\text{s.t.}\qquad q+t\le 6,\quad q+2t\le 8,\quad q\le My,\quad q,t\ge 0,\ y\in\{0,1\}.$$
<p>Production can reach $(q,t)=(6,0)$ with set-up, so the smallest valid constant is $M=6$.</p>
<ol>
<li>With $M=6$ the LP admits $(q,t,y)=(2,3,\tfrac13)$: both resource constraints hold and $q=6y$. The LP pays one third of the set-up cost.</li>
<li>Yet every solution with binary $y$ satisfies $$q+t\le 4+2y.$$ If $y=0$ then $q=0$ and $t\le 4$ (from $2t\le 8$); if $y=1$ it is the resource constraint $q+t\le 6$. An inequality satisfied by all feasible solutions is satisfied by all their convex combinations.</li>
<li>The fractional point violates it: $5\gt 4+\tfrac23$. So the relaxation with $M=6$ extends beyond the mixed-integer convex hull.</li>
</ol>
<p>For a fixed $t=\bar t$ the largest possible production is $B(\bar t)=\min\{6-\bar t,\ 8-2\bar t\}$, and in the $(q,y)$-plane the convex hull is the triangle $q\le B(\bar t)\,y$, tighter than $q\le 6y$. (At $\bar t=3$: $B=2$.) That triangle is the hull <i>after fixing</i> $t$; it need not equal a slice of the full hull, which also mixes solutions with different $t$.</p>`,
    },
    {
      title: 'Projection and the rank-assignment example',
      html: R`
<p><b>Projection</b> returns an extended formulation to the original variables:</p>
$$\operatorname{proj}_x(Q)=\{x:\ \text{there exists } w \text{ with } (x,w)\in Q\}.$$
<p>An extended formulation is exact when $\operatorname{proj}_x(Q)=X$. To prove it, show both directions: (1) if $(x,w)\in Q$ then $x\in X$; (2) if $x\in X$ then some $w$ gives $(x,w)\in Q$.</p>
<h3>Rank assignment</h3>
<p>$n$ jobs receive distinct ranks $1..n$; $x_i$ is the rank of job $i$ and we minimise $\sum_ic_ix_i$. Feasible vectors are the permutations of $(1,\dots,n)$.</p>
<p><b>Natural description</b> (in $x\in\mathbb{R}^n$):</p>
$$\sum_{i=1}^nx_i=\frac{n(n+1)}{2},\qquad \sum_{i\in S}x_i\ge\frac{|S|(|S|+1)}{2}\quad\text{for all } \emptyset\ne S\subsetneq\{1,\dots,n\}.$$
<p>Any $|S|$ distinct ranks sum to at least $1+\dots+|S|$. These inequalities describe $\operatorname{conv}(X)$, <b>not</b> $X$ itself: for $n=3$ the point $(2,2,2)$ satisfies them. But every extreme point is a permutation, so a linear objective is optimised at one. There are $2^n-2$ subset inequalities: for $n=20$ that is 1,048,574.</p>
<p><b>Extended formulation.</b> $y_{ik}=1$ if job $i$ gets rank $k$:</p>
$$\sum_ky_{ik}=1\ \ \forall i,\qquad \sum_iy_{ik}=1\ \ \forall k,\qquad x_i=\sum_kk\,y_{ik},\qquad y_{ik}\in\{0,1\}.$$
<p>With $Q_I$ the binary formulation and $Q_{LP}$ its relaxation ($y\ge 0$):</p>
$$\operatorname{proj}_x(Q_I)=X,\qquad \operatorname{proj}_x(Q_{LP})=\operatorname{conv}(X).$$
<p>The second statement is the <b>Birkhoff–von Neumann theorem</b>: every nonnegative matrix whose rows and columns sum to one is a convex combination of permutation matrices, for example</p>
$$\tfrac12\begin{pmatrix}1&1&0\\1&0&1\\0&1&1\end{pmatrix}=\tfrac12\begin{pmatrix}1&0&0\\0&0&1\\0&1&0\end{pmatrix}+\tfrac12\begin{pmatrix}0&1&0\\1&0&0\\0&0&1\end{pmatrix}.$$
<p><b>Trade-off.</b> The natural hull description has $n$ variables and exponentially many inequalities; the assignment extension has $n^2$ variables and polynomially many constraints, and its LP projects onto the same hull. It can be typed in and handed to a standard solver.</p>
<p>A formulation is <b>compact</b> when its numbers of variables and constraints grow polynomially with the encoded input size: here the natural one is not compact, the extended one ($O(n^2)$) is. Compact means polynomial size; it may still be hard to solve.</p>`,
    },
  ],
  moves: [
    R`To compare formulations in the same variables: show that every point of $R_A$ satisfies the constraints of $B$ (usually by adding or scaling constraints of $A$), then give one fractional point in $R_B\setminus R_A$ for strictness.`,
    R`For a big-M: write the implication, identify the set $X_0$ of points allowed when the constraint is switched off, compute $M^*=\max\{0,\max_{X_0}(a^\top x-b)\}$ from the variable bounds, and state the value.`,
    R`For a fixed charge: binary $y$, cost term $Fy$, linking $q\le Uy$ with $U$ the true upper bound of $q$.`,
    R`To test a proposed valid inequality: check it in each case of the binary variable (as with $q+t\le 4+2y$), then evaluate it at the fractional point.`,
    R`For an extended formulation: state the projection, and prove exactness in both directions.`,
  ],
  traps: [
    R`“It has more constraints, so it is weaker / slower.” Strength is about the LP region, not the size. The disaggregated facility-location model has many more rows and a far better bound (lab 104: 2956.00 against 1884.20 at the root).`,
    R`Choosing $M=10^6$ “to be safe”. It is valid and useless: the LP then sets the binary to almost zero.`,
    R`Computing $M$ from the objective or from the right-hand side alone instead of from the largest possible left-hand side minus $b$.`,
    R`Claiming the natural rank-assignment inequalities describe the permutations. They describe the convex hull; $(2,2,2)$ satisfies them.`,
    R`Using the root-gap formula ($\max\{1,|z^*|\}$ in the denominator, compared with the true optimum) when the question asks for the solver's MIP gap ($|z_P|$ in the denominator, compared with the incumbent), or the reverse.`,
    R`Forgetting that with $z=0$ in $a_1^\top x\le b_1+M_1z$ the <i>first</i> constraint is the active one. Write out both cases before finalising.`,
  ],
  refs: [
    R`Slides 104, <i>Formulations</i> (T. Schettini), all 55 pages.`,
    R`Lab 104, facility location: aggregated versus disaggregated linking (80 customers, 12 facilities).`,
    R`L. A. Wolsey, <i>Integer Programming</i>, 2nd ed., chapters 1–3.`,
  ],
};
