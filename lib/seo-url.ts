/**
 * Listeleme adreslerinin indeks sözleşmesi — TEK kaynak.
 *
 * Bu dosya Next'ten hiçbir şey import ETMEZ: hem proxy.ts (istekten önce
 * yönlendirme) hem sayfa metadata'sı hem de `scripts/check-seo-contract.mjs`
 * (düz Node) aynı fonksiyonları kullanır. Kural tablosu o script'te.
 *
 * Sözleşme:
 * - Filtresiz liste ve filtresiz sayfa N indekslenir, canonical KENDİSİDİR.
 *   Sayfa 2'yi sayfa 1'e canonical yapmak farklı ürünleri "kopya" ilan eder.
 * - Sıralama, stok, fiyat, facet, marka, arama ve bilinmeyen her parametre
 *   `noindex, follow` alır ve canonical BASILMAZ: noindex ile başka adrese
 *   canonical birlikte çelişkili sinyaldir.
 * - Takip parametreleri (utm_*, gclid…) yok sayılır; canonical temiz adrestir.
 * - `sayfa=1` ve geçersiz `sayfa` proxy'de 308 ile temizlenir; API'ye hatalı
 *   sayfa numarası hiç gitmez.
 */

export type SearchParamsLike = Record<string, string | string[] | undefined>;

/** Sayfa üst sınırı: 9999'dan büyük sayfa gerçekçi değil, tarama tuzağıdır. */
const PAGE_PATTERN = /^[1-9]\d{0,3}$/;
const ZERO_PADDED = /^0+([1-9]\d{0,3})$/;

/** Canonical'ı ve indeks kararını etkilemeyen takip parametreleri. */
export const IGNORABLE_PARAM = /^(utm_[a-z_]+|gclid|gbraid|wbraid|fbclid|msclkid|_ic)$/;

export type PageParse =
    | { kind: 'ok'; page: number }
    | { kind: 'normalize'; page: number }
    | { kind: 'invalid' };

/**
 * `sayfa` değerini okur. Yoksa 1. `02` gibi baştaki sıfırlar normalize edilir;
 * ondalık, negatif, sıfır, metin, boş ve TEKRARLANAN parametre geçersizdir.
 */
export function parsePage(raw: string | string[] | undefined): PageParse {
    if (raw === undefined) return { kind: 'ok', page: 1 };
    if (Array.isArray(raw)) return { kind: 'invalid' };
    if (PAGE_PATTERN.test(raw)) return { kind: 'ok', page: Number(raw) };
    const padded = ZERO_PADDED.exec(raw);
    if (padded) return { kind: 'normalize', page: Number(padded[1]) };
    return { kind: 'invalid' };
}

/** Geçerli sayfa numarası; geçersizse 1 (proxy zaten yönlendirmiş olmalı). */
export function pageOf(raw: string | string[] | undefined): number {
    const parsed = parsePage(raw);
    return parsed.kind === 'invalid' ? 1 : parsed.page;
}

export interface IndexPolicy {
    index: boolean;
    /** Göreli canonical; indekslenmeyen adreste YOK. */
    canonical?: string;
}

/**
 * Bir listeleme adresinin indeks kararı. Allowlist: `sayfa` ve takip
 * parametreleri dışında anahtar varsa adres indekslenmez.
 */
export function indexPolicy(searchParams: SearchParamsLike, base: string): IndexPolicy {
    for (const [key, value] of Object.entries(searchParams)) {
        if (value === undefined || key === 'sayfa' || IGNORABLE_PARAM.test(key)) continue;
        return { index: false };
    }
    const parsed = parsePage(searchParams.sayfa);
    if (parsed.kind === 'invalid') return { index: false };
    return { index: true, canonical: parsed.page > 1 ? `${base}?sayfa=${parsed.page}` : base };
}

/** Sayfa normalizasyonunun uygulandığı listeleme yolları (proxy matcher'ı ile aynı). */
const LISTING_PATH = /^\/(kategori|marka|koleksiyon)\/[^/]+$|^\/(gunluk|arama)$/;

export function isListingPath(pathname: string): boolean {
    return LISTING_PATH.test(pathname);
}

/**
 * Adresin temiz hali: `sayfa=1` ve geçersiz `sayfa` düşer, `02` → `2`.
 * Diğer parametrelere ve sıralarına dokunmaz. Değişiklik yoksa null.
 */
export function normalizeListingSearch(search: string): string | null {
    const params = new URLSearchParams(search);
    if (!params.has('sayfa')) return null;

    const values = params.getAll('sayfa');
    const parsed = parsePage(values.length > 1 ? values : values[0]);
    if (parsed.kind === 'ok' && parsed.page > 1) return null;

    const next = new URLSearchParams();
    params.forEach((value, key) => {
        if (key !== 'sayfa') next.append(key, value);
    });
    if (parsed.kind === 'normalize' && parsed.page > 1) next.set('sayfa', String(parsed.page));
    const text = next.toString();
    return text ? `?${text}` : '';
}
