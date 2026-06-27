# Version 4.0：研究、著作與公共評論架構重整

本版本新增 Books 與 Research 頁面，調整主選單與首頁入口，將網站核心從一般履歷展示轉向研究主題、代表著作、學術出版與公共評論。不將課程與學生教材作為網站主軸。

主要調整：

- 新增 `content/books/_index.md`
- 新增 `content/research/_index.md`
- 更新 `content/commentary/_index.md`，加入公共評論主題地圖
- 更新 `themes/academic/layouts/index.html`，首頁入口改為「著作／研究／公共評論」
- 更新 `hugo.toml`，主選單新增「著作」「研究」
- 新增 `.gitignore`
- 移除不需提交的 `public/`、`.DS_Store`、`.hugo_build.lock`
- 新增 `static/robots.txt`

## 4.0.1 Photo size refinement

- 調整首頁個人照片尺寸：桌機版由約 208px 降至 168px，平板版約 144px，手機版約 108px。
- 降低照片陰影厚度，使 Hero 區文字、著作、研究與公共評論入口更突出。
