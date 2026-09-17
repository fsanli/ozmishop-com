import { CATEGORY_COLOR } from '@/lib/colors';
import type { SpecSheet } from '@/lib/types';

/**
 * Teknik künye. İki blok:
 *   1. Ölçüm kartları — göstergeli, tek bakışta okunan dört sayı
 *   2. Renk kodlu grup kartları — nokta-çizgili satırlar
 *
 * Künye boşsa hiç render EDİLMEZ: tasarımın sözü "alan gelene kadar ilgili parça
 * gizlenir, layout bozulmaz".
 */
export default function TechSpecs({ sheet }: { sheet: SpecSheet | undefined }) {
    if (!sheet || (sheet.keyMetrics.length === 0 && sheet.groups.length === 0)) return null;

    return (
        <section className="pt-[clamp(30px,4vw,54px)]">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <span className="kicker text-plum-ink">Teknik künye</span>
                    <h2 className="heading-2 mt-2.5">Tahmin etmene gerek yok</h2>
                </div>
                <p className="max-w-[42ch] text-[13px] leading-relaxed text-slate-600">
                    Ölçüler üretici kataloğundan alınmıştır; ses seviyesi kendi ölçümümüzdür.
                </p>
            </div>

            {sheet.keyMetrics.length > 0 && (
                <div className="grid gap-[clamp(10px,1.4vw,14px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,188px),1fr))]">
                    {sheet.keyMetrics.map((metric) => {
                        const colors = CATEGORY_COLOR[metric.colorKey];
                        return (
                            <div key={metric.name} className="card flex flex-col gap-3.5 px-5 pb-4 pt-[18px]">
                                <div className="flex items-center gap-2">
                                    <span className={`dot-lg dot ${colors.dot}`} />
                                    <span className="text-[11.5px] font-bold text-slate-600">{metric.name}</span>
                                </div>

                                <div className="flex items-baseline gap-1.5">
                                    <span className="price text-[clamp(26px,3.2vw,32px)] leading-none tracking-[-0.05em]">
                                        {metric.unit ? metric.value.replace(` ${metric.unit}`, '') : metric.value}
                                    </span>
                                    {metric.unit && <span className="text-[13px] font-semibold text-slate-600">{metric.unit}</span>}
                                </div>

                                {metric.percent !== null && (
                                    <div>
                                        {/* Genişlik veriden gelir; Tailwind çalışma anında sınıf üretemediği için satır içi. */}
                                        <div className="relative h-[5px] rounded-full bg-slate-200">
                                            <span className={`absolute inset-y-0 left-0 rounded-full ${colors.dot}`} style={{ width: `${metric.percent}%` }} />
                                            <span
                                                className={`absolute -top-[3.5px] size-3 -translate-x-1/2 rounded-full border-[2.5px] bg-white ${colors.edgeLeft.replace('border-l-', 'border-')}`}
                                                style={{ left: `${metric.percent}%` }}
                                            />
                                        </div>
                                        {metric.rangeMin !== null && metric.rangeMax !== null && (
                                            <div className="mt-1.5 flex justify-between text-[10.5px] text-slate-500">
                                                <span>{metric.rangeMin}{metric.unit ? ` ${metric.unit}` : ''}</span>
                                                <span>{metric.rangeMax}{metric.unit ? ` ${metric.unit}` : ''}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {metric.note && <p className="text-[12px] leading-[1.55] text-slate-600">{metric.note}</p>}
                            </div>
                        );
                    })}
                </div>
            )}

            {sheet.groups.length > 0 && (
                <div className="mt-[clamp(10px,1.4vw,14px)] grid gap-[clamp(10px,1.4vw,14px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,265px),1fr))]">
                    {sheet.groups.map((group) => {
                        const colors = CATEGORY_COLOR[group.colorKey];
                        return (
                            <div key={group.id} className="card overflow-hidden">
                                <div className={`flex items-center gap-2 px-[18px] py-3.5 ${colors.tint}`}>
                                    <span className={`dot-lg dot ${colors.dot}`} />
                                    <h3 className={`text-[12.5px] font-bold ${colors.ink}`}>{group.name}</h3>
                                </div>
                                <dl className="px-[18px] pb-3 pt-0.5">
                                    {group.rows.map((row) => (
                                        <div key={row.name} className="flex items-baseline gap-2.5 border-b border-slate-900/5 py-[11px] last:border-0">
                                            <dt className="shrink-0 text-[13px] text-slate-600">{row.name}</dt>
                                            {/* Nokta-çizgi: iki uç arasını doldurur, ekran okuyucudan gizli. */}
                                            <span aria-hidden className="min-w-2.5 flex-1 -translate-y-[3px] border-b border-dotted border-slate-900/20" />
                                            <dd className="shrink-0 text-right text-[13.5px] font-bold">{row.value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
