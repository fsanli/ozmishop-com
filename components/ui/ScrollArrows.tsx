'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';

/**
 * YATAY ŞERİT OKLARI — anasayfa ürün şeritleri (S05) ve alt kategori şeridi (S04).
 *
 * Liste SUNUCUDA çizilir (kartlar sunucu bileşeni kalır); bu bileşen yalnız
 * `targetId`'li kaydırma kabını yönetir. Böylece kartlar istemci JS'ine
 * taşınmaz ve dokunmatik/touchpad kaydırma olduğu gibi çalışır.
 *
 *   - Taşma yoksa HİÇ çizilmez (dar ekranda gereksiz kontrol yok).
 *   - Uçta ilgili ok pasifleşir.
 *   - Tıklama bir "ekran" ilerler ve KART BAŞINA hizalanır: ilk tam görünmeyen
 *     karta (ya da geriye doğru bir ekran önceki karta) gidilir, kart ortadan
 *     kesilmez.
 *   - Her şerit kendi kabını yönetir; bir ok diğer şeritleri oynatmaz.
 *   - Azaltılmış hareket tercihinde yumuşak kaydırma yok.
 *
 * İlk çizimde (sunucu + hidrasyon) oklar yok, ölçüm effect'te: hidrasyon
 * uyuşmazlığı oluşmaz, şerit JS'siz de kaydırılabilir.
 */
export const ARROW_BUTTON = 'grid size-10 shrink-0 place-items-center rounded-full border border-slate-900/10 '
    + 'bg-surface/90 text-slate-700 shadow-[0_2px_10px_rgba(26,20,24,0.12)] backdrop-blur-sm transition '
    + 'hover:border-accent-500/40 hover:text-accent-500 focus-visible:outline-2 focus-visible:outline-offset-2 '
    + 'focus-visible:outline-accent-500 disabled:pointer-events-none disabled:opacity-35';

const EDGE = 4;

export default function ScrollArrows({
    targetId, label, className = '',
}: {
    targetId: string;
    /** Ekran okuyucu için şeridin adı: "En çok ilgi görenler: sonraki ürünler". */
    label: string;
    className?: string;
}) {
    const [state, setState] = useState({ overflow: false, atStart: true, atEnd: true });

    useEffect(() => {
        const element = document.getElementById(targetId);
        if (!element) return undefined;
        const update = () => {
            const max = element.scrollWidth - element.clientWidth;
            setState({ overflow: max > EDGE, atStart: element.scrollLeft <= EDGE, atEnd: element.scrollLeft >= max - EDGE });
        };
        update();
        element.addEventListener('scroll', update, { passive: true });
        const observer = new ResizeObserver(update);
        observer.observe(element);
        return () => {
            element.removeEventListener('scroll', update);
            observer.disconnect();
        };
    }, [targetId]);

    const step = useCallback((direction: 1 | -1) => {
        const element = document.getElementById(targetId);
        if (!element) return;
        const box = element.getBoundingClientRect();
        const padding = parseFloat(getComputedStyle(element).paddingLeft) || 0;
        // Kartların kap içi (kaydırılabilir içerik) konumları.
        const items = [...element.children]
            .map((child) => {
                const rect = child.getBoundingClientRect();
                return { left: rect.left - box.left + element.scrollLeft, right: rect.right - box.left + element.scrollLeft };
            })
            .filter((item) => item.right > item.left);
        if (!items.length) return;

        const viewLeft = element.scrollLeft + padding;
        const viewRight = element.scrollLeft + element.clientWidth;
        let target: number;
        if (direction === 1) {
            // İlk tam görünmeyen kart sola yaslanır.
            const next = items.find((item) => item.right > viewRight + 1) ?? items[items.length - 1];
            target = next.left - padding;
        } else {
            // Bir ekran geri: o noktadan sonra başlayan ilk kart.
            const back = viewLeft - (element.clientWidth - padding);
            const previous = items.find((item) => item.left >= back - 1) ?? items[0];
            target = previous.left - padding;
        }
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        element.scrollTo({ left: Math.max(0, target), behavior: reduce ? 'auto' : 'smooth' });
    }, [targetId]);

    if (!state.overflow) return null;

    return (
        // Görünürlük (`flex`/`hidden sm:flex`) çağırandan: iki display sınıfı yan yana çakışırdı.
        <div className={`items-center gap-2 ${className || 'flex'}`}>
            <button
                type="button"
                className={ARROW_BUTTON}
                aria-controls={targetId}
                aria-label={`${label}: önceki`}
                disabled={state.atStart}
                onClick={() => step(-1)}
            >
                <ChevronLeftIcon className="size-[18px]" />
            </button>
            <button
                type="button"
                className={ARROW_BUTTON}
                aria-controls={targetId}
                aria-label={`${label}: sonraki`}
                disabled={state.atEnd}
                onClick={() => step(1)}
            >
                <ChevronRightIcon className="size-[18px]" />
            </button>
        </div>
    );
}
