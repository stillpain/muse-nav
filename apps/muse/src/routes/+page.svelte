<script lang="ts">
  let { data } = $props(); let query = $state(''); let category = $state('all');
  let visible = $derived(data.sites.filter((site:any) => (category === 'all' || site.categorySlug === category) && (`${site.name} ${site.description}`).toLowerCase().includes(query.toLowerCase())));
  function domain(url:string) { try { return new URL(url).hostname.replace(/^www\./,''); } catch { return url; } }
</script>
<svelte:head><title>{data.appearance.siteName}｜个人精选网站导航</title><meta name="description" content="干净、克制、长期维护的个人网站导航。" /></svelte:head>
<main>
  <section class="hero" id="search"><p class="eyebrow">PERSONAL WAYPOINTS</p><h1>{data.appearance.heroLine}</h1><div class="search"><span>⌕</span><input bind:value={query} placeholder="搜索收藏的网站" aria-label="搜索收藏的网站" /><kbd>{visible.length}</kbd></div></section>
  <section class="catalog shell">
    <aside class="categories"><button class:active={category==='all'} onclick={() => category='all'}>全部 <small>{data.sites.length}</small></button>{#each data.categories as item}<button class:active={category===item.slug} onclick={() => category=item.slug}><i style={`background:${item.color}`}></i>{item.name}<small>{data.sites.filter((s:any)=>s.categorySlug===item.slug).length}</small></button>{/each}</aside>
    <div><div class="section-title"><div><p class="eyebrow">CURATED LINKS</p><h2>{category==='all'?'全部收藏':data.categories.find((c:any)=>c.slug===category)?.name}</h2></div><span>{visible.length} 个坐标</span></div>
      <div class="site-grid">{#each visible as site}<a class="site-card" href={site.url} target="_blank" rel="noopener"><div class="site-icon">{#if site.icon}<img src={site.icon} alt="" />{:else}{site.name.slice(0,1)}{/if}</div><div class="site-copy"><strong>{site.name}</strong><p>{site.description}</p><small>{domain(site.url)}</small></div><span class="arrow">↗</span></a>{:else}<div class="empty">没有匹配的收藏。</div>{/each}</div>
    </div>
  </section>
</main>
