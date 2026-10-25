const R = String.raw;

export default {
  id: 'tE201',
  lead: R`Extra deck <b>EXTRA-201 — Nonlinear Cutting Planes</b> (formerly E201, same content). Cutting planes are not only for integrality. A convex nonlinear cost can be handled inside a linear (or mixed-integer linear) master problem by adding <b>tangent cuts</b> where the current solution underestimates the cost. With an on/off variable, the <b>perspective</b> gives a stronger convex model, and perspective cuts linearise it.`,
  sections: [
    {
      title: 'Epigraph form',
      html: R`
<p>Running example: $\min\{(x-1.3)^2:\ 0\le x\le 2\}$. Introduce a cost variable $t$:</p>
$$\min\ t\qquad\text{s.t.}\qquad t\ge(x-1.3)^2,\quad 0\le x\le 2 .$$
<p>The minimum is at $x^*=1.3$ with $t^*=0$.</p>
<div class="callout"><div class="callout-title">Epigraph</div>For $f:D\to\mathbb{R}$, $\ \operatorname{epi}(f)=\{(x,t):\ x\in D,\ t\ge f(x)\}$: each point $(x,f(x))$ and everything directly above it. Every nonempty epigraph is unbounded upward. The epigraph is <b>convex</b> when the segment joining any two of its points stays inside it. (Beyond the slides: a function is called convex exactly when its epigraph is a convex set.)</div>
<p>Minimising $t$ means finding the lowest point of the epigraph.</p>
<p><b>Pictures from the slides.</b> The epigraphs of $x^2$, $e^x$ and $x+3$ are convex, and so is that of $x^2$ on the interval $[-1,1]$: a bounded interval is fine. Two pictures are <b>not</b> convex. For $-x^2$ on $[-2,2]$ the curve bends downward, so a segment joining two points of the curve passes below it. For $x^2$ on two separate intervals, a segment joining points above the two pieces crosses the gap where $x$ is not allowed. (Beyond the slides, as a summary: a convex epigraph needs a convex function on a domain without gaps.)</p>
<p><b>Numbers (p. 9).</b> $(0.6,0.6)$ and $(2,0.6)$ are in the epigraph of $(x-1.3)^2$, because $f(0.6)=f(2)=0.49\le0.6$. Their midpoint $(1.3,0.6)$ is in it too.</p>`,
    },
    {
      title: 'Tangent cuts',
      html: R`
<p>For a <b>convex</b> epigraph, the half-space above a tangent contains the whole epigraph, so replacing the curve by tangents gives a relaxation. For $f(x)=(x-1.3)^2$, $f'(a)=2(a-1.3)$ and the tangent at $a$ is</p>
$$\ell_a(x)=(a-1.3)^2+2(a-1.3)(x-a)=2(a-1.3)\,x+1.69-a^2 .$$
<p>Since $f(x)-\ell_a(x)=(x-a)^2\ge 0$, the cut $t\ge\ell_a(x)$ is valid everywhere. One tangent alone is weak: the tangent at $a=0$, $t\ge-2.6x+1.69$, only asks $t\ge-1.69$ at the true minimiser $x=1.3$, where the cost is 0. (In general the tangent at $a$ gives $-(a-1.3)^2$ there.)</p>
<p>With reference points $A=\{0,1,2\}$:</p>
$$t\ge -2.6x+1.69,\qquad t\ge -0.6x+0.69,\qquad t\ge 1.4x-2.31 .$$
<p>Both models minimise $t$ over $[0,2]$; the tangent model has a <i>larger</i> feasible set, so it is a relaxation and its optimum, $-0.21$ at $\bar x=1.5$, is a <b>lower bound</b> on the true optimum 0.</p>
<div class="callout"><div class="callout-title">First-order inequality</div>For differentiable convex $f:\mathbb{R}^n\to\mathbb{R}$: $\ f(a)+\nabla f(a)^\top(x-a)\le f(x)$ for all $x$. Hence $t\ge f(x)$ implies the linear cut $t\ge f(a)+\nabla f(a)^\top(x-a)$.</div>
<p><b>Two variables.</b> $f(x,y)=x^2+2y^2$ has gradient $(2x,4y)$. At a reference point $(a,b)$ the tangent plane is $t=f(a,b)+2a(x-a)+4b(y-b)=2ax+4by-a^2-2b^2$. At $(a,b)=(1,2)$: $f=9$, gradient $(2,8)$, tangent plane $t=9+2(x-1)+8(y-2)=2x+8y-9$. Check: $x^2+2y^2-(2x+8y-9)=(x-1)^2+2(y-2)^2\ge 0$.</p>
<p><b>Convex constraints.</b> For $h(x)\le 0$ with $h$ convex: $h(a)+\nabla h(a)^\top(x-a)\le h(x)\le 0$. For the unit disk $h(x)=x_1^2+x_2^2-1$ at $a=(1,1)$: $1+2(x_1-1)+2(x_2-1)\le 0$, i.e. $x_1+x_2\le 1.5$. It excludes $(1,1)$ and keeps the whole disk.</p>`,
    },
    {
      title: 'Tangent relaxation refinement (the general cutting-plane algorithm)',
      html: R`
<p><b>Names.</b> The slides call this loop <i>tangent relaxation refinement</i> (one variable) and <i>the general cutting-plane algorithm</i>; the tangents build a <i>linear outer approximation</i>. (Beyond the slides: textbooks call the same loop Kelley's cutting-plane method.)</p>
<p><b>The model and the master.</b> The general model is $\min t$ s.t. $t\ge f(x)$, $h_j(x)\le0$ ($j=1,\dots,m$), $x\in X$, with $f$ and $h_j$ differentiable and convex. The set $X$ holds the linear constraints and any integrality. The <b>master problem</b> is what is actually solved: it keeps $x\in X$, replaces $t\ge f(x)$ by the tangents $t\ge f(a)+\nabla f(a)^\top(x-a)$ at reference points $a\in A$, and replaces each $h_j(x)\le0$ by $h_j(b)+\nabla h_j(b)^\top(x-b)\le0$ at reference points $b\in B_j$. It is an LP if $X$ is polyhedral, and a MILP if $X$ includes integer variables.</p>
<p><b>Separation of an epigraph point.</b> At the master solution $(\bar x,\bar t)$ compute $\delta=f(\bar x)-\bar t$. If $\delta\gt\varepsilon_{feas}$, add</p>
$$t\ge f(\bar x)+\nabla f(\bar x)^\top(x-\bar x)$$
<p>and solve the master again. At $x=\bar x$ the new cut demands $t\ge f(\bar x)$, so it excludes the current point.</p>
<p><b>Bounds and stopping.</b> The master value is a lower bound $L$. If $\bar x$ satisfies all original constraints (including integrality), $f(\bar x)$ is an upper bound; keep the best one, $U$. Stop with <b>two</b> tolerances: a <b>feasibility tolerance</b> on the violation $f(\bar x)-\bar t$ and an <b>objective tolerance</b> on the gap $U-L$. Do not wait for exact equality.</p>`,
      widget: 'kelleyTable',
      after: R`
<p>Reading the first rows: with three tangents the master gives $(1.5,-0.21)$; $f(1.5)=0.04$, violation $0.25$; the new tangent at 1.5 is $t\ge 0.4x-0.56$. Then $(1.25,-0.06)$, violation $0.0625$, tangent $t\ge -0.1x+0.1275$. Then $(1.375,-0.01)$, violation $0.015625$, tangent $t\ge 0.15x-0.200625$. Then $(1.3125,-0.00375)$, violation $0.00390625$. Note the row with two added cuts: $U$ stays $0.0025$ because $f(1.375)=0.005625$ is worse than the best cost seen, so $U$ does not fall at every step. <b>The current violation and the gap $U-L$ need not be equal</b> (there: $0.015625$ against $0.0125$).</p>
<ul>
<li>A continuous variable has infinitely many reference points: a finite set of tangents leaves gaps, and the refinement may approach the optimum without reaching it in finitely many steps. Floating-point arithmetic also makes an exact zero test unreliable. Use tolerances.</li>
<li>For a MILP master, $L$ is the solver's certified lower bound. A feasible candidate may still leave a gap because the search is unfinished. If a time or cut limit is hit, report $L$, $U$ and the remaining gap.</li>
</ul>
<div class="callout trap"><div class="callout-title">Nonconvex functions</div>A tangent to a nonconvex function may cut off feasible points. For $f(x)=-x^2$ the tangent at $a=0$ would impose $t\ge 0$, but $(1,-1)$ satisfies $t\ge -x^2$. Global cuts for nonconvex functions need valid underestimators; a local linearisation is not enough.</div>
<p><b>When is this worth doing?</b> A stand-alone convex problem is better given to a solver that handles the nonlinearity directly. Tangent cuts earn their place when a <b>linear master must be kept</b>, typically because the model also has integer variables: the master stays a MILP, branch and bound handles the integer decisions, and cuts refine the cost approximation where the current solution underestimates it. A solver for mixed-integer nonlinear or conic optimisation can also handle suitable models directly; the lecture studies the MILP-based approach.</p>`,
    },
    {
      title: 'An on/off cost and why ordinary tangents fail',
      html: R`
<p>A machine produces $x$ when switched on: $z\in\{0,1\}$, $0\le x\le 10z$, cost $t\ge x^2$. The two operating states are</p>
<ul><li>off: $z=0$, $x=0$, $t\ge 0$;</li><li>on: $z=1$, $0\le x\le 10$, $t\ge x^2$.</li></ul>
<p>Relax to $0\le z\le 1$. The point $(\bar x,\bar z,\bar t)=(2,\ 0.5,\ 4)$ is feasible. It lies <b>exactly on</b> the epigraph $t=x^2$, so no ordinary tangent $t\ge 2ax-a^2$ can remove it: those cuts do not involve $z$ at all. At this point the tangent at $a$ asks $t\ge4a-a^2$, and $4a-a^2=4-(a-2)^2\le4$. The best any ordinary tangent can say is $t\ge4$ (at $a=2$).</p>
<p><b>But it is not a mixture of the two states.</b> To get $x=2$ with weight $0.5$ on the on-state, that state must produce 4: $2=0.5(0)+0.5(4)$. Its cost is at least $4^2=16$, so the average cost is at least $0.5(0)+0.5(16)=8$. The relaxed point with $t=4$ underestimates the cost by half.</p>
<p><b>What a valid strengthening must do</b> (p. 47). We use both parts of the on/off structure: $z\in\{0,1\}$ and $z=0\Rightarrow x=0$; fractional $z$ appears only in the relaxation. We want a <b>convex</b> constraint that keeps both integer states and removes the fractional points outside their convex hull. Raising the curve arbitrarily does not guarantee that the result is valid or convex. The perspective does all three.</p>`,
    },
    {
      title: 'The perspective',
      html: R`
<div class="callout"><div class="callout-title">Definition</div>The <b>perspective</b> of $f$ is $g(x,z)=z\,f(x/z)$ for $z\gt 0$: divide the input by $z$, evaluate $f$, multiply by $z$. Properties: $g(x,1)=f(x)$, and if $f$ is convex then $g$ is jointly convex in $(x,z)$.</div>
<table class="data-table">
<thead><tr><th>$f(x)$</th><th>$x^2$</th><th>$q\,x^2\ (q\gt 0)$</th><th>$|x|$</th><th>$c^\top x+b$</th></tr></thead>
<tbody><tr><th>$g(x,z)$</th><td>$x^2/z$</td><td>$q\,x^2/z$</td><td>$|x|$</td><td>$c^\top x+b\,z$</td></tr></tbody></table>
<p>A perspective need not be strictly stronger: the perspective of $|x|$ is $|x|$ itself. In the on/off model we assume $f(0)=0$ (no variable cost when off).</p>
<p><b>Why $x^2/z$?</b> Read a fractional $z$ as a mixture: weight $z$ on the on-state and $1-z$ on the off-state. To average $x$, the on-state must produce $x/z$. Its cost $(x/z)^2$, weighted by $z$, is $z(x/z)^2=x^2/z$. So the stronger on/off constraint is $t\ge x^2/z$ for $z\gt 0$ (and $x=0$, $t\ge 0$ in the off-state).</p>
<ul>
<li>At $z=1$ both formulations say $t\ge x^2$; at $z=0$ the link gives $x=0$ and both allow $t\ge 0$. <b>The integer feasible set is unchanged.</b></li>
<li>For $0\lt z\lt 1$: $x^2/z\ge x^2$, strictly when $x\ne 0$. <b>The relaxation is tighter.</b> At $(2,0.5)$ it demands $t\ge 8$.</li>
<li><b>Small $z$ is not dangerous.</b> For a fixed $x\ne0$, $x^2/z$ grows without limit as $z\to0$, but those points break the link $x\le10z$. On the allowed region $0\le x\le10z$, so $0\le x^2/z\le100z$, which goes to 0. Example: $x=2$ needs $z\ge0.2$, and there $x^2/z=20=100z$.</li>
</ul>
<p><b>Dominance in general.</b> For convex $f$ with $f(0)=0$ and $0\lt z\le 1$: $x=z(x/z)+(1-z)\cdot 0$, so by convexity $f(x)\le z f(x/z)+(1-z)f(0)=g(x,z)$.</p>
<p><b>At $z=0$</b> the formula is undefined. The closed perspective of $x^2$ is $x^2/z$ for $z\gt 0$, $0$ at $(0,0)$, and $+\infty$ for $z=0$, $x\ne 0$. How to read it: $t\ge\bar g(x,z)$ allows $t\ge0$ at $(x,z)=(0,0)$, and no finite $t$ works when $z=0$ but $x\ne0$. The value at $(0,0)$ comes from closing the epigraph, not from giving a value to $0/0$. For other functions the value at $z=0$ can differ: for $|x|$ it is $|x|$.</p>
<p>Without division, the same set is the <b>rotated second-order cone</b> $x^2\le t\,z$ with $t,z\ge 0$ (equivalently $\|(2x,\ t-z)\|_2\le t+z$): convex despite the product. At $z=0$ it forces $x=0$ directly.</p>
<p>The mixture of the off-point $(0,0,0)$ and an on-point $(4,1,16)$ with weight $z$ is $(4z,z,16z)$, which satisfies $t=x^2/z$: the perspective is the <b>convex hull</b> of this isolated on/off structure. Additional model constraints can still leave a gap.</p>`,
    },
    {
      title: 'Perspective cuts',
      html: R`
<p>To keep an LP-based master, approximate the perspective surface by its tangent planes:</p>
$$t\ \ge\ 2a\,x-a^2\,z\qquad(\text{for } f(x)=x^2).$$
<p>Compare with the ordinary tangent $t\ge 2ax-a^2$: same at $z=1$, stronger for $z\lt 1$ when $a\ne 0$.</p>
<p><b>Validity.</b> For $z\gt 0$: $\dfrac{x^2}{z}-(2ax-a^2z)=\dfrac{(x-az)^2}{z}\ge 0$. At the off-state the cut reads $t\ge 0$. Equality holds whenever $x=az$: one plane touches the perspective along a whole ray.</p>
<p><b>Where the general cut comes from</b> (p. 61). Treat $g(x,z)=zf(x/z)$ as an ordinary convex function and take its tangent plane at $(\hat x,\hat z)$, with $a=\hat x/\hat z$. Its derivatives are $\nabla_xg=\nabla f(a)$ and $\partial_zg=f(a)-\nabla f(a)^\top a$. The constant term of the tangent plane cancels, because $\hat zf(a)-\nabla f(a)^\top\hat x-[f(a)-\nabla f(a)^\top a]\hat z=0$ when $\hat x=a\hat z$. What is left is the cut below. For $x^2$: $t\ge2ax-a^2z$.</p>
<div class="callout"><div class="callout-title">General perspective cut</div>With $a=\hat x/\hat z$: $$t\ \ge\ \nabla f(a)^\top x+\big[f(a)-\nabla f(a)^\top a\big]\,z .$$ At $z=1$ it is the ordinary tangent at $a$ (valid because $f$ is convex); at $z=0$ the link forces $x=0$ and it reads $t\ge 0$. Linear and valid in both states, hence valid for every convex combination of them.</div>
<p><b>Separation</b> at $(\bar x,\bar z,\bar t)$ with $\bar z\gt 0$: set $a=\bar x/\bar z$; compute $s=\nabla f(a)$; add the cut if $\bar z f(a)-\bar t\gt\varepsilon$. At the current point the right-hand side of the cut equals $\bar z f(a)$, so a violated perspective constraint always yields a violated linear cut.</p>
<p><b>The lecture point</b> $(2,0.5,4)$: $a=4$, cut $t\ge 8x-16z$; right-hand side at the point $16-8=8\gt 4$.</p>
<p><b>The exercise.</b> $f(x)=3x^2$, $0\le x\le 8z$, point $(1,0.25,3)$. (1) It satisfies the original relaxation: $1\le 8\cdot0.25$ and $3\ge 3\cdot1^2$. (2) The perspective requires $t\ge 3x^2/z=12$. (3) $a=1/0.25=4$, $f'(a)=24$, $f(a)-f'(a)a=48-96=-48$: cut $t\ge 24x-48z$, right-hand side 12 at the point. (4) At $z=0$: $t\ge 0$; at $z=1$: $t\ge24x-48$, a valid tangent to $3x^2$.</p>
<ul>
<li>At $\bar z=0$ do not compute $\bar x/\bar z$; the link gives $\bar x=0$, check $\bar t\ge 0$. For very small $\bar z$ use scaled tolerances; do not replace $\bar z$ by an arbitrary positive constant.</li>
<li>Integrality still needs branching: perspective cuts strengthen the relaxation only.</li>
</ul>`,
    },
    {
      title: 'Perspective cuts in practice',
      html: R`
<p><b>The loop</b> (p. 65). Start with the linear constraints, $0\le z\le1$, $t\ge0$ and a few perspective cuts. Solve the LP relaxation. Test each on/off cost at the solution, add the violated perspective cuts, and solve again. Stop when the violations are within tolerance or a cut budget is reached. This is the same cutting-plane procedure, applied to the strengthened cost. Integrality still needs branching or another exact method.</p>
<table class="data-table left">
<thead><tr><th>Approach (p. 66)</th><th>What the relaxation contains</th></tr></thead>
<tbody>
<tr><td>Perspective reformulation</td><td>the full convex constraint $t\ge zf(x/z)$</td></tr>
<tr><td>Quadratic conic formulation</td><td>$x^2\le tz$ with $t,z\ge0$</td></tr>
<tr><td>Perspective cuts</td><td>a finite linear outer approximation</td></tr>
</tbody></table>
<p>For the quadratic function, all perspective cuts together recover the perspective epigraph. A finite set of cuts usually only approximates the curve.</p>
<p><b>Several on/off activities.</b> $\min\sum_i(F_iz_i+t_i)$ with $0\le x_i\le U_iz_i$, $t_i\ge f_i(x_i)$, binary $z_i$, convex $f_i$ and $f_i(0)=0$. Strengthen each cost with $t_i\ge z_if_i(x_i/z_i)$, plus the off-state extension at $z_i=0$. Coupling constraints such as $\sum_ix_i\ge D$ stay in the model.</p>
<p><b>Modelling scope</b> (p. 69). Typical uses: fixed-charge production (opening decisions and convex production costs), facility location (activation and convex operating costs), and portfolio selection (asset selection and separable quadratic risk). Each strengthened variable or block must be controlled by its own indicator. Cross terms between variables with different indicators need more analysis; independent scalar perspectives cannot simply be substituted.</p>`,
    },
  ],
  moves: [
    R`Tangent cut: compute $f(a)$ and $f'(a)$ (or the gradient), write $t\ge f(a)+f'(a)(x-a)$ and expand to slope-intercept form.`,
    R`One refinement iteration (Kelley's method): master optimum $(\bar x,\bar t)$, $L=\bar t$, $f(\bar x)$, violation $\delta$, update $U=\min\{U,f(\bar x)\}$, gap $U-L$, new tangent at $\bar x$.`,
    R`Stopping: say both tests, a feasibility tolerance on $f(\bar x)-\bar t$ and an objective tolerance on $U-L$.`,
    R`Perspective question: (1) check the point in the weak relaxation; (2) compute $\bar zf(\bar x/\bar z)$; (3) $a=\bar x/\bar z$ and the cut $t\ge f'(a)x+[f(a)-f'(a)a]z$; (4) verify at $z=0$ and $z=1$.`,
    R`Say why validity holds: convexity for tangents; “valid in both states, hence for their convex hull” for perspective cuts.`,
  ],
  traps: [
    R`Treating the master value as an upper bound. The tangent model is a relaxation of a minimisation: $L$ is a <b>lower</b> bound; $U$ comes from evaluating $f$ at feasible points.`,
    R`Updating $U$ to the latest $f(\bar x)$ even when it is worse than a previous one.`,
    R`Stopping on $U-L$ alone, or confusing the violation with the gap. After two added cuts the violation is $0.015625$ while $U-L=0.0125$.`,
    R`Adding tangents to a nonconvex function and calling the result a relaxation.`,
    R`Trying to cut off $(2,0.5,4)$ with an ordinary tangent: it lies on the curve, no tangent of $x^2$ can remove it.`,
    R`Writing the perspective cut as $t\ge 2ax-a^2$ (forgetting the $z$) or using $a=\bar x$ instead of $a=\bar x/\bar z$.`,
    R`Evaluating $x^2/z$ at $z=0$, or replacing $\bar z=0$ by a small constant.`,
    R`“Any higher cost curve is a valid strengthening.” It must keep both integer states and stay convex; the perspective does.`,
  ],
  refs: [
    R`Slides EXTRA-201, <i>Nonlinear Cutting Planes</i> (T. Schettini), in the Extra Slides folder; it replaces the earlier deck E201, <i>Cutting Planes for Nonlinear Functions</i>, with the same 74 pages of content. The slides note that their numerical examples are constructed for teaching.`,
    R`Boyd and Vandenberghe, <i>Convex Optimization</i> (2004), §3.1.3 (first-order condition) and §3.2.6 (perspective), cited on the slides.`,
    R`Günlük and Linderoth (2010), “Perspective reformulations of mixed integer nonlinear programs with indicator variables”, <i>Math. Programming</i> 124; Günlük and Linderoth, “Perspective reformulation and applications” (survey); Bestuzheva, Gleixner and Vigerske (2023), <i>Math. Prog. Computation</i> 15.`,
  ],
};
