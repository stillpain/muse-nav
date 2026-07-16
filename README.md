# 暮色导航

一个面向公众的编辑精选导航站：Astro 静态前端、WordPress 内容后台、Docker/Caddy 部署。当前仓库包含可直接构建的本地数据版本，以及后续接入 WordPress 的完整适配层和插件。

## 本地使用

1. 复制 `.env.example` 为 `.env`，按需修改站名和域名。
2. 安装依赖后运行 `pnpm dev`。
3. 运行 `pnpm test` 校验数据，运行 `pnpm build` 生成静态站。

内容位于 `src/data/`。只有 `indexable=true` 且拥有足够原创长描述的网站会生成详情页；其他卡片直接访问官网。

## WordPress

将 `CONTENT_SOURCE` 设为 `wordpress` 并配置 `WORDPRESS_API_URL`。WordPress 插件位于 `wordpress/nav-content-api/`，博客服务示例位于 `infra/blog/`。

## 部署

根目录 Compose 用于导航 VPS；`infra/blog` 用于博客 VPS；`infra/monitoring` 用于独立监控 VPS。生产环境必须替换示例域名和密码，并将 Cloudflare SSL 设置为 Full (Strict)。
