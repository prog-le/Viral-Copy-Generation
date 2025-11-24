## 爆款文案重塑器 · MVP

基于 Next.js 14 App Router + Tailwind CSS 的社交平台文案重塑工具，可在 15 秒内把长文转换成小红书、抖音、微信、Twitter、LinkedIn、B 站等多种爆款风格。页面端支持实时配置大模型地址、模型名称与 API Key，方便快速切换不同服务商。

### 环境变量

（可选）在项目根目录创建 `.env.local`，用于本地保存默认 Key；否则可直接在页面配置：

```
NEXT_PUBLIC_API_KEY=sk-xxxx
```

> 后端默认指
向火山方舟 `doubao-seed-1-6-flash-250828`。如需调用 OpenAI/Claude 等，只需在页面「大模型调用配置」面板输入新的 Base URL、模型名与 Key，即可无需改代码。

### 本地启动

```bash
npm install
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可体验：粘贴长文 → 选择平台 → 点击 “✨ 立即重塑为爆款文案” → 查看结果并一键复制。

### 部署

推荐部署 Vercel：

1. 推送代码到 Git 仓库；
2. 在 Vercel 导入该仓库；
3. 在「Environment Variables」中设置 `NEXT_PUBLIC_API_KEY`；
4. 一键部署，默认启用 Serverless API 路由，可直接上线测试市场反馈。
