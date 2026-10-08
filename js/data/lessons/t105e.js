const R = String.raw;

export default {
  id: 't105e',
  lead: R`The 0–1 knapsack problem is NP-hard, yet a table with one row per item and one column per unit of capacity solves it exactly. The catch is in the word <b>pseudo-polynomial</b>. The table is also a certificate of optimality of a different kind from a branch-and-bound tree.`,
  sections: [
    {
      title: 'The recurrence',
      html: R`
<p>$n$ items; item $i$ may be selected at most once, has profit $p_i\ge 0$ and positive integer weight $w_i$; the capacity $C$ is a nonnegative integer.</p>
<p>Let $F(i,c)$ be the best profit using only the <b>first $i$ items</b> with capacity $c$, for $c=0,1,\dots,C$.</p>
$$F(i,c)=\begin{cases}F(i-1,c) & \text{if } w_i\gt c,\\[2pt] \max\{F(i-1,c),\ p_i+F(i-1,c-w_i)\} & \text{if } w_i\le c,\end{cases}\qquad F(0,c)=0 .$$
<ul>
<li><b>Skip</b> item $i$: keep $F(i-1,c)$.</li>
<li><b>Take</b> item $i$: gain $p_i$ and leave capacity $c-w_i$ for the first $i-1$ items. Possible only if $w_i\le c$.</li>
</ul>
<p>Both choices read the <b>previous row</b>, so item $i$ cannot be selected twice. Capacities are upper bounds: the knapsack need not be filled exactly.</p>`,
    },
    {
      title: 'The lecture example (C = 7)',
      html: R`
<p>Items (weight, profit): 1: (2, 3), 2: (3, 5), 3: (4, 6), 4: (5, 8).</p>
<table class="data-table">
<thead><tr><th>$i\ \backslash\ c$</th><th>0</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th></tr></thead>
<tbody>
<tr><th>0</th><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td></tr>
<tr><th>1</th><td>0</td><td>0</td><td>3</td><td>3</td><td>3</td><td>3</td><td>3</td><td>3</td></tr>
<tr><th>2</th><td>0</td><td>0</td><td>3</td><td>5</td><td>5</td><td>8</td><td>8</td><td>8</td></tr>
<tr><th>3</th><td>0</td><td>0</td><td>3</td><td>5</td><td>6</td><td>8</td><td>9</td><td>11</td></tr>
<tr><th>4</th><td>0</td><td>0</td><td>3</td><td>5</td><td>6</td><td>8</td><td>9</td><td>11</td></tr>
</tbody></table>
<p>Sample entries: $F(2,5)=\max\{F(1,5),\ 5+F(1,2)\}=\max\{3,8\}=8$; $F(3,7)=\max\{F(2,7),\ 6+F(2,3)\}=\max\{8,11\}=11$; $F(4,7)=\max\{F(3,7),\ 8+F(3,2)\}=\max\{11,11\}=11$ (both choices optimal).</p>
<h3>Recovering the items</h3>
<p>Start at $(n,C)$ and compare each entry with the one above it.</p>
<div class="callout"><div class="callout-title">Tie rule</div>If $F(i,c)=F(i-1,c)$, <b>skip</b> item $i$ and move up without changing the capacity. If $F(i,c)\gt F(i-1,c)$, the item must have been taken: record it and move to $(i-1,\ c-w_i)$.</div>
<ol>
<li>$(4,7)$: $11=F(3,7)$, skip item 4.</li>
<li>$(3,7)$: $11\gt F(2,7)=8$, take item 3; capacity $7-4=3$.</li>
<li>$(2,3)$: $5\gt F(1,3)=3$, take item 2; capacity $3-3=0$. Nothing else fits.</li>
</ol>
<p>Selected items $\{2,3\}$: weight 7, profit 11. The tie at $(4,7)$ also allows $\{1,4\}$ (weight $2+5$, profit $3+8$). The table identifies the optimal <i>value</i>; the tie rule selects one optimal <i>subset</i>.</p>`,
    },
    {
      title: 'Solved exercise 5 (C = 8)',
      html: R`
<p>Items (weight, profit): 1: (2, 4), 2: (3, 5), 3: (4, 7), 4: (5, 9).</p>
<table class="data-table">
<thead><tr><th>$i\ \backslash\ c$</th><th>0</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th></tr></thead>
<tbody>
<tr><th>0</th><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td></tr>
<tr><th>1</th><td>0</td><td>0</td><td>4</td><td>4</td><td>4</td><td>4</td><td>4</td><td>4</td><td>4</td></tr>
<tr><th>2</th><td>0</td><td>0</td><td>4</td><td>5</td><td>5</td><td>9</td><td>9</td><td>9</td><td>9</td></tr>
<tr><th>3</th><td>0</td><td>0</td><td>4</td><td>5</td><td>7</td><td>9</td><td>11</td><td>12</td><td>12</td></tr>
<tr><th>4</th><td>0</td><td>0</td><td>4</td><td>5</td><td>7</td><td>9</td><td>11</td><td>13</td><td>14</td></tr>
</tbody></table>
<p>Reconstruction: $(4,8)$: $14\gt 12$, take item 4, capacity 3. $(3,3)$: item 3 (weight 4) does not fit, the entry equals the one above: skip. $(2,3)$: $5\gt 4$, take item 2, capacity 0. Subset $\{2,4\}$, weight $3+5=8$, profit $5+9=14$.</p>`,
    },
    {
      title: 'Memory, and why the order of the loop matters',
      html: R`
<p>The full table has $(n+1)(C+1)$ entries: $O(nC)$ memory, and it supports reconstruction. To compute only the optimal <b>value</b>, one array $D[0..C]$ is enough ($O(C)$ memory):</p>
$$D[c]\leftarrow\max\{D[c],\ p_i+D[c-w_i]\}\qquad\text{for } c=C,\,C-1,\,\dots,\,w_i\ \ \textbf{in descending order}.$$
<p>Descending order guarantees that $D[c-w_i]$ still refers to the previous item stage. If capacities increase instead, an item can be used again within its own update: for an item of weight 2 and profit 3, updating $D[2]=3$ before $D[4]$ would give $D[4]=6$, which uses the item twice. Recovering the items from a value-only array needs extra bookkeeping or recomputation.</p>
<h3>Complexity</h3>
<p>$n(C+1)$ states: time $O(nC)$. This is polynomial in the <b>numeric value</b> of $C$ but not in its encoded length $\log_2C$: doubling the number of bits of $C$ squares the running time. The algorithm is <b>pseudo-polynomial</b>, which is perfectly consistent with the knapsack problem being NP-hard.</p>
<p>Dynamic programming is “another kind of optimality certificate” (slides 102): the recurrence evaluates all relevant states and certifies the value of each subproblem.</p>`,
    },
  ],
  moves: [
    R`Write the recurrence and the boundary $F(0,c)=0$ before filling anything.`,
    R`Fill row by row; for the entries that change, show the comparison “skip: …, take: … + … = …”.`,
    R`State the tie rule, then walk back from $(n,C)$, writing each visited cell and the decision.`,
    R`Report the subset, its weight (check it is $\le C$) and its profit (check it equals $F(n,C)$).`,
  ],
  traps: [
    R`Reading the “take” value from the <b>same</b> row, $F(i,c-w_i)$, instead of the previous row. That allows the item to be used repeatedly (the unbounded knapsack).`,
    R`Taking item $i$ during reconstruction on a tie. With the course's rule a tie means skip.`,
    R`Forgetting to subtract the weight from the capacity after taking an item in the walk-back.`,
    R`Insisting that the knapsack be full: $F$ uses capacity as an upper bound.`,
    R`Calling the algorithm polynomial. It is polynomial in $n$ and in the <i>value</i> $C$, exponential in the number of bits of $C$.`,
    R`Updating a single array in increasing order of capacity.`,
  ],
  refs: [
    R`Slides 105, <i>Well-Solved Problems</i> (T. Schettini): knapsack data, recurrence, worked table, reconstruction, storage and complexity.`,
    R`Solved exercises 10E, exercise 5. Lab 105d (knapsack dynamic programming).`,
  ],
};
