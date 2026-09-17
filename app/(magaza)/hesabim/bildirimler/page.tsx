import type { Metadata } from 'next';
import Link from 'next/link';
import { getMyNotifications } from '@/lib/account';
import { one, type SearchParams } from '@/lib/listing';
import { routes } from '@/lib/site';
import AccountShell from '../AccountShell';
import Switch from '../Switch';
import { toggleNotificationAction } from '../actions';

export const metadata: Metadata = { title: 'Bildirim tercihleri', robots: { index: false, follow: false } };

const ROWS = [
    {
        key: 'orderUpdates',
        dot: 'bg-accent-500',
        title: 'Sipariş bildirimleri',
        body: 'Hazırlanma, kargoya veriliş ve teslimat. Nötr e-posta konusu açıkken yalnızca sipariş numarası yazar.',
    },
    {
        key: 'backInStock',
        dot: 'bg-teal-dot',
        title: 'Stoğa girdi',
        body: 'Favorilerindeki tükenmiş bir ürün tekrar stoğa girince tek bir e-posta.',
    },
    {
        key: 'priceDrop',
        dot: 'bg-amber-dot',
        title: 'Fiyat düştü',
        body: 'Favorilerindeki bir ürün indirime girdiğinde haber verilir.',
    },
    {
        key: 'journalDigest',
        dot: 'bg-plum-dot',
        title: 'Günlük bülteni',
        body: 'Ayda bir, Günlük’deki yeni yazıların özeti.',
    },
] as const;

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const [prefs, params] = await Promise.all([getMyNotifications(), searchParams]);
    const error = one(params.hata);

    return (
        <AccountShell
            active={routes.accountNotifications}
            title="Bildirim tercihleri"
            description="Hangi e-postaları alacağını sen seçersin. Sipariş bildirimleri dışındakiler istediğin an kapanır."
        >
            {error && (
                <p role="alert" className="mb-4 rounded-[var(--radius-md)] bg-accent-200 px-4 py-3 text-[13.5px] font-semibold text-accent-500">
                    {error}
                </p>
            )}

            <div className="card px-[22px] py-1.5">
                {ROWS.map((row) => (
                    <div key={row.key} className="flex items-start gap-3 border-b border-slate-900/7 py-4 last:border-0">
                        <span className={`dot-lg dot mt-1.5 ${row.dot}`} />
                        <div className="min-w-0 flex-1">
                            <h3 className="text-[15px] font-bold">{row.title}</h3>
                            <p className="mt-1 max-w-[64ch] text-[13px] leading-relaxed text-slate-600">{row.body}</p>
                        </div>
                        <Switch action={toggleNotificationAction} name={row.key} on={prefs[row.key]} label={row.title} />
                    </div>
                ))}
            </div>

            <p className="mt-4 text-[12.5px] leading-relaxed text-slate-600">
                Kampanya e-postaları ayrı bir ayar:{' '}
                <Link href={routes.accountPrivacy} className="link">Gizlilik modu</Link> sayfasından yönetilir.
            </p>
        </AccountShell>
    );
}
