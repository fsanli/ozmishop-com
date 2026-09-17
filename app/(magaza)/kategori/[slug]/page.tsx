import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import Container from '@/components/Container';
import { colorsOf } from '@/lib/colors';
import JsonLd from '@/components/JsonLd';
import ListingSkeleton from '@/components/ListingSkeleton';
import ProductListing from '@/components/ProductListing';
import { getCategory, getSitemapData } from '@/lib/api';
import { canonicalFor, shouldIndex, type SearchParams } from '@/lib/listing';
import { redirectIfMoved } from '@/lib/redirects';
import { breadcrumbSchema, collectionSchema } from '@/lib/schema';
import { PLACEHOLDER_SLUG, routes, site } from '@/lib/site';

export async function generateStaticParams() {
    try {
        const data = await getSitemapData();
        const slugs = data.categories.slice(0, 50).map((category) => ({ slug: category.slug }));
        return slugs.length ? slugs : [{ slug: PLACEHOLDER_SLUG }];
    } catch {
        return [{ slug: PLACEHOLDER_SLUG }];
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
    const colors = colorsOf(category);

    return (
        <Container className="pt-[clamp(18px,3vw,30px)]">
            <Breadcrumb items={crumbs} />

            {/* Kategori başlık kartı: solda başlık, sağda alt kategori hapları. */}
            <div className="card card-xl mt-4 p-[clamp(22px,3.4vw,38px)]">
                <div className="flex flex-wrap items-start gap-[clamp(16px,3vw,44px)]">
                    <div className="min-w-0 flex-[999_1_320px]">
                        <span className={`kicker ${colors.ink}`}>Kategori</span>
                        <h1 className="heading-1 mt-2.5">{category.name}</h1>
                        {category.description && (
                            <p className="mt-3.5 max-w-[62ch] text-[15px] leading-relaxed text-slate-600">{category.description}</p>
                        )}
                    </div>

                    {category.children.length > 0 && (
                        <div className="flex min-w-0 flex-[1_1_260px] flex-wrap content-start gap-2">
                            {category.children.map((child) => (
                                <Link
                                    key={child.id}
                                    href={routes.category(child.slug)}
                                    className="btn-pill border border-slate-900/12 px-3.5 py-2 text-[12.5px] transition-colors hover:border-slate-900 hover:bg-accent-200"
                                >
                                    {child.name}
                                    <span className="ml-1.5 text-slate-500">{child.activeProductCount}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {category.banner && (
                <div className="relative mt-4 aspect-[16/5] overflow-hidden rounded-[var(--radius-xl)] bg-slate-100">
                    <Image src={category.banner.url} alt={category.banner.alt || category.name} fill sizes="100vw" priority className="object-cover" />
                </div>
            )}

            {/* Yönlendirmeli şerit: emin olmayan ziyaretçiyi rehbere taşır. */}
            <div className="block-dark-soft mt-4 flex flex-wrap items-center gap-3 px-[clamp(18px,2.4vw,26px)] py-4">
                <span className="inline-flex items-center gap-2 text-[13px] font-bold">
                    <span className="dot bg-on-dark-berry" />
                    Emin değil misin?
                </span>
                <p className="min-w-0 flex-1 text-[13px] text-on-dark/60">
                    Dört soruda sana uygun üç ürünü çıkaralım.
                </p>
                <Link href={routes.guide} className="btn-primary btn-sm shrink-0">Başlangıç rehberi</Link>
            </div>

            <div className="mt-5">

            {/* Liste searchParams okur: statik kabuk hemen görünür, ürünler akar. */}
            <Suspense fallback={<ListingSkeleton />}>
                <ProductListing
                    basePath={routes.category(category.slug)}
                    searchParams={searchParams}
                    baseQuery={{ category: category.slug }}
                />
            </Suspense>
            </div>

            <JsonLd
                data={[
                    collectionSchema(category),
                    breadcrumbSchema([{ name: 'Anasayfa', url: '/' }, ...crumbs.map((crumb) => ({ name: crumb.name, url: crumb.href }))]),
                ]}
            />
        </Container>
    );
}
