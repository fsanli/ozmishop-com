/**
 * Elle yazılmış Lucide biçimli ikonlar. Tasarım dosyalarındaki SVG'lerin aynısı.
 * Hazır ikon kütüphanesi kurulmaz — üç üretim bağımlılığı kuralı (bkz. README).
 *
 * Ortak sözleşme: viewBox 0 0 24 24, fill=none, stroke=currentColor, yuvarlak uç.
 * Kalınlık gezinme ikonlarında 1.7–1.9, ok/çarpıda 2.0–2.4, tikte 3–3.5.
 */

interface IconProps {
    className?: string;
    /** Varsayılanı ezmek gerekirse */
    strokeWidth?: number;
}

const base = (props: IconProps, strokeWidth: number) => ({
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: props.strokeWidth ?? strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: props.className,
    'aria-hidden': true,
});

export const ArrowRightIcon = (p: IconProps) => (
    <svg {...base(p, 2.2)}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
);

export const ChevronRightIcon = (p: IconProps) => (
    <svg {...base(p, 2.4)}><path d="m9 18 6-6-6-6" /></svg>
);

export const ChevronDownIcon = (p: IconProps) => (
    <svg {...base(p, 2.2)}><path d="m6 9 6 6 6-6" /></svg>
);

export const SearchIcon = (p: IconProps) => (
    <svg {...base(p, 1.9)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);

export const UserIcon = (p: IconProps) => (
    <svg {...base(p, 1.7)}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

/** `filled`: favorideyken içi dolu. Ortak sözleşmenin tek istisnası. */
export const HeartIcon = (p: IconProps & { filled?: boolean }) => (
    <svg {...base(p, 1.7)} fill={p.filled ? 'currentColor' : 'none'}>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
);

export const BagIcon = (p: IconProps) => (
    <svg {...base(p, 1.8)}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
);

export const LockIcon = (p: IconProps) => (
    <svg {...base(p, 1.8)}><rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);

export const EyeOffIcon = (p: IconProps) => (
    <svg {...base(p, 1.8)}>
        <path d="M10.7 5.1A10.9 10.9 0 0 1 12 5c7 0 10 7 10 7a13.2 13.2 0 0 1-1.7 2.7" />
        <path d="M6.6 6.6A13.5 13.5 0 0 0 2 12s3 7 10 7a10.9 10.9 0 0 0 5.4-1.4" />
        <path d="M14.1 14.1a3 3 0 1 1-4.2-4.2" /><path d="m2 2 20 20" />
    </svg>
);

export const XIcon = (p: IconProps) => (
    <svg {...base(p, 2.2)}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);

export const CheckIcon = (p: IconProps) => (
    <svg {...base(p, 3)}><path d="M20 6 9 17l-5-5" /></svg>
);

export const PlusIcon = (p: IconProps) => (
    <svg {...base(p, 2.2)}><path d="M12 5v14" /><path d="M5 12h14" /></svg>
);

export const MinusIcon = (p: IconProps) => (
    <svg {...base(p, 2.2)}><path d="M5 12h14" /></svg>
);

export const AlertTriangleIcon = (p: IconProps) => (
    <svg {...base(p, 1.9)}>
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" /><path d="M12 17h.01" />
    </svg>
);

export const MenuIcon = (p: IconProps) => (
    <svg {...base(p, 1.9)}><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></svg>
);

export const ChevronLeftIcon = (p: IconProps) => (
    <svg {...base(p, 2.2)}><path d="m15 18-6-6 6-6" /></svg>
);

/**
 * WhatsApp. Ortak sözleşmenin DIŞINDA: marka logosu dolgu (fill) ile çizilir,
 * çizgi ikonuna çevirmek tanınmaz hale getirir. `currentColor` korunuyor ki
 * buton rengiyle uyumlu kalsın.
 */
export const WhatsappIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.69 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.98-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.09-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z" />
    </svg>
);

export const StarIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
        <path d="m12 2 3 6.6 7 .9-5.1 4.8 1.3 7L12 18l-6.2 3.3 1.3-7L2 9.5l7-.9Z" />
    </svg>
);
