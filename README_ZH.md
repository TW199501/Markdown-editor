# 為什麼「改了原始碼」跟「npm install 套件」是兩回事？

你抓到一個很關鍵的點：

- 在這個 repo 裡改 code，是「**修改套件本身的原始碼**」。
- 在別的專案裡跑 `npm install @gravity-ui/markdown-editor`，拿到的是「**npm registry 上已發佈的版本**」。

所以如果你只有改本地 repo、但沒有發版或被 upstream 合併並發版，其他專案 `npm install` 當然看不到你的改動。

---

## 1. 目前你做的兩種安裝，其實對應兩個角色

- **`npm install`（在這個 repo 根目錄）**

  - 角色：**這個套件的開發者 / 貢獻者**。
  - 目的：安裝這個 repo 自己開發需要的 devDependencies、測試工具、Storybook 等。
  - 用來做：
    - `npm start` 看 Storybook。
    - `npm test`、`npm run build` 等，驗證你改的東西。
- **`npm install @gravity-ui/markdown-editor`（在別的專案）**

  - 角色：**這個套件的使用者**。
  - 目的：從 npm registry 下載一份「已發佈版本」來用。
  - 這跟你本機修改的原始碼是兩條線，除非你把修改發佈出去。

你剛剛在 **同一個 repo 裡** 又跑 `npm install @gravity-ui/markdown-editor`，等於是把「自己這個套件」也裝成自己的依賴。這通常沒什麼用，只是多裝了一份發佈版，對目前開發不太影響，但也不需要特別再做什麼。

---

## 2. 那我要怎麼讓「改過的功能」給別的專案用？

有幾條典型路線，你未來如果想「不只自己看得到」，可以選其中一條：

### 路線 1：提 PR 給 upstream，等官方發版（最標準）

- 你在這個 repo：
  - 改 code → 補測試 / Storybook → 開 PR。
- 官方 maintainer：
  - Code review → merge → bump 版本 & `npm publish`。
- 之後任何專案：
  - `npm install @gravity-ui/markdown-editor@新版本`
  - 就會拿到你貢獻進去的功能。

這是**你說的「幫忙做多國語言」最理想的方式**：
你改的是 upstream 倉庫，不是私有 fork。

### 路線 2：自己 fork + 自己發一個套件名（私有或自家用）

- 在 GitHub 上 fork 這個專案，改成你要的版本。
- 改 [package.json](cci:7://file:///d:/app/Markdown%20editor/package.json:0:0-0:0) 的 `name`，例如：
  - `"name": "@your-scope/markdown-editor"`。
- 你自己跑 `npm publish`（公開 / 私有 registry 都可以）。
- 你自己的專案就改成：
  ```bash
  npm install @your-scope/markdown-editor
  ```
- 好處：不必等官方發版。
- 代價：之後要自己維護升級，跟 upstream 差異要自己管理。

### 路線 3：在本機或 monorepo 中用「檔案路徑 / workspace」吃這個 repo

在你的應用程式專案裡，可以指定：

```jsonc
// 你的 app 的 package.json
{
  "dependencies": {
    "@gravity-ui/markdown-editor": "file:../Markdown editor" // 相對路徑
  }
}
```

或是用 pnpm / yarn workspace，把這個 repo 當成 workspace package：

- 這樣 app 直接吃 **本機編譯出來的版本**，
- 改這個 repo 的 code → 重新 build → app 立刻用到。

這種方式適合「內部 monorepo 開發」，**不需要發 npm 包**，也不需要 PR 被合併就能共享。

---

## 3. 回到你現在的目標

你現在的優先順序是：

1. 幫原本專案的 docs / lint 清一清，提改善。
2. 之後幫忙做多國語言。
3. 最後才考慮桌面端或其他專案整合。

對這個路線來說，推薦的模式是：

- **以「upstream 貢獻者」身份來操作**：
  - 在這個 repo 改 code / docs → 跑 `npm test`、`npm start`、`npm run lint` 驗證。
  - 未來合適時開 PR，讓官方 repo 接受你的多國語言 / docs 改動。
- 等官方 release，就會自然透過 `npm install @gravity-ui/markdown-editor` 提供給所有使用者，
  而不是只有你自己看得到。

---

## 4. 要不要處理剛才多裝的那個 `@gravity-ui/markdown-editor`？

- 你在這個 repo 根目錄跑 `npm install @gravity-ui/markdown-editor`：
  - 只是把「自己這個套件」當作一個 dependency 裝進來。
  - 對現在開發沒什麼幫助，也不太會壞掉東西。
- 依 ELF 原則，我不會主動去幫你移除它，除非你明確說「想清掉多餘的依賴」。

---

如果你接下來想試「在別的 demo 專案用**改過的版本**」，我可以幫你設計一個最小範例，例如：

- 用 `file:` 相依到本機 repo，或
- 幫你草擬一個 fork + 改 name 的流程。

你可以先說一下：你未來會有自己的 React/Next 專案要吃這個 editor 嗎？還是短期內都只打算在這個 repo 裡當 upstream 貢獻者使用？

# @gravity-ui/markdown-editor · Markdown 編輯器

![Markdown Editor](https://github.com/user-attachments/assets/0b4e5f65-54cf-475f-9c68-557a4e9edb46)

## Markdown 所見即所得與標記編輯器

`@gravity-ui/markdown-editor` 是一款功能強大的 Markdown 編輯工具，同時結合了 **所見即所得（WYSIWYG）** 與 **純標記（Markup）** 兩種模式。

- 你可以在直覺的視覺模式中編輯內容。
- 也可以完全掌控底層的 Markdown / YFM 標記。

這讓它同時適合一般使用者與需要精準控制標記格式的進階使用者。

### 🔧 主要特性

- 支援基礎 Markdown 與 [YFM](https://ydocs.tech) 語法。
- 透過 ProseMirror 與 CodeMirror 引擎實作，可高度擴充。
- 同時提供 WYSIWYG 與 Markup 兩種模式，使用情境更彈性。

## 安裝

```shell
npm install @gravity-ui/markdown-editor
```

### 必要相依套件

要開始使用這個套件，你的專案還需要安裝數個相依套件，例如：

- `@diplodoc/transform`
- `react`
- `react-dom`
- `@gravity-ui/uikit`
- `@gravity-ui/components`
- 以及其他在 `peerDependencies` 中列出的套件

請參考根目錄的 `package.json` 裡的 `peerDependencies` 區段以取得最準確的需求列表。

## 快速開始（Getting started）

Markdown 編輯器以兩個部分提供：

- 一個 React hook：用來建立 editor 實例（`useMarkdownEditor`）。
- 一個 React 元件：負責渲染編輯器 UI（`MarkdownEditorView`）。

樣式與主題（Theme）的設定請參考 [UIKit 文件](https://github.com/gravity-ui/uikit?tab=readme-ov-file#styles)。

```tsx
import React from 'react';
import {useMarkdownEditor, MarkdownEditorView} from '@gravity-ui/markdown-editor';

function Editor({onSubmit}) {
  const editor = useMarkdownEditor({allowHTML: false});

  React.useEffect(() => {
    function submitHandler() {
      // 將目前內容序列化為 markdown 標記
      const value = editor.getValue();
      onSubmit(value);
    }

    editor.on('submit', submitHandler);
    return () => {
      editor.off('submit', submitHandler);
    };
  }, [onSubmit]);

  return <MarkdownEditorView stickyToolbar autofocus editor={editor} />;
}
```

### 延伸閱讀（官方教學）

以下是已部署到 Storybook 的官方教學文件，可以看到對應的互動示範與說明：

- [如何在 Create React App 中接入編輯器](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-getting-started-create-react-app--docs)
- [如何為 Markup 模式加入預覽區塊](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-getting-started-preview--docs)
- [如何接上 HTML extension](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-extensions-html-block--docs)
- [如何接上 LaTeX extension](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-extensions-latex-extension--docs)
- [如何接上 Mermaid extension](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-extensions-mermaid-extension--docs)
- [如何撰寫自訂 extension](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-develop-extension-creation--docs)
- [如何接上 GPT extension](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-extensions-gpt--docs)
- [如何在 Markdown 模式中加入帶 popup 的文字綁定 extension](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-develop-extension-with-popup--docs)

## 開發（Development）

在本 repo 中啟動 Storybook 開發環境：

```shell
npm start
```

啟動後可以在瀏覽器中瀏覽各種 demo 與教學 stories，方便你對照程式碼與實際行為。

## i18n（國際化）

要設定編輯器本身的語系，只需要呼叫 `configure`：

```typescript
import {configure} from '@gravity-ui/markdown-editor';

configure({
  lang: 'ru',
});
```

別忘了也要依照 [UIKit 的 i18n 說明](https://github.com/gravity-ui/uikit?tab=readme-ov-file#i18n) 以及其他 UI 套件的文件，在你的應用程式中設定它們各自的 `configure()` 或等價的國際化初始化邏輯。

## 貢獻（Contributing）

若你打算對這個專案提交 PR 或 issue，可以先閱讀官方的貢獻指南：

- [Contributor Guidelines](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-contributing--docs)

其中包含：Commit/PR 命名規則、測試與文件的期待，以及如何準備清晰易審查的變更。
