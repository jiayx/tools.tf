# Analytics

`GoogleAnalytics` 在各应用的 Hono HTML renderer 中接入 GA4，Measurement ID 为 `G-K8QNWFNXLL`。仅 `src/index.ts` 列出的正式 HTTPS 域名加载脚本，使用 `tools.tf` Cookie 域名。

Google tag 初始化时记录页面访问。上报的页面与来源 URL 不含查询参数和片段，因此也不保留 UTM 参数。集成不发送自定义业务事件，Google Signals 和广告个性化信号已关闭。

GA4 后台的增强型衡量独立控制表单、站内搜索、出站链接、下载和历史路由事件。若只需要访问统计，应在 Web 数据流中关闭这些选项，避免额外收集 URL 或表单元数据。

```tsx
import { GoogleAnalytics } from '@tools/analytics'

<GoogleAnalytics url={c.req.url} />
```
