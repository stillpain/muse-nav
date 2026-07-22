<script lang="ts">
  import '../styles.css';
  let { data, children } = $props();
</script>

<svelte:head><meta name="color-scheme" content="light dark" /></svelte:head>
<div class:dense={data.appearance.density === 'compact'} style={`--brand:${data.appearance.brand};--secondary:${data.appearance.secondary};--accent:${data.appearance.accent};--radius:${data.appearance.radius}px;${data.appearance.background ? `--custom-bg:url('${data.appearance.background}')` : ''}`}>
  {#if !data.studio}<header class="topbar">
    <a class="brand" href={data.blog ? '/blog' : '/'}><img class="brand-mark" src="/muse-icon-64.png" alt="" /><strong>{data.blog ? data.appearance.blogName : data.appearance.siteName}</strong></a>
    <nav><a href="/">导航</a><a href="/blog">博客</a>{#if data.user}<a class="account-link" href="/account" aria-label={`账号：${data.user.username}`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0"/></svg><span>{data.user.username}</span></a>{:else}<a class="account-link" href="/account/login" aria-label="登录账号"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0"/></svg><span>登录</span></a>{/if}{#if data.admin}<a href="/studio">工作台</a>{/if}</nav>
    <button class="theme" type="button" aria-label="切换主题" onclick={() => { const root=document.documentElement; const next=root.dataset.theme==='dark'?'light':'dark'; root.dataset.theme=next; localStorage.setItem('theme',next); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9c0-.5-.04-1-.12-1.48A7 7 0 0 1 12 3Z"/></svg></button>
  </header>{/if}
  {@render children()}
  {#if !data.studio}<footer>© {new Date().getFullYear()} {data.blog ? data.appearance.blogName : data.appearance.siteName} · 保持好奇，认真收藏。</footer>{/if}
</div>
