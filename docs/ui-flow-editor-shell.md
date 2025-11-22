# UI Flow - Editor Shell

## 1. Feature 範圍

本文件描述 `@gravity-ui/markdown-editor` 中「Editor Shell」這一層的 UI 行為與資料流。這個 shell 主要由 `MarkdownEditorView` 與其內部組成負責，涵蓋：

- 編輯器外殼：整個 editor 容器與根節點。
- 模式切換：`wysiwyg` / `markup` / `split` / `preview`。
- 設定面板：`EditorSettings`，包含模式、preview、split、toolbar visibility 等設定。
- Split mode UI：透過 `SplitModeView` 與 `HorizontalDrag` 實作的分割畫面。
- ErrorBoundary 與錯誤提示：確保 UI 出錯時回退到安全狀態。

這份 flow 檔只關注「殼與模式行為」，不深入單一 toolbar 按鈕或 extension 的細節；這些細節會在其他 `ui-flow-*` 檔案中描述。

## 2. 使用者操作流程（Mermaid）

```mermaid
flowchart TD
    A[React page / Storybook story] --> B[useMarkdownEditor hook]
    B --> C[Editor instance (EditorImpl)]
    C --> D[MarkdownEditorView]
    D --> E[EditorWrapper]
    E --> F[WysiwygEditorView / MarkupEditorView]
    E --> G[EditorSettings]
    E --> H[Preview area]
    E --> I[SplitModeView + HorizontalDrag]

    %% 使用者互動
    U1[使用者輸入 / 點擊] --> F
    U2[切換模式 / split / preview] --> G

    %% 狀態回流到 editor
    F --> C
    G --> C
    H --> C
    I --> C

    %% ErrorBoundary
    D --> EB[ErrorBoundary]
    EB --> C
```

說明：

- React 應用或 Storybook story 呼叫 `useMarkdownEditor` 建立 `editor` 實例。
- `editor` 被傳入 `MarkdownEditorView`，由其負責組裝所有 UI。
- `EditorWrapper` 內部切換顯示：
  - `WysiwygEditorView` 或 `MarkupEditorView`。
  - `EditorSettings` 設定面板。
  - 視情況顯示 preview 或 split mode UI。
- 使用者的輸入與操作（打字、點 toolbar、切換模式等）會透過 `editor` 事件與方法回流到核心狀態。
- ErrorBoundary 負責攔截 UI 中的錯誤、顯示 toast，並在必要時將模式切回 `markup` 以確保可恢復性。

## 3. 狀態與資料流向（高層）

### 3.1 從 hook 到 view

- `useMarkdownEditor(props)`：
  - 接收 Markdown/YFM、初始內容、handlers（例如檔案上傳）、實驗選項、模式設定等。
  - 建立 `EditorImpl` 實例，內部組合 core / extensions / logger / preset 等。
  - 回傳 `editor`，提供 API：`getValue`、`on`/`off` 事件訂閱、模式/toolbar 控制等。
- `MarkdownEditorView`：
  - 透過 `props.editor` 或 Context (`useMarkdownEditorContext`) 取得 `editor`。
  - 監聽 `editor` 的 `rerender` 事件以觸發 React 重新 render。
  - 讀取 `editor.currentMode`、`editor.splitModeEnabled`、`editor.toolbarVisible` 等狀態，決定要渲染哪種 view。

### 3.2 Editor Shell 內部的主要狀態

在 `MarkdownEditorView` 與 `EditorWrapper` 內，可以看到幾個重要狀態：

- **模式相關**
  - `editor.currentMode`：`wysiwyg` 或 `markup`。
  - `editor.splitMode` / `editor.splitModeEnabled`：控制 split 模式型態與是否啟用。
  - `showPreview`（React state）：是否顯示 markup 預覽。
- **Toolbar / 設定顯示**
  - `editor.toolbarVisible`：toolbar 是否顯示。
  - `settingsVisible` / `settingsVisibleProp`：`EditorSettings` 是否可見。
  - `stickyToolbar`：是否啟動黏性 toolbar 行為（搭配 `useSticky`）。
- **焦點與快捷鍵**
  - `isWrapperFocused`：判斷 editor 容器是否目前在焦點上。
  - 透過 `useKey` 綁定：
    - 預覽切換快捷鍵。
    - 預覽模式下的送出快捷鍵。

### 3.3 事件與資料流

- **使用者在視圖上的操作**：
  - 打字、點擊 toolbar、切換模式或 split，最終都會呼叫 `editor` 的方法：
    - `changeEditorMode`、`changeSplitModeEnabled`、`changeToolbarVisibility` 等。
  - 這些方法改變 editor 內部狀態，進而觸發 `rerender` 事件。
- **預覽與 split**：
  - 預覽區塊透過 `editor.renderPreview` 渲染，使用 `editor.getValue` 與 Markdown/YFM 設定。
  - Split mode 透過 `SplitModeView` 額外顯示另一個視圖，並由 `HorizontalDrag` 控制兩側寬度比例。
- **錯誤處理**：
  - ErrorBoundary 捕捉錯誤後：
    - 使用 `useToaster` 顯示錯誤通知。
    - 寫入 `globalLogger` 與 `editor.logger`。
    - 將 editor 模式切回 `markup`（避免在有問題的 WYSIWYG 模式卡住），並重置 UI。

## 4. 關鍵檔案與元件

- **Shell 與主視圖**
  - `src/bundle/MarkdownEditorView.tsx`
    - `MarkdownEditorView`：Editor Shell 核心元件。
    - `EditorWrapper`：負責結合 toolbar、編輯器視圖與設定面板。
    - `Settings`：包裝 `EditorSettings` 與搜尋 anchor，並處理 sticky toolbar 行為。
- **Split 與拖拉**
  - `src/bundle/SplitModeView.tsx`
    - 顯示 split mode 下第二個視圖（多半為另一個編輯/預覽區）。
  - `src/bundle/HorizontalDrag.tsx`
    - 提供水平拖拉調整 main 與 split 區塊寬度的 UI。
- **Context 與 editor 注入**
  - `src/bundle/context.ts`
    - `MarkdownEditorProvider` 與 `useMarkdownEditorContext`。
    - 允許透過 Context 而非 props 將 `editor` 傳遞給 Shell。
- **樣式與外觀**
  - `src/styles/styles.scss`
  - `src/bundle/MarkdownEditorView.scss`
    - 定義 editor 殼的 BEM class 命名與樣式（包括 toolbar 區、settings 區、split resizer 等）。

## 5. 已知風險與 TODO

- **責任切割**
  - Editor Shell 需要盡量只負責「呈現與互動」，避免把過多商業邏輯放進 `MarkdownEditorView`，以利未來維護。
- **模式與快捷鍵的擴充**
  - 新增模式或改動快捷鍵時，需同時檢查：
    - editor 內部的狀態欄位與事件是否對應更新。
    - `MarkdownEditorView` 是否正確處理新模式的顯示邏輯。
- **ErrorBoundary 行為**
  - 若未來調整錯誤處理策略（例如不同錯誤顯示不同 UI），需確保：
    - editor 仍能回到可恢復狀態。
    - 不會陷入無限 rerender 或錯誤循環。
- **後續文件**
  - 其他 UI flow 檔（如 toolbar、preview/split、settings）應假設讀者已閱讀本檔，避免重複解釋 Shell 的基本行為，只需聚焦在各自的細節即可。
