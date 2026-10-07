import 'server-only';
import { cookies } from 'next/headers';
import { CONSENT_COOKIE, GA_ID, parseConsent } from '../consent-format';
import { ATTRIBUTION_COOKIE, gaIdsFrom, parseAttribution, type Attribution } from './attribution';
import { ANALYTICS_EVENT_COOKIE } from '../flash';
import type { Cart, CartItem } from '../types';
import { CURRENCY, fromCartItem, valueOf } from './items';

/** Sunucu aksiyonlarında analitik izni — tarayıcıyla AYNI ayrıştırıcı. */
export async function analyticsAllowed(): Promise<boolean> {
    const raw = (await cookies()).get(CONSENT_COOKIE)?.value;
    return parseConsent(raw ? decodeURIComponent(raw) : '').analytics;
}

/**
 * Başarılı bir sepet işleminin GA4 olayını tarayıcıya bırakır (`CartDock`
 * gönderir ve siler). Sunucu aksiyonu `refresh()` ile döndüğü için olay
 * ancak API işlemi BAŞARILI olduktan sonra yazılır: stok hatasında olay yok.
 * Analitik izni yoksa hiçbir şey yazılmaz.
 */
export async function flashCartEvent(name: 'add_to_cart' | 'remove_from_cart', item: CartItem, quantity: number): Promise<void> {
    if (quantity <= 0 || !(await analyticsAllowed())) return;
    const items = [fromCartItem(item, quantity)];
    (await cookies()).set(ANALYTICS_EVENT_COOKIE, JSON.stringify({ name, params: { currency: CURRENCY, value: valueOf(items), items } }), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15,
    });
}

export const findCartItem = (cart: Cart | null | undefined, match: (item: CartItem) => boolean) => cart?.items.find(match);

/**
 * Siparişe yazılacak kaynak bilgisi (D16) ve GA kimlikleri (D15). YALNIZ
 * analitik izni varsa; yoksa `undefined` ve siparişte kaynak alanı boş kalır.
 * API değerleri ayrıca kendi tarafında temizler — tarayıcı çerezine güvenilmez.
 */
export async function orderAttribution(): Promise<(Attribution & { ga?: { clientId?: string; sessionId?: string } }) | undefined> {
    if (!(await analyticsAllowed())) return undefined;
    const jar = await cookies();
    const raw = jar.get(ATTRIBUTION_COOKIE)?.value;
    const attribution = parseAttribution(raw ? decodeURIComponent(raw) : '');
    const all = Object.fromEntries(jar.getAll().map((cookie) => [cookie.name, cookie.value]));
    const ga = GA_ID ? gaIdsFrom(all, GA_ID) : {};
    if (!attribution.f && !attribution.l && !ga.clientId) return undefined;
    return { ...attribution, ...(ga.clientId ? { ga } : {}) };
}
