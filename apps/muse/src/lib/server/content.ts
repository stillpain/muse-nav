export function slugify(value: string) {
  const slug = value.trim().toLowerCase().replace(/^https?:\/\//,'').replace(/[^a-z0-9\u4e00-\u9fff]+/g,'-').replace(/^-|-$/g,'');
  return slug || `item-${Date.now()}`;
}
export function validHttpUrl(value:string) { try { const url = new URL(value); return ['http:','https:'].includes(url.protocol); } catch { return false; } }
export function renderText(value:string) {
  const escaped = value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  return escaped.split(/\n{2,}/).map((block) => {
    if (block.startsWith('### ')) return `<h3>${block.slice(4)}</h3>`;
    if (block.startsWith('## ')) return `<h2>${block.slice(3)}</h2>`;
    return `<p>${block.replace(/\n/g,'<br>')}</p>`;
  }).join('');
}
