import Link from 'next/link';
import { buildHref, SORT_OPTIONS } from '@/lib/listing';
import type { SearchParams } from '@/lib/listing';

/** Sonuç sayısı + sıralama hapları. Aktif olan koyu dolgu. */
export default function ResultsToolbar({
    total, activeFilters, sort, basePath, searchParams,
}: {
    total: number;
    activeFilters: number;
    sort: string;
    basePath: string;
    searchParams: SearchParams;
}) {
    return (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13.5px] text-slate-600">
                <span className="font-bold text-slate-900">{total}</span> ürün
                {activeFilters > 0 && ` · ${activeFilters} filtre uygulandı`}
            </p>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
                {SORT_OPTIONS.map((option) => (
                    <Link
                        key={option.value}
                        href={buildHref(basePath, searchParams, { sirala: option.value === 'featured' ? undefined : option.value })}
                        className={`btn-pill shrink-0 whitespace-nowrap px-3.5 py-2 text-[12.5px] transition-colors ${
                            sort === option.value
                                ? 'bg-slate-900 font-bold text-on-dark'
                                : 'border border-slate-900/12 hover:border-slate-900'
                        }`}
                    >
                        {option.label}
                    </Link>
                ))}
            </div>
        </div>
    );
}
