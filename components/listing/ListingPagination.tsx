import Link from 'next/link';
import { pageHref } from '@/lib/listing';
import type { SearchParams } from '@/lib/listing';
import type { Pagination as PaginationType } from '@/lib/types';

/** Sayfa hapları. Aktif sayfa koyu dolgu; uzun listelerde başta/sonda üç nokta. */
export default function ListingPagination({
    pagination, basePath, searchParams,
}: {
    pagination: PaginationType;
    basePath: string;
    searchParams: SearchParams;
}) {
    const { page, totalPages } = pagination;
    if (totalPages <= 1) return null;

    const pages: (number | '…')[] = [];
    for (let index = 1; index <= totalPages; index += 1) {
        if (index === 1 || index === totalPages || Math.abs(index - page) <= 1) pages.push(index);
        else if (pages[pages.length - 1] !== '…') pages.push('…');
    }

    return (
        <nav aria-label="Sayfalar" className="mt-7 flex flex-wrap items-center justify-center gap-1.5">
            {page > 1 && (
                <Link href={pageHref(basePath, searchParams, page - 1)} className="btn-secondary btn-sm">Önceki</Link>
            )}
            {pages.map((item, index) => (item === '…' ? (
                <span key={`gap-${index}`} className="px-1 text-slate-500">…</span>
            ) : (
                <Link
                    key={item}
                    href={pageHref(basePath, searchParams, item)}
                    aria-current={item === page ? 'page' : undefined}
                    className={`grid size-9 place-items-center rounded-[10px] text-[13px] transition-colors ${
                        item === page
                            ? 'bg-slate-900 font-bold text-on-dark'
                            : 'border border-slate-900/12 hover:border-slate-900'
                    }`}
                >
                    {item}
                </Link>
            )))}
            {page < totalPages && (
                <Link href={pageHref(basePath, searchParams, page + 1)} className="btn-secondary btn-sm">Sonraki</Link>
            )}
        </nav>
    );
}
