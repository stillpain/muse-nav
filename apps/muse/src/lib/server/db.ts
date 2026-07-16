import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Appearance, Category, Post, Site } from '$lib/types';

const dataDir = resolve(process.env.MUSE_DATA_DIR || 'data');
const dbFile = resolve(dataDir, 'muse.db');
mkdirSync(dataDir, { recursive: true });
export const mediaDir = resolve(dataDir, 'media');
mkdirSync(mediaDir, { recursive: true });

const db = new DatabaseSync(dbFile);
db.exec(`
  PRAGMA journal_mode=WAL;
  PRAGMA foreign_keys=ON;
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#6857d9', sort_order INTEGER NOT NULL DEFAULT 100
  );
  CREATE TABLE IF NOT EXISTS sites (
    id INTEGER PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, url TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '', icon TEXT NOT NULL DEFAULT '', category_id INTEGER NOT NULL,
    featured INTEGER NOT NULL DEFAULT 0, sort_order INTEGER NOT NULL DEFAULT 100,
    status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('published','draft')),
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(category_id) REFERENCES categories(id)
  );
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, excerpt TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '', cover TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft',
    featured INTEGER NOT NULL DEFAULT 0, published_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`);

const defaults: Appearance = {
  siteName: '暮色导航', blogName: '暮色手记', heroLine: '暮色落下，仍有坐标发亮。',
  brand: '#6857d9', secondary: '#2a9d8f', accent: '#e9a23b', radius: '16',
  density: 'comfortable', background: ''
};

function seed() {
  const count = Number((db.prepare('SELECT COUNT(*) AS count FROM categories').get() as { count: number }).count);
  if (count > 0) return;
  const seedDir = resolve(process.env.MUSE_SEED_DIR || 'seed');
  const categoriesFile = resolve(seedDir, 'categories.json');
  const sitesFile = resolve(seedDir, 'sites.json');
  if (!existsSync(categoriesFile) || !existsSync(sitesFile)) {
    db.prepare('INSERT INTO categories(name,slug,description,color,sort_order) VALUES(?,?,?,?,?)').run('常用网站','favorites','长期使用的网站','#6857d9',10);
  } else {
    const categories = JSON.parse(readFileSync(categoriesFile, 'utf8')) as Array<Record<string, unknown>>;
    const insert = db.prepare('INSERT INTO categories(name,slug,description,color,sort_order) VALUES(?,?,?,?,?)');
    for (const item of categories) insert.run(String(item.name), String(item.slug), String(item.description || ''), String(item.color || '#6857d9'), Number(item.sortOrder) || 100);
    const categoryIds = new Map((db.prepare('SELECT id,slug FROM categories').all() as Array<{id:number;slug:string}>).map((row) => [row.slug, row.id]));
    const sites = JSON.parse(readFileSync(sitesFile, 'utf8')) as Array<Record<string, unknown>>;
    const add = db.prepare(`INSERT OR IGNORE INTO sites(name,slug,url,description,icon,category_id,featured,sort_order,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`);
    for (const item of sites) {
      const categoryId = categoryIds.get(String(item.category)) || categoryIds.values().next().value;
      if (!categoryId || item.status !== 'published') continue;
      add.run(String(item.name), String(item.slug), String(item.url), String(item.description || ''), String(item.logo || ''), categoryId, item.featured ? 1 : 0, Number(item.sortOrder) || 100, 'published', String(item.createdAt || new Date().toISOString()), String(item.updatedAt || new Date().toISOString()));
    }
  }
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO posts(title,slug,excerpt,content,status,featured,published_at,updated_at) VALUES(?,?,?,?,?,?,?,?)`).run(
    '暮色手记，重新开始', 'hello-muse', '这是暮色工作台中的第一篇文章，你可以登录后台修改或删除它。',
    '这里不再依赖 WordPress。\n\n打开暮色工作台，你可以直接写作、保存草稿并发布。网站内容会立即生效，不需要重新构建容器。',
    'published', 1, now, now
  );
}
seed();

export function getAppearance(): Appearance {
  const rows = db.prepare('SELECT key,value FROM settings').all() as Array<{key:string;value:string}>;
  return { ...defaults, ...Object.fromEntries(rows.map((row) => [row.key, row.value])) } as Appearance;
}
export function saveAppearance(input: Appearance) {
  const statement = db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
  db.exec('BEGIN'); try { for (const [key, value] of Object.entries(input)) statement.run(key, String(value)); db.exec('COMMIT'); } catch (error) { db.exec('ROLLBACK'); throw error; }
}
export function listCategories(): Category[] { return db.prepare('SELECT id,name,slug,description,color,sort_order AS sortOrder FROM categories ORDER BY sort_order,name').all() as unknown as Category[]; }
export function saveCategory(input: Omit<Category,'id'> & {id?:number}) {
  if (input.id) db.prepare('UPDATE categories SET name=?,slug=?,description=?,color=?,sort_order=? WHERE id=?').run(input.name,input.slug,input.description,input.color,input.sortOrder,input.id);
  else db.prepare('INSERT INTO categories(name,slug,description,color,sort_order) VALUES(?,?,?,?,?)').run(input.name,input.slug,input.description,input.color,input.sortOrder);
}
export function deleteCategory(id:number) { db.prepare('DELETE FROM categories WHERE id=? AND NOT EXISTS(SELECT 1 FROM sites WHERE category_id=?)').run(id,id); }

export function listSites(includeDrafts=false): Site[] {
  const where = includeDrafts ? '' : "WHERE s.status='published'";
  return db.prepare(`SELECT s.id,s.name,s.slug,s.url,s.description,s.icon,s.category_id AS categoryId,c.name AS categoryName,c.slug AS categorySlug,s.featured,s.sort_order AS sortOrder,s.status,s.created_at AS createdAt,s.updated_at AS updatedAt FROM sites s JOIN categories c ON c.id=s.category_id ${where} ORDER BY c.sort_order,s.sort_order,s.name`).all() as unknown as Site[];
}
export function getSite(id:number) { return db.prepare('SELECT id,name,slug,url,description,icon,category_id AS categoryId,featured,sort_order AS sortOrder,status,created_at AS createdAt,updated_at AS updatedAt FROM sites WHERE id=?').get(id) as unknown as Site|undefined; }
export function saveSite(input: Omit<Site,'id'|'createdAt'|'updatedAt'> & {id?:number}) {
  const now = new Date().toISOString();
  if (input.id) db.prepare('UPDATE sites SET name=?,slug=?,url=?,description=?,icon=?,category_id=?,featured=?,sort_order=?,status=?,updated_at=? WHERE id=?').run(input.name,input.slug,input.url,input.description,input.icon,input.categoryId,input.featured,input.sortOrder,input.status,now,input.id);
  else db.prepare('INSERT INTO sites(name,slug,url,description,icon,category_id,featured,sort_order,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(input.name,input.slug,input.url,input.description,input.icon,input.categoryId,input.featured,input.sortOrder,input.status,now,now);
}
export function deleteSite(id:number) { db.prepare('DELETE FROM sites WHERE id=?').run(id); }

export function listPosts(includeDrafts=false): Post[] {
  const where = includeDrafts ? '' : "WHERE status='published'";
  return db.prepare(`SELECT id,title,slug,excerpt,content,cover,status,featured,published_at AS publishedAt,updated_at AS updatedAt FROM posts ${where} ORDER BY featured DESC,published_at DESC`).all() as unknown as Post[];
}
export function getPostBySlug(slug:string) { return db.prepare("SELECT id,title,slug,excerpt,content,cover,status,featured,published_at AS publishedAt,updated_at AS updatedAt FROM posts WHERE slug=? AND status='published'").get(slug) as unknown as Post|undefined; }
export function getPost(id:number) { return db.prepare('SELECT id,title,slug,excerpt,content,cover,status,featured,published_at AS publishedAt,updated_at AS updatedAt FROM posts WHERE id=?').get(id) as unknown as Post|undefined; }
export function savePost(input: Omit<Post,'id'|'updatedAt'> & {id?:number}) {
  const now = new Date().toISOString();
  if (input.id) db.prepare('UPDATE posts SET title=?,slug=?,excerpt=?,content=?,cover=?,status=?,featured=?,published_at=?,updated_at=? WHERE id=?').run(input.title,input.slug,input.excerpt,input.content,input.cover,input.status,input.featured,input.publishedAt,now,input.id);
  else db.prepare('INSERT INTO posts(title,slug,excerpt,content,cover,status,featured,published_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').run(input.title,input.slug,input.excerpt,input.content,input.cover,input.status,input.featured,input.publishedAt,now);
}
export function deletePost(id:number) { db.prepare('DELETE FROM posts WHERE id=?').run(id); }

export function databasePath() { return dbFile; }
