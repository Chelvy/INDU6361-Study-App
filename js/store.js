// Progress persistence (localStorage) and the statistics derived from it.
import { todayKey, uid } from './util.js';

const KEY = 'indu6361-study-v1';

function defaults() {
  return {
    v: 1,
    settings: { midterm: '', final: '2026-12-09', dailyMinutes: 45, theme: 'auto', focus: 'auto' },
    topics: {},
    drills: {},
    cards: {},
    questions: {},
    mistakes: [],
    exams: [],
    days: {},
  };
}

let state = null;
let memoryOnly = false;
const listeners = new Set();

function load() {
  if (state) return state;
  state = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...defaults(), ...parsed, settings: { ...defaults().settings, ...(parsed.settings || {}) } };
    }
  } catch {
    memoryOnly = true;
  }
  return state;
}

function save() {
  if (!memoryOnly) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { memoryOnly = true; }
  }
  listeners.forEach((fn) => { try { fn(state); } catch { /* ignore listener errors */ } });
}

export const store = {
  get: () => load(),
  isMemoryOnly: () => { load(); return memoryOnly; },
  onChange: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },

  setSetting(key, value) { load().settings[key] = value; save(); },

  bumpDay(ms = 0, items = 1) {
    const s = load();
    const k = todayKey();
    const d = s.days[k] || { items: 0, ms: 0 };
    d.items += items; d.ms += ms;
    s.days[k] = d;
  },

  // Exponential moving average so recent work counts more; n tracks how much evidence there is.
  recordTopic(topic, score) {
    if (!topic) return;
    const s = load();
    const t = s.topics[topic] || { score: 0, n: 0, last: null };
    t.score = t.n === 0 ? score : 0.7 * t.score + 0.3 * score;
    t.n += 1;
    t.last = Date.now();
    s.topics[topic] = t;
  },

  recordDrill(drillId, topic, score, ms) {
    const s = load();
    const d = s.drills[drillId] || { n: 0, sum: 0, best: 0, last: null, lastScore: 0, ms: 0 };
    d.n += 1; d.sum += score; d.best = Math.max(d.best, score); d.last = Date.now(); d.lastScore = score; d.ms += ms;
    s.drills[drillId] = d;
    this.recordTopic(topic, score);
    this.bumpDay(ms, 1);
    save();
  },

  recordQuestion(qid, topic, ok) {
    const s = load();
    const q = s.questions[qid] || { n: 0, ok: 0, last: null };
    const sc = typeof ok === 'number' ? Math.max(0, Math.min(1, ok)) : ok ? 1 : 0; // partial credit allowed
    q.n += 1; q.ok += sc; q.last = Date.now();
    s.questions[qid] = q;
    this.recordTopic(topic, sc);
    this.bumpDay(0, 1);
    save();
  },

  // Spaced repetition (SM-2 style). quality: 0 again, 1 hard, 2 good, 3 easy.
  rateCard(qid, quality) {
    const s = load();
    const c = s.cards[qid] || { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: todayKey() };
    if (quality === 0) { c.reps = 0; c.interval = 0; c.lapses += 1; c.ease = Math.max(1.3, c.ease - 0.2); }
    else {
      c.reps += 1;
      if (c.reps === 1) c.interval = quality === 3 ? 3 : 1;
      else if (c.reps === 2) c.interval = quality === 1 ? 2 : quality === 3 ? 6 : 4;
      else c.interval = Math.max(1, Math.round(c.interval * (quality === 1 ? 1.2 : quality === 3 ? c.ease * 1.3 : c.ease)));
      c.ease = Math.max(1.3, c.ease + (quality === 1 ? -0.15 : quality === 3 ? 0.15 : 0));
    }
    const due = new Date();
    due.setDate(due.getDate() + c.interval);
    c.due = todayKey(due);
    c.last = Date.now();
    s.cards[qid] = c;
    save();
    return c;
  },
  cardState(qid) { return load().cards[qid] || null; },
  isDue(qid) { const c = load().cards[qid]; return !c || c.due <= todayKey(); },

  addMistake(m) {
    const s = load();
    s.mistakes.unshift({ id: uid(), when: Date.now(), ...m });
    if (s.mistakes.length > 400) s.mistakes.length = 400;
    save();
  },
  removeMistake(id) { const s = load(); s.mistakes = s.mistakes.filter((m) => m.id !== id); save(); },
  clearMistakes() { load().mistakes = []; save(); },

  recordExam(e) { const s = load(); s.exams.unshift({ when: Date.now(), ...e }); if (s.exams.length > 50) s.exams.length = 50; save(); },

  mastery(topic) { const t = load().topics[topic]; return t ? { score: t.score, n: t.n, last: t.last } : { score: 0, n: 0, last: null }; },

  streak() {
    const s = load();
    let n = 0;
    const d = new Date();
    if (!s.days[todayKey(d)]) d.setDate(d.getDate() - 1); // today not started yet does not break the streak
    while (s.days[todayKey(d)]) { n += 1; d.setDate(d.getDate() - 1); }
    return n;
  },
  todayCount() { const d = load().days[todayKey()]; return d ? d.items : 0; },

  exportJSON() { return JSON.stringify(load(), null, 1); },
  importJSON(text) {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || !parsed.settings) throw new Error('This does not look like a progress export.');
    state = { ...defaults(), ...parsed, settings: { ...defaults().settings, ...parsed.settings } };
    save();
  },
  reset() { state = defaults(); save(); },
  save,
};
