import Link from 'next/link';
import { routes } from '@/lib/site';

/** v2: 12px, ayraçlar soluk, son kırıntı koyu ve kalın. */
export default function Breadcrumb({ items }: { items: { name: string; href: string }[] }) {
    return (
        <nav aria-label="Sayfa yolu" className="flex flex-wrap items-center gap-2 text-[12px] text-slate-600">
            <Link href={routes.home} className="transition-colors hover:text-accent-500">Anasayfa</Link>
            {items.map((item, index) => (
                <span key={item.href} className="flex items-center gap-2">
                    <span aria-hidden className="text-slate-300">/</span>
                    {index === items.length - 1 ? (
                        <span className="font-semibold text-slate-900">{item.name}</span>
                    ) : (
                        <Link href={item.href} className="transition-colors hover:text-accent-500">{item.name}</Link>
                    )}
                </span>
            ))}
        </nav>
    );
}
