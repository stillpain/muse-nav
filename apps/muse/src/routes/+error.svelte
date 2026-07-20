<script lang="ts">
  import { page } from '$app/state';
  const isNotFound = $derived(page.status === 404);
</script>

<svelte:head><title>{isNotFound ? '页面没有找到' : '页面暂时出错'}｜暮色手记</title><meta name="robots" content="noindex" /></svelte:head>
<main class="error-page"><section><img src="/muse-icon-256.png" alt="暮色手记" width="88" height="88" /><p class="eyebrow">{isNotFound ? 'LOST WAYPOINT' : 'TEMPORARY ERROR'}</p><h1>{page.status}</h1><h2>{isNotFound ? '这个坐标没有找到' : '这里暂时无法抵达'}</h2><p>{isNotFound ? '链接可能已经改变，或文章还没有发布。' : '请稍后再试，也可以先返回首页继续浏览。'}</p><nav><a class="primary" href="/">返回导航</a><a href="/blog">阅读博客</a></nav></section></main>
