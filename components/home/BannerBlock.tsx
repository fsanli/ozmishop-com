import Image from 'next/image';
import Link from 'next/link';
import { safeLink } from '@/lib/site';
import type { Banner } from '@/lib/types';

/** Tek banner (geniş bant) ve banner grid (2–3 sütun) aynı bileşenden çıkar. */
export default function BannerBlock({ banners, columns }: { banners: Banner[]; columns?: number }) {
    if (!banners.length) return null;

    const grid = columns
        ? `grid gap-3 sm:gap-4 ${columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`
        : '';

    return (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className={grid}>
                {(columns ? banners : banners.slice(0, 1)).map((banner) => {
                    const href = safeLink(banner.linkUrl);
                    const content = (
                        <>
                            <Image
                                src={banner.image.url}
                                alt={banner.alt}
                                fill
                                sizes={columns ? '(max-width: 640px) 100vw, 33vw' : '(max-width: 1280px) 100vw, 1280px'}
                                className="object-cover transition duration-300 group-hover:scale-105"
                            />
                            {(banner.title || banner.buttonText) && (
                                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-brand-900/75 to-transparent p-4 sm:p-6">
                                    {banner.title && <h3 className="text-base font-bold text-white sm:text-xl">{banner.title}</h3>}
                                    {banner.subtitle && <p className="mt-0.5 text-xs text-white/80 sm:text-sm">{banner.subtitle}</p>}
                                    {banner.buttonText && <span className="mt-3 w-fit text-sm font-semibold text-accent-300">{banner.buttonText} →</span>}
                                </div>
                            )}
                        </>
                    );
                    const className = `group relative block overflow-hidden rounded-xl bg-slate-100 ${columns ? 'aspect-[4/3]' : 'aspect-[16/6]'}`;

                    return href ? (
                        <Link key={banner.id} href={href} className={className}>{content}</Link>
                    ) : (
                        <div key={banner.id} className={className}>{content}</div>
                    );
                })}
            </div>
        </section>
    );
}
