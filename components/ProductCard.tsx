import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import { routes } from '@/lib/site';
import type { ProductCard as ProductCardType } from '@/lib/types';

/**
 * Ürün kartı — sıfır istemci JS. Görsel, ad, marka, fiyat ve rozetler.
 * `priority` yalnızca listenin ilk satırındaki kartlara verilir (LCP).
 */
export default function ProductCard({ product, priority = false }: { product: ProductCardType; priority?: boolean }) {
    const hasRange = product.hasVariants && product.minPrice !== null && product.maxPrice !== null && product.minPrice !== product.maxPrice;

    return (
        <Link
            href={routes.product(product.slug)}
            className="card card-hover group flex flex-col overflow-hidden"
        >
            <div className="relative aspect-square overflow-hidden bg-slate-50">
                {product.image ? (
                    <Image
                        src={product.image.url}
                        alt={product.image.alt || product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        priority={priority}
                        className="object-cover transition duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">Görsel yok</div>
                )}

                <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
                    {product.discountPercent > 0 && <span className="badge badge-accent">%{product.discountPercent} indirim</span>}
                    {product.isNew && product.discountPercent === 0 && <span className="badge badge-brand">Yeni</span>}
                </div>

                {!product.inStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                        <span className="badge badge-neutral">Tükendi</span>
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-1 p-3">
                <span className="text-xs uppercase tracking-wide text-slate-400">{product.brand.name}</span>
                <h3 className="line-clamp-2 text-sm font-medium text-slate-900 group-hover:text-brand-600">{product.name}</h3>
                <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-2">
                    {hasRange ? (
                        <span className="price">{formatPrice(product.minPrice)} <span className="text-xs font-normal text-slate-500">&rsquo;den</span></span>
                    ) : (
                        <>
                            <span className="price">{formatPrice(product.price)}</span>
                            {product.compareAtPrice && product.compareAtPrice > (product.price ?? 0) && (
                                <span className="price-old">{formatPrice(product.compareAtPrice)}</span>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Link>
    );
}
