# Version 4.1｜技術清理、SEO 基礎修復與頁面語意結構修正

本版在不改動 Version 4.0 主要內容架構的前提下，完成以下基礎品質修復：

## 技術清理

- 新增 `.gitignore`，排除 Hugo 建置輸出、macOS 系統檔與本機編輯器檔案。
- 移除已提交的 `public/` 建置輸出目錄。
- 移除 `.DS_Store` 與 `.hugo_build.lock`。
- 新增 `layouts/robots.txt`，確保部署後 robots.txt 會包含正式 sitemap URL。

## SEO 基礎修復

- 將 `languageCode` 調整為 `zh-TW`。
- 補強全站 metadata：canonical、Open Graph、Twitter Card 與首頁 JSON-LD Person schema。
- 新增全站預設 description 與首頁社群分享圖設定。
- 為 About、Publications、Media、Contact 補上各自的 description。

## 語意結構修正

- 修改 `_default/single.html` 與 `_default/list.html`，讓一般內容頁自動產生正式 `<h1>`。
- 對已經在內容中手寫 `<h1>` 的 hub 頁面避免重複輸出 H1。
- 新增 `.page-header`、`.page-title`、`.page-description` 樣式。

## 導覽文字微調

- 「出版」改為「學術出版」。
- 「評論」改為「公共評論」。
- 「媒體」改為「媒體與演講」。
