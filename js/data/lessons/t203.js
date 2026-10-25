const R = String.raw;

export default {
  id: 't203',
  lead: R`A fractional node solution may already violate subtour inequalities before any integer candidate appears. Finding such a violation is no longer a matter of following cycles: it is an optimisation problem, a <b>minimum-cut</b> problem with the LP values as capacities. Rows found this way are <b>user cuts</b>; they strengthen the relaxation but never replace the lazy constraints.`,
  sections: [
    {
      title: 'The same inequality, read as a cut',
      html: R`
<p><b>Where violations are found.</b> With lazy constraints we search for violated rows when the solver presents an integer candidate. This happens in two ways: (1) the relaxation at the current node has an <b>integer optimal solution</b>; (2) a <b>heuristic</b> (a quick method that builds good solutions without proving optimality) produces an integer candidate satisfying the rows enforced so far. A fractional solution at an earlier node may already violate the same subtour rows.</p>
<p>Every nonempty proper set $S\subset V$ must send at least one arc to its complement:</p>
$$x(\delta^+(S))=\sum_{i\in S}\sum_{j\notin S}x_{ij}\ \ge 1 .$$
<p>Under the degree equations this is equivalent to $x(S)\le|S|-1$. The outgoing-cut form lets us read arc values as <b>capacities</b>.</p>
<ul>
<li><b>Integer candidate.</b> With $S=\{1,5\}$ and selected arcs $1\to5$, $5\to1$, no selected arc leaves $S$: $\bar x(\delta^+(S))=0\lt 1$. The lazy constraint rejects the candidate.</li>
<li><b>Fractional point.</b> Several partially selected arcs may leave $S$; add their values. If the sum is below 1, the row excludes the current fractional point while keeping every tour. In the lecture picture the orange set is $S=\{1,6,9,11\}$: only the arc $1\to5$, with value 0.5, leaves it, so $\bar x(\delta^+(S))=0.5\lt 1$. (The set and the arc are read from the figure; the slide text says only that the set sends 0.50.)</li>
</ul>
<p>Adding such rows before branching can raise the node bound and reduce the number of nodes; the extra separation work need not pay off on every instance.</p>`,
    },
    {
      title: 'Separation as an optimisation problem',
      html: R`
<p>At a fractional point there is no tour to trace. We need a nonempty proper set $S$ whose outgoing values add up to less than 1. Rather than try every set, the reading version of slides 203 writes this search as an optimisation problem.</p>
<div class="callout"><div class="callout-title">Separation problem</div>For a given point $\bar x$: find a violated inequality of a specified family, or establish that none exists. It is often framed as finding the <b>most violated</b> inequality of the family.</div>
<p><b>Data and decisions.</b> The point $\bar x$ is fixed <b>data</b>; the set $S$ is the decision. Use binary variables $z_i=1$ when $i\in S$ (0 otherwise), and $y_{ij}$ to mark an arc that leaves $S$. (Sheet 20E writes $w_{ij}$ for $y_{ij}$ and $n-1$ for $|V|-1$.)</p>
$$\begin{aligned}\theta(\bar x)=\min\ &\textstyle\sum_{(i,j)\in A}\bar x_{ij}\,y_{ij}\\ \text{s.t. }&y_{ij}\ge z_i-z_j\quad((i,j)\in A),\\ &1\le\textstyle\sum_{i\in V}z_i\le|V|-1,\\ &z_i\in\{0,1\}\ \ (i\in V),\qquad 0\le y_{ij}\le1\ \ ((i,j)\in A).\end{aligned}$$
<ul>
<li>If $i\in S$ and $j\notin S$, then $z_i-z_j=1$ forces $y_{ij}=1$: the value of that arc is counted.</li>
<li>For every other arc $z_i-z_j\le 0$, so $y_{ij}$ may be 0; at an optimum it can be 0, because $\bar x_{ij}\ge0$ and we minimise.</li>
<li>$1\le\sum_iz_i\le|V|-1$ excludes the empty set and the whole set $V$. Both send nothing out and would give the useless value 0.</li>
<li><b>Reading the answer.</b> $S=\{i:\ z_i=1\}$. The objective is then the outgoing value $\bar x(\delta^+(S))$, so $\theta(\bar x)$ is the smallest outgoing value over all nonempty proper sets.</li>
<li><b>Violation test.</b> A violated subtour row exists exactly when $\theta(\bar x)\lt 1$; return $\sum_{i\in S}\sum_{j\notin S}x_{ij}\ge 1$. If $\theta(\bar x)\ge 1$, no subtour row is violated. In a solver, test $\theta(\bar x)\lt 1-\varepsilon$ for a small tolerance $\varepsilon$, so that rounding noise creates no rows.</li>
</ul>
<p>$\theta(\bar x)=\min_{\emptyset\ne S\subsetneq V}\sum_{i\in S}\sum_{j\notin S}\bar x_{ij}$ is a <b>minimum-capacity directed cut</b>: each arc has capacity $\bar x_{ij}$, and a cut counts only arcs leaving $S$. So we solve it with minimum-cut algorithms (next section) instead of a general integer programming solver.</p>`,
    },
    {
      title: 'Worked example: 20E Exercise 2',
      html: R`
<p>Four vertices, degree relaxation with $0\le x_{ij}\le1$ and no subtour rows yet. The point has $\bar x_{12}=\bar x_{21}=\bar x_{34}=\bar x_{43}=0.8$ and $\bar x_{13}=\bar x_{31}=\bar x_{24}=\bar x_{42}=0.2$; all other arcs are 0.</p>
<ol>
<li><b>Feasible for the model as written.</b> At every vertex the outgoing sum and the incoming sum are $0.8+0.2=1$, and every value lies in $[0,1]$. It is not an integer tour.</li>
<li><b>Choose $z=(1,1,0,0)$</b>, so $S=\{1,2\}$. The model forces $w_{13}=w_{14}=w_{23}=w_{24}=1$ (the sheet's name for $y_{ij}$); all other $w_{ij}=0$. Then $\theta=0.2+0+0+0.2=0.4$.</li>
<li><b>This is the minimum.</b> A set that splits $\{1,2\}$ or $\{3,4\}$ cuts an arc of value 0.8. The only other candidates are the two complete pairs $\{1,2\}$ and $\{3,4\}$, both with value 0.4.</li>
<li><b>Test:</b> $0.4\lt 1$, so a row is violated, by $1-0.4=0.6$.</li>
<li><b>Both forms of the row.</b> Cut form: $x_{13}+x_{14}+x_{23}+x_{24}\ge 1$, left side $0.4$. Internal form: $x_{12}+x_{21}\le 1$, left side $1.6$. Same violation $0.6$, because each vertex of $S$ sends out 1 (degree equations): internal $+$ outgoing $=|S|$, here $1.6+0.4=2$.</li>
</ol>
<p><a href="#/exercises/20e/2">Open 20E Exercise 2</a>.</p>`,
    },
    {
      title: 'Separation by minimum cut with a fixed root',
      html: R`
<p>Treat $\bar x_{ij}$ as the capacity of arc $(i,j)$, fix a root $r$ and look for the directed cut of lowest capacity:</p>
$$\min_{t\in V\setminus\{r\}}\ \ \min_{S\subset V:\ r\in S,\ t\notin S}\ \sum_{i\in S}\sum_{j\notin S}\bar x_{ij}.$$
<ol>
<li>Fix any vertex $r$.</li>
<li>For each $t\ne r$, compute a minimum directed $r$–$t$ cut with capacities $\bar x_{ij}$ (a max-flow computation).</li>
<li>If a cut has capacity below $1-\varepsilon$, submit its subtour inequality.</li>
<li>If no such cut exists, no subtour inequality is violated beyond the tolerance.</li>
</ol>
<p><b>Why one root is enough.</b> The degree equations imply $\bar x(\delta^+(S))=\bar x(\delta^+(V\setminus S))$. If a violated set does not contain $r$, its complement contains $r$ and has the same capacity.</p>
<p><b>Most violated row.</b> The violation of $S$ is $1-\bar x(\delta^+(S))$, so minimising the cut capacity maximises the violation: the minimum cut is a most violated subtour row at the current point. The separator is itself a combinatorial optimisation algorithm.</p>`,
    },
    {
      title: 'What subtour cuts cannot do',
      html: R`
<p>A fractional solution need not violate any subtour inequality. The PDF version of slides 203 gives the evidence: the 20-vertex multicommodity-flow example of slides 201 has LP value 511.43, below the optimal tour 515.85; some arcs are fractional, yet <b>every subtour inequality holds</b>. (The reading version keeps only the picture and the first sentence.)</p>
<p><b>Why</b> (PDF version). For a set $S$ containing the root $r$, pick a destination $t\notin S$. Its commodity sends one unit from $r$ to $t$, so at least one unit leaves $S$; since $f^t_{ij}\le\bar x_{ij}$ on every arc,</p>
$$\bar x(\delta^+(S))\ \ge\ f^t(\delta^+(S))\ \ge\ 1 .$$
<p>If $r\notin S$, apply the argument to the complement and use the degree equations. So an MCF-feasible fractional point satisfies every subtour row, and subtour separation alone cannot close that 0.86% root gap. Other inequality families or branching are needed.</p>`,
    },
    {
      title: 'Lazy constraints versus user cuts',
      html: R`
<p>In practice, fractional and integer separation are often implemented using different callbacks.</p>
<table class="data-table left">
<thead><tr><th>Callback</th><th>Point inspected</th><th>Responsibility</th></tr></thead>
<tbody>
<tr><td><b>Lazy constraint</b></td><td>integer candidate</td><td>enforce omitted <b>feasibility</b> conditions</td></tr>
<tr><td><b>User cut</b></td><td>fractional node solution</td><td><b>strengthen</b> the relaxation</td></tr>
</tbody></table>
<ul>
<li>A lazy separator must reject <b>every</b> violating candidate it receives.</li>
<li>A user-cut callback has no responsibility for final feasibility and is <b>not guaranteed to run at every node</b>.</li>
<li>Therefore user cuts <b>cannot replace</b> the lazy constraints that define the omitted TSP feasibility conditions. (These three points are stated in the PDF version.)</li>
</ul>
<p>Combined in one search:</p>
<pre>Integer candidate  →  cycle detection  →  lazy constraints
Fractional point   →  minimum cuts     →  user cuts</pre>
<p>On the 12-vertex instance both the iterative method and the combined callbacks prove the optimum 367.21.</p>`,
    },
    {
      title: 'Cost versus benefit',
      html: R`
<p>Fractional separation can improve bounds earlier in the search. Two limitations reduce the benefit: separation itself costs computation (for some inequality families it is a difficult optimisation problem), and a violated cut may raise the bound only slightly while adding work to every later relaxation solve.</p>
<p>Two effects compete:</p>
<ul>
<li><b>Search savings:</b> stronger bounds may reduce the number of nodes explored.</li>
<li><b>Cost per node:</b> separation and larger relaxations may increase the time spent on each node.</li>
</ul>
<div class="callout"><div class="callout-title">The criterion</div>The relevant outcome is <b>total solution time</b>. Fewer nodes alone do not establish an improvement.</div>
<p>Separating at every node may cost more than it saves. Solvers typically concentrate separation at the <b>root</b> and use it more sparingly in the tree (Contardo, Lodi and Tramontani, 2022). Research alternatives: learn whether cuts generated at tree nodes will reduce solution time (Berthold, Francobaldi and Hendel, 2022), or collect globally valid cuts during a first search and reuse them in a restarted run (Contardo, Lodi and Tramontani, 2022). Their benefit depends on the instance and on the cost of managing the cuts.</p>
<p>The PDF version lists three practical options: separate only at selected nodes (often including the root), require a material violation before submitting a row, or limit the number of rows returned per callback.</p>`,
    },
  ],
  moves: [
    R`To test a set $S$ at a fractional point, list the arcs from $S$ to its complement with their values, add them, and compare with 1. Give the row in both forms if asked; the violation is the same.`,
    R`Asked to “write the separation problem”: write $\theta(\bar x)$ with $z_i$ (is $i$ in $S$?) and $y_{ij}$ (does the arc leave $S$?), say that $\bar x$ is data, explain $y_{ij}\ge z_i-z_j$ and $1\le\sum_iz_i\le|V|-1$, read $S=\{i:z_i=1\}$, and state the test $\theta(\bar x)\lt 1$.`,
    R`Describe fractional separation as: capacities $\bar x_{ij}$, one fixed root, a minimum $r$–$t$ cut for each $t$, violated if below $1-\varepsilon$.`,
    R`Justify “one root suffices” with $\bar x(\delta^+(S))=\bar x(\delta^+(V\setminus S))$.`,
    R`When asked lazy versus user cut, answer with the table: what point each sees and what each is responsible for.`,
  ],
  traps: [
    R`Looking for cycles in a fractional solution. A fractional point can be connected and still violate a cut.`,
    R`Treating $\bar x$ as variables of the separation problem. They are fixed numbers; only $z$ and $y$ (or $w$) are decided.`,
    R`Forgetting $1\le\sum_iz_i\le|V|-1$: without it the empty set gives the useless minimum 0.`,
    R`Forgetting the tolerance: testing “$\lt 1$” exactly generates rows from rounding noise.`,
    R`Relying on user cuts for correctness. The solver may skip the user-cut callback; only lazy constraints guarantee that every incumbent is a tour.`,
    R`Assuming that adding all subtour cuts gives an integral LP. The 20-vertex example keeps a 0.86% gap.`,
    R`Judging fractional separation by the number of nodes alone. Total solution time decides.`,
    R`Running min-cut from every pair of vertices: with the degree equations a single root is enough ($n-1$ max-flow computations).`,
  ],
  refs: [
    R`Slides 203, <i>Fractional Cuts</i> (T. Schettini): the PDF (18 pages) and the HTML reading version (October 2026), which adds the separation problem $\theta(\bar x)$, the trade-offs and two research references, and drops the MCF proof and the 0.86% example.`,
    R`Sheet 20E, Exercise 2 (separation at a fractional point).`,
    R`Slides 106 for the max-flow/min-cut theorem used by the separator.`,
    R`Contardo, Lodi and Tramontani (2022), “Cutting Planes from the Branch-and-Bound Tree: Challenges and Opportunities”, <i>INFORMS Journal on Computing</i> 35(1), 2–4; Berthold, Francobaldi and Hendel (2022), “Learning to Use Local Cuts”, arXiv:2206.11618 (both cited on the reading version).`,
    R`Wolsey, <i>Integer Programming</i>, 2nd ed. (2021), chapters 1–3; Dantzig, Fulkerson and Johnson (1954); Gurobi reference manual, “Callbacks”, <code>LazyConstraints</code>, <code>PreCrush</code>; JuMP callback documentation.`,
  ],
};
