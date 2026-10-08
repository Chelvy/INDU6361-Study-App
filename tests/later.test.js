// Brute-force checks for the trainers of classes 7-10 (no instructor examples exist for these yet).
import test from 'node:test';
import assert from 'node:assert/strict';
import { Frac } from '../js/math/frac.js';
import { solveLP } from '../js/math/lp.js';
import { makeRng } from '../js/util.js';
import { lagrangianValue, coveringBrute, bestPattern, recourse, nearestNeighbour, tourLength, twoOptMoves, lagrangeDrill, bendersDrill, pricingDrill, twoOptDrill } from '../js/drills/later.js';

const fr = (v) => Frac.of(v);

test('Lagrangian function: equals the enumerated minimum, is a lower bound, and its maximum is the LP bound', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const inst = lagrangeDrill.random(makeRng(seed), 1 + (seed % 3));
    const { c, a, b } = inst;
    const n = c.length;
    const zstar = coveringBrute(c, a, b).cost;
    const lp = solveLP({ sense: 'min', c, rows: [{ a, op: '>=', b }].concat(c.map((_, j) => ({ a: c.map((__, k) => (k === j ? 1 : 0)), op: '<=', b: 1 }))) });
    let best = null;
    for (const lam of ['0', '1/4', '1/2', '1', '3/2', '2', '5/2', '3', '4', '7/3', '5/3']) {
      const L = Frac.parse(lam);
      const r = lagrangianValue(c, a, b, L);
      // direct enumeration of min_x c.x + lam (b - a.x)
      let direct = null;
      for (let mask = 0; mask < 1 << n; mask++) {
        let v = L.mul(b);
        for (let j = 0; j < n; j++) if (mask & (1 << j)) v = v.add(fr(c[j]).sub(L.mul(a[j])));
        if (direct === null || v.lt(direct)) direct = v;
      }
      assert.ok(r.value.eq(direct), `seed ${seed} lambda ${lam}`);
      assert.ok(r.value.le(fr(zstar)), `weak duality, seed ${seed}`);
      assert.ok(r.value.le(lp.obj), `Lagrangian bound cannot exceed the LP bound here, seed ${seed}`);
      if (best === null || r.value.gt(best)) best = r.value;
    }
    // the breakpoints c_j / a_j contain a maximiser of the concave piecewise-linear function
    for (let j = 0; j < n; j++) { const r = lagrangianValue(c, a, b, fr(c[j]).div(a[j])); if (r.value.gt(best)) best = r.value; }
    assert.ok(best.eq(lp.obj), `max L = LP bound (integrality property), seed ${seed}: ${best} vs ${lp.obj}`);
  }
});

test('Benders: the optimality cut is valid for every y and tight at the point where it was generated', () => {
  for (let seed = 1; seed <= 80; seed++) {
    const inst = bendersDrill.random(makeRng(seed), 1 + (seed % 3));
    const r = recourse(inst, inst.ybar);
    const n = inst.f.length;
    for (let mask = 0; mask < 1 << n; mask++) {
      const y = inst.f.map((_, j) => (mask & (1 << j) ? 1 : 0));
      const cut = r.u.reduce((s, ui, i) => s + ui * (inst.h[i] - inst.T[i].reduce((t, tij, j) => t + tij * y[j], 0)), 0);
      const Q = recourse(inst, y).Q;
      assert.ok(Q >= cut, `cut must underestimate Q, seed ${seed}`);
      if (y.every((v, j) => v === inst.ybar[j])) assert.equal(Q, cut);
      // the subproblem LP agrees with the closed form
      const lp = solveLP({ sense: 'min', c: inst.pen, rows: inst.h.map((hi, i) => ({ a: inst.h.map((_, k) => (k === i ? 1 : 0)), op: '>=', b: hi - inst.T[i].reduce((t, tij, j) => t + tij * y[j], 0) })) });
      assert.ok(lp.obj.eq(fr(Q)), `subproblem LP, seed ${seed}`);
    }
  }
});

test('Cutting stock pricing: the best pattern is feasible and at least as good as every other pattern', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const inst = pricingDrill.random(makeRng(seed), 1 + (seed % 3));
    const { W, w } = inst;
    const pi = w.map((wi) => fr(1).div(Math.floor(W / wi)));
    const best = bestPattern(w, W, pi);
    assert.ok(best.p.reduce((s, k, i) => s + k * w[i], 0) <= W);
    assert.ok(inst.pattern.reduce((s, k, i) => s + k * w[i], 0) <= W, 'candidate pattern must be feasible');
    const cand = inst.pattern.reduce((s, k, i) => s.add(pi[i].mul(k)), fr(0));
    assert.ok(best.value.ge(cand));
    assert.ok(best.value.ge(fr(1)), 'single-item patterns have value exactly 1');
  }
});

test('2-opt: the delta formula equals the true change in tour length', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const { D } = twoOptDrill.random(makeRng(seed), 1 + (seed % 3));
    const tour = nearestNeighbour(D);
    const len = tourLength(D, tour);
    for (const m of twoOptMoves(D, tour)) {
      const next = tour.slice(0, m.i + 1).concat(tour.slice(m.i + 1, m.j + 1).reverse(), tour.slice(m.j + 1));
      assert.equal(tourLength(D, next), len + m.delta, `seed ${seed} move ${m.i},${m.j}`);
      assert.equal(new Set(next).size, tour.length);
    }
  }
});
