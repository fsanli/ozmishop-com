import { CheckIcon, XIcon } from '@/components/icons';
import type { ProductDetail } from '@/lib/types';

/**
 * "Bu ürün sana uygun mu?" — artılar ve eksiler yan yana.
 *
 * Eksileri gizlemek kısa vadede satış getirir, iade ve güvensizlik olarak geri
 * döner. Tasarım bu bloğu bilerek ürün açıklamasının yanına koyuyor.
 */
export default function FitNotes({ notes }: { notes: ProductDetail['fitNotes'] }) {
    const positive = notes?.positive ?? [];
    const negative = notes?.negative ?? [];
    if (positive.length === 0 && negative.length === 0) return null;

    const row = (text: string, good: boolean) => (
        <div key={`${good}-${text}`} className="flex items-start gap-3 border-b border-slate-900/7 py-3 last:border-0">
            <span
                aria-hidden
                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${good ? 'bg-teal-tint text-teal-ink' : 'bg-rose-tint text-accent-500'}`}
            >
                {good ? <CheckIcon className="size-3" /> : <XIcon className="size-3" />}
            </span>
            <span className="text-[14px] leading-relaxed">{text}</span>
            <span className="sr-only">{good ? '— uygun' : '— uygun değil'}</span>
        </div>
    );

    return (
        <div>
            <h2 className="heading-3">Bu ürün sana uygun mu?</h2>
            <div className="card mt-3 px-5 py-1.5">
                {positive.map((text) => row(text, true))}
                {negative.map((text) => row(text, false))}
            </div>
        </div>
    );
}
