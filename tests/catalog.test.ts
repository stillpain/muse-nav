import { describe, expect, it } from 'vitest';
import { LocalContentAdapter } from '@/lib/content/LocalContentAdapter';
import { indexableSites, publishedSites } from '@/lib/content/selectors';
import { validateCatalog } from '@/lib/content/schema';

describe('内容目录', () => {
  it('演示数据通过完整关系校验', async () => {
    const catalog = await new LocalContentAdapter().getCatalog();
    expect(publishedSites(catalog).length).toBeGreaterThan(10);
    expect(indexableSites(catalog).length).toBeGreaterThan(2);
  });

  it('拒绝重复 URL', async () => {
    const catalog = await new LocalContentAdapter().getCatalog();
    expect(() => validateCatalog({ ...catalog, sites: [...catalog.sites, { ...catalog.sites[0], id: '99999999-9999-4999-8999-999999999999', slug: 'duplicate' }] })).toThrow('网站 URL 存在重复值');
  });

  it('拒绝危险协议与孤立分类', async () => {
    const catalog = await new LocalContentAdapter().getCatalog();
    expect(() => validateCatalog({ ...catalog, sites: [{ ...catalog.sites[0], url: 'javascript:alert(1)' }, ...catalog.sites.slice(1)] })).toThrow();
    expect(() => validateCatalog({ ...catalog, sites: [{ ...catalog.sites[0], category: 'missing' }, ...catalog.sites.slice(1)] })).toThrow('不存在的分类');
  });

  it('不为缺少原创长描述的网站生成详情页', async () => {
    const catalog = await new LocalContentAdapter().getCatalog();
    expect(indexableSites(catalog).every((site) => site.indexable && (site.longDescription?.length || 0) >= 120)).toBe(true);
  });
});
