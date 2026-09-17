import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import Container from '@/components/Container';
import Footer from '@/components/chrome/Footer';
import Header from '@/components/chrome/Header';
import HomeSections from '@/components/home/HomeSections';
import UtilityBar from '@/components/chrome/UtilityBar';
import { getHomePreview } from '@/lib/api';
import { routes } from '@/lib/site';

/**
 * Anasayfa taslağının önizlemesi. Panelin "Önizle" düğmesi buraya açılır.
 *
 * Jeton API'de üretilir, 10 dakika yaşar ve YALNIZCA bir düzeni okumaya yarar —
 * panel tarayıcıya asla yönetici jetonu vermez.
 */
export const metadata: Metadata = {
    title: 'Önizleme',
    robots: { index: false, follow: false, nocache: true },
};

/**
 * searchParams okuması ve önbelleksiz çekim Suspense sınırının İÇİNDE kalır:
 * Cache Components her rotadan prerender edilebilir bir kabuk ister, dışarıda
 * bırakılırsa `next build` "uncached data during prerendering" ile düşer.
 *
 * Geçersiz jetonda `notFound()` KULLANILMAZ: akış başladıktan sonra durum kodu
 * değiştirilemediği için 404 yerine 200 dönerdi. Onun yerine açık bir mesaj
 * basılır — rota zaten noindex ve yalnızca panelden açılıyor.
 */
async function PreviewContent({ searchParams }: { searchParams: Promise<{ jeton?: string }> }) {
    const { jeton } = await searchParams;
    const preview = jeton ? await getHomePreview(jeton) : null;

    if (!preview) {
        return (
            <Container className="py-20">
                <div className="card card-xl mx-auto max-w-[460px] p-[clamp(24px,4vw,36px)] text-center">
                    <h1 className="heading-3">Önizleme bağlantısı geçersiz</h1>
                    <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                        Bağlantının süresi dolmuş olabilir. Panelden &ldquo;Önizle&rdquo; düğmesine yeniden basarak
                        güncel bir bağlantı alabilirsiniz.
                    </p>
                    <Link href={routes.home} className="btn-secondary mt-5">Mağazaya dön</Link>
                </div>
            </Container>
        );
    }

    return <HomeSections sections={preview.sections} />;
}

export default function HomePreviewPage({
    searchParams,
}: {
    searchParams: Promise<{ jeton?: string }>;
}) {
    return (
        <>
            {/* Önizleme olduğunu net söyler: yanlışlıkla "yayında" sanılmasın. */}
            <div className="bg-amber-dot text-on-dark">
                <Container className="flex flex-wrap items-center gap-2 py-2 text-[12.5px] font-bold">
                    <span className="dot bg-on-dark" />
                    Taslak önizlemesi — bu düzen henüz yayında değil.
                    <span className="font-normal opacity-70">Bağlantı 10 dakika sonra geçersiz olur.</span>
                </Container>
            </div>

            <UtilityBar />
            <Header variant="full" />
            <main id="icerik" className="flex-1">
                <Suspense fallback={<Container className="py-20 text-center text-sm text-slate-600">Önizleme hazırlanıyor…</Container>}>
                    <PreviewContent searchParams={searchParams} />
                </Suspense>
            </main>
            <Footer />
        </>
    );
}
