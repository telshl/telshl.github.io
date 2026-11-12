"""Run after Hugo: python tests/english-profile.py PATH_TO_PUBLIC"""
from pathlib import Path
from urllib.parse import urlsplit
from bs4 import BeautifulSoup
import sys
root = Path(sys.argv[1])
en = BeautifulSoup((root/'en/index.html').read_text(), 'html.parser')
assert en.html['lang'] == 'en'
assert en.find('meta', {'property':'og:locale'})['content'] == 'en_US'
assert en.title.text == 'English Profile | Shih-Hung Lo'
assert len(en.select('h1')) == 1
assert [a.text.strip() for a in en.select('#site-nav a')] == ['Profile','Research','Publications','Contact','Archive','中文']
assert en.select_one('.nav-toggle')['aria-label'] == 'Toggle menu'
assert en.select_one('.english-skip-link')['href'] == '#main-content'
assert 'Professor and Chair' in en.get_text()
assert 'Collaboration, talks and media enquiries' in en.get_text()
for a in en.select('a[href]'):
    url = urlsplit(a['href'])
    if url.scheme or url.netloc: continue
    target = root / url.path.lstrip('/') / 'index.html' if url.path else root/'en/index.html'
    assert target.exists(), a['href']
    if url.fragment:
        assert BeautifulSoup(target.read_text(), 'html.parser').find(id=url.fragment), a['href']
for route in ['about', 'books', 'publications', 'search']:
    page = BeautifulSoup((root/route/'index.html').read_text(), 'html.parser')
    assert page.html['lang'] != 'en'
    assert page.select_one('#site-nav a').text.strip() == '首頁'
    assert not page.select('.english-skip-link')
assert en.find('link', hreflang='zh-TW')['href'].endswith('/about/')
assert BeautifulSoup((root/'about/index.html').read_text(), 'html.parser').find('link', hreflang='en')['href'].endswith('/en/')
print('English profile metadata, navigation, anchors, internal links and Chinese regression checks passed.')
