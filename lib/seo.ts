import type { Metadata } from 'next';
import { indexPolicy, type SearchParamsLike } from './seo-url';
import { site } from './site';

type OpenGraph = NonNullable<Metadata['openGraph']>;

/** `app/og.png/route.tsx` — kendi görseli olmayan sayfaların paylaşım kartı. */
export const DEFAULT_OG_IMAGE = { url: '/og.png', width: 1200, height: 630, alt: site.title };

/**
 * Sayfa düzeyi Open Graph. Next metadata'yı SIĞ birleştirir: sayfa
 * `openGraph` verirse kökteki `siteName`, `locale` ve görsel tamamen düşer.
 * Bu yüzden her sayfa ortak alanları buradan alır; verilen alanlar ezer.
 */
export function og(fields: OpenGraph = {}, { defaultImage = true }: { defaultImage?: boolean } = {}): OpenGraph {
    return {
        type: 'website',
        locale: site.locale,
        siteName: site.name,
        // Sayfanın kendi `opengraph-image` dosyası varsa (Günlük yazısı) varsayılan
        // görsel VERİLMEZ: metadata nesnesindeki görsel dosya kuralını eziyordu.
        ...(defaultImage ? { images: [DEFAULT_OG_IMAGE] } : {}),
        ...fields,
    } as OpenGraph;
}

/**
 * Listeleme sayfalarının robots + canonical alanları (kategori, marka,
 * koleksiyon, Günlük). Karar `lib/seo-url.ts` sözleşmesinden gelir: indekslenen
 * adreste canonical kendisidir, indekslenmeyende canonical basılmaz.
 */
export function listingIndexMeta(
    base: string,
    search: SearchParamsLike,
    { empty = false }: { empty?: boolean } = {},
): Pick<Metadata, 'alternates' | 'robots'> {
    const policy = indexPolicy(search, base);
    // Ürünsüz kategori/marka: sayfa 200 kalır (stok gelince adres değerli),
    // ama boş liste ince içerik — indekse ve site haritasına girmez.
    return policy.index && !empty
        ? { alternates: { canonical: policy.canonical } }
        : { robots: { index: false, follow: true } };
}
