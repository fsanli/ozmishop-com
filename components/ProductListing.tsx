import Link from 'next/link';
import { getProducts, type ProductQuery } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import {
    buildHref,
    pageHref,
    readListingParams,
    SORT_OPTIONS,
    toggleValueHref,
    type SearchParams,
} from '@/lib/listing';
import EmptyState from './EmptyState';
import JsonLd from './JsonLd';
import ProductGrid from './ProductGrid';
import { itemListSchema } from '@/lib/schema';

/**
 * Kategori, marka ve koleksiyon sayfalarının ortak listeleme bloğu.
 *
 * Filtreler <Link>'tir, istemci durumu yoktur: JavaScript kapalıyken de çalışır,
 * adres paylaşılabilir ve geri tuşu beklendiği gibi davranır. Bu bileşen
 * searchParams okuduğu için çağıran sayfada <Suspense> içine alınır — statik kabuk
 * (başlık, breadcrumb) anında görünür, liste akar.
 */
export default async function ProductListing({
    basePath,
    searchParams: searchParamsPromise,
    baseQuery,
}: {
    basePath: string;
    /** Promise olarak alınır: await işlemi Suspense sınırının İÇİNDE kalmalı, yoksa
     *  sayfanın statik kabuğu da istek zamanına ertelenir. */
    searchParams: Promise<SearchParams>;
    baseQuery: Omit<ProductQuery, 'page' | 'sort' | 'values' | 'minPrice' | 'maxPrice' | 'inStock'>;
}) {
    const searchParams = await searchParamsPromise;
    const state = readListingParams(searchParams);
    const listing = await getProducts({
        ...baseQuery,
        values: state.values,
        minPrice: state.minPrice,
        maxPrice: state.maxPrice,
        inStock: state.inStock || undefined,
        sort: state.sort,
        page: state.page,
        facets: true,
    });

    const { facets, pagination, items } = listing;
    const hasFilters = state.values.length > 0 || state.inStock || state.minPrice !== undefined || state.maxPrice !== undefined;

    return (
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <aside className="lg:sticky lg:top-36 lg:self-start">
                <div className="card p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-900">Filtreler</h2>
                        {hasFilters && (
                            <Link href={basePath} className="text-xs text-brand-600 hover:underline">Temizle</Link>
                        )}
                    </div>

                    <Link
                        href={buildHref(basePath, searchParams, { stokta: state.inStock ? undefined : '1' })}
                        className={`mb-4 flex items-center gap-2 text-sm ${state.inStock ? 'font-medium text-brand-700' : 'text-slate-600'}`}
                    >
                        <span
                            aria-hidden
                            className={`flex h-4 w-4 items-center justify-center rounded border ${
                                state.inStock ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300'
                            }`}
                        >
                            {state.inStock ? '✓' : ''}
                        </span>
                        Sadece stoktakiler
                    </Link>

                    {facets?.brands && facets.brands.length > 1 && !baseQuery.brand && (
                        <div className="mb-4 border-t border-slate-100 pt-4">
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Marka</h3>
                            <ul className="space-y-1">
                                {facets.brands.map((brand) => (
                                    <li key={brand.id}>
                                        <Link
                                            href={buildHref(basePath, searchParams, { marka: brand.slug })}
                                            className="flex items-center justify-between text-sm text-slate-600 hover:text-brand-600"
                                        >
                                            <span>{brand.name}</span>
                                            <span className="text-xs text-slate-400">{brand.count}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {facets?.variantKeys.map((key) => (
                        <div key={key.id} className="mb-4 border-t border-slate-100 pt-4">
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{key.name}</h3>
                            {key.inputType === 'color' ? (
                                <div className="flex flex-wrap gap-2">
                                    {key.values.map((value) => {
                                        const active = state.values.includes(value.id);
                                        return (
                                            <Link
                                                key={value.id}
                                                href={toggleValueHref(basePath, searchParams, value.id)}
                                                title={`${value.name} (${value.count})`}
                                                aria-label={value.name}
                                                className={`h-7 w-7 rounded-full border-2 transition ${
                                                    active ? 'border-brand-500 ring-2 ring-brand-200' : 'border-slate-200'
                                                }`}
                                                style={{ backgroundColor: value.hexCode || '#e2e2e2' }}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                <ul className="space-y-1">
                                    {key.values.map((value) => {
                                        const active = state.values.includes(value.id);
                                        return (
                                            <li key={value.id}>
                                                <Link
                                                    href={toggleValueHref(basePath, searchParams, value.id)}
                                                    className={`flex items-center justify-between text-sm ${
                                                        active ? 'font-medium text-brand-700' : 'text-slate-600 hover:text-brand-600'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <span
                                                            aria-hidden
                                                            className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                                                                active ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300'
                                                            }`}
                                                        >
                                                            {active ? '✓' : ''}
                                                        </span>
                                                        {value.name}
                                                    </span>
                                                    <span className="text-xs text-slate-400">{value.count}</span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    ))}

                    {facets?.price && facets.price.max > 0 && (
                        <div className="border-t border-slate-100 pt-4 text-xs text-slate-500">
                            Fiyat aralığı: {formatPrice(facets.price.min)} – {formatPrice(facets.price.max)}
                        </div>
                    )}
                </div>
            </aside>

            <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-500">
                        <strong className="font-semibold text-slate-900">{pagination.total}</strong> ürün bulundu
                    </p>
                    <div className="no-scrollbar flex gap-1 overflow-x-auto">
                        {SORT_OPTIONS.map((option) => (
                            <Link
                                key={option.value}
                                href={buildHref(basePath, searchParams, { sirala: option.value === 'featured' ? undefined : option.value })}
                                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs transition ${
                                    state.sort === option.value ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                {option.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {items.length === 0 ? (
                    <EmptyState
                        title="Bu filtrelerle ürün bulunamadı"
                        description="Filtreleri temizleyip tekrar deneyebilir ya da başka bir kategoriye göz atabilirsiniz."
                        action={<Link href={basePath} className="btn-secondary">Filtreleri temizle</Link>}
                    />
                ) : (
                    <>
                        <ProductGrid products={items} priorityCount={4} />
                        <JsonLd data={itemListSchema(items, { page: pagination.page, pageSize: pagination.pageSize })} />
                    </>
                )}

                {pagination.totalPages > 1 && (
                    <nav aria-label="Sayfalama" className="mt-8 flex items-center justify-center gap-3">
                        {pagination.page > 1 ? (
                            <Link rel="prev" href={pageHref(basePath, searchParams, pagination.page - 1)} className="btn-secondary btn-sm">
                                ← Önceki
                            </Link>
                        ) : (
                            <span className="btn-secondary btn-sm opacity-40">← Önceki</span>
                        )}
                        <span className="text-sm text-slate-500">
                            Sayfa {pagination.page} / {pagination.totalPages}
                        </span>
                        {pagination.page < pagination.totalPages ? (
                            <Link rel="next" href={pageHref(basePath, searchParams, pagination.page + 1)} className="btn-secondary btn-sm">
                                Sonraki →
                            </Link>
                        ) : (
                            <span className="btn-secondary btn-sm opacity-40">Sonraki →</span>
                        )}
                    </nav>
                )}
            </div>
        </div>
    );
}
