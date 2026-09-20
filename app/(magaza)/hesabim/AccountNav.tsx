import Link from 'next/link';
import { CATEGORY_COLOR } from '@/lib/colors';
import { getSettings } from '@/lib/api';
import { routes } from '@/lib/site';
import { logoutAction } from '@/app/(magaza)/giris/actions';

/** Hesabım kenar çubuğu. Dokuz bölüm, her biri kendi renk noktasıyla. */
export const SECTIONS = [
    { href: routes.accountOrders, label: 'Siparişlerim', color: 'berry' },
    { href: routes.addresses, label: 'Adreslerim', color: 'plum' },
    { href: routes.favorites, label: 'Favorilerim', color: 'rose' },
    { href: routes.accountPoints, label: 'Kuponlarım', color: 'amber' },
    { href: routes.accountReviews, label: 'Yorumlarım', color: 'teal' },
    { href: routes.accountReturns, label: 'İade taleplerim', color: 'plum' },
    { href: routes.accountNotifications, label: 'Bildirim tercihleri', color: 'teal' },
    { href: routes.accountSecurity, label: 'Hesap güvenliği', color: 'amber' },
    { href: routes.accountPrivacy, label: 'Gizlilik modu', color: 'berry' },
] as const;

export default async function AccountNav({ active }: { active: string }) {
    // Puan sistemi kapalıyken menü "puanlarım" dememeli: olmayan bir programı
    // varmış gibi göstermek, en çok destek çağrısı üreten şey.
    const settings = await getSettings();
    const pointsOn = settings['puan.aktif'] === true;

    return (
        <nav className="card card-xl p-3" aria-label="Hesabım">
            <ul className="space-y-0.5">
                {SECTIONS.map((section) => {
                    const isActive = active === section.href;
                    return (
                        <li key={section.href}>
                            <Link
                                href={section.href}
                                aria-current={isActive ? 'page' : undefined}
                                className={`flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2.5 text-[13.5px] transition-colors ${
                                    isActive ? 'bg-slate-900 font-bold text-on-dark' : 'text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <span className={`dot ${isActive ? 'bg-on-dark' : CATEGORY_COLOR[section.color].dot}`} />
                                {section.href === routes.accountPoints && pointsOn ? 'Kupon / puanlarım' : section.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>

            <div className="hr" />

            <form action={logoutAction}>
                <button type="submit" className="w-full px-3 py-2 text-left text-[13.5px] text-slate-600 transition-colors hover:text-accent-500">
                    Çıkış yap
                </button>
            </form>
        </nav>
    );
}
