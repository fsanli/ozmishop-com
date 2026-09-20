'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import { toggleFavorite } from '@/lib/account';
import { addToCart } from '@/lib/cart';
import { getCurrentCustomer } from '@/lib/session';
import { routes } from '@/lib/site';

/**
 * ÜRÜN KARTI AKSİYONLARI — sitenin her yerinden çağrılır.
 *
 * Listeleme, arama açılırı, anasayfa blokları, koleksiyon sayfaları… hepsi
 * aynı kartı basıyor. Bu yüzden aksiyonlar bir sayfa segmentine değil mağaza
 * grubunun köküne ait: `sepet/actions.ts` sepet SAYFASININ aksiyonlarıdır,
 * bunlar kartın.
 *
 * İkisi de düz `<form action={...}>`: istemci bileşeni yok, JavaScript
 * kapalıyken de çalışır.
 */

/**
 * Karttan sepete ekleme. Ürün sayfasındaki `addToCartAction`'dan tek farkı
 * SAYFADA KALMASI: listeyi gezerken her eklemede sepet sayfasına atılmak
 * gezinmeyi bitirir. `refresh()` başlıktaki sepet sayacını tazeler.
 */
export async function quickAddToCartAction(formData: FormData) {
    const productId = Number(formData.get('productId'));
    const back = String(formData.get('back') || '/');

    if (!Number.isFinite(productId) || productId <= 0) {
        redirect(`${back}?hata=${encodeURIComponent('Ürün bulunamadı')}`);
    }

    try {
        await addToCart(productId, 1);
    } catch (error) {
        redirect(`${back}?hata=${encodeURIComponent((error as Error).message)}`);
    }
    refresh();
}

/**
 * Favori aç/kapat.
 *
 * Misafir kullanıcı girişe yollanır ve `?devam=` ile GERİ DÖNER — kalbe basıp
 * giriş ekranında kaybolmak, özelliği hiç sunmamaktan kötü. Oturum kontrolü
 * burada yapılıyor çünkü `toggleFavorite` jetonsuz çağrıda ham bir API hatası
 * fırlatırdı.
 */
export async function toggleFavoriteAction(formData: FormData) {
    const baseProductId = Number(formData.get('baseProductId'));
    const back = String(formData.get('back') || routes.favorites);

    const customer = await getCurrentCustomer();
    if (!customer) redirect(`${routes.login}?devam=${encodeURIComponent(back)}`);

    await toggleFavorite(baseProductId);
    refresh();
}
