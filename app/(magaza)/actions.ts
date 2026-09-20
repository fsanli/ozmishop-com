'use server';

import { refresh } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { toggleFavorite } from '@/lib/account';
import { addToCart } from '@/lib/cart';
import { FLASH_COOKIE, FLASH_MAX_AGE } from '@/lib/flash';
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
 * "Az önce ne oldu" bayrağını çereze yazar; `CartDock` onu görüp toast basıyor
 * ve masaüstünde sepet çekmecesini açıyor.
 *
 * ADRES PARAMETRESİ DEĞİL, ÇEREZ. Aksiyon `redirect()` ile dönseydi tarayıcı
 * gezinme yapar ve sayfa BAŞA KAYARDI — mobilde ürünü inceleyip "Sepete
 * ekle"ye basan kullanıcı tepeye fırlıyordu. Çerez + `refresh()` ile gezinme
 * hiç olmuyor, kullanıcı baktığı yerde kalıyor.
 *
 * httpOnly DEĞİL: toast'ı bastıktan sonra istemci kendisi siliyor, yoksa
 * sonraki gezinmede tekrar çıkardı.
 */
const flash = async (value: string) => {
    (await cookies()).set(FLASH_COOKIE, value, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: FLASH_MAX_AGE,
    });
};

/**
 * Karttan sepete ekleme. SEPET SAYFASINA GİTMEZ: listeyi gezerken her
 * eklemede başka bir sayfaya atılmak alışverişi bitirir. Kullanıcı yerinde
 * kalır, toast görür, masaüstünde çekmece açılır.
 */
export async function quickAddToCartAction(formData: FormData) {
    const productId = Number(formData.get('productId'));

    if (!Number.isFinite(productId) || productId <= 0) {
        await flash('hata:Ürün bulunamadı');
        refresh();
        return;
    }

    try {
        await addToCart(productId, 1);
    } catch (error) {
        await flash(`hata:${(error as Error).message}`);
        refresh();
        return;
    }
    await flash('sepet:eklendi');
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

    const { favorited } = await toggleFavorite(baseProductId);
    await flash(favorited ? 'favori:eklendi' : 'favori:cikarildi');
    refresh();
}
