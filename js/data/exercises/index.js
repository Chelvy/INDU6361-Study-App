// Registry of the instructor's exercise sheets.
import { E10 } from './e10.js';
import { E20 } from './e20.js';

const sheet = (id, title, note, list) => ({ id, title, note, exercises: list.map((ex) => ({ ...ex, sheet: id, sheetTitle: title, id: `${id}-${ex.n}` })) });

export const SHEETS = [
  sheet('20e', 'Sheet 20E · Module 2', 'TSP formulations, separation, rounding, Gomory and MIR cuts, cliques, covers, lifting, facets, flow covers, lot sizing. 14 exercises with the instructor’s solutions.', E20),
  sheet('10e', 'Sheet 10E · Module 1 algorithms', 'Dijkstra, Kruskal, Edmonds–Karp, Hungarian method, knapsack table. Each one also runs, fully graded, in its trainer.', E10),
];

export const exerciseById = (sheetId, n) => {
  const sh = SHEETS.find((s) => s.id === sheetId);
  return sh ? sh.exercises.find((e) => String(e.n) === String(n)) || null : null;
};

export const allExercises = () => SHEETS.flatMap((s) => s.exercises);
