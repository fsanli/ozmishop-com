import Image from 'next/image';
import Link from 'next/link';
import { safeLink } from '@/lib/site';
import type { Banner } from '@/lib/types';

/**
 * Hero: otomatik dönen karusel yerine yatay kaydırma + snap.
 * Otomatik dönen bir slider ilk görselin LCP'sini geciktirir, mobilde kaydırmayla
 * çakışır ve erişilebilirlik için ek kontrol ister. Tek banner varsa şerit gizlenir.
 */
export default function HeroSlider({ banners }: { banners: Banner[] }) {
    if (!banners.length) return null;

    return (
        <section aria-label="Kampanyalar" className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
            <div className={`no-scrollbar flex gap-3 overflow-x-auto ${banners.length > 1 ? 'snap-x snap-mandatory' : ''}`}>
                {banners.map((banner, index) => {
                    const href = safeLink(banner.linkUrl);
                    const content = (
                        <>
                            <Image
                                src={banner.image.url}
                                alt={banner.alt}
                                fill
                                sizes="(max-width: 1280px) 100vw, 1280px"
                                priority={index === 0}
                                className={`object-cover ${banner.mobileImage ? 'hidden sm:block' : ''}`}
                            />
                            {banner.mobileImage && (
                                <Image
                                    src={banner.mobileImage.url}
                                    alt={banner.alt}
                                    fill
                                    sizes="100vw"
                                    priority={index === 0}
                                    className="object-cover sm:hidden"
                                />
                            )}
                            {(banner.title || banner.buttonText) && (
                                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-brand-900/80 via-brand-900/20 to-transparent p-5 sm:p-8">
                                    {banner.title && <h2 className="max-w-lg text-xl font-bold text-white sm:text-3xl">{banner.title}</h2>}
                                    {banner.subtitle && <p className="mt-1 max-w-lg text-sm text-white/80">{banner.subtitle}</p>}
                                    {banner.buttonText && <span className="btn-accent mt-4 w-fit">{banner.buttonText}</span>}
                                </div>
                            )}
                        </>
                    );

                    const className = 'relative aspect-[16/9] w-full shrink-0 snap-center overflow-hidden rounded-xl bg-slate-100 sm:aspect-[21/8]';

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
