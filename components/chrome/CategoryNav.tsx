import Link from 'next/link';
import { CATEGORY_COLOR, colorsOf } from '@/lib/colors';
import { getMenu } from '@/lib/api';
import { safeLink } from '@/lib/site';
import type { Category } from '@/lib/types';

/**
 * Header altındaki şerit. Kaynağı PANELDEKİ `header` MENÜSÜ: sıra, renk noktası
 * ve rozet editörün kararı — "tüm kök kategoriler" bunları taşıyamaz.
 *
 * Menü boşsa kök kategorilere düşer: yeni bir kurulumda header boş kalmamalı.
 *
 * Dar ekranda yatay kaydırır — tasarımda mobil çekmece çizilmemiş, kaydırma
 * bilinçli tercih (HANDOFF "bilinen boşluklar").
 */
export default async function CategoryNav({ categories }: { categories: Category[] }) {
    const menu = await getMenu('header');

    const items = menu.items.length > 0
        // safeLink null dönerse kalem atlanır: panelden gelen bağlantı site
        // dışına çıkamaz, geçersiz bir adres de header'ı bozamaz.
        ? menu.items
            .map((item) => ({
                key: `menu-${item.id}`,
                href: safeLink(item.url),
                label: item.label,
                dot: item.colorKey ? CATEGORY_COLOR[item.colorKey].dot : null,
                badge: item.badge,
                openInNew: item.openInNew,
            }))
            .filter((item): item is typeof item & { href: string } => Boolean(item.href))
        : categories.map((category) => ({
            key: `cat-${category.id}`,
            href: `/kategori/${category.slug}`,
            label: category.name,
            dot: colorsOf(category).dot,
            badge: null as string | null,
            openInNew: false,
        }));

    if (items.length === 0) return null;

    return (
        <nav aria-label="Kategoriler" className="border-t border-slate-900/8">
            <div className="no-scrollbar mx-auto flex w-full max-w-[1400px] items-center gap-5 overflow-x-auto px-[clamp(16px,4vw,44px)] py-2.5">
                {items.map((item) => (
                    <Link
                        key={item.key}
                        href={item.href}
                        {...(item.openInNew ? { target: '_blank', rel: 'noreferrer' } : {})}
                        className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-[13.5px] font-medium text-slate-700 transition-colors hover:text-accent-500"
                    >
                        {item.dot && <span className={`dot ${item.dot}`} />}
                        {item.label}
                        {item.badge && (
                            <span className="rounded-full bg-accent-200 px-2 py-px text-[10.5px] font-bold text-accent-500">
                                {item.badge}
                            </span>
                        )}
                    </Link>
                ))}
            </div>
        </nav>
    );
}
