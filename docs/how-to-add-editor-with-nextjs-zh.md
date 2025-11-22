##### 入门指南 / NextJS

## 连接和配置
本文档提供了配置 Webpack 和 Turbopack 以避免与 'fs' 模块相关问题的说明，以及如何在 NextJS 客户端连接编辑器的说明。

### 'fs' 模块未找到问题
为了使 `diplodoc/transform` 进程正常运行，请添加 [webpack resolve-fallbacks](https://webpack.js.org/configuration/resolve/#resolvefallback)。

#### Webpack 配置

将以下代码添加到您的 Webpack 配置中：

```javascript
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        fs: false,
        process: false,
        path: false,
      };
      return webpackConfig;
    },
  },
};
```

#### Turbopack 配置

如果您使用 Turbopack，请按如下方式设置 `resolveAlias`：

```
experimental: {
turbo: {
  resolveAlias: {
   fs: './stubs/fs.js',
  },
 },
},
```

stubs/fs.js 的代码

```
let fs;

if (typeof window === 'undefined') {
 fs = require('node:fs');
} else {
 fs = {};
}

module.exports = fs;
```

### 服务器端渲染 (SSR)

由于编辑器使用 [ProseMirror](https://prosemirror.net) 和 [CodeMirror](https://codemirror.net) 库，这些库依赖于在客户端处理 DOM，在构建过程中可能会发生错误。使用以下方法在客户端加载编辑器：

```
import dynamic from 'next/dynamic';
...
const MarkdownEditor = dynamic(
    () =>
        import('./MarkdownEditor').then(
            (mod) => mod.MarkdownEditor,
        ),
    {
        ssr: false,
    },
);
```


这些配置将帮助您正确连接和使用编辑器，防止与客户端缺少服务器模块相关的错误。