// Question bank: course-aligned items written for this app plus sourced external items (data/ext/*.json).
import { CORE } from './data/bank-core.js';
import { store } from './store.js';
import { todayKey } from './util.js';

let items = null;
let loading = null;
let extInfo = [];

const tag = (q) => ({ ...q, ext: false, source: q.source || { label: 'Course slides', url: null, solution: 'course' } });

export function loadBank() {
  if (items) return Promise.resolve(items);
  if (!loading) {
    loading = (async () => {
      let ext = [];
      try {
        const idx = await (await fetch('data/ext/index.json', { cache: 'no-cache' })).json();
        const parts = await Promise.all((idx.files || []).map(async (f) => {
          try {
            const arr = await (await fetch(`data/ext/${f.file}`, { cache: 'no-cache' })).json();
            extInfo.push({ ...f, count: arr.length });
            return arr.map((q) => ({ ...q, ext: true, batch: f.file }));
          } catch { return []; }
        }));
        ext = parts.flat();
      } catch { ext = []; }
      const seen = new Set();
      items = CORE.map(tag).concat(ext).filter((q) => (seen.has(q.id) ? false : (seen.add(q.id), true)));
      return items;
    })();
  }
  return loading;
}

export const bankNow = () => items || CORE.map(tag);
export const bankLoaded = () => items !== null;
export const extBatches = () => extInfo;
export const questionById = (id) => bankNow().find((q) => q.id === id) || null;
export const questionsForTopic = (topic) => bankNow().filter((q) => q.topic === topic);

// Cards already seen whose review date has arrived.
export function dueItems(pool = bankNow()) {
  const cards = store.get().cards;
  const today = todayKey();
  return pool.filter((q) => cards[q.id] && cards[q.id].due <= today);
}
export const dueCount = () => dueItems().length;
export function unseenItems(pool = bankNow()) {
  const cards = store.get().cards;
  return pool.filter((q) => !cards[q.id]);
}

export function bankStats(pool = bankNow()) {
  const cards = store.get().cards;
  const today = todayKey();
  let seen = 0, due = 0, mature = 0;
  pool.forEach((q) => { const c = cards[q.id]; if (!c) return; seen += 1; if (c.due <= today) due += 1; if (c.interval >= 7) mature += 1; });
  return { total: pool.length, seen, due, mature, fresh: pool.length - seen };
}
