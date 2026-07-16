# 暮色内容中心

一个同时管理暮色导航和暮色手记的 WordPress 插件。

## 后台能力

- “暮色内容”统一仪表盘：查看博客文章、导航网站和待审投稿数量。
- 博客：使用 WordPress 原生文章、分类、标签、特色图片和区块编辑器。
- 博客附加字段：副标题、阅读时间、标题主题色和 SEO 描述。
- 导航：`nav_site` 自定义内容类型、导航分类、导航标签、精选/推荐/排序/详情收录等字段。
- 投稿：Turnstile 校验后进入待审队列，不会直接发布。
- 点击：仅按日期、网站、来源和设备类型聚合，不保存访客轨迹。
- REST：导航与博客前台在构建时读取，WordPress 不进入公众实时访问链路。

## 安装

将 `nav-content-api` 目录放入 `wp-content/plugins/` 并在 WordPress 后台启用。进入“暮色内容 → 后台设置”，填写导航前台、博客前台、投稿 Origin 和 Turnstile Secret。

前端设置 `CONTENT_SOURCE=wordpress` 与 `WORDPRESS_API_URL=https://blog.example.com/wp-json` 后重新构建，即可改为读取 WordPress 内容。后台暂时不可访问时，前端会回退到本地内容。
