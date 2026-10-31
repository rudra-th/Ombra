import { storage } from 'wxt/utils/storage';
import { type LinkItem } from './store';

export const linksItem = storage.defineItem<LinkItem[]>('local:links', {
  fallback: [],
});
