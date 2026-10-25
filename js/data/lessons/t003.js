const R = String.raw;

export default {
  id: 't003',
  lead: R`A plain-words refresher on the geometry behind slides 206: convex combinations, convex hulls, affine independence, dimension, faces and facets. Slides 206 and sheet 20E use these words without stopping to define them all. Read this page first if “affinely independent” or “dimension of a face” feels rusty.`,
  sections: [
    {
      title: 'Convex combinations and convex sets',
      html: R`
<div class="callout warn"><div class="callout-title">Refresher (beyond the slides)</div>This page is written for this app; it is not course material. The definitions are the standard textbook ones. The instructor uses the words in slides 206 (integer hull, faces and facets) and in sheet 20E, Exercise 12. The worked examples use his numbers.</div>
<p>A <b>point</b> of $\mathbb{R}^n$ is a list of $n$ numbers, such as $(2,4)$ in the plane ($n=2$) or $(1,1,0,0)$ for four binary variables ($n=4$).</p>
<p><b>Convex combination.</b> Take points $p_1,\dots,p_k$ and weights $\lambda_1,\dots,\lambda_k$ that are all <b>nonnegative</b> and <b>add up to 1</b>. The point $\lambda_1p_1+\dots+\lambda_kp_k$ is a convex combination of them. Think of a weighted average.</p>
<ul>
<li>Two points: the convex combinations of $p$ and $q$ are the points $\lambda p+(1-\lambda)q$ with $0\le\lambda\le1$. They fill the <b>segment</b> from $p$ to $q$.</li>
<li>Example: $\tfrac12(1,4)+\tfrac12(2,4)=(1.5,\,4)$, the midpoint of the segment from $(1,4)$ to $(2,4)$.</li>
</ul>
<p><b>Convex set.</b> A set is convex when it contains the whole segment between any two of its points. No dents, no holes, no gaps.</p>
<ul>
<li>The feasible region of an LP is convex (beyond the slides: a convex combination of points that satisfy $a^\top x\le b$ also satisfies it, because the weights are nonnegative and add up to 1).</li>
<li>The set of feasible <b>integer</b> points is not convex. In the workshop, $(1,4)$ and $(2,4)$ are feasible, but their midpoint $(1.5,4)$ is not an integer point.</li>
</ul>`,
    },
    {
      title: 'The convex hull and the integer hull',
      html: R`
<p>The <b>convex hull</b> $\operatorname{conv}(S)$ of a set $S$ is the set of all convex combinations of points of $S$. Equivalently, it is the smallest convex set that contains $S$. For finitely many points in the plane it is the polygon you get by stretching a rubber band around them; its corners are points of $S$.</p>
<p>The <b>integer hull</b> is the convex hull of the feasible integer points: $P_I=\operatorname{conv}(X)$ (slides 104 and 206).</p>
<div class="callout"><div class="callout-title">Worked example: the workshop</div>$\max x+10y$ s.t. $0\le x\le3$, $y\ge0$, $y-x\le3.7$, $x+y\le6.3$, $x,y$ integer.
<ol>
<li>List the integer points column by column. $x=0$: $y=0,1,2,3$. $x=1$: $y=0,\dots,4$. $x=2$: $y=0,\dots,4$. $x=3$: $y=0,\dots,3$. That is 18 points.</li>
<li>Stretch the rubber band. The corners are $(0,0)$, $(3,0)$, $(3,3)$, $(2,4)$, $(1,4)$, $(0,3)$. All other points lie inside or on the edges.</li>
<li>Describe the polygon by inequalities (slides 206): $0\le x\le3$, $y\ge0$, $y-x\le3$, $x+y\le6$, $y\le4$.</li>
</ol>
The LP optimum $(1.3,5)$ is <b>outside</b> this hull ($y=5\gt4$). Over the hull, the LP optimum is the integer point $(2,4)$ with value 42. This is why an “ideal” formulation, one that describes $P_I$ exactly, needs no branching.</div>
<p>(Why the last claim holds, from the LP refresher: an LP with a finite optimum has an optimal corner, and every corner of $P_I$ is a feasible integer point.)</p>`,
    },
    {
      title: 'Affine independence and dimension',
      html: R`
<p><b>Affine combination.</b> Like a convex combination, but the weights may be negative; they must still add up to 1. The affine combinations of two different points fill the whole <b>line</b> through them, not just the segment.</p>
<p><b>Affinely independent points.</b> Points $p_0,p_1,\dots,p_d$ are affinely independent when none of them is an affine combination of the others. In the plane: two different points are affinely independent; three points are affinely independent when they are <b>not on one line</b>.</p>
<div class="callout"><div class="callout-title">The subtraction test (standard; slides 206 state “these four points are affinely independent” without showing the check)</div>Subtract one point from all the others: $p_1-p_0,\ \dots,\ p_d-p_0$. The points are affinely independent exactly when these difference vectors are <b>linearly independent</b>: the only way to get $c_1(p_1-p_0)+\dots+c_d(p_d-p_0)=0$ is $c_1=\dots=c_d=0$.</div>
<p><b>Two quick ways to test linear independence</b> (beyond the slides).</p>
<ul>
<li>Two vectors $(p,q)$ and $(r,s)$ in the plane are independent exactly when $ps-qr\ne0$ (they are not parallel).</li>
<li>In general, solve $c_1v_1+\dots+c_dv_d=0$ one coordinate at a time. If every $c_i$ is forced to 0, the vectors are independent.</li>
</ul>
<p>Examples.</p>
<ul>
<li>$(0,0)$, $(3,0)$, $(0,3)$: the differences are $(3,0)$ and $(0,3)$, and $3\cdot3-0\cdot0=9\ne0$. Affinely independent.</li>
<li>$(1,4)$, $(2,4)$, $(3,4)$: the differences are $(1,0)$ and $(2,0)$, and $1\cdot0-0\cdot2=0$. Not affinely independent: the three points lie on the line $y=4$.</li>
</ul>
<p><b>Dimension of a set.</b> The dimension is $d$ when the set contains $d+1$ affinely independent points, but not $d+2$. In other words: the largest number of affinely independent points in it, minus 1.</p>
<table class="data-table">
<thead><tr><th>Set</th><th>Affinely independent points it can hold</th><th>Dimension</th></tr></thead>
<tbody>
<tr><td>one point</td><td>1</td><td>0</td></tr>
<tr><td>a segment</td><td>2 (its two ends)</td><td>1</td></tr>
<tr><td>a filled triangle or polygon</td><td>3</td><td>2</td></tr>
<tr><td>a solid in $\mathbb{R}^3$</td><td>4</td><td>3</td></tr>
</tbody></table>
<p>A set in $\mathbb{R}^n$ of dimension $n$ is called <b>full-dimensional</b>.</p>
<p><b>The lecture knapsack</b> $4x_1+4x_2+4x_3+7x_4\le10$, $x\in\{0,1\}^4$. Its integer hull contains $0$ and the four unit vectors $(1,0,0,0),\dots,(0,0,0,1)$, because each item fits alone. Subtracting $0$ leaves the four unit vectors, which are linearly independent. So the hull contains 5 affinely independent points and has dimension 4: it is full-dimensional (slides 206: “The integer hull has dimension four”).</p>`,
    },
    {
      title: 'Valid inequalities, faces and facets',
      html: R`
<ul>
<li>An inequality $\alpha^\top x\le\beta$ is <b>valid</b> for a set when every point of the set satisfies it (slides 206). A valid inequality for the feasible points is also valid for their convex hull: it holds for every convex combination (slides 104).</li>
<li>A point is <b>tight</b> for the inequality when it satisfies it with equality, $\alpha^\top x=\beta$.</li>
<li>The <b>face</b> of a valid inequality is its set of tight points: $F=\{x\in P_I:\ \alpha^\top x=\beta\}$ (slides 206).</li>
<li>A <b>facet</b> is a face whose dimension is <b>one less</b> than the dimension of $P_I$. When $P_I$ is full-dimensional in $\mathbb{R}^n$: $\dim F=n-1$. In the plane facets are edges; in $\mathbb{R}^3$ they are flat faces.</li>
</ul>
<p>A face can be empty, a single corner, an edge, and so on. Sheet 20E, Exercise 12 shows all three on $Q=\operatorname{conv}\{(0,0),(2,0),(1,2),(0,2)\}$: $2x+y\le4.5$ is never tight (empty face); $x\le2$ is tight only at $(2,0)$ (dimension 0); $y\le2$ is tight on the segment from $(0,2)$ to $(1,2)$ (dimension 1, a facet).</p>
<div class="callout"><div class="callout-title">How to prove that an inequality defines a facet</div>
<ol>
<li><b>Validity.</b> Show every feasible point satisfies it (often by cases).</li>
<li><b>Dimension of $P_I$.</b> Exhibit $\dim P_I+1$ affinely independent feasible points.</li>
<li><b>Tight points.</b> Exhibit $\dim P_I$ affinely independent <b>feasible</b> points that satisfy the inequality with equality.</li>
</ol>
(Beyond the slides: also make sure some feasible point is <i>not</i> tight, so that the face is not all of $P_I$. In the examples below, $(0,0)$ and $0$ do that job.)</div>
<h3>Worked example 1: the pentagon of 20E, Exercise 12</h3>
<p>$P$ has corners $(0,0)$, $(2,0)$, $(2,1)$, $(1,2)$, $(0,2)$. Is $x+y\le3$ a facet?</p>
<ol>
<li>Validity: at the corners $x+y$ is $0,2,3,3,2$, all at most 3. A linear inequality that holds at the corners holds on the whole polygon.</li>
<li>Dimension: $(0,0)$, $(2,0)$, $(0,2)$ give differences $(2,0)$, $(0,2)$ with $2\cdot2-0\cdot0=4\ne0$. So $\dim P=2$.</li>
<li>Tight points: $(2,1)$ and $(1,2)$. Their difference $(-1,1)$ is not zero, so they are 2 affinely independent points. The face has dimension $1=2-1$: a facet.</li>
</ol>
<h3>Worked example 2: the lifted cover of slides 206</h3>
<p>$x_1+x_2+x_3+2x_4\le2$ for the lecture knapsack. Validity is shown on the slides by the two cases $x_4=0$ and $x_4=1$, and $\dim P_I=4$ (above). The tight feasible points are $(1,1,0,0)$, $(1,0,1,0)$, $(0,1,1,0)$ (weight 8 each) and $(0,0,0,1)$ (weight 7).</p>
<ol>
<li>Subtract the first point: $d_1=(0,-1,1,0)$, $d_2=(-1,0,1,0)$, $d_3=(-1,-1,0,1)$.</li>
<li>Suppose $c_1d_1+c_2d_2+c_3d_3=0$ and read it coordinate by coordinate.</li>
<li>Coordinate 4: only $d_3$ has an entry there, so $c_3=0$.</li>
<li>Coordinate 1: $-c_2-c_3=0$, so $c_2=0$.</li>
<li>Coordinate 2: $-c_1-c_3=0$, so $c_1=0$.</li>
<li>Only the zero combination works: the differences are linearly independent, the four points are affinely independent, and the face has dimension $3=4-1$. A facet.</li>
</ol>
<p>Compare the base cover $x_1+x_2+x_3\le2$: only the first three points are tight, so its face has dimension at most 2. Not a facet (slides 206).</p>`,
    },
    {
      title: 'Quick checks',
      html: R`
<ol>
<li>Is $(2,3)$ a convex combination of $(0,2)$ and $(4,4)$? <i>Answer:</i> yes, $\tfrac12(0,2)+\tfrac12(4,4)=(2,3)$.</li>
<li>What is the dimension of the segment from $(1,4)$ to $(2,4)$? <i>Answer:</i> 1.</li>
<li>Are $(0,0,0)$, $(1,0,0)$, $(0,1,0)$, $(1,1,0)$ affinely independent? <i>Answer:</i> no. The differences $(1,0,0)$, $(0,1,0)$, $(1,1,0)$ are dependent: the third is the sum of the first two. All four points lie in the plane $x_3=0$.</li>
<li>How many affinely independent tight points prove a facet of a full-dimensional hull in $\mathbb{R}^4$? <i>Answer:</i> 4.</li>
<li>In the plane, a valid inequality is tight at exactly one corner of the polygon. Is it a facet? <i>Answer:</i> no; its face is a point, of dimension 0.</li>
</ol>`,
    },
  ],
  moves: [
    R`To find a dimension: list points of the set, subtract one of them from the others, and count how many of the differences are linearly independent. That count is the dimension.`,
    R`To prove a facet: (1) validity, (2) $\dim P_I$ with $\dim P_I+1$ affinely independent feasible points, (3) $\dim P_I$ affinely independent feasible points where the inequality is tight.`,
    R`To show linear independence by hand: write $c_1d_1+\dots+c_kd_k=0$ and solve one coordinate at a time, starting with a coordinate where only one vector is nonzero.`,
    R`For “is it a facet?” questions, list <b>all</b> tight feasible points first. Too few affinely independent ones means no.`,
  ],
  traps: [
    R`Testing <b>linear</b> instead of affine independence. The origin is never part of a linearly independent set, yet $0$ and $(1,0,0,0)$ are two affinely independent points. Always subtract one point first.`,
    R`Counting tight points that are not feasible. A point of the LP relaxation that is not in $P_I$ does not count.`,
    R`Counting points instead of independent points. Three tight points on one line in the plane still give dimension 1, not 2.`,
    R`Thinking a valid inequality must touch the hull. $2x+y\le4.5$ is valid for $Q$ (20E, Exercise 12) and never tight.`,
    R`Forgetting the weights: in a convex combination they are nonnegative <b>and</b> add up to 1. With negative weights you get an affine combination, which can leave the set.`,
    R`Using “one less than $n$” when $P_I$ is not full-dimensional. (Beyond the slides: then a facet has dimension $\dim P_I-1$. Every example in this course is full-dimensional.)`,
  ],
  refs: [
    R`Refresher written for this app, not course material. The instructor uses these terms in slides 206 (integer hull, faces and facets: PDF pp. 48–51 and the reading version's “Integer hull: workshop” and “A workshop facet”), in slides 104 (integer hull, convex combinations of feasible solutions) and in sheet 20E, Exercise 12.`,
    R`Standard textbook definitions: Nemhauser and Wolsey (1988), <i>Integer and Combinatorial Optimization</i>, chapter I.4 (polyhedral theory); Wolsey, <i>Integer Programming</i>, 2nd ed.`,
  ],
};
