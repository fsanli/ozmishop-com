'use server';

import { refresh } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
    addToCart, applyCartCoupon, removeCartCoupon, removeCartItem, setCartQuantity,
} from '@/lib/cart';
import { FLASH_COOKIE, FLASH_MAX_AGE } from '@/lib/flash';
import { routes } from '@/lib/site';

/**
 * Sepet aksiyonları. Hepsi düz `<form action={...}>` ile çağrılır: istemci
 * bileşeni yok, JavaScript kapalıyken de çalışır.
 *
 * Hata mesajı adrese yazılır (`?hata=`) ve sayfa onu basar — kullanıcı ne
 * olduğunu görür, sepet sayfası bir istemci bileşenine dönüşmez.
 */
const withError = (path: string, message: string) => `${path}?hata=${encodeURIComponent(message)}`;

export async function addToCartAction(formData: FormData) {
    const productId = Number(formData.get('productId'));
    const quantity = Number(formData.get('quantity') || 1);
    const back = String(formData.get('back') || routes.cart);

    if (!Number.isFinite(productId)) redirect(withError(back, 'Ürün bulunamadı'));

    try {
        await addToCart(productId, Number.isFinite(quantity) && quantity > 0 ? quantity : 1);
    } catch (error) {
        redirect(withError(back, (error as Error).message));
    }
    // NE SEPET SAYFASINA GİDER NE DE SAYFAYI KAYDIRIR: bayrak çereze yazılıp
    // `refresh()` çağrılıyor, gezinme hiç olmuyor. Kullanıcı baktığı yerde
    // kalıyor, toast görüyor, masaüstünde çekmece açılıyor.
    (await cookies()).set(FLASH_COOKIE, 'sepet:eklendi', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: FLASH_MAX_AGE,
    });
    refresh();
}

export async function setQuantityAction(formData: FormData) {
    const itemId = Number(formData.get('itemId'));
    const quantity = Number(formData.get('quantity'));

    try {
        await setCartQuantity(itemId, quantity);
    } catch (error) {
        redirect(withError(routes.cart, (error as Error).message));
    }
    refresh();
}

export async function removeItemAction(formData: FormData) {
    const itemId = Number(formData.get('itemId'));
    try {
        await removeCartItem(itemId);
    } catch (error) {
        redirect(withError(routes.cart, (error as Error).message));
    }
    refresh();
}

export async function applyCouponAction(formData: FormData) {
    const code = String(formData.get('kupon') || '').trim();
    if (!code) redirect(withError(routes.cart, 'Kupon kodu girin'));

    try {
        await applyCartCoupon(code);
    } catch (error) {
        redirect(withError(routes.cart, (error as Error).message));
    }
    refresh();
}

export async function removeCouponAction() {
    await removeCartCoupon();
    refresh();
}
