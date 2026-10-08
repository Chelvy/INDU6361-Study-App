const R = String.raw;

export default {
  id: 't105d',
  lead: R`Assign each worker to one job and each job to one worker at minimum total cost. The Hungarian method keeps a set of row and column labels whose sum is a <b>lower bound</b>, and searches for a complete assignment that uses only entries of zero reduced cost. When it finds one, bound and cost coincide: that is the optimality certificate.`,
  sections: [
    {
      title: 'Reduced costs and the lower bound',
      html: R`
<p>Rows are workers, columns are jobs. An <b>assignment</b> selects exactly one entry in each row and each column; a <b>matching</b> is a partial assignment (at most one entry per row and column).</p>
<p>Subtract row amounts $u_i$ and column amounts $v_j$ so that the <b>reduced costs</b> stay nonnegative:</p>
$$\bar c_{ij}=c_{ij}-u_i-v_j\ \ge 0 .$$
<p>Every complete assignment uses each row and each column exactly once, hence</p>
$$\text{original cost}=\sum_iu_i+\sum_jv_j+\text{total reduced cost}.$$
<p>For fixed labels the first two sums are the same for <i>every</i> assignment, and the reduced costs are nonnegative. So $\sum_iu_i+\sum_jv_j$ is a lower bound on the cost of any assignment, and an assignment whose total reduced cost is zero attains it and is optimal.</p>`,
    },
    {
      title: 'The method',
      html: R`
<ol>
<li><b>Reduce.</b> Subtract each row minimum, then each column minimum of the result. Start with no assignments.</li>
<li><b>Search.</b> Choose an unassigned worker and search through zero entries, returning along existing assignments (an alternating search).</li>
<li><b>Continue.</b> If a <b>free job</b> is reached, reverse the assignments along the path: one more worker is assigned. If the search is <b>exhausted</b>, update the reduced costs and resume it.</li>
<li><b>Repeat</b> until every worker is assigned.</li>
</ol>
<h3>The update after a failed search</h3>
<p>Let $S$ be the reached workers and $T$ the reached jobs.</p>
<ul>
<li>Every job in $T$ is assigned (otherwise the search would have succeeded), and each brings its worker into $S$; adding the unassigned starting worker gives $|S|=|T|+1$.</li>
<li>No zero in a reached row leads outside $T$ (otherwise the search would continue).</li>
</ul>
<p>So there are more workers than zero-cost jobs available to them: they cannot all be assigned using zeros. Compute</p>
$$\Delta=\min_{i\in S,\ j\notin T}\bar c_{ij},\qquad u_i\leftarrow u_i+\Delta\ \ (i\in S),\qquad v_j\leftarrow v_j-\Delta\ \ (j\in T).$$
<table class="data-table left">
<thead><tr><th>Matrix entries</th><th>Change</th></tr></thead>
<tbody>
<tr><td>reached row, unreached column</td><td>$-\Delta$</td></tr>
<tr><td>reached row, reached column</td><td>$0$</td></tr>
<tr><td>unreached row, reached column</td><td>$+\Delta$</td></tr>
<tr><td>unreached row, unreached column</td><td>$0$</td></tr>
</tbody></table>
<p>Existing assigned zeros are preserved, at least one new zero connects a reached worker to an unreached job, and the lower bound rises by $\Delta(|S|-|T|)=\Delta$.</p>`,
    },
    {
      title: 'The lecture example',
      html: R`
$$C=\begin{pmatrix}4&1&3&6\\2&0&5&7\\3&2&2&5\\5&4&1&2\end{pmatrix}$$
<ol>
<li><b>Rows:</b> $u=(1,0,2,1)$, lower bound 4. <b>Columns:</b> J1 and J4 still have minimum 1, so $v=(1,0,0,1)$ and the bound is 6. Reduced matrix:
$$\begin{pmatrix}2&0&2&4\\1&0&5&6\\0&0&0&2\\3&3&0&0\end{pmatrix}$$</li>
<li>Assign W1–J2 and W3–J1. Workers W2 and W4 are unassigned.</li>
<li>Search from W2: its only zero is J2, which is occupied; return along the assignment to W1; no other zero leaves W1. Failed search with $S=\{W_1,W_2\}$, $T=\{J_2\}$: two workers, one job.</li>
<li>$\Delta=\min\{2,2,4,1,5,6\}=1$ (rows W1, W2 outside column J2). New labels $u=(2,1,2,1)$, $v=(1,-1,0,1)$, bound 7.</li>
<li>The new zero W2–J1 opens the path $W_2\to J_1\to W_3\to J_3$, ending at a free job. Remove W3–J1, add W2–J1 and W3–J3: three assignments.</li>
<li>W4 has a zero at the free job J4: assign it.</li>
</ol>
<p>Result: W1–J2, W2–J1, W3–J3, W4–J4, original cost $1+2+2+2=7=\sum u_i+\sum v_j$. Optimal.</p>
<p class="small muted">The trainer assigns workers strictly in numerical order, as the solved exercise requires. On this matrix that means W2 is searched before W3 is assigned, so the path found after the update is simply $W_2\to J_1$ and W3 then takes J3 directly. The labels, the bound and the final assignment are the same as on the slides.</p>`,
    },
    {
      title: 'Solved exercise 4',
      html: R`
$$C=\begin{pmatrix}2&3&6\\4&1&1\\3&5&8\end{pmatrix}$$
<p>Rules stated in the exercise: row and column reductions, then workers in <b>numerical order</b>; BFS over zero reduced-cost pairs visiting <b>jobs numerically</b>.</p>
<ol>
<li>$u=(2,1,3)$; every column already has a zero so $v=(0,0,0)$; bound 6. Reduced matrix $\begin{pmatrix}0&1&4\\3&0&0\\0&2&5\end{pmatrix}$.</li>
<li>W1 takes J1. W2 has zeros at J2 and J3 and takes J2, the first free job in numerical order.</li>
<li>Search from W3: $W_3\to J_1\to W_1$, and nothing else. $S=\{W_1,W_3\}$, $T=\{J_1\}$.</li>
<li>$\Delta=\min\{1,4,2,5\}=1$. $u=(3,1,4)$, $v=(-1,0,0)$, bound 7. A new zero appears at W1–J2.</li>
<li>The search continues: $W_3\to J_1\to W_1\to J_2\to W_2\to J_3$. J3 is free: reverse all assignments along the path.</li>
</ol>
<p>Final assignment $W_1\mapsto J_2$, $W_2\mapsto J_3$, $W_3\mapsto J_1$ with cost $3+1+3=7$.</p>
<p><b>Certificate, as written in the solution:</b> the labels satisfy $u_i+v_j\le c_{ij}$ for every pair, so every assignment costs at least $\sum_iu_i+\sum_jv_j=7$; this assignment attains the bound and is optimal.</p>`,
    },
    {
      title: 'Complexity',
      html: R`
<p>There are $n$ phases, each adding one matched pair. Within a phase at most $n$ jobs enter the search tree, and each expansion costs $O(n)$ (select the minimum slack, update labels, scan a new row) when a <i>slack</i> value $\min_{i\in S}\bar c_{ij}$ is stored for every unreached job. Total $O(n^3)$.</p>
<p>The flow and assignment algorithms share one idea: improve a partial solution along an <b>augmenting path</b> (residual capacity for flows, zero reduced costs for assignments).</p>`,
    },
  ],
  moves: [
    R`Show the row amounts, the column amounts, the reduced matrix and the bound after each reduction.`,
    R`For a failed search, write $S$ and $T$, the set of entries over which the minimum is taken, $\Delta$, the new labels and the new bound.`,
    R`Write the alternating path explicitly ($W_3\to J_1\to W_1\to J_2\ldots$) and the assignment after reversing it.`,
    R`End with the cost in the <b>original</b> matrix and the certificate sentence: $u_i+v_j\le c_{ij}$ for all pairs, cost equals $\sum u+\sum v$.`,
  ],
  traps: [
    R`Adding up reduced costs instead of original costs for the final answer.`,
    R`Taking $\Delta$ over the whole matrix, or over reached columns. It is the minimum over <b>reached rows and unreached columns</b> only.`,
    R`Forgetting to add $\Delta$ to entries in unreached rows and reached columns (they increase).`,
    R`Assigning greedily and stopping when a worker has no free zero, without doing the alternating search: a worker's zero may be occupied but reassignable.`,
    R`Skipping the column reduction when some column has no zero after the row reduction.`,
    R`Breaking the stated order (workers numerically, jobs numerically): the optimum is the same but the trace will not match.`,
  ],
  refs: [
    R`Slides 105, <i>Well-Solved Problems</i> (T. Schettini): reduced costs, the worked 4×4 example, failed-search counting argument, matrix update, summary and complexity.`,
    R`Solved exercises 10E, exercise 4. Lab 105c (assignment part).`,
  ],
};
