import type { Cart, CartItem } from './types';

/**
 * Sepet satırının satın alınabilirliği — vitrin tarafı. Karar API'nindir
 * (`CartService.lineStatus`, S01); burada yalnız gösterilir. Sepet sayfası,
 * sepet çekmecesi ve ödeme sayfası aynı yardımcıyı kullanır ki üç ekran aynı
 * cümleyi kursun.
 */

/** Görev dosyasının istediği sade cümle: teknik/tedarik ayrıntısı yok. */
export const BLOCKED_LINE_MESSAGE = 'Bu ürün şu anda satın alınamıyor. Devam etmek için sepetinizi güncelleyiniz.';

export const BLOCKED_CART_MESSAGE = 'Sepetinde şu anda satın alınamayan ürün var. Devam etmek için sepetini güncelle.';

/** Eski API `purchasable` göndermez: o durumda yalnız satış durumu bilinir. */
export function isPurchasable(item: CartItem): boolean {
    return item.purchasable ?? item.available;
}

export function isCheckoutReady(cart: Cart): boolean {
    return cart.checkoutReady ?? (cart.items.length > 0 && cart.items.every(isPurchasable));
}

/** Satırın altına yazılacak uyarı; satılabilir satırda `null`. */
export function lineMessage(item: CartItem): string | null {
    if (isPurchasable(item)) return null;
    if (item.blockReason === 'exceeds_stock' && item.maxQuantity) {
        return `Bu üründen en fazla ${item.maxQuantity} adet alınabilir. Devam etmek için sepetinizi güncelleyiniz.`;
    }
    return BLOCKED_LINE_MESSAGE;
}
