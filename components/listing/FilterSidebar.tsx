import Link from 'next/link';
import { facetColorsOf } from '@/lib/colors';
import {
    buildHref, clearFiltersHref, toggleRangeHref, toggleSpecHref, toggleValueHref,
} from '@/lib/listing';
import type { ListingState, SearchParams } from '@/lib/listing';
import type { Facets } from '@/lib/types';

/**
 * Filtre kenar çubuğu. Tamamı <Link> — sıfır istemci JS, sıfır state.
 * JS kapalıyken de çalışır, adres paylaşılabilir, geri tuşu doğru davranır.
 *
 * Her facet grubunun başlığında kendi renk noktası var; nokta sitenin her yerinde
 * aynı konuyu işaret eder (künye grubunun rengi).
 */
export default function FilterSidebar({
    facets, state, basePath, searchParams,
}: {
    facets: Facets | undefined;
    state: ListingState;
    basePath: string;
    searchParams: SearchParams;
}) {
    if (!facets) return null;

    const checkbox = (checked: boolean) => (
        <span
            aria-hidden
            className={`field-checkbox grid place-items-center ${checked ? 'border-accent-500 bg-accent-500' : ''}`}
        >
            {checked && (
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" className="size-2.5">
                    <path d="M20 6 9 17l-5-5" />
                </svg>
            )}
        </span>
    );

    const group = (key: string, title: string, children: React.ReactNode) => {
        const colors = facetColorsOf(key);
        return (
            <div key={key} className="border-b border-slate-900/8 py-4 last:border-0">
                <h3 className="mb-2.5 flex items-center gap-2 text-[12px] font-bold">
                    <span className={`dot ${colors.dot}`} />
                    {title}
                </h3>
                {children}
            </div>
        );
    };

    return (
        <div className="card card-xl p-[20px_22px]">
            <div className="flex items-center justify-between gap-2 pb-1">
                <h2 className="text-sm font-bold">Filtreler</h2>
                <Link href={clearFiltersHref(basePath, searchParams)} className="text-[12.5px] font-bold text-accent-500">
                    Temizle
                </Link>
            </div>

            {group('stok', 'Stok', (
                <Link
                    href={buildHref(basePath, searchParams, { stokta: state.inStock ? undefined : '1' })}
                    className="flex items-center gap-2.5 py-1 text-[13px]"
                >
                    {checkbox(state.inStock)}
                    Yalnızca stoktakiler
                </Link>
            ))}

            {facets.brands.length > 1 && group('marka', 'Marka', (
                <ul className="space-y-0.5">
                    {facets.brands.map((brand) => (
                        <li key={brand.id}>
                            <Link
                                href={buildHref(basePath, searchParams, { marka: brand.slug })}
                                className="flex items-center gap-2.5 py-1 text-[13px]"
                            >
                                <span className="flex-1">{brand.name}</span>
                                <span className="text-[12px] text-slate-600">{brand.count}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            ))}

            {/*
              * Künye filtreleri. Sayısal tanımlar da kutucuk olarak gelir: API
              * onları sayılı kovalara böler ("38 – 44 dB · 22"). Kullanıcıdan
              * aralık yazmasını beklemek gerçekçi değil, tasarım da böyle.
              */}
            {(facets.specs || []).map((facet) => group(facet.slug, facet.name, (
                <ul className="space-y-0.5">
                    {facet.options.map((option) => {
                        const isRange = option.min !== undefined;
                        const token = `${facet.slug}:${option.slug}`;
                        const checked = isRange ? state.specRanges.includes(token) : state.specs.includes(token);
                        return (
                            <li key={option.slug}>
                                <Link
                                    href={isRange
                                        ? toggleRangeHref(basePath, searchParams, facet.slug, option.slug)
                                        : toggleSpecHref(basePath, searchParams, facet.slug, option.slug)}
                                    className="flex items-center gap-2.5 py-1 text-[13px]"
                                >
                                    {checkbox(checked)}
                                    <span className="flex-1">{option.name}</span>
                                    <span className="text-[12px] text-slate-600">{option.count}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )))}

            {facets.variantKeys.map((key) => group(key.slug, key.name, (
                key.inputType === 'color' ? (
                    <div className="flex flex-wrap gap-2">
                        {key.values.map((value) => (
                            <Link
                                key={value.id}
                                href={toggleValueHref(basePath, searchParams, value.id)}
                                title={`${value.name} (${value.count})`}
                                aria-label={value.name}
                                className={`size-[26px] rounded-lg border transition ${
                                    state.values.includes(value.id)
                                        ? 'border-accent-500 outline outline-2 outline-offset-2 outline-accent-500'
                                        : 'border-slate-900/12'
                                }`}
                                style={{ background: value.hexCode || '#efe9eb' }}
                            />
                        ))}
                    </div>
                ) : (
                    <ul className="space-y-0.5">
                        {key.values.map((value) => (
                            <li key={value.id}>
                                <Link
                                    href={toggleValueHref(basePath, searchParams, value.id)}
                                    className="flex items-center gap-2.5 py-1 text-[13px]"
                                >
                                    {checkbox(state.values.includes(value.id))}
                                    <span className="flex-1">{value.name}</span>
                                    <span className="text-[12px] text-slate-600">{value.count}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )
            )))}

            {group('fiyat', 'Fiyat', (
                <form action={basePath} className="flex items-center gap-1.5">
                    {Object.entries(searchParams).flatMap(([key, value]) => {
                        if (key === 'min' || key === 'max' || key === 'sayfa') return [];
                        const list = Array.isArray(value) ? value : [value];
                        return list.filter(Boolean).map((item, index) => (
                            <input key={`${key}-${index}`} type="hidden" name={key} value={item as string} />
                        ));
                    })}
                    <input
                        name="min" inputMode="numeric" aria-label="En düşük fiyat"
                        defaultValue={state.minPrice ?? ''} placeholder={String(Math.floor(facets.price.min))}
                        className="field-input px-2.5 py-1.5 text-[12.5px]"
                    />
                    <span className="text-slate-500">–</span>
                    <input
                        name="max" inputMode="numeric" aria-label="En yüksek fiyat"
                        defaultValue={state.maxPrice ?? ''} placeholder={String(Math.ceil(facets.price.max))}
                        className="field-input px-2.5 py-1.5 text-[12.5px]"
                    />
                    <button type="submit" className="btn-soft btn-sm">Uygula</button>
                </form>
            ))}
        </div>
    );
}
