import { listCategories, listSites } from '$lib/server/db';
export const load = () => ({ categories: listCategories(), sites: listSites() });
