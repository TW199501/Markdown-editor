##### 入门指南 / 预览

## 如何为标记模式添加预览

### 添加预览组件

您可以创建自己的组件，或使用[提供编辑器包的](https://github.com/gravity-ui/markdown-editor/blob/main/src/view/components/YfmHtml/YfmStaticView.tsx)组件 `YfmStaticView`

### 添加重新渲染的处理程序

```ts
const {plugins, getValue, allowHTML, breaks, linkify, linkifyTlds, needToSanitizeHtml} = props;
const [html, setHtml] = useState('');
const [meta, setMeta] = useState<object | undefined>({});
const divRef = useRef<HTMLDivElement>(null);

const theme = useThemeValue();

const render = useMemo(
    () =>
        debounce(() => {
            const res = transform(getValue(), {
                allowHTML,
                breaks,
                plugins,
                linkify,
                linkifyTlds,
                needToSanitizeHtml,
            }).result;
            setHtml(res.html);
            setMeta(res.meta);
        }, 200),
        [getValue, allowHTML, breaks, plugins, linkify, linkifyTlds, needToSanitizeHtml, theme],
    );

    useEffect(() => {
        render();
    }, [props, render]);

    return (
        <YfmStaticView
            ref={divRef}
            html={html}
            noListReset
            className="demo-preview"
        />
    );
};
```

### 向 useMarkdownEditor 传递额外属性

```ts
// ...
const renderPreview = useCallback<RenderPreview>(
    ({getValue}) => (
        <SplitModePreview
            getValue={getValue}
        />
    ),
    [],
);

const editor = useMarkdownEditor({allowHTML: false,
    renderPreview,
    initialEditorMode: 'wysiwyg',
    initialSplitModeEnabled: true,
    initialToolbarVisible: true,
    splitMode: 'horizontal',

});
// ...
```