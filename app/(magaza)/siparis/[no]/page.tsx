import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import Container from '@/components/Container';
import PrivacyPanel from '@/components/privacy/PrivacyPanel';
import { CheckIcon } from '@/components/icons';
import { getOrder } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import TrackingLine from '@/components/order/TrackingLine';
import TransferPanel from '@/components/order/TransferPanel';
import { routes } from '@/lib/site';
import type { OrderStatus } from '@/lib/types';

export const metadata: Metadata = {
    title: 'Sipariş onayı',
    robots: { index: false, follow: false },
};

/** Tasarımdaki dört adımlı takip şeridi. */
const STEPS: { status: OrderStatus; label: string }[] = [
    { status: 'confirmed', label: 'Sipariş alındı' },
    { status: 'preparing', label: 'Hazırlanıyor' },
    { status: 'shipped', label: 'Kargoya verildi' },
    { status: 'delivered', label: 'Teslim edildi' },
];

async function OrderContent({
    params, searchParams,
}: {
    params: Promise<{ no: string }>;
    searchParams: Promise<{ e?: string }>;
}) {
    const [{ no }, { e }] = await Promise.all([params, searchParams]);
    const order = await getOrder(no, e);

    if (!order) {
        return (
            <div className="card card-xl mx-auto max-w-[460px] p-[clamp(24px,4vw,36px)] text-center">
                <h1 className="heading-3">Sipariş bulunamadı</h1>
                <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                    Bağlantı eksik ya da sipariş sana ait değil. Sipariş numaran ve e-posta adresinle
                    tekrar deneyebilirsin.
                </p>
                <Link href={routes.home} className="btn-secondary mt-5">Anasayfaya dön</Link>
            </div>
        );
    }

    const reached = STEPS.findIndex((item) => item.status === order.status);
    // Durum metni API'nin TEK gösterim durumundan (`paymentState`): iptal edilmiş
    // ve hiç ödenmemiş havale eskiden "ödeme bekleniyor" görünüyordu.
    const closed = order.status === 'cancelled' || order.status === 'refunded';
    const failed = order.paymentState === 'failed';
    const awaitingTransfer = !closed && ['awaiting_payment', 'partially_paid'].includes(order.paymentState);
    const showTransfer = Boolean(order.transfer) && (!order.transfer!.closed || order.transfer!.paid > 0 || order.transfer!.refunded > 0);

    return (
        <div className="flex flex-wrap items-start gap-[clamp(18px,3vw,44px)]">
            <div className="min-w-0 flex-[999_1_360px]">
                {failed ? (
                    <span className="badge badge-accent">Ödeme tamamlanamadı</span>
                ) : closed ? (
                    <span className="badge badge-neutral">{order.status === 'refunded' ? 'İade edildi' : 'Sipariş iptal edildi'}</span>
                ) : (
                    <span className="badge badge-teal">
                        <CheckIcon className="size-3" />
                        {awaitingTransfer ? 'Sipariş alındı — ödeme bekleniyor' : 'Sipariş alındı'}
                    </span>
                )}

                <h1 className="heading-1 mt-4">
                    {failed ? 'Ödeme alınamadı' : closed ? 'Sipariş kapandı' : `Teşekkürler,`}
                    {!failed && !closed && <><br />{order.shippingAddress.firstname}.</>}
                </h1>

                <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-slate-600">
                    {failed ? (
                        <>Sipariş <strong className="font-bold text-slate-900">{order.orderNumber}</strong> için ödeme tamamlanamadı
                        ve ürünler stoğa geri verildi. Sepetini yeniden oluşturup tekrar deneyebilirsin.</>
                    ) : closed ? (
                        <>Sipariş <strong className="font-bold text-slate-900">{order.orderNumber}</strong>{' '}
                        {order.status === 'refunded' ? 'iade edildi' : 'iptal edildi'}.
                        {order.paymentState === 'refund_due' && ' Ödemen, yaptığın yönteme iade edilecek.'}
                        {order.paymentState === 'refunded' && ' Ödemen iade edildi.'}
                        {' '}Sorun olduğunu düşünüyorsan bize yazabilirsin.</>
                    ) : (
                        <>Sipariş numaran <strong className="font-bold text-slate-900">{order.orderNumber}</strong>.
                        Bilgilendirme e-postası <strong className="font-bold text-slate-900">{order.email}</strong> adresine
                        gönderildi; konu satırında yalnızca sipariş numaran yazar.</>
                    )}
                </p>

                {showTransfer && !failed && (
                    <TransferPanel settlement={order.transfer!} orderNumber={order.orderNumber} className="mt-5" />
                )}

                {!failed && !closed && (
                    <div className="card mt-5 px-[22px] py-1.5">
                        {STEPS.map((item, index) => {
                            const done = index <= reached;
                            return (
                                <div key={item.status} className="flex items-center gap-3.5 border-b border-slate-900/7 py-3 last:border-0">
                                    <span
                                        className={`grid size-[22px] shrink-0 place-items-center rounded-full border text-[11px] font-bold ${
                                            done ? 'border-accent-500 bg-accent-500 text-white' : 'border-slate-900/18 text-slate-600'
                                        }`}
                                    >
                                        {index + 1}
                                    </span>
                                    <span className={`text-[14px] ${done ? 'font-bold' : 'text-slate-600'}`}>{item.label}</span>
                                    {item.status === 'shipped' && <TrackingLine shipping={order.shipping} className="ml-auto" />}
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="card mt-4 px-[22px] py-1.5">
                    {order.items.map((item) => (
                        <div key={item.id} className="flex items-baseline justify-between gap-3 border-b border-slate-900/7 py-3 last:border-0">
                            <span className="min-w-0 text-[13.5px]">
                                <span className="block font-semibold">{item.name}</span>
                                <span className="text-slate-600">
                                    {item.variantLabel ? `${item.variantLabel} · ` : ''}{item.quantity} adet
                                </span>
                            </span>
                            <span className="price shrink-0 text-[14px]">{formatPrice(item.lineTotal)}</span>
                        </div>
                    ))}
                    <div className="flex items-baseline justify-between gap-3 py-3">
                        <span className="text-[13.5px] font-bold">Toplam</span>
                        <span className="price text-[18px]">{formatPrice(order.totals.grandTotal)}</span>
                    </div>
                </div>

                {/* Kabul edilen belgelerin kalıcı kopyası (e-postayla da gitti). */}
                <p className="mt-4 text-[13px] text-slate-600">
                    Onayladığın belgeler:{' '}
                    <Link href={`/belge/${order.orderNumber}/on-bilgilendirme${e ? `?e=${encodeURIComponent(e)}` : ''}`} className="link">Ön bilgilendirme formu</Link>
                    {' · '}
                    <Link href={`/belge/${order.orderNumber}/mesafeli-satis${e ? `?e=${encodeURIComponent(e)}` : ''}`} className="link">Mesafeli satış sözleşmesi</Link>
                </p>

                <div className="mt-5 flex flex-wrap gap-2.5">
                    <Link href={routes.accountOrders} className="btn-accent">Siparişlerime git</Link>
                    <Link href={routes.home} className="btn-secondary">Alışverişe devam et</Link>
                </div>
            </div>

            <div className="min-w-0 flex-[1_1_300px] sm:max-w-[380px]">
                <PrivacyPanel />
            </div>
        </div>
    );
}

export default function OrderPage({
    params, searchParams,
}: {
    params: Promise<{ no: string }>;
    searchParams: Promise<{ e?: string }>;
}) {
    return (
        <Container className="pt-[clamp(18px,3vw,30px)]">
            <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-xl)] bg-slate-100" />}>
                <OrderContent params={params} searchParams={searchParams} />
            </Suspense>
        </Container>
    );
}
