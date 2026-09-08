import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import EmptyState from '@/components/EmptyState';
import ProductGrid from '@/components/ProductGrid';
import { search } from '@/lib/api';
import { one, pageHref, type SearchParams } from '@/lib/listing';
import { routes } from '@/lib/site';

// Arama sonuçları indekslenmez: Google'ın "arama içinde arama" kuralı.
export const metadata: Metadata = {
    title: 'Arama',
    robots: { index: false, follow: true },
};

async function SearchResults({ searchParams: searchParamsPromise }: { searchParams: Promise<SearchParams> }) {
    const searchParams = await searchParamsPromise;
    const term = (one(searchParams.q) ?? '').trim();

    if (!term) {
        return <EmptyState title="Ne aramak istersiniz?" description="Ürün, kategori veya marka adı yazın." />;
    }

    const page = Number(one(searchParams.sayfa) ?? 1) || 1;
    const results = await search({ q: term, page, pageSize: 24, facets: false });

    if (!results.items.length) {
        return (
            <EmptyState
                title={`“${term}” için sonuç bulunamadı`}
                description="Yazımı kontrol edin ya da daha genel bir kelime deneyin."
                action={<Link href={routes.home} className="btn-secondary">Anasayfaya dön</Link>}
            />
        );
    }

    return (
        <>
            <h1 className="heading-1 mb-4">“{term}” için sonuçlar</h1>
            <p className="mb-4 text-sm text-slate-500">
                <strong className="font-semibold text-slate-900">{results.pagination.total}</strong> sonuç bulundu
            </p>
            <ProductGrid products={results.items} priorityCount={4} />
            {results.pagination.totalPages > 1 && (
                <nav aria-label="Sayfalama" className="mt-8 flex items-center justify-center gap-3">
                    {results.pagination.page > 1 ? (
                        <Link rel="prev" href={pageHref(routes.searchPage, searchParams, results.pagination.page - 1)} className="btn-secondary btn-sm">← Önceki</Link>
                    ) : (
                        <span className="btn-secondary btn-sm opacity-40">← Önceki</span>
                    )}
                    <span className="text-sm text-slate-500">Sayfa {results.pagination.page} / {results.pagination.totalPages}</span>
                    {results.pagination.page < results.pagination.totalPages ? (
                        <Link rel="next" href={pageHref(routes.searchPage, searchParams, results.pagination.page + 1)} className="btn-secondary btn-sm">Sonraki →</Link>
                    ) : (
                        <span className="btn-secondary btn-sm opacity-40">Sonraki →</span>
                    )}
                </nav>
            )}
        </>
    );
}

export default function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    // Başlık da arama terimine bağlı olduğu için Suspense'in içinde kalır;
    // dışarıda kalan her şey statik kabuğa girer ve anında görünür.
    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Suspense
                fallback={
                    <>
                        <div className="mb-6 h-8 w-64 animate-pulse rounded bg-slate-100" />
                        <div className="h-96 animate-pulse rounded-xl bg-slate-100" />
                    </>
                }
            >
                <SearchResults searchParams={searchParams} />
            </Suspense>
        </div>
    );
}
