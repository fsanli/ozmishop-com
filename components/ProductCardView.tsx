import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import ProductActions from '@/components/product/ProductActions';
import { SPEC_BADGE } from '@/lib/colors';
import { formatPrice } from '@/lib/format';
import { routes } from '@/lib/site';
import type { ProductCard as ProductCardType, SiteSettings } from '@/lib/types';

/**
 * Ürün kartının GÖVDESİ — yönergesiz, senkron, veri okumaz.
 *
 * İki ağaçta da çizilir: sunucuda `ProductCard` (ayarları ve dolu kalbi
 * kendisi okuyup verir) ve istemcide kategori listesinin sonradan eklenen
 * sayfaları (`IncrementalGrid`). İşaretleme TEK yerde durur; iki ayrı kart
 * zamanla ayrışırdı. `ProductActions` ile aynı kural: buraya çerez okuyan ya da
 * `'use client'` gerektiren hiçbir şey girmez.
 *
 * Kart bir <article>; başlıktaki bağlantı `after:absolute after:inset-0` ile tüm
 * karta yayılır, kalp ve sepet düğmeleri kendi yığın bağlamında (z-10) üstte.
 * (Tablo satırındaki stretched-link sorunu burada yok: kap <tr> değil <article>.)
 *
 * `data-product-id`: geri dönüşte kaydırma çapası (S03) — liste o karta döner.
 */
export default function ProductCardView({
    product, priority = false, back = '/', settings, siteUrl, favoriteSlot,
}: {
    product: ProductCardType;
    priority?: boolean;
    back?: string;
    settings: SiteSettings;
    siteUrl: string;
    /** Favori düğmesi; sunucuda dolu/boş durumuyla, istemcide favori listesinden. */
    favoriteSlot: ReactNode;
}) {
    const hasRange = product.hasVariants
        && product.minPrice !== null && product.maxPrice !== null && product.minPrice !== product.maxPrice;

    return (
        <article data-product-id={product.id} className="card card-hover group relative flex h-full flex-col overflow-hidden">
            <div className="relative aspect-square overflow-hidden bg-shelf">
                {product.image ? (
                    <Image
                        src={product.image.url}
                        alt={product.image.alt || product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        // `priority` Next 16'da kalktı; preload yerine öncelikli yükleme (image.md).
                        loading={priority ? 'eager' : undefined}
                        fetchPriority={priority ? 'high' : undefined}
                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-[11px] font-medium text-slate-400">
                        Ürün görseli
                    </div>
                )}

                <div className="absolute left-[11px] top-[11px] flex flex-col items-start gap-1">
                    {product.discountPercent > 0 && <span className="badge badge-accent">%{product.discountPercent} indirim</span>}
                    {product.isNew && product.discountPercent === 0 && <span className="badge badge-teal">Yeni</span>}
                </div>

                {/* Favori görselin ÜSTÜNDE: kart altındaki şeridi tamamen
                    "Sepete ekle"ye bırakıyor. Stretched-link'in üstünde kalması
                    için z-10 — ProductActions'takiyle aynı sebep. */}
                <div className="absolute right-[10px] top-[10px] z-10">
                    {favoriteSlot}
                </div>

                {!product.inStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-paper/70">
                        <span className="badge badge-neutral bg-surface">Tükendi</span>
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-1.5 px-[15px] pb-4 pt-[13px]">
                <span className="brand-line">{product.brand.name}</span>

                <h3 className="line-clamp-2 text-[13.5px] font-medium leading-[1.4] text-slate-900">
                    <Link
                        href={routes.product(product.slug)}
                        className="transition-colors after:absolute after:inset-0 group-hover:text-accent-500"
                    >
                        {product.name}
                    </Link>
                </h3>

                {product.specs && product.specs.length > 0 && (
                    <div className="mt-0.5 flex flex-wrap gap-1.5">
                        {product.specs.map((spec) => (
                            <span key={`${spec.kind}-${spec.label}`} className={`${SPEC_BADGE[spec.kind]} px-[7px] py-0.5 text-[10.5px] font-semibold`}>
                                {spec.label}
                            </span>
                        ))}
                    </div>
                )}

                <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-3">
                        {hasRange ? (
                            <span className="price text-base">
                                {formatPrice(product.minPrice)}
                                <span className="text-[12px] font-normal text-slate-500">&rsquo;den</span>
                            </span>
                        ) : (
                            <>
                                <span className="price text-base">{formatPrice(product.price)}</span>
                                {product.compareAtPrice && product.compareAtPrice > (product.price ?? 0) && (
                                    <span className="price-old text-[12px]">{formatPrice(product.compareAtPrice)}</span>
                                )}
                            </>
                    )}
                </div>

                <ProductActions
                    product={product}
                    settings={settings}
                    siteUrl={siteUrl}
                    back={back}
                    variant="bar"
                    className="mt-2.5"
                />
            </div>
        </article>
    );
}
