'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import type { ProductImage } from '@/lib/types';

/**
 * Ürün galerisi: büyük görsel + küçük görseller + oklar + dokunmayla kaydırma
 * + otomatik geçiş.
 *
 * OTOMATİK GEÇİŞİN ÜÇ FRENİ VAR, üçü de bilinçli:
 *   1. Kullanıcı ELLE gezinirse (ok, küçük resim, kaydırma) otomatik geçiş
 *      KALICI OLARAK durur. Kontrolü alan birinden onu geri almak, galeriyi
 *      kullanılmaz yapar — okuduğu görsel altından kayar.
 *   2. İşaretçi kartın üstündeyken duraklar; kullanıcı bakıyordur.
 *   3. `prefers-reduced-motion: reduce` varsa hiç başlamaz. Hareket
 *      hassasiyeti olan biri için kendiliğinden değişen içerik erişim engeli.
 *
 * Kaydırma eşiği 40px: altındaki hareketler dokunmatikte kaçınılmaz olan
 * titremeler ve tıklamanın parmak kaymasıdır, sayfa değiştirmemeli.
 */
const AUTOPLAY_MS = 5000;
const SWIPE_THRESHOLD = 40;

export default function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const [userTookOver, setUserTookOver] = useState(false);
    const touchStart = useRef<{ x: number; y: number } | null>(null);

    const count = images.length;
    const many = count > 1;

    useEffect(() => {
        if (!many || paused || userTookOver) return undefined;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

        const timer = setInterval(() => setActive((current) => (current + 1) % count), AUTOPLAY_MS);
        return () => clearInterval(timer);
    }, [many, paused, userTookOver, count]);

    if (!count) {
        return <div className="card flex aspect-square items-center justify-center text-sm text-slate-400">Görsel yok</div>;
    }

    const index = Math.min(active, count - 1);

    /** Elle gezinme: otomatik geçişi kapatır. */
    const goTo = (next: number) => {
        setUserTookOver(true);
        setActive((count + next) % count);
    };

    const onTouchStart = (event: React.TouchEvent) => {
        const touch = event.touches[0];
        touchStart.current = { x: touch.clientX, y: touch.clientY };
        setPaused(true);
    };

    const onTouchEnd = (event: React.TouchEvent) => {
        const start = touchStart.current;
        touchStart.current = null;
        setPaused(false);
        if (!start || !many) return;

        const touch = event.changedTouches[0];
        const dx = touch.clientX - start.x;
        const dy = touch.clientY - start.y;

        // Dikey hareket yataydan büyükse kullanıcı SAYFAYI kaydırıyor, galeriyi
        // değil. Bunu ayırmazsak sayfa kaydırmaya çalışan herkes görsel değiştirir.
        if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
        goTo(index + (dx < 0 ? 1 : -1));
    };

    const arrow = 'absolute top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full '
        + 'border border-slate-900/8 bg-surface/90 text-slate-700 shadow-[0_2px_10px_rgba(26,20,24,0.12)] '
        + 'backdrop-blur-sm transition hover:border-accent-500/40 hover:text-accent-500';

    return (
        <div className="flex flex-col gap-3">
            <div
                className="card group relative aspect-square overflow-hidden"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onTouchCancel={() => { touchStart.current = null; setPaused(false); }}
            >
                {/* Tüm görseller DOM'da: geçiş anında yükleme beklenmez ve
                    kaydırma takılmaz. Görünmeyenler `opacity-0` — `hidden`
                    olsaydı tarayıcı onları indirmeyi erteleyebilirdi. */}
                {images.map((image, i) => (
                    <Image
                        key={image.id}
                        src={image.url}
                        alt={i === index ? (image.alt || name) : ''}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        priority={i === 0}
                        draggable={false}
                        aria-hidden={i !== index}
                        className={`select-none object-cover transition-opacity duration-500 ${
                            i === index ? 'opacity-100' : 'opacity-0'
                        }`}
                    />
                ))}

                {many && (
                    <>
                        <button type="button" onClick={() => goTo(index - 1)} aria-label="Önceki görsel" className={`${arrow} left-3`}>
                            <ChevronLeftIcon className="size-[18px]" />
                        </button>
                        <button type="button" onClick={() => goTo(index + 1)} aria-label="Sonraki görsel" className={`${arrow} right-3`}>
                            <ChevronRightIcon className="size-[18px]" />
                        </button>

                        <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-ink-block/70 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-on-dark">
                            {index + 1} / {count}
                        </span>
                    </>
                )}
            </div>

            {many && (
                <div className="no-scrollbar flex gap-2 overflow-x-auto">
                    {images.map((image, i) => (
                        <button
                            key={image.id}
                            type="button"
                            onClick={() => goTo(i)}
                            aria-label={`${i + 1}. görsel`}
                            aria-current={i === index}
                            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                                i === index ? 'border-brand-500' : 'border-transparent hover:border-slate-200'
                            }`}
                        >
                            <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
