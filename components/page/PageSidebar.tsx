import Link from 'next/link';
import { getPagesGrouped } from '@/lib/api';
import { routes } from '@/lib/site';

/**
 * Statik sayfa gezintisi — sözleşmeler, yardım ve kurumsal sayfalar.
 *
 * Var olma sebebi: sözleşmeler arasında dolaşmak için her seferinde sayfanın
 * dibindeki footer'a inip oradan seçmek gerekiyordu. Müşteri mesafeli satış
 * sözleşmesinden gizlilik politikasına geçerken iki kez kaydırmak zorunda
 * kalmasın.
 *
 * Gruplar ve sıra API'den geliyor (`/pages`), vitrinde liste tutulmuyor.
 * Sunucu bileşeni, sıfır JS.
 *
 * MOBİLDE <details>: kenar çubuğu dar ekranda içeriği aşağı iter, o yüzden
 * kapalı bir açılır olur. `open` verilmiyor — kullanıcı sayfayı okumaya
 * gelmiş, gezinmeye değil.
 */
export default async function PageSidebar({ current }: { current: string }) {
    // `groups ?? []`: bkz. Footer — eski şekilli önbellek kaydı dağıtımdan
    // sağ çıkabiliyor. Grup yoksa kenar çubuğu hiç çizilmez, sayfa çalışır.
    const { items = [], groups = [] } = await getPagesGrouped();
    if (items.length < 2 || groups.length === 0) return null;

    const sections = groups
        .map((group) => ({ ...group, pages: items.filter((page) => page.group === group.key) }))
        .filter((group) => group.pages.length > 0);

    const list = (
        <nav aria-label="Sayfalar" className="space-y-4">
            {sections.map((section) => (
                <div key={section.key}>
                    <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                        {section.label}
                    </h2>
                    <ul className="space-y-0.5">
                        {section.pages.map((page) => {
                            const active = page.slug === current;
                            return (
                                <li key={page.slug}>
                                    <Link
                                        href={routes.page(page.slug)}
                                        // aria-current: ekran okuyucu hangi sayfada olduğunu
                                        // renkten değil işaretten anlamalı.
                                        aria-current={active ? 'page' : undefined}
                                        className={`block rounded-[9px] px-2.5 py-1.5 text-[13.5px] leading-snug transition-colors ${
                                            active
                                                ? 'bg-accent-500/10 font-bold text-accent-500'
                                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                    >
                                        {page.title}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
        </nav>
    );

    return (
        <>
            <aside className="hidden w-[220px] shrink-0 lg:block">
                <div className="sticky top-[92px]">{list}</div>
            </aside>

            <details className="card mb-4 w-full p-3 lg:hidden">
                <summary className="cursor-pointer list-none text-[13.5px] font-bold text-slate-900">
                    Diğer sayfalar
                </summary>
                <div className="mt-3">{list}</div>
            </details>
        </>
    );
}
