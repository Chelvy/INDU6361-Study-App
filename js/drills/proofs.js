// Proof trainers. EXTRA-202: the multicommodity-flow LP relaxation of the TSP is at least as strong as MTZ (M = n - 1).
import { frag, ol } from './common.js';

const R = String.raw;

// The eight steps of the proof, in the order of the extra slides. The wording does not give away the later questions.
const PROOF = [
  { id: 'start', slide: 'Comparing LP relaxations', label: R`Start from <b>any</b> feasible solution $(x,f)$ of the LP relaxation of the multicommodity-flow model. The aim: build MTZ positions $u$ for the <b>same</b> arc values $x$.` },
  { id: 'sum', slide: 'Sum the commodities', label: R`Add up the commodities into one total flow $q_{ij}=\sum_{k\ne 1}f^k_{ij}$, and add up their balance equations and their capacity bounds.` },
  { id: 'v', slide: 'Remove the arc flows', label: R`For each vertex $i\ne 1$ let $v_i=\sum_{h\ne i}q_{hi}$ be the flow entering $i$. The balance at $i$ gives the flow leaving $i$: $\sum_{h\ne i}q_{ih}=v_i-1$.` },
  { id: 'cancel', slide: 'Cancel the shared arc', label: R`For two different vertices $i,j\ne 1$, write $v_j-v_i+1$ as (flow entering $j$) minus (flow leaving $i$). One flow term appears in both sums and cancels.` },
  { id: 'bound', slide: 'Bound the remaining flows', label: R`Drop the subtracted flows (they are $\ge 0$), then bound what is left with the capacity bounds and a degree equation: $v_j-v_i+1\le (n-1)(1-x_{ij})$.` },
  { id: 'range', slide: 'Bound the incoming flow', label: R`Bound the incoming flow $v_i$ itself, from below and from above.` },
  { id: 'pos', slide: 'Change to positions', label: R`Change variables to positions $u_i=n+1-v_i$ and read off the MTZ rows with $M=n-1$.` },
  { id: 'concl', slide: 'Formulation strength', label: R`Conclude: every feasible flow solution gives a feasible MTZ solution with the same $x$, so the two LP bounds compare.` },
];

function buildMcfMtz(inst) {
  const { n, v } = inst;
  const items = inst.shuffle.map((k) => PROOF[k]);
  const u = n + 1 - v;
  return {
    id: 'mcf-mtz', topic: 't201', title: inst.title || 'Proof: flow model at least as strong as MTZ',
    statement: () => frag(
      `Directed TSP on $n=${n}$ vertices $V=\\{1,\\dots,n\\}$, vertex $1$ is the root. Both LP relaxations keep the degree equations $\\sum_{j\\ne i}x_{ij}=1$, $\\sum_{h\\ne i}x_{hi}=1$ and $0\\le x_{ij}\\le 1$.`,
      R`<b>Multicommodity flow (MCF).</b> For each destination $k\ne 1$ a flow $f^k$ sends one unit from vertex 1 to vertex $k$: $$\sum_{j\ne i}f^k_{ij}-\sum_{h\ne i}f^k_{hi}=\begin{cases}1,& i=1,\\-1,& i=k,\\0,&\text{otherwise,}\end{cases}\qquad 0\le f^k_{ij}\le x_{ij}.$$`,
      R`<b>MTZ with $M=n-1$.</b> Positions $2\le u_i\le n$ for $i\ne 1$ and, for distinct $i,j\ne 1$, $$u_i-u_j+1\le (n-1)(1-x_{ij}).$$ (This is the row $u_i-u_j+(n-1)x_{ij}\le n-2$ of slides 201, rearranged.)`,
      'Extra slides 202 prove that the flow model gives an LP bound at least as strong as MTZ. Rebuild that proof.',
    ),
    rules: R`The <b>LP relaxation</b> replaces $x_{ij}\in\{0,1\}$ by $0\le x_{ij}\le 1$; its optimal value is the <b>LP bound</b>. One relaxation is <b>at least as strong</b> as another (for a minimisation) when every arc vector $x$ it allows is also allowed by the other: then its minimum is at least as large.`,
    steps: [
      {
        title: 'The plan of the proof',
        fields: [{ type: 'order', label: 'Put the steps in the order of the extra slides 202 (use the arrows).', items, answer: PROOF.map((p) => p.id) }],
        explain: () => frag('The order of the extra slides (slide titles in italics):', ol(PROOF.map((p) => `<i>${p.slide}.</i> ${p.label}`)), 'The idea: remove the flow variables while keeping only constraints that every flow solution must satisfy. What remains are the MTZ rows.'),
      },
      {
        title: 'Sum the commodities',
        text: `There are $n-1=${n - 1}$ commodities, one for each destination $k=2,\\dots,${n}$. Add their balance equations and their capacity bounds.`,
        fields: [
          { type: 'int', label: R`Net number of units that vertex 1 sends out in $q$ (flow out minus flow in)`, answer: n - 1, mis: [{ value: n, msg: 'Vertex 1 is not a destination: there are $n-1$ commodities, one unit each.' }, { value: 1, msg: 'That is one commodity; $q$ adds up all of them.' }] },
          { type: 'int', label: R`Net number of units that each other vertex keeps (flow in minus flow out)`, answer: 1 },
          { type: 'int', label: R`Capacity of the summed flow: $q_{ij}\le\ ?\cdot x_{ij}$`, answer: n - 1, mis: [{ value: 1, msg: 'Each commodity alone satisfies $f^k_{ij}\\le x_{ij}$, but $q_{ij}$ is the sum of $n-1$ of them.' }] },
        ],
        explain: `At vertex 1 every commodity has balance $+1$, so the sum is $n-1=${n - 1}$. At a vertex $i\\ne 1$ only commodity $k=i$ has balance $-1$; the others have $0$. So $$\\sum_{j\\ne i}q_{ij}-\\sum_{h\\ne i}q_{hi}=\\begin{cases}${n - 1},& i=1,\\\\-1,& i\\ne 1.\\end{cases}$$ In words: the root sends out $n-1$ units net and every other vertex consumes one. ("Net" matters: in an LP solution some flow may also come back into vertex 1.) Adding the $n-1$ bounds $0\\le f^k_{ij}\\le x_{ij}$ gives $0\\le q_{ij}\\le ${n - 1}\\,x_{ij}$. Keeping only these summed constraints is itself a relaxation of the flow model.`,
      },
      {
        title: 'Cancel the shared arc, then bound',
        text: R`For distinct $i,j\ne 1$: $$v_j-v_i+1=\underbrace{\sum_{h\ne j}q_{hj}}_{\text{entering } j}-\underbrace{\sum_{h\ne i}q_{ih}}_{\text{leaving } i}.$$`,
        fields: [
          { type: 'choice', label: 'Which term appears in both sums and cancels?', answer: 'qij', options: [
            { value: 'qij', label: R`$q_{ij}$` }, { value: 'qji', label: R`$q_{ji}$` }, { value: 'q1j', label: R`$q_{1j}$` }, { value: 'xij', label: R`$x_{ij}$` },
          ], mis: { qji: 'Arc $(j,i)$ enters $i$ and leaves $j$: it is in neither sum.', q1j: 'Arc $(1,j)$ enters $j$, but it does not leave $i$.', xij: 'The two sums contain flows $q$ only, no $x$.' } },
          { type: 'choice', stack: true, label: R`Which equation turns $(n-1)\sum_{h\notin\{i,j\}}x_{hj}$ into $(n-1)(1-x_{ij})$?`, answer: 'indeg', options: [
            { value: 'indeg', label: R`The in-degree equation at $j$: $\sum_{h\ne j}x_{hj}=1$` },
            { value: 'outdeg', label: R`The out-degree equation at $i$: $\sum_{h\ne i}x_{ih}=1$` },
            { value: 'ub', label: R`The bound $x_{ij}\le 1$` },
            { value: 'root', label: R`The flow balance at vertex 1` },
          ], mis: { outdeg: 'The sum runs over arcs <b>entering</b> $j$, so it is the degree equation at $j$ that applies.', ub: 'A bound gives an inequality, but here we need the equality $\\sum_{h\\notin\\{i,j\\}}x_{hj}=1-x_{ij}$.' } },
        ],
        explain: R`The arc $(i,j)$ enters $j$ and leaves $i$, so $q_{ij}$ is in both sums and cancels: $$v_j-v_i+1=\sum_{h\notin\{i,j\}}q_{hj}-\sum_{h\notin\{i,j\}}q_{ih}.$$ (The index $h$ runs over every other vertex, vertex 1 included.) Then, one rule per line: $$\begin{aligned} v_j-v_i+1&\le\sum_{h\notin\{i,j\}}q_{hj} &&\text{(drop } q_{ih}\ge 0\text{)}\\ &\le (n-1)\sum_{h\notin\{i,j\}}x_{hj} &&\text{(capacity)}\\ &=(n-1)(1-x_{ij}) &&\text{(in-degree at } j\text{)}\end{aligned}$$ Rules used: the subtracted flows $q_{ih}$ are $\ge 0$, so dropping them can only increase the right side; each remaining $q_{hj}$ is at most $(n-1)x_{hj}$; and the arcs entering $j$ add up to 1, so without the arc $(i,j)$ they add up to $1-x_{ij}$. The result contains only $v$ and $x$.`,
      },
      {
        title: 'Bounds on v and the positions u',
        text: `Here $n=${n}$.`,
        fields: [
          { type: 'int', label: R`Lower bound on $v_i$ that the proof derives`, answer: 1, mis: [{ value: 0, msg: 'Vertex $i$ keeps one unit, so at least one unit enters it: $v_i-1=\\sum_h q_{ih}\\ge 0$.' }] },
          { type: 'int', label: R`Upper bound on $v_i$ that the proof derives`, answer: n - 1 },
          { type: 'int', label: `For a vertex with $v_i=${v}$, the position $u_i=n+1-v_i$`, answer: u, mis: [{ value: n - v, msg: 'Use $u_i=n+1-v_i$.' }] },
          { type: 'int', label: R`Lower bound on $u_i$ (from the bounds on $v_i$)`, answer: 2 },
          { type: 'int', label: R`Upper bound on $u_i$ (from the bounds on $v_i$)`, answer: n },
        ],
        explain: () => frag(
          `Lower bound: nonnegative outgoing flow gives $v_i-1=\\sum_{h\\ne i}q_{ih}\\ge 0$, so $v_i\\ge 1$. Upper bound: capacity, then the in-degree equation at $i$: $v_i=\\sum_{h\\ne i}q_{hi}\\le (n-1)\\sum_{h\\ne i}x_{hi}=n-1=${n - 1}$. So $1\\le v_i\\le ${n - 1}$.`,
          `With $u_i=n+1-v_i$: $v_i=${v}$ gives $u_i=${n + 1}-${v}=${u}$; $v_i=1$ gives $u_i=${n}$ and $v_i=${n - 1}$ gives $u_i=2$. So $2\\le u_i\\le ${n}$, the MTZ bounds. Since $v_j-v_i=u_i-u_j$, the inequality $v_j-v_i+1\\le (n-1)(1-x_{ij})$ becomes $u_i-u_j+1\\le (n-1)(1-x_{ij})$: the MTZ rows with $M=n-1$. The arc variables and degree equations have not changed.`,
          `Intuition (beyond the slides): on an integer tour, commodity $k$ travels from 1 along the tour to $k$. The vertex in position $p$ is entered by the commodities whose destination is that vertex or a later one, $n+1-p$ of them. So $v=n+1-p$ and $u=n+1-v=p$: the construction gives back the usual positions.`,
        ),
      },
      {
        title: 'What the proof shows',
        fields: [{ type: 'choice', stack: true, label: 'Which statement does the proof establish?', answer: 'lp', options: [
          { value: 'lp', label: R`For every cost vector $c$: $z_{LP}^{MCF}\ge z_{LP}^{MTZ}$. The flow model is at least as strong; the two bounds can be equal on an instance.` },
          { value: 'extend', label: R`Every $x$ that is feasible for the MTZ LP relaxation can be extended to feasible multicommodity flows.` },
          { value: 'equal', label: R`The two LP bounds are always equal.` },
          { value: 'weaker', label: R`$z_{LP}^{MCF}\le z_{LP}^{MTZ}$: MTZ gives the stronger bound.` },
        ], mis: {
          extend: 'The proof goes the other way, from flows to positions. The extra slides say explicitly that it does not show that every MTZ-feasible arc vector extends to flows.',
          equal: 'The proof gives only an inequality. On the 10-vertex lecture instance of slides 201 the bounds differ: 359.81 for the flow model and 282.47 for MTZ.',
          weaker: 'The direction is reversed: fewer allowed $x$ means a larger (or equal) minimum.',
        } }],
        explain: R`Every feasible MCF LP solution gives MTZ positions for the same $x$. So the set of arc vectors allowed by the MCF relaxation is contained in the set allowed by the MTZ relaxation. For the same minimisation objective $\sum c_{ij}x_{ij}$, a smaller feasible set has a larger or equal minimum (slides 103, "Stronger relaxations"): $z_{LP}^{MCF}\ge z_{LP}^{MTZ}$, whatever the costs. The bounds can be equal on a particular instance, but they need not be: on the 10-vertex lecture instance of slides 201 the flow model gives 359.81 and MTZ 282.47. The converse is <b>not</b> part of the proof, and the extra slides say so. In fact it fails (this combination is beyond the slides): slides 201 show that the MTZ root solution of the 10-vertex instance has the closed set $S=\{2,5,7,8\}$ with no positive arc entering it, while every flow solution puts at least 1 on the arcs entering such a set (slides 201, "From flows to cutsets"). Also beyond the slides: a larger $M\ge n-1$ only weakens the MTZ rows, so the flow bound is at least the MTZ bound for every valid $M$.`,
      },
    ],
    wrapup: R`Proof pattern: start from any solution of the stronger model and build a solution of the weaker model with the same original variables. Here: sum the flows, keep only the incoming flow $v_i$, cancel $q_{ij}$, bound with capacities and the in-degree at $j$, and set $u_i=n+1-v_i$.`,
  };
}

const isIdentity = (p) => p.every((k, i) => k === i);
const PRESET_SHUFFLE = [3, 0, 6, 1, 7, 4, 2, 5];

export const mcfMtzDrill = {
  id: 'mcf-mtz', title: 'Proof: flow model at least as strong as MTZ', topic: 't201', minutes: 7,
  blurb: 'Order the steps of the EXTRA-202 proof, then fill in the summed flows, the cancelled term, the bounds on v and the positions u.',
  presets: [{ id: 'extra202', label: 'Proof of extra slides 202, with n = 6', make: () => ({ n: 6, v: 3, shuffle: PRESET_SHUFFLE.slice(), title: 'Flow model versus MTZ — extra slides 202' }) }],
  random: (rng, level) => {
    const n = level === 1 ? rng.int(5, 7) : rng.int(5, 12);
    let shuffle = rng.shuffle(PROOF.map((_, i) => i));
    while (isIdentity(shuffle)) shuffle = rng.shuffle(shuffle);
    return { n, v: rng.int(2, n - 2), shuffle, title: 'Flow model versus MTZ — practice' };
  },
  build: buildMcfMtz,
};
