const R = String.raw;

export default {
  id: 't105a',
  lead: R`Not every discrete problem needs a general MIP solver. A problem has <b>structure</b> when properties of its feasible solutions let us avoid generic enumeration. Shortest paths with nonnegative lengths are the first example: Dijkstra's algorithm solves them in polynomial time, and its trace is a standard exam exercise.`,
  sections: [
    {
      title: 'Well-solved problems: the big picture',
      html: R`
<p>Useful structure makes a discrete problem easy in two different ways:</p>
<ol>
<li>a <b>specialised algorithm</b> works directly on the combinatorial structure (this lecture);</li>
<li>an <b>integral LP formulation</b> describes a polyhedron whose extreme points are already integer (slides 106).</li>
</ol>
<p>An algorithm is <b>efficient</b> when its running time grows polynomially with the encoded input size. With $n$ vertices and $m$ edges:</p>
<table class="data-table left">
<thead><tr><th>Problem</th><th>Representative algorithm</th><th>Complexity</th></tr></thead>
<tbody>
<tr><td>Shortest path, nonnegative lengths</td><td>Dijkstra</td><td>$O((n+m)\log n)$</td></tr>
<tr><td>Minimum spanning tree</td><td>Kruskal</td><td>$O(m\log m)$</td></tr>
<tr><td>Maximum flow</td><td>Edmonds–Karp</td><td>$O(nm^2)$</td></tr>
<tr><td>Assignment</td><td>Hungarian method</td><td>$O(n^3)$</td></tr>
<tr><td>0–1 knapsack</td><td>Dynamic programme</td><td>$O(nC)$, pseudo-polynomial</td></tr>
</tbody></table>
<p>Well-solved problems matter beyond their direct applications: they are used to <b>compute relaxation bounds</b> and are <b>embedded as subproblems</b> in decomposition methods.</p>`,
    },
    {
      title: "Dijkstra's algorithm",
      html: R`
<p>Directed graph, arc lengths $\ell_{uv}\ge 0$, source $s$. Maintain tentative distances $d_v$, predecessors $p_v$ and a set $S$ of permanently labelled vertices.</p>
<ol>
<li>Set $d_s=0$, all other distances to $\infty$, and $S=\emptyset$.</li>
<li>Select $u\notin S$ with the smallest finite $d_u$ and add $u$ to $S$.</li>
<li>For each arc $(u,v)$ with $v\notin S$: if $d_u+\ell_{uv}\lt d_v$, set $d_v=d_u+\ell_{uv}$ and $p_v=u$.</li>
<li>Repeat until no unsettled vertex has a finite distance.</li>
</ol>
<p>Follow predecessors backwards to recover a shortest path. Unreachable vertices keep distance $\infty$.</p>
<div class="callout"><div class="callout-title">Exam tie rules (solved exercises)</div>When several unsettled vertices have the same smallest label, select them <b>alphabetically</b>. Change a predecessor only when the label <b>strictly</b> improves (the test in step 3 is “$\lt$”).</div>`,
    },
    {
      title: 'The lecture example',
      html: R`
<p>Arcs: $s\to a$ (4), $s\to b$ (2), $b\to a$ (1), $a\to c$ (4), $b\to c$ (5), $b\to d$ (7), $c\to d$ (1), $c\to t$ (5), $d\to t$ (2).</p>
<table class="data-table">
<thead><tr><th>Iteration</th><th>Selected</th><th>$d_a$</th><th>$d_b$</th><th>$d_c$</th><th>$d_d$</th><th>$d_t$</th><th>What happened</th></tr></thead>
<tbody>
<tr><td>1</td><td>$s$</td><td>4</td><td>2</td><td>∞</td><td>∞</td><td>∞</td><td style="text-align:left">$p_a=s$, $p_b=s$</td></tr>
<tr><td>2</td><td>$b$</td><td>3</td><td>2</td><td>7</td><td>9</td><td>∞</td><td style="text-align:left">$d_a=\min\{4,2+1\}=3$: $p_a$ changes from $s$ to $b$</td></tr>
<tr><td>3</td><td>$a$</td><td>3</td><td>2</td><td>7</td><td>9</td><td>∞</td><td style="text-align:left">$d_c=\min\{7,3+4\}=7$: no improvement, keep $p_c=b$</td></tr>
<tr><td>4</td><td>$c$</td><td>3</td><td>2</td><td>7</td><td>8</td><td>12</td><td style="text-align:left">$p_d=c$, $p_t=c$</td></tr>
<tr><td>5</td><td>$d$</td><td>3</td><td>2</td><td>7</td><td>8</td><td>10</td><td style="text-align:left">$d_t=\min\{12,8+2\}=10$: $p_t$ changes to $d$</td></tr>
<tr><td>6</td><td>$t$</td><td>3</td><td>2</td><td>7</td><td>8</td><td>10</td><td style="text-align:left">all labels permanent</td></tr>
</tbody></table>
<p>Following predecessors: $s\to b\to c\to d\to t$, length $2+5+1+2=10$. The route through $a$ ($s\to b\to a\to c\to d\to t$) has the same length; it is not the one reported because of iteration 3: the tie did not change $p_c$.</p>`,
    },
    {
      title: 'Why a selected label is final',
      html: R`
<p>When $u$ is selected it has the smallest tentative distance outside $S$. Any alternative path to $u$ must first leave $S$ at some vertex $v$. Relaxations from $S$ have already given $v$ a tentative distance no larger than the length of that path's prefix. Since $d_u\le d_v$ and the remaining arc lengths are <b>nonnegative</b>, the alternative path cannot improve $d_u$.</p>
<p><b>Negative lengths invalidate this argument</b>: a later arc could bring the alternative path below $d_u$. Dijkstra is then not guaranteed to be correct; a label-correcting method such as Bellman–Ford is needed.</p>
<h3>Complexity</h3>
<p>At most $n$ selections and $m$ arc relaxations in total. With an indexed binary heap, extracting the minimum costs $O(\log n)$ (at most $n$ times) and decreasing a label costs $O(\log n)$ (at most $m$ times): $O(n)+O(n\log n)+O(m\log n)=O((n+m)\log n)$. Scanning an unsorted array instead gives $O(n^2+m)$.</p>`,
    },
    {
      title: 'Solved exercises 1 and 1B',
      html: R`
<p><b>Exercise 1.</b> Arcs $s\to a$ (4), $s\to b$ (7), $s\to c$ (2), $c\to b$ (2), $a\to b$ (1), $a\to t$ (8), $b\to d$ (0), $d\to t$ (3), $d\to a$ (1). Dijkstra from $s$ selects $s,c,a,b,d,t$; final labels $d_a=4$, $d_b=4$, $d_c=2$, $d_d=4$, $d_t=7$; shortest path $s\to c\to b\to d\to t$ of length 7.</p>
<table class="data-table">
<thead><tr><th>Selected</th><th>$d_a$</th><th>$d_b$</th><th>$d_c$</th><th>$d_d$</th><th>$d_t$</th></tr></thead>
<tbody>
<tr><td>$s$</td><td>4</td><td>7</td><td>2</td><td>∞</td><td>∞</td></tr>
<tr><td>$c$</td><td>4</td><td>4</td><td>2</td><td>∞</td><td>∞</td></tr>
<tr><td>$a$</td><td>4</td><td>4</td><td>2</td><td>∞</td><td>12</td></tr>
<tr><td>$b$</td><td>4</td><td>4</td><td>2</td><td>4</td><td>12</td></tr>
<tr><td>$d$</td><td>4</td><td>4</td><td>2</td><td>4</td><td>7</td></tr>
<tr><td>$t$</td><td>4</td><td>4</td><td>2</td><td>4</td><td>7</td></tr>
</tbody></table>
<p>Points the solution insists on: when $c$ is selected, $d_b$ drops from 7 to 4 and $p_b$ changes from $s$ to $c$; then $d_a=d_b=4$ and $a$ goes first by the alphabetical rule, where $\min\{4,4+1\}=4$ keeps $p_b=c$. The zero-length arc $b\to d$ gives $d_d=4$: a zero-length arc can give consecutive selected vertices the same distance. At $d$, the arc $(d,a)$ is skipped because $a$ is already permanent (its candidate $4+1=5$ would not improve $d_a$ anyway), and $4+3\lt 12$ changes $p_t$ to $d$. Final predecessors: $p_a=s$, $p_b=c$, $p_c=s$, $p_d=b$, $p_t=d$. The directed cycle $a\to b\to d\to a$ has length 2, so going around it can never shorten a path.</p>
<p><b>Exercise 1B.</b> Reverse every arc and run Dijkstra from $t$: the order is $t,d,b,a,c,s$ and $d_s=7$ along $t\to d\to b\to c\to s$. Reversing all arcs turns “shortest paths <i>to</i> $t$ from everywhere” into a single run from $t$.</p>
<p>Both are in the trainer, graded step by step with the same tie rules.</p>`,
    },
  ],
  moves: [
    R`Draw a table with one row per iteration: selected vertex, then the label of every vertex after relaxing its outgoing arcs.`,
    R`State the tie rules you are using in one line before the table.`,
    R`Write each relaxation as $\min\{\text{old},\ d_u+\ell_{uv}\}$ so the marker can follow it.`,
    R`Finish with the predecessor of every vertex, the path read backwards from the target, and its length as a sum of arc lengths.`,
  ],
  traps: [
    R`Relabelling a vertex that is already permanent.`,
    R`Changing the predecessor on a tie (“$\le$” instead of “$\lt$”): the path you report will differ from the expected one even though its length is right.`,
    R`Selecting the vertex that was just improved instead of the smallest label among <i>all</i> unsettled vertices.`,
    R`Stopping when the target gets its first finite label. A label is final only when the vertex is <b>selected</b>: in the lecture example $d_t$ is 12 before it becomes 10.`,
    R`Applying Dijkstra to a graph with a negative arc length.`,
    R`Treating directed arcs as two-way streets.`,
  ],
  refs: [
    R`Slides 105, <i>Well-Solved Problems</i> (T. Schettini): structure, complexity table, Dijkstra with example, correctness argument and complexity.`,
    R`Solved exercises 10E, exercises 1 and 1B. Lab 105a (shortest paths, including A* with a consistent heuristic).`,
    R`Ahuja, Magnanti and Orlin, <i>Network Flows</i> (1993), cited on the slides.`,
  ],
};
