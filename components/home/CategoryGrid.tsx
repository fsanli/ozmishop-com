import Image from 'next/image';
import Link from 'next/link';
import { routes } from '@/lib/site';
import type { Category } from '@/lib/types';
import SectionShell from './SectionShell';

export default function CategoryGrid({
    categories,
    title,
    subtitle,
}: {
    categories: Category[];
    title?: string | null;
    subtitle?: string | null;
}) {
    if (!categories.length) return null;

    return (
        <SectionShell title={title} subtitle={subtitle}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {categories.map((category) => (
                    <Link
                        key={category.id}
                        href={routes.category(category.slug)}
                        className="card card-hover group relative flex aspect-[4/3] items-end overflow-hidden"
                    >
                        {category.image ? (
                            <Image
                                src={category.image.url}
                                alt={category.image.alt || category.name}
                                fill
                                sizes="(max-width: 640px) 50vw, 25vw"
                                className="object-cover transition duration-300 group-hover:scale-105"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-700" />
                        )}
                        <div className="relative w-full bg-gradient-to-t from-brand-900/80 to-transparent p-3">
                            <span className="block text-sm font-semibold text-white">{category.name}</span>
                            <span className="block text-xs text-white/70">{category.activeProductCount} ürün</span>
                        </div>
                    </Link>
                ))}
            </div>
        </SectionShell>
    );
}
