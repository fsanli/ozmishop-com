'use client';

import SubmitButton from '@/components/form/SubmitButton';
import { addToCartAction } from '@/app/(magaza)/sepet/actions';

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
 * "Sepete ekle" gerçek bir <form>: seçili varyantın id'si sunucu aksiyonuna
 * gider. Bekleme durumunu SubmitButton gösterir, başka istemci durumu yok.
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
                        {/* Seçili değer GERÇEK içerik: slate-400 yalnız "Seçiniz"
                            yer tutucusunda kalabilir (bkz. globals.css kontrast notu). */}
                        <span className={selection[axis.id] ? 'text-xs text-slate-600' : 'text-xs text-slate-400'}>
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

            <div className="flex flex-wrap items-center gap-2.5">
                {inStock ? (
                    <span className="badge badge-teal">
                        <span className="dot-lg dot bg-teal-dot" />
                        Stokta
                        {selectedVariant?.trackStock && selectedVariant.stockQuantity <= 10
                            ? ` — ${selectedVariant.stockQuantity} adet kaldı`
                            : ''}
                    </span>
                ) : (
                    <span className="badge badge-neutral">Tükendi</span>
                )}
                {selectedVariant && <span className="text-[12px] text-slate-600">SKU: {selectedVariant.sku}</span>}
            </div>

            <form action={addToCartAction} className="flex flex-wrap items-stretch gap-2.5">
                <input type="hidden" name="productId" value={selectedVariant?.id ?? ''} />
                <input type="hidden" name="back" value={`/urun/${product.slug}`} />

                {/* Adet: gizli alan + iki düğme değil, düz bir sayı alanı.
                    Ürün sayfasında adet nadiren değişir; stepper sepette. */}
                <label className="flex h-[54px] items-center gap-1 rounded-[14px] border border-slate-900/13 px-2">
                    <span className="sr-only">Adet</span>
                    <input
                        name="quantity"
                        type="number"
                        min={1}
                        max={selectedVariant?.trackStock ? selectedVariant.stockQuantity : 50}
                        defaultValue={1}
                        className="w-12 bg-transparent text-center text-[14px] font-bold outline-none"
                    />
                </label>

                <SubmitButton
                    className="btn-primary min-h-[54px] flex-1 justify-center rounded-[14px] text-base"
                    pendingLabel="Ekleniyor…"
                    disabled={!inStock || !selectedVariant}
                >
                    {inStock ? 'Sepete ekle' : 'Tükendi'}
                </SubmitButton>
            </form>

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
