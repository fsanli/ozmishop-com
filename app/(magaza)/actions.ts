'use server';

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
 * Bayrağı adrese ekler: `CartDock` onu görüp toast basıyor ve masaüstünde
 * sepet çekmecesini açıyor. Adres üzerinden gitmesinin sebebi, aksiyonun
 * dönüş değerinin düz bir `<form action>`'da kaybolması — istemci bileşenine
 * çevirmeden istemciye haber vermenin tek yolu bu.
 */
const withFlag = (path: string, key: string, value: string) => {
    const [base, query = ''] = path.split('?');
    const params = new URLSearchParams(query);
    params.set(key, value);
    return `${base}?${params.toString()}`;
};

/**
 * Karttan sepete ekleme. SEPET SAYFASINA GİTMEZ: listeyi gezerken her
 * eklemede başka bir sayfaya atılmak alışverişi bitirir. Kullanıcı yerinde
 * kalır, toast görür, masaüstünde çekmece açılır.
 */
export async function quickAddToCartAction(formData: FormData) {
    const productId = Number(formData.get('productId'));
    const back = String(formData.get('back') || '/');

    if (!Number.isFinite(productId) || productId <= 0) {
        redirect(withFlag(back, 'hata', 'Ürün bulunamadı'));
    }

    try {
        await addToCart(productId, 1);
    } catch (error) {
        redirect(withFlag(back, 'hata', (error as Error).message));
    }
    redirect(withFlag(back, 'sepet', 'eklendi'));
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

    const { favorited } = await toggleFavorite(baseProductId);
    redirect(withFlag(back, 'favori', favorited ? 'eklendi' : 'cikarildi'));
}
