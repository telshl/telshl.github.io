# 羅世宏個人網站：GitHub Pages 建置完整教學

這份文件是給**完全沒有 Terminal 經驗**的使用者的逐步操作指南。  
完成後，你（或羅教授）只需要**編輯 Markdown 文字檔**，網站就會自動更新。

---

## 第一步：安裝必要工具（只需做一次）

### 1-1 安裝 Git

前往 https://git-scm.com/downloads 下載並安裝。  
安裝完成後，打開「終端機」（Mac）或「命令提示字元」（Windows），輸入：

```
git --version
```

看到版本號碼就代表成功。

### 1-2 安裝 Hugo

前往 https://gohugo.io/installation/ 依照你的作業系統安裝。

Mac 用戶可使用 Homebrew：
```
brew install hugo
```

確認安裝：
```
hugo version
```

---

## 第二步：建立 GitHub 帳號與 Repository

1. 前往 https://github.com 註冊帳號（若已有帳號略過）
2. 登入後點選右上角「+」→「New repository」
3. Repository 名稱設為：`yourusername.github.io`  
   （將 `yourusername` 替換為你的 GitHub 帳號名稱）
4. 設定為 **Public**
5. 點選「Create repository」

---

## 第三步：上傳網站檔案

打開終端機，進入你存放網站的資料夾：

```bash
cd 你存放網站的位置/shihhunglo
```

執行以下指令（逐行輸入）：

```bash
git init
git add .
git commit -m "初始建置"
git branch -M main
git remote add origin https://github.com/你的帳號名稱/你的帳號名稱.github.io.git
git push -u origin main
```

---

## 第四步：開啟 GitHub Pages

1. 前往你的 GitHub repository 頁面
2. 點選上方選單「Settings」
3. 左側找到「Pages」
4. 在「Source」選擇「GitHub Actions」
5. 儲存

等待約 2–3 分鐘，前往 `https://你的帳號名稱.github.io` 即可看到網站。

---

## 日常更新：如何新增評論文章

每次羅教授有新文章，執行以下步驟：

### 新增一篇評論

1. 在 `content/commentary/` 資料夾中新增一個 `.md` 檔案  
   檔名建議：`YYYY-MM-DD-文章簡稱.md`

2. 檔案格式如下：

```markdown
---
title: "文章標題"
date: 2025-06-01
source: "《報導者》"
---

文章內容放在這裡。

可以是摘要，也可以是全文。
若全文在 Substack，這裡放摘要並附上連結即可。
```

3. 儲存後，在終端機執行：

```bash
cd 你存放網站的位置/shihhunglo
git add .
git commit -m "新增評論：文章標題"
git push
```

GitHub Actions 會自動重新部署，約 2 分鐘後網站更新。

---

## 如何修改「關於我」頁面

編輯 `content/about.md` 這個檔案，儲存後 push 即可。

---

## 若要新增學術論文

編輯 `content/publications/_index.md`，在頁面底部加入：

```markdown
**論文標題**（年份）  
期刊名稱，卷(期)，頁碼。[連結](https://doi.org/...)
```

---

## 常見問題

**Q：push 失敗怎麼辦？**  
A：先執行 `git pull` 再重試。

**Q：網站沒有更新？**  
A：前往 GitHub repository 的「Actions」頁面，查看部署狀態是否有錯誤。

**Q：想要換自訂網域（如 shihhunglo.com）？**  
A：購買網域後，在 GitHub Pages 設定中加入 Custom domain，  
並在域名商的 DNS 設定中加入 CNAME 指向 `你的帳號名稱.github.io`。

---

## 設計說明

本網站使用自訂主題，視覺設計概念：

- **底色**：暖白紙色（#f7f5f0）模擬學術出版紙質感
- **主色調**：深墨藍（#1a1f2e）搭配學術深藍（#2e4a8c）
- **字型**：Noto Serif TC（中文）+ EB Garamond（英文）
- **簽名元素**：頂部與頁尾的深藍色橫線，呼應歐洲報紙報頭設計
- **版面**：首頁英雄區採雙欄設計，左欄為主要自我介紹，右欄為研究領域清單

如需修改顏色或字型，編輯 `themes/academic/static/css/main.css` 頂部的 CSS 變數即可。

---

文件製作：Claude（協助建置）  
最後更新：2026 年 6 月
