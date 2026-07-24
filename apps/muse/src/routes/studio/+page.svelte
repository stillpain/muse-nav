<script lang="ts">
  let{data}=$props();
  const regionNames=new Intl.DisplayNames(['zh-CN'],{type:'region'});
  function countryName(code:string){if(code==='XX')return '待识别地区';try{return regionNames.of(code)||code}catch{return code}}
</script>
<svelte:head><title>概览｜暮色工作台</title></svelte:head>
<header class="studio-head"><div><p class="eyebrow">OVERVIEW</p><h1>晚上好，继续搭建你的坐标。</h1><p>内容、社区动态和读者状态都集中在这里。</p></div><a class="primary" href="/studio/sites#editor">＋ 添加网站</a></header>
<div class="stats community-stats"><a href="/studio/sites"><span>导航收藏</span><b>{data.siteCount}</b><small>个网站</small></a><a href="/studio/posts"><span>博客文章</span><b>{data.postCount}</b><small>{data.drafts} 篇草稿</small></a><a href="/studio/categories"><span>导航分类</span><b>{data.categoryCount}</b><small>组坐标</small></a><a href="/studio/comments"><span>新增评论</span><b>{data.commentCount}</b><small>条未读</small></a><a href="/studio/comments"><span>@ 我的评论</span><b>{data.mentionCount}</b><small>条提醒</small></a><a href="/studio/users"><span>注册用户</span><b>{data.userCount}</b><small>位读者</small></a></div>
<section class="visitor-insights studio-visitor" aria-labelledby="visitor-insights-title">
  <header><div><p class="eyebrow">VISITOR SIGNALS</p><h2 id="visitor-insights-title">来访足迹</h2></div><p>不使用 Cookie，不保存原始 IP，统计只呈现聚合结果。</p></header>
  <div class="visitor-panels">
    <article class="visitor-count-panel"><div class="signal-orbit" aria-hidden="true"><i></i><span></span></div><div><small>累计独立访客</small><strong>{data.visitorStats.totalVisitors.toLocaleString('zh-CN')}</strong><p><span><b>{data.visitorStats.todayVisitors.toLocaleString('zh-CN')}</b> 今日访客</span><span><b>{data.visitorStats.pageViews.toLocaleString('zh-CN')}</b> 页面访问</span></p></div></article>
    <article class="visitor-geo-panel"><header><div><small>访客地理位置分布</small><h3>从哪里发现这里</h3></div><span>前 8 个地区</span></header>
      {#if data.visitorStats.countries.length}<div class="geo-bars">{#each data.visitorStats.countries as country}<div class="geo-row"><div><b>{countryName(country.code)}</b><small>{country.code}</small></div><div class="geo-track"><i style={`width:max(4%,${country.percentage}%)`}></i></div><span>{country.visitors} · {country.percentage}%</span></div>{/each}</div>{:else}<div class="geo-empty"><b>足迹正在汇集</b><span>出现第一位访客后，这里会展示地区分布。</span></div>{/if}
    </article>
  </div>
</section>
<div class="overview-grid"><section class="studio-panel recent-comments"><header><div><p class="eyebrow">COMMUNITY</p><h2>最近评论</h2></div><a href="/studio/comments">查看全部 →</a></header>{#each data.latestComments as comment}<a href="/studio/comments"><span class="user-avatar">{comment.authorName.slice(0,1)}</span><div><b>{comment.authorName} <small>评论《{comment.postTitle}》</small></b><p>{comment.content}</p></div>{#if !comment.adminRead}<i></i>{/if}</a>{:else}<div class="empty">还没有评论。</div>{/each}</section><section class="studio-panel welcome compact-welcome"><span class="big-mark">暮</span><div><h2>内容与社区都在自己的服务器上</h2><p>网站、文章、账号和评论均保存在 SQLite 数据卷中，可以随站点备份一起完整迁移。</p><div class="quick"><a href="/studio/posts">开始写作</a><a href="/studio/comments">管理评论</a><a href="/studio/appearance">调整风格</a></div></div></section></div>
