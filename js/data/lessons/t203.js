const R = String.raw;

export default {
  id: 't203',
  lead: R`A fractional node solution can violate subtour inequalities long before any integer candidate appears. Finding such a violation is no longer a matter of following cycles: it is a <b>minimum-cut</b> problem with the LP values as capacities. Rows found this way are <b>user cuts</b>; they strengthen the relaxation but never replace the lazy constraints.`,
  sections: [
    {
      title: 'The same inequality, read as a cut',
      html: R`
<p>Every nonempty proper set $S\subset V$ must send at least one arc to its complement:</p>
$$x(\delta^+(S))=\sum_{i\in S}\sum_{j\notin S}x_{ij}\ \ge 1 .$$
<p>Under the degree equations this is equivalent to $x(S)\le|S|-1$. The outgoing-cut form lets us read arc values as <b>capacities</b>.</p>
<ul>
<li><b>Integer candidate.</b> With $S=\{1,5\}$ and selected arcs $1\to5$, $5\to1$, no selected arc leaves $S$: $\bar x(\delta^+(S))=0\lt 1$. The lazy constraint rejects the candidate.</li>
<li><b>Fractional point.</b> Several partially selected arcs may leave $S$; add their values. If the sum is below 1 (the slide shows a set sending only 0.50), the row excludes the current fractional point while keeping every tour.</li>
</ul>
<p>Adding such rows before branching can raise the node bound and reduce the number of nodes; the extra separation work need not pay off on every instance.</p>`,
    },
    {
      title: 'Separation by minimum cut',
      html: R`
<p>At an integer candidate, following selected arcs finds the disconnected cycles. At a fractional point cycle detection is not enough: the violation depends on the <b>sum</b> of all outgoing arc values.</p>
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
<p>The 20-vertex multicommodity-flow example of slides 201 has LP value 511.43, below the optimal tour 515.85; some arcs are fractional, yet <b>every subtour inequality holds</b>.</p>
<p><b>Why.</b> For a set $S$ containing the root $r$, pick a destination $t\notin S$. Its commodity sends one unit from $r$ to $t$, so at least one unit leaves $S$; since $f^t_{ij}\le\bar x_{ij}$ on every arc,</p>
$$\bar x(\delta^+(S))\ \ge\ f^t(\delta^+(S))\ \ge\ 1 .$$
<p>If $r\notin S$, apply the argument to the complement and use the degree equations. So an MCF-feasible fractional point satisfies every subtour row, and subtour separation alone cannot close that 0.86% root gap. Other inequality families or branching are needed.</p>`,
    },
    {
      title: 'Lazy constraints versus user cuts',
      html: R`
<table class="data-table left">
<thead><tr><th>Callback</th><th>Point inspected</th><th>Responsibility</th></tr></thead>
<tbody>
<tr><td><b>Lazy constraint</b></td><td>integer candidate</td><td>enforce omitted <b>feasibility</b> conditions</td></tr>
<tr><td><b>User cut</b></td><td>fractional node solution</td><td><b>strengthen</b> the relaxation</td></tr>
</tbody></table>
<ul>
<li>A lazy separator must reject <b>every</b> violating candidate it receives.</li>
<li>A user-cut callback has no responsibility for final feasibility and is <b>not guaranteed to run at every node</b>.</li>
<li>Therefore user cuts <b>cannot replace</b> the lazy constraints that define the omitted TSP feasibility conditions.</li>
</ul>
<p>Combined in one search:</p>
<pre>Integer candidate  →  cycle detection  →  lazy constraints
Fractional point   →  minimum cuts     →  user cuts</pre>
<p>On the 12-vertex instance both the iterative method and the combined callbacks prove the optimum 367.21.</p>
<h3>Cost versus benefit</h3>
<p>Fractional separation improves bounds earlier but adds callback and minimum-cut work. Practical implementations may separate only at selected nodes (often including the root), require a material violation before submitting a row, or limit the number of rows returned per callback.</p>`,
    },
  ],
  moves: [
    R`To test a set $S$ at a fractional point, list the arcs from $S$ to its complement with their values, add them, and compare with 1.`,
    R`Describe fractional separation as: capacities $\bar x_{ij}$, one fixed root, a minimum $r$–$t$ cut for each $t$, violated if below $1-\varepsilon$.`,
    R`Justify “one root suffices” with $\bar x(\delta^+(S))=\bar x(\delta^+(V\setminus S))$.`,
    R`When asked lazy versus user cut, answer with the table: what point each sees and what each is responsible for.`,
  ],
  traps: [
    R`Looking for cycles in a fractional solution. A fractional point can be connected and still violate a cut.`,
    R`Forgetting the tolerance: testing “$\lt 1$” exactly generates rows from rounding noise.`,
    R`Relying on user cuts for correctness. The solver may skip the user-cut callback; only lazy constraints guarantee that every incumbent is a tour.`,
    R`Assuming that adding all subtour cuts gives an integral LP. The 20-vertex example keeps a 0.86% gap.`,
    R`Running min-cut from every pair of vertices: with the degree equations a single root is enough ($n-1$ max-flow computations).`,
  ],
  refs: [
    R`Slides 203, <i>Fractional Cuts</i> (T. Schettini), all 18 pages.`,
    R`Slides 106 for the max-flow/min-cut theorem used by the separator.`,
    R`Gurobi reference manual, “Callbacks”, <code>LazyConstraints</code>, <code>PreCrush</code>; JuMP callback documentation.`,
  ],
};
