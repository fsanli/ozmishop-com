'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics/gtag';
import { registerListItems } from '@/lib/analytics/lists';
import type { GaItem } from '@/lib/analytics/items';

/**
 * Sunucu bileşeninin içinden GA4 olayı: sayfa açılınca BİR kez gönderir.
 * `eventKey` değişince (başka sayfa, başka liste) yeniden gönderir.
 * Analitik izni yoksa `track` hiçbir şey yapmaz.
 */
export default function TrackEvent({ name, params, eventKey }: { name: string; params: Record<string, unknown>; eventKey: string }) {
    useEffect(() => {
        track(name, params);
        // `params` her render'da yeni nesne; olay anahtara bağlı.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name, eventKey]);
    return null;
}

/** `view_item_list` + listedeki ürünlerin `select_item` için kaydı. */
export function ItemListTracker({ listId, listName, entries, eventKey }: {
    listId: string;
    listName: string;
    entries: { slug: string; item: GaItem }[];
    eventKey: string;
}) {
    useEffect(() => {
        registerListItems(entries);
        track('view_item_list', { item_list_id: listId, item_list_name: listName, items: entries.map((entry) => entry.item) });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listId, eventKey]);
    return null;
}
