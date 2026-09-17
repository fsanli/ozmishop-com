import Link from 'next/link';
import { routes } from '@/lib/site';

/**
 * Kelime markası. Nokta bordo; koyu zeminde (footer, 18+ modalı) accent-300'e
 * açılır — accent-500 koyu blokta okunmuyor.
 */
export default function Logo({
    className = '',
    onDark = false,
    href = routes.home as string,
}: {
    className?: string;
    onDark?: boolean;
    href?: string | null;
}) {
    const content = (
        <>
            ozmishop
            <span className={onDark ? 'text-accent-300' : 'text-accent-500'}>.</span>
        </>
    );
    const classes = `font-display font-bold leading-none tracking-[-0.035em] ${className}`;

    if (!href) return <span className={classes}>{content}</span>;
    return <Link href={href} className={classes}>{content}</Link>;
}
