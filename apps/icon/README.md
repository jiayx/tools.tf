# Icon

生成文字、Lucide、Tabler 和品牌图标。支持纯色、渐变、透明背景、圆角和图形比例，浏览器中可下载 SVG、PNG、JPEG 和 WebP。

`GET /icon/:size?` 返回 SVG。尺寸默认 128，范围 16–1024。查询参数：

- `type`：`text`、`lucide`、`tabler` 或 `logos`。
- `text` / `icon`：文字内容或图标名称。
- `fg`、`bg1`、`bg2`：六位十六进制颜色，URL 中的 `#` 需编码为 `%23`。
- `bg`：`solid`、`gradient` 或 `transparent`；`angle`：渐变角度。
- `textGlyph`、`iconGlyph`：文字或图标比例；`radius`：圆角比例。

```text
https://icon.tools.tf/icon/128?type=lucide&icon=sparkles&fg=%236366f1&bg=transparent
```

Lucide 随应用打包。服务端从 jsDelivr 获取 Tabler 和 Logos，并使用 `wrangler.jsonc` 中的 `KV` 绑定缓存一周。浏览器端优先使用 CDN，失败时加载打包的图标；设置 `VITE_ICONIFY_CDN_ONLY=true` 时不使用该回退。

在仓库根目录运行：

```bash
pnpm --filter icon dev
pnpm --filter icon test
pnpm --filter icon build
pnpm --filter icon deploy
```
