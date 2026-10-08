const R = String.raw;

export default {
  id: 't101',
  lead: R`Discrete optimisation concerns problems in which some decisions can take only a finite or countable set of values; the goal is the best feasible combination of those decisions. The first class fixes the vocabulary, the model classes and three models that come back all term.`,
  sections: [
    {
      title: 'An optimisation problem',
      html: R`
$$\max_{x\in X}f(x)$$
<ul>
<li>$x$ is the vector of <b>decision variables</b>;</li>
<li>$f(x)$ is the <b>objective function</b>, used to compare feasible decisions;</li>
<li>$X$ is the <b>feasible set</b>: all $x$ that satisfy every constraint and every variable domain.</li>
</ul>
<p>An optimal solution is $x^*\in\arg\max_{x\in X}f(x)$: it is feasible, and no other feasible decision has a larger objective value.</p>`,
    },
    {
      title: 'Four model classes',
      html: R`
<table class="data-table left">
<thead><tr><th>Class</th><th>Model</th><th>Use</th></tr></thead>
<tbody>
<tr><td><b>LP</b> linear program</td><td>$\max c^\top x$ s.t. $Ax\le b$, $x\ge 0$</td><td>Linear objective and constraints, continuous variables.</td></tr>
<tr><td><b>IP</b> integer program</td><td>… $x\in\mathbb{Z}^n_+$</td><td>Counts and indivisible choices.</td></tr>
<tr><td><b>BP</b> binary program</td><td>… $x\in\{0,1\}^n$</td><td>Yes-or-no decisions.</td></tr>
<tr><td><b>MIP</b> mixed-integer program</td><td>… $x_i\in\mathbb{Z}_+$ for $i\le k$, $x_j\in\mathbb{R}_+$ for $j\gt k$</td><td>Some variables integer, the rest continuous.</td></tr>
</tbody></table>
<p>Most models in the course are <b>mixed-integer linear programs</b>.</p>`,
    },
    {
      title: 'Three models to know by heart',
      html: R`
<h3>Knapsack</h3>
<p>Select items without exceeding a capacity. Item $i$ has value $v_i$ and uses $a_i$ units of the capacity $b$; $x_i=1$ if it is selected.</p>
$$\max\sum_{i\in I}v_ix_i\qquad\text{s.t.}\qquad\sum_{i\in I}a_ix_i\le b,\qquad x_i\in\{0,1\}.$$
<h3>Assignment</h3>
<p>Match equally many workers and tasks at minimum cost; $x_{ij}=1$ if worker $i$ gets task $j$.</p>
$$\min\sum_{i\in W}\sum_{j\in J}c_{ij}x_{ij}\qquad\text{s.t.}\qquad\sum_{j\in J}x_{ij}=1\ \ \forall i\in W,\qquad\sum_{i\in W}x_{ij}=1\ \ \forall j\in J,\qquad x_{ij}\in\{0,1\}.$$
<p>The first family says every worker receives exactly one task (this is the readiness-check question: $\sum_{j=1}^3x_{ij}=1$ means worker $i$ gets exactly one of the three tasks); the second says every task goes to exactly one worker.</p>
<h3>Set covering</h3>
<p>Choose a minimum-cost collection of sets that covers every requirement; $a_{ij}=1$ if set $j$ covers requirement $i$, and $y_j=1$ if set $j$ is chosen.</p>
$$\min\sum_{j\in J}c_jy_j\qquad\text{s.t.}\qquad\sum_{j\in J}a_{ij}y_j\ge 1\ \ \forall i\in I,\qquad y_j\in\{0,1\}.$$
<p>Changing “$\ge 1$” to “$\le 1$” gives set <i>packing</i> and “$=1$” gives set <i>partitioning</i>; these three share the 0–1 matrix and differ only in the sense of the rows.</p>`,
    },
    {
      title: 'Why not simply enumerate?',
      html: R`
<p>The travelling salesperson problem (visit every location once and return, at minimum total distance) shows the <b>combinatorial explosion</b>.</p>
<ul>
<li>9 points, start fixed: $8!=40{,}320$ directed tours; with symmetric costs a tour and its reverse have the same length, leaving $8!/2=20{,}160$ distinct tours. A computer can try them all.</li>
<li>100 points, start fixed: $99!\approx 9.33\times10^{155}$ directed tours. At one million tours per second, enumeration needs about $3\times10^{142}$ years; the universe is about $1.4\times10^{10}$ years old.</li>
<li>Yet a tour through all 24,727 pubs of the United Kingdom has been solved to proven optimality (University of Waterloo TSP project). It was not done by enumeration.</li>
</ul>
<p>The purpose of the course is to learn how to solve such problems well: branch and bound and formulations; optimality, bounds, relaxations, well-solved problems and total unimodularity; exponential formulations, cutting planes, valid inequalities and lifting; primal heuristics; decompositions.</p>`,
    },
    {
      title: 'The readiness check, answered',
      html: R`
<ol>
<li>$\sum_{j=1}^3x_{ij}=1$ with binary $x_{ij}$: worker $i$ receives exactly one of the three tasks.</li>
<li>With $x,y\ge 0$ and $2x+y\le 4$: $(1,2)$ gives $2x+y=4$, feasible (on the boundary); $(2,1)$ gives $5$, infeasible; $(0.5,1)$ gives $2$, feasible.</li>
<li>$0\le q\le 10y$, $y\in\{0,1\}$: if $y=0$ then $q=0$. If $y=1$ then $0\le q\le 10$; $q$ need <b>not</b> equal 10.</li>
<li>Arcs $s\to a$, $a\to t$, $s\to t$: the path through $a$ is $s\to a\to t$. Travelling from $t$ to $s$ is impossible, because arcs are directed and none leaves $t$.</li>
</ol>`,
    },
    {
      title: 'Course facts worth remembering',
      html: R`
<ul>
<li>Assessment: assignments 15%, midterm 20%, individual project 25%, final examination 40%. <b>To pass you need at least 50% on the final examination and at least 50% on the project</b>, regardless of the weighted total (course outline).</li>
<li>The final-examination period is 9–22 December 2026; the date for this course, the exam duration and the permitted materials are announced separately.</li>
<li>Exams permit neither AI nor outside communication unless authorised. You must be able to do every trace and derivation on paper.</li>
<li>Textbook: L. A. Wolsey, <i>Integer Programming</i>, 2nd edition (Wiley, 2021).</li>
<li>Software in the labs: Julia with JuMP and Gurobi.</li>
</ul>`,
    },
  ],
  moves: [
    R`A model answer has four labelled parts: sets and data, decision variables with their domains, objective, constraints (each with a few words saying what it enforces).`,
    R`Say in words what each binary variable equals 1 for; most modelling marks are lost on undefined variables.`,
    R`Check a model on a tiny instance: plug in one feasible and one infeasible decision.`,
  ],
  traps: [
    R`Writing $\sum_jx_{ij}\le 1$ when every worker <i>must</i> get a task (that allows idle workers), or forgetting the second family of assignment constraints.`,
    R`Forgetting variable domains. Without $x\in\{0,1\}$ a knapsack model is a different (much easier) problem.`,
    R`Thinking $q\le 10y$ forces $q=10$ when $y=1$: it only allows it.`,
    R`Confusing covering ($\ge 1$), packing ($\le 1$) and partitioning ($=1$).`,
  ],
  refs: [
    R`Slides 101, <i>Course Introduction</i> (T. Schettini), all 13 pages.`,
    R`Course outline INDU 6361, Fall 2026.`,
    R`L. A. Wolsey, <i>Integer Programming</i>, 2nd ed., chapter 1.`,
  ],
};
