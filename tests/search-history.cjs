const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the real event handlers and URL state machine without a browser.
// Fetch intentionally remains pending: result rendering is covered separately.
function harness() {
  const nodes = new Map(), timers = new Map(), events = {};
  let timerId = 0, position = 1;
  const history = ['https://example.test/', 'https://example.test/search/'];
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, {
      value: '', selectedIndex: 0, dataset: { indexUrl: '/search/index.json' }, handlers: {},
      addEventListener(type, callback) { this.handlers[type] = callback; },
      replaceChildren() {}, setAttribute() {}, focus() {},
      querySelector() { return node('region'); }, querySelectorAll() { return []; }
    });
    return nodes.get(id);
  }
  const window = {
    location: { href: history[position], origin: 'https://example.test' },
    history: {
      replaceState(_state, _title, url) { history[position] = window.location.href = String(url); },
      pushState(_state, _title, url) {
        history.splice(++position);
        history[position] = window.location.href = String(url);
      }
    },
    addEventListener(type, callback) { events[type] = callback; }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/js/search.js'), 'utf8'), {
    document: { getElementById: node }, window, URL,
    fetch: () => new Promise(() => {}),
    setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
    clearTimeout(id) { timers.delete(id); }
  });
  return {
    history, node,
    query: () => new URL(window.location.href).searchParams.get('q'),
    type(value, flush = true) {
      node('search-query').value = value;
      node('search-query').handlers.input({});
      if (flush) this.flush();
    },
    flush() { for (const [id, callback] of [...timers]) { timers.delete(id); callback(); } },
    submit() { node('search-form').handlers.submit({ preventDefault() {} }); },
    move(delta) { position += delta; window.location.href = history[position]; events.popstate(); }
  };
}

test('submitted live queries retain checkpoints for Back and Forward', () => {
  const h = harness();
  h.type('公共');
  h.type('公共媒體');
  assert.equal(h.history.length, 3, 'live edits replace only their own entry');
  h.submit();
  h.type('事實查核');
  h.submit();
  assert.equal(h.history.length, 4);
  h.move(-1);
  assert.equal(h.query(), '公共媒體');
  assert.equal(h.node('search-query').value, '公共媒體');
  h.move(1);
  assert.equal(h.query(), '事實查核');
});

test('Back cancels pending input and editing after Back preserves the restored query', () => {
  const h = harness();
  h.type('公共媒體'); h.submit();
  h.type('事實查核'); h.submit();
  h.type('未提交', false);
  h.move(-1);
  h.flush();
  assert.equal(h.query(), '公共媒體');
  h.type('平台治理'); h.submit();
  h.move(-1);
  assert.equal(h.query(), '公共媒體');
  h.move(1);
  assert.equal(h.query(), '平台治理');
});

test('immediate submit cancels debounce and repeated submit adds no duplicate', () => {
  const h = harness();
  h.type('公共媒體', false); h.submit(); h.flush(); h.submit();
  assert.equal(h.history.length, 3);
  h.type('AI', false); h.submit(); h.flush();
  h.move(-1);
  assert.equal(h.query(), '公共媒體');
});

test('clear and category changes create navigable checkpoints', () => {
  const h = harness();
  h.type('公共媒體'); h.submit();
  h.node('search-category').value = '公共評論';
  h.node('search-category').handlers.change();
  h.node('search-clear').handlers.click();
  assert.equal(h.query(), null);
  h.move(-1);
  assert.equal(h.query(), '公共媒體');
  assert.equal(h.node('search-category').value, '公共評論');
  h.move(-1);
  assert.equal(h.node('search-category').value, '');
});

test('a whitespace-only live change does not overwrite the submitted checkpoint', () => {
  const h = harness();
  h.type('AI'); h.submit();
  h.type('AI ');
  h.type('AI 時代'); h.submit();
  h.move(-1);
  assert.equal(h.query(), 'AI');
});
