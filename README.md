# 暮色导航与暮色手记

面向公众的个人导航与独立博客：两个 Astro 静态前台共享一套“暮色”设计系统，WordPress 仅作为内容后台。单台 VPS 可以通过 Caddy 按三个域名分发服务。

## 项目结构

```text
apps/navigation/       暮色导航，部署到 example.com
apps/blog/             暮色手记，部署到 blog.example.com
packages/theme/        两个前台共享的 SCSS 设计系统
wordpress/             WordPress 内容中心插件
infra/single-vps/      单台 VPS 三域名部署
infra/blog/            WordPress 独立 VPS 部署
```

博客在自己的域名根路径生成页面：

```text
https://blog.example.com/
https://blog.example.com/archive/
https://blog.example.com/post/[slug]/
```

WordPress 后台使用 `https://cms.example.com/`，不会把默认 WordPress 主题暴露为公开博客前台。

## 本地开发

```bash
pnpm install
pnpm dev             # 导航，http://localhost:4321
pnpm dev:blog        # 博客，http://localhost:4322
pnpm test
pnpm build
```

默认 `CONTENT_SOURCE=local`：导航读取 `apps/navigation/src/data/`，博客读取 `apps/blog/src/data/blog.ts`。设置 `CONTENT_SOURCE=wordpress` 和 `WORDPRESS_API_URL` 后，构建时从 WordPress REST API 获取内容；后台不可用时博客回退到本地内容。

## 单 VPS 部署

```bash
cd infra/single-vps
cp .env.example .env
# 修改三个域名和两个数据库密码
docker compose config -q
docker compose up -d --build
```

需要提前将以下 DNS 记录指向 VPS：

- `example.com`：暮色导航
- `blog.example.com`：暮色手记
- `cms.example.com`：WordPress 后台与 REST API

Caddy 自动申请 HTTPS 证书。Cloudflare 应使用 Full (Strict)，数据库和 Redis 只存在于 Docker 内网。

## WordPress

首次打开 `cms.example.com` 完成 WordPress 初始化，然后启用 `nav-content-api` 插件。进入“暮色内容 → 后台设置”填写导航域名、博客域名、投稿 Origin 和 Turnstile Secret。

WordPress 内容发生变化后，需要重新构建博客静态镜像：

```bash
docker compose build blog
docker compose up -d blog
```

发布前必须运行 `pnpm test` 与 `pnpm build`。
