# PROJECT OVERVIEW - @gravity-ui/markdown-editor

## 專案目標與定位

`@gravity-ui/markdown-editor` 是一個針對 React 生態設計的 **Markdown 編輯器套件**，同時支援：

- WYSIWYG 模式（所見即所得編輯）。
- Markup 模式（直接編輯 Markdown 原始碼）。

它整合 ProseMirror 與 CodeMirror 兩套引擎，透過擴充機制（extensions）支援 HTML、LaTeX、Mermaid、GPT 等進階功能，可用於文件平台、部落格系統、後台 CMS、說明文件編輯器等場景。

本專案本身是一個可發佈到 npm 的 library，而非完整的 Web App；開發與預覽主要透過 Storybook 與 demo 來進行。

## 技術棧總覽

- **語言與框架**
  - TypeScript
  - React（16/17/18/19 皆支援，實作以 React 18 為主）
- **編輯核心**
  - ProseMirror：WYSIWYG 內容模型與操作。
  - CodeMirror 6：Markdown 原始碼編輯。
  - markdown-it：解析與轉換 Markdown / YFM。
- **UI 與設計系統**
  - `@gravity-ui/uikit`
  - `@gravity-ui/components`
- **建置與工具鏈**
  - Gulp：負責打包與輸出 ESM/CJS + 型別定義到 `build/`。
  - TypeScript：`tsconfig.json` 以 `@gravity-ui/tsconfig/tsconfig` 為基底。
  - Storybook：作為開發與文件展示環境。
- **測試與品質**
  - Jest：單元測試與部分整合測試。
  - Playwright：端對端／視覺回歸測試（`tests/playwright`）。
  - ESLint、Stylelint、Prettier：程式碼與樣式規範。

## 目錄結構（高層）

```text
根目錄
├─ src/                 # 套件主要程式碼
│  ├─ core/             # 核心 editor 模型與邏輯
│  ├─ view/             # React 視圖層（MarkdownEditorView 等）
│  ├─ extensions/       # 各種擴充：HTML、LaTeX、Mermaid、GPT 等
│  ├─ markup/           # Markup 模式與 markdown-it 整合
│  ├─ cm/               # CodeMirror 相關封裝
│  ├─ pm/               # ProseMirror 相關封裝
│  ├─ toolbar/          # 工具列與按鈕群組
│  ├─ styles/           # SCSS / CSS 樣式
│  ├─ bundle/           # 封裝輸出的 bundle 組合
│  ├─ presets/          # 預設組態與組合
│  ├─ plugins/          # 內部 plugin 與掛鉤
│  ├─ forms/            # 與表單／設定相關的 UI 或模型
│  ├─ i18n/             # 多語系字串與設定
│  ├─ icons/            # Editor 使用的圖示
│  ├─ table-utils/      # 表格相關工具
│  ├─ shortcuts/        # 鍵盤快捷鍵設定
│  ├─ utils/            # 共用工具函式
│  ├─ react-utils/      # React 專用 utilities / hooks
│  ├─ types/            # 型別定義
│  ├─ index.ts          # 套件主要匯出點（useMarkdownEditor 等）
│  ├─ configure.ts      # 全域設定（例如 i18n）
│  └─ version.ts        # 版本資訊
│
├─ demo/                # Storybook / demo 使用的輔助程式碼
│  ├─ components/       # demo 專用元件
│  ├─ defaults/         # demo 預設設定
│  ├─ hocs/             # demo 用高階元件
│  ├─ hooks/            # demo 用 React hooks
│  ├─ stories/          # Storybook stories
│  └─ utils/            # demo 共用工具
│
├─ tests/               # 測試程式
│  ├─ ...               # Jest 測試檔
│  └─ playwright/       # Playwright 測試與設定（見 scripts 與 config）
│
├─ docs/                # 使用說明與整合指南
│  ├─ how-to-*.md       # 如何在 CRA / Next.js 等專案中整合 editor
│  ├─ how-to-*-zh.md    # 中文說明文件
│  ├─ rule/             # ELF 協作規則與 AI 上手文件
│  └─ todo/             # 每日／每主題 todo 記錄（本專案協作約定）
│
├─ scripts/             # 內部工具腳本（例如檢查循環依賴、Playwright Docker 相關）
├─ .storybook/          # Storybook 設定
├─ src-config files     # lints / 編譯 / 專案設定
│  ├─ package.json
│  ├─ package-lock.json
│  ├─ tsconfig.json
│  ├─ gulpfile.js
│  ├─ jest.config.js
│  ├─ .eslintrc, .stylelintrc, .prettierrc.js, .editorconfig 等
│  └─ .github/          # CI / release workflows
└─ README*.md           # 套件說明（英文與俄文）
```

> 註：實際子目錄與檔案請以專案為準，上述為高層摘要，用來協助快速建立心智模型。

## 開發與執行指令

以下指令來自 `package.json` 的 `scripts` 區塊，僅列出較常用與與開發／建置／測試直接相關者：

```bash
# 啟動 Storybook 開發環境（主開發入口）
npm start
# 等同於
npm run storybook:start

# 建置套件（輸出到 build/）
npm run build

# TypeScript 型別檢查（不輸出檔案）
npm run typecheck

# 單元測試
npm test
# 或
npm run test:cov    # 帶 coverage
npm run test:watch  # watch 模式

# Playwright 測試（需先安裝瀏覽器）
npm run playwright:install
npm run playwright

# Lint（程式碼／樣式／Prettier）
npm run lint
npm run lint:js
npm run lint:styles
npm run lint:prettier
```

> 實際在團隊協作時，建議在 `docs/todo/todoYYYY-MM-DD-XX.md` 中記錄每次執行的指令與結果（成功／失敗與錯誤摘要），方便追蹤 build 與測試狀態。

## 模組與擴充點（高層概念）

- **核心 API 與主要匯出**
  - 透過 `useMarkdownEditor` hook 建立 editor 實例。
  - 使用 `MarkdownEditorView` 等 React 元件呈現編輯器 UI。
  - 其他匯出（extensions、specs、view 子模組等）則透過 `exports` 設定提供給使用者按需引入。
- **擴充機制**
  - `src/extensions/` 下提供一系列 extension 實作，可為 editor 新增區塊型或行內功能（如 HTML block、LaTeX、Mermaid、GPT 等）。
  - 也可以結合 `@diplodoc/*` 套件擴充更進階的 Markdown 行為。
- **工具列與快捷鍵**
  - `src/toolbar/` 定義 editor 使用的工具列項目與群組。
  - `src/shortcuts/` 管理鍵盤快捷鍵組態，並在 `sideEffects` 中標註，確保 bundle 時正確載入。

## 後續文件與延伸

依 ELF 規則，本檔作為 **單一專案總覽**，後續僅在此檔增修小節，而不再新增額外的 overview 檔案。其他說明可依情境放在：

- `docs/FRONTEND_ARCH.md`：
  - 更詳細說明 editor 啟動流程、React 組件關係，以及 `core` / `view` / `extensions` / `markup` 等模組的互動方式。
- `docs/ui-flow-<feature>.md`：
  - 若未來需要針對特定功能（例如某個 extension 或 toolbar 重構）畫 UI / data flow，才新增少數這類檔案。
- `docs/todo/todoYYYY-MM-DD-XX.md`：
  - 所有日常分析、實驗、bug 排查與實作細節，一律集中於每日／每主題的 todo 檔中紀錄。
