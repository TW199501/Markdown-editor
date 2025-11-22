##### 入门指南 / 工具栏自定义

## 如何自定义工具栏

### 工具栏类型

编辑器目前提供六种类型的工具栏：

1. WYSIWYG 模式下的可见工具栏
2. WYSIWYG 模式下的"三点"菜单
3. Markdown 模式下的可见工具栏
4. Markdown 模式下的"三点"菜单
5. WYSIWYG 中基于选择的工具栏（选择文本时出现）
6. WYSIWYG 中斜杠触发的工具栏（输入 `/` 时出现）

更多详细信息可以在 [issue #508](https://github.com/gravity-ui/markdown-editor/issues/508) 中找到。

### 工具栏配置

从 `@gravity-ui/markdown-editor@14.10.2` 开始，除基于选择的和斜杠触发的工具栏外，所有工具栏都使用共享的项目字典和定义这些项目顺序的数组进行配置。

基础工具栏配置可在 `gravity-ui/markdown-editor` 仓库中找到：

- [`zero`](https://github.com/gravity-ui/markdown-editor/blob/main/src/modules/toolbars/presets.ts#L109)
- [`commonmark`](https://github.com/gravity-ui/markdown-editor/blob/main/src/modules/toolbars/presets.ts#L128)
- [`default`](https://github.com/gravity-ui/markdown-editor/blob/main/src/modules/toolbars/presets.ts#L303)
- [`yfm`](https://github.com/gravity-ui/markdown-editor/blob/main/src/modules/toolbars/presets.ts#L384)
- [`full`](https://github.com/gravity-ui/markdown-editor/blob/main/src/modules/toolbars/presets.ts#L517)

### 配置详情

1. `items` 键包含跨四个主要工具栏使用的共享字典。
2. `orders` 键定义工具栏项目的显示顺序。
3. `orders` 中列出的每个 ID 都必须在 `items` 字典中有相应的条目。
4. 工具栏中使用的每个项目还必须将其对应的扩展包含在编辑器的 `extensions` 部分。

### 配置示例

`default` 预设定义了共享的 `items` 字典，在 `orders` 中指定显示顺序，并在 `extensions` 部分连接相应的扩展。

1. 扩展集：
   [src/presets/default.ts#L10](https://github.com/gravity-ui/markdown-editor/blob/c1a23b649f2f69ad71a49989d66ba4a9224e40af/src/presets/default.ts#L10)
2. 工具栏项目字典：
   [src/modules/toolbars/presets.ts#L308](https://github.com/gravity-ui/markdown-editor/blob/c1a23b649f2f69ad71a49989d66ba4a9224e40af/src/modules/toolbars/presets.ts#L308)
3. 工具栏顺序定义：
   [src/modules/toolbars/presets.ts#L316](https://github.com/gravity-ui/markdown-editor/blob/c1a23b649f2f69ad71a49989d66ba4a9224e40af/src/modules/toolbars/presets.ts#L316)

### 自定义工具栏

该库提供一组无法直接覆盖的预定义预设。如果内置预设都不适合您的需求，您可以定义自定义工具栏配置。以下是如何实现的示例：

- [实时演示（自定义预设）](https://preview.gravity-ui.com/md-editor/?path=/story/extensions-presets--custom)
- [Presets.stories.tsx#L30](https://github.com/gravity-ui/markdown-editor/blob/main/demo/stories/presets/Presets.stories.tsx#L30)
- [presets.ts#L21](https://github.com/gravity-ui/markdown-editor/blob/main/demo/stories/presets/presets.ts#L21)

```ts
export const toolbarPresets: Record<string, ToolbarsPreset> = {
    custom: {
        items: {
            [Action.undo]: {
                view: undoItemView,
                wysiwyg: undoItemWysiwyg,
                markup: undoItemMarkup,
            },
            [Action.redo]: {
                view: redoItemView,
                wysiwyg: redoItemWysiwyg,
                markup: redoItemMarkup,
            },
            [Action.bold]: {
                view: boldItemView,
                wysiwyg: boldItemWysiwyg,
            },
            [Action.italic]: {
                view: italicItemView,
                markup: italicItemMarkup,
            },
            [Action.colorify]: {
                view: colorifyItemView,
                wysiwyg: colorifyItemWysiwyg,
                markup: colorifyItemMarkup,
            },
        },
        orders: {
            [Toolbar.wysiwygMain]: [[Action.colorify], [Action.bold], [Action.undo, Action.redo]],
            [Toolbar.markupMain]: [[Action.colorify], [Action.italic], [Action.undo, Action.redo]],
        },
    },
};
```

### 条件性工具栏项目

有时您可能希望根据特定条件显示不同的工具栏项目集合——例如，用户权限。在这种情况下，您可以实现一个 getter 函数，根据参数返回适当的工具栏配置。示例：

```ts
type Falsy = false | 0 | 0n | '' | null | undefined;

export function isTruthy<T>(value: T): value is Exclude<T, Falsy> {
    return Boolean(value);
}

export const getToolbarPresets = ({
    enableColorify,
}): Record<string, ToolbarsPreset> => ({
    custom: {
        items: {
            [Action.undo]: {
                view: undoItemView,
                wysiwyg: undoItemWysiwyg,
                markup: undoItemMarkup,
            },
            [Action.redo]: {
                view: redoItemView,
                wysiwyg: redoItemWysiwyg,
                markup: redoItemMarkup,
            },
            [Action.bold]: {
                view: boldItemView,
                wysiwyg: boldItemWysiwyg,
            },
            [Action.italic]: {
                view: italicItemView,
                markup: italicItemMarkup,
            },
            [Action.colorify]: {
                view: colorifyItemView,
                wysiwyg: colorifyItemWysiwyg,
                markup: colorifyItemMarkup,
            },
        },
        orders: {
            [Toolbar.wysiwygMain]: [
                enableColorify && [Action.colorify],
                [Action.bold],
                [Action.undo, Action.redo],
            ].filter(isTruthy),
            [Toolbar.markupMain]: [
                enableColorify && [Action.colorify],
                [Action.italic],
                [Action.undo, Action.redo],
            ].filter(isTruthy),
        },
    },
});
```