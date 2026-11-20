import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import Container from '@/components/Container';
import EmptyState from '@/components/EmptyState';
import { MinusIcon, PlusIcon } from '@/components/icons';
import SubmitButton from '@/components/form/SubmitButton';
import { getSettings } from '@/lib/api';
import { getCart } from '@/lib/cart';
import {
    BLOCKED_CART_MESSAGE, isCheckoutReady, isPurchasable, lineMessage,
} from '@/lib/cart-status';
import { formatPrice } from '@/lib/format';
import { one, type SearchParams } from '@/lib/listing';
import { routes } from '@/lib/site';
import {
    applyCouponAction, removeCouponAction, removeItemAction, setQuantityAction,
} from './actions';
import { TrackCart } from '@/components/analytics/Track';
import { PACKAGING_SHORT, statementText } from '@/lib/privacy-copy';

export const metadata: Metadata = {
    title: 'Sepetim',
    // Sepet kişiye özel: indekslenmez ama katalog bağlantıları izlenebilir.
    robots: { index: false, follow: true },
};

/** Adet artır/azalt — iki ayrı gönderim düğmesi, istemci durumu yok. */
function QuantityStepper({ itemId, quantity, max }: { itemId: number; quantity: number; max: number | null }) {
    const step = (next: number, label: string, icon: React.ReactNode, disabled: boolean) => (
        <form action={setQuantityAction}>
            <input type="hidden" name="itemId" value={itemId} />
            <input type="hidden" name="quantity" value={next} />
            <button
                type="submit"
                aria-label={label}
                disabled={disabled}
                className="grid h-full w-9 place-items-center text-slate-700 transition-colors hover:text-accent-500 disabled:opacity-35"
            >
                {icon}
            </button>
        </form>
    );

    return (
        <div className="flex h-10 items-stretch overflow-hidden rounded-[14px] border border-slate-900/13">
            {step(quantity - 1, 'Adet azalt', <MinusIcon className="size-3.5" />, quantity <= 1)}
            <span className="grid w-8 place-items-center text-[13.5px] font-bold tabular-nums">{quantity}</span>
            {step(quantity + 1, 'Adet artır', <PlusIcon className="size-3.5" />, max !== null && quantity >= max)}
        </div>
    );
}

async function CartContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const [cart, params, settings] = await Promise.all([getCart(), searchParams, getSettings()]);
    // Ekstre ve paketleme cümlesi tek kaynaktan (S10): bankaya göre değişen
    // ekstre açıklaması için kesin ad sözü verilmez.
    const statement = statementText(settings);
    // Kupon sistemi kapalıyken (`kupon.aktif`, varsayılan) alan HİÇ çizilmez.
    const couponsOn = settings['kupon.aktif'] === true;
    const error = one(params.hata);

    if (cart.items.length === 0) {
        return (
            <EmptyState
                where="Sepet"
                title="Sepetin henüz boş"
                description="Beğendiğin ürünleri sepete ekleyince burada görünecekler."
                action={<Link href={routes.home} className="btn-secondary">Alışverişe başla</Link>}
            />
        );
    }

    const shipping = cart.shippingOptions.find((option) => option.id === cart.selectedShippingRateId);
    // Satılamayan satır varken ödeme kapalı (S01). Satır silinmez; müşteri düzeltir.
    const ready = isCheckoutReady(cart);
    // Hiç satılabilir satır yoksa kargo ve toplam gösterilmez: "0 TL + kargo" görünümü olmasın.
    const billable = cart.items.some((item) => item.available);

    return (
        <>
            <TrackCart name="view_cart" cart={cart} />
            {error && (
                <p role="alert" className="mb-4 rounded-[var(--radius-md)] bg-accent-200 px-4 py-3 text-[13.5px] font-semibold text-accent-500">
                    {error}
                </p>
            )}

            <div className="flex flex-wrap items-start gap-[clamp(14px,2vw,24px)]">
                <div className="min-w-0 flex-[999_1_420px] space-y-2.5">
                    {cart.items.map((item) => {
                        const warning = lineMessage(item);
                        const blocked = !isPurchasable(item);
                        return (
                        <div key={item.id} className={`card flex gap-4 p-[16px_18px] ${item.available ? '' : 'opacity-60'}`}>
                            <Link href={routes.product(item.slug)} className="relative size-[88px] shrink-0 overflow-hidden rounded-[14px] bg-shelf">
                                {item.image && (
                                    <Image src={item.image.url} alt={item.name} fill sizes="88px" className="object-cover" />
                                )}
                            </Link>

                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <span className="brand-line">{item.brand.name}</span>
                                <h2 className="text-[15px] font-bold leading-snug">
                                    <Link href={routes.product(item.slug)} className="transition-colors hover:text-accent-500">{item.name}</Link>
                                </h2>
                                {item.variantLabel && <p className="text-[12.5px] text-slate-600">{item.variantLabel}</p>}

                                {warning && (
                                    <p role="status" className="text-[12.5px] font-semibold text-accent-500">{warning}</p>
                                )}

                                <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
                                    {item.available && item.blockReason !== 'out_of_stock' && (
                                        <QuantityStepper itemId={item.id} quantity={item.quantity} max={item.maxQuantity} />
                                    )}
                                    {/* Stoktan fazla adet: tek tıkla kalan stoğa indir. Adım adım azaltmak
                                        her tıklamada yine "stok yetmiyor" hatası verirdi. */}
                                    {item.blockReason === 'exceeds_stock' && item.maxQuantity ? (
                                        <form action={setQuantityAction}>
                                            <input type="hidden" name="itemId" value={item.id} />
                                            <input type="hidden" name="quantity" value={item.maxQuantity} />
                                            <button type="submit" className="btn-soft btn-sm">Adedi {item.maxQuantity} yap</button>
                                        </form>
                                    ) : null}
                                    <form action={removeItemAction}>
                                        <input type="hidden" name="itemId" value={item.id} />
                                        <button type="submit" className="text-[12.5px] text-slate-600 underline underline-offset-4 transition-colors hover:text-accent-500">
                                            Kaldır
                                        </button>
                                    </form>
                                </div>
                            </div>

                            <div className="shrink-0 text-right">
                                {/* Satışta olmayan satır toplama girmiyor; tutarı da gösterilmez. */}
                                {item.available ? (
                                    <>
                                        <div className={`price text-[17px] ${blocked ? 'text-slate-500' : ''}`}>{formatPrice(item.lineTotal)}</div>
                                        {item.compareAtPrice && (
                                            <div className="price-old text-[12px]">{formatPrice(item.compareAtPrice * item.quantity)}</div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-[12.5px] font-semibold text-slate-500">Satın alınamıyor</div>
                                )}
                            </div>
                        </div>
                        );
                    })}

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                        <Link href={routes.home} className="btn-secondary btn-sm">← Alışverişe devam et</Link>
                        <p className="text-[12.5px] text-slate-600">{PACKAGING_SHORT}</p>
                    </div>
                </div>

                {/* Özet yapışkan: uzun listede "ödemeye geç" hep görünür kalır. */}
                <aside className="min-w-0 flex-[1_1_300px] lg:sticky lg:top-36 lg:max-w-[380px]">
                    <div className="card card-xl p-[clamp(18px,2.4vw,24px)]">
                        <h2 className="heading-3">Sipariş özeti</h2>

                        <dl className="mt-4 space-y-2.5 text-[13.5px]">
                            <div className="flex justify-between gap-3">
                                <dt className="text-slate-600">Ara toplam</dt>
                                <dd className="font-semibold">{formatPrice(cart.totals.subtotal)}</dd>
                            </div>
                            {cart.totals.discount > 0 && (
                                <div className="flex justify-between gap-3">
                                    <dt className="text-slate-600">İndirim{cart.coupon?.valid ? ` (${cart.coupon.code})` : ''}</dt>
                                    <dd className="font-semibold text-accent-500">−{formatPrice(cart.totals.discount)}</dd>
                                </div>
                            )}
                            {billable && (
                                <div className="flex justify-between gap-3">
                                    <dt className="text-slate-600">Kargo{shipping ? ` — ${shipping.carrier}` : ''}</dt>
                                    <dd className={`font-semibold ${cart.totals.shipping === 0 ? 'text-teal-ink' : ''}`}>
                                        {cart.totals.shipping === 0 ? 'Ücretsiz' : formatPrice(cart.totals.shipping)}
                                    </dd>
                                </div>
                            )}
                        </dl>

                        {billable && shipping?.remainingForFree !== null && shipping?.remainingForFree !== undefined && shipping.remainingForFree > 0 && (
                            <p className="mt-3 rounded-[var(--radius-md)] bg-teal-tint px-3 py-2 text-[12.5px] font-semibold text-teal-ink">
                                {formatPrice(shipping.remainingForFree)} daha ekle, kargo ücretsiz olsun.
                            </p>
                        )}

                        <div className="hr" />

                        {billable && (
                            <div className="flex items-baseline justify-between gap-3">
                                <span className="text-[13.5px] font-semibold">Toplam</span>
                                <span className="price text-[26px]">{formatPrice(cart.totals.grandTotal)}</span>
                            </div>
                        )}

                        {ready ? (
                            <Link href={routes.checkout} className="btn-primary mt-4 min-h-[54px] w-full justify-center rounded-[14px]">
                                Ödemeye geç
                            </Link>
                        ) : (
                            <>
                                <p role="alert" className="mt-4 rounded-[var(--radius-md)] bg-accent-200 px-3 py-2 text-[12.5px] font-semibold text-accent-500">
                                    {BLOCKED_CART_MESSAGE}
                                </p>
                                <button
                                    type="button"
                                    disabled
                                    aria-disabled="true"
                                    className="btn-primary mt-3 min-h-[54px] w-full justify-center rounded-[14px] opacity-45"
                                >
                                    Ödemeye geç
                                </button>
                            </>
                        )}

                        <p className="mt-3 text-[12px] leading-relaxed text-slate-600">
                            Üye olmadan da tamamlayabilirsin. {statement}
                        </p>

                        {couponsOn && <div className="hr" />}

                        {!couponsOn ? null : cart.coupon?.valid ? (
                            <form action={removeCouponAction} className="flex items-center justify-between gap-3">
                                <span className="text-[13px]">
                                    <strong className="font-bold">{cart.coupon.code}</strong> uygulandı
                                </span>
                                <SubmitButton className="btn-soft btn-sm" pendingLabel="…">Kaldır</SubmitButton>
                            </form>
                        ) : (
                            <form action={applyCouponAction} className="flex gap-2">
                                <input
                                    name="kupon"
                                    aria-label="İndirim kodu"
                                    placeholder="İndirim kodu"
                                    className="field-input py-2.5 text-[13px]"
                                />
                                <SubmitButton className="btn-secondary btn-sm shrink-0">Uygula</SubmitButton>
                            </form>
                        )}
                    </div>
                </aside>
            </div>
        </>
    );
}

export default function CartPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    return (
        <Container className="pt-[clamp(18px,3vw,30px)]">
            <h1 className="heading-1">Sepetim</h1>

            {/* Sepet istek zamanlı okunur: başlık statik kabukta, liste akar. */}
            <div className="mt-5">
                <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-xl)] bg-slate-100" />}>
                    <CartContent searchParams={searchParams} />
                </Suspense>
            </div>
        </Container>
    );
}
