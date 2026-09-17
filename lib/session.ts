import 'server-only';
import { cacheLife } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { proxyHeaders } from './bff';
import { routes } from './site';
import type { Customer } from './types';

const API_BASE = (process.env.API_BASE_URL || 'http://localhost:4200').replace(/\/$/, '');

/**
 * Oturum ve sepet çerezleri. Bu dosya YALNIZCA sunucuda çalışır: müşteri jetonu
 * hiçbir koşulda tarayıcıya verilmez, `API_BASE_URL` de öyle.
 *
 * Jeton, e-posta ya da sipariş numarası ASLA `cacheTag`'e veya bir `use cache`
 * fonksiyonunun argümanına girmez — önbellek anahtarları ve etiketleri düz metin
 * saklanır.
 *
 * Faz 5'te `getCurrentCustomer()` / `requireCustomer()` buraya eklenecek.
 */

/** Müşteri JWT'si (90 gün). __Host- öneki secure zorunlu kıldığı için yalnız üretimde. */
export const SESSION_COOKIE =
    process.env.NODE_ENV === 'production' ? '__Host-ozmi_oturum' : 'ozmi_oturum';

/** Misafir sepet jetonu — httpOnly. */
export const CART_COOKIE = 'ozmi_sepet';

/**
 * Sepetteki adet — httpOnly DEĞİL, çünkü tek işi header rozetini beslemek.
 * İçinde kimlik bilgisi yok; alternatifi her gezinmede bir API isteği olurdu.
 */
export const CART_COUNT_COOKIE = 'ozmi_sepet_n';

/**
 * sameSite 'strict' DEĞİL 'lax': 3D Secure dönüşü bankadan POST ile geldiği için
 * strict çerezi göndermez ve kullanıcı ödeme sonrası oturumsuz kalır.
 */
export const COOKIE_BASE = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
} as const;

export const SESSION_MAX_AGE = 60 * 60 * 24 * 90;
export const CART_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Oturumdaki müşteri. `use cache: private` ile kısa süre önbelleklenir: sonuç
 * yalnız tarayıcı belleğinde yaşar, sunucuda saklanmaz — yetişkin ürünleri
 * satan bir sitede kimliğin sunucu önbelleğinde durmaması önemli.
 *
 * DİKKAT: jeton, e-posta ya da sipariş numarası ASLA `cacheTag`'e veya bir
 * `use cache` fonksiyonunun argümanına girmez; önbellek anahtarları düz metin
 * saklanır.
 */
export async function getCurrentCustomer(): Promise<Customer | null> {
    'use cache: private';
    cacheLife({ stale: 60, revalidate: 60, expire: 300 });

    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    try {
        const response = await fetch(`${API_BASE}/users/me`, {
            cache: 'no-store',
            headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return null;
        return (await response.json()) as Customer;
    } catch {
        return null;
    }
}

/** Oturum yoksa girişe yollar. Hesabım segmentlerinin tamamı bunu çağırır. */
export async function requireCustomer(): Promise<Customer> {
    const customer = await getCurrentCustomer();
    if (!customer) redirect(`${routes.login}?devam=${encodeURIComponent(routes.account)}`);
    return customer;
}

/** Müşteri adına API çağrısı. Jeton çağırana verilmez. */
export async function accountFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) redirect(routes.login);

    const response = await fetch(`${API_BASE}${path}`, {
        ...init,
        cache: 'no-store',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            ...(await proxyHeaders()),
            ...(init.body ? { 'Content-Type': 'application/json' } : {}),
            ...(init.headers || {}),
        },
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || 'İşlem tamamlanamadı');
    return body as T;
}
