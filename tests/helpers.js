// Shared test helpers: the HTML/KaTeX safety check for written content, and a stub DOM for rendering in Node.
import assert from 'node:assert/strict';

const TAGS = new Set(['b', 'i', 'em', 'strong', 'br', 'ul', 'ol', 'li', 'code', 'sub', 'sup', 'p', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'pre', 'u', 'h3', 'h4', 'a', 'small']);

export function checkHtml(s, where) {
  assert.equal(typeof s, 'string', `${where}: not a string`);
  assert.ok(s.trim().length > 0, `${where}: empty`);
  assert.ok(!/\[object |\bNaN\b/.test(s), `${where}: suspicious text`);
  assert.ok(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s), `${where}: control character (bad escape?)`);
  // strip code blocks: they may contain $ and comparison signs legitimately
  const t = s.replace(/<pre>[\s\S]*?<\/pre>/g, '').replace(/<code>[\s\S]*?<\/code>/g, '').replace(/\\\$/g, '');
  const dd = (t.match(/\$\$/g) || []).length;
  const d = (t.replace(/\$\$/g, '').match(/\$/g) || []).length;
  assert.ok(dd % 2 === 0 && d % 2 === 0, `${where}: unbalanced $ near "${t.slice(0, 80)}"`);
  for (const m of t.matchAll(/<\/?([A-Za-z!?][A-Za-z0-9]*)/g)) assert.ok(TAGS.has(m[1].toLowerCase()), `${where}: "<${m[1]}" is read as an HTML tag (use \\lt or spaces inside math)`);
  // every opened block tag is closed
  for (const tag of ['table', 'ul', 'ol', 'div', 'pre', 'tbody', 'thead']) {
    const open = (s.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
    const close = (s.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    assert.equal(open, close, `${where}: <${tag}> opened ${open} times, closed ${close}`);
  }
  // braces balanced inside math; no unescaped % (KaTeX comment); only KaTeX-supported environments
  for (const m of t.matchAll(/\$\$([\s\S]*?)\$\$|\$([^$]*?)\$/g)) {
    const body = (m[1] !== undefined ? m[1] : m[2]).replace(/\\[{}]/g, '');
    const o = (body.match(/\{/g) || []).length, c = (body.match(/\}/g) || []).length;
    assert.equal(o, c, `${where}: unbalanced braces in math "${body.slice(0, 70)}"`);
    assert.ok(!/\\(begin|end)\{(align\*?|equation|eqnarray|tabular)\}/.test(body), `${where}: environment not supported by KaTeX`);
    assert.ok(!/(^|[^\\])%/.test(body), `${where}: unescaped % inside math "${body.slice(0, 70)}"`);
  }
}

class El {
  constructor(tag) { this.tagName = String(tag).toUpperCase(); this.children = []; this.style = {}; this.dataset = {}; this.attrs = {}; this._html = ''; this.className = ''; this.hidden = false; }
  get classList() { return { add() {}, remove() {}, contains() { return false; }, toggle() {} }; }
  appendChild(c) { this.children.push(c); return c; }
  insertBefore(c) { this.children.push(c); return c; }
  removeChild(c) { this.children = this.children.filter((x) => x !== c); return c; }
  remove() {}
  setAttribute(k, v) { this.attrs[k] = v; }
  getAttribute(k) { return this.attrs[k]; }
  addEventListener() {}
  get firstChild() { return this.children[0] || null; }
  set innerHTML(v) { this._html = String(v); }
  get innerHTML() { return this._html; }
  set textContent(v) { this._text = String(v); }
  get textContent() { return this._text || ''; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
}

// Install a minimal DOM so view and figure code can run under node:test.
export function installStubDom() {
  if (globalThis.document) return;
  globalThis.Node = El;
  globalThis.document = {
    createElement: (t) => new El(t),
    createElementNS: (_ns, t) => new El(t),
    createTextNode: (t) => { const e = new El('#text'); e._text = String(t); return e; },
  };
  globalThis.window = {};
}

// Collect every innerHTML string in a rendered stub tree (to run checkHtml on generated content).
export function collectHtml(node, out = []) {
  if (!node) return out;
  if (node._html) out.push(node._html);
  (node.children || []).forEach((c) => collectHtml(c, out));
  return out;
}
