const R = String.raw;

export default {
  id: 't206c',
  lead: R`Two families for models with continuous quantities switched on by binaries. In both, the LP relaxation cheats in the same way: it pays for a <i>fraction</i> of an activation. Flow covers and lot-sizing inequalities make it pay for whole ones.`,
  sections: [
    {
      title: 'Flow model and the fractional solution',
      html: R`
<p>A warehouse can receive goods through optional channels. Opening channel $j$ costs a fixed amount and allows up to $a_j$ units; at most $b$ units can be received in total.</p>
$$\sum_{j\in N}y_j\le b,\qquad 0\le y_j\le a_jx_j,\qquad x_j\in\{0,1\}.$$
<p>An open channel may carry anything from 0 to $a_j$, so all channels can be open at once even if their combined capacity exceeds $b$.</p>
<p><b>Two channels</b>, $a_1=a_2=6$, $b=10$. The relaxation admits $\bar x=(\tfrac56,\tfrac56)$, $\bar y=(5,5)$: both links and the total-flow row hold with equality, and the LP uses only $5/6$ of each opening.</p>`,
    },
    {
      title: 'Deriving the cut from the binary cases',
      html: R`
<p>Let $X=x_1+x_2$ count open channels and $Y=y_1+y_2$ the total flow. With one channel open the maximum flow is 6; with two it is 10 (not 12): opening the second channel gains only 4.</p>
<p>Look for a line $Y\le\alpha+\beta X$ tight for one and two open channels: $6=\alpha+\beta$ and $10=\alpha+2\beta$. Subtracting the first equation from the second gives $\beta=4$, then $\alpha=2$:</p>
$$Y\le 2+4X,\qquad\text{i.e.}\qquad y_1+y_2\le 2+4(x_1+x_2).$$
<p>(Notation: the slides write this line as $Y\le a+bX$. There $a$ is the intercept and $b$ the slope, not the capacities $a_j$ or the limit $b=10$. This page uses $\alpha,\beta$ to avoid the clash.)</p>
<p>For $X=0$: $Y=0\le 2$. Valid in all three cases. At the fractional point $\bar X=5/3$, $\bar Y=10$, and the cut would need $10\le 2+4\cdot\tfrac53=\tfrac{26}{3}\approx 8.67$: violated.</p>
<p><b>The picture.</b> Put $X$ on the horizontal axis and $Y$ on the vertical axis. Without the cut, the LP lets the total flow grow like $Y\le6X$ until it hits the limit $Y\le10$, so its upper boundary is $Y\le\min(6X,10)$. The two pieces meet at $X=10/6=5/3$, $Y=10$: exactly the fractional point. The cut is the straight line through the binary maxima $(1,6)$ and $(2,10)$. It removes the triangle with corners $(1,6)$, $(5/3,10)$, $(2,10)$, and the fractional corner with it.</p>
<p>Equivalent form: $y_1+y_2+4(1-x_1)+4(1-x_2)\le 10$. Starting from the total capacity 10, each closed channel reduces the allowed flow by 4.</p>
<p><b>When this shortcut works.</b> It needs one number for “the maximum flow with one channel open”. Here both channels carry 6, so that number is 6. When the capacities differ, use the general formula of the next section.</p>`,
    },
    {
      title: 'The general flow-cover inequality',
      html: R`
<p>Choose a set $C$ of channels whose total capacity exceeds $b$. Its <b>excess</b> is</p>
$$\lambda=\sum_{j\in C}a_j-b\ \gt 0 :$$
<p>the capacity that could not be used even with all of $C$ open. If channel $j\in C$ closes, the remaining capacity of $C$ is $b+\lambda-a_j$; relative to $b$ the loss is at least $(a_j-\lambda)^+=\max\{a_j-\lambda,0\}$.</p>
<div class="callout"><div class="callout-title">Flow-cover inequality</div>For a capacity cover $C$ with excess $\lambda$: $$\sum_{j\in C}y_j+\sum_{j\in C}(a_j-\lambda)^+(1-x_j)\ \le\ b .$$ The first sum is the flow through the cover channels; the second accounts for capacity lost when channels close.</div>
<p>Example: $C=\{1,2\}$, $\lambda=6+6-10=2$, $(a_j-\lambda)^+=4$: exactly the cut above.</p>
<div class="callout"><div class="callout-title">Worked example: unequal capacities (20E, Exercise 13)</div>Three channels with capacities $7, 9, 5$ feed a warehouse that takes at most 12. Use $C=\{1,2\}$.
<ol>
<li>Cover capacity $7+9=16$, so the excess is $\lambda=16-12=4$.</li>
<li>Coefficients: $(7-4)^+=3$ and $(9-4)^+=5$. If channel 1 closes, the flow of $C$ must drop by at least 3; if channel 2 closes, by at least 5.</li>
<li>Inequality: $\boxed{y_1+y_2+3(1-x_1)+5(1-x_2)\le12}$. Channel 3 is left out; it stays governed by the original model.</li>
<li>Validity, case by case on $(x_1,x_2)$: the largest left-hand side is $0+3+5=8$ for $(0,0)$, $7+0+5=12$ for $(1,0)$, $9+3+0=12$ for $(0,1)$ and $12$ for $(1,1)$. Flow on channel 3 can only take room away from channels 1 and 2.</li>
<li>Test point $\bar x=(1,\tfrac12,0)$, $\bar y=(7,\tfrac92,0)$: it respects every capacity link and has total flow $11.5\le12$, but the left-hand side is $7+4.5+3\cdot0+5\cdot0.5=14\gt12$. Violated by 2.</li>
</ol>
Note that “at most one of channels 1 and 2 open”, $x_1+x_2\le1$, is <b>not</b> valid: both can be open, carrying for example $(6,6)$. <a href="#/exercises/20e/13">Open the exercise</a>.</div>
<p><b>Finding flow covers:</b> (1) identify a flow bound and its binary capacity links; (2) find a candidate $C$ with positive excess; (3) compute $(a_j-\lambda)^+$ and evaluate the cut at $(\bar x,\bar y)$; (4) add it only if the left-hand side exceeds $b$ by the chosen tolerance.</p>`,
    },
    {
      title: 'Lot sizing',
      html: R`
<p>A factory meets demand over several periods; running production in a period costs a set-up, and goods made early can be stored. In period $t$: produce $y_t$, meet demand $d_t$, leave inventory $s_t$; binary $x_t$ activates production with capacity $C$.</p>
$$s_{t-1}+y_t-s_t=d_t,\qquad 0\le y_t\le C\,x_t,\qquad s_0=0,\ s_t\ge 0,\ x_t\in\{0,1\}\qquad\text{(no backlogging).}$$
<h3>Single-period inequality</h3>
$$y_t\le d_tx_t+s_t .$$
<p>If $x_t=0$ the capacity link forces $y_t=0$. If $x_t=1$ the balance gives $y_t=d_t+s_t-s_{t-1}\le d_t+s_t$. Production beyond the period's own demand must end up in stock.</p>
<h3>Cumulative inequality</h3>
<p>Sum the balances through period $t$: $\sum_{i\le t}y_i=\sum_{i\le t}d_i+s_t\ge\sum_{i\le t}d_i$. With $y_i\le Cx_i$: $C\sum_{i\le t}x_i\ge\sum_{i\le t}d_i$. The number of set-ups is an integer, so</p>
$$\sum_{i=1}^tx_i\ \ge\ \Big\lceil\frac{\sum_{i=1}^td_i}{C}\Big\rceil .$$
<p>(Integer rounding again, this time upwards because the row is “$\ge$”.)</p>
<p><b>Two-period example.</b> $C=10$, $d_1=d_2=6$. The LP admits $\bar x=(0.6,0.6)$, $\bar y=(6,6)$, $\bar s=(0,0)$. The cumulative cut for $t=2$ requires $x_1+x_2\ge\lceil 12/10\rceil=2$, but $0.6+0.6=1.2$; since each $x_t\le 1$, both periods must be activated. The single-period cuts also reject the point: $6\not\le 6\cdot0.6+0=3.6$.</p>
<div class="callout"><div class="callout-title">Worked example: three periods (20E, Exercise 14)</div>Demands $d=(5,8,6)$, capacity $C=12$, $s_0=0$, no backlogging.
<ul>
<li><b>Cumulative cuts.</b> Cumulative demands are 5, 13, 19. Divide by 12 and round up: $x_1\ge1$, $x_1+x_2\ge2$, $x_1+x_2+x_3\ge2$.</li>
<li><b>Test point</b> $\bar x=(\tfrac5{12},\tfrac23,\tfrac12)$, $\bar y=(5,8,6)$, $\bar s=(0,0,0)$. It satisfies the balances and the capacity links (with equality). Yet all six inequalities fail:</li>
</ul>
<table class="data-table">
<thead><tr><th>$t$</th><th>Single period: $\bar y_t$ vs $d_t\bar x_t+\bar s_t$</th><th>Cumulative: $\sum_{i\le t}\bar x_i$ vs right-hand side</th></tr></thead>
<tbody>
<tr><td>1</td><td>$5\not\le\tfrac{25}{12}$</td><td>$\tfrac5{12}\not\ge1$</td></tr>
<tr><td>2</td><td>$8\not\le\tfrac{16}{3}$</td><td>$\tfrac{13}{12}\not\ge2$</td></tr>
<tr><td>3</td><td>$6\not\le3$</td><td>$\tfrac{19}{12}\not\ge2$</td></tr>
</tbody></table>
<b>Demand in period 3 does not force $x_3=1$.</b> The plan $x=(1,1,0)$, $y=(7,12,0)$, $s=(2,6,0)$ is feasible: the first two periods produce all 19 units, and the 6 units in stock serve period 3 with no set-up there. The cumulative cuts only ask for 2 set-ups by period 3, and this plan has them. <a href="#/exercises/20e/14">Open the exercise</a>.</div>
<div class="callout warn"><div class="callout-title">Assumptions behind the cumulative formula</div>Zero initial inventory, no backlogging, constant capacity $C$. With initial stock $s_0\gt 0$ the demand to be produced decreases by $s_0$. With varying capacities start from $\sum_{i\le t}C_ix_i\ge\sum_{i\le t}d_i$: a single division by $C$ no longer applies. For the stated model, checking all cumulative cuts needs only prefix sums of demands and of the fractional set-ups.</div>`,
    },
  ],
  moves: [
    R`Flow cover: name $C$, compute $\lambda$ and say it is positive, compute each $(a_j-\lambda)^+$, write the inequality, evaluate the left-hand side at $(\bar x,\bar y)$ and compare with $b$.`,
    R`Prove validity case by case before using the cut: a table of the open/closed patterns of the channels in $C$ (flow cover), or $x_t=0$ and $x_t=1$ (single-period lot sizing). Then show the fractional point violates it.`,
    R`When the channels of $C$ all have the <b>same</b> capacity, you can also derive the cut from the cases $X=0,1,2$ as on the slides; show it is tight for $X=1$ and $X=2$. With different capacities, use $(a_j-\lambda)^+$.`,
    R`Lot sizing: build the table of prefix demands $D_t$, then $\lceil D_t/C\rceil$, then the prefix sums of $\bar x$, and mark the violated periods.`,
    R`State the assumptions (no initial stock, no backlog, constant capacity) when you use the cumulative cut.`,
  ],
  traps: [
    R`Forgetting the positive part: if $a_j\le\lambda$ the coefficient is 0, not negative.`,
    R`Using a set $C$ that is not a cover ($\lambda\le 0$). The slides require $\lambda\gt0$; otherwise the formula is not guaranteed to be valid. (Beyond the slides: with $a=(6,6)$, $b=14$ we get $\lambda=-2$ and coefficients 8, and the point $x=0$, $y=0$ gives $16\gt14$.)`,
    R`Using the $X=0,1,2$ line when the capacities differ. In 20E, Exercise 13 the best one-channel flow is 7 or 9, depending on the channel. (Beyond the slides: forcing one line through $(1,9)$ and $(2,12)$ gives $y_1+y_2\le6+3(x_1+x_2)$. It is valid but weaker: at the test point it is violated by only 1 instead of 2. The line through $(1,7)$ and $(2,12)$, $y_1+y_2\le2+5(x_1+x_2)$, is even <b>invalid</b>: channel 2 alone can carry 9.)`,
    R`Calling $x_1+x_2\le1$ a valid cut for the channel model. Open channels may carry less than their capacity, so both can be open.`,
    R`Rounding down in the cumulative cut. A “$\ge$” row with an integer left-hand side is rounded <b>up</b>.`,
    R`Believing that positive demand in period $t$ forces $x_t=1$. Stock from earlier periods can serve it (20E, Exercise 14).`,
    R`Applying $\lceil D_t/C\rceil$ when capacities vary by period or when there is initial inventory.`,
    R`Confusing the two uses of the letter $C$ on the slides: a cover set in the flow model, the capacity in the lot-sizing model. Likewise $a,b$ in the slides' line $Y\le a+bX$ are not the capacities $a_j$ or the limit $b$.`,
  ],
  refs: [
    R`Slides 206, <i>Problem-Specific Valid Inequalities</i> (T. Schettini): flow covers (PDF pp. 52–64, reading version “Flow-cover geometry”), lot-sizing inequalities (pp. 65–71), summary tables.`,
    R`Sheet 20E, solved exercises 13 (flow cover with capacities 7, 9, 5) and 14 (three-period lot sizing).`,
    R`Padberg, Van Roy and Wolsey (1985), “Valid linear inequalities for fixed charge problems”, <i>Operations Research</i> 33(4), cited on the slides.`,
    R`Wolsey, <i>Integer Programming</i>, 2nd ed., chapter 8.`,
  ],
};
