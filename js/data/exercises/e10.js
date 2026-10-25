// Sheet 10E (Module 1 algorithms). The statements and figures come from the matching trainer preset,
// which holds the instructor's data; the steps summarise the instructor's solved version.
const R = String.raw;
const SRC = '10E Solved Exercises (T. Schettini), section';

export const E10 = [
  {
    n: 1, label: '1', topic: 't105a', title: 'Dijkstra from s', blurb: 'Labels after each selected vertex, then one shortest path to $t$.',
    src: `${SRC} “Exercise 1” and “Solution 1”.`, trainerStatement: true,
    trainer: { drill: 'dijkstra', preset: 'ex1', label: 'Do it step by step in the Dijkstra trainer' },
    parts: [{
      short: 'trace and path', q: R`Run Dijkstra from $s$, record the labels after each selected vertex, and recover one shortest path to $t$. <b>Tie rules:</b> select vertices alphabetically when labels tie; change a predecessor only when the label strictly improves.`,
      hints: [R`After $s$ the labels are $d_a=4$, $d_b=7$, $d_c=2$. Which vertex is selected next, and which label can it improve?`, R`Watch the zero-length arc $(b,d)$ and the tie $d_a=d_b=4$ after $c$ is processed.`],
      check: [{ type: 'int', label: 'Shortest distance from $s$ to $t$', answer: 7 }],
      steps: [
        R`Select $s$: $d_a=4$, $d_b=7$, $d_c=2$, predecessors $s$. Select $c$ (2): $d_b=\min\{7,2+2\}=4$, $p_b$ changes to $c$.`,
        R`Now $d_a=d_b=4$: select $a$ by the alphabetical tie rule. $d_b=\min\{4,5\}=4$ (no change, keep $p_b=c$), $d_t=12$ with $p_t=a$.`,
        R`Select $b$ (4): $d_d=4+0=4$, $p_d=b$. Select $d$ (4): $d_t=\min\{12,4+3\}=7$, $p_t$ changes to $d$; skip $(d,a)$ because $a$ is permanent.`,
        R`Select $t$ (7). Following predecessors: $s\to c\to b\to d\to t$, length $2+2+0+3=7$.`,
      ],
    }],
  },
  {
    n: 2, label: '1B', topic: 't105a', title: 'Dijkstra from t on the reversed graph', blurb: 'Reverse every arc and run Dijkstra from $t$.',
    src: `${SRC} “Exercise 1B” and “Solution 1B”.`, trainerStatement: true,
    trainer: { drill: 'dijkstra', preset: 'ex1b', label: 'Do it step by step in the Dijkstra trainer' },
    parts: [{
      short: 'reversed run', q: R`Reverse every arc of Exercise 1 (same lengths), run Dijkstra from $t$, and recover a shortest path from $t$ to $s$ in the reversed graph. Same tie rules.`,
      hints: [R`In the original graph $t$ has no outgoing arcs; after reversing, $t$ has arcs to $a$ (8) and $d$ (3).`, R`The predecessor of $s$ changes twice. Keep track of every strict improvement.`],
      check: [{ type: 'int', label: 'Distance from $t$ to $s$ in the reversed graph', answer: 7 }],
      steps: [
        R`Select $t$: $d_a=8$, $d_d=3$. Select $d$ (3): $d_b=3+0=3$, $p_b=d$.`,
        R`Select $b$ (3): $d_a=\min\{8,4\}=4$, $d_c=5$, $d_s=10$; $p_a=p_c=p_s=b$.`,
        R`Select $a$ (4): $d_s=\min\{10,8\}=8$, $p_s=a$. Select $c$ (5): $d_s=\min\{8,7\}=7$, $p_s=c$. Select $s$ (7).`,
        R`Path $t\to d\to b\to c\to s$, length $3+0+2+2=7$. The predecessor of $s$ went $b\to a\to c$.`,
      ],
    }],
  },
  {
    n: 3, label: '2', topic: 't105b', title: 'Kruskal with ties', blurb: 'Five vertices, equal weights: trace, tree weight, uniqueness.',
    src: `${SRC} “Exercise 2” and “Solution 2”.`, trainerStatement: true,
    trainer: { drill: 'kruskal', preset: 'ex2', label: 'Do it step by step in the Kruskal trainer' },
    parts: [
      {
        short: 'trace', q: R`Run Kruskal, recording every acceptance or rejection, and give a minimum spanning tree with its weight. Break equal-weight ties alphabetically by edge name.`,
        hints: [R`Sorted order: $ab(1), ac(2), bc(2), cd(3), de(3), bd(4), ce(5), ae(8)$.`, R`Reject an edge when its two ends are already in the same component.`],
        check: [{ type: 'int', label: 'Weight of the minimum spanning tree', answer: 9 }],
        steps: [
          R`Accept $ab$ (1), accept $ac$ (2), reject $bc$ (2): it would close the cycle $a,b,c,a$.`,
          R`Accept $cd$ (3), accept $de$ (3). Four edges span the five vertices: stop. $T=\{ab,ac,cd,de\}$, weight $1+2+3+3=9$.`,
        ],
      },
      {
        short: 'uniqueness', q: R`Is the minimum spanning tree unique? Justify, including why weight 8 is impossible.`,
        hints: [R`Try swapping the rejected edge with an accepted edge of the same weight.`],
        steps: [
          R`Every spanning tree has four edges. The four smallest weights sum to 8, but any four edges of total weight 8 contain the cycle $ab, ac, bc$. So 8 is impossible and, with integer weights, 9 is a lower bound that $T$ attains.`,
          R`Replacing $ac$ by $bc$ gives $\{ab,bc,cd,de\}$, also of weight 9. The minimum spanning tree is <b>not unique</b>.`,
        ],
      },
    ],
  },
  {
    n: 4, label: '2B', topic: 't105b', title: 'Kruskal on eight vertices', blurb: 'Distinct weights: trace and total weight.',
    src: `${SRC} “Exercise 2B” and “Solution 2B”.`, trainerStatement: true,
    trainer: { drill: 'kruskal', preset: 'ex2b', label: 'Do it step by step in the Kruskal trainer' },
    parts: [{
      short: 'trace', q: R`Run Kruskal; record each acceptance or rejection and the final total weight.`,
      hints: [R`Increasing order: $ab, ef, ae, bf, bc, fg, cg, cd, gh, dh, bg, cf$. Stop after 7 accepted edges.`],
      check: [{ type: 'int', label: 'Total weight', answer: 34 }],
      steps: [
        R`Accept $ab$ (1), $ef$ (2), $ae$ (3). Reject $bf$ (4): cycle $b,a,e,f,b$.`,
        R`Accept $bc$ (5), $fg$ (6). Reject $cg$ (7): cycle $c,b,a,e,f,g,c$.`,
        R`Accept $cd$ (8), $gh$ (9): seven edges, stop. Tree $\{ab,ef,ae,bc,fg,cd,gh\}$, weight $1+2+3+5+6+8+9=34$.`,
        R`All weights are distinct, so the minimum spanning tree is unique. Edges $dh$, $bg$, $cf$ are never examined.`,
      ],
    }],
  },
  {
    n: 5, label: '3', topic: 't105c', title: 'Edmonds–Karp with a reverse arc', blurb: 'Two augmenting paths, one through a reverse arc; final flow and minimum cut.',
    src: `${SRC} “Exercise 3” and “Solution 3”.`, trainerStatement: true,
    trainer: { drill: 'maxflow', preset: 'ex3', label: 'Do it step by step in the max-flow trainer' },
    parts: [{
      short: 'augmentations and cut', q: R`Start from zero flow and run Edmonds–Karp (BFS visits residual neighbours alphabetically). Give each path with its residual capacities and bottleneck, the final flows, and a minimum cut.`,
      hints: [R`The first BFS path is $s\to a\to c\to t$. After it, look at the residual arc $c\to a$.`, R`A <b>reverse</b> residual arc lets you cancel flow that was sent earlier.`],
      check: [{ type: 'int', label: 'Maximum flow value', answer: 5 }],
      steps: [
        R`Path 1: $s\to a\to c\to t$, bottleneck $\min\{3,4,3\}=3$. Flow 3; $sa$ and $ct$ saturated, $ac$ has 1 left.`,
        R`Residual network: $r_{ac}=1$ and $r_{ca}=3$. Path 2: $s\to b\to c\to a\to d\to t$ with residuals $2,2,3,2,2$, bottleneck 2. The step $c\to a$ is a reverse arc: it lowers $f_{ac}$ from 3 to 1.`,
        R`Final flows: $sa=3$, $sb=2$, $ac=1$, $ad=2$, $bc=2$, $ct=3$, $dt=2$. Value $3+2=5$. Conservation: at $a$, $3=1+2$; at $b$, $2=2$; at $c$, $1+2=3$; at $d$, $2=2$.`,
        R`A last BFS reaches only $S=\{s\}$: the cut $\{sa,sb\}$ has capacity $3+2=5$. Flow value = cut capacity, so both are optimal.`,
      ],
    }],
  },
  {
    n: 6, label: '3B', topic: 't105c', title: 'Edmonds–Karp, second network', blurb: 'Three augmenting paths and the minimum cut next to $t$.',
    src: `${SRC} “Exercise 3B” and “Solution 3B”.`, trainerStatement: true,
    trainer: { drill: 'maxflow', preset: 'ex3b', label: 'Do it step by step in the max-flow trainer' },
    parts: [{
      short: 'augmentations and cut', q: R`Run Edmonds–Karp from zero flow (alphabetical BFS). Show each augmenting path and bottleneck, then identify a minimum cut.`,
      hints: [R`Three augmenting paths are needed. After them, check which vertices a BFS can still reach.`],
      check: [{ type: 'int', label: 'Maximum flow value', answer: 8 }],
      steps: [
        R`Path 1: $s\to a\to c\to t$, residuals $5,4,3$, bottleneck 3. Flow 3, $ct$ saturated.`,
        R`Path 2: $s\to a\to d\to t$, residuals $2,2,5$, bottleneck 2. Flow 5, $sa$ saturated.`,
        R`Path 3: $s\to b\to d\to t$, residuals $4,4,3$, bottleneck 3. Flow 8; both sink arcs saturated.`,
        R`BFS still leaves $s$ ($r_{sb}=1$) and reaches $S=\{s,a,b,c,d\}$, but no residual arc enters $t$. Cut arcs $ct$, $dt$: capacity $3+5=8$ = flow value, so the flow is maximum.`,
      ],
    }],
  },
  {
    n: 7, label: '4', topic: 't105d', title: 'Hungarian method, 3×3', blurb: 'Reductions, one stalled search, one dual update, optimality certificate.',
    src: `${SRC} “Exercise 4” and “Solution 4”.`, trainerStatement: true,
    trainer: { drill: 'hungarian', preset: 'ex4', label: 'Do it step by step in the Hungarian trainer' },
    parts: [{
      short: 'full run', q: R`Apply row and column reductions, then assign workers in numerical order, searching zero reduced-cost pairs by BFS with jobs in numerical order. Show any dual update, the augmenting path and an optimality certificate.`,
      hints: [R`Row minima $u=(2,1,3)$; every column already has a zero, so $v=(0,0,0)$.`, R`The search from $W_3$ stalls with $S=\{W_1,W_3\}$, $T=\{J_1\}$. The update $\Delta$ is the smallest reduced cost with $i\in S$, $j\notin T$.`],
      check: [{ type: 'int', label: 'Minimum total cost', answer: 7 }],
      steps: [
        R`Reductions: $u=(2,1,3)$, $v=(0,0,0)$, lower bound $2+1+3=6$.`,
        R`$W_1\to J_1$ (its only zero). $W_2$ has zeros at $J_2,J_3$: take $J_2$ (first free job).`,
        R`From $W_3$: $W_3\to J_1\to W_1$; no free job reachable. $S=\{W_1,W_3\}$, $T=\{J_1\}$. $\Delta=\min\{1,4,2,5\}=1$: $u=(3,1,4)$, $v=(-1,0,0)$, lower bound 7. A new zero appears at $W_1J_2$.`,
        R`Continue the same search along the alternating path $W_3\to J_1\to W_1\to J_2\to W_2\to J_3$ ($J_3$ is free). Flipping it gives $W_1\to J_2$, $W_2\to J_3$, $W_3\to J_1$. Cost $3+1+3=7$ equals $\sum u_i+\sum v_j=7$, and $u_i+v_j\le c_{ij}$ everywhere: optimal.`,
      ],
    }],
  },
  {
    n: 8, label: '5', topic: 't105e', title: 'Knapsack table, capacity 8', blurb: 'Fill $F(i,c)$ and recover an optimal subset.',
    src: `${SRC} “Exercise 5” and “Solution 5”.`, trainerStatement: true,
    trainer: { drill: 'knapsack-dp', preset: 'ex5', label: 'Fill the table in the knapsack trainer' },
    parts: [{
      short: 'table and subset', q: R`Compute $F(i,c)$ for $i=0,\dots,4$ and $c=0,\dots,8$, then recover an optimal subset.`,
      hints: [R`$F(i,c)=\max\{F(i-1,c),\ p_i+F(i-1,c-w_i)\}$ when item $i$ fits, otherwise $F(i-1,c)$. Both candidates come from the row above.`, R`To recover: if $F(i,c)\gt F(i-1,c)$ the item is taken (subtract its weight); otherwise skip it.`],
      check: [{ type: 'int', label: '$F(4,8)$', answer: 14 }],
      steps: [
        R`Row 1 (weight 2, profit 4): 4 from capacity 2 on. Row 2: $F(2,3)=5$, $F(2,5)=\max\{4,5+F(1,2)\}=9$.`,
        R`Row 3: $F(3,8)=\max\{9,7+F(2,4)\}=12$, $F(3,6)=11$, $F(3,7)=12$. Row 4: $F(4,8)=\max\{12,9+F(3,3)\}=14$; $F(4,7)=13$.`,
        R`Recover: $F(4,8)=14\gt12$: take item 4, go to $(3,3)$. Item 3 does not fit: go to $(2,3)$. $F(2,3)=5\gt4$: take item 2, capacity 0.`,
        R`Optimal subset $\{2,4\}$: weight $3+5=8$, profit $5+9=14$.`,
      ],
    }],
  },
];
