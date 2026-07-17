# 从第一版升级到暮色工作台

下面命令假设项目位于 `/opt/muse-nav`。不要直接执行 `docker compose down -v`，`-v` 会在备份前删除 WordPress 数据。

## 1. 先备份第一版

```bash
cd /opt/muse-nav/infra/single-vps
mkdir -p /opt/muse-backups/v1

# 保存旧 Compose 和环境配置，后面用于停止旧容器
cp compose.yaml /opt/muse-backups/v1/compose-v1.yaml
cp .env /opt/muse-backups/v1/env-v1

# 导出 WordPress 数据库
set -a
. ./.env
set +a
docker compose exec -T db mariadb-dump \
  -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
  > /opt/muse-backups/v1/wordpress.sql

# 备份 WordPress 上传文件、插件和主题
docker run --rm \
  -v single-vps_wp_data:/source:ro \
  -v /opt/muse-backups/v1:/backup \
  alpine:3.22 tar -czf /backup/wp-data.tar.gz -C /source .

ls -lh /opt/muse-backups/v1
```

必须看到 `wordpress.sql` 和 `wp-data.tar.gz` 且大小不为 0，才能继续。

## 2. 拉取新版并准备新环境变量

```bash
cd /opt/muse-nav
git pull --ff-only
cd infra/single-vps
cp .env /opt/muse-backups/v1/env-v1-after-pull 2>/dev/null || true
cp .env.example .env
nano .env
```

填写：

```dotenv
SITE_DOMAIN=musedaohang.com
WWW_DOMAIN=www.musedaohang.com
MUSE_ADMIN_PASSWORD=你的高强度后台密码
MUSE_SESSION_SECRET=运行 openssl rand -hex 32 得到的值
```

检查配置：

```bash
docker compose config -q
```

## 3. 停止旧容器并启动新版

```bash
# 使用刚才保存的旧 Compose 停掉导航、博客、WordPress、MariaDB 和 Redis
docker compose \
  -p single-vps \
  --env-file /opt/muse-backups/v1/env-v1 \
  -f /opt/muse-backups/v1/compose-v1.yaml down

# 构建并启动新版的 muse + Caddy
docker compose up -d --build --remove-orphans
docker compose ps
curl -fsS https://musedaohang.com/health
```

浏览器检查：

1. 打开 `https://musedaohang.com/`，确认第一版导航数据已经作为初始数据导入。
2. 打开 `https://musedaohang.com/blog`，确认博客可访问。
3. 打开 `https://musedaohang.com/studio`，使用新密码登录。
4. 添加一个测试网站，点击 `◎` 自动获取 Icon，确认首页立即出现。
5. 新建并发布一篇测试文章，确认 `/blog` 立即出现。

## 4. 确认后删除旧资源

先确认旧容器已经不存在：

```bash
docker ps -a
docker volume ls
```

新版只需要 `muse_data`、`single-vps_edge_data` 和 `single-vps_edge_config`。确认第一步备份完整后，删除旧卷：

```bash
docker volume rm \
  single-vps_db_data \
  single-vps_redis_data \
  single-vps_wp_data
```

删除旧的本地前端镜像并清理无引用层：

```bash
docker image rm muse-navigation:local muse-blog:local 2>/dev/null || true
docker image prune -f
```

不要直接执行 `docker image prune -a`，它可能删除这台 VPS 上其他项目需要但暂时未运行的镜像。MariaDB、Redis、WordPress 公共镜像也应先用 `docker ps -a --filter ancestor=镜像名` 检查是否被别的项目使用，再决定是否删除。

## 5. 配置每日备份

```bash
cd /opt/muse-nav/infra/single-vps
chmod +x backup.sh
sudo ./backup.sh
sudo crontab -e
```

加入：

```cron
25 4 * * * /opt/muse-nav/infra/single-vps/backup.sh >> /var/log/muse-backup.log 2>&1
```

旧 WordPress 备份建议至少保留 30 天，确认没有遗漏文章和图片后再归档到异地备份机。
