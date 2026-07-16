import { readFile, writeFile } from 'node:fs/promises';

const sites = JSON.parse(await readFile(new URL('../apps/navigation/src/data/sites.json', import.meta.url), 'utf8'));
const published = sites.filter((site) => site.status === 'published');
const results = [];
for (const site of published) {
  const started = Date.now();
  try {
    const response = await fetch(site.url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(12000), headers: { 'user-agent': 'TwilightBeaconHealthCheck/0.1' } });
    results.push({ siteId: site.id, slug: site.slug, checkedAt: new Date().toISOString(), finalUrl: response.url, httpStatus: response.status, durationMs: Date.now() - started, status: response.ok ? 'healthy' : 'http_error' });
  } catch (error) {
    results.push({ siteId: site.id, slug: site.slug, checkedAt: new Date().toISOString(), finalUrl: null, httpStatus: null, durationMs: Date.now() - started, status: error?.name === 'TimeoutError' ? 'timeout' : 'network_error' });
  }
}
await writeFile(new URL('../health-report.json', import.meta.url), JSON.stringify(results, null, 2));
console.log(`检查完成：${results.filter((item) => item.status === 'healthy').length}/${results.length} 正常。单次失败仅进入人工复核，不自动下线。`);
