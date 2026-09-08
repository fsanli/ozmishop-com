'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
        <div className="fixed inset-0 z-[60] lg:hidden">
            <div className="absolute inset-0 bg-brand-900/50" onClick={() => setOpen(false)} aria-hidden />
            <nav className="absolute left-0 top-0 flex h-full w-80 max-w-[85vw] flex-col overflow-y-auto overscroll-contain bg-white shadow-xl">
                <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white p-4">
                    <span className="font-bold text-brand-700">Kategoriler</span>
                    <button type="button" onClick={() => setOpen(false)} aria-label="Menüyü kapat" className="rounded-md p-1 text-slate-500">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path d="m6 6 12 12M18 6 6 18" />
                        </svg>
                    </button>
                </div>

                <ul className="flex-1 p-2">
                    {categories.map((category) => (
                        <li key={category.id} className="border-b border-slate-50 last:border-0">
                            <div className="flex items-center">
                                <Link
                                    href={routes.category(category.slug)}
                                    onClick={() => setOpen(false)}
                                    className="min-w-0 flex-1 px-3 py-3 text-sm font-medium text-slate-800"
                                >
                                    {category.name}
                                </Link>
                                {category.children && category.children.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setExpanded(expanded === category.id ? null : category.id)}
                                        aria-label={`${category.name} alt kategorileri`}
                                        aria-expanded={expanded === category.id}
                                        className="shrink-0 p-3 text-slate-400"
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
                                                className="block px-3 py-2 text-sm text-slate-600"
                                            >
                                                {child.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                    <li className="mt-2 border-t border-slate-100 pt-2">
                        <Link href={routes.brands} onClick={() => setOpen(false)} className="block px-3 py-3 text-sm font-medium text-slate-800">
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
                className="rounded-md p-2 text-slate-700 lg:hidden"
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {open && createPortal(panel, document.body)}
        </>
    );
}
