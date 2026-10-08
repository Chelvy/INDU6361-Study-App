// Today: exam countdown, readiness, recommended session, mastery map.
import { h, rich, pct } from '../util.js';
import { store } from '../store.js';
import { MODULES, topicsOfModule } from '../data/topics.js';
import { buildPlan, readiness, effectiveMastery, masteryLabel, nextExam } from '../plan.js';
import { dueCount, questionsForTopic, bankStats } from '../bank.js';
import { hasLesson } from '../data/lessons/index.js';
import { drillsForTopic } from '../drills/index.js';

export function render(root) {
  const state = store.get();
  const plan = buildPlan(state, { due: dueCount(), questionCount: (t) => questionsForTopic(t).length, hasLesson });
  const exam = nextExam(state.settings);
  const ready = readiness(state, plan.scopeId);
  const today = new Date();

  root.appendChild(h('div', { class: 'page-head' },
    h('h1', null, 'Today'),
    h('p', null, today.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))));

  // ---- countdown + readiness
  const left = h('section', { class: 'card' });
  if (exam) {
    left.appendChild(h('div', { class: 'muted small' }, `${exam.label} · ${exam.date.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}${exam.kind === 'final' ? ' (first day of the exam period)' : ''}`));
    left.appendChild(h('div', { class: 'countdown' }, h('span', { class: 'num' }, String(exam.days)), h('span', null, exam.days === 1 ? 'day to go' : 'days to go')));
  } else {
    left.appendChild(h('div', { class: 'muted' }, 'No upcoming exam date is set.'));
  }
  if (!state.settings.midterm) left.appendChild(h('p', { class: 'small muted', style: 'margin-top:.5rem' }, 'The midterm date is not in the course outline. ', h('a', { href: '#/settings' }, 'Add it in Settings'), ' when it is announced; until then the plan covers Modules 1–2.'));
  const stats = bankStats();
  left.appendChild(h('div', { class: 'stat-row' },
    h('div', { class: 'stat' }, h('b', null, String(store.streak())), h('span', null, 'day streak')),
    h('div', { class: 'stat' }, h('b', null, String(store.todayCount())), h('span', null, 'items today')),
    h('div', { class: 'stat' }, h('b', null, String(stats.due)), h('span', null, 'cards due')),
    h('div', { class: 'stat' }, h('b', null, String(state.mistakes.length)), h('span', null, 'open mistakes'))));

  const right = h('section', { class: 'card' });
  right.appendChild(h('div', { class: 'muted small' }, `Readiness · ${plan.scopeId === 'all' ? 'whole course' : plan.scopeId === 'm1' ? 'Module 1' : 'Modules 1–2'}`));
  right.appendChild(h('div', { class: 'countdown' }, h('span', { class: 'num' }, pct(ready.value, 0))));
  right.appendChild(h('div', { class: `meter ${ready.value >= 0.85 ? 'ok' : ready.value >= 0.6 ? 'warn' : ''}`, style: 'margin:.5rem 0' }, h('span', { style: `width:${Math.round(ready.value * 100)}%` })));
  right.appendChild(h('p', { class: 'small muted' }, `${ready.started} of ${ready.total} topics started. This is first-try accuracy on graded work in this app, weighted by topic; it is a study signal, not a grade prediction.`));
  root.appendChild(h('div', { class: 'hero' }, left, right));

  // ---- today's session
  const session = h('section', { class: 'card' });
  session.appendChild(h('div', { class: 'row between' }, h('h2', { style: 'margin:0' }, 'Recommended session'), h('span', { class: 'chip' }, `about ${plan.minutes} min of your ${plan.budget}-minute target`)));
  if (!plan.actions.length) session.appendChild(h('p', { class: 'muted' }, 'Nothing is queued. Pick any trainer or topic below.'));
  const ol = h('ol', { class: 'plan-list', style: 'margin-top:.8rem' });
  plan.actions.forEach((a, i) => {
    ol.appendChild(h('li', { class: 'plan-item' },
      h('span', { class: 'n', 'aria-hidden': 'true' }, a.optional ? '+' : String(i + 1)),
      h('div', null, h('div', { class: 't' }, a.title), h('div', { class: 'd' }, `${a.detail} · ${a.minutes} min`)),
      h('a', { class: `btn ${i === 0 ? 'primary' : ''}`, href: a.href }, a.kind === 'learn' ? 'Read' : 'Start')));
  });
  session.appendChild(ol);
  session.appendChild(h('p', { class: 'small muted', style: 'margin-top:.7rem' }, 'The list puts weak, heavily weighted topics first and schedules reviews by spaced repetition. Change the daily target in ', h('a', { href: '#/settings' }, 'Settings'), '.'));
  root.appendChild(session);

  // ---- mastery map
  root.appendChild(h('h2', { style: 'margin-top:1.6rem' }, 'Mastery map'));
  root.appendChild(h('p', { class: 'muted small' }, 'Each bar is your first-try accuracy on the topic (recent work counts more). Click a topic to open its lesson, trainers and questions.'));
  MODULES.forEach((m) => {
    root.appendChild(h('div', { class: 'module-head' }, h('h2', null, m.title), h('span', null, m.note)));
    const grid = h('div', { class: 'topic-grid' });
    topicsOfModule(m.id).forEach((t) => {
      const st = state.topics[t.id];
      const eff = effectiveMastery(st);
      const lab = masteryLabel(st);
      const nDrills = drillsForTopic(t.id).length;
      const nQ = questionsForTopic(t.id).length;
      grid.appendChild(h('a', { class: `topic-tile${t.released ? '' : ' unreleased'}`, href: `#/learn/${t.id}`, title: t.blurb },
        h('span', { class: 'code' }, h('span', null, t.code), h('span', { class: `chip ${lab.cls}` }, lab.text)),
        h('span', { class: 'name' }, t.title),
        h('span', { class: 'small muted' }, `${nDrills ? `${nDrills} trainer${nDrills > 1 ? 's' : ''} · ` : ''}${nQ} question${nQ === 1 ? '' : 's'}`),
        h('span', { class: `meter ${lab.cls}` }, h('span', { style: `width:${Math.round(eff * 100)}%` }))));
    });
    root.appendChild(grid);
  });

  if (!Object.keys(state.topics).length) {
    root.insertBefore(rich('<b>How to use this trainer.</b> Work the <a href="#/train">trainers</a> on paper first, then type your answers: they are graded step by step with the same tie rules as the instructor’s solved exercises. Use <a href="#/bank">Questions</a> for theory, the <a href="#/exam">mock exam</a> under time pressure, and re-do whatever lands in your <a href="#/mistakes">mistake notebook</a>.', 'div', 'card info'), root.children[1]);
  }
}
