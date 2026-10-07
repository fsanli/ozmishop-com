import { notFound } from 'next/navigation';
import { getProducts, type ProductQuery } from '@/lib/api';
import { hasActiveFilters, readListingParams, type SearchParams } from '@/lib/listing';
import { itemListSchema } from '@/lib/schema';
import EmptyState from './EmptyState';
import JsonLd from './JsonLd';
import ProductGrid from './ProductGrid';
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
 */
export default async function ProductListing({
    basePath,
    searchParams: searchParamsPromise,
    baseQuery,
}: {
    basePath: string;
    searchParams: Promise<SearchParams>;
    baseQuery: Omit<ProductQuery, 'page' | 'sort' | 'values' | 'minPrice' | 'maxPrice' | 'inStock' | 'ozellik' | 'aralik'>;
}) {
    const searchParams = await searchParamsPromise;
    const state = readListingParams(searchParams);
    const listing = await getProducts({
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
        page: state.page,
        facets: true,
    });

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
                ) : (
                    <>
                        {/* 2: mobilde ilk ekranda iki kart var; dördü de öncelikli olunca LCP ile yarışıyordu. */}
                        <ProductGrid products={items} priorityCount={2} back={basePath} />
                        <TrackList id={basePath} name={basePath} products={items} offset={(pagination.page - 1) * pagination.pageSize} />
                        <JsonLd data={itemListSchema(items, { page: pagination.page, pageSize: pagination.pageSize })} />
                    </>
                )}

                <ListingPagination pagination={pagination} basePath={basePath} searchParams={searchParams} />
            </div>
        </div>
    );
}
