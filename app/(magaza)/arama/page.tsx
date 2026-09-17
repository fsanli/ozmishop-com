import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import Container from '@/components/Container';
import EmptyState from '@/components/EmptyState';
import ListingPagination from '@/components/listing/ListingPagination';
import ProductGrid from '@/components/ProductGrid';
import { search } from '@/lib/api';
import { one, type SearchParams } from '@/lib/listing';
import { routes } from '@/lib/site';

// Arama sonuçları indekslenmez: Google'ın "arama içinde arama" kuralı.
export const metadata: Metadata = {
    title: 'Arama',
    robots: { index: false, follow: true },
};

/** Sonuç bulunamayınca ya da kullanıcı emin değilken rehbere çağırır. */
function GuideCta({ term }: { term?: string }) {
    return (
        <div className="block-dark-soft mt-5 p-[clamp(22px,3.4vw,38px)]">
            <span className="kicker text-on-dark-berry">
                {term ? 'Aradığını bulamadın mı?' : 'Nereden başlayacağını bilmiyor musun?'}
            </span>
            <h2 className="heading-2 mt-2.5 text-on-dark">Dört soruda seninkini bulalım</h2>
            <p className="mt-3 max-w-[58ch] text-[14.5px] leading-relaxed text-on-dark/62">
                Kimin için baktığın, deneyim düzeyin, sessizliğin senin için ne kadar önemli olduğu ve bütçen —
                bu dördü çoğu zaman doğru ürünü tek başına belirler.
            </p>
            <Link href={routes.guide} className="btn-primary mt-5">Rehberi başlat</Link>
        </div>
    );
}

async function SearchResults({ searchParams: searchParamsPromise }: { searchParams: Promise<SearchParams> }) {
    const searchParams = await searchParamsPromise;
    const term = (one(searchParams.q) ?? '').trim();

    if (!term) {
        return (
            <>
                <EmptyState
                    where="Arama"
                    color="plum"
                    title="Ne aramak istersin?"
                    description="Ürün, kategori veya marka adı yazabilirsin."
                />
                <GuideCta />
            </>
        );
    }

    const page = Number(one(searchParams.sayfa) ?? 1) || 1;
    const results = await search({ q: term, page, pageSize: 24, facets: false });

    if (!results.items.length) {
        return (
            <>
                <EmptyState
                    where="Arama"
                    color="plum"
                    title={`“${term}” için sonuç yok`}
                    description="Yazımı kontrol edebilir ya da daha genel bir kelime deneyebilirsin."
                    action={<Link href={routes.home} className="btn-secondary">Anasayfaya dön</Link>}
                />
                <GuideCta term={term} />
            </>
        );
    }

    return (
        <>
            <div className="card card-xl p-[clamp(22px,3.4vw,38px)]">
                <span className="kicker">Arama sonuçları</span>
                <h1 className="heading-1 mt-2.5">“{term}”</h1>
                <p className="mt-3 text-[14px] text-slate-600">
                    <span className="font-bold text-slate-900">{results.pagination.total}</span> sonuç
                </p>
            </div>

            <div className="mt-5">
                <ProductGrid products={results.items} priorityCount={4} />
                <ListingPagination
                    pagination={results.pagination}
                    basePath={routes.searchPage}
                    searchParams={searchParams}
                />
            </div>

            <GuideCta term={term} />
        </>
    );
}

export default function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    // Başlık da arama terimine bağlı olduğu için Suspense'in İÇİNDE kalır;
    // dışarıda kalan her şey statik kabuğa girer ve anında görünür.
    return (
        <Container className="pt-[clamp(18px,3vw,30px)]">
            <Suspense
                fallback={(
                    <>
                        <div className="card card-xl h-40 animate-pulse bg-slate-100" />
                        <div className="mt-5 h-96 animate-pulse rounded-[var(--radius-xl)] bg-slate-100" />
                    </>
                )}
            >
                <SearchResults searchParams={searchParams} />
            </Suspense>
        </Container>
    );
}
