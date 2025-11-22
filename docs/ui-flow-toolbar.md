# UI Flow - Toolbar

## 1. Feature 範圍

本文件說明 `@gravity-ui/markdown-editor` 中「Toolbar」這一層的 UI 行為與資料流，包含：

- toolbar preset（內建/自訂按鈕組合）。
- `toolbarConfig`（主要工具列排版）。
- `hiddenActionsConfig`（更多動作／收合選單中的項目）。
- WYSIWYG / Markup 兩種模式下 toolbar 的差異。
- Toolbar 元件如何從 preset 轉成實際按鈕與互動行為。

本檔聚焦「toolbar 的組裝流程與資料流」，不重複 editor shell 的內容；建議先閱讀 `docs/ui-flow-editor-shell.md` 後再看此檔。

## 2. 使用者操作流程（Mermaid）

```mermaid
flowchart TD
    A[React page / Storybook story] --> B[useMarkdownEditor(props)]
    B --> C[EditorImpl with preset]
    C --> D[MarkdownEditorView]
    D --> E[EditorWrapper]
    E --> F[getToolbarsConfigs]
    F --> G[wysiwygToolbarConfig / markupToolbarConfig]
    F --> H[wysiwygHiddenActionsConfig / markupHiddenActionsConfig]
    G --> I[Toolbar / ToolbarGroup / ToolbarButton]
    H --> J[Hidden actions menu / list buttons]

    U1[使用者點 toolbar 按鈕] --> I
    U2[使用者打開 hidden actions] --> J

    I --> K[editor actions: exec / isActive / isEnable]
    J --> K
    K --> C
```

說明：

- `useMarkdownEditor` 會依照 `preset` / `wysiwygConfig` 等設定決定使用哪一組 toolbar preset。
- `MarkdownEditorView` 透過 `getToolbarsConfigs` 計算出：
  - `wysiwygToolbarConfig` / `markupToolbarConfig`：主要工具列的群組與按鈕。
  - `wysiwygHiddenActionsConfig` / `markupHiddenActionsConfig`：出現在收合選單中的動作。
- Toolbar 元件（`Toolbar`、`ToolbarGroup`、`ToolbarButton` / `ToolbarListButton` 等）根據這些 config 渲染 UI。
- 使用者點擊 toolbar 按鈕或 hidden actions 時，會觸發對應的 editor action（`exec`）、並透過 `isActive` / `isEnable` 控制 UI 狀態。

## 3. Toolbar preset → config → UI 的資料流

### 3.1 ToolbarsPreset 型別與結構

來源：`src/modules/toolbars/types.ts`

- `ToolbarsPreset` 結構：
  - `items: ToolbarsItems`
    - `Record<ToolbarItemId, ToolbarItem<ToolbarDataType>>`
    - 每個 item 包含：
      - `view: ToolbarItemView<T>`
        - title / hint / icon / hotkey / 類型（SingleButton / ListButton / ReactComponent / Popup...）。
      - `wysiwyg?: ToolbarItemWysiwyg<T>`
      - `markup?: ToolbarItemMarkup<T>`
    - `ToolbarItemView` 控制外觀與基礎行為（按鈕是 list 還是單一、是否顯示箭頭、是否可以替換 active icon 等）。
    - `ToolbarItemWysiwyg` / `ToolbarItemMarkup` 則提供對 editor 的實際操作：
      - `exec(editor)`：執行動作（例如加粗、插入連結等）。
      - `isActive(editor)`：判斷按鈕是否為 active 狀態。
      - `isEnable(editor)`：是否可按。
  - `orders: ToolbarsOrders`
    - `Record<ToolbarId, ToolbarOrders>`。
    - `ToolbarOrders = (ToolbarList | ToolbarItemId)[][]`：
      - 最外層：一列列的群組（toolbar groups）。
      - 內層：每個群組中的按鈕或列表。
    - `ToolbarList` 用來表示「一個 list button，裡面還有多個 item」。

簡化來看：

- `items` 定義 **有哪些按鈕**、每個按鈕怎麼畫、按下去做什麼。
- `orders` 定義 **這些按鈕在 toolbar 上排在哪裡**、哪些包成群組或下拉。

### 3.2 `createToolbarConfig`：從 preset 變成 toolbarConfig

來源：`src/bundle/toolbar/utils/toolbarsConfigs.ts`

- `createToolbarConfig(editorType, toolbarPreset, toolbarName)`：
  - `editorType`: `'wysiwyg' | 'markup'`。
  - `toolbarPreset`: `ToolbarsPreset | MarkdownEditorPreset`（字串 preset 名稱或直接給 preset 物件）。
  - `toolbarName`: 來自 `ToolbarName` 常數（如 `wysiwygMain`、`markupMain`、`wysiwygHidden`、`markupHidden`）。
- 流程：
  1. 解析 preset：
     - 若是字串（例如 `'full'`）則從 `defaultPresets` 表中取出對應 `ToolbarsPreset`。
     - 若已是物件則直接使用。
  2. 取出該 toolbarName 對應的 `orders[toolbarName]`，若不存在則使用 `[[]]`。
  3. 對 `orders` 中的每個 group，將其中的 `ToolbarItemId` 或 `ToolbarList` 轉成 `TransformedItem`：
     - `transformItem(editorType, items[action], actionId)`：
       - 拉出 view 資訊（title / icon / hotkey / hint / type / preview / withArrow 等）。
       - 根據 `editorType` 帶入對應的 `wysiwyg` 或 `markup` 行為設定。
     - 若 action 是列表（`ToolbarList`），則會再將 `action.items` 中的 id 映射成 nested `data`。
  4. 回傳 `toolbarData`（型別為 `WToolbarData` 或 `MToolbarData`）：

這個函式完成了兩件事：

- 把 **抽象的 preset（items + orders）** 轉成 **可以直接丟給 React Toolbar 元件的結構**。
- 依據 `editorType` 決定要附加 WYSIWYG 或 Markup 專用的行為。

### 3.3 `getToolbarsConfigs`：合併 preset 與 props 覆寫

- 來源：`src/bundle/toolbar/utils/toolbarsConfigs.ts`
- 參數：
  - `toolbarsPreset?: ToolbarsPreset`：呼叫端（例如 app）可以直接提供完整 preset 覆寫內建。
  - `props: Pick<MarkdownEditorViewProps, ...>`：
    - `markupToolbarConfig`
    - `wysiwygToolbarConfig`
    - `wysiwygHiddenActionsConfig`
    - `markupHiddenActionsConfig`
  - `preset: MarkdownEditorPreset`：editor 自己的 preset 名稱（例如 `'full'`、`'commonmark'`）。
- 決策順序（目標：保留最大相容性，同時支援新式 API）：

1. **若有 `toolbarsPreset`（新式方式）**：
   - 一律使用 `toolbarsPreset` 產生所有 config：
     - `wysiwygToolbarConfig`：`createToolbarConfig('wysiwyg', toolbarsPreset, ToolbarName.wysiwygMain)`。
     - `markupToolbarConfig`：`createToolbarConfig('markup', toolbarsPreset, ToolbarName.markupMain)`。
     - `wysiwygHiddenActionsConfig`：`flattenPreset(createToolbarConfig('wysiwyg', toolbarsPreset, ToolbarName.wysiwygHidden))`。
     - `markupHiddenActionsConfig`：`flattenPreset(createToolbarConfig('markup', toolbarsPreset, ToolbarName.markupHidden))`。

2. **否則（舊式 / 相容模式）**：
   - 先看 `props.xxxConfig` 是否有提供，若有則使用 props 的值。
   - 若沒有，再 fallback 到 `preset` 名稱對應的預設 preset：
     - 例如：`createToolbarConfig('wysiwyg', preset, ToolbarName.wysiwygMain)`。

結果回傳一個物件：

```ts
{
  wysiwygToolbarConfig,
  markupToolbarConfig,
  wysiwygHiddenActionsConfig,
  markupHiddenActionsConfig,
}
```

這個物件會由 `MarkdownEditorView` / `EditorWrapper` 再傳入實際 toolbar 元件中，用來渲染 UI。

## 4. Toolbar 元件層的 UI 組成

來源：`src/toolbar/` 目錄（僅列出主要元件）：

- `Toolbar.tsx`：
  - 主要的 toolbar 容器，負責：
    - 迭代 toolbarConfig 的群組與按鈕。
    - 決定有哪些 group 要顯示在主列，哪些進入 hidden actions 或 overflow。
- `ToolbarGroup.tsx`：
  - 負責一組按鈕（例如文字樣式群組、list 群組）。
- `ToolbarButton.tsx`：
  - 單一操作按鈕，負責：
    - 顯示 icon / title / hotkey。
    - 根據 `isActive` / `isEnable` 顯示當前 UI 狀態（例如高亮、disable）。
    - 呼叫對應的 editor action `exec`。
- `ToolbarListButton.tsx`：
  - 可打開下拉列表的按鈕，用於多選一或多項工具（例如 heading 等級）。
  - 負責：
    - 顯示箭頭（`withArrow`）。
    - 根據 active item 替換 icon（`replaceActiveIcon`）。
    - 渲染子項目清單，並將選擇結果傳回 editor。
- `ToolbarButtonPopup.tsx` / `PreviewTooltip.tsx` / `FlexToolbar.tsx` 等：
  - 提供彈出視窗、tooltip 或彈性排版等輔助 UI。

## 5. 使用者行為與 editor 狀態的關聯

### 5.1 點擊 toolbar 按鈕

1. 使用者點擊某個 toolbar button。
2. 對應的 React component（`ToolbarButton` 或 `ToolbarListButton`）呼叫 `exec(editor)`：
   - 導致 ProseMirror / CodeMirror 狀態改變（例如加粗、插入 block 等）。
3. Editor 內部狀態變化後，根據實作可能：
   - 觸發 `rerender` 事件 → `MarkdownEditorView` 重新 render。
   - 改變選取範圍、mode 等，進而影響其他按鈕的 `isActive` / `isEnable` 結果。

### 5.2 hidden actions / 更多動作

- `wysiwygHiddenActionsConfig` / `markupHiddenActionsConfig` 決定哪些項目出現在「更多」菜單或收合選單中。
- UI 表現上：
  - 可能是一個帶有 `...` 或 icon 的下拉按鈕。
  - 點擊後彈出清單，內含根據 config 產生的按鈕項目。
- 行為上：
  - 和主 toolbar 按鈕一樣，最終都會呼叫該項目的 `exec` / `isActive` / `isEnable` 等行為。

## 6. 客製化 toolbar 的入口點（高層）

若未來想客製 toolbar，通常有三個層級可以使用（實作細節建議在對應 todo 檔中再展開）：

1. **使用現有 preset，但透過 props 微調**
   - 透過 `MarkdownEditorView` 的 props：
     - `toolbarsPreset?`
     - `wysiwygToolbarConfig?`
     - `markupToolbarConfig?`
     - `wysiwygHiddenActionsConfig?`
     - `markupHiddenActionsConfig?`
   - 適用於：
     - 只想隱藏部分按鈕或調整排序。

2. **提供自訂 `ToolbarsPreset`**
   - 自己定義 `ToolbarsPreset`（items + orders），然後透過 `toolbarsPreset` 傳入。
   - 適用於：
     - 想要完全控制 toolbar 上有哪些功能與排版。

3. **新增 / 修改 toolbar item 實作**
   - 調整 `ToolbarsItems` 中的某個項目：
     - 新增 icon、調整 title/hint/hotkey。
     - 改變 `exec` / `isActive` / `isEnable` 行為。
   - 這類變更通常需要進一步理解 core / extensions 行為，建議在新的 todo 檔與 ui-flow-<feature> 檔中細寫。

## 7. 延伸與 TODO

- 未來可以為以下主題各開一個專門 section 或獨立 `ui-flow-*.md`：
  - 特定 toolbar 群組（例如 table 工具、code block 工具）。
  - toolbar 與 shortcuts 的對應關係。
  - 不同 preset（`zero` / `commonmark` / `default` / `yfm` / `full`）在 UI 上的差異快速對照表。
- 任何實際調整 toolbar preset 或新增 toolbar item 的工作，應在對應日期的 `docs/todo/todoYYYY-MM-DD-XX.md` 檔中記錄：
  - 調整目標。
  - 涉及檔案與程式片段。
  - 測試方式與結果。
