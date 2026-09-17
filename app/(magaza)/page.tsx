import type { Metadata } from 'next';
import Link from 'next/link';
import Container from '@/components/Container';
import HomeSections from '@/components/home/HomeSections';
import { getCategoryTree, getHome } from '@/lib/api';
import { routes, site } from '@/lib/site';

export const metadata: Metadata = {
    title: site.title,
    description: site.description,
    alternates: { canonical: '/' },
};

/**
 * Anasayfa. Düzenin tamamı panelden gelir (`/home`); yalnızca hero altı güven şeridi
 * ve H1 kodda sabittir — sayfanın tek H1'i ve ana anahtar kelimesi burada durur.
 */
export default async function HomePage() {
    const [{ sections }, categories] = await Promise.all([getHome(), getCategoryTree()]);
    const categoryCount = categories.length;
    const productCount = categories.reduce((total, category) => total + category.activeProductCount, 0);

    return (
        <>
            {/* Koyu hero. Sol kenardaki degrade şerit üç kategori rengini taşır. */}
            <Container as="section" className="pt-[clamp(18px,3vw,30px)]">
                <div className="block-dark relative overflow-hidden p-[clamp(28px,4.2vw,60px)]">
                    <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 w-[3px] bg-[linear-gradient(180deg,#9b1f47,#6b3fa0_45%,#c77d12)]"
                    />
                    <span className="btn-pill inline-flex items-center gap-2 border border-on-dark/22 px-3 py-1.5 text-[11.5px] font-bold">
                        <span className="dot bg-on-dark-berry" />
                        Yetişkin ürünleri · 18+
                    </span>

                    <h1 className="mt-4 max-w-[16ch] font-display font-semibold leading-[1.12] tracking-[-0.04em] text-[clamp(36px,5.6vw,68px)] text-balance">
                        Sade, gizli,<br />doğru ürün.
                    </h1>
                    <p className="mt-5 max-w-[56ch] text-[15.5px] leading-relaxed text-on-dark/62">
                        Vibratörler, kayganlaştırıcılar, iç giyim ve çiftlere özel ürünler; orijinal, faturalı ve
                        üzerinde içerik bilgisi olmayan kargo paketiyle kapında.
                    </p>

                    <div className="mt-7 flex flex-wrap gap-2.5">
                        <Link href={routes.group('firsat-urunleri')} className="btn-primary rounded-[14px]">Fırsat ürünleri</Link>
                        <Link href={routes.guide} className="btn-secondary rounded-[14px] border-on-dark/25 text-on-dark hover:bg-on-dark hover:text-slate-900">
                            İlk kez alıyorum
                        </Link>
                    </div>

                    {/* Sayılar GERÇEK veriden gelir. Tasarımdaki "4,8 ortalama puan"
                        kutucuğu burada YOK: yorum sistemi Faz 5'te geliyor ve o gelene
                        kadar uydurma bir puan göstermek olmaz. */}
                    <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-on-dark/12 pt-6">
                        {[
                            [`${productCount}`, 'Ürün', 'text-on-dark-berry'],
                            [`${categoryCount}`, 'Kategori', 'text-on-dark-amber'],
                            ['14 gün', 'Koşulsuz iade', 'text-on-dark-teal'],
                        ].map(([value, label, tone]) => (
                            <div key={label}>
                                <div className={`price text-[22px] ${tone}`}>{value}</div>
                                <div className="mt-0.5 text-[12px] text-on-dark/55">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </Container>

            {/* Güven şeridi ve rehber bloğu artık panelden yönetilir
                (trust_strip / guide_promo blokları). */}
            <HomeSections sections={sections} />
        </>
    );
}
