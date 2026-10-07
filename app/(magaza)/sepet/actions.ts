'use server';

import { refresh } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { analyticsAllowed, flashCartEvent, findCartItem } from '@/lib/analytics/server';
import {
    addToCart, applyCartCoupon, getCart, removeCartCoupon, removeCartItem, setCartQuantity,
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

    const count = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
    let cart;
    try {
        cart = await addToCart(productId, count);
    } catch (error) {
        redirect(withError(back, (error as Error).message));
    }
    const added = findCartItem(cart, (item) => item.productId === productId);
    if (added) await flashCartEvent('add_to_cart', added, count);
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

/**
 * Adet değişimi ve silme analitik için ÖNCEKİ adedi bilmek zorunda (artış mı
 * azalış mı). Sepet yalnız analitik izni varsa önceden okunur: izin vermeyen
 * kullanıcıya fazladan API çağrısı düşmez.
 */
const cartBefore = async () => ((await analyticsAllowed()) ? getCart().catch(() => null) : null);

export async function setQuantityAction(formData: FormData) {
    const itemId = Number(formData.get('itemId'));
    const quantity = Number(formData.get('quantity'));
    const before = findCartItem(await cartBefore(), (item) => item.id === itemId);

    let cart;
    try {
        cart = await setCartQuantity(itemId, quantity);
    } catch (error) {
        redirect(withError(routes.cart, (error as Error).message));
    }
    const after = findCartItem(cart, (item) => item.id === itemId);
    if (before) {
        const delta = (after?.quantity ?? 0) - before.quantity;
        if (delta > 0) await flashCartEvent('add_to_cart', after ?? before, delta);
        if (delta < 0) await flashCartEvent('remove_from_cart', before, -delta);
    }
    refresh();
}

export async function removeItemAction(formData: FormData) {
    const itemId = Number(formData.get('itemId'));
    const before = findCartItem(await cartBefore(), (item) => item.id === itemId);
    try {
        await removeCartItem(itemId);
    } catch (error) {
        redirect(withError(routes.cart, (error as Error).message));
    }
    if (before) await flashCartEvent('remove_from_cart', before, before.quantity);
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
