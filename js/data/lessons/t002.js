const R = String.raw;

export default {
  id: 't002',
  lead: R`Two pieces of background the slides use without stopping: how algorithm running times are compared, and the vocabulary of graphs.`,
  sections: [
    {
      title: 'Running time and what “efficient” means',
      html: R`
<ul>
<li>An algorithm is <b>efficient</b> when its running time grows <b>polynomially with the encoded input size</b> (slides 105). $O(\cdot)$ notation keeps the dominant term and drops constants: $O(n^3)$, $O(m\log n)$.</li>
<li>The <b>encoded size</b> of a number $C$ is about $\log_2C$ bits, not $C$. An algorithm that takes $O(nC)$ steps, like the knapsack dynamic programme, is polynomial in the <i>value</i> of $C$ but exponential in its <i>length</i>: it is <b>pseudo-polynomial</b>.</li>
<li>Exponential growth is what makes enumeration hopeless: $2^n-n-2$ subtour rows, $(n-1)!$ tours.</li>
</ul>
<table class="data-table">
<thead><tr><th>$n$</th><th>$n^2$</th><th>$n^3$</th><th>$2^n$</th><th>$n!$</th></tr></thead>
<tbody>
<tr><td>10</td><td>100</td><td>1,000</td><td>1,024</td><td>3.6 million</td></tr>
<tr><td>20</td><td>400</td><td>8,000</td><td>about 1 million</td><td>about $2.4\times10^{18}$</td></tr>
<tr><td>50</td><td>2,500</td><td>125,000</td><td>about $10^{15}$</td><td>about $3\times10^{64}$</td></tr>
</tbody></table>`,
    },
    {
      title: 'P, NP and NP-hard, as much as the course needs',
      html: R`
<ul>
<li><b>P:</b> decision problems solvable in polynomial time. Shortest path with nonnegative lengths, minimum spanning tree, maximum flow, assignment and linear programming are all polynomially solvable.</li>
<li><b>NP:</b> decision problems whose “yes” answers can be <i>checked</i> in polynomial time given a certificate (for example: “is there a tour of length at most $K$?” is checked by exhibiting the tour).</li>
<li><b>NP-hard:</b> at least as hard as every problem in NP. No polynomial algorithm is known for any NP-hard problem, and none exists unless P = NP. Knapsack, TSP, set covering, general integer programming, facility location and the Steiner tree problem are NP-hard.</li>
<li>NP-hard is a <b>worst-case</b> statement about a problem class. It does not prevent particular instances, even very large ones, from being solved to proven optimality (the 24,727-pub tour).</li>
<li><b>Separation and optimisation</b> are equivalent in difficulty for a class of polyhedra: an inequality family is useful when its separation problem is easy (subtour rows: a min-cut; cover inequalities: a knapsack, itself hard but small).</li>
</ul>`,
    },
    {
      title: 'Graph vocabulary',
      html: R`
<table class="data-table left">
<thead><tr><th>Term</th><th>Meaning</th></tr></thead>
<tbody>
<tr><td>Graph $G=(V,E)$ / digraph $G=(V,A)$</td><td>Vertices with undirected edges $\{u,v\}$ / directed arcs $(u,v)$. Slides use $n=|V|$, $m=|E|$ or $|A|$.</td></tr>
<tr><td>Path, cycle</td><td>A sequence of distinct vertices joined by edges; a cycle returns to its start. Directed versions follow arc directions.</td></tr>
<tr><td>Connected, component</td><td>Every pair of vertices joined by a path; a component is a maximal connected piece. Found by BFS or DFS.</td></tr>
<tr><td>Tree, spanning tree</td><td>Connected with no cycle; on $n$ vertices it has exactly $n-1$ edges. A spanning tree contains all vertices.</td></tr>
<tr><td>Cut $\delta(S)$</td><td>The edges with exactly one end in $S$. In a digraph $\delta^+(S)$ are the arcs leaving $S$ and $\delta^-(S)$ those entering.</td></tr>
<tr><td>$s$–$t$ cut</td><td>A set $S$ with $s\in S$, $t\notin S$; its capacity counts only arcs of $\delta^+(S)$.</td></tr>
<tr><td>Bipartite graph</td><td>Vertices split in two sides with all edges between the sides (workers and jobs).</td></tr>
<tr><td>Matching</td><td>A set of edges with no common vertex. A perfect matching covers all vertices (an assignment).</td></tr>
<tr><td>Clique</td><td>A set of pairwise adjacent vertices (slides 206).</td></tr>
<tr><td>Incidence matrix</td><td>Rows = vertices, columns = arcs, entries $\pm1$ at the two ends of each arc (slides 106).</td></tr>
<tr><td>Tour, subtour</td><td>A cycle through all vertices; a cycle through only some of them.</td></tr>
</tbody></table>
<p><b>Breadth-first search (BFS)</b> explores vertices in order of their number of arcs from the start, using a queue. With alphabetical neighbour order it gives the deterministic paths used in the Edmonds–Karp exercises; a BFS path has the fewest arcs.</p>
<p><b>Useful counts.</b> A set of $n$ elements has $2^n$ subsets and $\binom nk$ subsets of size $k$. A complete directed graph has $n(n-1)$ arcs; a complete undirected one $n(n-1)/2$ edges.</p>`,
    },
  ],
  moves: [
    R`When asked for a complexity, give it in terms of $n$, $m$ (and $C$ if a numeric capacity matters) and say whether it is polynomial or pseudo-polynomial.`,
    R`When asked whether a problem is “easy”, answer with the algorithm or the structural reason (polynomial algorithm, integral LP), or name it as NP-hard.`,
  ],
  traps: [
    R`“NP means not polynomial.” It stands for nondeterministic polynomial; every problem in P is also in NP.`,
    R`“The knapsack DP is polynomial, so knapsack is in P.” The DP is pseudo-polynomial.`,
    R`“NP-hard problems cannot be solved exactly.” They can; there is just no guarantee of polynomial time.`,
    R`Counting arcs entering $S$ in $\delta^+(S)$.`,
  ],
  refs: [
    R`Slides 101 (combinatorial explosion), 105 (efficiency, complexity table, pseudo-polynomial), 106 (LP is polynomial; simplex is not in the worst case), 201 (row counts).`,
    R`Wolsey, <i>Integer Programming</i>, 2nd ed., chapter 6 (complexity and problem reductions).`,
  ],
};
