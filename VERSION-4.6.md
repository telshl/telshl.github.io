# Version 4.6：公共評論資料化與策展系統整理

本版將公共評論從手寫年份 HTML 清單，升級為可持續維護的資料化文章索引與議題策展系統。

## 主要完成項目

1. 公共評論資料化
   - 將 2019–2026 年公共評論清單轉為 382 個獨立 Markdown 文章資料檔。
   - 新增欄位：`date`、`display_date`、`source`、`external_url`、`topics`、`tags`、`summary`、`article`。
   - 文章資料集中於 `content/commentary/articles/`。

2. 年份頁自動生成
   - `content/commentary/2026.md`
   - `content/commentary/2025.md`
   - `content/commentary/2024.md`
   - `content/commentary/2019-2023.md`
   
   以上頁面改為保留 metadata，由 `themes/academic/layouts/commentary/single.html` 自動依年份產生文章列表。

3. 議題策展主題包
   - 新增 `data/curated_topics.yaml` 作為策展主題資料來源。
   - `/topics/` 改為只顯示真正策展主題包，不再混入一般文章標籤。
   - 新增 8 個主題包：AI 信任、平台治理、公共媒體與媒體改革、新聞業危機、事實查核、中國傳媒與威權資訊秩序、全球民主與公共生活、文化書寫與公共思想。

4. 首頁更新區塊整理
   - 移除重複的 Latest Updates 區塊。
   - 近期更新改為由最新公共評論資料自動生成。

5. SEO 與基本校對
   - 新增公共評論文章 Article JSON-LD。
   - 將預設頁面語言調整為 `zh-TW`。
   - 修正 contact、about、English page 的小錯字與 email 一致性。
   - 修正 CSS 舊變數 `--muted` 問題。

## 重要維護方式

未來新增公共評論時，只需要在 `content/commentary/articles/` 新增一個 Markdown 檔，例如：

```yaml
---
title: "文章標題"
date: "2026-07-01"
source: "媒體名稱"
external_url: "https://example.com/article"
topics:
  - ai-trust
tags:
  - AI 與公共知識
summary: "一至兩句摘要。"
article: true
draft: false
---
```

系統會自動更新首頁、公共評論總覽、年份頁與主題包頁。
