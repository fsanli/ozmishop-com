import Image from 'next/image';
import Link from 'next/link';
import Container from '@/components/Container';
import { routes } from '@/lib/site';
import type { BrandSummary } from '@/lib/types';

/**
 * Marka şeridi. v2'de kutucuk ızgarası değil, tek bir beyaz kart içinde
 * kelime markaları — sayfayı ağırlaştırmadan güven veriyor.
 */
export default function BrandStrip({ brands, title }: { brands: BrandSummary[]; title?: string | null }) {
    if (!brands.length) return null;

    return (
        <Container as="section" className="pt-[clamp(30px,4vw,54px)]">
            <div className="card card-xl flex flex-wrap items-center gap-x-[clamp(18px,3vw,40px)] gap-y-4 p-[clamp(20px,3vw,30px)]">
                <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-600">
                    {title || 'Markalar'}
                </span>

                <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-[clamp(18px,3vw,36px)] overflow-x-auto">
                    {brands.map((brand) => (
                        <Link
                            key={brand.id}
                            href={routes.brand(brand.slug)}
                            className="shrink-0 font-display text-[15px] font-semibold tracking-[-0.03em] text-slate-600 transition-colors hover:text-accent-500"
                        >
                            {brand.logo ? (
                                <Image src={brand.logo.url} alt={brand.name} width={96} height={28} className="h-7 w-auto object-contain" />
                            ) : brand.name}
                        </Link>
                    ))}
                </div>

                <Link href={routes.brands} className="shrink-0 text-[13px] font-bold text-accent-500">
                    Tüm markalar →
                </Link>
            </div>
        </Container>
    );
}
