import Image from 'next/image';
import Link from 'next/link';
import { ChevronRightIcon } from '@/components/icons';
import { colorsOf } from '@/lib/colors';
import { routes } from '@/lib/site';
import type { Category } from '@/lib/types';
import SectionShell from './SectionShell';

/**
 * Kategori ızgarası. Her kart 4/3 görsel alanı + altında ad/sayı taşır; görselin
 * sol alt köşesindeki kısa renk şeridi kategorinin rengidir.
 */
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
        <SectionShell
            kicker="Kategoriler"
            title={title || 'Ne aradığını biliyorsan'}
            subtitle={subtitle}
            actionHref={routes.home}
            actionLabel="Tüm kategoriler"
        >
            <div className="grid gap-[clamp(10px,1.6vw,16px)] [grid-template-columns:repeat(auto-fill,minmax(min(50%-6px,200px),1fr))]">
                {categories.map((category) => {
                    const colors = colorsOf(category);
                    return (
                        <Link
                            key={category.id}
                            href={routes.category(category.slug)}
                            className="card card-hover group flex flex-col overflow-hidden"
                        >
                            <div className="relative aspect-[4/3] bg-[#f6f2f3]">
                                {category.image ? (
                                    <Image
                                        src={category.image.url}
                                        alt={category.image.alt || category.name}
                                        fill
                                        sizes="(max-width: 640px) 50vw, 25vw"
                                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                                    />
                                ) : (
                                    <span className="absolute inset-0 grid place-items-center text-[11px] font-medium text-slate-400">
                                        Kategori görseli
                                    </span>
                                )}
                                <span className={`absolute bottom-0 left-0 h-[3px] w-[34px] ${colors.dot}`} />
                            </div>
                            <div className="flex items-center gap-2 px-[15px] py-3.5">
                                <div className="min-w-0 flex-1">
                                    <span className="block truncate text-[14px] font-semibold">{category.name}</span>
                                    <span className="block text-[12px] text-slate-600">{category.activeProductCount} ürün</span>
                                </div>
                                <ChevronRightIcon className="size-3.5 shrink-0 text-slate-400 transition-colors group-hover:text-accent-500" />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </SectionShell>
    );
}
