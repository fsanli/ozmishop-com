/**
 * Sayfa kapsayıcısı. v2'de mağaza 1400px, günlük/rehber 1240px genişlikte durur;
 * yatay boşluk her ikisinde clamp(16px, 4vw, 44px).
 *
 * 17 ayrı `max-w-7xl` yerine tek yer: genişlik değişince tüm site birlikte değişir.
 */
export default function Container({
    children,
    narrow = false,
    className = '',
    as: Tag = 'div',
}: {
    children: React.ReactNode;
    narrow?: boolean;
    className?: string;
    as?: 'div' | 'section' | 'header' | 'footer' | 'nav' | 'main';
}) {
    return (
        <Tag
            className={`mx-auto w-full px-[clamp(16px,4vw,44px)] ${narrow ? 'max-w-[1240px]' : 'max-w-[1400px]'} ${className}`}
        >
            {children}
        </Tag>
    );
}
