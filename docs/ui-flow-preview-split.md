# UI Flow - Preview & Split

## 1. Feature 範圍

本文件描述 `@gravity-ui/markdown-editor` 中 **Preview 與 Split mode** 的 UI 行為與資料流，聚焦在：

- Markup 模式下的 **預覽區塊** 顯示／隱藏。
- **Split mode**（同時顯示編輯與預覽）的 UI 結構與拖拉調整。
- 與這兩者相關的 **快捷鍵**：
  - 顯示/隱藏預覽：`Ctrl/Cmd + Shift + P`。
  - 在預覽模式中送出：`Ctrl/Cmd + Enter`。

這份 flow 檔假設讀者已理解 editor shell 的基本行為（詳見 `docs/ui-flow-editor-shell.md`），因此不重複介紹整個 Editor 殼，只關注 preview / split 相關部分。

## 2. 使用者操作流程（Mermaid）

```mermaid
flowchart TD
    A[MarkdownEditorView (markup mode)] --> B[EditorWrapper]
    B --> C[Settings / EditorSettings]
    B --> D[MarkupEditorView]
    B --> E[Preview area]
    B --> F[SplitModeView]
    F --> G[HorizontalDrag]

    %% 切換預覽
    U1[使用者: 快捷鍵 Ctrl/Cmd+Shift+P] --> C
    C -->|toggle preview| E

    %% Split mode
    U2[使用者: 在設定中開啟 split mode] --> C
    C -->|enable splitModeEnabled| F

    %% 預覽送出
    U3[使用者: 預覽模式中按 Ctrl/Cmd+Enter] --> E
    E -->|emit submit| H[editor.emit('submit')]
    H --> I[外部 onSubmit 處理]

    %% 拖拉分割
    U4[使用者: 拖拉水平分隔線] --> G
    G --> F
```

說明：

- 當 editor 處於 `markup` 模式時，使用者可以：
  - 透過設定或快捷鍵打開 **Preview**（單純顯示結果視圖）。
  - 啟用 **Split mode**，同時顯示編輯器與另一個視圖（多半為預覽或輔助顯示）。
- HorizontalDrag 允許使用者在 split mode 下拖拉調整左右區塊寬度。
- 在預覽模式中，使用者可以用 `Ctrl/Cmd+Enter` 觸發 `submit` 事件，由外部呼叫者決定如何處理（例如儲存或送出內容）。

## 3. 狀態與資料流向（重點）

### 3.1 與 preview / split 相關的 editor 狀態

在 `MarkdownEditorView` 內，與 preview / split 有關的重要狀態包括：

- `editor.currentMode`：
  - 當為 `'markup'` 時，預覽與 split 才有意義。
- `editor.splitMode`：
  - 描述 split 模式型態（例如 `'horizontal'`）。
- `editor.splitModeEnabled`：
  - 是否啟用 split mode。
- `showPreview`（React state）：
  - 是否顯示 preview 區塊。

這些狀態由 Shell 中的邏輯控制：

- 切換 preview：
  - 會把 `editor.splitModeEnabled` 設為 `false`，避免同時處於 split 與 preview。
  - 透過 `toggleShowPreview` 改變 `showPreview`。
- 切換 split mode：
  - 設定 `editor.splitModeEnabled` 並可能根據需要關閉 preview。

### 3.2 UI 邏輯（簡化自 `MarkdownEditorView.tsx`）

預覽是否顯示：

- `canRenderPreview` 條件約略為：
  - `editor.renderPreview` 存在。
  - `editorMode === 'markup'`。
  - `!editor.splitModeEnabled`。
- 在 `EditorWrapper` 中：
  - 若 `showPreview == true`：
    - 主要顯示 preview 區塊（`editor.renderPreview({...})`）與設定面板。
  - 若 `showPreview == false`：
    - 顯示 `WysiwygEditorView` 或 `MarkupEditorView`（依 `editorMode`），並根據需要秀出 Settings 與 SplitModeView。

Split mode 是否顯示：

- `markupSplitMode` 條件約略為：
  - `editor.splitModeEnabled && editor.splitMode && editorMode === 'markup'`。
- 若為 true，則在主編輯區下方顯示：
  - `HorizontalDrag`（若 `splitMode === 'horizontal'`）。
  - `SplitModeView`（第二個視圖容器）。

## 4. 快捷鍵行為

### 4.1 顯示 / 隱藏 preview

在 `EditorWrapper` 中使用 `useKey` 綁定快捷鍵行為：

- 條件：
  - `canRenderPreview` 為 true（即 editor 處於 markup 模式、且未開啟 split）。
  - 鍵盤事件滿足：
    - `modKey`（Windows: Ctrl / macOS: Cmd）+ `Shift` + `KeyP`。
- 行為：
  - `onShowPreviewChange(!showPreview)`：
    - 把 `editor.splitModeEnabled` 設為 `false`。
    - 切換 `showPreview`，決定是否顯示 preview 區塊。

### 4.2 在 preview 模式中送出（submit）

另一個 `useKey` 綁定：

- 條件（概念化）：
  - `enableSubmitInPreview == true`。
  - `showPreview == true`。
  - 編輯器目前在 focus 狀態（`isFocused`）。
  - 鍵盤事件為 `modKey` + `Enter`。
- 行為：
  - 呼叫 `editor.emit('submit', null)`。
  - 若 `hidePreviewAfterSubmit == true`，則關閉 preview：
    - `onShowPreviewChange(false)`。

這個設計讓使用者在預覽畫面中能快速送出內容，同時可選擇送出後自動關閉預覽以回到編輯狀態。

## 5. UI 元件與檔案索引

- **Shell 層**
  - `src/bundle/MarkdownEditorView.tsx`
    - `MarkdownEditorView`：整體 Shell，決定顯示哪些子視圖。
    - `EditorWrapper`：在 props 中根據 `editorMode`、`showPreview`、`splitModeEnabled` 控制：
      - WYSIWYG / Markup 視圖。
      - Preview 區塊。
      - Settings 面板與 split 開關。
    - 預覽 / split 相關的判斷與 `useKey` 綁定邏輯。
- **Split 與拖拉**
  - `src/bundle/SplitModeView.tsx`
    - 顯示 split 模式下的第二個視圖，通常用來呈現另一份預覽或輔助內容。
  - `src/bundle/HorizontalDrag.tsx`
    - 建立兩個區塊之間的水平拖拉手把，透過 React refs 操縱 DOM 寬度。
- **預覽渲染**
  - 預覽畫面由 `editor.renderPreview` 提供：
    - 使用 `editor.getValue`、`editor.mdOptions`、`editor.directiveSyntax` 等資訊。
    - 實際渲染函式實作在 core/markup/extension 組合內（詳見 FRONTEND_ARCH 與未來專門 flow）。

## 6. 使用本 flow 檔時的注意事項

- 若要調整 preview / split 行為，建議步驟：
  1. 在 `docs/todo/todoYYYY-MM-DD-XX.md` 新開一個主題，寫下目前行為與預期行為差異。
  2. 參考本檔決定要改的是：
     - Shell 判斷邏輯（`canRenderPreview`、`markupSplitMode` 等）。
     - 快捷鍵條件或組合。
     - SplitModeView / HorizontalDrag 的 UI 細節。
  3. 在 todo 中記錄實際修改過的檔案與測試方式（包含 Storybook 操作路徑）。
- 若要加入新的 preview 模式或 split 型態，需評估：
  - 是否要擴充 editor 狀態（`splitMode` 種類）。
  - 是否需要新的快捷鍵或設定選項（可能也涉及 toolbar 或 settings 面板）。

> 本檔目標是讓你在調整 preview 或 split 相關 UI 行為時，有一張清楚的「從按鍵/點擊到畫面變化」及「狀態如何流動」的地圖，搭配 `ui-flow-editor-shell.md` 與 `ui-flow-toolbar.md` 一起閱讀，可以更完整掌握整個 Editor 的 UI 行為。
