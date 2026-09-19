import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import TransferPanel from '@/components/order/TransferPanel';
import PrivacyPanel from '@/components/privacy/PrivacyPanel';
import { getMyOrder } from '@/lib/account';
import { formatDate, formatPrice } from '@/lib/format';
import { routes } from '@/lib/site';
import type { Order, OrderStatus } from '@/lib/types';
import AccountShell from '../../AccountShell';

export const metadata: Metadata = { title: 'Sipariş detayı', robots: { index: false, follow: false } };

/** Tasarımdaki dört adımlı takip şeridi. */
const STEPS: { status: OrderStatus; label: string }[] = [
    { status: 'confirmed', label: 'Sipariş alındı' },
    { status: 'preparing', label: 'Hazırlanıyor' },
    { status: 'shipped', label: 'Kargoya verildi' },
    { status: 'delivered', label: 'Teslim edildi' },
];

const STATUS_BADGE: Record<OrderStatus, string> = {
    payment_pending: 'badge-amber',
    confirmed: 'badge-teal',
    preparing: 'badge-plum',
    shipped: 'badge-accent',
    delivered: 'badge-teal',
    cancelled: 'badge-neutral',
    refunded: 'badge-neutral',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
    payment_pending: 'Ödeme bekleniyor',
    confirmed: 'Sipariş alındı',
    preparing: 'Hazırlanıyor',
    shipped: 'Yolda',
    delivered: 'Teslim edildi',
    cancelled: 'İptal edildi',
    refunded: 'İade edildi',
};

/**
 * Hesabım içindeki sipariş detayı.
 *
 * Misafir onay sayfası (`/siparis/[no]`) ile aynı veriyi gösterir ama Hesabım
 * kabuğunun içinde ve oturumla yetkilendirilir — misafir sayfası e-posta
 * doğrulaması ister, burada jeton yeterli.
 */
export default async function AccountOrderPage({ params }: { params: Promise<{ no: string }> }) {
    const { no } = await params;
    const order = await getMyOrder(decodeURIComponent(no)).catch(() => null);
    if (!order) notFound();

    const reached = STEPS.findIndex((step) => step.status === order.status);
    const cancelled = order.status === 'cancelled' || order.status === 'refunded';

    return (
        <AccountShell
            active={routes.accountOrders}
            title={`Sipariş ${order.orderNumber}`}
            description={`${formatDate(order.placedAt)}${order.shipping.trackingNumber ? ` · ${order.shipping.carrier} ${order.shipping.trackingNumber}` : ''}`}
            action={<span className={`badge ${STATUS_BADGE[order.status]}`}>{STATUS_LABEL[order.status]}</span>}
        >
            <Link href={routes.accountOrders} className="mb-3 inline-block text-[12.5px] text-slate-600 hover:text-accent-500">
                ← Siparişlerim
            </Link>

            {/* İptal/iade edilmiş siparişte takip şeridi yanıltıcı olur. */}
            {!cancelled && <TrackingStrip reached={reached} order={order} />}

            <div className="flex flex-wrap items-start gap-[clamp(14px,2vw,26px)]">
                <div className="flex min-w-0 flex-[999_1_320px] flex-col gap-2.5">
                    {order.items.map((item) => (
                        <article key={item.id} className="card flex flex-wrap gap-3.5 p-4">
                            <div className="relative size-[68px] flex-none overflow-hidden rounded-[12px] border border-slate-900/6 bg-paper">
                                {item.imageUrl && (
                                    <Image src={item.imageUrl} alt={item.name} fill sizes="68px" className="object-cover" />
                                )}
                            </div>

                            <div className="min-w-0 flex-[1_1_180px]">
                                {item.brandName && (
                                    <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-600">{item.brandName}</div>
                                )}
                                <div className="mt-0.5 text-[14.5px] font-bold tracking-[-0.015em]">{item.name}</div>
                                <div className="mt-1 text-[12px] text-slate-600">
                                    {item.variantLabel && <>{item.variantLabel} · </>}{item.quantity} adet
                                </div>

                                {/* Eylemler yalnızca teslim edilmiş siparişte: API da aynı
                                    kuralı zorluyor, burada boş bir umut vermiyoruz. */}
                                {order.status === 'delivered' && (
                                    <div className="mt-2.5 flex flex-wrap gap-3 text-[12px] text-slate-600">
                                        {item.slug && (
                                            <Link href={`${routes.accountReviews}?yaz=${item.slug}`} className="border-b border-slate-900/18 hover:border-accent-500 hover:text-accent-500">
                                                Değerlendir
                                            </Link>
                                        )}
                                        <Link
                                            href={`${routes.accountReturns}?siparis=${encodeURIComponent(order.orderNumber)}`}
                                            className="border-b border-slate-900/18 hover:border-accent-500 hover:text-accent-500"
                                        >
                                            İade talebi
                                        </Link>
                                        {item.slug && (
                                            <Link href={routes.product(item.slug)} className="border-b border-slate-900/18 hover:border-accent-500 hover:text-accent-500">
                                                Tekrar al
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>

                            <span className="font-display text-[15px] font-semibold">{formatPrice(item.lineTotal)}</span>
                        </article>
                    ))}
                </div>

                <aside className="flex min-w-0 flex-[1_1_250px] flex-col gap-3 lg:max-w-[330px]">
                    <section className="card overflow-hidden">
                        <h3 className="border-b border-slate-900/6 px-4 py-3 text-[12.5px] font-bold">Özet</h3>
                        <dl className="flex flex-col gap-2.5 px-4 py-3.5 text-[13px]">
                            <Row label="Ara toplam" value={formatPrice(order.totals.subtotal)} />
                            {order.totals.discount > 0 && (
                                <Row label={`İndirim${order.couponCode ? ` (${order.couponCode})` : ''}`} value={`−${formatPrice(order.totals.discount)}`} />
                            )}
                            <Row label="Kargo" value={order.totals.shipping > 0 ? formatPrice(order.totals.shipping) : 'Ücretsiz'} />
                            <div className="hr my-0.5" />
                            <Row label="Toplam" value={formatPrice(order.totals.grandTotal)} strong />
                        </dl>
                    </section>

                    {/* Havale özeti: kalan tutar en çok sorulan şey, adresin
                        üstünde dursun. Kart siparişinde alan hiç gelmiyor. */}
                    {order.transfer && <TransferPanel settlement={order.transfer} orderNumber={order.orderNumber} />}

                    <section className="card overflow-hidden">
                        <h3 className="border-b border-slate-900/6 px-4 py-3 text-[12.5px] font-bold">Teslimat</h3>
                        <address className="px-4 py-3.5 text-[13px] not-italic leading-relaxed text-slate-700">
                            {order.shippingAddress.firstname} {order.shippingAddress.lastname}<br />
                            {order.shippingAddress.addressLine}
                            {order.shippingAddress.neighbourhood && <>, {order.shippingAddress.neighbourhood}</>}<br />
                            {order.shippingAddress.district} / {order.shippingAddress.city}<br />
                            {order.shippingAddress.phone}
                        </address>
                    </section>

                    <PrivacyPanel />
                </aside>
            </div>
        </AccountShell>
    );
}

function TrackingStrip({ reached, order }: { reached: number; order: Order }) {
    return (
        <ol className="mb-5 grid gap-2 sm:grid-cols-4">
            {STEPS.map((step, index) => {
                const done = reached >= index;
                return (
                    <li key={step.status} className={`card card-edge-top ${done ? 'border-t-accent-500' : 'border-t-slate-200'} p-3`}>
                        <div className="text-[11px] text-slate-600">
                            {step.status === 'shipped' && order.shipping.shippedAt ? formatDate(order.shipping.shippedAt)
                                : step.status === 'delivered' && order.shipping.deliveredAt ? formatDate(order.shipping.deliveredAt)
                                    : done ? 'Tamamlandı' : 'Bekliyor'}
                        </div>
                        <div className={`mt-1 text-[13.5px] font-bold tracking-[-0.015em] ${done ? 'text-slate-900' : 'text-slate-500'}`}>
                            {step.label}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
    return (
        <div className="flex justify-between gap-3">
            <dt className="text-slate-600">{label}</dt>
            <dd className={strong ? 'font-bold' : 'font-semibold'}>{value}</dd>
        </div>
    );
}
