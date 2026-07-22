import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export function slugify(value: string) {
  const slug = value.trim().toLowerCase().replace(/^https?:\/\//,'').replace(/[^a-z0-9\u4e00-\u9fff]+/g,'-').replace(/^-|-$/g,'');
  return slug || `item-${Date.now()}`;
}
export function validHttpUrl(value:string) { try { const url = new URL(value); return ['http:','https:'].includes(url.protocol); } catch { return false; } }
export function renderText(value:string) {
  const html = marked.parse(value,{gfm:true,breaks:true,async:false}) as string;
  return sanitizeHtml(html,{
    allowedTags:['p','br','h2','h3','h4','strong','em','del','blockquote','ul','ol','li','code','pre','a','img','hr','table','thead','tbody','tr','th','td'],
    allowedAttributes:{a:['href','title','target','rel'],img:['src','alt','title','width','height','loading','decoding'],code:['class']},
    allowedSchemes:['http','https','mailto'],
    transformTags:{
      a:(_tag,attrs)=>({tagName:'a',attribs:{...attrs,...(/^https?:\/\//.test(attrs.href||'')?{target:'_blank',rel:'noopener noreferrer'}:{})}}),
      img:(_tag,attrs)=>({tagName:'img',attribs:{...attrs,loading:'lazy',decoding:'async'}})
    }
  });
}
