##### 入门指南 / Create react app

## 安装指南

### 1. 为 React 应用程序设置环境
首先，设置 React 的环境。在本例中，我们将使用 Create React App：

```bash
npx create-react-app markdown-editor --template gravity-ui-pure && cd markdown-editor
```
确保 `devDependencies` 中的 `typescript` 版本与 `package.json` 中 `overrides` 指定的版本匹配。如果存在不匹配，请运行以下命令更新：

```bash
npm install typescript@<version_from_overrides> --save-dev
```

### 2. 安装 Markdown 编辑器
安装 Markdown 编辑器

```bash
npm install @gravity-ui/markdown-editor
```

### 3. 安装对等依赖项
确保您拥有 [peerDependencies](https://github.com/gravity-ui/markdown-editor/blob/main/package.json) 中列出的必要依赖项并安装它。包括以下包：
- `@diplodoc/transform`
- `highlight.js`
- `katex`
- `lowlight`
- `markdown-it`

### 4. 配置应用程序
添加 `Editor.tsx`：

```tsx
import React from 'react';
import {MarkdownEditorView, MarkupString, useMarkdownEditor} from '@gravity-ui/markdown-editor';

export interface EditorProps {
  onSubmit: (value: MarkupString) => void;
}

export const Editor: React.FC<EditorProps> = ({onSubmit}) => {
  const editor = useMarkdownEditor({
    md: {
      html: false,
    },
  });

  React.useEffect(() => {
    function submitHandler() {
      // 将当前内容序列化为 markdown 标记
      const value = editor.getValue();
      onSubmit(value);
    }

    editor.on('submit', submitHandler);
    return () => {
      editor.off('submit', submitHandler);
    };
  }, [onSubmit]);

  return <MarkdownEditorView stickyToolbar autofocus editor={editor} />;
};
```

使用 `Editor` 组件更新 `App.tsx`：

```tsx
import {ThemeProvider, Toaster, ToasterComponent, ToasterProvider} from '@gravity-ui/uikit';
import {MarkupString} from '@gravity-ui/markdown-editor';

import {Editor} from './Editor';

const toaster = new Toaster();

const App = () => {
  const handleSubmit = (value: MarkupString) => {
    console.log(value);
  };

  return (
    <ThemeProvider theme="light">
      <ToasterProvider toaster={toaster}>
        <ToasterComponent />
        <Editor onSubmit={handleSubmit} />
      </ToasterProvider>
    </ThemeProvider>
  );
};

export default App;
````

### 5. 配置 Webpack
为了防止与 Webpack 5 中缺少 Node.js 核心模块 polyfill 相关的错误，例如：

- `Can't resolve 'process'`
- `Can't resolve 'fs'`
- `Can't resolve 'path'`
- `Can't resolve 'url'`

这些错误发生是因为 Webpack 5 默认不再包含 Node.js 模块的 polyfill。要解决此问题，您需要配置 [fallback modules](https://webpack.js.org/configuration/resolve/#resolvefallback)。

我们建议使用 CRACO 来应用这些配置。

1. 安装 CRACO：

```bash
npm install @craco/craco
```
2. 在项目根目录创建名为 `craco.config.js` 的文件并添加以下配置：

```javascript
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        fs: false,
        process: false,
        path: false,
        url: false,
      };
      return webpackConfig;
    },
  },
};
```
3. 更新 `package.json` 以使用 CRACO 进行脚本：

```json
{
  "scripts": {
    "start": "craco start",
    "build": "craco build",
    "test": "craco test",
    "eject": "react-scripts eject"
  }
}
```
此设置确保您的项目与 Webpack 5 兼容并防止缺少模块错误。

6. 进行这些更改后，启动开发服务器：

```bash
npm start
```