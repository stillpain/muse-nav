<script lang="ts">
  let { data } = $props();
  function domain(url:string) { try { return new URL(url).hostname.replace(/^www\./,''); } catch { return url; } }
  function href(page:number, category=data.activeCategory) { const params=new URLSearchParams(); if(data.query)params.set('q',data.query); if(category)params.set('category',category); if(page>1)params.set('page',String(page)); const value=params.toString(); return value?`/?${value}`:'/'; }
  const websiteJsonLd = $derived(JSON.stringify({'@context':'https://schema.org','@type':'WebSite',name:data.appearance.siteName,url:`${data.origin}/`,description:data.appearance.siteDescription,potentialAction:{'@type':'SearchAction',target:`${data.origin}/?q={search_term_string}`,'query-input':'required name=search_term_string'}}).replace(/</g,'\\u003c'));
</script>
<svelte:head>
  <title>{data.appearance.siteName}｜个人精选网站导航</title><meta name="description" content={data.appearance.siteDescription} />
  <link rel="canonical" href={`${data.origin}/`} /><meta property="og:type" content="website" /><meta property="og:title" content={`${data.appearance.siteName}｜个人精选网站导航`} /><meta property="og:description" content={data.appearance.siteDescription} /><meta property="og:url" content={`${data.origin}/`} /><meta property="og:image" content={`${data.origin}/og.png`} /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content={data.appearance.siteName} /><meta name="twitter:description" content={data.appearance.siteDescription} /><meta name="twitter:image" content={`${data.origin}/og.png`} />
  {@html `<script type="application/ld+json">${websiteJsonLd}<\/script>`}
</svelte:head>
<main>
  <section class="hero" id="search"><div><p class="eyebrow">PERSONAL WAYPOINTS</p><h1>{data.appearance.heroLine}</h1><form class="search" method="GET"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg><input name="q" value={data.query} placeholder="搜索收藏的网站" aria-label="搜索收藏的网站" />{#if data.activeCategory}<input type="hidden" name="category" value={data.activeCategory} />{/if}<kbd>{data.total}</kbd></form></div></section>
  <section class="catalog shell">
    <aside class="categories"><a class:active={!data.activeCategory} href={href(1,'')}>全部 <small>{data.categories.reduce((sum:number,item:any)=>sum+Number(item.siteCount),0)}</small></a>{#each data.categories as item}<a class:active={data.activeCategory===item.slug} href={href(1,item.slug)}><i style={`background:${item.color}`}></i>{item.name}<small>{item.siteCount}</small></a>{/each}</aside>
    <div><div class="section-title"><div><p class="eyebrow">CURATED LINKS</p><h2>{data.activeCategory?(data.categories.find((c:any)=>c.slug===data.activeCategory)?.name||'分类收藏'):'全部收藏'}</h2></div><span>{data.total} 个坐标</span></div>
      <div class="site-grid">{#each data.sites as site}<a class="site-card" href={site.url} target="_blank" rel={site.featured?'noopener':'noopener nofollow'}><div class="site-icon">{#if site.icon}<img src={site.icon} alt="" loading="lazy" />{:else}{site.name.slice(0,1)}{/if}</div><div class="site-copy"><strong>{site.name}</strong><p>{site.description}</p><small>{domain(site.url)}</small></div><span class="arrow">↗</span></a>{:else}<div class="empty">没有匹配的收藏。</div>{/each}</div>
      {#if data.pageCount>1}<nav class="pagination" aria-label="导航分页"><a class:disabled={data.page===1} aria-disabled={data.page===1} href={href(data.page-1)}>上一页</a><span>第 {data.page} / {data.pageCount} 页</span><a class:disabled={data.page===data.pageCount} aria-disabled={data.page===data.pageCount} href={href(data.page+1)}>下一页</a></nav>{/if}
    </div>
  </section>
</main>
