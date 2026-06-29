#!/usr/bin/env python3
"""
Import early public commentary items from a saved Wix HTML page into Hugo Markdown files.
Usage:
  python3 scripts/import_wix_2008_2018.py /path/to/wix-copy-of-1.html

Because Wix pages often store visible text in generated HTML/JSON, this script uses
BeautifulSoup if available and falls back to regex extraction. Review the generated
files after import: automated scraping may need human cleanup for dates/sources.
"""
from __future__ import annotations
import hashlib, re, sys
from pathlib import Path
from datetime import date

try:
    from bs4 import BeautifulSoup
except Exception:  # pragma: no cover
    BeautifulSoup = None

OUT = Path("content/commentary/articles")
DATE_RE = re.compile(r"(20(?:0[8-9]|1[0-8]))[./年\-\s]*(0?[1-9]|1[0-2])?[./月\-\s]*(0?[1-9]|[12]\d|3[01])?日?")
URL_RE = re.compile(r"https?://[^\s\"'<>]+")

def norm_date(text: str) -> str | None:
    m = DATE_RE.search(text)
    if not m:
        return None
    y = int(m.group(1)); mo = int(m.group(2) or 1); d = int(m.group(3) or 1)
    try:
        return date(y, mo, d).isoformat()
    except ValueError:
        return f"{y:04d}-01-01"

def guess_source(text: str) -> str:
    for sep in ["｜", "|", "，", ",", "《", "〈"]:
        if sep in text:
            left = text.split(sep)[0].strip()
            if 1 <= len(left) <= 20:
                return left
    return "舊網站資料"

def clean_title(text: str) -> str:
    text = re.sub(URL_RE, "", text)
    text = re.sub(DATE_RE, "", text)
    text = re.sub(r"^[\s\-—–|｜,，。:：]+|[\s\-—–|｜,，。:：]+$", "", text)
    return text[:120].strip() or "未命名文章"

def topic_for(title: str) -> list[str]:
    rules = [
        ("ai-trust", ["AI", "人工智慧", "生成式", "演算法", "深偽"]),
        ("platform-governance", ["平台", "臉書", "Facebook", "Google", "TikTok", "抖音", "社群", "數位"]),
        ("media-reform", ["公視", "公共媒體", "NCC", "媒體改革", "廣電"]),
        ("journalism-crisis", ["新聞", "假新聞", "事實查核", "查核", "假訊息", "媒體"]),
        ("china-authoritarian", ["中國", "中共", "威權", "統戰", "香港", "抖音"]),
        ("peace-climate-journalism", ["和平", "戰爭", "氣候", "環境", "核", "人道", "加薩"]),
        ("global-democracy", ["民主", "川普", "歐洲", "美國", "人權", "自由"]),
    ]
    out=[]
    for slug, kws in rules:
        if any(k in title for k in kws): out.append(slug)
    return out or ["culture-public-thought"]

def extract_candidates(html: str) -> list[tuple[str, str | None]]:
    candidates=[]
    if BeautifulSoup:
        soup = BeautifulSoup(html, "html.parser")
        for a in soup.find_all("a"):
            text = " ".join(a.get_text(" ", strip=True).split())
            href = a.get("href")
            if text and DATE_RE.search(text) and 6 <= len(text) <= 240:
                candidates.append((text, href))
    if not candidates:
        # fallback: split visible-ish text around date occurrences
        text = re.sub(r"<script.*?</script>|<style.*?</style>", " ", html, flags=re.S|re.I)
        text = re.sub(r"<[^>]+>", " ", text)
        text = re.sub(r"\s+", " ", text)
        for m in DATE_RE.finditer(text):
            start=max(0, m.start()-80); end=min(len(text), m.end()+160)
            frag=text[start:end].strip()
            if len(frag) > 20:
                candidates.append((frag, None))
    # de-dupe
    seen=set(); out=[]
    for text,href in candidates:
        key=re.sub(r"\s+", "", text)
        if key not in seen:
            seen.add(key); out.append((text,href))
    return out

def write_item(text: str, href: str | None):
    dt = norm_date(text) or "2008-01-01"
    title = clean_title(text)
    source = guess_source(text)
    slug = hashlib.md5((dt+title).encode("utf-8")).hexdigest()[:8]
    fname = OUT / f"{dt}-{slug}.md"
    topics = topic_for(title)
    tags = ["舊網站匯入"]
    fm = ["---", f"title: {title!r}", f"date: '{dt}'", f"display_date: {dt!r}", f"source: {source!r}"]
    if href:
        fm.append(f"external_url: {href!r}")
    fm += ["article: true", "topics:"] + [f"- {t}" for t in topics] + ["tags:"] + [f"- {t}" for t in tags] + ["summary: '由舊網站匯入的早期公共評論索引。'", "---", ""]
    body = "本文為舊網站匯入文章索引。請人工複核題名、日期、來源與連結。\n"
    fname.write_text("\n".join(fm)+body, encoding="utf-8")
    return fname

def main():
    if len(sys.argv) != 2:
        print(__doc__); raise SystemExit(2)
    html_path=Path(sys.argv[1])
    html=html_path.read_text(encoding="utf-8", errors="ignore")
    OUT.mkdir(parents=True, exist_ok=True)
    written=[]
    for text,href in extract_candidates(html):
        dt=norm_date(text)
        if not dt: continue
        year=int(dt[:4])
        if 2008 <= year <= 2018:
            written.append(write_item(text,href))
    print(f"Generated {len(written)} files under {OUT}")
    for p in written[:20]: print(p)
    if len(written) > 20: print("...")

if __name__ == "__main__":
    main()
