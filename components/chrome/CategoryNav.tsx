import Link from 'next/link';
import { CATEGORY_COLOR, colorsOf } from '@/lib/colors';
import { getMenu } from '@/lib/api';
import { routes, safeLink } from '@/lib/site';
import type { Category, MenuItem } from '@/lib/types';
import NavDropdown, { type NavDropdownLink } from './NavDropdown';

/** Ağaçta slug ile kategori (header ağacı zaten yüklü, ek istek yok). */
const findCategory = (tree: Category[], slug: string): Category | null => {
    for (const category of tree) {
        if (category.slug === slug) return category;
        const found = findCategory(category.children ?? [], slug);
        if (found) return found;
    }
    return null;
};

/** Görünürlük kuralı kategori sayfasının alt kategori şeridiyle AYNI. */
const categoryLinks = (category: Category | null): NavDropdownLink[] => (category?.children ?? [])
    .filter((child) => child.activeProductCount > 0)
    .map((child) => ({ href: routes.category(child.slug), label: child.name }));

/**
 * Açılır menünün alt bağlantıları (S06): önce panelde menü öğesine eklenmiş alt
 * öğeler; yoksa öğe bir kategoriye gidiyorsa o kategorinin alt kategorileri.
 * Alt kategorisi olmayan öğede açılır panel ve ok hiç çizilmez.
 */
const childrenOf = (item: MenuItem, href: string, tree: Category[]): NavDropdownLink[] => {
    const own = (item.children ?? [])
        .map((child) => ({ href: safeLink(child.url), label: child.label }))
        .filter((child): child is NavDropdownLink => Boolean(child.href));
    if (own.length) return own;
    const match = /^\/kategori\/([a-z0-9-]+)\/?$/.exec(href.split('?')[0]);
    return match ? categoryLinks(findCategory(tree, match[1])) : [];
};

/**
 * Header altındaki şerit. Kaynağı PANELDEKİ `header` MENÜSÜ: sıra, renk noktası
 * ve rozet editörün kararı — "tüm kök kategoriler" bunları taşıyamaz.
 *
 * Menü boşsa kök kategorilere düşer: yeni bir kurulumda header boş kalmamalı.
 *
 * Dar ekranda yatay kaydırır — tasarımda mobil çekmece çizilmemiş, kaydırma
 * bilinçli tercih (HANDOFF "bilinen boşluklar"). Masaüstünde alt kategorisi
 * olan öğe açılır menü taşır (NavDropdown); mobil davranış değişmedi.
 */
export default async function CategoryNav({ categories }: { categories: Category[] }) {
    const menu = await getMenu('header');

    const items = menu.items.length > 0
        // safeLink null dönerse kalem atlanır: panelden gelen bağlantı site
        // dışına çıkamaz, geçersiz bir adres de header'ı bozamaz.
        ? menu.items
            .map((item) => {
                const href = safeLink(item.url);
                return {
                    key: `menu-${item.id}`,
                    href,
                    label: item.label,
                    dot: item.colorKey ? CATEGORY_COLOR[item.colorKey].dot : null,
                    badge: item.badge,
                    openInNew: item.openInNew,
                    links: href ? childrenOf(item, href, categories) : [],
                };
            })
            .filter((item): item is typeof item & { href: string } => Boolean(item.href))
        : categories.map((category) => ({
            key: `cat-${category.id}`,
            href: `/kategori/${category.slug}`,
            label: category.name,
            dot: colorsOf(category).dot,
            badge: null as string | null,
            openInNew: false,
            links: categoryLinks(category),
        }));

    if (items.length === 0) return null;

    const content = (item: (typeof items)[number]) => (
        <>
            {item.dot && <span className={`dot ${item.dot}`} />}
            {item.label}
            {item.badge && (
                <span className="rounded-full bg-accent-200 px-2 py-px text-[10.5px] font-bold text-accent-500">
                    {item.badge}
                </span>
            )}
        </>
    );

    return (
        <nav aria-label="Kategoriler" className="border-t border-slate-900/8">
            {/* md+: taşma görünür — açılır panel kaydırma kabında kırpılmasın. */}
            <div className="no-scrollbar mx-auto flex w-full max-w-[1400px] items-center gap-5 overflow-x-auto px-[clamp(16px,4vw,44px)] py-2.5 md:overflow-visible">
                {items.map((item) => (item.links.length > 0 ? (
                    <NavDropdown key={item.key} href={item.href} label={item.label} openInNew={item.openInNew} items={item.links}>
                        {content(item)}
                    </NavDropdown>
                ) : (
                    <Link
                        key={item.key}
                        href={item.href}
                        {...(item.openInNew ? { target: '_blank', rel: 'noreferrer' } : {})}
                        className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-[13.5px] font-medium text-slate-700 transition-colors hover:text-accent-500"
                    >
                        {content(item)}
                    </Link>
                )))}
            </div>
        </nav>
    );
}
