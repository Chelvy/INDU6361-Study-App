// Course-aligned question bank: questions written for this app from the instructor's slides, solved exercises
// and labs (numbers are his examples). Sourced questions from other courses are in data/ext/*.json.
import m1a from './bank/m1a.js';
import m1b from './bank/m1b.js';
import m2a from './bank/m2a.js';
import m2b from './bank/m2b.js';
import m3 from './bank/m3.js';

// Options are rotated by an amount derived from the question id, so that the position of the correct option
// in the stored data carries no information (the interface shuffles them again when a question is shown).
function rotate(q) {
  if (q.type !== 'mcq' || q.fixed) return q;
  let hash = 0;
  for (const ch of q.id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const k = hash % q.options.length;
  if (k === 0) return q;
  const n = q.options.length;
  return { ...q, options: q.options.map((_, i) => q.options[(i + k) % n]), answer: (q.answer - k + n) % n };
}

export const CORE = [].concat(m1a, m1b, m2a, m2b, m3).map(rotate);
