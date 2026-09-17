'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { colorsOf } from '@/lib/colors';
import { routes } from '@/lib/site';
import type { Category } from '@/lib/types';

/**
 * Mobil menü — kategori ağacı iki seviye; üçüncü seviye kategori sayfasında görünür.
 *
 * Panel body'ye portal ile basılır. Sebebi: başlıkta `backdrop-blur` var ve
 * backdrop-filter, `position: fixed` alt öğeler için KAPSAYICI BLOK oluşturur.
 * Menü başlığın içinde kalırsa `inset-0` viewport'a değil 145px'lik başlığa göre
 * çözülür ve panel o yüksekliğe hapsolur.
 */
export default function MobileMenu({ categories }: { categories: Category[] }) {
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState<number | null>(null);

    // Menü açıkken arka planın kaymasını engelle.
    useEffect(() => {
        if (!open) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, [open]);

    // Esc ile kapansın.
    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    const panel = (
        <div className="fixed inset-0 z-[60] md:hidden">
            <div className="absolute inset-0 bg-ink-block/50" onClick={() => setOpen(false)} aria-hidden />
            <nav className="absolute left-0 top-0 flex h-full w-80 max-w-[85vw] flex-col overflow-y-auto overscroll-contain bg-paper">
                <div className="sticky top-0 flex items-center justify-between border-b border-slate-900/8 bg-surface px-4 py-3.5">
                    <span className="font-display text-base font-semibold tracking-[-0.03em]">Kategoriler</span>
                    <button type="button" onClick={() => setOpen(false)} aria-label="Menüyü kapat" className="grid size-[34px] place-items-center rounded-[var(--radius-md)] border border-slate-900/12 text-slate-900 transition-colors hover:border-slate-900">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path d="m6 6 12 12M18 6 6 18" />
                        </svg>
                    </button>
                </div>

                <ul className="flex-1 p-2">
                    {categories.map((category) => (
                        <li key={category.id} className="border-b border-slate-900/7 last:border-0">
                            <div className="flex items-center">
                                <Link
                                    href={routes.category(category.slug)}
                                    onClick={() => setOpen(false)}
                                    className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-3.5 text-sm font-medium text-slate-900"
                                >
                                    <span className={`dot ${colorsOf(category).dot}`} />
                                    {category.name}
                                </Link>
                                {category.children && category.children.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setExpanded(expanded === category.id ? null : category.id)}
                                        aria-label={`${category.name} alt kategorileri`}
                                        aria-expanded={expanded === category.id}
                                        className="shrink-0 p-3 text-slate-500"
                                    >
                                        <svg
                                            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                            className={expanded === category.id ? 'rotate-180 transition' : 'transition'}
                                            aria-hidden
                                        >
                                            <path d="m6 9 6 6 6-6" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            {expanded === category.id && category.children && (
                                <ul className="pb-2 pl-4">
                                    {category.children.map((child) => (
                                        <li key={child.id}>
                                            <Link
                                                href={routes.category(child.slug)}
                                                onClick={() => setOpen(false)}
                                                className="block px-3 py-2.5 text-[13.5px] text-slate-600 transition-colors hover:text-accent-500"
                                            >
                                                {child.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                    <li className="mt-2 border-t border-slate-900/8 pt-2">
                        <Link href={routes.brands} onClick={() => setOpen(false)} className="block px-3 py-3.5 text-sm font-medium text-slate-900">
                            Markalar
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Menüyü aç"
                className="grid size-[42px] shrink-0 place-items-center rounded-[var(--radius-md)] text-slate-900 transition-colors hover:bg-slate-200 md:hidden"
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {open && createPortal(panel, document.body)}
        </>
    );
}
