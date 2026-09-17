import Link from 'next/link';
import { CATEGORY_COLOR } from '@/lib/colors';
import { toggleRangeHref, toggleSpecHref, toggleValueHref } from '@/lib/listing';
import type { ListingState, SearchParams } from '@/lib/listing';
import type { Facets } from '@/lib/types';
import { XIcon } from '@/components/icons';

/** Seçili filtreler, kaldırma çipleri olarak. Her çip kendi facet'inin renginde. */
export default function ActiveFilters({
    facets, state, basePath, searchParams,
}: {
    facets: Facets | undefined;
    state: ListingState;
    basePath: string;
    searchParams: SearchParams;
}) {
    if (!facets) return null;

    const chips: { key: string; label: string; href: string; tint: string; ink: string }[] = [];

    facets.variantKeys.forEach((key) => key.values.forEach((value) => {
        if (!state.values.includes(value.id)) return;
        chips.push({
            key: `v-${value.id}`,
            label: value.name,
            href: toggleValueHref(basePath, searchParams, value.id),
            tint: 'bg-slate-100',
            ink: 'text-slate-700',
        });
    }));

    (facets.specs || []).forEach((facet) => {
        const colors = CATEGORY_COLOR[facet.colorKey];
        facet.options.forEach((option) => {
            const isRange = option.min !== undefined;
            const token = `${facet.slug}:${option.slug}`;
            const selected = isRange ? state.specRanges.includes(token) : state.specs.includes(token);
            if (!selected) return;
            chips.push({
                key: `s-${token}`,
                label: option.name,
                href: isRange
                    ? toggleRangeHref(basePath, searchParams, facet.slug, option.slug)
                    : toggleSpecHref(basePath, searchParams, facet.slug, option.slug),
                tint: colors.tint,
                ink: colors.ink,
            });
        });
    });

    if (chips.length === 0) return null;

    return (
        <div className="mb-3 flex flex-wrap gap-1.5">
            {chips.map((chip) => (
                <Link
                    key={chip.key}
                    href={chip.href}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${chip.tint} ${chip.ink}`}
                >
                    {chip.label}
                    <XIcon className="size-[11px]" />
                </Link>
            ))}
        </div>
    );
}
