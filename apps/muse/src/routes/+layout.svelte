<script lang="ts">
  import { onMount } from 'svelte';
  import '../styles.css';
  let { data, children } = $props();
  onMount(() => { document.documentElement.dataset.theme=localStorage.getItem('theme')||((matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'); });
</script>

<svelte:head><meta name="color-scheme" content="light dark" /></svelte:head>
<div class:dense={data.appearance.density === 'compact'} style={`--brand:${data.appearance.brand};--secondary:${data.appearance.secondary};--accent:${data.appearance.accent};--radius:${data.appearance.radius}px;${data.appearance.background ? `--custom-bg:url('${data.appearance.background}')` : ''}`}>
  {#if !data.studio}<header class="topbar">
    <a class="brand" href={data.blog ? '/blog' : '/'}><span>暮</span><strong>{data.blog ? data.appearance.blogName : data.appearance.siteName}</strong></a>
    <nav><a href="/">导航</a><a href="/blog">博客</a>{#if data.user}<a class="account-link" href="/account">{data.user.username}</a>{:else}<a class="account-link" href="/account/login">登录</a>{/if}{#if data.admin}<a href="/studio">工作台</a>{/if}</nav>
    <button class="theme" type="button" aria-label="切换主题" onclick={() => { const root=document.documentElement; const next=root.dataset.theme==='dark'?'light':'dark'; root.dataset.theme=next; localStorage.setItem('theme',next); }}>◐</button>
  </header>{/if}
  {@render children()}
  {#if !data.studio}<footer>© {new Date().getFullYear()} {data.blog ? data.appearance.blogName : data.appearance.siteName} · 保持好奇，认真收藏。</footer>{/if}
</div>
