'use client';

import Link from 'next/link';
import {
    useCallback, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore,
} from 'react';
import { ChevronDownIcon } from '@/components/icons';

/**
 * Masaüstü kategori açılır menüsü (S06). Yalnız `md+` ve fareli cihazda üzerine
 * gelince açılır; klavyeyle yandaki ok düğmesinden açılır (WAI "disclosure
 * navigation" kalıbı: üst bağlantı normal bağlantı olarak çalışmaya devam eder).
 *
 *   - Fare alt menüye geçerken kapanmasın diye kısa kapanma gecikmesi ve panelin
 *     üstündeki boşluk (köprü) var.
 *   - Escape kapatır ve odağı düğmeye döndürür; dış tıklama ve odak dışarı çıkınca kapanır.
 *   - Sayfa Activity ile gizlenince kapanır (Next kılavuzu: geçici açık durum
 *     geri dönüşte açık kalmasın).
 *   - Mobilde HİÇ açılmaz: mevcut sol menü yeterli, hover mantığı telefona taşınmaz.
 */
const HOVER_QUERY = '(hover: hover) and (min-width: 768px)';

const subscribe = (callback: () => void) => {
    const media = window.matchMedia(HOVER_QUERY);
    media.addEventListener('change', callback);
    return () => media.removeEventListener('change', callback);
};

export interface NavDropdownLink { href: string; label: string }

export default function NavDropdown({
    href, label, openInNew, items, children,
}: {
    href: string;
    label: string;
    openInNew: boolean;
    items: NavDropdownLink[];
    /** Üst bağlantının içeriği (renk noktası, etiket, rozet) — sunucudan. */
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const canHover = useSyncExternalStore(subscribe, () => window.matchMedia(HOVER_QUERY).matches, () => false);
    const rootRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const closeTimer = useRef<number | null>(null);
    const panelId = useId();

    const cancelClose = () => {
        if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
        closeTimer.current = null;
    };
    const close = useCallback(() => {
        cancelClose();
        setOpen(false);
    }, []);

    useLayoutEffect(() => () => {
        cancelClose();
        setOpen(false);
    }, []);

    useEffect(() => {
        if (!open) return undefined;
        const onPointerDown = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) close();
        };
        // Escape belge düzeyinde: fareyle açılan menüde odak menünün içinde değil
        // (WebKit/Firefox'ta tuş olayı kök öğeye hiç ulaşmıyordu).
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            const focusInside = rootRef.current?.contains(document.activeElement);
            close();
            if (focusInside) buttonRef.current?.focus();
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, close]);

    return (
        <div
            ref={rootRef}
            className="relative flex shrink-0 items-center gap-0.5"
            onPointerEnter={(event) => {
                if (!canHover || event.pointerType === 'touch') return;
                cancelClose();
                setOpen(true);
            }}
            onPointerLeave={(event) => {
                if (!canHover || event.pointerType === 'touch') return;
                cancelClose();
                closeTimer.current = window.setTimeout(() => setOpen(false), 180);
            }}
            onBlur={(event) => {
                if (!rootRef.current?.contains(event.relatedTarget as Node | null)) close();
            }}
        >
            <Link
                href={href}
                {...(openInNew ? { target: '_blank', rel: 'noreferrer' } : {})}
                onClick={close}
                className="inline-flex items-center gap-2 whitespace-nowrap text-[13.5px] font-medium text-slate-700 transition-colors hover:text-accent-500"
            >
                {children}
            </Link>
            <button
                ref={buttonRef}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                aria-label={`${label} alt kategorilerini ${open ? 'gizle' : 'göster'}`}
                onClick={() => setOpen((value) => !value)}
                className="hidden size-6 place-items-center rounded-full text-slate-500 transition-colors hover:text-accent-500 focus-visible:outline-2 focus-visible:outline-accent-500 md:grid"
            >
                <ChevronDownIcon className={`size-3.5 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* `pt-2`: bağlantıdan panele geçerken fare boşluğa düşüp menüyü kapatmasın. */}
            <div id={panelId} hidden={!open} className="absolute left-0 top-full z-40 hidden pt-2 md:block">
                <ul className="min-w-[230px] rounded-[14px] border border-slate-900/10 bg-surface p-1.5 shadow-[0_14px_40px_rgba(26,20,24,0.14)]">
                    {items.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                onClick={close}
                                className="block rounded-[10px] px-3 py-2.5 text-[13.5px] text-slate-700 transition-colors hover:bg-shelf hover:text-accent-500 focus-visible:bg-shelf"
                            >
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
