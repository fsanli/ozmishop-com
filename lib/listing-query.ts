import type { ProductQuery } from './api';
import type { ListingState, SearchParams } from './listing';
import { many } from './listing';

/**
 * Liste sorgusu — sunucu sayfası (ProductListing) ve "sonraki sayfa" vekili
 * (`/api/kategori/[slug]/urunler`) AYNI fonksiyonla kurar. `getProducts`
 * `'use cache'` ile argümanlarından anahtarlanıyor: iki taraf aynı nesneyi
 * üretirse ikinci sayfa ilk ziyaretçide de önbellekten gelir.
 */
export type ListingBaseQuery = Omit<ProductQuery, 'page' | 'sort' | 'values' | 'minPrice' | 'maxPrice' | 'inStock' | 'ozellik' | 'aralik'>;

export function listingQuery(baseQuery: ListingBaseQuery, state: ListingState, page: number): ProductQuery {
    return {
        ...baseQuery,
        // Marka sayfasının kendi markası adresteki `marka`dan önce gelir.
        brand: baseQuery.brand ?? state.brand,
        values: state.values,
        ozellik: state.specs,
        aralik: state.specRanges,
        minPrice: state.minPrice,
        maxPrice: state.maxPrice,
        inStock: state.inStock || undefined,
        sort: state.sort,
        page,
        facets: true,
    };
}

/**
 * Listenin kimliği: yol + `sayfa` HARİÇ parametreler, sıralı. Filtre ya da
 * sıralama değişince anahtar değişir ve önceki listenin sonuçları yeni listeye
 * karışmaz; geri dönüş kaydı da bu anahtarla ayrılır (S02/S03).
 */
export function listKeyOf(basePath: string, searchParams: SearchParams): string {
    const pairs: [string, string][] = [];
    Object.entries(searchParams).forEach(([key, value]) => {
        if (key === 'sayfa' || key.startsWith('utm_') || key === 'gclid') return;
        many(value).forEach((item) => pairs.push([key, item]));
    });
    pairs.sort((a, b) => (a[0] === b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0])));
    const text = new URLSearchParams(pairs).toString();
    return text ? `${basePath}?${text}` : basePath;
}

/** `URLSearchParams` → Next'in `searchParams` biçimi (tekrar eden anahtar dizi olur). */
export function toSearchParams(params: URLSearchParams): SearchParams {
    const result: SearchParams = {};
    params.forEach((value, key) => {
        const current = result[key];
        if (current === undefined) result[key] = value;
        else result[key] = Array.isArray(current) ? [...current, value] : [current, value];
    });
    return result;
}
