'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { ProductImage } from '@/lib/types';

/** Ürün galerisi: büyük görsel + küçük görseller. Tek görselde küçükler gizlenir. */
export default function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
    const [active, setActive] = useState(0);

    if (!images.length) {
        return <div className="card flex aspect-square items-center justify-center text-sm text-slate-400">Görsel yok</div>;
    }

    const current = images[Math.min(active, images.length - 1)];

    return (
        <div className="flex flex-col gap-3">
            <div className="card relative aspect-square overflow-hidden">
                <Image
                    src={current.url}
                    alt={current.alt || name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                    className="object-cover"
                />
            </div>

            {images.length > 1 && (
                <div className="no-scrollbar flex gap-2 overflow-x-auto">
                    {images.map((image, index) => (
                        <button
                            key={image.id}
                            type="button"
                            onClick={() => setActive(index)}
                            aria-label={`${index + 1}. görsel`}
                            aria-current={index === active}
                            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                                index === active ? 'border-brand-500' : 'border-transparent hover:border-slate-200'
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
