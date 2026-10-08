const R = String.raw;

export default {
  id: 't501',
  lead: R`The labs use Julia with JuMP and Gurobi. The exam is on paper, but questions can ask you to read a solver log, interpret a termination status, or say what a callback must do. This page collects what the notebooks use.`,
  sections: [
    {
      title: 'A JuMP model in six lines',
      html: R`
<pre><code>using JuMP, Gurobi

model = Model(Gurobi.Optimizer)
@variable(model, x[1:n], Bin)                       # Int for integers, nothing for continuous
@objective(model, Max, sum(v[i] * x[i] for i in 1:n))
@constraint(model, sum(a[i] * x[i] for i in 1:n) <= b)
optimize!(model)</code></pre>
<p>Settings used in the labs: <code>set_time_limit_sec(model, 120.0)</code>, <code>set_optimizer_attribute(model, "Threads", 1)</code>, <code>set_optimizer_attribute(model, "Seed", 0)</code>. Useful Gurobi parameters: <code>MIPGap</code> (relative gap at which to stop), <code>TimeLimit</code>, <code>Cuts</code>, <code>Heuristics</code>, <code>MIPFocus</code>, <code>Presolve</code>, <code>OutputFlag</code>.</p>`,
    },
    {
      title: 'After the solve: status first, values second',
      html: R`
<pre><code>println(termination_status(model))     # OPTIMAL, TIME_LIMIT, INFEASIBLE, ...
if has_values(model)                    # is there a feasible point to read?
    println(objective_value(model))     # value of the incumbent      (primal bound)
    println(objective_bound(model))     # best bound                  (dual bound)
    println(relative_gap(model))        # |zP - zD| / |zP|
    xval = value.(x)
end
solution_summary(model)</code></pre>
<p>This is the rule of slides 102 in code: “check termination and solution availability before reading solution values”. <code>TIME_LIMIT</code> with a solution means: report value, bound and gap. <code>TIME_LIMIT</code> without one proves nothing about feasibility.</p>
<p><b>LP relaxation of a MIP.</b> <code>relax_integrality(model)</code> turns integer and binary variables into continuous ones with their bounds; solving then gives the root bound used in lab 104 to compare formulations. (It returns a function that undoes the relaxation.)</p>
<p><b>MIP start.</b> <code>set_start_value(x[i], 1.0)</code> passes a known feasible solution to the solver.</p>`,
    },
    {
      title: 'Reading a Gurobi log',
      html: R`
<p>Lab 104 (facility location, 80 customers and 12 facilities, aggregated formulation) prints lines of this kind:</p>
<pre><code>Root relaxation: objective 1.884197e+03, ...

    Nodes    |    Current Node    |     Objective Bounds      |     Work
 Expl Unexpl |  Obj  Depth IntInf | Incumbent    BestBd   Gap | It/Node Time
H    0     0                    7211.96 ...
H    0     0                    4753.49 ...
     0     0 1884.20    0   ...
...
Cutting planes:
  Implied bound: 225
  Relax-and-lift: 10

Explored 1 nodes ...
Best objective 2.956000e+03, best bound 2.956000e+03, gap 0.0000%</code></pre>
<table class="data-table left">
<thead><tr><th>Item</th><th>Meaning</th></tr></thead>
<tbody>
<tr><td><code>Root relaxation: objective</code></td><td>LP value at the root: the first dual bound (1884.197 here; the optimum is 2956.00, a 36.26% root gap for this formulation).</td></tr>
<tr><td><code>Expl / Unexpl</code></td><td>Nodes explored / still open.</td></tr>
<tr><td><code>Obj, Depth, IntInf</code></td><td>LP value of the current node, its depth, and the number of integer variables with fractional values.</td></tr>
<tr><td><code>Incumbent</code></td><td>Best feasible value so far (primal bound).</td></tr>
<tr><td><code>BestBd</code></td><td>Global dual bound.</td></tr>
<tr><td><code>Gap</code></td><td>$|z_P-z_D|/|z_P|$.</td></tr>
<tr><td><code>H</code> or <code>*</code> at the start of a line</td><td>New incumbent found by a heuristic (<code>H</code>) or by an integral node LP (<code>*</code>).</td></tr>
<tr><td><code>Cutting planes:</code> summary</td><td>Cuts <b>remaining in the final LP relaxation</b>, by family; not every cut generated.</td></tr>
<tr><td><code>Explored 1 nodes</code></td><td>Solved at the root: cuts and heuristics closed the gap without branching.</td></tr>
</tbody></table>
<p>In the same lab the disaggregated formulation has LP value 2956.00 at the root: the gap is zero before any cut.</p>`,
    },
    {
      title: 'Callbacks in JuMP (labs 202b and 202c)',
      html: R`
<pre><code>set_optimizer_attribute(model, "LazyConstraints", 1)      # tell Gurobi rows are omitted

function lazy_callback(callback_data)
    status = callback_node_status(callback_data, model)
    status == MOI.CALLBACK_NODE_STATUS_INTEGER || return  # only integer candidates
    xval = callback_value.(callback_data, x)              # not value.(x) inside a callback
    for S in find_cycles(xval, V)
        length(S) < n || continue                         # a proper subtour
        con = @build_constraint(sum(x[i, j] for i in S, j in S if i != j) <= length(S) - 1)
        MOI.submit(model, MOI.LazyConstraint(callback_data), con)
    end
end

set_attribute(model, MOI.LazyConstraintCallback(), lazy_callback)
optimize!(model)</code></pre>
<ul>
<li>Inside a callback read values with <code>callback_value</code>, build rows with <code>@build_constraint</code> and hand them over with <code>MOI.submit</code>; ordinary <code>@constraint</code> is for outside the solve.</li>
<li>Select arcs with a threshold (<code>&gt; 0.5</code>), not <code>== 1</code>: solver values carry tolerances.</li>
<li>The same row may be submitted more than once; the callback must check every integer candidate it receives.</li>
<li>For fractional points the pattern is the same with <code>MOI.UserCutCallback()</code> and <code>MOI.UserCut(callback_data)</code>; user cuts only strengthen the relaxation and are not guaranteed to be called.</li>
</ul>`,
    },
  ],
  moves: [
    R`Given a log excerpt: identify the incumbent, the best bound and the gap; say whether optimality is proved; say what the cut summary counts.`,
    R`Given a status: state exactly what can and cannot be concluded.`,
    R`Given a callback sketch: say which point it inspects (integer or fractional), what it must submit, and what goes wrong if it returns without a violated row.`,
  ],
  traps: [
    R`Reading <code>objective_value</code> after a time limit as the optimum; it is the incumbent, and <code>objective_bound</code> tells you how far it might be.`,
    R`Calling <code>value.(x)</code> inside a callback.`,
    R`Testing <code>x[i,j] == 1</code> on floating-point solver output.`,
    R`Forgetting <code>LazyConstraints = 1</code>: Gurobi's presolve may make reductions that are invalid when feasibility rows are missing.`,
    R`Comparing two formulations by solution time on one instance instead of by root bound and gap.`,
  ],
  refs: [
    R`Labs 104, 201, 202a, 202b (Julia notebooks of the course) and the environment set-up guide.`,
    R`Slides 102 (termination table), 202 and 203 (callbacks, lazy constraints, user cuts), 204 and 205 (cut summary in the log).`,
    R`JuMP documentation: “Solver-independent Callbacks”; Gurobi Optimizer Reference Manual: “MIP logging”, “Callbacks”, parameters <code>MIPGap</code>, <code>LazyConstraints</code>.`,
  ],
};
