// Lessons: one page per syllabus topic, with trainers and a self-check.
import { h, rich, renderMath, newSeed, makeRng } from '../util.js';
import { store } from '../store.js';
import { MODULES, TOPICS, topicsOfModule, topicById, moduleById } from '../data/topics.js';
import { getLesson, hasLesson } from '../data/lessons/index.js';
import { drillsForTopic } from '../drills/index.js';
import { questionsForTopic, loadBank, bankLoaded } from '../bank.js';
import { mountQuestion } from '../question-ui.js';
import { masteryLabel, effectiveMastery } from '../plan.js';
import { WIDGETS } from '../widgets.js';
import { titleOf } from './bank.js';

function index(root) {
  const state = store.get();
  root.appendChild(h('div', { class: 'page-head' },
    h('h1', null, 'Learn'),
    h('p', null, 'One lesson per syllabus topic, in the instructor’s notation and with the numbers of his own examples. Each lesson ends with exam moves, traps, and a short self-check.')));
  MODULES.forEach((m) => {
    root.appendChild(h('div', { class: 'module-head' }, h('h2', null, m.title), h('span', null, m.note)));
    const grid = h('div', { class: 'grid two' });
    topicsOfModule(m.id).forEach((t) => {
      const lab = masteryLabel(state.topics[t.id]);
      const drills = drillsForTopic(t.id);
      grid.appendChild(h('a', { class: 'card', href: `#/learn/${t.id}`, style: 'text-decoration:none;color:inherit;display:block' },
        h('div', { class: 'row', style: 'margin-bottom:.35rem' }, h('span', { class: 'chip' }, t.code), h('span', { class: `chip ${lab.cls}` }, lab.text),
          t.released ? null : h('span', { class: 'chip' }, 'Ahead of slides'),
          hasLesson(t.id) ? null : h('span', { class: 'chip' }, 'Lesson in preparation')),
        h('h3', { style: 'margin:0 0 .25rem' }, t.title),
        h('p', { class: 'muted small', style: 'margin:0' }, t.blurb),
        drills.length ? h('p', { class: 'small', style: 'margin:.45rem 0 0' }, `Trainers: ${drills.map((d) => d.title).join(' · ')}`) : null));
    });
    root.appendChild(grid);
  });
}

function selfCheck(host, topic) {
  const all = questionsForTopic(topic.id);
  if (!all.length) return;
  const s = store.get();
  const rng = makeRng(newSeed());
  const score = (q) => (q.ext ? 1 : 0) + (q.type === 'short' ? 0.6 : q.type === 'card' ? 0.8 : 0) + (s.cards[q.id] ? 0.5 : 0) + rng.next() * 0.4;
  const pickN = all.slice().sort((a, b) => score(a) - score(b)).slice(0, 4);
  host.appendChild(h('h2', { id: 'self-check' }, 'Check yourself'));
  host.appendChild(h('p', { class: 'muted small' }, `Four of the ${all.length} questions on this topic. Answers count towards your mastery and are scheduled for review.`));
  pickN.forEach((item) => {
    mountQuestion(host, item, {
      mode: 'practice', seed: newSeed(),
      onAnswer: (res) => {
        store.recordQuestion(item.id, item.topic, res.score);
        store.rateCard(item.id, res.score >= 0.999 ? 2 : res.score >= 0.5 ? 1 : 0);
        if (res.score < 0.999) store.addMistake({ kind: 'question', topic: item.topic, ref: item.id, title: titleOf(item.q), detail: [], score: res.score });
      },
    });
  });
  host.appendChild(h('div', { class: 'actions' }, h('a', { class: 'btn', href: `#/bank?topic=${topic.id}&n=10` }, `Practise more questions on ${topic.short}`)));
}

function lessonPage(root, topic) {
  const lesson = getLesson(topic.id);
  const mod = moduleById(topic.module);
  const st = store.get().topics[topic.id];
  const lab = masteryLabel(st);
  const drills = drillsForTopic(topic.id);

  root.appendChild(h('div', { class: 'crumbs' }, h('a', { href: '#/learn' }, 'Learn'), ` / ${mod ? mod.title : ''}`));
  const article = h('article', { class: 'lesson' });
  article.appendChild(h('h1', null, topic.title));
  article.appendChild(h('div', { class: 'row', style: 'margin-bottom:.8rem' },
    h('span', { class: 'chip' }, topic.released ? `Slides ${topic.code}` : topic.code),
    h('span', { class: `chip ${lab.cls}` }, st && st.n ? `${lab.text} · ${Math.round(effectiveMastery(st) * 100)}%` : lab.text),
    topic.released ? null : h('span', { class: 'chip warn' }, 'Ahead of released slides')));
  if (lesson && lesson.lead) article.appendChild(rich(lesson.lead, 'p', 'lead'));
  else article.appendChild(h('p', { class: 'lead' }, topic.blurb));

  if (!topic.released) {
    article.appendChild(rich('<div class="callout-title">Ahead of the released slides</div>The instructor had not released slides for this class when the app was built. This lesson follows the course outline and the textbook (Wolsey, <i>Integer Programming</i>, 2nd ed.) and standard course material from other universities. When the slides arrive, check his notation and examples against this page.', 'div', 'callout warn'));
  }

  const actions = h('div', { class: 'row', style: 'margin:.6rem 0 1rem' });
  drills.forEach((d) => actions.appendChild(h('a', { class: 'btn primary', href: `#/train/${d.id}${d.presets && d.presets.length ? `?p=${d.presets[0].id}` : ''}` }, `Trainer: ${d.title}`)));
  actions.appendChild(h('a', { class: 'btn', href: `#/bank?topic=${topic.id}&n=10` }, 'Practise questions'));
  article.appendChild(actions);

  if (lesson) {
    if (lesson.sections.length > 2) {
      const toc = h('nav', { class: 'toc', 'aria-label': 'On this page' });
      lesson.sections.forEach((sec, i) => toc.appendChild(h('a', { href: `#/learn/${topic.id}`, onclick: (e) => { e.preventDefault(); const el = document.getElementById(`sec-${i}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, sec.title)));
      article.appendChild(toc);
    }
    lesson.sections.forEach((sec, i) => {
      article.appendChild(h('h2', { id: `sec-${i}` }, sec.title));
      if (sec.html) article.appendChild(rich(sec.html, 'div'));
      if (sec.widget && WIDGETS[sec.widget]) {
        const box = h('div', { class: 'card flat' });
        article.appendChild(box);
        try { WIDGETS[sec.widget](box, sec.widgetOptions || {}); } catch (e) { box.appendChild(h('p', { class: 'error' }, `Interactive figure unavailable: ${e.message}`)); }
      }
      if (sec.after) article.appendChild(rich(sec.after, 'div'));
    });
    if (lesson.moves && lesson.moves.length) {
      article.appendChild(h('h2', null, 'Exam moves'));
      article.appendChild(rich(`<div class="callout-title">What a full-marks answer shows</div><ol>${lesson.moves.map((x) => `<li>${x}</li>`).join('')}</ol>`, 'div', 'callout move'));
    }
    if (lesson.traps && lesson.traps.length) {
      article.appendChild(h('h2', null, 'Traps'));
      article.appendChild(rich(`<div class="callout-title">Where marks are lost</div><ul>${lesson.traps.map((x) => `<li>${x}</li>`).join('')}</ul>`, 'div', 'callout trap'));
    }
  } else {
    article.appendChild(h('div', { class: 'card note' }, 'The written lesson for this topic is not available yet. The trainers and questions for it are.'));
  }

  const check = h('div');
  article.appendChild(check);
  const fill = () => { selfCheck(check, topic); renderMath(check); };
  if (bankLoaded()) fill(); else loadBank().then(() => { if (check.isConnected) fill(); });

  if (lesson && lesson.refs && lesson.refs.length) {
    article.appendChild(h('h2', null, 'Where this comes from'));
    article.appendChild(rich(`<ul>${lesson.refs.map((r) => `<li>${r}</li>`).join('')}</ul>`, 'div', 'small muted'));
  }

  const k = TOPICS.findIndex((t) => t.id === topic.id);
  const nav = h('div', { class: 'row between', style: 'margin-top:1.6rem' });
  nav.appendChild(k > 0 ? h('a', { class: 'btn', href: `#/learn/${TOPICS[k - 1].id}` }, `← ${TOPICS[k - 1].short}`) : h('span'));
  nav.appendChild(k < TOPICS.length - 1 ? h('a', { class: 'btn', href: `#/learn/${TOPICS[k + 1].id}` }, `${TOPICS[k + 1].short} →`) : h('span'));
  article.appendChild(nav);
  root.appendChild(article);
}

export function render(root, ctx) {
  const topic = ctx.parts[0] ? topicById(ctx.parts[0]) : null;
  if (!topic) index(root); else lessonPage(root, topic);
}
