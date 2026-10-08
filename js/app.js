// Shell: navigation, hash router, theme.
import { h, clear, renderMath, flushPendingMath } from './util.js';
import { store } from './store.js';
import { loadBank, dueCount } from './bank.js';
import { setLeaveGuard, getLeaveGuard } from './nav-guard.js';
import { applyTheme } from './theme.js';
import * as home from './views/home.js';
import * as learn from './views/learn.js';
import * as train from './views/train.js';
import * as bank from './views/bank.js';
import * as exam from './views/exam.js';
import * as mistakes from './views/mistakes.js';
import * as sheet from './views/sheet.js';
import * as sources from './views/sources.js';
import * as settings from './views/settings.js';

const VIEWS = { home, learn, train, bank, exam, mistakes, sheet, sources, settings };

const ICON = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6',
  learn: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M9 7h6M9 11h6',
  train: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM10 8.5v7l6-3.5z',
  bank: 'M4 5h16v11H9l-5 4zM9 9h6M9 12h4',
  exam: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 2h6',
  mistakes: 'M12 9v4M12 17h.01M10.3 3.9L2.5 17.5A2 2 0 0 0 4.2 20.5h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  sheet: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
  sources: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
};
const NAV = [
  { id: 'home', label: 'Today', hash: '#/' },
  { id: 'learn', label: 'Learn', hash: '#/learn' },
  { id: 'train', label: 'Train', hash: '#/train' },
  { id: 'bank', label: 'Questions', hash: '#/bank' },
  { id: 'exam', label: 'Mock exam', hash: '#/exam' },
  { sep: true },
  { id: 'mistakes', label: 'Mistakes', hash: '#/mistakes', count: () => store.get().mistakes.length },
  { id: 'sheet', label: 'Cheat sheet', hash: '#/sheet' },
  { id: 'sources', label: 'Sources', hash: '#/sources' },
  { id: 'settings', label: 'Settings', hash: '#/settings' },
];

function icon(id) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', ICON[id] || '');
  svg.appendChild(p);
  return svg;
}

function drawNav(active) {
  const nav = document.getElementById('nav');
  clear(nav);
  NAV.forEach((item) => {
    if (item.sep) { nav.appendChild(h('div', { class: 'nav-sep' })); return; }
    const a = h('a', { href: item.hash, 'aria-current': item.id === active ? 'page' : null }, icon(item.id), h('span', null, item.label));
    const n = item.count ? item.count() : item.id === 'bank' ? dueCount() : 0;
    if (n > 0) a.appendChild(h('span', { class: 'count', title: item.id === 'bank' ? 'cards due for review' : 'entries' }, n > 99 ? '99+' : n));
    nav.appendChild(a);
  });
  const foot = document.getElementById('side-foot');
  clear(foot);
  const s = store.get();
  const streak = store.streak();
  foot.appendChild(h('div', null, h('b', null, `${streak}`), ` day${streak === 1 ? '' : 's'} in a row · `, h('b', null, `${store.todayCount()}`), ' items today'));
  if (store.isMemoryOnly()) foot.appendChild(h('div', { class: 'error' }, 'Storage is blocked: progress will not be saved.'));
  void s;
}

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean).map((p) => { try { return decodeURIComponent(p); } catch { return p; } });
  return { parts, params: Object.fromEntries(new URLSearchParams(query)) };
}

let cleanup = null;
let lastHash = location.hash;

function route() {
  const guard = getLeaveGuard();
  if (guard && location.hash !== lastHash) {
    const msg = guard();
    if (msg && !window.confirm(msg)) { history.replaceState(null, '', lastHash || '#/'); return; }
    setLeaveGuard(null);
  }
  lastHash = location.hash;
  const { parts, params } = parseHash();
  const id = parts[0] && VIEWS[parts[0]] ? parts[0] : 'home';
  if (typeof cleanup === 'function') { try { cleanup(); } catch { /* ignore */ } }
  cleanup = null;
  const main = document.getElementById('main');
  clear(main);
  drawNav(id);
  try {
    cleanup = VIEWS[id].render(main, { parts: parts.slice(1), params });
  } catch (e) {
    console.error(e);
    main.appendChild(h('div', { class: 'card' }, h('h2', null, 'Something went wrong on this page'), h('p', { class: 'error' }, String(e && e.message ? e.message : e)), h('a', { class: 'btn', href: '#/' }, 'Back to Today')));
  }
  renderMath(main);
  const label = (NAV.find((n) => n.id === id) || {}).label || 'Today';
  document.title = `${label} · INDU 6361 Trainer`;
  window.scrollTo(0, 0);
  if (document.activeElement && document.activeElement !== document.body) main.focus({ preventScroll: true });
}

applyTheme();
store.onChange(() => { const { parts } = parseHash(); drawNav(parts[0] && VIEWS[parts[0]] ? parts[0] : 'home'); });
window.addEventListener('hashchange', route);
window.addEventListener('load', flushPendingMath);
route();
loadBank().then(() => { const { parts } = parseHash(); drawNav(parts[0] && VIEWS[parts[0]] ? parts[0] : 'home'); if (!parts[0]) route(); });
