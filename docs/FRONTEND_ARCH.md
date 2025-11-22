# FRONTEND_ARCH - @gravity-ui/markdown-editor

## 1. 前端架構總覽

本專案是一個發佈到 npm 的 **React Markdown 編輯器套件**，而不是完整的 SPA。它提供：

- 一組 React hook 與元件：
  - `useMarkdownEditor`：建立並管理 editor 核心實例。
  - `MarkdownEditorView`：根據 editor 狀態渲染 WYSIWYG / Markup / Split / Preview UI。
- 一個可選的 React Context：
  - `MarkdownEditorProvider` + `useMarkdownEditorContext`。
- 一系列可組合的核心模組與 extensions：
  - `core/`（Editor 模型與 extension 系統）。
  - `extensions/`（功能擴充）。
  - `markup/`（Markdown/YFM 與 CodeMirror 整合）。
  - `toolbar/`、`modules/toolbars/`（工具列結構）。

整體架構可以粗略畫成：

```text
React App / Storybook stories
└─ 使用 @gravity-ui/markdown-editor
   ├─ useMarkdownEditor(props)         # 建立 Editor 實例（核心 + extensions）
   ├─ <MarkdownEditorView editor={…}/> # 顯示編輯器 UI
   └─ （可選）<MarkdownEditorProvider> + useMarkdownEditorContext()

核心層
├─ core/       # Editor 模型、extensions 系統、序列化/反序列化
├─ markup/     # Markdown / YFM / CodeMirror
├─ extensions/ # 內建功能模組（HTML, LaTeX, Mermaid, GPT 等）
└─ toolbar/    # 工具列 preset 與組態

支援層
├─ react-utils/  # React hooks 與錯誤處理
├─ i18n/         # 多語系
├─ styles/       # 樣式
├─ table-utils/  # 表格輔助
└─ utils/        # 共用工具
```

## 2. Editor 啟動流程（React 應用層）

### 2.1 典型使用方式（概念示意）

在一般 React 應用或 Storybook story 中，最常見的使用方式是：

```tsx
import React from 'react';
import {useMarkdownEditor, MarkdownEditorView} from '@gravity-ui/markdown-editor';

function Editor({onSubmit}: {onSubmit: (value: string) => void}) {
    const editor = useMarkdownEditor({
        // 這裡傳入 Markdown/YFM、WYSIWYG、handlers 等設定
    });

    React.useEffect(() => {
        function handleSubmit() {
            const value = editor.getValue();
            onSubmit(value);
        }

        editor.on('submit', handleSubmit);
        return () => {
            editor.off('submit', handleSubmit);
        };
    }, [editor, onSubmit]);

    return <MarkdownEditorView stickyToolbar autofocus editor={editor} />;
}
```

關鍵點：

- `useMarkdownEditor` 負責建立 **Editor 核心實例**，並處理 preset／extensions／logger／Markdown 轉換等細節。
- `MarkdownEditorView` 則只關注「如何把這個 Editor 畫出來」以及使用者互動（toolbar、模式切換、預覽、錯誤邊界等）。

### 2.2 `useMarkdownEditor` 的運作（`src/bundle/useMarkdownEditor.ts`）

`useMarkdownEditor` 是整個 editor 啟動流程的入口 hook，其大致步驟如下：

1. **拆解 props**：
   - `md`：Markdown/YFM 行為（如 `breaks`）。
   - `initial`：初始內容或狀態。
   - `handlers`：外部行為，例如檔案上傳 `uploadFile`。
   - `experimental`：實驗性選項，如 `preserveEmptyRows`、`needToSetDimensionsForUploadedImages` 等。
   - `markupConfig`、`wysiwygConfig`：兩個模式的細部設定（含 extensions 與 toolbar 相關選項）。
   - `logger`：若未提供則建立新的 `Logger2` 實例。
   - `preset`：預設為 `'full'`，透過 `MarkdownEditorPreset` 控制使用哪些內建功能組合。

2. **建立編輯器建構所需資源**：
   - `renderStorage = new ReactRenderStorage()`：
     - 用來管理需要 React render 的 node views 或 UI 區塊。
   - `pmTransformers = getPMTransformers({ emptyRowTransformer: experimental.preserveEmptyRows })`：
     - 控制 ProseMirror 在空行處理上的轉換行為。
   - `directiveSyntax = new DirectiveSyntaxContext(experimental.directiveSyntax)`：
     - 控制 YFM directive 語法的支援方式。

3. **組裝 extensions**：
   - 建立一個 `extensions: Extension` 函式，內部使用 `builder.use(BundlePreset, {...})`：
     - 帶入 preset、directiveSyntax、renderStorage、各種 handler 與選項：
       - `onCancel` / `onSubmit`：對應 editor 事件。
       - `disableMdAttrs`、`preserveEmptyRows`、`placeholderOptions`。
       - `md.breaks`、`fileUploadHandler`、影像尺寸相關選項。
       - `mobile`：行動裝置相關差異。
     - 若使用者透過 `wysiwygConfig.extensions` 提供額外 extensions，則再呼叫 `builder.use(extraExtensions, extensionOptions)` 將其掛入。

4. **建立 `EditorImpl` 實例**：
   - `EditorImpl` 是 bundle 層對核心 `Editor` 的具體實作，接收：
     - 所有原本 props。
     - 上述 logger、preset、renderStorage、directiveSyntax、pmTransformers。
     - 組合後的 `wysiwygConfig`（內含 `extensions`）。

5. **使用 `useLayoutEffect` 管理 side effects**：
   - 監聽 `toolbar-action` 事件：
     - 將 action 資訊（mode、id）丟給 `globalLogger` 與 editor 自身的 `logger`，方便後續追蹤與分析。
   - 在 effect 清理階段：
     - 移除事件監聽。
     - 呼叫 `editor.destroy()`，釋放資源。

6. **回傳 `editor` 實例**：
   - 呼叫端可以：
     - 透過 `editor.getValue()` 取得 Markdown。
     - 綁定 `editor.on('submit' | 'cancel' | 'rerender' | ...)` 等事件。
     - 將 editor 傳給 `MarkdownEditorView` 或透過 Context 注入。

### 2.3 `MarkdownEditorView` 的職責（`src/bundle/MarkdownEditorView.tsx`）

`MarkdownEditorView` 是視圖層的核心元件，負責：

- **視圖模式切換**：
  - `wysiwyg` / `markup` / `split` / `preview`。
  - 透過 `editor.changeEditorMode`、`editor.changeSplitModeEnabled` 等方法驅動核心狀態。
- **工具列與設定區塊**：
  - 使用 `getToolbarsConfigs` 與 `ToolbarsPreset` 決定實際 toolbar 組合與隱藏項目。
  - 內部 `EditorSettings` 元件提供模式切換、預覽切換、toolbar 顯示控制等 UI。
  - 透過 `useSticky` 與 `stickyToolbar` 選項實作「黏性工具列」。
- **預覽模式與快捷鍵**：
  - 利用 `useKey` 綁定特定快捷鍵：
    - 顯示/隱藏預覽（`Ctrl/Cmd + Shift + P`）。
    - 在預覽模式中送出（`Ctrl/Cmd + Enter`）。
  - 預覽區塊透過 `editor.renderPreview` 渲染，並使用目前的 `editor.getValue()` 與 `editor.directiveSyntax` 等資訊。
- **Split mode（分割畫面）**：
  - 在 `markup` 模式下可開啟 split mode，同時顯示編輯與預覽區。
  - 使用 `HorizontalDrag` 與 `SplitModeView` 組件管理兩側區塊大小與樣式。
- **錯誤邊界與提示**：
  - 外層使用 `react-error-boundary` 的 `ErrorBoundary`：
    - 捕捉內部錯誤，使用 `useToaster` 顯示錯誤通知（來自 `@gravity-ui/uikit`）。
    - 將 editor 模式切換回 `markup` 以提高可恢復性，並寫入 `globalLogger` 與 `editor.logger`。
- **重新渲染機制**：
  - 監聽 editor 的 `rerender` 事件，搭配 `useUpdate` 強制 React 重新 render 視圖，確保狀態變化能反映在 UI 上。

### 2.4 Context：`MarkdownEditorProvider` 與 `useMarkdownEditorContext`

`src/bundle/context.ts` 內定義了一個簡單的 React Context：

- `MarkdownEditorProvider`：
  - `EditorContext.Provider`，可以在外層注入 editor 實例。
- `useMarkdownEditorContext()`：
  - 讓巢狀子元件方便取得 editor 實例。
- 在 `MarkdownEditorView` 內部：
  - 會優先使用 `props.editor`；若不存在，則回退到 Context（`useMarkdownEditorContext`）。

這意味著：

- **預設建議用法**（也與 README 範例一致）：
  - 直接呼叫 `useMarkdownEditor`，並將回傳值透過 `editor` prop 傳給 `MarkdownEditorView`。
- **進階用法**：
  - 若有許多巢狀自訂元件需要使用 editor，可在上層使用 `MarkdownEditorProvider value={editor}`，讓內層透過 `useMarkdownEditorContext()` 取得實例。

## 3. 主要模組分層與責任

### 3.1 Bundle / View / React 層

- `src/bundle/`：
  - `useMarkdownEditor.ts`：editor 啟動 hook，負責把核心與 extensions 組裝起來。
  - `MarkdownEditorView.tsx`：視圖主體元件，負責 UI 與互動。
  - `context.ts`：React Context 包裝。
  - `config/`：工具列 preset 與相關設定。
  - `HorizontalDrag.tsx`、`SplitModeView.tsx` 等：split mode 相關 UI。
- `src/view/`：
  - `components/`：與 view 層相關的共用 UI 元件。
  - `hooks/`：view 專用 hooks（例如與 Files gallery 或 YFM 顯示有關）。
  - `types/`：view 層專用型別。
- `src/react-utils/`：
  - `ErrorBoundary`、`useSticky`、`useSharedEditingState` 等協助實作與 React 整合的工具。

### 3.2 Core / Markup / Extensions 層

- `src/core/`：
  - `Editor`：主編輯器模型與狀態管理。
  - `ExtensionBuilder`、`ExtensionsManager`：擴充系統（extensions）的註冊與相依管理。
  - types：
    - `Extension*`、`Action*`、`Keymap`、`NodeViewConstructor` 等。
  - Markdown / Serializer：
    - `MarkdownParserDynamicModifierConfig`、`MarkdownSerializerDynamicModifierConfig` 等設定介面。
- `src/markup/`：
  - 負責 Markdown / YFM 與 ProseMirror / CodeMirror 之間的轉換。
  - 相關 helper 在 `src/markup/commands` 與 `src/markup/commands/helpers` 中，並由 `src/index.ts` 匯出為 `MarkupCommands`、`MarkupHelpers`。
- `src/extensions/`：
  - 整理各種擴充功能（HTML、LaTeX、Mermaid、GPT、color tabs…），供 bundle 層的 `BundlePreset` 作為預設組合。

### 3.3 工具列與 UI 設定層

- `src/toolbar/`：
  - 定義工具列項目與其組合邏輯。
- `src/modules/toolbars/`：
  - `types.ts` 定義工具列 preset 與 toolbar 資料結構。
- `src/bundle/toolbar/utils/toolbarsConfigs.ts`：
  - 根據 `ToolbarsPreset` 與 props（含 deprecated 的 toolbar config）計算實際使用的 toolbar 設定。

### 3.4 支援層

- `src/i18n/`：
  - 使用 `i18n/bundle` 讀取翻譯字串，搭配 `configure({lang})` 控制語系。
- `src/styles/`：
  - `styles.scss`、`MarkdownEditorView.scss` 等，為整個 editor 提供樣式。
- `src/table-utils/`、`src/utils/`：
  - 提供表格、選取、節點與 mark 操作等共用工具函式，許多 helper 也由 `src/index.ts` 匯出供外部直接使用。

## 4. Storybook / demo 與 library 的關係

- `demo/` 目錄是 **使用同一套 API 的範例與 Storybook stories**：

```text
demo/
├─ components/   # 範例專用 UI 元件
├─ defaults/     # 範例的預設設定與內容
├─ hocs/         # 高階元件（例如把 editor 包在 layout 或 provider 內）
├─ hooks/        # 範例用 hooks（例如同步外部狀態）
├─ stories/      # Storybook stories，展示不同 preset / 功能場景
└─ utils/        # 範例共用工具
```

這些 stories 大多：

- 直接呼叫 `useMarkdownEditor` 建立 editor。
- 使用 `<MarkdownEditorView ... />` 呈現 UI。
- 示範如何：
  - 覆寫 toolbar preset / config。
  - 開啟或關閉某些 extensions。
  - 整合 GPT、Mermaid、HTML block 等功能。

在理解架構或準備客製化時，這些 stories 是實作層面的補充範例；而本檔與 `PROJECT_OVERVIEW.md` 則提供高層地圖。

## 5. 後續延伸與文件策略

- **若要更深入特定功能的 UI / Data flow**：
  - 例如 GPT extension、表格拖拉、Mobile 模式等，可依 ELF 規則新增少量：
    - `docs/ui-flow-<feature>.md`，內含 mermaid 流程圖與關鍵檔案列表。
- **若需要調整核心行為或擴充新 extension**：
  - 先在對應的 `docs/todo/todoYYYY-MM-DD-XX.md` 中寫「分析與方案」，再進入實作。
  - 本檔只需要在模組分層有重大變更時，補幾行說明即可（避免檔案膨脹）。

> 本檔的目標是：用一份穩定的前端架構說明，讓任何新加入的開發者或 AI，能在短時間內理解 editor 是如何被啟動、如何分層、各模組大致負責什麼，再搭配 `docs/PROJECT_OVERVIEW.md` 與每日 todo 檔進入細節。
