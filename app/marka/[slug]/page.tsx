import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import JsonLd from '@/components/JsonLd';
import ListingSkeleton from '@/components/ListingSkeleton';
import ProductListing from '@/components/ProductListing';
import { getBrand, getSitemapData } from '@/lib/api';
import { canonicalFor, shouldIndex, type SearchParams } from '@/lib/listing';
import { redirectIfMoved } from '@/lib/redirects';
import { breadcrumbSchema } from '@/lib/schema';
import { routes, site } from '@/lib/site';

export async function generateStaticParams() {
    try {
        const data = await getSitemapData();
        const slugs = data.brands.slice(0, 50).map((brand) => ({ slug: brand.slug }));
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
    const brand = await getBrand(slug);
    if (!brand) return { title: 'Marka bulunamadı' };

    const title = brand.metaTitle || `${brand.name} ürünleri`;
    const description = brand.metaDescription || brand.description || `${brand.name} markasının ürünleri. ${site.description}`;

    return {
        title,
        description,
        alternates: { canonical: canonicalFor(routes.brand(brand.slug), search) },
        robots: shouldIndex(search) ? undefined : { index: false, follow: true },
    };
}

export default async function BrandPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<SearchParams>;
}) {
    const { slug } = await params;
    const brand = await getBrand(slug);

    if (!brand) {
        await redirectIfMoved(routes.brand(slug));
        notFound();
    }

    const crumbs = [
        { name: 'Markalar', href: routes.brands },
        { name: brand.name, href: routes.brand(brand.slug) },
    ];

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Breadcrumb items={crumbs} />

            <header className="mb-6 flex items-center gap-4">
                {brand.logo && (
                    <div className="card flex h-16 w-28 items-center justify-center p-2">
                        <Image src={brand.logo.url} alt={brand.name} width={100} height={40} className="h-full w-auto object-contain" />
                    </div>
                )}
                <div>
                    <h1 className="heading-1">{brand.name}</h1>
                    <p className="mt-1 text-sm text-slate-500">{brand.activeProductCount} ürün</p>
                </div>
            </header>

            {brand.description && <p className="mb-6 max-w-3xl text-sm text-slate-500">{brand.description}</p>}

            <Suspense fallback={<ListingSkeleton />}>
                <ProductListing
                    basePath={routes.brand(brand.slug)}
                    searchParams={searchParams}
                    baseQuery={{ brand: brand.slug }}
                />
            </Suspense>

            <JsonLd data={breadcrumbSchema([{ name: 'Anasayfa', url: '/' }, ...crumbs.map((crumb) => ({ name: crumb.name, url: crumb.href }))])} />
        </div>
    );
}
