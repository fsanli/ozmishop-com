import { ANALYTICS_ENABLED } from '@/lib/consent-format';
import { CURRENCY, fromCard, fromCartItem, valueOf } from '@/lib/analytics/items';
import type { Cart, ProductCard } from '@/lib/types';
import TrackEvent, { ItemListTracker } from './TrackEvent';

/**
 * Sunucu sayfalarından GA4 olayları. GA tanımlı değilse HİÇBİR ŞEY basmaz:
 * sayfaya ne veri ne istemci bileşeni eklenir. İzin kontrolü tarayıcıda
 * (`track`): sayfa önbellekte olduğu için burada çerez okunmaz.
 */
export function TrackList({ id, name, products, offset = 0 }: { id: string; name: string; products: ProductCard[]; offset?: number }) {
    if (!ANALYTICS_ENABLED || !products.length) return null;
    const entries = products.map((product, index) => ({ slug: product.slug, item: fromCard(product, offset + index, { id, name }) }));
    return <ItemListTracker listId={id} listName={name} entries={entries} eventKey={`${id}:${offset}:${entries.length}`} />;
}

/** `view_cart` / `begin_checkout`: sepet satırları, kupon indirimi düşülmüş değer, kargo ayrı. */
export function TrackCart({ name, cart }: { name: 'view_cart' | 'begin_checkout'; cart: Cart }) {
    if (!ANALYTICS_ENABLED || !cart.items.length) return null;
    const items = cart.items.map((item) => fromCartItem(item));
    return (
        <TrackEvent
            name={name}
            eventKey={`${name}:${cart.items.map((item) => `${item.id}x${item.quantity}`).join(',')}`}
            params={{
                currency: CURRENCY,
                value: valueOf(items, cart.totals.discount),
                ...(cart.coupon?.valid ? { coupon: cart.coupon.code } : {}),
                items,
            }}
        />
    );
}

/** Basit olay (search, newsletter_signup). */
export function Track({ name, params, eventKey }: { name: string; params: Record<string, unknown>; eventKey: string }) {
    if (!ANALYTICS_ENABLED) return null;
    return <TrackEvent name={name} params={params} eventKey={eventKey} />;
}
