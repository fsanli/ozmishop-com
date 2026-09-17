import Image from 'next/image';
import Link from 'next/link';
import { SPEC_BADGE } from '@/lib/colors';
import { formatPrice } from '@/lib/format';
import { routes } from '@/lib/site';
import type { ProductCard as ProductCardType } from '@/lib/types';

/**
 * Ürün kartı — sıfır istemci JS.
 *
 * v2 tasarımı kartın İÇİNE favori kalbi ve "sepete ekle" kutucuğu koyuyor. Kartın
 * tamamını <a> yapmak bu durumda geçersiz HTML üretir (iç içe etkileşimli öğe) ve
 * klavye gezinmesini bozar. Çözüm: kart bir <article>, başlıktaki bağlantı
 * `after:absolute after:inset-0` ile tüm karta yayılır; kalp ve + kendi
 * yığın bağlamında (z-10) üstte kalır.
 *
 * `priority` yalnızca listenin ilk satırındaki kartlara verilir (LCP).
 */
export default function ProductCard({ product, priority = false }: { product: ProductCardType; priority?: boolean }) {
    const hasRange = product.hasVariants
        && product.minPrice !== null && product.maxPrice !== null && product.minPrice !== product.maxPrice;

    return (
        <article className="card card-hover group relative flex flex-col overflow-hidden">
            <div className="relative aspect-square overflow-hidden bg-shelf">
                {product.image ? (
                    <Image
                        src={product.image.url}
                        alt={product.image.alt || product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        priority={priority}
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

                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <div className="flex flex-wrap items-baseline gap-2">
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
                </div>
            </div>
        </article>
    );
}
