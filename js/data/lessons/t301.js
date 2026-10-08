const R = String.raw;

export default {
  id: 't301',
  lead: R`Heuristics deliberately target the <b>primal</b> side: they look for good feasible solutions and make no attempt at an optimality certificate (slides 102). The outline for class 7 lists constructive methods, local search, metaheuristics, rounding and repair, MIP starts, solver heuristics and computational evaluation.`,
  sections: [
    {
      title: 'Why heuristics, in an exact-methods course',
      html: R`
<ul>
<li>A good incumbent <b>prunes</b> the branch-and-bound tree: every node whose bound cannot beat it is closed at once.</li>
<li>On large instances an exact method may not finish; a heuristic solution together with a dual bound still gives a <b>gap</b>.</li>
<li>Decomposition methods need feasible solutions to turn bounds into answers (Lagrangian heuristics, restricted masters).</li>
</ul>
<p>What a heuristic gives: a feasible solution and therefore a primal bound (an upper bound for a minimisation). What it does not give: any statement about how far that solution is from optimal. That needs a relaxation.</p>`,
    },
    {
      title: 'Constructive heuristics',
      html: R`
<p>Build a solution from nothing, one decision at a time, never undoing a decision.</p>
<table class="data-table left">
<thead><tr><th>Problem</th><th>Greedy rule</th><th>Comment</th></tr></thead>
<tbody>
<tr><td>Knapsack</td><td>Sort by profit/weight ratio, take items while they fit.</td><td>Same order as the LP relaxation; the LP's fractional item is simply left out. Can be arbitrarily bad without the fix “compare with the best single item”.</td></tr>
<tr><td>TSP</td><td><b>Nearest neighbour</b>: from the current city go to the closest unvisited one.</td><td>Fast and myopic: the last edges are forced and often long.</td></tr>
<tr><td>TSP</td><td><b>Insertion</b> (nearest, cheapest, farthest): grow a subtour by inserting one city where it costs least.</td><td>Usually better than nearest neighbour.</td></tr>
<tr><td>Facility location</td><td>Open the facility that reduces total cost most; stop when none helps.</td><td>“Add” heuristic; the reverse is “drop”.</td></tr>
<tr><td>Spanning tree</td><td>Kruskal / Prim.</td><td>Here greedy is <i>optimal</i> (cut property): the exception, not the rule.</td></tr>
</tbody></table>`,
    },
    {
      title: 'Local search',
      html: R`
<p>Start from a solution and repeatedly move to a better <b>neighbour</b>.</p>
<ul>
<li>A <b>neighbourhood</b> $N(x)$ is the set of solutions reachable from $x$ by one <b>move</b> (swap two items, flip one binary, exchange two edges).</li>
<li><b>First improvement</b> takes the first better neighbour found; <b>best improvement</b> scans all and takes the best.</li>
<li>The search stops at a <b>local optimum</b>: no neighbour is better. It need not be a global optimum, and which one is reached depends on the start and on the neighbourhood.</li>
<li>A larger neighbourhood gives better local optima and costs more per iteration.</li>
</ul>
<h3>2-opt for the TSP</h3>
<p>Remove two edges $(a,b)$ and $(c,d)$ of the tour and reconnect with $(a,c)$ and $(b,d)$, reversing the path between $b$ and $c$. For symmetric distances the change in length is</p>
$$\Delta=d_{ac}+d_{bd}-d_{ab}-d_{cd},$$
<p>four look-ups whatever the size of the tour. A tour with no improving 2-opt move is <b>2-optimal</b>. There are $n(n-3)/2$ distinct moves.</p>
<p><b>Worked example</b> (the trainer's preset). Distances: $d_{12}=8$, $d_{13}=3$, $d_{14}=4$, $d_{15}=6$, $d_{23}=6$, $d_{24}=8$, $d_{25}=2$, $d_{34}=3$, $d_{35}=4$, $d_{45}=6$. Nearest neighbour from city 1: $1\to3$ (3), $3\to4$ (3), $4\to5$ (6), $5\to2$ (2), back to 1 (8): length 22. The 2-opt move that removes $(1,3)$ and $(4,5)$ and adds $(1,4)$ and $(3,5)$ has $\Delta=4+4-3-6=-1$: tour $1,4,3,5,2$ of length 21, which is optimal here.</p>`,
    },
    {
      title: 'Metaheuristics: escaping local optima',
      html: R`
<table class="data-table left">
<thead><tr><th>Method</th><th>Idea</th><th>Key parameters</th></tr></thead>
<tbody>
<tr><td><b>Multi-start / GRASP</b></td><td>Repeat (randomised greedy construction + local search); keep the best.</td><td>size of the restricted candidate list</td></tr>
<tr><td><b>Simulated annealing</b></td><td>Accept a worsening move of size $\Delta\gt 0$ with probability $e^{-\Delta/T}$; lower the temperature $T$ gradually.</td><td>initial temperature, cooling schedule</td></tr>
<tr><td><b>Tabu search</b></td><td>Always move to the best neighbour, even if worse; forbid recently reversed moves for a few iterations (tabu list); an <i>aspiration</i> rule overrides the ban for a new best solution.</td><td>tabu tenure</td></tr>
<tr><td><b>Iterated local search</b></td><td>Perturb the local optimum (“kick”), re-run local search, accept or reject.</td><td>perturbation strength</td></tr>
<tr><td><b>Variable neighbourhood search</b></td><td>Switch to a larger neighbourhood when the current one is exhausted.</td><td>neighbourhood sequence</td></tr>
<tr><td><b>Genetic / evolutionary</b></td><td>Maintain a population; combine (crossover) and mutate; select the fittest.</td><td>population size, operators</td></tr>
<tr><td><b>Large neighbourhood search</b></td><td>Destroy part of the solution and repair it, often with a MIP solver on the freed part.</td><td>fraction destroyed</td></tr>
</tbody></table>
<p>Common thread: balance <b>intensification</b> (exploit good regions) and <b>diversification</b> (reach new ones). None of them proves anything about optimality.</p>`,
    },
    {
      title: 'Heuristics based on the LP relaxation and on the solver',
      html: R`
<ul>
<li><b>Rounding and repair.</b> Round the LP solution and fix what breaks. On the workshop, rounding $(1.3,5)$ to $(1,5)$ is infeasible; repairing gives $(1,4)$ with value 41, the starting incumbent of slides 102.</li>
<li><b>Diving.</b> Fix one fractional variable, re-solve the LP, repeat: a fast depth-first plunge.</li>
<li><b>Relax-and-fix, fix-and-optimise.</b> Solve with integrality on a subset of variables, fix them, move on.</li>
<li><b>Improvement heuristics inside the solver</b>: RINS (fix variables on which the incumbent and the LP agree and solve the small remaining MIP), local branching (search within a Hamming-distance ball around the incumbent), feasibility pump (alternate between LP-feasible and integer points to find a first feasible solution).</li>
<li><b>MIP start.</b> Hand your own feasible solution to the solver before the search (<code>set_start_value</code> in JuMP). It becomes the first incumbent, so pruning starts immediately.</li>
<li><b>Solver controls</b> (Gurobi): <code>Heuristics</code> sets the share of effort spent in heuristics; <code>MIPFocus</code> shifts the emphasis between finding feasible solutions (1), proving optimality (2) and moving the bound (3). In the log, an <code>H</code> at the start of a line marks an incumbent found by a heuristic; in lab 104 the incumbent drops 7211.96 → 4753.49 → … → 2956.00 that way before the tree is ever branched.</li>
</ul>`,
    },
    {
      title: 'Evaluating a heuristic',
      html: R`
<ul>
<li><b>Quality:</b> gap to the optimum when known, otherwise to a <b>dual bound</b>: $(z_H-z_{LB})/z_{LB}$ for a minimisation. A gap against the best known solution is weaker evidence.</li>
<li><b>Time</b>, on the same machine and with stated limits; quality-versus-time profiles are more informative than a single number.</li>
<li><b>Robustness:</b> several instances of different sizes and types; for randomised methods several seeds, reporting average and worst case, not only the best run.</li>
<li><b>Fairness:</b> same instances, same time budget, tuned parameters disclosed; compare with a simple baseline and with the solver's own incumbent at the same time limit.</li>
</ul>`,
    },
  ],
  moves: [
    R`When asked to run a heuristic by hand, state the rule and the tie-break, show every step, and give the final objective value.`,
    R`For a 2-opt move name the two removed and the two added edges and compute $\Delta$ from four distances.`,
    R`When asked whether a solution is locally optimal, list (or bound) all moves of the neighbourhood and show none improves.`,
    R`Always say what the result is: a primal bound. If a dual bound is available, compute the gap.`,
  ],
  traps: [
    R`Claiming a heuristic solution is optimal because no improving move exists. That is local optimality for one neighbourhood.`,
    R`Forgetting the closing edge of a tour when computing its length.`,
    R`Using the 2-opt formula with asymmetric costs: reversing the middle path changes its cost too.`,
    R`Reporting only the best of many random runs.`,
    R`Calling the LP-rounded point a solution without checking feasibility.`,
  ],
  refs: [
    R`Course outline, class 7 (topics only; slides not yet released when this lesson was written).`,
    R`L. A. Wolsey, <i>Integer Programming</i>, 2nd ed., chapter 13 (heuristic algorithms).`,
    R`Slides 102 (incumbents, rounding and repair) and lab 104 (heuristic incumbents in the Gurobi log).`,
    R`Sourced external questions on this topic in the question bank (Chalmers, Penn, Gurobi and others) carry their own references.`,
  ],
};
