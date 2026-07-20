<script lang="ts">let{form}=$props();</script>
<svelte:head><title>账号安全｜暮色工作台</title></svelte:head>
<header class="studio-head"><div><p class="eyebrow">SECURITY</p><h1>账号安全</h1><p>修改工作台管理员密码，更新后其他设备上的旧会话会立即失效。</p></div></header>
{#if form?.message}<div class:success={form.success} class="notice">{form.message}</div>{/if}
<section class="studio-panel security-panel">
  <div class="security-note"><span>⌁</span><div><b>密码只保存加密摘要</b><p>建议使用至少 12 位、包含大小写字母、数字和符号的独立密码。</p></div></div>
  <form method="POST" class="studio-form">
    <label>当前密码<input name="currentPassword" type="password" autocomplete="current-password" required /></label>
    <label>新密码 <small>长度为 12–128 个字符</small><input name="newPassword" type="password" minlength="12" maxlength="128" autocomplete="new-password" required /></label>
    <label>确认新密码<input name="confirmPassword" type="password" minlength="12" maxlength="128" autocomplete="new-password" required /></label>
    <button class="primary">更新工作台密码</button>
  </form>
</section>
