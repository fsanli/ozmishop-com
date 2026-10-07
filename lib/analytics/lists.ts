'use client';

import type { GaItem } from './items';

/**
 * Ekranda listelenen ürünlerin kaydı: `select_item` için tıklanan bağlantıdan
 * (/urun/<slug>) öğeye ulaşılır. Her karta istemci sınırı koymak yerine tek
 * bir delegeli dinleyici (SelectItemListener) bunu okur.
 */
const registry = new Map<string, GaItem>();

export function registerListItems(entries: { slug: string; item: GaItem }[]): void {
    entries.forEach(({ slug, item }) => registry.set(slug, item));
}

export function listItemFor(slug: string): GaItem | undefined {
    return registry.get(slug);
}
