import { indexPolicy, pageOf } from './seo-url';
import type { Facets } from './types';

/**
 * Listeleme sayfalarının URL ve SEO kuralları.
 * Filtre durumu tamamen adreste tutulur: paylaşılabilir, yer imine eklenebilir,
 * sunucuda render edilir ve geri tuşu beklendiği gibi çalışır.
 */
export type SearchParams = Record<string, string | string[] | undefined>;

export const SORT_OPTIONS = [
    { value: 'featured', label: 'Önerilen' },
    { value: 'newest', label: 'En Yeni' },
    { value: 'price_asc', label: 'Fiyat: Düşükten Yükseğe' },
    { value: 'price_desc', label: 'Fiyat: Yüksekten Düşüğe' },
    { value: 'discount_desc', label: 'En Çok İndirim' },
    { value: 'most_viewed', label: 'En Çok İncelenen' },
] as const;

export const one = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

export const many = (value: string | string[] | undefined): string[] => {
    if (value === undefined) return [];
    return Array.isArray(value) ? value : [value];
};

export interface ListingState {
    values: number[];
    /** "malzeme:tibbi-silikon" biçiminde künye seçimleri */
    specs: string[];
    /** "ses-seviyesi:30:45" biçiminde künye aralıkları */
    specRanges: string[];
    minPrice?: number;
    maxPrice?: number;
    inStock: boolean;
    /** Kategori/koleksiyon içinde tek marka süzgeci (`marka=<slug>`). */
    brand?: string;
    sort: string;
    page: number;
    q?: string;
}

export function readListingParams(searchParams: SearchParams): ListingState {
    const sort = one(searchParams.sirala) ?? 'featured';
    const brand = one(searchParams.marka);
    return {
        values: many(searchParams.secim).map(Number).filter((value) => Number.isFinite(value) && value > 0),
        specs: many(searchParams.ozellik).filter((item) => /^[a-z0-9-]+:[a-z0-9-]+$/.test(item)),
        specRanges: many(searchParams.aralik).filter((item) => /^[a-z0-9-]+:[0-9.,]*:[0-9.,]*$/.test(item)),
        minPrice: Number(one(searchParams.min)) || undefined,
        maxPrice: Number(one(searchParams.max)) || undefined,
        inStock: one(searchParams.stokta) === '1',
        brand: brand && /^[a-z0-9-]+$/.test(brand) ? brand : undefined,
        sort: SORT_OPTIONS.some((option) => option.value === sort) ? sort : 'featured',
        // Geçersiz `sayfa` proxy'de temizlenir; buraya ulaşırsa 1 sayılır, API'ye gitmez.
        page: pageOf(searchParams.sayfa),
        q: one(searchParams.q),
    };
}

/** Bir parametreyi değiştirir; sayfa her zaman 1'e döner. */
export function buildHref(basePath: string, searchParams: SearchParams, changes: Record<string, string | number | undefined>): string {
    const search = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
        if (key === 'sayfa') return;
        many(value).forEach((item) => search.append(key, item));
    });
    Object.entries(changes).forEach(([key, value]) => {
        search.delete(key);
        if (value !== undefined && value !== '') search.set(key, String(value));
    });
    const text = search.toString();
    return text ? `${basePath}?${text}` : basePath;
}

/** Bir facet değerini listeye ekler/çıkarır (çoklu seçim). */
export function toggleValueHref(basePath: string, searchParams: SearchParams, valueId: number): string {
    const current = many(searchParams.secim);
    const next = current.includes(String(valueId))
        ? current.filter((item) => item !== String(valueId))
        : [...current, String(valueId)];

    const search = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
        if (key === 'secim' || key === 'sayfa') return;
        many(value).forEach((item) => search.append(key, item));
    });
    next.forEach((item) => search.append('secim', item));
    const text = search.toString();
    return text ? `${basePath}?${text}` : basePath;
}

/**
 * Künye seçeneğini ekler/çıkarır. Varyant değerleriyle AYRI parametre kullanır
 * (`ozellik` vs `secim`): ikisi farklı id uzayı, karıştırmak çakışma üretir.
 */
export function toggleSpecHref(
    basePath: string,
    searchParams: SearchParams,
    definitionSlug: string,
    optionSlug: string,
): string {
    const token = `${definitionSlug}:${optionSlug}`;
    const current = many(searchParams.ozellik);
    const next = current.includes(token) ? current.filter((item) => item !== token) : [...current, token];

    const search = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
        if (key === 'ozellik' || key === 'sayfa') return;
        many(value).forEach((item) => search.append(key, item));
    });
    next.forEach((item) => search.append('ozellik', item));
    const text = search.toString();
    return text ? `${basePath}?${text}` : basePath;
}

/** Sayısal kovayı ekler/çıkarır. Token biçimi "tanim:min:max". */
export function toggleRangeHref(
    basePath: string,
    searchParams: SearchParams,
    definitionSlug: string,
    bucket: string,
): string {
    const token = `${definitionSlug}:${bucket}`;
    const current = many(searchParams.aralik);
    const next = current.includes(token) ? current.filter((item) => item !== token) : [...current, token];

    const search = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
        if (key === 'aralik' || key === 'sayfa') return;
        many(value).forEach((item) => search.append(key, item));
    });
    next.forEach((item) => search.append('aralik', item));
    const text = search.toString();
    return text ? `${basePath}?${text}` : basePath;
}

/** Tüm filtreleri temizler; sıralama ve arama terimi korunur. */
export function clearFiltersHref(basePath: string, searchParams: SearchParams): string {
    const search = new URLSearchParams();
    ['q', 'sirala'].forEach((key) => {
        const value = one(searchParams[key]);
        if (value) search.set(key, value);
    });
    const text = search.toString();
    return text ? `${basePath}?${text}` : basePath;
}

export function hasActiveFilters(state: ListingState): boolean {
    return state.values.length > 0 || state.specs.length > 0 || state.specRanges.length > 0
        || state.inStock || state.brand !== undefined || state.minPrice !== undefined || state.maxPrice !== undefined;
}

export function pageHref(basePath: string, searchParams: SearchParams, page: number): string {
    const search = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
        if (key === 'sayfa') return;
        many(value).forEach((item) => search.append(key, item));
    });
    if (page > 1) search.set('sayfa', String(page));
    const text = search.toString();
    return text ? `${basePath}?${text}` : basePath;
}

/**
 * Hangi listeleme adresleri indekslenir? Kural `lib/seo-url.ts`'te: yalnız
 * filtresiz liste ve filtresiz sayfa N. Sıralama, stok, facet, fiyat, marka ve
 * arama `noindex, follow` alır — aksi halde Google için sonsuz bir tarama alanı
 * doğar ve aynı ürünler onlarca adreste kopya görünür.
 */
export function shouldIndex(searchParams: SearchParams, basePath = ''): boolean {
    return indexPolicy(searchParams, basePath).index;
}

/**
 * Canonical yalnız indekslenen adreste basılır ve KENDİSİDİR (sayfa 2+ dahil);
 * indekslenmeyen adreste `undefined` — noindex ile başka adrese canonical
 * çelişkili sinyaldir.
 */
export function canonicalFor(basePath: string, searchParams: SearchParams): string | undefined {
    return indexPolicy(searchParams, basePath).canonical;
}

/** Seçili facet değerlerinin okunabilir adları (başlık altında "seçili filtreler" için). */
export function selectedValueLabels(facets: Facets | undefined, values: number[]): { id: number; name: string }[] {
    if (!facets) return [];
    const labels: { id: number; name: string }[] = [];
    facets.variantKeys.forEach((key) => {
        key.values.forEach((value) => {
            if (values.includes(value.id)) labels.push({ id: value.id, name: value.name });
        });
    });
    return labels;
}

/** Seçili künye filtrelerinin okunabilir adları ve kaldırma adresleri. */
export function selectedSpecLabels(
    facets: Facets | undefined,
    specs: string[],
): { token: string; name: string; colorKey: string }[] {
    if (!facets?.specs) return [];
    return specs.flatMap((token) => {
        const [definitionSlug, optionSlug] = token.split(':');
        const facet = facets.specs!.find((item) => item.slug === definitionSlug);
        const option = facet?.options.find((item) => item.slug === optionSlug);
        if (!facet || !option) return [];
        return [{ token, name: option.name, colorKey: facet.colorKey }];
    });
}
