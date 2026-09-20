import type { SiteSettings } from '@/lib/types';

/**
 * WhatsApp bağlantıları — TEK kaynak.
 *
 * Üç yerde kullanılıyor: ürün kartı, arama açılırı ve ürün detayı. Üçü de
 * aynı numarayı, aynı mesaj kalıbını ve aynı temizleme kurallarını kullanmalı;
 * kalıbı kopyalamak, ayar değiştiğinde bir yerin eski metni göstermesi demek.
 */

/**
 * wa.me yalnızca RAKAM kabul eder. Ayar `+90 (555) 111 22 33` gibi
 * girilebilsin diye buradan geçiriliyor; editörün biçim ezberlemesi gerekmiyor.
 */
export const normaliseNumber = (raw: string | undefined | null): string => {
    const digits = String(raw ?? '').replace(/\D/g, '');
    // 0 ile başlayan yerel yazım (05551112233) → 90 eklenir. 10 hane (5551112233)
    // de aynı şekilde. Zaten ülke kodu varsa dokunulmaz.
    if (digits.length === 11 && digits.startsWith('0')) return `90${digits.slice(1)}`;
    if (digits.length === 10 && digits.startsWith('5')) return `90${digits}`;
    return digits;
};

/** {{urun}} {{link}} {{fiyat}} — render.js'teki sözdiziminin aynısı. */
const fill = (template: string, vars: Record<string, string>) =>
    template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, name) => vars[name] ?? '');

/**
 * Numara yoksa `null` döner ve ÇAĞIRAN butonu hiç çizmez. Yarım
 * yapılandırılmış bir kanal — tıklanınca hiçbir şey yapmayan bir buton —
 * hiç göstermemekten kötü.
 */
export function whatsappLink(
    settings: SiteSettings,
    message: string,
): string | null {
    const number = normaliseNumber(settings['iletisim.whatsapp_numarasi']);
    if (!number) return null;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** "Bu ürünü satın almak istiyorum" bağlantısı. */
export function productWhatsappLink(
    settings: SiteSettings,
    product: { name: string; slug: string; price?: number | null },
    siteUrl: string,
): string | null {
    const template = settings['iletisim.whatsapp_mesaji']
        ?? 'Merhaba, {{urun}} ürününü satın almak istiyorum.\n{{link}}';
    return whatsappLink(settings, fill(template, {
        urun: product.name,
        link: `${siteUrl}/urun/${product.slug}`,
        fiyat: product.price != null
            ? `${product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`
            : '',
    }));
}

/** Köşedeki destek balonu; ürün bağlamı yok. */
export function supportWhatsappLink(settings: SiteSettings): string | null {
    if (settings['iletisim.whatsapp_destek_aktif'] === false) return null;
    return whatsappLink(settings, settings['iletisim.whatsapp_destek_mesaji'] ?? 'Merhaba, bilgi almak istiyorum.');
}
