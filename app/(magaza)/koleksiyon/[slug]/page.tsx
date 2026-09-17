import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import EmptyState from '@/components/EmptyState';
import JsonLd from '@/components/JsonLd';
import ProductGrid from '@/components/ProductGrid';
import { getProductGroup, getSitemapData } from '@/lib/api';
import { one, pageHref, type SearchParams } from '@/lib/listing';
import { redirectIfMoved } from '@/lib/redirects';
import { breadcrumbSchema, itemListSchema } from '@/lib/schema';
import { routes, site } from '@/lib/site';
import { Suspense } from 'react';

export async function generateStaticParams() {
    try {
        const data = await getSitemapData();
        const slugs = data.groups.slice(0, 50).map((group) => ({ slug: group.slug }));
        return slugs.length ? slugs : [{ slug: '__ornek__' }];
    } catch {
        return [{ slug: '__ornek__' }];
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const group = await getProductGroup(slug, { pageSize: 1 });
    if (!group) return { title: 'Koleksiyon bulunamadı' };

    const title = group.metaTitle || group.name;
    const description = group.metaDescription || group.description || `${group.name} — ${site.description}`;

    return { title, description, alternates: { canonical: routes.group(group.slug) } };
}

/** Koleksiyon ürünleri sayfa parametresine bağlı olduğu için ayrı bir bileşende akar. */
async function GroupProducts({ slug, searchParams: searchParamsPromise }: { slug: string; searchParams: Promise<SearchParams> }) {
    const searchParams = await searchParamsPromise;
    const page = Number(one(searchParams.sayfa) ?? 1) || 1;
    const group = await getProductGroup(slug, { page, pageSize: 24 });
    if (!group) notFound();

    const items = group.items ?? [];
    const pagination = group.pagination;

    if (!items.length) {
        return <EmptyState title="Bu koleksiyonda şu an ürün yok" description="Kısa süre içinde yeni ürünler eklenecek." />;
    }

    return (
        <>
            <ProductGrid products={items} priorityCount={4} />
            {pagination && pagination.totalPages > 1 && (
                <nav aria-label="Sayfalama" className="mt-8 flex items-center justify-center gap-3">
                    {pagination.page > 1 ? (
                        <Link rel="prev" href={pageHref(routes.group(slug), searchParams, pagination.page - 1)} className="btn-secondary btn-sm">← Önceki</Link>
                    ) : (
                        <span className="btn-secondary btn-sm opacity-40">← Önceki</span>
                    )}
                    <span className="text-sm text-slate-500">Sayfa {pagination.page} / {pagination.totalPages}</span>
                    {pagination.page < pagination.totalPages ? (
                        <Link rel="next" href={pageHref(routes.group(slug), searchParams, pagination.page + 1)} className="btn-secondary btn-sm">Sonraki →</Link>
                    ) : (
                        <span className="btn-secondary btn-sm opacity-40">Sonraki →</span>
                    )}
                </nav>
            )}
            <JsonLd data={itemListSchema(items, { page: pagination?.page, pageSize: pagination?.pageSize })} />
        </>
    );
}

export default async function GroupPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<SearchParams>;
}) {
    const { slug } = await params;
    const group = await getProductGroup(slug, { pageSize: 1 });

    if (!group) {
        await redirectIfMoved(routes.group(slug));
        notFound();
    }

    const crumbs = [{ name: group.name, href: routes.group(group.slug) }];

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Breadcrumb items={crumbs} />
            <header className="mb-6">
                <h1 className="heading-1">{group.name}</h1>
                {group.description && <p className="mt-2 max-w-3xl text-sm text-slate-500">{group.description}</p>}
            </header>

            <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-slate-100" />}>
                <GroupProducts slug={group.slug} searchParams={searchParams} />
            </Suspense>

            <JsonLd data={breadcrumbSchema([{ name: 'Anasayfa', url: '/' }, ...crumbs.map((crumb) => ({ name: crumb.name, url: crumb.href }))])} />
        </div>
    );
}
