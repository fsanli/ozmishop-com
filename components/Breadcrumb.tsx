import Link from 'next/link';

export default function Breadcrumb({ items }: { items: { name: string; href: string }[] }) {
    return (
        <nav aria-label="Sayfa yolu" className="mb-4 flex flex-wrap items-center gap-1 text-xs text-slate-500">
            <Link href="/" className="hover:text-brand-600">Anasayfa</Link>
            {items.map((item, index) => (
                <span key={item.href} className="flex items-center gap-1">
                    <span aria-hidden className="text-slate-300">/</span>
                    {index === items.length - 1 ? (
                        <span className="text-slate-700">{item.name}</span>
                    ) : (
                        <Link href={item.href} className="hover:text-brand-600">{item.name}</Link>
                    )}
                </span>
            ))}
        </nav>
    );
}
