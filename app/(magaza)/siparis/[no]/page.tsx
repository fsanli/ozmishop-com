import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import Container from '@/components/Container';
import PrivacyPanel from '@/components/privacy/PrivacyPanel';
import { CheckIcon } from '@/components/icons';
import { getOrder } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
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
    const failed = order.status === 'cancelled' || order.paymentStatus === 'failed';
    const awaitingTransfer = order.paymentMethod === 'transfer' && order.paymentStatus === 'pending';

    return (
        <div className="flex flex-wrap items-start gap-[clamp(18px,3vw,44px)]">
            <div className="min-w-0 flex-[999_1_360px]">
                {failed ? (
                    <span className="badge badge-accent">Ödeme tamamlanamadı</span>
                ) : (
                    <span className="badge badge-teal">
                        <CheckIcon className="size-3" />
                        {awaitingTransfer ? 'Sipariş alındı — ödeme bekleniyor' : 'Sipariş alındı'}
                    </span>
                )}

                <h1 className="heading-1 mt-4">
                    {failed ? 'Ödeme alınamadı' : `Teşekkürler,`}
                    {!failed && <><br />{order.shippingAddress.firstname}.</>}
                </h1>

                <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-slate-600">
                    {failed ? (
                        <>Sipariş <strong className="font-bold text-slate-900">{order.orderNumber}</strong> için ödeme tamamlanamadı
                        ve ürünler stoğa geri verildi. Sepetini yeniden oluşturup tekrar deneyebilirsin.</>
                    ) : (
                        <>Sipariş numaran <strong className="font-bold text-slate-900">{order.orderNumber}</strong>.
                        Bilgilendirme e-postası <strong className="font-bold text-slate-900">{order.email}</strong> adresine
                        gönderildi; konu satırında yalnızca sipariş numaran yazar.</>
                    )}
                </p>

                {awaitingTransfer && (
                    <div className="card mt-5 p-[18px_20px]">
                        <h2 className="text-[14.5px] font-bold">Havale / EFT bilgileri</h2>
                        <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
                            Açıklamaya yalnızca <strong className="font-bold text-slate-900">{order.orderNumber}</strong> yazman
                            yeterli. Ödemen ulaştığında siparişin hazırlanmaya başlar.
                        </p>
                        <p className="mt-2 text-[12.5px] text-slate-600">
                            Banka bilgileri sipariş e-postanda yer alır.
                        </p>
                    </div>
                )}

                {!failed && (
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
                                    {item.status === 'shipped' && order.shipping.trackingNumber && (
                                        <span className="ml-auto text-[12.5px] text-slate-600">
                                            {order.shipping.carrier} · {order.shipping.trackingNumber}
                                        </span>
                                    )}
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
