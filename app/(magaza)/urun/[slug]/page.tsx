import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import Container from '@/components/Container';
import PrivacyPanel from '@/components/privacy/PrivacyPanel';
import FitNotes from './FitNotes';
import ProductNotes from './ProductNotes';
import Reviews from './Reviews';
import TechSpecs from './TechSpecs';
import JsonLd from '@/components/JsonLd';
import ProductGrid from '@/components/ProductGrid';
import { getProduct, getReviews, getSettings, getSitemapData } from '@/lib/api';
import { one, type SearchParams } from '@/lib/listing';
import { redirectIfMoved } from '@/lib/redirects';
import { breadcrumbSchema, productSchema } from '@/lib/schema';
import { PLACEHOLDER_SLUG, routes, site } from '@/lib/site';
import { productWhatsappLink } from '@/lib/whatsapp';
import ProductGallery from './ProductGallery';
import ProductPurchasePanel from './ProductPurchasePanel';
import ViewPing from '@/components/ViewPing';

/**
 * Cache Components ile dinamik rotalarda `generateStaticParams` en az bir örnek
 * döndürmelidir. API kapalıysa yer tutucu döner; o adres istendiğinde ürün
 * bulunamaz ve notFound() çalışır.
 */
export async function generateStaticParams() {
    try {
        const data = await getSitemapData();
        const slugs = data.products.slice(0, 50).map((product) => ({ slug: product.slug }));
        return slugs.length ? slugs : [{ slug: PLACEHOLDER_SLUG }];
    } catch {
        return [{ slug: PLACEHOLDER_SLUG }];
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const product = await getProduct(slug);
    if (!product) return { title: 'Ürün bulunamadı' };

    const title = product.metaTitle || product.name;
    const description = product.metaDescription || product.shortDescription || site.description;

    return {
        title,
        description,
        alternates: { canonical: routes.product(product.slug) },
        openGraph: {
            type: 'website',
            title,
            description,
            url: `${site.url}${routes.product(product.slug)}`,
            images: product.image ? [{ url: product.image.url, alt: product.image.alt || product.name }] : undefined,
        },
    };
}

export default async function ProductPage({
    params, searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<SearchParams>;
}) {
    const { slug } = await params;
    const product = await getProduct(slug);

    if (!product) {
        // Adı değişmiş bir ürün olabilir: 404 vermeden önce slug geçmişine bakılır.
        await redirectIfMoved(routes.product(slug));
        notFound();
    }

    // getReviews önbellekli: Reviews bloğu da aynı veriyi okuyor, ikinci çağrı
    // ağ isteği değil. aggregateRating yalnız gerçekten yorum varken basılır.
    const reviews = await getReviews(slug);

    // WhatsApp bağlantısı SUNUCUDA kuruluyor: mesaj kalıbı ayarlardan geliyor
    // ve satın alma paneli bir istemci bileşeni — ayarları oraya taşımak,
    // her ürün sayfasına gereksiz bir istemci okuması eklerdi.
    const whatsappUrl = productWhatsappLink(await getSettings(), product, site.url);

    const crumbs = [
        ...product.breadcrumb.map((item) => ({ name: item.name, href: routes.category(item.slug) })),
        { name: product.name, href: routes.product(product.slug) },
    ];

    return (
        <Container className="pt-[clamp(18px,3vw,30px)]">
            <Breadcrumb items={crumbs} />

            <div className="mt-4 flex flex-wrap items-start gap-[clamp(16px,2.6vw,40px)]">
                <div className="min-w-0 flex-[1_1_380px]">
                    <ProductGallery images={product.images} name={product.name} />
                </div>

                <div className="min-w-0 flex-[1_1_380px]">
                    <Link
                        href={routes.brand(product.brand.slug)}
                        className="brand-line tracking-[0.06em] text-accent-500 transition-colors hover:text-accent-600"
                    >
                        {product.brand.name}
                    </Link>
                    <h1 className="heading-1 mt-2">{product.name}</h1>
                    {product.shortDescription && (
                        <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-slate-600">{product.shortDescription}</p>
                    )}

                    <div className="mt-6">
                        <ProductPurchasePanel product={product} whatsappUrl={whatsappUrl} />
                    </div>

                    <PrivacyPanel className="mt-5" />
                </div>
            </div>

            <TechSpecs sheet={product.specSheet} />
            <ProductNotes product={product} />

            <section className="flex flex-wrap items-start gap-[clamp(18px,3vw,44px)] pt-[clamp(30px,4vw,54px)]">
                <div className="min-w-0 flex-[999_1_340px]">
                    <h2 className="heading-2">Ürün açıklaması</h2>
                    {product.description ? (
                        <div className="prose-content mt-4 max-w-[68ch]" dangerouslySetInnerHTML={{ __html: product.description }} />
                    ) : (
                        <p className="mt-4 text-sm text-slate-600">Bu ürün için açıklama girilmemiş.</p>
                    )}

                    {product.boxContents && product.boxContents.length > 0 && (
                        <>
                            <h3 className="heading-3 mt-8">Kutunun içinde ne var?</h3>
                            <ul className="mt-3 space-y-2">
                                {product.boxContents.map((item) => (
                                    <li key={item} className="flex items-start gap-2.5 text-[14.5px] leading-relaxed">
                                        <span className="dot-lg dot mt-2 bg-slate-300" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>

                <div className="min-w-0 flex-[1_1_300px] sm:max-w-[420px]">
                    <FitNotes notes={product.fitNotes} />
                </div>
            </section>

            {/* Yorumlar kendi Suspense'inde: yavaş dönse bile ürün bilgisi ve
                sepete ekle paneli bekletilmez. */}
            <Suspense fallback={<ReviewsSkeleton />}>
                <ReviewsSlot slug={product.slug} searchParams={searchParams} />
            </Suspense>

            {product.related.length > 0 && (
                <section className="pt-[clamp(30px,4vw,54px)]">
                    <h2 className="heading-2 mb-5">Bunları da inceleyenler oldu</h2>
                    <ProductGrid products={product.related} />
                </section>
            )}

            <ViewPing slug={product.slug} kind="product" />
            <JsonLd
                data={[
                    productSchema(product, reviews),
                    breadcrumbSchema([{ name: 'Anasayfa', url: '/' }, ...crumbs.map((crumb) => ({ name: crumb.name, url: crumb.href }))]),
                ]}
            />
        </Container>
    );
}

/**
 * `searchParams` Suspense sınırının İÇİNDE await edilir: dışarıda okunursa
 * ürün sayfasının statik kabuğu kaybolur ve her ürün istek zamanına düşer.
 */
async function ReviewsSlot({ slug, searchParams }: { slug: string; searchParams: Promise<SearchParams> }) {
    const params = await searchParams;
    return <Reviews slug={slug} page={Number(one(params.yorum)) || 1} />;
}

function ReviewsSkeleton() {
    return (
        <section className="pt-[clamp(30px,4vw,54px)]">
            <div className="h-7 w-52 animate-pulse rounded bg-slate-100" />
            <div className="mt-5 flex flex-wrap items-start gap-[clamp(18px,3vw,44px)]">
                <div className="card min-w-0 flex-[1_1_240px] animate-pulse bg-slate-100 sm:max-w-[300px]">
                    <div className="h-48" />
                </div>
                <div className="min-w-0 flex-[999_1_400px] space-y-3">
                    {Array.from({ length: 2 }).map((_, index) => (
                        <div key={index} className="card h-28 animate-pulse bg-slate-100" />
                    ))}
                </div>
            </div>
        </section>
    );
}
