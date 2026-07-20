import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Appearance, Category, Comment, Post, PostCategory, Site, User, WordCloudItem } from '$lib/types';

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
  CREATE TABLE IF NOT EXISTS post_categories (
    id INTEGER PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#6857d9', sort_order INTEGER NOT NULL DEFAULT 100
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY, username TEXT NOT NULL COLLATE NOCASE UNIQUE, email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member','admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled')),
    created_at TEXT NOT NULL, last_login_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY, post_id INTEGER NOT NULL, user_id INTEGER, guest_name TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','published','hidden')),
    mentions_admin INTEGER NOT NULL DEFAULT 0, admin_read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL,
    FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
  );
  CREATE INDEX IF NOT EXISTS comments_post_idx ON comments(post_id,status,created_at);
  CREATE INDEX IF NOT EXISTS comments_admin_idx ON comments(admin_read,mentions_admin,created_at);
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`);

const postColumns = db.prepare('PRAGMA table_info(posts)').all() as Array<{name:string}>;
if (!postColumns.some((column) => column.name === 'category_id')) db.exec('ALTER TABLE posts ADD COLUMN category_id INTEGER REFERENCES post_categories(id)');

const defaults: Appearance = {
  siteName: '暮色导航', blogName: '暮色手记', heroLine: '暮色落下，仍有坐标发亮。',
  brand: '#6857d9', secondary: '#2a9d8f', accent: '#e9a23b', radius: '16',
  density: 'comfortable', background: '',
  siteDescription: '干净、克制、长期维护的个人网站导航。',
  blogDescription: '记录技术折腾、思考和那些值得慢慢写下来的事情。',
  seoAuthor: '暮色'
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

function seedPostCategories() {
  const count = Number((db.prepare('SELECT COUNT(*) AS count FROM post_categories').get() as {count:number}).count);
  if (!count) {
    const insert = db.prepare('INSERT INTO post_categories(name,slug,description,color,sort_order) VALUES(?,?,?,?,?)');
    insert.run('折腾记录','build-log','技术实践、工具与部署记录','#6857d9',10);
    insert.run('思考随笔','thoughts','关于产品、生活和长期主义的思考','#2a9d8f',20);
    insert.run('生活片段','life','值得慢慢写下来的日常片段','#e9a23b',30);
  }
  const first = db.prepare('SELECT id FROM post_categories ORDER BY sort_order,id LIMIT 1').get() as {id:number}|undefined;
  if (first) db.prepare('UPDATE posts SET category_id=? WHERE category_id IS NULL').run(first.id);
}
seedPostCategories();

export function getAppearance(): Appearance {
  const rows = db.prepare('SELECT key,value FROM settings').all() as Array<{key:string;value:string}>;
  return { ...defaults, ...Object.fromEntries(rows.map((row) => [row.key, row.value])) } as Appearance;
}
export function saveAppearance(input: Appearance) {
  const statement = db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
  db.exec('BEGIN'); try { for (const [key, value] of Object.entries(input)) statement.run(key, String(value)); db.exec('COMMIT'); } catch (error) { db.exec('ROLLBACK'); throw error; }
}
export function getSetting(key:string) { return (db.prepare('SELECT value FROM settings WHERE key=?').get(key) as {value:string}|undefined)?.value || ''; }
export function saveSetting(key:string,value:string) { db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,value); }

export function listCategories(): Category[] { return db.prepare(`SELECT c.id,c.name,c.slug,c.description,c.color,c.sort_order AS sortOrder,COUNT(s.id) AS siteCount
  FROM categories c LEFT JOIN sites s ON s.category_id=c.id GROUP BY c.id ORDER BY c.sort_order,c.name`).all() as unknown as Category[]; }
export function saveCategory(input: Omit<Category,'id'> & {id?:number}) {
  if (input.id) db.prepare('UPDATE categories SET name=?,slug=?,description=?,color=?,sort_order=? WHERE id=?').run(input.name,input.slug,input.description,input.color,input.sortOrder,input.id);
  else db.prepare('INSERT INTO categories(name,slug,description,color,sort_order) VALUES(?,?,?,?,?)').run(input.name,input.slug,input.description,input.color,input.sortOrder);
}
export function categoryUsage(id:number) { return Number((db.prepare('SELECT COUNT(*) AS count FROM sites WHERE category_id=?').get(id) as {count:number}).count); }
export function deleteCategory(id:number) {
  if (categoryUsage(id)>0 || listCategories().length<=1) return false;
  return Number(db.prepare('DELETE FROM categories WHERE id=?').run(id).changes)>0;
}

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

export function listPostCategories(): PostCategory[] {
  return db.prepare(`SELECT pc.id,pc.name,pc.slug,pc.description,pc.color,pc.sort_order AS sortOrder,
    COUNT(p.id) AS postCount FROM post_categories pc LEFT JOIN posts p ON p.category_id=pc.id
    GROUP BY pc.id ORDER BY pc.sort_order,pc.name`).all() as unknown as PostCategory[];
}
export function savePostCategory(input: Omit<PostCategory,'id'|'postCount'> & {id?:number}) {
  if (input.id) db.prepare('UPDATE post_categories SET name=?,slug=?,description=?,color=?,sort_order=? WHERE id=?').run(input.name,input.slug,input.description,input.color,input.sortOrder,input.id);
  else db.prepare('INSERT INTO post_categories(name,slug,description,color,sort_order) VALUES(?,?,?,?,?)').run(input.name,input.slug,input.description,input.color,input.sortOrder);
}
export function postCategoryUsage(id:number) { return Number((db.prepare('SELECT COUNT(*) AS count FROM posts WHERE category_id=?').get(id) as {count:number}).count); }
export function deletePostCategory(id:number) {
  if (postCategoryUsage(id)>0 || listPostCategories().length<=1) return false;
  return Number(db.prepare('DELETE FROM post_categories WHERE id=?').run(id).changes)>0;
}

export function listPosts(includeDrafts=false, categorySlug='', query=''): Post[] {
  const conditions = includeDrafts ? [] : ["p.status='published'"];
  const params: string[] = [];
  if (categorySlug) { conditions.push('pc.slug=?'); params.push(categorySlug); }
  if (query) { conditions.push('(p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ?)'); const term=`%${query}%`; params.push(term,term,term); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return db.prepare(`SELECT p.id,p.title,p.slug,p.excerpt,p.content,p.cover,p.status,p.featured,p.category_id AS categoryId,
    pc.name AS categoryName,pc.slug AS categorySlug,p.published_at AS publishedAt,p.updated_at AS updatedAt
    FROM posts p LEFT JOIN post_categories pc ON pc.id=p.category_id ${where}
    ORDER BY p.featured DESC,p.published_at DESC`).all(...params) as unknown as Post[];
}
export function getPostBySlug(slug:string) { return db.prepare("SELECT p.id,p.title,p.slug,p.excerpt,p.content,p.cover,p.status,p.featured,p.category_id AS categoryId,pc.name AS categoryName,pc.slug AS categorySlug,p.published_at AS publishedAt,p.updated_at AS updatedAt FROM posts p LEFT JOIN post_categories pc ON pc.id=p.category_id WHERE p.slug=? AND p.status='published'").get(slug) as unknown as Post|undefined; }
export function getPost(id:number) { return db.prepare('SELECT p.id,p.title,p.slug,p.excerpt,p.content,p.cover,p.status,p.featured,p.category_id AS categoryId,pc.name AS categoryName,pc.slug AS categorySlug,p.published_at AS publishedAt,p.updated_at AS updatedAt FROM posts p LEFT JOIN post_categories pc ON pc.id=p.category_id WHERE p.id=?').get(id) as unknown as Post|undefined; }
export function savePost(input: Omit<Post,'id'|'updatedAt'> & {id?:number}) {
  const now = new Date().toISOString();
  if (input.id) db.prepare('UPDATE posts SET title=?,slug=?,excerpt=?,content=?,cover=?,status=?,featured=?,category_id=?,published_at=?,updated_at=? WHERE id=?').run(input.title,input.slug,input.excerpt,input.content,input.cover,input.status,input.featured,input.categoryId||null,input.publishedAt,now,input.id);
  else db.prepare('INSERT INTO posts(title,slug,excerpt,content,cover,status,featured,category_id,published_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run(input.title,input.slug,input.excerpt,input.content,input.cover,input.status,input.featured,input.categoryId||null,input.publishedAt,now);
}
export function deletePost(id:number) { db.prepare('DELETE FROM posts WHERE id=?').run(id); }

const cloudStopWords = new Set(['我们','你们','他们','这个','那个','这些','那些','一个','一种','就是','还是','可以','没有','不是','什么','因为','所以','如果','但是','然后','已经','自己','这里','进行','需要','值得','慢慢','下来','事情','内容','文章','博客','the','and','for','with','this','that','from','are','was']);
export function getWordCloud(): WordCloudItem[] {
  const posts = listPosts(false);
  const frequencies = new Map<string,number>();
  const segmenter = new Intl.Segmenter('zh-CN',{granularity:'word'});
  for (const post of posts) {
    const text = `${post.title} ${post.title} ${post.excerpt} ${post.content}`.toLowerCase();
    for (const item of segmenter.segment(text)) {
      const word = item.segment.trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,'');
      if (!item.isWordLike || word.length < 2 || word.length > 16 || cloudStopWords.has(word) || /^\d+$/.test(word)) continue;
      frequencies.set(word,(frequencies.get(word)||0)+1);
    }
  }
  const ranked = [...frequencies.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'zh-CN')).slice(0,28);
  const max = ranked[0]?.[1] || 1;
  return ranked.map(([word,count])=>({word,count,weight:Math.round(1+(count/max)*4)}));
}

export function createUser(input:{username:string;email:string;passwordHash:string}): User {
  const now = new Date().toISOString();
  const result = db.prepare("INSERT INTO users(username,email,password_hash,role,status,created_at,last_login_at) VALUES(?,?,?,'member','active',?,?)").run(input.username,input.email,input.passwordHash,now,now);
  return getUserById(Number(result.lastInsertRowid))!;
}
export function getUserForLogin(identity:string) { return db.prepare("SELECT id,username,email,password_hash AS passwordHash,role,status,created_at AS createdAt,last_login_at AS lastLoginAt FROM users WHERE email=? COLLATE NOCASE OR username=? COLLATE NOCASE").get(identity,identity) as unknown as (User & {passwordHash:string})|undefined; }
export function getUserById(id:number) { return db.prepare("SELECT id,username,email,role,status,created_at AS createdAt,last_login_at AS lastLoginAt FROM users WHERE id=?").get(id) as unknown as User|undefined; }
export function touchUserLogin(id:number) { db.prepare('UPDATE users SET last_login_at=? WHERE id=?').run(new Date().toISOString(),id); }
export function listUsers(): User[] { return db.prepare("SELECT id,username,email,role,status,created_at AS createdAt,last_login_at AS lastLoginAt FROM users ORDER BY created_at DESC").all() as unknown as User[]; }
export function updateUserStatus(id:number,status:'active'|'disabled') { db.prepare('UPDATE users SET status=? WHERE id=?').run(status,id); }
export function userCount() { return Number((db.prepare('SELECT COUNT(*) AS count FROM users').get() as {count:number}).count); }

export function createComment(input:{postId:number;userId?:number;guestName?:string;content:string;status:'pending'|'published'}) {
  const mentions = /@(暮色|站长|管理员)/i.test(input.content) ? 1 : 0;
  db.prepare('INSERT INTO comments(post_id,user_id,guest_name,content,status,mentions_admin,admin_read,created_at) VALUES(?,?,?,?,?,?,0,?)').run(input.postId,input.userId||null,input.guestName||'',input.content,input.status,mentions,new Date().toISOString());
}
export function listPostComments(postId:number): Comment[] { return db.prepare(`SELECT c.id,c.post_id AS postId,c.user_id AS userId,COALESCE(u.username,c.guest_name,'游客') AS authorName,c.content,c.status,c.mentions_admin AS mentionsAdmin,c.admin_read AS adminRead,c.created_at AS createdAt FROM comments c LEFT JOIN users u ON u.id=c.user_id WHERE c.post_id=? AND c.status='published' ORDER BY c.created_at`).all(postId) as unknown as Comment[]; }
export function listAllComments(): Comment[] { return db.prepare(`SELECT c.id,c.post_id AS postId,p.title AS postTitle,p.slug AS postSlug,c.user_id AS userId,COALESCE(u.username,c.guest_name,'游客') AS authorName,c.content,c.status,c.mentions_admin AS mentionsAdmin,c.admin_read AS adminRead,c.created_at AS createdAt FROM comments c JOIN posts p ON p.id=c.post_id LEFT JOIN users u ON u.id=c.user_id ORDER BY c.created_at DESC`).all() as unknown as Comment[]; }
export function listUserComments(userId:number): Comment[] { return db.prepare(`SELECT c.id,c.post_id AS postId,p.title AS postTitle,p.slug AS postSlug,c.user_id AS userId,u.username AS authorName,c.content,c.status,c.mentions_admin AS mentionsAdmin,c.admin_read AS adminRead,c.created_at AS createdAt FROM comments c JOIN posts p ON p.id=c.post_id JOIN users u ON u.id=c.user_id WHERE c.user_id=? ORDER BY c.created_at DESC`).all(userId) as unknown as Comment[]; }
export function updateComment(id:number,status:'pending'|'published'|'hidden') { db.prepare('UPDATE comments SET status=?,admin_read=1 WHERE id=?').run(status,id); }
export function markCommentRead(id:number) { db.prepare('UPDATE comments SET admin_read=1 WHERE id=?').run(id); }
export function deleteComment(id:number) { db.prepare('DELETE FROM comments WHERE id=?').run(id); }
export function commentStats() { return db.prepare("SELECT COUNT(*) AS total,SUM(CASE WHEN admin_read=0 THEN 1 ELSE 0 END) AS unread,SUM(CASE WHEN admin_read=0 AND mentions_admin=1 THEN 1 ELSE 0 END) AS mentions FROM comments").get() as {total:number;unread:number;mentions:number}; }

export function databasePath() { return dbFile; }
