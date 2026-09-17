import Link from 'next/link';
import { CATEGORY_COLOR } from '@/lib/colors';
import { routes } from '@/lib/site';
import type { GuideQuestion } from '@/lib/types';

/**
 * Quiz adımı. İSTEMCİ BİLEŞENİ DEĞİL: her seçenek bir `<Link>`, cevaplar adreste
 * birikiyor (`/rehber?adim=2&c=A`). Böylece geri tuşu doğru çalışır, bağlantı
 * paylaşılabilir ve JavaScript kapalıyken de akış tamamlanır.
 *
 * Cevapların kaydedilmediği iddiası burada gerçek: harfler yalnızca adreste
 * yaşıyor, hiçbir çereze veya tabloya yazılmıyor.
 */
export default function GuideQuiz({
    question, step, total, answered,
}: {
    question: GuideQuestion;
    step: number;
    total: number;
    /** O ana kadar seçilmiş harfler, ör. "AB". */
    answered: string;
}) {
    const progress = Math.round((step / total) * 100);
    const back = step === 1
        ? routes.guide
        : `${routes.guide}?adim=${step - 1}&c=${answered.slice(0, step - 2)}`;

    return (
        <div className="mx-auto w-full max-w-[820px] px-[clamp(16px,4vw,44px)] pb-[clamp(40px,6vw,84px)] pt-[clamp(22px,3.4vw,52px)]">
            <div className="flex flex-wrap items-center gap-3.5">
                <span className="flex-none whitespace-nowrap text-[12px] font-bold text-slate-600">
                    Soru {step} / {total}
                </span>
                <span
                    className="relative h-[5px] min-w-[120px] flex-1 rounded-full bg-slate-200"
                    role="progressbar"
                    aria-valuenow={step}
                    aria-valuemin={1}
                    aria-valuemax={total}
                    aria-label="Rehber ilerlemesi"
                >
                    <span className="absolute inset-y-0 left-0 rounded-full bg-accent-500" style={{ width: `${progress}%` }} />
                </span>
                <Link href={back} className="text-[12.5px] text-slate-600 hover:text-accent-500">← Geri</Link>
            </div>

            <h1 className="mt-[26px] max-w-[18ch] font-display text-[clamp(27px,4.4vw,46px)] font-semibold leading-[1.14] tracking-[-0.045em]">
                {question.question}
            </h1>
            {question.hint && (
                <p className="mt-3.5 max-w-[52ch] text-[14.5px] leading-relaxed text-slate-600">{question.hint}</p>
            )}

            <div className="mt-[26px] flex flex-col gap-2.5">
                {question.options.map((option) => {
                    const colors = CATEGORY_COLOR[option.colorKey];
                    const next = answered.slice(0, step - 1) + option.optionKey;
                    const href = step === total
                        ? `${routes.guide}?c=${next}`
                        : `${routes.guide}?adim=${step + 1}&c=${next}`;

                    return (
                        <Link
                            key={option.id}
                            href={href}
                            className="flex w-full items-center gap-4 rounded-[18px] border border-slate-900/9 bg-surface px-[22px] py-5 transition-colors hover:border-accent-500"
                        >
                            <span className={`grid size-[30px] flex-none place-items-center rounded-full ${colors.tint} text-[12.5px] font-extrabold ${colors.ink}`}>
                                {option.optionKey}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block font-display text-[18px] font-semibold tracking-[-0.03em]">{option.label}</span>
                                {option.hint && (
                                    <span className="mt-0.5 block text-[13.5px] leading-snug text-slate-600">{option.hint}</span>
                                )}
                            </span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="flex-none text-accent-500" aria-hidden>
                                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                            </svg>
                        </Link>
                    );
                })}
            </div>

            <p className="mt-5 text-[12px] leading-relaxed text-slate-500">
                Cevapların tarayıcından çıkmaz; hesabına kaydedilmez, e-posta istenmez.
            </p>
        </div>
    );
}
