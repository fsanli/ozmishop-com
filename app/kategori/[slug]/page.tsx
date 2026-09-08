import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import JsonLd from '@/components/JsonLd';
import ListingSkeleton from '@/components/ListingSkeleton';
import ProductListing from '@/components/ProductListing';
import { getCategory, getSitemapData } from '@/lib/api';
import { canonicalFor, shouldIndex, type SearchParams } from '@/lib/listing';
import { redirectIfMoved } from '@/lib/redirects';
import { breadcrumbSchema, collectionSchema } from '@/lib/schema';
import { routes, site } from '@/lib/site';

export async function generateStaticParams() {
    try {
        const data = await getSitemapData();
        const slugs = data.categories.slice(0, 50).map((category) => ({ slug: category.slug }));
        return slugs.length ? slugs : [{ slug: '__ornek__' }];
    } catch {
        return [{ slug: '__ornek__' }];
    }
}

export async function generateMetadata({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
    const [{ slug }, search] = await Promise.all([params, searchParams]);
    const category = await getCategory(slug);
    if (!category) return { title: 'Kategori bulunamadı' };

    const title = category.metaTitle || category.name;
    const description = category.metaDescription || category.description || `${category.name} kategorisindeki ürünler. ${site.description}`;
    const indexable = shouldIndex(search);

    return {
        title,
        description,
        alternates: { canonical: canonicalFor(routes.category(category.slug), search) },
        robots: indexable ? undefined : { index: false, follow: true },
        openGraph: { title, description, url: `${site.url}${routes.category(category.slug)}` },
    };
}

export default async function CategoryPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<SearchParams>;
}) {
    const { slug } = await params;
    const category = await getCategory(slug);

    if (!category) {
        await redirectIfMoved(routes.category(slug));
        notFound();
    }

    const crumbs = category.breadcrumb.map((item) => ({ name: item.name, href: routes.category(item.slug) }));

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Breadcrumb items={crumbs} />

            {category.banner && (
                <div className="relative mb-6 aspect-[16/5] overflow-hidden rounded-xl bg-slate-100">
                    <Image src={category.banner.url} alt={category.banner.alt || category.name} fill sizes="100vw" priority className="object-cover" />
                </div>
            )}

            <header className="mb-6">
                <h1 className="heading-1">{category.name}</h1>
                {category.description && <p className="mt-2 max-w-3xl text-sm text-slate-500">{category.description}</p>}
            </header>

            {category.children.length > 0 && (
                <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
                    {category.children.map((child) => (
                        <Link key={child.id} href={routes.category(child.slug)} className="btn-soft btn-sm whitespace-nowrap">
                            {child.name}
                            <span className="text-brand-300">({child.activeProductCount})</span>
                        </Link>
                    ))}
                </div>
            )}

            {/* Liste searchParams okur: statik kabuk hemen görünür, ürünler akar. */}
            <Suspense fallback={<ListingSkeleton />}>
                <ProductListing
                    basePath={routes.category(category.slug)}
                    searchParams={searchParams}
                    baseQuery={{ category: category.slug }}
                />
            </Suspense>

            <JsonLd
                data={[
                    collectionSchema(category),
                    breadcrumbSchema([{ name: 'Anasayfa', url: '/' }, ...crumbs.map((crumb) => ({ name: crumb.name, url: crumb.href }))]),
                ]}
            />
        </div>
    );
}
