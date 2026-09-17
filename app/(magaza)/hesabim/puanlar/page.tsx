import type { Metadata } from 'next';
import { getMyPoints } from '@/lib/account';
import { formatDate, formatPrice } from '@/lib/format';
import { routes } from '@/lib/site';
import AccountShell from '../AccountShell';

export const metadata: Metadata = { title: 'Puanlarım', robots: { index: false, follow: false } };

const REASONS: Record<string, string> = {
    order: 'Sipariş',
    review: 'Değerlendirme',
    refund: 'İade',
    redeem: 'Harcama',
    expire: 'Süre doldu',
    manual: 'Elle düzeltme',
};

export default async function PointsPage() {
    const points = await getMyPoints();

    return (
        <AccountShell active={routes.accountPoints} title="Kupon ve puanlarım">
            <div className="card card-xl card-edge-top border-t-amber-dot p-[clamp(20px,3vw,28px)]">
                <span className="text-[12px] font-bold text-slate-600">Kullanılabilir puan</span>
                <div className="price mt-2 text-[46px] leading-none tracking-[-0.05em]">{points.balance}</div>
                <p className="mt-3 text-[13px] text-slate-600">
                    100 puan = 10 ₺ · şu an {formatPrice(points.valueInLira)} değerinde
                    {points.expiringSoon > 0 && points.nextExpiry && (
                        <> · <strong className="font-bold text-slate-900">{points.expiringSoon} puan</strong> {formatDate(points.nextExpiry)} tarihinde sona eriyor</>
                    )}
                </p>
            </div>

            {points.entries.length > 0 && (
                <div className="card mt-4 px-[22px] py-1.5">
                    {points.entries.map((entry) => (
                        <div key={entry.id} className="flex items-baseline justify-between gap-3 border-b border-slate-900/7 py-3 last:border-0">
                            <span className="min-w-0 text-[13.5px]">
                                <span className="block font-semibold">{REASONS[entry.reason] ?? entry.reason}</span>
                                <span className="text-slate-600">
                                    {entry.note || entry.orderNumber || ''}
                                    {entry.note && entry.orderNumber ? ` · ${entry.orderNumber}` : ''}
                                </span>
                            </span>
                            <span className="shrink-0 text-right">
                                <span className={`price text-[15px] ${entry.points > 0 ? 'text-teal-ink' : 'text-slate-600'}`}>
                                    {entry.points > 0 ? '+' : ''}{entry.points}
                                </span>
                                <span className="block text-[11.5px] text-slate-600">{formatDate(entry.createdAt)}</span>
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </AccountShell>
    );
}
