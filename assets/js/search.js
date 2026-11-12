/* Dependency-free, local-only search. Export the engine for Node regression tests. */
(function () {
  'use strict';

  const normalize = value => String(value || '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
  const escapeRE = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function termsFor(query) {
    return [...new Set(normalize(query).slice(0, 160).split(' ').filter(Boolean))].map(value => ({
      value,
      // Keep AI out of words such as Taiwan, but allow AI時代 and Chinese substrings.
      pattern: new RegExp((/^[a-z0-9_-]+$/.test(value) ? '(^|[^a-z0-9_])' : '') + escapeRE(value) + (/^[a-z0-9_-]+$/.test(value) ? '(?=$|[^a-z0-9_])' : ''), 'i')
    }));
  }
  function prepare(documents) {
    return documents.map(doc => ({ ...doc, fields: Object.fromEntries(
      ['title', 'summary', 'content', 'keywords', 'source', 'date', 'category'].map(key => [key, normalize(doc[key])])
    ) }));
  }
  function search(documents, query, category = '') {
    const terms = termsFor(query);
    if (!terms.length) return [];
    const weights = { title: 80, summary: 30, keywords: 18, source: 15, date: 10, content: 5, category: 2 };
    const results = [];
    for (const doc of documents) {
      if (category && doc.category !== category) continue;
      let score = 0;
      const allMatch = terms.every(term => {
        let best = 0;
        for (const [field, weight] of Object.entries(weights)) {
          if (term.pattern.test(doc.fields[field])) best = Math.max(best, weight);
        }
        score += best;
        return best > 0;
      });
      if (allMatch) {
        if (doc.fields.title === normalize(query)) score += 150;
        results.push({ doc, score });
      }
    }
    return results.sort((a, b) => b.score - a.score || b.doc.date.localeCompare(a.doc.date) || a.doc.title.localeCompare(b.doc.title, 'zh-Hant'));
  }
  function snippet(doc, terms) {
    const choices = [doc.summary, doc.content, doc.keywords].filter(Boolean);
    let text = choices.find(value => terms.some(term => term.pattern.test(normalize(value)))) || choices[0] || '';
    text = text.normalize('NFKC').replace(/\s+/g, ' ').trim();
    let position = -1;
    for (const term of terms) {
      const match = term.pattern.exec(text.toLowerCase());
      if (match && (position < 0 || match.index < position)) position = match.index;
    }
    const start = Math.max(0, position - 45);
    const excerpt = Array.from(text.slice(start)).slice(0, 155).join('');
    return (start ? '…' : '') + excerpt + (start + excerpt.length < text.length ? '…' : '');
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { normalize, termsFor, prepare, search, snippet };
  if (typeof document === 'undefined') return;
  const root = document.getElementById('site-search');
  if (!root) return;

  const form = document.getElementById('search-form');
  const input = document.getElementById('search-query');
  const filter = document.getElementById('search-category');
  const clear = document.getElementById('search-clear');
  const status = document.getElementById('search-status');
  const list = document.getElementById('search-results');
  const region = root.querySelector('.search-results-section');
  const more = document.getElementById('search-more');
  const retry = document.getElementById('search-retry');
  const pageSize = 20;
  let indexPromise, matches = [], visible = 0, generation = 0, timer, composing = false, liveEntry = false;

  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch(root.dataset.indexUrl, { cache: 'no-cache', credentials: 'omit' })
        .then(response => {
          if (!response.ok) throw new Error('Search index unavailable');
          return response.json();
        })
        .then(documents => {
          if (!Array.isArray(documents)) throw new Error('Invalid search index');
          return prepare(documents);
        })
        .catch(error => { indexPromise = null; throw error; });
    }
    return indexPromise;
  }
  function saveURL(mode) {
    const url = new URL(window.location.href);
    const query = input.value.trim();
    if (query) url.searchParams.set('q', query); else url.searchParams.delete('q');
    if (filter.value) url.searchParams.set('type', filter.value); else url.searchParams.delete('type');
    // Keep the previous committed query when a new live-edit session begins.
    const method = mode === 'live' ? (liveEntry ? 'replace' : 'push') : mode;
    if (url.href !== window.location.href) {
      window.history[method + 'State'](null, '', url);
      liveEntry = mode === 'live';
    } else if (mode !== 'live') {
      liveEntry = false;
    }
  }
  function readURL() {
    const params = new URL(window.location.href).searchParams;
    input.value = (params.get('q') || '').slice(0, 160);
    filter.value = params.get('type') || '';
    if (filter.selectedIndex < 0) filter.value = '';
  }
  function highlighted(parent, text, terms) {
    // Use text nodes, never inject index or query text as HTML.
    const values = terms.map(term => escapeRE(term.value)).sort((a, b) => b.length - a.length);
    if (!values.length) { parent.textContent = text; return; }
    const pattern = new RegExp(values.join('|'), 'giu');
    let cursor = 0, match;
    while ((match = pattern.exec(text))) {
      parent.append(document.createTextNode(text.slice(cursor, match.index)));
      const mark = document.createElement('mark');
      mark.textContent = match[0];
      parent.append(mark);
      cursor = match.index + match[0].length;
    }
    parent.append(document.createTextNode(text.slice(cursor)));
  }
  function safeURL(value, internal) {
    try {
      const url = new URL(value, window.location.origin);
      if (!['http:', 'https:'].includes(url.protocol)) return '';
      if (internal && url.origin !== window.location.origin) return '';
      return url.href;
    } catch (_) { return ''; }
  }
  function appendResults(focusFirst = false) {
    const fragment = document.createDocumentFragment();
    const terms = termsFor(input.value);
    let firstLink;
    const end = Math.min(visible + pageSize, matches.length);
    for (const { doc } of matches.slice(visible, end)) {
      const item = document.createElement('li');
      item.className = 'search-result';
      const article = document.createElement('article');
      const meta = document.createElement('p');
      meta.className = 'search-result-meta';
      [doc.category, doc.date, doc.source, doc.external ? '外部原文索引' : ''].filter(Boolean).forEach((text, i) => {
        const span = document.createElement('span');
        if (!i) span.className = 'search-result-category';
        span.textContent = text;
        meta.append(span);
      });
      const heading = document.createElement('h2');
      const link = document.createElement('a');
      link.href = safeURL(doc.url, true) || '/';
      highlighted(link, doc.title, terms);
      heading.append(link);
      if (!firstLink) firstLink = link;
      const excerpt = document.createElement('p');
      excerpt.className = 'search-result-snippet';
      highlighted(excerpt, snippet(doc, terms), terms);
      article.append(meta, heading, excerpt);
      const externalURL = doc.external && safeURL(doc.external, false);
      if (externalURL) {
        const original = document.createElement('a');
        original.href = externalURL;
        original.className = 'search-original';
        original.textContent = '閱讀外部原文 ↗';
        original.target = '_blank';
        original.rel = 'noopener noreferrer';
        original.setAttribute('aria-label', '閱讀外部原文：' + doc.title + '（另開分頁）');
        article.append(original);
      }
      item.append(article);
      fragment.append(item);
    }
    list.append(fragment);
    visible = end;
    more.hidden = visible >= matches.length;
    more.textContent = '顯示更多結果（尚有 ' + (matches.length - visible) + ' 筆）';
    status.textContent = matches.length ? '找到 ' + matches.length + ' 筆結果，已顯示 ' + visible + ' 筆。標題符合者優先，同等相關度依日期由新到舊排列。' : '找不到符合的內容。試試較短的關鍵字、減少關鍵字，或改選「全站內容」。';
    if (focusFirst && firstLink) firstLink.focus({ preventScroll: true });
  }
  async function run(mode = 'replace') {
    clearTimeout(timer);
    const current = ++generation;
    if (mode) saveURL(mode);
    list.replaceChildren();
    more.hidden = true;
    retry.hidden = true;
    matches = [];
    visible = 0;
    clear.hidden = !input.value && !filter.value;
    region.setAttribute('aria-busy', 'false');
    if (!input.value.trim()) {
      status.textContent = '輸入關鍵字，探索公共評論、著作、學術出版與媒體訪談。';
      return;
    }
    status.textContent = '正在載入搜尋資料…';
    region.setAttribute('aria-busy', 'true');
    const query = input.value, category = filter.value;
    try {
      const documents = await loadIndex();
      if (current !== generation) return;
      matches = search(documents, query, category);
      appendResults();
    } catch (_) {
      if (current !== generation) return;
      status.textContent = '暫時無法載入搜尋資料，請檢查網路後重試。你也可以從上方選單直接瀏覽各分類。';
      retry.hidden = false;
    } finally {
      if (current === generation) region.setAttribute('aria-busy', 'false');
    }
  }
  function schedule() {
    clearTimeout(timer);
    // Invalidate an in-flight request as soon as typing begins, not after debounce.
    generation++;
    more.hidden = true;
    timer = setTimeout(() => run('live'), 180);
  }
  form.addEventListener('submit', event => { event.preventDefault(); if (!composing) run('push'); });
  input.addEventListener('input', event => { if (!composing && !event.isComposing) schedule(); });
  input.addEventListener('compositionstart', () => { composing = true; clearTimeout(timer); generation++; });
  input.addEventListener('compositionend', () => { composing = false; schedule(); });
  filter.addEventListener('change', () => run('push'));
  clear.addEventListener('click', () => { input.value = ''; filter.value = ''; run('push'); input.focus(); });
  retry.addEventListener('click', () => run(null));
  more.addEventListener('click', () => appendResults(true));
  root.querySelectorAll('[data-query]').forEach(link => link.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    input.value = link.dataset.query;
    filter.value = '';
    run('push');
  }));
  window.addEventListener('popstate', () => { liveEntry = false; readURL(); run(null); });
  window.addEventListener('pageshow', event => { if (event.persisted) { liveEntry = false; readURL(); run(null); } });
  readURL();
  run(null);
})();
