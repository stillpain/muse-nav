export interface BlogSection {
  heading: string;
  paragraphs: string[];
  points?: string[];
}

export interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  publishedAt: string;
  readTime: number;
  featured?: boolean;
  accent: 'purple' | 'teal' | 'gold';
  sections: BlogSection[];
  html?: string;
}

export const blogArticles: BlogArticle[] = [
  {
    slug: 'small-vps-digital-garden',
    title: '把闲置小鸡变成一座数字花园',
    excerpt: '从一堆 1C2G、2C2G 的 VPS 出发，重新思考服务边界、故障隔离与长期维护。',
    category: 'VPS 与自托管', tags: ['VPS', 'Docker', '运维'], publishedAt: '2026-07-14T20:30:00+08:00', readTime: 8, featured: true, accent: 'purple',
    sections: [
      { heading: '不是每台机器都要塞满服务', paragraphs: ['手里有多台小规格 VPS 时，很容易陷入“还能再跑一个容器”的思路。真正决定系统是否好维护的，不是容器数量，而是每台机器有没有清晰职责。', '我的做法是先按故障域拆分：公开入口、内容后台、监控与备份分别放置。任何一台机器故障，都不应该同时带走网站、数据和恢复能力。'] },
      { heading: '从最小可用拓扑开始', paragraphs: ['导航站是纯静态内容，适合交给资源最小的机器；博客和 WordPress 需要数据库，放到内存更充足的节点；第三台机器只负责监控和加密备份。'], points: ['导航节点只运行 Caddy，不保留 Node 运行时', '数据库和 Redis 只暴露在 Docker 内网', '监控节点与主服务分离，才能发现真正的离线'] },
      { heading: '维护成本也是资源', paragraphs: ['比 CPU 和内存更稀缺的是自己的注意力。固定镜像版本、每天自动备份、每月恢复演练，都是为了让系统在半年后依然能够被理解。'] },
    ],
  },
  {
    slug: 'domain-renewal-not-first-year', title: '买域名时，我更在意第六年的价格',
    excerpt: '首年促销很容易比较，真正影响长期成本的是续费、转移和隐私保护规则。',
    category: '建站笔记', tags: ['域名', '成本'], publishedAt: '2026-07-11T18:00:00+08:00', readTime: 6, accent: 'gold',
    sections: [
      { heading: '把首年价格从表格里删掉', paragraphs: ['如果一个域名准备长期作为个人品牌入口，首年便宜十几元没有太大意义。我会先比较正常续费价，再确认转入价格、WHOIS 隐私和赎回费用。'] },
      { heading: '品牌稳定比后缀猎奇重要', paragraphs: ['容易读、容易输入、不会因口头传播产生歧义，比拿到一个短暂流行的新后缀更重要。域名一旦积累链接和记忆，迁移的隐形成本通常高于多年续费差价。'] },
    ],
  },
  {
    slug: 'quiet-navigation-design', title: '一个安静的导航页，应该删掉什么',
    excerpt: '导航不是门户信息流。搜索、个人身份和可靠分类，已经足够构成清楚的入口。',
    category: '设计随笔', tags: ['设计', '导航'], publishedAt: '2026-07-08T22:15:00+08:00', readTime: 5, accent: 'teal',
    sections: [
      { heading: '导航页的第一任务是抵达', paragraphs: ['首页每增加一个模块，都在与用户下一次点击争夺注意力。文章、动态、排行榜可以存在，但不应该挤进一个以抵达为目的的页面。'] },
      { heading: '个人气质来自取舍', paragraphs: ['背景、颜色和动效只是表层。真正形成个人风格的是收录标准、分类语言、描述方式，以及明确告诉访客“这里为什么值得留下”。'], points: ['搜索框始终是最明确的操作', '分类名称应该符合自己的使用习惯', '卡片描述解释价值，而不是堆关键词'] },
    ],
  },
  {
    slug: 'content-snapshot-fallback', title: '让静态站在 WordPress 离线时继续发布',
    excerpt: '用内容快照隔开构建系统和内容后台，避免一次短暂故障清空线上页面。',
    category: '开发记录', tags: ['Astro', 'WordPress'], publishedAt: '2026-07-03T19:40:00+08:00', readTime: 7, accent: 'purple',
    sections: [
      { heading: '后台不应该成为访问链路', paragraphs: ['导航内容只在构建时读取 WordPress。访客访问页面时，请求的是 Caddy 提供的静态 HTML，而不是实时查询 REST API。'] },
      { heading: '失败时保留最后一次正确内容', paragraphs: ['每次成功读取后台后保存一份通过 Schema 校验的快照。后台暂时不可用时，构建可以使用旧快照并标记 stale，但绝不能用空数组覆盖线上站点。'] },
    ],
  },
  {
    slug: 'notes-without-inbox-anxiety', title: '不把笔记软件变成另一个收件箱',
    excerpt: '少一点捕获焦虑，多一点定期整理，让数字笔记重新服务于思考。',
    category: '数字生活', tags: ['笔记', '方法'], publishedAt: '2026-06-27T21:00:00+08:00', readTime: 4, accent: 'teal',
    sections: [
      { heading: '收藏不等于拥有', paragraphs: ['大量剪藏会制造一种已经学习过的错觉。我现在只保留会再次使用的资料，并在收藏时写下一句自己的判断。'] },
      { heading: '让笔记有退出机制', paragraphs: ['不是每条记录都值得永久保存。定期删除过时清单、失效链接和没有上下文的碎片，会让真正重要的内容更容易被找到。'] },
    ],
  },
  {
    slug: 'building-in-public-slowly', title: '慢一点公开构建，也是一种节奏',
    excerpt: '不追逐每日更新，把公开写作变成可持续的项目日志。',
    category: '个人札记', tags: ['写作', '独立开发'], publishedAt: '2026-06-18T23:10:00+08:00', readTime: 5, accent: 'gold',
    sections: [
      { heading: '记录决策，而不只是结果', paragraphs: ['完成后的截图很整洁，但真正能帮助未来自己的，是当时为什么做出某个选择、放弃了哪些方案。'] },
      { heading: '允许文章保持朴素', paragraphs: ['并不是每次更新都需要宏大的结论。一段真实的排错过程、一份经过使用验证的清单，同样可以成为可靠内容。'] },
    ],
  },
];

export const articleBySlug = (slug: string) => blogArticles.find((article) => article.slug === slug);
export const blogCategories = [...new Set(blogArticles.map((article) => article.category))];
