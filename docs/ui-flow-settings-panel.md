# UI Flow - Settings Panel (EditorSettings)

## 1. Feature 範圍

本文件描述 `@gravity-ui/markdown-editor` 中 **設定面板 (EditorSettings)** 的 UI 行為與資料流，聚焦：

- `EditorSettings` 如何控制：
  - 編輯模式：`wysiwyg` / `markup`。
  - Toolbar 是否顯示：`toolbarVisibility`。
  - Split mode 是否啟用：`splitModeEnabled`。
  - Preview 按鈕：切換 `showPreview`，並與 split mode 互斥。
- `settingsVisible` / `SettingItems[]` 如何決定面板顯示哪些區塊。
- Settings 按鈕與浮動面板如何插入在 WYSIWYG / Markup 視圖與 toolbar 旁邊。

本檔搭配：

- `docs/ui-flow-editor-shell.md`：整體 shell 與模式切換。
- `docs/ui-flow-toolbar.md`：toolbar config 與按鈕行為。
- `docs/ui-flow-preview-split.md`：preview / split mode 與快捷鍵行為。

## 2. 使用者操作流程（Mermaid）

```mermaid
flowchart TD
    A[MarkdownEditorView] --> B[EditorWrapper]
    B --> C[Settings (EditorSettings)]

    %% Preview Button
    U1[使用者: 點擊預覽按鈕 (Eye)] --> C
    C -->|onShowPreviewChange(!showPreview)| B
    B -->|toggle showPreview & disable split| A

    %% 打開 Settings popup
    U2[使用者: 點擊設定齒輪按鈕] --> C
    C --> D[SettingsContent Popup]

    %% Mode 切換
    D -->|選 WYSIWYG| M1[onModeChange('wysiwyg')]
    D -->|選 Markup| M2[onModeChange('markup')]
    M1 --> E[editor.changeEditorMode({mode, reason:'settings'})]
    M2 --> E
    E --> F[unsetShowPreview()]

    %% Toolbar 顯示/隱藏
    D -->|勾選「顯示工具列」Checkbox| T1[onToolbarVisibilityChange]
    T1 --> G[editor.changeToolbarVisibility({visible})]

    %% Split mode
    D -->|勾選「Split mode」Checkbox| S1[onSplitModeChange]
    S1 --> H[EditorWrapper.onSplitModeChange]
    H -->|unsetShowPreview()| A
    H -->|editor.changeSplitModeEnabled({splitModeEnabled})| A
```

說明：

- 上層 `EditorWrapper` 準備好 `settingsProps`，把各種狀態與 handler 傳入 `EditorSettings`。
- 使用者：
  - 點選預覽按鈕：直接呼叫 `onShowPreviewChange`，切換 preview，並保證 split mode 關閉。
  - 點選齒輪：打開 `SettingsContent` popup，在其中做 mode / toolbar / split mode 的設定。
- `SettingsContent` 內部只關注 UI 與事件觸發；真正改變 editor 狀態的工作在 `EditorWrapper` 與 `Editor` 物件中完成。

## 3. 狀態與 props 流向

### 3.1 從 EditorWrapper 到 EditorSettings

在 `src/bundle/MarkdownEditorView.tsx` 中，`EditorWrapper` 建立 `settingsProps`：

- `mode: editorMode`
- `onModeChange(type)`：
  - `editor.changeEditorMode({mode: type, reason: 'settings'})`
  - `unsetShowPreview()`
- `onShowPreviewChange(showPreviewValue)`：
  - `editor.changeSplitModeEnabled({splitModeEnabled: false})`
  - 若值有變化則呼叫 `toggleShowPreview()`
- `onSplitModeChange(splitModeEnabled)`：
  - `unsetShowPreview()`
  - `editor.changeSplitModeEnabled({splitModeEnabled})`
- `toolbarVisibility: editor.toolbarVisible && !showPreview`
- `splitMode: editor.splitMode`
- `splitModeEnabled: editor.splitModeEnabled`
- `renderPreviewButton: canRenderPreview`：
  - 僅在 `markup` 模式、尚未啟用 split、且有 `editor.renderPreview` 時為 true。
- `showPreview`
- `stickyToolbar`
- `toolbarVisibility` 與 `settingsVisible` / `renderPreviewButton` 一起決定 Settings 的實際擺放位置與顯示方式。

Settings 在 UI 中被使用三種情況：

- 在 preview 視圖中（`showPreview === true`）：
  - `Settings` 被放在 preview 下方，`settingsVisible={settingsVisibleProp}`。
- 在有 toolbar 的 WYSIWYG / Markup 視圖中：
  - 作為 children 插入 `WysiwygEditorView` / `MarkupEditorView`，並由 toolbar 控制：
    - `settingsVisible={editor.toolbarVisible && settingsVisibleProp}`。
- 當 toolbar 隱藏時：
  - 在 editor 下方額外渲染一個 `Settings`：
    - `settingsVisible={!editor.toolbarVisible && settingsVisibleProp}`。
    - `renderPreviewButton={!editor.toolbarVisible && canRenderPreview}`。

### 3.2 EditorSettings 自己的狀態

在 `src/bundle/settings/index.tsx` 中：

- `EditorSettings` 接收：
  - `renderPreviewButton`：是否顯示 Eye 預覽按鈕。
  - `settingsVisible`：`boolean | SettingItems[]`。
  - `onShowPreviewChange` / `showPreview`：控制 preview 狀態。
- 自身維護：
  - `chevronElement`：Settings 齒輪按鈕的 DOM ref，作為 Popup anchor。
  - `popupShown`：Popup 是否開啟（使用 `useBooleanState`）。
  - `zIndex`：透過 `useTargetZIndex(LAYOUT.STICKY_TOOLBAR)` 讓設定面板在 sticky toolbar 上層。

計算：

- `areSettingsVisible`：
  - `settingsVisible === true` 或是 `Array.isArray(settingsVisible) && settingsVisible.length > 0`。
- 當 `renderPreviewButton && settingsVisible`：
  - 在 Eye 按鈕與 Settings 齒輪之間畫一條分隔線。

### 3.3 SettingsContent 的細節

`SettingsContent` 主要負責三個區塊：mode / toolbar / split mode。

- `settingsVisible` 若是陣列（`SettingItems[]`）：
  - `mode`：是否顯示模式切換選項。
  - `toolbar`：是否顯示 toolbar 顯示/隱藏選項。
  - `split`：是否顯示 split mode 選項。

對應邏輯：

- Mode 區塊：
  - 兩個 `Menu.Item`：
    - `wysiwyg`：`onClick` 時呼叫 `onModeChange('wysiwyg')`，然後 `onClose()` 關閉面板。
    - `markup`：同上但傳入 `'markup'`。
  - 若 `disableMark` 為 false，則在 markup 項目旁邊顯示 `HelpMark`：
    - 內容為 `MarkdownHints`，解釋 markup 模式與相關語法。
- Toolbar 區塊：
  - 僅在 `showToolbarSetting && !showPreview` 時顯示。
  - Checkbox：
    - `checked={toolbarVisibility}`。
    - `onUpdate={onToolbarVisibilityChange}` → 上層 `EditorWrapper` 會呼叫 `editor.changeToolbarVisibility({visible})`。
- Split mode 區塊：
  - 僅在 `showSplitModeSetting && splitMode`（有實際 split mode 支援）時顯示。
  - Checkbox：
    - `disabled={mode !== 'markup'}`。
    - `checked={splitModeEnabled}`。
    - `onUpdate={onSplitModeChange ?? noop}`。
  - 文字提示說明 split mode 的用途與限制。
- 底部顯示版本：
  - `<span className={bContent('version')}>{VERSION}</span>`。

## 4. 關聯檔案與關鍵節點

- `src/bundle/MarkdownEditorView.tsx`
  - `EditorWrapper`：
    - 建立 `settingsProps`。
    - 根據不同模式與 toolbar 顯示邏輯放置 `Settings` 元件。
    - 確保切換 preview / split / mode 時正確更新 editor 狀態並避免互相衝突。
  - `Settings`（本檔案內部 helper component，**非** `EditorSettings`）：
    - 包裝 `EditorSettings` + sticky 行為（`useSticky`）。
    - 控制是否顯示 preview 按鈕與 settings popup。

- `src/bundle/settings/index.tsx`
  - `EditorSettings`：
    - 將 preview 按鈕與 settings 齒輪組成一個設定區塊。
    - 管理 settings popup 的開關與錨點。
  - `SettingsContent`：
    - 實際顯示 mode / toolbar / split mode 的設定選項。
    - 呼叫上層提供的 `onModeChange`、`onToolbarVisibilityChange`、`onSplitModeChange`。
  - `MarkdownHints`：
    - 收納 Markdown 模式的說明與提示（透過 `HelpMark` 顯示）。

- 其他：
  - `src/bundle/types.ts`：
    - `MarkdownEditorMode`、`MarkdownEditorSplitMode` 等型別定義。
  - `src/version.ts`：
    - 專案版本字串，用於設定面板底部顯示。
  - `src/common/layout.ts`：
    - `LAYOUT.STICKY_TOOLBAR` 定義 sticky toolbar 的 z-index 層級。

## 5. 使用本 flow 檔時的注意事項

- **調整設定選項顯示範圍**：
  - 建議先用 `settingsVisible` / `SettingItems[]` 控制顯示哪些區塊，不要直接砍掉 SettingsContent 某些片段。
  - 若要針對某個產品場景（例如嵌入模式）隱藏 split 或 toolbar 設定，可以只傳 `['mode']` 或 `['mode', 'toolbar']` 等。
- **修改互斥邏輯時要特別小心**：
  - 目前設計是：
    - 開啟 preview 時會關閉 split mode。
    - 啟用 split mode 時會關閉 preview。
    - 從 settings 切換 mode 時會關閉 preview。
  - 若要改成允許某些特殊組合，需重新檢查：
    - `onShowPreviewChange`、`onSplitModeChange`、`onModeChange` 三者的實作。
    - `canRenderPreview` 與 `markupSplitMode` 條件（見 `ui-flow-preview-split.md`）。
- **UI 細節調整（樣式、icon 等）**：
  - 請在新 todo 中記錄修改理由與預期效果，再調整：
    - `src/bundle/settings/index.scss`。
    - Icon 或 Tooltip 相關行為。

> 搭配 `ui-flow-editor-shell.md` / `ui-flow-toolbar.md` / `ui-flow-preview-split.md` 一起閱讀，可以從「整體 shell → 工具列 → preview/split → 設定面板」的角度，掌握整個 Editor UI 的可配置點與互動關係。
