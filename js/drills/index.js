// Registry of all trainers.
import dijkstra from './dijkstra.js';
import { kruskalDrill, primDrill } from './kruskal.js';
import maxflow from './maxflow.js';
import hungarian from './hungarian.js';
import knapsackdp from './knapsackdp.js';
import { bbDrill, gapsDrill } from './bb.js';
import { bigMDrill, fixedChargeDrill, uflDrill } from './formulations.js';
import { tuDrill, cutDrill } from './tu.js';
import { subtourDrill, mtzDrill, rowGenDrill, fracSepDrill } from './tsp.js';
import { cgDrill, gomoryDrill, mirDrill } from './cutdrills.js';
import { coversDrill, liftingDrill, cliqueDrill, flowCoverDrill, lotDrill } from './covers.js';
import { kelleyDrill, perspectiveDrill } from './convexdrills.js';
import { twoOptDrill, lagrangeDrill, bendersDrill, pricingDrill } from './later.js';

export const DRILLS = [
  bbDrill, gapsDrill,
  bigMDrill, fixedChargeDrill, uflDrill,
  dijkstra, kruskalDrill, primDrill, maxflow, hungarian, knapsackdp,
  tuDrill, cutDrill,
  subtourDrill, mtzDrill, rowGenDrill, fracSepDrill,
  cgDrill, gomoryDrill, mirDrill,
  cliqueDrill, coversDrill, liftingDrill, flowCoverDrill, lotDrill,
  kelleyDrill, perspectiveDrill,
  twoOptDrill, lagrangeDrill, bendersDrill, pricingDrill,
];

export const drillById = (id) => DRILLS.find((d) => d.id === id) || null;
export const drillsForTopic = (topic) => DRILLS.filter((d) => d.topic === topic || (d.topics || []).includes(topic));
