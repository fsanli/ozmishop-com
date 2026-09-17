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

export const HeartIcon = (p: IconProps) => (
    <svg {...base(p, 1.7)}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
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

export const StarIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
        <path d="m12 2 3 6.6 7 .9-5.1 4.8 1.3 7L12 18l-6.2 3.3 1.3-7L2 9.5l7-.9Z" />
    </svg>
);
