import Link from 'next/link';

/** Tüm anasayfa bölümleri aynı kabuğu kullanır: ortak genişlik, başlık ve aksiyon linki. */
export default function SectionShell({
    title,
    subtitle,
    actionHref,
    actionLabel,
    children,
    className = '',
}: {
    title?: string | null;
    subtitle?: string | null;
    actionHref?: string;
    actionLabel?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section className={`mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 ${className}`}>
            {(title || actionHref) && (
                <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
                    <div>
                        {title && <h2 className="heading-2">{title}</h2>}
                        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
                    </div>
                    {actionHref && (
                        <Link href={actionHref} className="text-sm font-medium text-brand-600 hover:underline">
                            {actionLabel || 'Tümünü gör'} →
                        </Link>
                    )}
                </div>
            )}
            {children}
        </section>
    );
}
