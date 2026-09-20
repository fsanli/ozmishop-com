'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import type { ProductImage } from '@/lib/types';

/**
 * Ürün galerisi: büyük görsel + küçük görseller + ileri/geri okları.
 *
 * Oklar DÖNGÜSEL: sondan ileri ilk görsele gider. Pasifleştirmek yerine
 * döngü, çünkü tipik galeri 2–4 görsel — iki tıkta başa dönmek, yarısı ölü
 * iki oktan iyi. Tek görselde oklar da küçükler de hiç çizilmez.
 */
export default function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
    const [active, setActive] = useState(0);

    if (!images.length) {
        return <div className="card flex aspect-square items-center justify-center text-sm text-slate-400">Görsel yok</div>;
    }

    const index = Math.min(active, images.length - 1);
    const current = images[index];
    const many = images.length > 1;
    const step = (delta: number) => setActive((images.length + index + delta) % images.length);

    const arrow = 'absolute top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full '
        + 'border border-slate-900/8 bg-surface/90 text-slate-700 shadow-[0_2px_10px_rgba(26,20,24,0.12)] '
        + 'backdrop-blur-sm transition hover:border-accent-500/40 hover:text-accent-500';

    return (
        <div className="flex flex-col gap-3">
            <div className="card group relative aspect-square overflow-hidden">
                <Image
                    src={current.url}
                    alt={current.alt || name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                    className="object-cover"
                />

                {many && (
                    <>
                        <button type="button" onClick={() => step(-1)} aria-label="Önceki görsel" className={`${arrow} left-3`}>
                            <ChevronLeftIcon className="size-[18px]" />
                        </button>
                        <button type="button" onClick={() => step(1)} aria-label="Sonraki görsel" className={`${arrow} right-3`}>
                            <ChevronRightIcon className="size-[18px]" />
                        </button>

                        {/* Kaçıncı görselde olunduğu okla gezinirken küçüklere
                            bakmadan da görünsün. */}
                        <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-ink-block/70 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-on-dark">
                            {index + 1} / {images.length}
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
                            onClick={() => setActive(i)}
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
