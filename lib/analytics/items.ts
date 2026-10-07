import type { CartItem, ProductCard, ProductDetail, ProductVariant } from '../types';

/**
 * GA4 öğe sözleşmesi — liste, detay, sepet ve satın alma (API, D15) AYNI
 * alanları kullanır; olaylar arasında ürün eşleşsin diye.
 *
 *   item_id        ana ürün kimliği (string). Kartta SKU yok; varyant
 *                  `item_variant`'ta. Satın almada da ana ürün kimliği.
 *   item_name      ürün adı
 *   item_variant   varyant etiketi (beden/renk), yoksa yok
 *   item_brand     marka
 *   item_category  kategori adı
 *   price          KDV dahil birim fiyat (TL)
 *   quantity       adet
 *
 * Olay düzeyi: currency 'TRY'; value = Σ(price × quantity) − kupon indirimi,
 * KARGO HARİÇ (shipping ayrı parametre). Ayrıntı: docs/analitik-olaylari.md.
 */
export interface GaItem {
    item_id: string;
    item_name: string;
    item_variant?: string;
    item_brand?: string;
    item_category?: string;
    price?: number;
    quantity?: number;
    index?: number;
    item_list_id?: string;
    item_list_name?: string;
}

export const CURRENCY = 'TRY';

export function fromCard(card: ProductCard, index: number, list?: { id: string; name: string }): GaItem {
    return {
        item_id: String(card.id),
        item_name: card.name,
        item_brand: card.brand?.name,
        item_category: card.category?.name,
        ...(card.price != null ? { price: card.price } : {}),
        index,
        ...(list ? { item_list_id: list.id, item_list_name: list.name } : {}),
    };
}

export function fromDetail(product: ProductDetail, variant: ProductVariant | null | undefined): GaItem {
    const price = variant?.price ?? product.price ?? undefined;
    const label = variant?.options?.map((option) => option.valueName).join(' / ');
    return {
        item_id: String(product.id),
        item_name: product.name,
        ...(label ? { item_variant: label } : {}),
        item_brand: product.brand?.name,
        item_category: product.category?.name,
        ...(price != null ? { price } : {}),
        quantity: 1,
    };
}

export function fromCartItem(item: CartItem, quantity = item.quantity): GaItem {
    return {
        item_id: String(item.baseProductId),
        item_name: item.name,
        ...(item.variantLabel ? { item_variant: item.variantLabel } : {}),
        item_brand: item.brand?.name,
        price: item.price,
        quantity,
    };
}

/** Öğelerin değeri: fiyat × adet toplamı, kuruş yuvarlaması. */
export function valueOf(items: GaItem[], discount = 0): number {
    const total = items.reduce((sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 1), 0) - discount;
    return Math.max(0, Math.round(total * 100) / 100);
}
