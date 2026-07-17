# 暮色导航 / Muse

`musedaohang.com` 的自托管个人导航、博客与内容工作台。公开页面和 `/studio` 共用一个 SvelteKit 应用，内容保存在自己的 SQLite 数据库中；不依赖 WordPress、MariaDB 或 Redis，保存后立即生效。

## 能做什么

- 导航：搜索、分类、卡片、排序、草稿、精选和自动抓取网站 Icon。
- 博客：草稿/发布、重点文章、封面上传和轻量文本写作。
- 外观实验室：站名、欢迎语、三组主题色、圆角、内容密度和背景图。
- 媒体：Icon、博客封面和背景图全部保存到自己的数据卷。
- 运维：Caddy 自动 HTTPS、健康检查、日志轮转和一致性备份脚本。

## 结构

```text
apps/muse/             SvelteKit 公开站与暮色工作台
seed/                  首次启动时导入的第一版导航数据
infra/single-vps/      musedaohang.com 单 VPS 部署配置
Dockerfile             Node 24 生产镜像
```

运行后页面：

```text
https://musedaohang.com/          暮色导航
https://musedaohang.com/blog      暮色博客
https://musedaohang.com/studio    暮色工作台（需登录）
```

## 本地开发

需要 Node.js 24 和 pnpm 11：

```bash
pnpm install
MUSE_ADMIN_PASSWORD='至少12位密码' \
MUSE_SESSION_SECRET='至少32位随机字符' \
pnpm dev
```

生产检查：

```bash
pnpm check
pnpm build
```

## 新服务器部署

```bash
git clone https://github.com/stillpain/muse-nav.git /opt/muse-nav
cd /opt/muse-nav/infra/single-vps
cp .env.example .env
nano .env
docker compose config -q
docker compose up -d --build
docker compose ps
```

已有第一版服务器请严格按照 [升级文档](infra/single-vps/UPGRADE-V2.md) 操作；它包含 WordPress 备份、替换、验证和旧卷清理顺序。

## 数据与备份

持久数据都在 Docker 卷 `muse_data`：

```text
muse.db       SQLite 数据库
muse.db-wal   SQLite WAL（运行时可能存在）
media/        网站 Icon、封面和背景图
```

一致性备份：

```bash
cd /opt/muse-nav/infra/single-vps
chmod +x backup.sh
sudo ./backup.sh
```

默认备份到 `/opt/muse-backups`，保留 30 天。建议再使用 Restic 将该目录同步到另一台 VPS 或对象存储。

## 安全说明

- `.env` 不得提交 Git；管理员密码至少 12 位，Session Secret 至少 32 位。
- `/studio` 设置了 `noindex`，登录 Cookie 为 HttpOnly、SameSite=Lax，HTTPS 下启用 Secure。
- Icon 抓取拒绝内网/保留地址，并限制请求时间、类型和大小。
- 生产环境只公开 Caddy 的 80/443，应用端口仅在 Docker 网络中可见。
