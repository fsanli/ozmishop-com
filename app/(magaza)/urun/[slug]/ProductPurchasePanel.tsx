'use client';

import SubmitButton from '@/components/form/SubmitButton';
import { WhatsappIcon } from '@/components/icons';
import { addToCartAction } from '@/app/(magaza)/sepet/actions';

import Image from 'next/image';
import { useEffect, useSyncExternalStore } from 'react';
import { track } from '@/lib/analytics/gtag';
import { CURRENCY, fromDetail } from '@/lib/analytics/items';
import { createPortal } from 'react-dom';
import { formatPrice } from '@/lib/format';
import { productWhatsappLink, type WhatsappSettings } from '@/lib/whatsapp';
import type { ProductDetail, ProductVariant } from '@/lib/types';
import { useVariantSelection } from './VariantSelection';

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
/**
 * Portal'ın DOM'a ihtiyacı var; sunucuda `false`, istemcide `true`.
 * `useState`+effect yerine harici depo: effect içinde setState zincirleme
 * render üretiyor ve React lint'i reddediyor.
 */
const subscribeNever = () => () => {};

/** Tailwind v4 `h-${n}` üretemez: iki ölçü de tam sınıf adı olarak duruyor. */
const BUY_SIZES = {
    lg: { box: 'min-h-[54px]' },
    sm: { box: 'min-h-[48px]' },
} as const;

export default function ProductPurchasePanel({
    product, whatsapp, siteUrl, returnDays, shippingLine,
}: {
    product: ProductDetail;
    /** Numara ve mesaj kalıbı (ayarlardan); bağlantı seçili varyantla burada kurulur. */
    whatsapp: WhatsappSettings;
    siteUrl: string;
    /** `icerik.iade_suresi_gun` — iade süresi tek yerden okunur. */
    returnDays: number;
    /** `kargo.sureler` — API'de ayarlardan kurulan kargo cümlesi; boşsa satır yok. */
    shippingLine?: string;
}) {
    const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);

    // Seçim burada DEĞİL, sayfanın sağlayıcısında duruyor: teknik künye de
    // varyanta göre değiştiği için ikisinin ortak bir kaynağa bakması gerekiyor.
    const { selection, select, selectedVariantId } = useVariantSelection();
    const selectedVariant: ProductVariant | undefined = product.variants.find((variant) => variant.id === selectedVariantId);

    /** Bir değer, diğer eksenlerdeki mevcut seçimlerle birlikte var olan bir varyanta denk geliyor mu? */
    const isAvailable = (axisId: number, valueId: number) =>
        product.variants.some((variant) =>
            variant.options.every((option) =>
                option.variantKeyId === axisId
                    ? option.variantValueId === valueId
                    : selection[option.variantKeyId] === undefined || selection[option.variantKeyId] === option.variantValueId,
            ),
        );

    // view_item: ürün açılınca ve varyant değişince (fiyat/etiket değişir).
    // Bağımlılık KİMLİK, nesne değil: sepete eklemedeki refresh() ürünü yeni bir
    // nesneyle yeniden gönderiyor ve olay ikinci kez sayılıyordu.
    const viewedKey = `${product.id}:${selectedVariant?.id ?? ''}`;
    useEffect(() => {
        const item = fromDetail(product, selectedVariant);
        track('view_item', { currency: CURRENCY, value: item.price ?? 0, items: [item] });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewedKey]);

    const inStock = selectedVariant ? selectedVariant.inStock : product.inStock;
    const price = selectedVariant?.price ?? product.price;
    const compareAt = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
    const discount = compareAt && price && compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0;

    // Numara tanımsızsa `null` ve buton HİÇ çizilmez — tıklanınca bir şey
    // yapmayan bir buton, butonsuzluktan kötü. Varyant yalnızca seçim eksenli
    // üründe mesaja girer; tek varyantlı üründe "Seçim:" satırı gürültü olurdu.
    const whatsappUrl = productWhatsappLink(
        whatsapp,
        product,
        siteUrl,
        product.variantAxes.length > 0 ? selectedVariant : null,
    );

    /**
     * Sepete ekleme formu. Masaüstünde panelin içinde, mobilde alt çubukta —
     * AYNI alanlar, aynı aksiyon. İkisini ayrı yazmak, varyant değişince
     * birinin eski id'yi göndermesi demek olurdu.
     */
    const buyForm = (size: 'lg' | 'sm') => (
        <form action={addToCartAction} className="flex items-stretch gap-2.5">
            <input type="hidden" name="productId" value={selectedVariant?.id ?? ''} />
            <input type="hidden" name="back" value={`/urun/${product.slug}`} />

            {/* Adet: gizli alan + iki düğme değil, düz bir sayı alanı.
                Ürün sayfasında adet nadiren değişir; stepper sepette. */}
            <label className={`flex items-center gap-1 rounded-[14px] border border-slate-900/13 px-2 ${BUY_SIZES[size].box}`}>
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
                className={`btn-primary flex-1 justify-center rounded-[14px] text-base ${BUY_SIZES[size].box}`}
                pendingLabel="Ekleniyor…"
                disabled={!inStock || !selectedVariant}
            >
                {inStock ? 'Sepete ekle' : 'Tükendi'}
            </SubmitButton>
        </form>
    );

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
                                        onClick={() => select(axis.id, value.id)}
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
                                    onClick={() => select(axis.id, value.id)}
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

            {/* Masaüstünde satın alma formu panelin içinde. Mobilde gizli:
                orada aynı form ekranın dibindeki sabit çubukta duruyor —
                iki CTA göstermek kullanıcıya hangisinin çalıştığını sordurur. */}
            <div className="hidden lg:block">{buyForm('lg')}</div>

            {whatsappUrl && (
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    // Niyet (lead), satış DEĞİL. Telefon ve mesaj metni gönderilmez; yalnız ürün.
                    onClick={() => track('whatsapp_click', { placement: 'urun', items: [fromDetail(product, selectedVariant)] })}
                    className="flex min-h-[50px] items-center justify-center gap-2 rounded-[14px] border border-teal-ink/25 bg-teal-tint text-[15px] font-bold text-teal-ink transition hover:border-teal-ink/45"
                >
                    <WhatsappIcon className="size-[18px]" />
                    WhatsApp ile satın al
                </a>
            )}

            {!selectedVariant && product.variantAxes.length > 0 && (
                <p className="text-xs text-slate-500">Bu kombinasyon mevcut değil; lütfen başka bir seçim yapın.</p>
            )}

            {/* MOBİL SATIN ALMA ÇUBUĞU — document.body'ye PORTAL.
                Ürün sayfası uzun (galeri, künye, yorumlar); kullanıcı aşağıdayken
                sepete eklemek için başa dönmek zorunda kalmamalı.

                NEDEN PORTAL: `position: fixed` bir atada `transform`, `filter`,
                `backdrop-filter` ya da `contain` varsa VİEWPORT'a değil o ataya
                göre konumlanır ve çubuk ekranın dibine oturmaz. Sayfada böyle
                bir ata bulamadım ama boşluk canlıda görüldü; body'ye taşımak
                bu sebep sınıfının TAMAMINI ortadan kaldırıyor. MobileMenu
                aynı sorun için aynı çözümü kullanıyor.

                `buy-bar` sınıfı globals.css'te WhatsApp ve tawk.to balonlarını
                yukarı itiyor — yoksa çubuğun altında kalırlardı. */}
            {mounted && createPortal((
                <div className="buy-bar fixed inset-x-0 bottom-0 z-40 border-t border-slate-900/10 bg-surface/95 px-4 pb-[max(8px,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-[14px] lg:hidden">
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <span className="price text-[17px]">{formatPrice(price)}</span>
                    {selectedVariant?.name && (
                        <span className="truncate text-[12px] text-slate-600">{selectedVariant.name}</span>
                    )}
                </div>
                {buyForm('sm')}
                </div>
            ), document.body)}


            <ul className="space-y-1 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <li>Gizli paketleme — kargo etiketinde içerik bilgisi yer almaz.</li>
                {shippingLine && <li>{shippingLine}</li>}
                <li>Ambalajı açılmamış ürünlerde {returnDays} gün içinde iade hakkı.</li>
            </ul>
        </div>
    );
}
