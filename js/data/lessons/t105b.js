const R = String.raw;

export default {
  id: 't105b',
  lead: R`A minimum spanning tree connects all vertices of an undirected weighted graph at minimum total weight. The greedy rule “take the cheapest edge that does not close a cycle” is optimal, and the reason (the cut property) is as examinable as the trace.`,
  sections: [
    {
      title: "Kruskal's algorithm",
      html: R`
<ol>
<li>Start with no selected edges and one component per vertex.</li>
<li>Sort all edges by nondecreasing weight.</li>
<li>For the next edge $\{u,v\}$, compare the components containing $u$ and $v$.</li>
<li>If they differ, <b>select</b> the edge and merge the components; otherwise <b>reject</b> it (it would close a cycle).</li>
<li>Stop after selecting $n-1$ edges, or after examining every edge.</li>
</ol>
<p>For a connected graph the result is a minimum spanning tree; for a disconnected graph, a minimum spanning forest.</p>
<div class="callout"><div class="callout-title">Exam conventions (solved exercises)</div>Edges of equal weight are examined in alphabetical order of their names. For every edge examined, say “accept” or “reject”, and for a rejection name the cycle it would close. Edges after the $(n-1)$-th acceptance need not be examined.</div>`,
    },
    {
      title: 'The lecture example',
      html: R`
<p>Six vertices, nine edges sorted as $ab\,(1)\prec bc\,(2)\prec ac\,(3)\prec bd\,(4)\prec de\,(5)\prec cd\,(6)\prec ef\,(7)\prec df\,(8)\prec ce\,(9)$.</p>
<table class="data-table left">
<thead><tr><th>Edge</th><th>Decision</th><th>Components afterwards</th><th>Weight so far</th></tr></thead>
<tbody>
<tr><td>$ab$ (1)</td><td>accept</td><td>$\{a,b\},\{c\},\{d\},\{e\},\{f\}$</td><td>1</td></tr>
<tr><td>$bc$ (2)</td><td>accept</td><td>$\{a,b,c\},\{d\},\{e\},\{f\}$</td><td>3</td></tr>
<tr><td>$ac$ (3)</td><td>reject: cycle $a,b,c,a$</td><td>unchanged</td><td>3</td></tr>
<tr><td>$bd$ (4)</td><td>accept</td><td>$\{a,b,c,d\},\{e\},\{f\}$</td><td>7</td></tr>
<tr><td>$de$ (5)</td><td>accept</td><td>$\{a,b,c,d,e\},\{f\}$</td><td>12</td></tr>
<tr><td>$cd$ (6)</td><td>reject: cycle $c,b,d,c$</td><td>unchanged</td><td>12</td></tr>
<tr><td>$ef$ (7)</td><td>accept</td><td>one component</td><td>19</td></tr>
</tbody></table>
<p>The tree has $n-1=5$ edges $\{ab,bc,bd,de,ef\}$ and weight $1+2+4+5+7=19$. Edges $df$ and $ce$ are not examined.</p>`,
    },
    {
      title: 'Why greedy is optimal: the cut property',
      html: R`
<div class="callout"><div class="callout-title">Cut property</div>Take any set of vertices $S$ that is a union of current components. The lightest edge crossing the cut $(S,V\setminus S)$ can safely be added: some minimum spanning tree containing the current forest also contains it.</div>
<p>In the example, with $S=\{a,b,c\}$ the cut is crossed by $bd$, $cd$, $ce$ with weights 4, 6, 9, and the lightest, $bd$, is the edge Kruskal adds.</p>
<p><b>Exchange argument.</b> Take an optimal tree containing the current forest. If it omits $bd$, add $bd$: this creates a cycle, and a cycle crosses a cut an even number of times, so it crosses the cut again through another edge. Remove that other crossing edge. Its weight is at least 4, so the new tree weighs no more and is also optimal, and it contains $bd$.</p>
<p>The same argument proves <b>Prim's algorithm</b>, which grows a single tree from a start vertex by repeatedly adding the lightest edge leaving the tree (lab 105b). Kruskal and Prim may select edges in a different order and, when weights tie, different trees, but always the same total weight.</p>
<h3>Tracking components</h3>
<p>A <b>disjoint-set</b> (union–find) structure stores the partition: <i>Find</i> returns the representative of a vertex's component, <i>Union</i> merges two components. Each edge needs two Finds; each accepted edge one Union.</p>
<h3>Complexity</h3>
<p>Sorting costs $O(m\log m)$; with an efficient disjoint-set structure the component operations are almost constant time, so sorting dominates: $O(n+m\log m)$, or $O(m\log m)$ for a connected graph.</p>`,
    },
    {
      title: 'Solved exercises 2 and 2B',
      html: R`
<p><b>Exercise 2.</b> Edges $ab\,(1)$, $ac\,(2)$, $bc\,(2)$, $bd\,(4)$, $cd\,(3)$, $ce\,(5)$, $de\,(3)$, $ae\,(8)$. Kruskal with alphabetical ties accepts $ab$, $ac$, rejects $bc$ (cycle $a,b,c$), accepts $cd$ and $de$: tree $\{ab,ac,cd,de\}$ of weight 9.</p>
<ul>
<li><b>Not unique:</b> swapping $ac$ for $bc$ (both weight 2) gives another tree of weight 9.</li>
<li><b>Lower-bound argument from the solution:</b> every spanning tree on 5 vertices needs 4 edges. The four smallest weights sum to $1+2+2+3=8$, but any four-edge selection of weight 8 contains the cycle $ab,ac,bc$. So weight 8 is impossible; with integer weights the bound is 9, and the tree attains it.</li>
</ul>
<p><b>Exercise 2B.</b> A $2\times4$ grid ($a,b,c,d$ on top, $e,f,g,h$ below) with edges $ab\,1$, $ef\,2$, $ae\,3$, $bf\,4$, $bc\,5$, $fg\,6$, $cg\,7$, $cd\,8$, $gh\,9$, $dh\,10$, $bg\,11$, $cf\,12$. Result: $\{ab,ef,ae,bc,fg,cd,gh\}$ with weight 34, unique because all weights are distinct.</p>
<p><b>Lab 105b</b> uses different data: edges $ab\,1$, $de\,2$, $ef\,3$, $df\,4$, $bc\,5$, $ac\,6$, $bd\,7$, $cd\,8$, $ce\,9$, with minimum weight 18 (Kruskal accepts $ab,de,ef,bc,bd$; Prim from $a$ adds $ab,bc,bd,de,ef$).</p>`,
    },
  ],
  moves: [
    R`Write the sorted edge list first, with ties in alphabetical order.`,
    R`One line per examined edge: accept (new components) or reject (name the cycle).`,
    R`Stop at $n-1$ accepted edges; list the tree and add up its weight.`,
    R`If asked about uniqueness: a tie between an accepted and a rejected edge in the same cycle gives another optimal tree; distinct weights imply a unique tree.`,
    R`If asked “why optimal”: quote the cut property and give the exchange argument in three sentences.`,
  ],
  traps: [
    R`Rejecting an edge because both endpoints are already <i>touched</i>. The test is whether they are in the <b>same component</b>.`,
    R`Continuing to examine edges after the tree is complete, or stopping before $n-1$ edges are accepted.`,
    R`Ignoring the tie rule: with ties the weight is the same but the set of edges you report may not match the expected answer.`,
    R`Mixing up Prim and Kruskal: Prim grows one connected tree from a start vertex; Kruskal grows a forest.`,
    R`Using the shortest-path tree from Dijkstra as a spanning tree of minimum weight: they answer different questions.`,
  ],
  refs: [
    R`Slides 105, <i>Well-Solved Problems</i> (T. Schettini): Kruskal with example, cut property, exchange argument, disjoint sets, complexity.`,
    R`Solved exercises 10E, exercises 2 and 2B. Lab 105b (Kruskal and Prim).`,
  ],
};
