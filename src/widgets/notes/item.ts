import { storage } from 'wxt/utils/storage';

export const notesItem = storage.defineItem<string>('local:notes', {
  fallback: '',
});
