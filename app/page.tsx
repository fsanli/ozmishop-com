import type { Metadata } from 'next';
import Link from 'next/link';
import HomeSections from '@/components/home/HomeSections';
import { getHome } from '@/lib/api';
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
    const { sections } = await getHome();

    return (
        <>
            <section className="border-b border-slate-100 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-8 text-center sm:px-6 sm:py-12 lg:px-8">
                    <h1 className="heading-1">Yetişkinlere özel ürünler, gizli paketleme ile</h1>
                    <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500 sm:text-base">
                        Vibratörler, kayganlaştırıcılar, iç giyim ve çiftlere özel ürünler; orijinal, faturalı ve
                        üzerinde içerik bilgisi olmayan kargo paketiyle kapınızda.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                        <Link href={routes.group('firsat-urunleri')} className="btn-accent">Fırsat ürünleri</Link>
                        <Link href={routes.group('yeni-gelenler')} className="btn-secondary">Yeni gelenler</Link>
                    </div>
                </div>
            </section>

            <HomeSections sections={sections} />

            <section className="border-t border-slate-100 bg-white">
                <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
                    {[
                        ['Gizli paketleme', 'Kargo etiketinde içerik bilgisi yer almaz.'],
                        ['Güvenli ödeme', '3D Secure ile korunan ödeme altyapısı.'],
                        ['Hızlı kargo', 'Saat 16:00’ya kadar verilen siparişler aynı gün kargoda.'],
                        ['14 gün iade', 'Ambalajı açılmamış ürünlerde koşulsuz iade.'],
                    ].map(([title, description]) => (
                        <div key={title} className="text-center sm:text-left">
                            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
                            <p className="mt-1 text-xs text-slate-500">{description}</p>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}
