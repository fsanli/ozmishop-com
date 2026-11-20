import Link from 'next/link';
import Container from '@/components/Container';
import type { ColorKey } from '@/lib/colors';
import { CATEGORY_COLOR } from '@/lib/colors';

/**
 * Tüm anasayfa bölümlerinin ortak kabuğu.
 * v2 başlık düzeni: renkli kicker + büyük başlık solda, çerçeveli "tümünü gör"
 * düğmesi sağda. Kicker rengi bölümün konusunu işaret eder.
 */
export default function SectionShell({
    title,
    subtitle,
    kicker,
    color = 'berry',
    actionHref,
    actionLabel,
    actions,
    children,
    className = '',
}: {
    title?: string | null;
    subtitle?: string | null;
    kicker?: string;
    color?: ColorKey;
    actionHref?: string;
    actionLabel?: string;
    /** "Tümünü gör"ün yanına ek kontroller (ör. şerit okları). */
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    const colors = CATEGORY_COLOR[color];

    return (
        <Container as="section" className={`pt-[clamp(30px,4vw,54px)] ${className}`}>
            {(title || actionHref || actions) && (
                <div className="mb-[18px] flex flex-wrap items-end justify-between gap-4">
                    <div className="min-w-0">
                        {kicker && <span className={`kicker ${colors.ink}`}>{kicker}</span>}
                        {title && <h2 className={`heading-2 ${kicker ? 'mt-2.5' : ''}`}>{title}</h2>}
                        {subtitle && <p className="mt-2 max-w-[58ch] text-[14.5px] leading-relaxed text-slate-600">{subtitle}</p>}
                    </div>
                    {(actionHref || actions) && (
                        <div className="flex shrink-0 items-center gap-3">
                            {actions}
                            {actionHref && (
                                <Link
                                    href={actionHref}
                                    className="btn-secondary shrink-0 px-[18px] py-[11px] text-[13.5px] font-bold"
                                >
                                    {actionLabel || 'Tümünü gör'}
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            )}
            {children}
        </Container>
    );
}
