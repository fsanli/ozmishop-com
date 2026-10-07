import 'server-only';
import { cookies } from 'next/headers';
import { proxyHeaders } from './bff';
import {
    ATTEMPT_COOKIE, ATTEMPT_MAX_AGE, CART_COOKIE, CART_COUNT_COOKIE, CART_MAX_AGE, COOKIE_BASE, ORDER_ACCESS_COOKIE,
    SESSION_COOKIE,
} from './session';
import type {
    Cart, CheckoutAttempt, InstallmentOption, Order, OrderDocument, PlaceOrderResult,
} from './types';

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

/** Bir tarayıcıda saklanan en fazla sipariş jetonu; çerez 4 KB sınırını aşmasın. */
const ORDER_ACCESS_LIMIT = 5;
const ORDER_ACCESS_MAX_AGE = 60 * 60 * 24 * 30;

type OrderAccess = Record<string, string>;

function readOrderAccess(raw: string | undefined): OrderAccess {
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

/**
 * Sipariş jetonunu çereze yazar; en yeni sipariş başta, en eskisi düşer.
 * YALNIZCA Server Action'lardan (çerez yazma kuralı, bkz. `persist`).
 */
export async function rememberOrderAccess(orderNumber: string, token: string): Promise<void> {
    const jar = await cookies();
    const current = readOrderAccess(jar.get(ORDER_ACCESS_COOKIE)?.value);
    delete current[orderNumber];
    const next = Object.fromEntries([[orderNumber, token], ...Object.entries(current)].slice(0, ORDER_ACCESS_LIMIT));
    jar.set(ORDER_ACCESS_COOKIE, JSON.stringify(next), { ...COOKIE_BASE, maxAge: ORDER_ACCESS_MAX_AGE });
}

/** Bu tarayıcının bu sipariş için jetonu (yoksa undefined). */
async function orderAccessToken(orderNumber: string): Promise<string | undefined> {
    const jar = await cookies();
    return readOrderAccess(jar.get(ORDER_ACCESS_COOKIE)?.value)[orderNumber];
}

/**
 * Sipariş okuma: üye oturumu ve/veya bu tarayıcının sipariş jetonuyla.
 * API oturumu "isteğe bağlı" okur ama GEÇERSİZ oturumu reddeder (401); süresi
 * dolmuş bir oturum çerezi misafirin kendi siparişini görmesini engellemesin
 * diye 401'de oturumsuz bir kez daha denenir.
 */
async function orderFetch(orderNumber: string, path: string): Promise<Response> {
    const jar = await cookies();
    const session = jar.get(SESSION_COOKIE)?.value;
    const access = await orderAccessToken(orderNumber);
    const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(await proxyHeaders()),
        ...(access ? { 'x-order-access': access } : {}),
    };
    if (session) {
        const response = await fetch(`${API_BASE}${path}`, { cache: 'no-store', headers: { ...headers, Authorization: `Bearer ${session}` } });
        if (response.status !== 401) return response;
    }
    return fetch(`${API_BASE}${path}`, { cache: 'no-store', headers });
}

/** Sepet kapandı: jeton düşer, adet rozeti sıfırlanır. */
async function closeCart(): Promise<void> {
    const jar = await cookies();
    jar.delete(CART_COOKIE);
    jar.set(CART_COUNT_COOKIE, '0', { ...COOKIE_BASE, httpOnly: false, maxAge: CART_MAX_AGE });
}

/**
 * Siparişi tamamlar. Havalede sipariş hemen açılır; kartta yalnız bir ÖDEME
 * DENEMESİ açılır ve sepet olduğu gibi kalır — ödeme başarısız olursa müşteri
 * aynı sepetle yeniden dener. Sepet ancak sağlayıcı ödemeyi onaylayınca
 * kapanır (bkz. `finishAttempt`).
 *
 * `idempotencyKey` formun her çiziminde bir kez üretilir: çift tıklama ve ağ
 * tekrarı API'de aynı denemeyi döndürür, iki ayrı tahsilat penceresi açmaz.
 *
 * YALNIZCA Server Action'lardan (çerez yazma kuralı, bkz. `persist`).
 */
export async function placeOrder(payload: Record<string, unknown>, idempotencyKey?: string): Promise<PlaceOrderResult> {
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
            ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
        },
        body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || 'Sipariş tamamlanamadı');
    const result = body as PlaceOrderResult;

    if (result.paymentMethod === 'card') {
        // Deneme jetonu yalnız sunucuda: iframe sayfası, dönüş ucu ve yoklama
        // bununla okur. Sepet çerezine DOKUNULMAZ.
        jar.set(ATTEMPT_COOKIE, `${result.attemptId}:${result.attemptAccessToken}`, { ...COOKIE_BASE, maxAge: ATTEMPT_MAX_AGE });
        // Sahte sağlayıcı (geliştirme) bildirimi anında üretebiliyor.
        if (result.status === 'succeeded') await finishAttempt(result);
        return result;
    }

    await closeCart();
    // Sipariş erişim jetonu: havale onayında sipariş sayfası bununla açılır.
    if (result.accessToken && result.orderNumber) await rememberOrderAccess(result.orderNumber, result.accessToken);
    return result;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Deneme kimliği biçimi; adresten gelen değer API'ye gitmeden süzülür. */
export function isAttemptId(value: string | null | undefined): value is string {
    return Boolean(value && UUID.test(value));
}

/** Bu tarayıcının BU deneme için jetonu; çerez başka bir denemeye aitse yok. */
async function attemptAccessToken(attemptId: string): Promise<string | undefined> {
    const raw = (await cookies()).get(ATTEMPT_COOKIE)?.value ?? '';
    const split = raw.indexOf(':');
    if (split < 1 || raw.slice(0, split) !== attemptId) return undefined;
    return raw.slice(split + 1) || undefined;
}

/**
 * Deneme okuma/işaretleme: bu tarayıcının deneme jetonu ve/veya üye oturumu.
 * İkisi de yoksa istek hiç atılmaz. Geçersiz oturumda 401 → oturumsuz bir kez
 * daha (bkz. `orderFetch`).
 */
async function attemptFetch(attemptId: string, path: string, init: RequestInit = {}): Promise<Response | null> {
    const jar = await cookies();
    const session = jar.get(SESSION_COOKIE)?.value;
    const access = await attemptAccessToken(attemptId);
    if (!session && !access) return null;

    const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(await proxyHeaders()),
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(access ? { 'x-attempt-access': access } : {}),
    };
    if (session) {
        const response = await fetch(`${API_BASE}${path}`, {
            ...init, cache: 'no-store', headers: { ...headers, Authorization: `Bearer ${session}` },
        });
        if (response.status !== 401 || !access) return response;
    }
    return fetch(`${API_BASE}${path}`, { ...init, cache: 'no-store', headers });
}

/** Kart denemesinin durumu. Erişim yoksa (başka tarayıcı, süresi dolmuş çerez) null. */
export async function getAttempt(attemptId: string): Promise<CheckoutAttempt | null> {
    if (!isAttemptId(attemptId)) return null;
    const response = await attemptFetch(attemptId, `/checkout/attempts/${attemptId}`);
    if (!response?.ok) return null;
    return response.json();
}

/**
 * Zaman çizelgesi işareti (iframe açıldı, dönüş sayfasına gelindi). Panel
 * müşterinin NEREDE takıldığını bununla raporlar; ödemeyi etkilemez. Hata
 * bilerek yutulur: işaret kaybolsa da müşteri akışı sürmeli.
 */
export async function sendAttemptEvent(attemptId: string, type: 'iframe_loaded' | 'return_ok' | 'return_fail'): Promise<void> {
    if (!isAttemptId(attemptId)) return;
    try {
        await attemptFetch(attemptId, `/checkout/attempts/${attemptId}/events`, {
            method: 'POST',
            body: JSON.stringify({ type }),
        });
    } catch {
        // Bilerek yutulur — bkz. yukarı.
    }
}

/**
 * Ödeme onaylandı: sipariş erişim jetonu çereze, sepet kapanır. Sipariş
 * sayfası e-postasız açılır. YALNIZCA Server Action'lardan ve Route
 * Handler'lardan (çerez yazma kuralı).
 */
export async function finishAttempt(attempt: CheckoutAttempt): Promise<void> {
    if (attempt.status !== 'succeeded' || !attempt.orderNumber) return;
    await closeCart();
    if (attempt.accessToken) await rememberOrderAccess(attempt.orderNumber, attempt.accessToken);
}

/**
 * Siparişte kabul edilmiş belge (ön bilgilendirme / mesafeli satış). Sipariş
 * sayfasıyla aynı kural: üye oturumu, bu tarayıcının sipariş jetonu ya da
 * e-posta (e-postadaki eski bağlantılar).
 */
export async function getOrderDocument(orderNumber: string, kind: string, email?: string): Promise<OrderDocument | null> {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const response = await orderFetch(orderNumber, `/orders/${encodeURIComponent(orderNumber)}/documents/${encodeURIComponent(kind)}${query}`);
    if (!response.ok) return null;
    return response.json();
}

/**
 * Sipariş onayı. Numara tek başına yetmez: üye oturumu, bu tarayıcının sipariş
 * jetonu ya da e-posta eşleşmesi gerekir (API `canSee`). Oturum eskiden
 * gönderilmiyordu; üye kendi siparişini de ancak `?e=` ile görebiliyordu.
 */
export async function getOrder(orderNumber: string, email?: string): Promise<(Order & { accessToken?: string }) | null> {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const response = await orderFetch(orderNumber, `/orders/${encodeURIComponent(orderNumber)}${query}`);
    if (!response.ok) return null;
    return response.json();
}
