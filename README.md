# tools.tf

开发者工具集合。各应用独立运行在 Cloudflare Workers 上，使用 Hono 和 Vite，界面支持中文和英文。

| 应用 | 功能 |
| --- | --- |
| `index` | 工具导航首页 |
| `datetime` | 自然语言时间解析和 IANA 时区换算 |
| `diff` | 文本差异比较、语法高亮和语言识别 |
| `icon` | 文字及图标生成、SVG 接口与图片下载 |
| `ip` | 出口 IP、地理及网络信息、IPv4/IPv6 连通性检测 |
| `json` | JSON 格式化、压缩和校验 |
| `password` | 在浏览器中生成随机密码 |
| `qr` | 自定义二维码、图片下载与 SVG 接口 |

Node.js >=24，pnpm 12.3.4。在仓库根目录运行：

```bash
pnpm install
pnpm --filter qr dev
pnpm --filter qr build
pnpm --filter qr deploy
```

将 `qr` 换成目标应用名。部署使用对应应用的 `wrangler.jsonc`，需要 Cloudflare 账号权限。

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`packages/i18n` 提供语言选择与文案辅助函数；`packages/analytics` 为正式站点接入 GA4。图标与 IP 的服务配置分别见各应用 README。
