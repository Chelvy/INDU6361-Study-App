const R = String.raw;

export default {
  id: 't105c',
  lead: R`Send as much flow as possible from a source $s$ to a sink $t$ through capacitated arcs. Edmonds–Karp repeatedly augments along a shortest path of the <b>residual network</b>; when it stops, the set of vertices still reachable from $s$ is a minimum cut that proves optimality.`,
  sections: [
    {
      title: 'Flows and residual capacities',
      html: R`
<p>Each arc $(u,v)$ has capacity $c_{uv}\ge 0$. A <b>feasible flow</b> satisfies $0\le f_{uv}\le c_{uv}$ and conserves flow at every vertex except $s$ and $t$.</p>
<p>For each original arc keep a pair of residual arcs:</p>
<table class="data-table left">
<thead><tr><th>Residual direction</th><th>Capacity</th><th>Meaning</th></tr></thead>
<tbody>
<tr><td>Forward, $u\to v$</td><td>$c_{uv}-f_{uv}$</td><td>increase the original flow</td></tr>
<tr><td>Reverse, $v\to u$</td><td>$f_{uv}$</td><td>cancel original flow</td></tr>
</tbody></table>
<p>Only residual arcs with positive capacity are used. If the original network has two opposite arcs, their residual pairs are kept distinct.</p>`,
    },
    {
      title: 'The Edmonds–Karp algorithm',
      html: R`
<ol>
<li>Initialise every arc flow to zero.</li>
<li>Run breadth-first search (BFS) from $s$ over residual arcs of positive capacity, storing predecessor arcs.</li>
<li>If BFS cannot reach $t$, stop.</li>
<li>Recover the path $P$ and set $\delta=\min_{e\in P}r_e$ (the bottleneck residual capacity).</li>
<li>Decrease the residual capacity of each path arc by $\delta$ and increase its paired reverse capacity by $\delta$.</li>
<li>Repeat from step 2.</li>
</ol>
<p>Each augmentation raises the flow value by $\delta$. “Shortest” means <b>fewest arcs</b>, regardless of capacity.</p>
<div class="callout"><div class="callout-title">Conventions stated in the solved exercises (10E)</div>“BFS visits residual neighbours alphabetically and marks a vertex on first discovery. Use only positive residual capacities.” For each BFS path the exercise asks for its residual capacities and its bottleneck; then write the flow value after the augmentation. (Stopping the BFS as soon as $t$ is discovered gives the same path; the trainer does this.)</div>`,
    },
    {
      title: 'Why reverse arcs are needed: the unit-capacity example',
      html: R`
<p>Network: $s\to a$, $s\to b$, $a\to c$, $a\to d$, $b\to c$, $c\to t$, $d\to t$, all of capacity 1.</p>
<ol>
<li>First BFS path: $s\to a\to c\to t$, $\delta=1$. Flow value 1. No further path exists using only forward arcs: a purely greedy method would stop here with a non-maximum flow.</li>
<li>In the residual network, $a\to c$ has disappeared ($r_{ac}=0$) and the reverse arc $c\to a$ has appeared ($r_{ca}=1$). BFS reaches the vertices in the order $s,b,c,a,d,t$ and finds $s\to b\to c\to a\to d\to t$, with bottleneck 1. The step $c\to a$ <b>cancels</b> the unit previously sent from $a$ to $c$.</li>
<li>After rerouting, the two units follow $s\to a\to d\to t$ and $s\to b\to c\to t$; $f_{ac}=0$ and the value is 2.</li>
<li>Both arcs leaving $s$ are saturated, so BFS reaches only $s$. For $S=\{s\}$ the cut capacity is $c_{sa}+c_{sb}=2$: flow value equals cut capacity, which proves optimality.</li>
</ol>`,
    },
    {
      title: 'Optimality: max flow = min cut',
      html: R`
<p>At termination let $S$ be the set of vertices reachable from $s$ in the residual network. Then</p>
<ul>
<li>every original arc <b>leaving</b> $S$ is saturated (otherwise its head would be reachable);</li>
<li>every original arc <b>entering</b> $S$ carries zero flow (otherwise its reverse arc would make the tail reachable).</li>
</ul>
<p>So the net flow across the cut equals its capacity. Since no feasible flow can exceed the capacity of any cut, the current flow is maximum and the cut is minimum.</p>
<h3>Complexity</h3>
<p>There are $O(nm)$ augmentations: residual BFS distances from $s$ never decrease; every augmentation saturates at least one residual arc $(u,v)$; before that arc can be saturated again an augmentation must use its reverse, which forces the BFS distance to $u$ to grow by at least two. A finite BFS distance is at most $n-1$, so each residual arc is saturated only $O(n)$ times. Each augmentation costs $O(m)$ (BFS $O(n+m)$, path update $O(n)$), giving $O(nm^2)$, independent of the numeric values of the capacities.</p>`,
    },
    {
      title: 'Solved exercises 3 and 3B, and the lab',
      html: R`
<p><b>Exercise 3.</b> Capacities $sa\,3$, $sb\,2$, $ac\,4$, $ad\,2$, $bc\,2$, $ct\,3$, $dt\,2$.</p>
<ul>
<li>Path 1: $s\to a\to c\to t$, residual capacities $3,4,3$, so $\delta=\min\{3,4,3\}=3$. Now $sa$ and $ct$ are saturated, while $ac$ has one unit left: $r_{ac}=4-3=1$ and the reverse arc has $r_{ca}=f_{ac}=3$.</li>
<li>Path 2: $s\to b\to c\to a\to d\to t$ (uses the reverse arc $c\to a$), residual capacities $2,2,3,2,2$, so $\delta=2$. The reverse step lowers $f_{ac}$ from 3 to 1.</li>
<li>Final flows: $sa\,3$, $sb\,2$, $ac\,1$, $ad\,2$, $bc\,2$, $ct\,3$, $dt\,2$. Flow conservation (inflow = outflow) holds: at $a$, $3=1+2$; at $b$, $2=2$; at $c$, $1+2=3$; at $d$, $2=2$. Value 5. Minimum cut $S=\{s\}$ with capacity $3+2=5$.</li>
</ul>
<p><b>Exercise 3B.</b> Capacities $sa\,5$, $sb\,4$, $ac\,4$, $ad\,2$, $cd\,2$, $ct\,3$, $bd\,4$, $dt\,5$. Paths $s\to a\to c\to t$ (residuals $5,4,3$, $\delta=3$), $s\to a\to d\to t$ (residuals $2,2,5$, $\delta=2$), $s\to b\to d\to t$ (residuals $4,4,3$, $\delta=3$). Value 8. At the end $r_{sb}=1$, so BFS can still leave $s$, but “no positive residual arc enters $t$”. Every vertex except $t$ is reachable: $S=\{s,a,b,c,d\}$ and the cut consists of $ct$ and $dt$ with capacity $3+5=8$. Arc $cd$ ends with flow 0.</p>
<p>Full worked solutions: <a href="#/exercises/10e/5">sheet 10E, exercise 3</a> and <a href="#/exercises/10e/6">exercise 3B</a>.</p>
<p><b>Lab 105c.</b> Capacities $sa\,2$, $sb\,1$, $ac\,3$, $ad\,1$, $bc\,1$, $ct\,2$, $dt\,1$: paths $s\to a\to c\to t$ (2) and $s\to b\to c\to a\to d\to t$ (1), value 3.</p>`,
    },
  ],
  moves: [
    R`For each augmentation write the BFS order (or at least the path), the bottleneck $\delta$ as a minimum of residual capacities, and the new flow value.`,
    R`Keep a small table of flows on the original arcs and update it after each path; a reverse step <b>subtracts</b> $\delta$ from that arc.`,
    R`When BFS fails, list the reachable set $S$, the arcs from $S$ to $\bar S$, and add their capacities.`,
    R`Conclude with the sentence “flow value = cut capacity, so the flow is maximum and the cut is minimum”.`,
  ],
  traps: [
    R`Stopping when no path exists in the <i>original</i> network. Reverse arcs can still open a path (path 2 of exercise 3).`,
    R`Counting arcs that <b>enter</b> $S$ in the cut capacity. Only arcs from $S$ to $\bar S$ count.`,
    R`Choosing the path with the largest bottleneck. Edmonds–Karp takes a path with the <b>fewest arcs</b>, found by BFS with the stated tie rule.`,
    R`Adding $\delta$ to an arc traversed backwards instead of subtracting it.`,
    R`Reporting the cut $S=\{s\}$ out of habit. $S$ is whatever is reachable at the end (exercise 3B: everything except $t$).`,
  ],
  refs: [
    R`Slides 105, <i>Well-Solved Problems</i> (T. Schettini): residual capacity, Edmonds–Karp, unit-capacity example, optimality and complexity.`,
    R`Solved exercises 10E, exercises 3 and 3B. Lab 105c.`,
    R`Slides 106 for the LP view: max-flow / min-cut duality and integrality.`,
  ],
};
