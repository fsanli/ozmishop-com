import { notFound } from 'next/navigation';
import { getProducts, getSettings } from '@/lib/api';
import { hasActiveFilters, readListingParams, type SearchParams } from '@/lib/listing';
import { listingQuery, listKeyOf, type ListingBaseQuery } from '@/lib/listing-query';
import { itemListSchema } from '@/lib/schema';
import { site } from '@/lib/site';
import EmptyState from './EmptyState';
import JsonLd from './JsonLd';
import ProductCard from './ProductCard';
import ProductGrid from './ProductGrid';
import IncrementalGrid from './listing/IncrementalGrid';
import ActiveFilters from './listing/ActiveFilters';
import FilterSidebar from './listing/FilterSidebar';
import ListingPagination from './listing/ListingPagination';
import ResultsToolbar from './listing/ResultsToolbar';
import { TrackList } from './analytics/Track';

/**
 * Kategori, marka ve koleksiyon sayfalarının ortak listeleme bloğu.
 *
 * Filtreler <Link>'tir, istemci durumu yoktur: JavaScript kapalıyken de çalışır,
 * adres paylaşılabilir ve geri tuşu beklendiği gibi davranır.
 *
 * searchParams PROMISE olarak alınır ve burada, yani Suspense sınırının İÇİNDE
 * await edilir. Çağıran sayfada await edilirse sayfanın statik kabuğu da istek
 * zamanına ertelenir ve prerender kaybolur.
 *
 * `incremental`: yalnız kategori sayfaları (S02). Sonraki sayfalar liste
 * sonuna yaklaşınca aynı ızgaraya eklenir; sayfa adresleri ve bağlantıları
 * korunur. Marka, arama ve koleksiyon listeleri bilinçli olarak sayfalı kalır.
 */
export default async function ProductListing({
    basePath,
    searchParams: searchParamsPromise,
    baseQuery,
    incremental = false,
}: {
    basePath: string;
    searchParams: Promise<SearchParams>;
    baseQuery: ListingBaseQuery;
    incremental?: boolean;
}) {
    const searchParams = await searchParamsPromise;
    const state = readListingParams(searchParams);
    const listing = await getProducts(listingQuery(baseQuery, state, state.page));

    const { facets, pagination, items } = listing;
    // Var olmayan sayfa (sayfa=999): boş liste yerine 404 arayüzü. Akış başladığı
    // için durum kodu 200 kalır ama Next noindex basar; sonsuz sayfa üretilmez.
    if (state.page > Math.max(1, pagination.totalPages)) notFound();

    const activeCount = state.values.length + state.specs.length + state.specRanges.length
        + (state.inStock ? 1 : 0) + (state.brand && !baseQuery.brand ? 1 : 0)
        + (state.minPrice !== undefined || state.maxPrice !== undefined ? 1 : 0);

    const sidebar = (
        <FilterSidebar facets={facets} state={state} basePath={basePath} searchParams={searchParams} />
    );

    return (
        <div className="flex flex-wrap items-start gap-[clamp(14px,2vw,24px)]">
            {/* Mobilde katlanır, masaüstünde yapışkan kenar çubuğu. */}
            <details className="w-full lg:hidden">
                <summary className="btn-secondary w-full cursor-pointer justify-center">
                    Filtreler{activeCount > 0 ? ` (${activeCount})` : ''}
                </summary>
                <div className="mt-2">{sidebar}</div>
            </details>

            <aside className="hidden min-w-0 flex-[1_1_220px] lg:sticky lg:top-36 lg:block lg:max-w-[275px]">
                {sidebar}
            </aside>

            <div className="min-w-0 flex-[999_1_460px]">
                <ResultsToolbar
                    total={pagination.total}
                    activeFilters={activeCount}
                    sort={state.sort}
                    basePath={basePath}
                    searchParams={searchParams}
                />

                <ActiveFilters facets={facets} state={state} basePath={basePath} searchParams={searchParams} />

                {items.length === 0 ? (
                    <EmptyState
                        where="Sonuç"
                        title="Bu filtrelerle ürün bulunamadı"
                        description={hasActiveFilters(state)
                            ? 'Filtrelerden birini kaldırınca büyük ihtimalle sonuç çıkacak.'
                            : 'Bu listede henüz ürün yok. Diğer kategorilere göz atabilirsin.'}
                    />
                ) : incremental && baseQuery.category ? (
                    <>
                        <IncrementalGrid
                            listKey={listKeyOf(basePath, searchParams)}
                            endpoint={`/api/kategori/${baseQuery.category}/urunler`}
                            query={listKeyOf('', searchParams).replace(/^\?/, '')}
                            pagination={pagination}
                            initialIds={items.map((product) => product.id)}
                            basePath={basePath}
                            searchParams={searchParams}
                            settings={await getSettings()}
                            siteUrl={site.url}
                        >
                            {/* İlk grup sunucuda: dolu kalp akışı, statik kabuk, JSON-LD. */}
                            {items.map((product, index) => (
                                <ProductCard key={product.id} product={product} priority={index < 2} back={basePath} />
                            ))}
                        </IncrementalGrid>
                        <TrackList id={basePath} name={basePath} products={items} offset={(pagination.page - 1) * pagination.pageSize} />
                        <JsonLd data={itemListSchema(items, { page: pagination.page, pageSize: pagination.pageSize })} />
                    </>
                ) : (
                    <>
                        {/* 2: mobilde ilk ekranda iki kart var; dördü de öncelikli olunca LCP ile yarışıyordu. */}
                        <ProductGrid products={items} priorityCount={2} back={basePath} />
                        <TrackList id={basePath} name={basePath} products={items} offset={(pagination.page - 1) * pagination.pageSize} />
                        <JsonLd data={itemListSchema(items, { page: pagination.page, pageSize: pagination.pageSize })} />
                    </>
                )}

                {/* Otomatik yüklemede sayfalama IncrementalGrid'in içinde (son yüklenen grubu gösterir). */}
                {!(incremental && baseQuery.category && items.length > 0) && (
                    <ListingPagination pagination={pagination} basePath={basePath} searchParams={searchParams} />
                )}
            </div>
        </div>
    );
}
