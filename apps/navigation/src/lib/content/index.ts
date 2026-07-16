import { LocalContentAdapter } from './LocalContentAdapter';
import { WordPressContentAdapter } from './WordPressContentAdapter';

export async function getCatalog() {
  const source = import.meta.env.CONTENT_SOURCE || 'local';
  return source === 'wordpress'
    ? new WordPressContentAdapter().getCatalog()
    : new LocalContentAdapter().getCatalog();
}
