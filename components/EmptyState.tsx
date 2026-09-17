import type { ColorKey } from '@/lib/colors';
import { CATEGORY_COLOR } from '@/lib/colors';

/**
 * v2 boş durum. Tasarımın kuralı: her boş durum TEK bir çıkış yolu önerir —
 * "bir şey yok" demekle bırakmaz.
 */
export default function EmptyState({
    title,
    description,
    action,
    where,
    color = 'berry',
}: {
    title: string;
    description?: string;
    action?: React.ReactNode;
    /** Üstteki küçük renkli etiket: "Sepet", "Favoriler", "Arama"… */
    where?: string;
    color?: ColorKey;
}) {
    const colors = CATEGORY_COLOR[color];

    return (
        <div className={`card card-xl card-edge-top ${colors.edgeTop} flex min-h-[230px] flex-col items-start p-[clamp(22px,4vw,34px)]`}>
            {where && <span className={`text-[11.5px] font-bold ${colors.ink}`}>{where}</span>}
            <h2 className="heading-3 mt-2.5">{title}</h2>
            {description && <p className="mt-2 max-w-[52ch] text-[13.5px] leading-relaxed text-slate-600">{description}</p>}
            {action && <div className="mt-auto pt-5">{action}</div>}
        </div>
    );
}
