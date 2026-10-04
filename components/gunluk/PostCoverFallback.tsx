import type { ColorClasses } from '@/lib/colors';

/**
 * Kapak görseli olmayan yazının kapağı. Eskiden gri zemine "Kapak görseli"
 * yazıyordu: sayfa yarım kalmış gibi görünüyordu. Konunun rengiyle boyanmış,
 * Günlük imzalı bir yüz — görsel eklenince kendiliğinden yerini ona bırakır.
 *
 * Dekoratif: metin görsel değil, ekran okuyucuya başlık zaten ayrıca okunuyor.
 */
export default function PostCoverFallback({
    colors, topic, size = 'md',
}: {
    colors: ColorClasses;
    topic?: string | null;
    size?: 'sm' | 'md' | 'lg';
}) {
    const mark = { sm: 'text-[26px]', md: 'text-[clamp(30px,5vw,46px)]', lg: 'text-[clamp(36px,6vw,64px)]' }[size];
    return (
        <span aria-hidden className={`absolute inset-0 flex flex-col justify-between p-[clamp(14px,2.4vw,26px)] ${colors.tint}`}>
            {topic ? <span className={`text-[11.5px] font-bold uppercase tracking-[0.08em] ${colors.ink}`}>{topic}</span> : <span />}
            <span className={`font-display font-semibold leading-none tracking-[-0.05em] ${colors.ink} ${mark}`}>
                Günlük<span className="opacity-60">.</span>
            </span>
        </span>
    );
}
