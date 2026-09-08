import Image from 'next/image';
import Link from 'next/link';
import { routes } from '@/lib/site';
import type { BrandSummary } from '@/lib/types';
import SectionShell from './SectionShell';

export default function BrandStrip({ brands, title }: { brands: BrandSummary[]; title?: string | null }) {
    if (!brands.length) return null;

    return (
        <SectionShell title={title} actionHref={routes.brands} actionLabel="Tüm markalar">
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                {brands.map((brand) => (
                    <Link
                        key={brand.id}
                        href={routes.brand(brand.slug)}
                        className="card card-hover flex h-20 w-36 shrink-0 flex-col items-center justify-center gap-1 px-3"
                    >
                        {brand.logo ? (
                            <Image src={brand.logo.url} alt={brand.name} width={100} height={32} className="h-8 w-auto object-contain" />
                        ) : (
                            <span className="text-sm font-semibold text-slate-700">{brand.name}</span>
                        )}
                        <span className="text-xs text-slate-400">{brand.activeProductCount} ürün</span>
                    </Link>
                ))}
            </div>
        </SectionShell>
    );
}
