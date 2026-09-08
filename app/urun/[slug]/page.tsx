import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import JsonLd from '@/components/JsonLd';
import ProductGrid from '@/components/ProductGrid';
import { getProduct, getSitemapData } from '@/lib/api';
import { redirectIfMoved } from '@/lib/redirects';
import { breadcrumbSchema, productSchema } from '@/lib/schema';
import { routes, site } from '@/lib/site';
import ProductGallery from './ProductGallery';
import ProductPurchasePanel from './ProductPurchasePanel';
import ProductViewPing from './ProductViewPing';

/**
 * Cache Components ile dinamik rotalarda `generateStaticParams` en az bir örnek
 * döndürmelidir. API kapalıysa yer tutucu döner; o adres istendiğinde ürün
 * bulunamaz ve notFound() çalışır.
 */
export async function generateStaticParams() {
    try {
        const data = await getSitemapData();
        const slugs = data.products.slice(0, 50).map((product) => ({ slug: product.slug }));
        return slugs.length ? slugs : [{ slug: '__ornek__' }];
    } catch {
        return [{ slug: '__ornek__' }];
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

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const product = await getProduct(slug);

    if (!product) {
        // Adı değişmiş bir ürün olabilir: 404 vermeden önce slug geçmişine bakılır.
        await redirectIfMoved(routes.product(slug));
        notFound();
    }

    const crumbs = [
        ...product.breadcrumb.map((item) => ({ name: item.name, href: routes.category(item.slug) })),
        { name: product.name, href: routes.product(product.slug) },
    ];

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Breadcrumb items={crumbs} />

            <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
                <ProductGallery images={product.images} name={product.name} />

                <div>
                    <Link href={routes.brand(product.brand.slug)} className="text-xs uppercase tracking-wide text-slate-400 hover:text-brand-600">
                        {product.brand.name}
                    </Link>
                    <h1 className="heading-1 mt-1">{product.name}</h1>
                    {product.shortDescription && <p className="mt-2 text-sm text-slate-600">{product.shortDescription}</p>}

                    <div className="mt-6">
                        <ProductPurchasePanel product={product} />
                    </div>
                </div>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <h2 className="heading-3 mb-3">Ürün açıklaması</h2>
                    {product.description ? (
                        <div className="card prose-content p-5" dangerouslySetInnerHTML={{ __html: product.description }} />
                    ) : (
                        <p className="text-sm text-slate-500">Bu ürün için açıklama girilmemiş.</p>
                    )}
                </div>

                {product.attributes.length > 0 && (
                    <div>
                        <h2 className="heading-3 mb-3">Özellikler</h2>
                        <dl className="card divide-y divide-slate-100 text-sm">
                            {product.attributes.map((attribute) => (
                                <div key={attribute.id} className="flex justify-between gap-4 px-4 py-2.5">
                                    <dt className="text-slate-500">{attribute.name}</dt>
                                    <dd className="text-right font-medium text-slate-900">{attribute.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                )}
            </div>

            {product.related.length > 0 && (
                <section className="mt-12">
                    <h2 className="heading-2 mb-5">Benzer ürünler</h2>
                    <ProductGrid products={product.related} />
                </section>
            )}

            <ProductViewPing slug={product.slug} />
            <JsonLd
                data={[
                    productSchema(product),
                    breadcrumbSchema([{ name: 'Anasayfa', url: '/' }, ...crumbs.map((crumb) => ({ name: crumb.name, url: crumb.href }))]),
                ]}
            />
        </div>
    );
}
