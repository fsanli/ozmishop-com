'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { formatPrice } from '@/lib/format';
import type { ProductDetail, ProductVariant } from '@/lib/types';

/**
 * Varyant seçici ve satın alma paneli.
 *
 * N eksenli jenerik sistem: eksenler ana ürüne eklenen varyant başlıklarıdır
 * (Renk, Boyut…). Var olmayan kombinasyonlar gizlenmez, PASİFLEŞTİRİLİR — kullanıcı
 * neyin tükendiğini görür ve çıkmaz bir seçim yapamaz.
 *
 * Faz 1'de "Sepete Ekle" görseldir; sepet API'si Faz 2'de bağlanacak.
 */
export default function ProductPurchasePanel({ product }: { product: ProductDetail }) {
    const defaultVariant = product.variants.find((variant) => variant.isDefault) ?? product.variants[0];

    const [selection, setSelection] = useState<Record<number, number>>(() =>
        Object.fromEntries((defaultVariant?.options ?? []).map((option) => [option.variantKeyId, option.variantValueId])),
    );

    const selectedVariant: ProductVariant | undefined = useMemo(() => {
        if (!product.variantAxes.length) return defaultVariant;
        return product.variants.find((variant) =>
            variant.options.every((option) => selection[option.variantKeyId] === option.variantValueId),
        );
    }, [product, selection, defaultVariant]);

    /** Bir değer, diğer eksenlerdeki mevcut seçimlerle birlikte var olan bir varyanta denk geliyor mu? */
    const isAvailable = (axisId: number, valueId: number) =>
        product.variants.some((variant) =>
            variant.options.every((option) =>
                option.variantKeyId === axisId
                    ? option.variantValueId === valueId
                    : selection[option.variantKeyId] === undefined || selection[option.variantKeyId] === option.variantValueId,
            ),
        );

    const inStock = selectedVariant ? selectedVariant.inStock : product.inStock;
    const price = selectedVariant?.price ?? product.price;
    const compareAt = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
    const discount = compareAt && price && compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0;

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-2xl font-bold tabular-nums text-slate-900">{formatPrice(price)}</span>
                {discount > 0 && (
                    <>
                        <span className="price-old text-base">{formatPrice(compareAt)}</span>
                        <span className="badge badge-accent">%{discount} indirim</span>
                    </>
                )}
            </div>

            {product.variantAxes.map((axis) => (
                <div key={axis.id}>
                    <div className="mb-2 flex items-baseline gap-2">
                        <span className="text-sm font-medium text-slate-900">{axis.name}</span>
                        <span className="text-xs text-slate-400">
                            {axis.values.find((value) => value.id === selection[axis.id])?.name ?? 'Seçiniz'}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {axis.values.map((value) => {
                            const active = selection[axis.id] === value.id;
                            const available = isAvailable(axis.id, value.id);

                            if (axis.inputType === 'color') {
                                return (
                                    <button
                                        key={value.id}
                                        type="button"
                                        onClick={() => setSelection((current) => ({ ...current, [axis.id]: value.id }))}
                                        title={available ? value.name : `${value.name} — bu kombinasyon yok`}
                                        aria-label={value.name}
                                        aria-pressed={active}
                                        className={`relative h-9 w-9 rounded-full border-2 transition ${
                                            active ? 'border-brand-500 ring-2 ring-brand-200' : 'border-slate-200 hover:border-slate-300'
                                        } ${available ? '' : 'cursor-not-allowed opacity-40'}`}
                                        style={{ backgroundColor: value.hexCode || '#e2e2e2' }}
                                    >
                                        {!available && <span aria-hidden className="absolute inset-0 flex items-center justify-center text-xs text-white">✕</span>}
                                    </button>
                                );
                            }

                            return (
                                <button
                                    key={value.id}
                                    type="button"
                                    onClick={() => setSelection((current) => ({ ...current, [axis.id]: value.id }))}
                                    aria-pressed={active}
                                    className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                                        active
                                            ? 'border-brand-500 bg-brand-50 font-medium text-brand-700'
                                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                    } ${available ? '' : 'cursor-not-allowed text-slate-400 line-through'}`}
                                >
                                    {value.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {selectedVariant?.images?.[0] && (
                <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-slate-100">
                    <Image src={selectedVariant.images[0].url} alt={selectedVariant.name} fill sizes="80px" className="object-cover" />
                </div>
            )}

            <div className="flex items-center gap-2 text-sm">
                {inStock ? (
                    <span className="badge badge-success">Stokta</span>
                ) : (
                    <span className="badge badge-neutral">Tükendi</span>
                )}
                {selectedVariant && <span className="text-xs text-slate-400">SKU: {selectedVariant.sku}</span>}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" disabled={!inStock || !selectedVariant} className="btn-primary btn-lg flex-1">
                    {inStock ? 'Sepete Ekle' : 'Tükendi'}
                </button>
            </div>

            {!selectedVariant && product.variantAxes.length > 0 && (
                <p className="text-xs text-slate-500">Bu kombinasyon mevcut değil; lütfen başka bir seçim yapın.</p>
            )}

            <ul className="space-y-1 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <li>Gizli paketleme — kargo etiketinde içerik bilgisi yer almaz.</li>
                <li>Aynı gün kargo — 16:00’ya kadar verilen siparişlerde.</li>
                <li>Ambalajı açılmamış ürünlerde 14 gün iade.</li>
            </ul>
        </div>
    );
}
