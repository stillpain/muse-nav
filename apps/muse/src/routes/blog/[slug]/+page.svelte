<script lang="ts">let { data }=$props();</script>
<svelte:head><title>{data.post.title}｜{data.appearance.blogName}</title><meta name="description" content={data.post.excerpt} /></svelte:head>
<main><header class="article-head" style={data.post.cover?`background-image:linear-gradient(#19172bcc,#3d347acc),url('${data.post.cover}')`:''}><p class="eyebrow">{new Date(data.post.publishedAt).toLocaleDateString('zh-CN')}</p><h1>{data.post.title}</h1><p>{data.post.excerpt}</p></header><article class="prose">{@html data.html}</article></main>
