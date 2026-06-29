# Version 4.5.4：公共評論頁視覺統一

本次調整聚焦「公共評論」頁，讓其排版與 Books、Research、Publications、Media 等頁面保持一致。

## 修改項目

- 重寫 `themes/academic/layouts/commentary/list.html`。
- 移除公共評論頁原先與其他頁面不一致的簡易 taxonomy 標籤區。
- 新增一致化的頁首介紹區、主題地圖、年份索引與最新評論區塊。
- 修正 `content/commentary/_index.md` 中錯誤的頁首標題與多餘 HTML。
- 新增 CSS 樣式，使公共評論頁使用與其他頁相近的卡片、留白、字級與線條系統。
- 避免 `baseof.html` 外層 `<main>` 與 commentary layout 內層 `<main>` 重複巢狀。

## 備註

- 年份文章頁，如 `/commentary/2026/`、`/commentary/2024/`，保留原有文章清單結構。
- 新增的 `content/commentary/articles/` 文章會自動出現在「最新評論」區。
