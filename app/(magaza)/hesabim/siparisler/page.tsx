import type { Metadata } from 'next';
import Link from 'next/link';
import EmptyState from '@/components/EmptyState';
import { getMyOrders } from '@/lib/account';
import { formatDate, formatPrice } from '@/lib/format';
import { routes } from '@/lib/site';
import type { OrderStatus } from '@/lib/types';
import AccountShell from '../AccountShell';

export const metadata: Metadata = { title: 'Siparişlerim', robots: { index: false, follow: false } };

/** Durum rozetleri — tasarımın renk eşlemesi. */
const STATUS: Record<OrderStatus, { label: string; className: string }> = {
    payment_pending: { label: 'Ödeme bekliyor', className: 'badge-amber' },
    confirmed: { label: 'Onaylandı', className: 'badge-teal' },
    preparing: { label: 'Hazırlanıyor', className: 'badge-plum' },
    shipped: { label: 'Yolda', className: 'badge-accent' },
    delivered: { label: 'Teslim edildi', className: 'badge-teal' },
    cancelled: { label: 'İptal', className: 'badge-neutral' },
    refunded: { label: 'İade edildi', className: 'badge-neutral' },
};

export default async function OrdersPage() {
    const { items } = await getMyOrders();

    return (
        <AccountShell active={routes.accountOrders} title="Siparişlerim" description={`${items.length} sipariş`}>
            {items.length === 0 ? (
                <EmptyState
                    where="Siparişler"
                    color="amber"
                    title="Henüz sipariş vermedin"
                    description="İlk siparişinde kullanabileceğin ILKALIS10 kuponu hesabında hazır."
                    action={<Link href={routes.home} className="btn-secondary">Alışverişe başla</Link>}
                />
            ) : (
                <div className="space-y-2.5">
                    {items.map((order) => (
                        <article key={order.orderNumber} className="card p-[16px_18px]">
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                <div>
                                    <span className="text-[11.5px] text-slate-600">Sipariş</span>
                                    <span className="block font-mono text-[13.5px] font-bold">{order.orderNumber}</span>
                                </div>
                                <div>
                                    <span className="text-[11.5px] text-slate-600">Tarih</span>
                                    <span className="block text-[13.5px]">{formatDate(order.placedAt)}</span>
                                </div>
                                <div>
                                    <span className="text-[11.5px] text-slate-600">Tutar</span>
                                    <span className="price block text-[14px]">{formatPrice(order.grandTotal)}</span>
                                </div>
                                <span className={`badge ml-auto ${STATUS[order.status].className}`}>
                                    {STATUS[order.status].label}
                                </span>
                            </div>

                            {order.trackingNumber && (
                                <p className="mt-2.5 border-t border-slate-900/7 pt-2.5 text-[12.5px] text-slate-600">
                                    {order.carrier} · Takip no {order.trackingNumber}
                                </p>
                            )}

                            <div className="mt-3 flex flex-wrap gap-2">
                                <Link href={routes.accountOrder(order.orderNumber)} className="btn-secondary btn-sm">
                                    Detay
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </AccountShell>
    );
}
