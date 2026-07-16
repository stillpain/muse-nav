import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { mediaDir } from './db';

const allowed:Record<string,string>={'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp','image/gif':'.gif'};
export async function saveUpload(value:FormDataEntryValue|null) {
  if (!(value instanceof File) || value.size === 0) return '';
  const extension=allowed[value.type]; if(!extension) throw new Error('只允许 PNG、JPG、WebP 或 GIF');
  if(value.size>5_000_000) throw new Error('图片不能超过 5MB');
  const filename=`${randomUUID()}${extension}`; await writeFile(`${mediaDir}/${filename}`,new Uint8Array(await value.arrayBuffer())); return `/media/${filename}`;
}
