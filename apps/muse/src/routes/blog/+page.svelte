<script lang="ts">let { data } = $props(); const featured=data.posts.find((p:any)=>p.featured)||data.posts[0];</script>
<svelte:head><title>{data.appearance.blogName}｜文章与随笔</title></svelte:head>
<main class="blog shell"><section class="blog-hero"><p class="eyebrow">TWILIGHT NOTES</p><h1>{data.appearance.blogName}</h1><p>记录折腾、思考和那些值得慢慢写下来的事情。</p></section>
  {#if featured}<a class="featured-post" href={`/blog/${featured.slug}`}><div class="cover" style={featured.cover?`background-image:url('${featured.cover}')`:''}><span>FEATURED</span><b>{featured.title}</b></div><div><time>{new Date(featured.publishedAt).toLocaleDateString('zh-CN')}</time><h2>{featured.title}</h2><p>{featured.excerpt}</p><strong>阅读全文 →</strong></div></a>{/if}
  <section class="post-section"><div class="section-title"><div><p class="eyebrow">LATEST</p><h2>最近写下</h2></div></div><div class="post-list">{#each data.posts as post}<a href={`/blog/${post.slug}`}><time>{new Date(post.publishedAt).toLocaleDateString('zh-CN')}</time><div><h3>{post.title}</h3><p>{post.excerpt}</p></div><span>→</span></a>{/each}</div></section>
</main>
