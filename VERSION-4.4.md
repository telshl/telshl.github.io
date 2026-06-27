# Version 4.4｜Phase 3：SEO、社群分享與雙語強化

本版在不改動 Phase 2 知識檔案館架構的前提下，補強 Google、社群分享與國際訪客理解網站所需的基礎資訊。

## 完成項目

- 確認 `languageCode = "zh-TW"`。
- 更新全站 description，使首頁、About、Research、Books、Publications、Commentary、Media、Contact 與評論年份頁各有獨立摘要。
- 新增社群分享用 `static/img/og-image.png`。
- 將 OG image / Twitter Card 改用 1200×630 社群分享圖。
- 補強 Open Graph metadata：`og:image:secure_url`、寬高、alt text。
- 補強 Twitter Card metadata：`twitter:image:alt`。
- 保留並擴充 canonical URL。
- 補入 `robots` 與 `hreflang`。
- 擴充首頁 JSON-LD Person schema，加入中英文研究主題、National Chung Cheng University 與人物描述。
- About 頁加入 English Profile。
- 新增 `/en/` 英文入口頁。
- 首頁英文 bio 縮短為一段更精煉的國際訪客簡介。

## 推薦 commit message

```bash
git commit -m "Version 4.4: strengthen SEO social sharing and English entry"
```
