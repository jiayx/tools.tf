# qr-code-styling-worker

`qr-code-styling` 的 Cloudflare Workers / Worker-like 运行时适配层。

目标：

- 尽量保持 `qr-code-styling` 的公开 API 形状
- 在没有真实 DOM / `jsdom` / `Buffer` 的 Worker 环境里跑通 SVG 输出
- 让现有调用方可以用最小改动切换到 Worker 版本

## 当前能力

- `new QRCodeStyling(options)`
- `update(options)`
- `getRawData('svg')`
- `getSvgString()`
- dot / corner / gradient / background 等 SVG 样式输出
- Worker 环境下的 `image` / logo 嵌入
  - 已验证 data URL logo
  - 适配层同时实现了基于 `fetch` 的 URL 图片加载

## 当前限制

- PNG / JPEG / WebP / Canvas 导出尚未实现
- 当前 SVG 路径仍封装了 `qr-code-styling` 的内部 `_getElement('svg')`

## 用法

```ts
import QRCodeStyling from 'qr-code-styling-worker'

const qr = new QRCodeStyling({
  type: 'svg',
  width: 512,
  height: 512,
  data: 'https://example.com',
  dotsOptions: {
    type: 'rounded',
  },
})

const svg = await qr.getSvgString()
```

如果你原来在 Worker 里直接用 `qr-code-styling`，切换时通常只需要把 import 改成：

```ts
import QRCodeStyling from 'qr-code-styling-worker'
```
