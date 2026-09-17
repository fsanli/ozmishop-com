import type { Metadata } from 'next';
import Link from 'next/link';
import EmptyState from '@/components/EmptyState';
import { getMyOrder, getMyOrders, getMyReturns } from '@/lib/account';
import { getSettings } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { one, type SearchParams } from '@/lib/listing';
import { routes } from '@/lib/site';
import type { ReturnRequest } from '@/lib/types';
import AccountShell from '../AccountShell';
import ReturnForm from './ReturnForm';

export const metadata: Metadata = { title: 'İade taleplerim', robots: { index: false, follow: false } };

/** Talebin nerede olduğu; her adım ne beklendiğini de söyler. */
const STATUS: Record<ReturnRequest['status'], { label: string; badge: string; hint: string }> = {
    requested: { label: 'İnceleniyor', badge: 'badge-amber', hint: 'Talebini aldık. Genelde bir iş günü içinde dönüş yapılır.' },
    approved: { label: 'Onaylandı', badge: 'badge-teal', hint: 'İade kodunu kargo şubesinde göstererek ürünü ücretsiz gönderebilirsin.' },
    rejected: { label: 'Onaylanmadı', badge: 'badge-neutral', hint: 'Sebebi aşağıda yazıyor. İtiraz etmek istersen destek hattından yazabilirsin.' },
    shipped: { label: 'Yolda', badge: 'badge-plum', hint: 'Ürün bize ulaştığında kontrol edilip iade tutarı işlenecek.' },
    received: { label: 'Teslim alındı', badge: 'badge-plum', hint: 'Ürün elimize ulaştı, kontrol ediliyor.' },
    refunded: { label: 'İade edildi', badge: 'badge-teal', hint: 'Tutar bankana iletildi; kartına yansıması 2–7 iş günü sürebilir.' },
};

export default async function ReturnsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const [{ items }, params, settings] = await Promise.all([getMyReturns(), searchParams, getSettings()]);
    // İade süresi tek kaynaktan: rehber ipuçları da aynı sayıyı söylüyor.
    const returnDays = settings['icerik.iade_suresi_gun'] ?? 14;

    const error = one(params.hata);
    const created = one(params.olusturuldu) === '1';
    const orderNumber = one(params.siparis);

    // Yalnızca teslim edilmiş siparişler iade edilebilir; API de aynı kuralı
    // zorluyor, burası sadece kullanıcıyı boş yere uğraştırmamak için.
    const { items: orders } = await getMyOrders();
    const eligible = orders.filter((order) => order.status === 'delivered');
    const selected = orderNumber ? await getMyOrder(orderNumber).catch(() => null) : null;

    return (
        <AccountShell
            active={routes.accountReturns}
            title="İade taleplerim"
            description={`Teslim tarihinden itibaren ${returnDays} gün içinde iade talebi oluşturabilirsin. Kargo ücreti bizden.`}
        >
            {error && (
                <p role="alert" className="mb-4 rounded-[var(--radius-md)] bg-accent-200 px-4 py-3 text-[13.5px] font-semibold text-accent-500">
                    {error}
                </p>
            )}
            {created && (
                <p role="status" className="mb-4 rounded-[var(--radius-md)] bg-teal-tint px-4 py-3 text-[13.5px] font-semibold text-teal-ink">
                    Talebin oluşturuldu. Sonucu bu sayfada ve e-postanda göreceksin.
                </p>
            )}

            {selected && <ReturnForm order={selected} />}

            {!selected && eligible.length > 0 && (
                <section className="card card-edge-left border-l-plum-dot mb-5 p-[18px_20px]">
                    <h3 className="text-[15px] font-bold">İade edilebilir siparişler</h3>
                    <ul className="mt-3 space-y-2">
                        {eligible.map((order) => (
                            <li key={order.orderNumber} className="flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-900/7 pt-2.5 first:border-0 first:pt-0">
                                <div className="min-w-0">
                                    <span className="text-[13.5px] font-semibold">{order.orderNumber}</span>
                                    <span className="ml-2 text-[12.5px] text-slate-600">
                                        {formatDate(order.placedAt)} · {order.itemCount} ürün
                                    </span>
                                </div>
                                <Link href={`${routes.accountReturns}?siparis=${encodeURIComponent(order.orderNumber)}`} className="btn-soft btn-sm">
                                    İade talebi oluştur
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {items.length === 0 ? (
                eligible.length === 0 && !selected && (
                    <EmptyState
                        where="İadeler"
                        color="plum"
                        title="İade talebin yok"
                        description={`Teslim aldığın bir siparişten memnun kalmazsan ${returnDays} gün içinde buradan iade talebi oluşturabilirsin. Kargo ücreti bizden.`}
                        action={<Link href={routes.accountOrders} className="btn-secondary">Siparişlerime bak</Link>}
                    />
                )
            ) : (
                <ul className="space-y-3">
                    {items.map((request) => {
                        const status = STATUS[request.status];
                        return (
                            <li key={request.id} className="card p-[18px_20px]">
                                <div className="flex flex-wrap items-center justify-between gap-2.5">
                                    <Link href={routes.accountOrder(request.orderNumber)} className="text-[14.5px] font-bold hover:text-accent-500">
                                        {request.orderNumber}
                                    </Link>
                                    <span className={`badge ${status.badge}`}>{status.label}</span>
                                </div>

                                <p className="mt-1.5 text-[12.5px] text-slate-600">
                                    {formatDate(request.createdAt)} · {request.reason}
                                </p>

                                <ul className="mt-3 space-y-1">
                                    {request.items.map((item) => (
                                        <li key={item.orderItemId} className="text-[13px] text-slate-700">
                                            {item.name}
                                            {item.variantLabel && <span className="text-slate-600"> · {item.variantLabel}</span>}
                                            <span className="text-slate-600"> · {item.quantity} adet</span>
                                        </li>
                                    ))}
                                </ul>

                                {request.returnCode && (
                                    <p className="mt-3 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-slate-900 px-3.5 py-2 font-display text-[15px] font-semibold tracking-[-0.02em] text-on-dark">
                                        İade kodu: {request.returnCode}
                                    </p>
                                )}

                                <p className="mt-3 text-[12.5px] leading-relaxed text-slate-600">{status.hint}</p>

                                {request.decisionNote && (
                                    <p className="mt-2.5 rounded-[var(--radius-md)] bg-slate-100 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-slate-700">
                                        {request.decisionNote}
                                    </p>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </AccountShell>
    );
}
