import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import Container from '@/components/Container';
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
        <Container className="pt-[clamp(18px,3vw,30px)]">
            <Breadcrumb items={crumbs} />

            {/* Koyu marka hero'su: sol kenarında üç renkli degrade şerit. */}
            <header className="block-dark relative mt-4 overflow-hidden p-[clamp(26px,4vw,52px)]">
                <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-[3px] bg-[linear-gradient(180deg,#9b1f47,#6b3fa0_50%,#10726b)]"
                />
                <div className="flex flex-wrap items-end gap-[clamp(18px,3vw,44px)]">
                    <div className="min-w-0 flex-[999_1_320px]">
                        <span className="kicker text-on-dark-berry">Marka</span>
                        {brand.logo && (
                            <div className="mt-4 flex h-12 w-28 items-center">
                                <Image src={brand.logo.url} alt={brand.name} width={112} height={48} className="h-full w-auto object-contain" />
                            </div>
                        )}
                        <h1 className="mt-3 font-display font-bold leading-[1.05] tracking-[-0.05em] text-[clamp(44px,8vw,96px)]">
                            {brand.name}
                        </h1>
                        {brand.description && (
                            <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-on-dark/62">{brand.description}</p>
                        )}
                    </div>

                    {/* Üç kutucuk, her biri üstünde 3px renkli şerit. */}
                    <div className="flex min-w-0 flex-[1_1_240px] flex-wrap gap-2.5">
                        {[
                            { label: 'Ürün', value: String(brand.activeProductCount), edge: 'border-t-on-dark-berry' },
                            { label: 'Toplam', value: String(brand.productCount), edge: 'border-t-on-dark-amber' },
                            { label: 'Orijinal', value: '%100', edge: 'border-t-on-dark-teal' },
                        ].map((stat) => (
                            <div key={stat.label} className={`flex-[1_1_96px] rounded-[14px] border-t-[3px] bg-on-dark/[0.07] px-4 py-3 ${stat.edge}`}>
                                <div className="text-[11.5px] font-bold text-on-dark/55">{stat.label}</div>
                                <div className="price mt-1 text-[22px] text-on-dark">{stat.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            <div className="mt-5">
            <Suspense fallback={<ListingSkeleton />}>
                <ProductListing
                    basePath={routes.brand(brand.slug)}
                    searchParams={searchParams}
                    baseQuery={{ brand: brand.slug }}
                />
            </Suspense>
            </div>

            <JsonLd data={breadcrumbSchema([{ name: 'Anasayfa', url: '/' }, ...crumbs.map((crumb) => ({ name: crumb.name, url: crumb.href }))])} />
        </Container>
    );
}
