/**
 * Analitiğe giden adres ve metinlerin temizliği. Kural: kişisel veri GA4'e,
 * GTM'e ya da kampanya kaydına ASLA girmez.
 *
 * Next import'u YOK: düz Node testi (scripts/check-analytics.mjs) doğrudan alır.
 */

/** `page_location`'da kalabilecek parametreler. Gerisi (e, t, token, jeton, q…) atılır. */
const KEEP_PARAMS = /^(utm_(source|medium|campaign|term|content)|sayfa|secim|ozellik|aralik|min|max|sirala|stokta|marka)$/;

const EMAIL = /[^\s@/?&=]+@[^\s@/?&=]+\.[a-z]{2,}/gi;
// 10+ haneli numara (boşluk/tire/parantezle yazılmış olabilir): telefon.
const PHONE = /\+?\d[\d\s().-]{8,}\d/g;

export function redact(text: string): string {
    return text.replace(EMAIL, '[redacted]').replace(PHONE, '[redacted]');
}

/**
 * Adresi analitiğe uygun hale getirir: izinli parametreler kalır, değerler
 * temizlenir, parça (#) atılır. Sipariş sayfasının eski `?e=<e-posta>`
 * bağlantısı ve sıfırlama jetonları bu yüzden GA4'e gitmez.
 */
export function cleanUrl(href: string): string {
    let url: URL;
    try {
        url = new URL(href);
    } catch {
        return '';
    }
    const kept = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
        if (KEEP_PARAMS.test(key)) kept.append(key, redact(value).slice(0, 100));
    });
    const query = kept.toString();
    return `${url.origin}${redact(decodeURIComponent(url.pathname))}${query ? `?${query}` : ''}`;
}

/** Arama terimi: kısa ve temiz; e-posta/telefon yazılmışsa gitmez. */
export function cleanSearchTerm(term: string): string {
    return redact(term.trim()).slice(0, 60);
}

/**
 * UTM değeri: kampanya bağlantısına kişisel veri koyan bir iş ortağı olabilir.
 * Küçük harf (source/medium), sınırlı karakter, 100 karakter, e-posta/telefon yok.
 */
export function cleanUtm(value: string | null | undefined, { lower = false } = {}): string | undefined {
    if (!value) return undefined;
    const cleaned = redact(value.trim()).replace(/[^\p{L}\p{N} ._+/\-[\]]/gu, '').slice(0, 100);
    if (!cleaned) return undefined;
    // Türkçe kural DEĞİL: "Instagram" → "ınstagram" olur, GA4'te ayrı kaynak sayılırdı.
    return lower ? cleaned.toLowerCase() : cleaned;
}
