# IP

显示请求的出口 IP、国家、地区、时区、坐标与网络组织。信息来自 Cloudflare 请求头和请求元数据，本地运行时部分字段不可用。

`GET /` 根据请求返回：

- 浏览器：中英文信息页面。
- curl 或 `?format=text`：纯文本 IP。
- `?format=json` 或 `Accept: application/json`：JSON 信息，优先于纯文本格式。

页面分别请求 `https://v4.ip.tools.tf/probe` 和 `https://v6.ip.tools.tf/probe` 检测连通性。探测服务独立于本应用，需允许页面跨域访问，返回 `{ "ip": "…", "family": "ipv4" }` 或对应的 `ipv6`。每次探测超时为 5 秒。

在仓库根目录运行：

```bash
pnpm --filter ip dev
pnpm --filter ip test
pnpm --filter ip build
pnpm --filter ip deploy
```
