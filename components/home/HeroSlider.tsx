'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Container from '@/components/Container';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import { safeLink } from '@/lib/site';
import type { Banner } from '@/lib/types';

/**
 * Anasayfanın ilk bloğu: banner slider'ı.
 *
 * Ürün galerisiyle AYNI kurallar — iki ayrı slider davranışı olmasın:
 *   · 5 saniyede bir otomatik geçiş
 *   · kullanıcı elle gezinirse otomatik geçiş KALICI olarak durur
 *   · işaretçi üstündeyken duraklar
 *   · `prefers-reduced-motion: reduce` varsa hiç başlamaz
 *   · dokunmayla kaydırma; dikey hareket sayfa kaydırması sayılır
 *
 * LCP: ilk banner `priority`, diğerleri değil. Hepsi DOM'da ve `opacity` ile
 * geçiyor — `hidden` olsaydı tarayıcı sonrakileri indirmeyi erteler ve geçiş
 * anında boş kare görünürdü.
 */
const AUTOPLAY_MS = 5000;
const SWIPE_THRESHOLD = 40;

export default function HeroSlider({ banners }: { banners: Banner[] }) {
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const [userTookOver, setUserTookOver] = useState(false);
    const touchStart = useRef<{ x: number; y: number } | null>(null);

    const count = banners.length;
    const many = count > 1;

    useEffect(() => {
        if (!many || paused || userTookOver) return undefined;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
        const timer = setInterval(() => setActive((current) => (current + 1) % count), AUTOPLAY_MS);
        return () => clearInterval(timer);
    }, [many, paused, userTookOver, count]);

    if (!count) return null;

    const index = Math.min(active, count - 1);
    const goTo = (next: number) => {
        setUserTookOver(true);
        setActive((count + next) % count);
    };

    const onTouchEnd = (event: React.TouchEvent) => {
        const start = touchStart.current;
        touchStart.current = null;
        setPaused(false);
        if (!start || !many) return;
        const touch = event.changedTouches[0];
        const dx = touch.clientX - start.x;
        const dy = touch.clientY - start.y;
        // Dikey hareket yataydan büyükse kullanıcı SAYFAYI kaydırıyor.
        if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
        goTo(index + (dx < 0 ? 1 : -1));
    };

    const arrow = 'absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full '
        + 'border border-slate-900/8 bg-surface/90 text-slate-700 shadow-[0_2px_12px_rgba(26,20,24,0.16)] '
        + 'backdrop-blur-sm transition hover:border-accent-500/40 hover:text-accent-500';

    return (
        <Container as="section" aria-label="Kampanyalar" className="pt-[clamp(14px,2.4vw,26px)]">
            <div
                className="relative aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-xl)] bg-shelf sm:aspect-[21/8]"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onTouchStart={(event) => {
                    const touch = event.touches[0];
                    touchStart.current = { x: touch.clientX, y: touch.clientY };
                    setPaused(true);
                }}
                onTouchEnd={onTouchEnd}
                onTouchCancel={() => { touchStart.current = null; setPaused(false); }}
            >
                {banners.map((banner, i) => {
                    const href = safeLink(banner.linkUrl);
                    const shown = i === index;

                    const content = (
                        <>
                            <Image
                                src={banner.image.url}
                                alt={shown ? banner.alt : ''}
                                fill
                                sizes="(max-width: 1400px) 100vw, 1400px"
                                priority={i === 0}
                                draggable={false}
                                className={`select-none object-cover ${banner.mobileImage ? 'hidden sm:block' : ''}`}
                            />
                            {banner.mobileImage && (
                                <Image
                                    src={banner.mobileImage.url}
                                    alt=""
                                    fill
                                    sizes="100vw"
                                    priority={i === 0}
                                    draggable={false}
                                    className="select-none object-cover sm:hidden"
                                />
                            )}
                            {(banner.title || banner.buttonText) && (
                                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink-block/85 via-ink-block/25 to-transparent p-[clamp(18px,3vw,44px)]">
                                    {banner.title && (
                                        <h2 className="max-w-[20ch] font-display font-semibold leading-[1.14] tracking-[-0.03em] text-on-dark text-[clamp(22px,3.4vw,44px)]">
                                            {banner.title}
                                        </h2>
                                    )}
                                    {banner.subtitle && (
                                        <p className="mt-2 max-w-[46ch] text-[clamp(13px,1.2vw,16px)] leading-relaxed text-on-dark/70">
                                            {banner.subtitle}
                                        </p>
                                    )}
                                    {banner.buttonText && <span className="btn-primary mt-5 w-fit rounded-[14px]">{banner.buttonText}</span>}
                                </div>
                            )}
                        </>
                    );

                    // aria-hidden + inert: görünmeyen slayttaki bağlantı klavyeyle
                    // odaklanılabilir kalmamalı, yoksa sekme görünmez bir yere gider.
                    const shell = `absolute inset-0 transition-opacity duration-700 ${shown ? 'opacity-100' : 'pointer-events-none opacity-0'}`;

                    return href ? (
                        <Link key={banner.id} href={href} className={shell} aria-hidden={!shown} tabIndex={shown ? undefined : -1}>
                            {content}
                        </Link>
                    ) : (
                        <div key={banner.id} className={shell} aria-hidden={!shown}>{content}</div>
                    );
                })}

                {many && (
                    <>
                        <button type="button" onClick={() => goTo(index - 1)} aria-label="Önceki kampanya" className={`${arrow} left-3 sm:left-5`}>
                            <ChevronLeftIcon className="size-5" />
                        </button>
                        <button type="button" onClick={() => goTo(index + 1)} aria-label="Sonraki kampanya" className={`${arrow} right-3 sm:right-5`}>
                            <ChevronRightIcon className="size-5" />
                        </button>

                        {/* Noktalar: kaç kampanya olduğunu ve nerede olunduğunu söyler. */}
                        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 sm:bottom-5">
                            {banners.map((banner, i) => (
                                <button
                                    key={banner.id}
                                    type="button"
                                    onClick={() => goTo(i)}
                                    aria-label={`${i + 1}. kampanya`}
                                    aria-current={i === index}
                                    className={`h-1.5 rounded-full transition-all ${
                                        i === index ? 'w-6 bg-on-dark' : 'w-1.5 bg-on-dark/45 hover:bg-on-dark/70'
                                    }`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </Container>
    );
}
