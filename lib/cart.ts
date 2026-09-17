import 'server-only';
import { cookies } from 'next/headers';
import { proxyHeaders } from './bff';
import { CART_COOKIE, CART_COUNT_COOKIE, CART_MAX_AGE, COOKIE_BASE } from './session';
import type { Cart, InstallmentOption, Order } from './types';

const API_BASE = (process.env.API_BASE_URL || 'http://localhost:4200').replace(/\/$/, '');

/**
 * Sepet veri katmanı. Yalnızca sunucuda çalışır: `API_BASE_URL` ve sepet jetonu
 * tarayıcıya hiç gitmez.
 *
 * Sepet ASLA önbelleklenmez. Sepet read-your-own-writes bir yüzey: "Sepete
 * ekle"den hemen sonra bayat bir liste görmek kullanıcının fark ettiği bir hata.
 */
async function cartFetch(path: string, init: RequestInit = {}): Promise<Cart> {
    const jar = await cookies();
    const token = jar.get(CART_COOKIE)?.value;

    const response = await fetch(`${API_BASE}${path}`, {
        ...init,
        cache: 'no-store',
        headers: {
            Accept: 'application/json',
            ...(await proxyHeaders()),
            ...(init.body ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { 'x-cart-token': token } : {}),
            ...(init.headers || {}),
        },
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(body.message || 'Sepet işlemi tamamlanamadı');
    }
    return body as Cart;
}

/**
 * Jetonu ve adet sayacını çereze yazar.
 *
 * YALNIZCA Server Action'lardan çağrılır: Next.js çerez YAZMAYA sayfa render'ı
 * sırasında izin vermez. Okuma yolu (`getCart`) bu yüzden çerez yazmaz — ilk
 * ziyaretçinin boş sepeti zaten jetona ihtiyaç duymaz, jeton ilk "sepete ekle"
 * ile (yani bir Server Action içinde) yazılır.
 *
 * İkinci çerez (`ozmi_sepet_n`) httpOnly DEĞİL ve içinde kimlik bilgisi yok:
 * tek işi header'daki rozeti beslemek. Olmasaydı her gezinmede sepet API'sine
 * bir gidiş-dönüş gerekirdi.
 */
async function persist(cart: Cart): Promise<Cart> {
    const jar = await cookies();
    jar.set(CART_COOKIE, cart.token, { ...COOKIE_BASE, maxAge: CART_MAX_AGE });
    jar.set(CART_COUNT_COOKIE, String(cart.itemCount), {
        ...COOKIE_BASE, httpOnly: false, maxAge: CART_MAX_AGE,
    });
    return cart;
}

/**
 * Sepeti okur. Çerez YAZMAZ (bkz. persist): jetonsuz istekte API boş bir sepet
 * döner ve o jeton ilk mutasyonda kalıcılaşır.
 */
export async function getCart(shippingRateId?: number): Promise<Cart> {
    const query = shippingRateId ? `?shippingRateId=${shippingRateId}` : '';
    return cartFetch(`/cart${query}`);
}

export async function addToCart(productId: number, quantity = 1): Promise<Cart> {
    return persist(await cartFetch('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
    }));
}

export async function setCartQuantity(itemId: number, quantity: number): Promise<Cart> {
    return persist(await cartFetch(`/cart/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
    }));
}

export async function removeCartItem(itemId: number): Promise<Cart> {
    return persist(await cartFetch(`/cart/items/${itemId}`, { method: 'DELETE' }));
}

export async function applyCartCoupon(code: string): Promise<Cart> {
    return persist(await cartFetch('/cart/coupon', {
        method: 'POST',
        body: JSON.stringify({ code }),
    }));
}

export async function removeCartCoupon(): Promise<Cart> {
    return persist(await cartFetch('/cart/coupon', { method: 'DELETE' }));
}

/** Taksit seçenekleri. Sağlayıcı anahtarı yoksa boş döner ve tablo gizlenir. */
export async function getInstallments(): Promise<{ total: number; options: InstallmentOption[] }> {
    const jar = await cookies();
    const token = jar.get(CART_COOKIE)?.value;
    const response = await fetch(`${API_BASE}/checkout/installments`, {
        cache: 'no-store',
        headers: { Accept: 'application/json', ...(await proxyHeaders()), ...(token ? { 'x-cart-token': token } : {}) },
    });
    if (!response.ok) return { total: 0, options: [] };
    return response.json();
}

/** Siparişi tamamlar. → { orderNumber, redirectUrl } */
export async function placeOrder(payload: Record<string, unknown>): Promise<{
    orderNumber: string;
    paymentMethod: 'card' | 'transfer';
    redirectUrl: string | null;
    grandTotal: number;
}> {
    const jar = await cookies();
    const token = jar.get(CART_COOKIE)?.value;

    const response = await fetch(`${API_BASE}/checkout/orders`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(await proxyHeaders()),
            ...(token ? { 'x-cart-token': token } : {}),
        },
        body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || 'Sipariş tamamlanamadı');

    // Sepet kapandı: adet rozeti sıfırlanmalı, jeton düşmeli.
    jar.delete(CART_COOKIE);
    jar.set(CART_COUNT_COOKIE, '0', { ...COOKIE_BASE, httpOnly: false, maxAge: CART_MAX_AGE });

    return body;
}

/** Sipariş onayı. Misafir siparişinde e-posta doğrulaması zorunlu. */
export async function getOrder(orderNumber: string, email?: string): Promise<Order | null> {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const response = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderNumber)}${query}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json', ...(await proxyHeaders()) },
    });
    if (!response.ok) return null;
    return response.json();
}
