// Study planning: readiness estimate and the recommended session for today. Pure functions of the stored state.
import { TOPICS, SCOPES, topicById } from './data/topics.js';
import { DRILLS, drillsForTopic } from './drills/index.js';

// Mastery discounted by how much evidence there is (three graded items give full credit to the average).
export function effectiveMastery(t) {
  if (!t || !t.n) return 0;
  return t.score * Math.min(1, t.n / 3);
}

export function masteryLabel(t) {
  if (!t || !t.n) return { text: 'Not started', cls: '' };
  const m = effectiveMastery(t);
  if (m >= 0.85) return { text: 'Solid', cls: 'ok' };
  if (m >= 0.6) return { text: 'Getting there', cls: 'warn' };
  return { text: 'Needs work', cls: 'bad' };
}

export function nextExam(settings, now = new Date()) {
  const day = (s) => { const d = new Date(`${s}T09:00:00`); return Number.isNaN(d.getTime()) ? null : d; };
  const list = [];
  if (settings.midterm) { const d = day(settings.midterm); if (d) list.push({ kind: 'midterm', label: 'Midterm', date: d, scope: 'm12' }); }
  if (settings.final) { const d = day(settings.final); if (d) list.push({ kind: 'final', label: 'Final exam', date: d, scope: 'all' }); }
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const upcoming = list.filter((e) => e.date >= startOfToday).sort((a, b) => a.date - b.date);
  const e = upcoming[0] || null;
  if (!e) return null;
  return { ...e, days: Math.max(0, Math.round((new Date(e.date.getFullYear(), e.date.getMonth(), e.date.getDate()) - startOfToday) / 86400000)) };
}

// Which part of the course the plan targets. The user can choose it; "auto" follows the exam dates:
// Modules 1-2 until the midterm (or while no midterm date is known), the whole course afterwards.
export function planScope(settings, now = new Date()) {
  if (settings.focus && SCOPES[settings.focus]) return settings.focus;
  const e = nextExam(settings, now);
  if (!settings.midterm) return 'm12';
  return e && e.kind === 'midterm' ? 'm12' : 'all';
}

export function scopeTopics(scopeId) {
  return (SCOPES[scopeId] || SCOPES.m12).topics.map(topicById).filter(Boolean);
}

export function readiness(state, scopeId) {
  const topics = scopeTopics(scopeId);
  let w = 0, acc = 0, started = 0;
  topics.forEach((t) => { w += t.weight; acc += t.weight * effectiveMastery(state.topics[t.id]); if (state.topics[t.id] && state.topics[t.id].n) started += 1; });
  return { value: w ? acc / w : 0, started, total: topics.length };
}

export function levelFor(state, topicId) {
  const m = effectiveMastery(state.topics[topicId]);
  return m >= 0.8 ? 3 : m >= 0.5 ? 2 : 1;
}

/**
 * Recommended actions for today.
 * ctx: { due: number of review cards due, questionCount: (topicId) => items available, hasLesson: (topicId) => bool }
 */
export function buildPlan(state, ctx, now = new Date()) {
  const exam = nextExam(state.settings, now);
  const scopeId = planScope(state.settings, now);
  const inScope = new Set(scopeTopics(scopeId).map((t) => t.id));
  const budget = Math.max(15, Number(state.settings.dailyMinutes) || 45);
  const actions = [];
  let used = 0;
  const push = (a) => { if (used + a.minutes > budget + 10 && actions.length >= 2) return false; actions.push(a); used += a.minutes; return true; };

  if (ctx.due > 0) {
    const n = Math.min(ctx.due, 25);
    push({ kind: 'review', title: `Review ${n} due card${n > 1 ? 's' : ''}`, detail: 'Spaced repetition: these are scheduled for today.', href: '#/bank?mode=due', minutes: Math.max(3, Math.ceil(n * 0.6)) });
  }

  const ranked = TOPICS.filter((t) => inScope.has(t.id) || t.module === 'm0')
    .map((t) => {
      const st = state.topics[t.id];
      const m = effectiveMastery(st);
      const stale = st && st.last ? Math.min(1, (now.getTime() - st.last) / (14 * 86400000)) : 0;
      let priority = t.weight * (1 - m) + t.weight * 0.25 * stale * m;
      if (!t.released) priority *= scopeId === 'all' ? 0.6 : 0.2;
      if (t.module === 'm0') priority *= 0.5;
      return { t, st, m, priority };
    })
    .sort((a, b) => b.priority - a.priority);

  for (const r of ranked) {
    if (actions.length >= 5) break;
    const { t, st } = r;
    const drills = drillsForTopic(t.id);
    const level = levelFor(state, t.id);
    if (!st || !st.n) {
      if (ctx.hasLesson(t.id)) { if (!push({ kind: 'learn', topic: t.id, title: `Read: ${t.title}`, detail: 'New topic. Read the lesson, then do its self-check.', href: `#/learn/${t.id}`, minutes: 10 })) break; }
      if (drills.length && actions.length < 5) push({ kind: 'train', topic: t.id, title: `First run: ${drills[0].title}`, detail: 'Start with the instructor’s own example.', href: `#/train/${drills[0].id}?p=${drills[0].presets && drills[0].presets[0] ? drills[0].presets[0].id : ''}`, minutes: drills[0].minutes || 8 });
      continue;
    }
    if (drills.length) {
      const d = drills[(st.n || 0) % drills.length];
      if (!push({ kind: 'train', topic: t.id, title: `${d.title} (level ${level})`, detail: `${t.short}: mastery ${(r.m * 100).toFixed(0)}%. A fresh instance, graded step by step.`, href: `#/train/${d.id}?level=${level}&seed=new`, minutes: d.minutes || 8 })) break;
    } else if (ctx.questionCount(t.id) > 0) {
      if (!push({ kind: 'bank', topic: t.id, title: `8 questions: ${t.short}`, detail: `Mastery ${(r.m * 100).toFixed(0)}%.`, href: `#/bank?topic=${t.id}&n=8`, minutes: 8 })) break;
    }
  }

  if (state.mistakes.length && actions.length < 6) {
    push({ kind: 'mistakes', title: 'Redo one entry from your mistake notebook', detail: `${state.mistakes.length} open entr${state.mistakes.length > 1 ? 'ies' : 'y'}. Retrying a fresh instance of a missed exercise is the fastest way to gain marks.`, href: '#/mistakes', minutes: 6 });
  }
  const lastExam = state.exams[0];
  const daysSinceExam = lastExam ? (now.getTime() - lastExam.when) / 86400000 : Infinity;
  const startedCount = Object.values(state.topics).filter((x) => x.n >= 2).length;
  if (startedCount >= 6 && daysSinceExam >= 6) {
    actions.push({ kind: 'exam', title: 'Sit a timed mock exam', detail: lastExam ? `Your last one was ${Math.floor(daysSinceExam)} days ago.` : 'You have covered enough topics to benefit from one.', href: '#/exam', minutes: 60, optional: true });
  }
  return { exam, scopeId, actions, minutes: used, budget };
}

export const allDrills = () => DRILLS;
