import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import Container from '@/components/Container';
import EmptyState from '@/components/EmptyState';
import {
    ApiError, getGuideQuestions, getGuideResults, getGuideV2Start, getSettings,
} from '@/lib/api';
import { packagingText } from '@/lib/privacy-copy';
import type { GuideResult as Result } from '@/lib/types';
import { one, type SearchParams } from '@/lib/listing';
import { routes, site } from '@/lib/site';
import GuideIntro from './GuideIntro';
import GuideQuiz from './GuideQuiz';
import GuideResult from './GuideResult';
import GuideV2 from './v2/GuideV2';

/**
 * Rehberin kanonik adresi girişidir. Quiz ve sonuç adresleri `noindex`:
 * `?adim=`/`?c=` kombinasyonları sonsuz bir URL uzayı üretir ve hepsi aynı
 * sayfanın varyasyonudur.
 *
 * robots.txt'ye `/rehber` EKLENMEZ — `Disallow` Google'ın `noindex` etiketini
 * okumasını engeller ve sayfalar indekste asılı kalır.
 */
export const metadata: Metadata = {
    title: 'Başlangıç rehberi — ilk kez alıyorsan',
    description: 'Birkaç kısa soruyla aradığın kullanım şekline ve bütçene uygun seçenekleri daraltalım.',
    alternates: { canonical: `${site.url}${routes.guide}` },
};

export default function GuidePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    return (
        <Suspense fallback={<GuideSkeleton />}>
            <GuideBody searchParams={searchParams} />
        </Suspense>
    );
}

async function GuideBody({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const [settings, params] = await Promise.all([getSettings(), searchParams]);

    // V2 (koşullu rehber): panelden `rehber.surum = 2` ile açılır (Rehber › V2).
    if (String(settings['rehber.surum'] ?? '1') === '2') {
        // Eski V1 bağlantısı (`?c=AABA`): harfler yeni sorulara sessizce eşlenmez.
        if (one(params.c)) {
            return (
                <>
                    <NoIndex />
                    <GuideProblem kind="stale" path="" />
                </>
            );
        }
        const start = await getGuideV2Start().catch(() => null);
        return (
            <>
                {one(params.adim) && <NoIndex />}
                <GuideV2
                    start={start}
                    packaging={packagingText(settings)}
                    returnDays={Number(settings['icerik.iade_suresi_gun']) || 14}
                />
            </>
        );
    }

    const questions = await getGuideQuestions();

    if (questions.length === 0) {
        return <GuideIntro questions={questions} />;
    }

    // Adreste birikmiş cevaplar. Geçersiz harfler sunucuda zaten atılıyor;
    // burada yalnızca uzunluk kırpılır ki uydurulmuş uzun bir `c` API'ye gitmesin.
    const answered = (one(params.c) ?? '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, questions.length);
    const step = Number(one(params.adim)) || 0;

    // Tüm sorular cevaplanmışsa sonuç; aksi halde adım ya da giriş.
    if (answered.length >= questions.length) {
        let result: Result | null = null;
        let failure: 'stale' | 'error' | null = null;
        try {
            result = await getGuideResults(answered);
        } catch (error) {
            // 400: bağlantıdaki bir cevap artık yok (soru/seçenek değişmiş). Eski
            // cevap yeni soruya sessizce eşlenmez; müşteri baştan başlar (S08).
            failure = error instanceof ApiError && error.statusCode === 400 ? 'stale' : 'error';
        }
        return (
            <>
                <NoIndex />
                {result ? <GuideResult result={result} questionCount={questions.length} /> : <GuideProblem kind={failure ?? 'error'} path={answered} />}
            </>
        );
    }

    if (step >= 1 && step <= questions.length) {
        return (
            <>
                <NoIndex />
                <GuideQuiz
                    question={questions[step - 1]}
                    step={step}
                    total={questions.length}
                    answered={answered}
                />
            </>
        );
    }

    return <GuideIntro questions={questions} />;
}

/**
 * Sonuç alınamadı. "Uygun ürün yok" DENMEZ: bu bir yükleme sorunu ya da eski
 * bir bağlantı, eşleşme sonucu değil (Ek A §10, "Yükleme hatası var").
 */
function GuideProblem({ kind, path }: { kind: 'stale' | 'error'; path: string }) {
    return (
        <Container narrow className="py-[clamp(24px,4vw,44px)]">
            {kind === 'stale' ? (
                <EmptyState
                    where="Rehber"
                    color="berry"
                    title="Rehber yenilendi; yeniden başlayalım."
                    description="Açtığın bağlantıdaki cevaplar güncel sorularla eşleşmiyor. Birkaç kısa soruyla seçenekleri yeniden daraltalım."
                    action={<Link href={`${routes.guide}?adim=1`} className="btn-accent">Başlayalım</Link>}
                />
            ) : (
                <EmptyState
                    where="Rehber"
                    color="amber"
                    title="Öneriler şu anda yüklenemedi."
                    description="Bağlantı kaynaklı geçici bir sorun olabilir. Cevapların korunuyor; birazdan yeniden deneyebilirsin."
                    action={(
                        <div className="flex flex-wrap gap-2.5">
                            <Link href={`${routes.guide}?c=${path}`} className="btn-accent">Tekrar dene</Link>
                            <Link href={routes.categories} className="btn-secondary">Kategorileri keşfet</Link>
                        </div>
                    )}
                />
            )}
        </Container>
    );
}

/**
 * Quiz/sonuç adımları için noindex. `generateMetadata` kullanılamıyor: sayfanın
 * kabuğu statik prerender ediliyor ve `searchParams` yalnız Suspense içinde
 * okunabiliyor — meta etiketi de bu yüzden gövdeden basılıyor.
 */
function NoIndex() {
    return <meta name="robots" content="noindex, follow" />;
}

function GuideSkeleton() {
    return (
        <Container narrow className="pt-[clamp(18px,2.6vw,30px)]">
            <div className="h-[clamp(320px,38vw,480px)] animate-pulse rounded-[28px] bg-slate-100" />
        </Container>
    );
}
