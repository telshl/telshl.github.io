const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { normalize, termsFor, prepare, search, snippet } = require('../assets/js/search.js');
const documents = [
  { title: 'AI 時代的公共媒體', url: '/a/', category: '公共評論', summary: '事實查核與信任', content: '討論平台治理。', source: '客新聞', keywords: '新聞業危機', date: '2026-11-12' },
  { title: 'Taiwan media', url: '/b/', category: '研究與專題', summary: '民主', content: '事實查核是公共媒體的基礎。', date: '2026-01-01' },
  { title: 'A <script>alert(1)</script> title', url: '/c/', category: '關於與其他', content: 'literal .* and [x] terms', date: '' },
  { title: '公共媒體的未來', url: '/d/', category: '公共評論', content: '事實查核與平台治理', date: '2025-01-01' }
];
const index = prepare(documents);
test('Traditional Chinese title, body, source, tags and combined terms', () => {
  assert.equal(search(index, '事實查核').length, 3);
  assert.deepEqual(search(index, '公共媒體 客新聞').map(x => x.doc.url), ['/a/']);
  assert.equal(search(index, '新聞業危機')[0].doc.url, '/a/');
  assert.equal(search(index, '平台治理', '研究與專題').length, 0);
  assert.equal(search(index, '公共媒體', '研究與專題')[0].doc.url, '/b/');
});
test('NFKC, English case and short English token boundaries', () => {
  assert.equal(normalize(' ＡＩ  '), 'ai');
  assert.deepEqual(search(index, 'ＡＩ').map(x => x.doc.url), ['/a/']);
  assert.equal(search(index, 'taiWAN')[0].doc.url, '/b/');
  assert.equal(search(prepare([{ ...documents[0], title: 'AI時代' }]), 'ai').length, 1);
});
test('ranking puts title matches first, then newer equally relevant content', () => {
  assert.deepEqual(search(index, '公共媒體').map(x => x.doc.url), ['/a/', '/d/', '/b/']);
  assert.equal(search(index, 'Taiwan media')[0].doc.url, '/b/');
});
test('empty, absent and regex-like queries remain literal', () => {
  for (const query of ['', '  ', '不存在的詞']) assert.equal(search(index, query).length, 0);
  assert.equal(search(index, '.*')[0].doc.url, '/c/');
  assert.equal(search(index, '[x]')[0].doc.url, '/c/');
  assert.equal(search(index, '<script>')[0].doc.url, '/c/');
});
test('snippets select matching body text and do not require a summary', () => {
  assert.match(snippet(documents[1], termsFor('事實查核')), /事實查核/);
  assert.match(snippet({ content: '前'.repeat(200) + '媒體改革' + '後'.repeat(200) }, termsFor('媒體改革')), /^….*媒體改革.*…$/);
});
if (process.env.SEARCH_INDEX) {
  const entries = JSON.parse(fs.readFileSync(process.env.SEARCH_INDEX, 'utf8'));
  const real = prepare(entries);
  test('built index covers all sections, remains deduplicated, and excludes search/taxonomies', () => {
    assert.equal(new Set(entries.map(x => x.url)).size, entries.length);
    assert.ok(entries.every(x => x.url !== '/search/' && !/^\/(tags|topic-tags|categories)\//.test(x.url)));
    for (const url of ['/', '/about/', '/contact/', '/books/', '/publications/', '/research/', '/media/', '/en/', '/topics/ai-trust/']) assert.ok(entries.some(x => x.url === url), url);
    assert.equal(entries.find(x => x.url === '/media/').category, '媒體訪談');
  });
  test('real Chinese article, book title, publication DOI, media body and English searches', () => {
    assert.ok(search(real, '當客家遇見吐瓦魯')[0].doc.url.endsWith('2026-11-12-hakkanews-311819/'));
    assert.ok(search(real, '文化研究', '代表著作').some(x => x.doc.url === '/books/'));
    assert.ok(search(real, '172635812023060043003').some(x => x.doc.url === '/publications/'));
    assert.ok(search(real, '信任度', '媒體訪談').some(x => x.doc.url === '/media/'));
    assert.ok(search(real, 'Communication').some(x => x.doc.url === '/en/'));
  });
}
