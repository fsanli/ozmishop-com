import type { Metadata } from 'next';
import { Suspense } from 'react';
import Container from '@/components/Container';
import { getGuideQuestions, getGuideResults } from '@/lib/api';
import { one, type SearchParams } from '@/lib/listing';
import { routes, site } from '@/lib/site';
import GuideIntro from './GuideIntro';
import GuideQuiz from './GuideQuiz';
import GuideResult from './GuideResult';

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
    description: 'Dört soru, üç ürün önerisi ve her biri için neden onu seçtiğimizin açıklaması. Cevaplar kaydedilmez.',
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
    const [questions, params] = await Promise.all([getGuideQuestions(), searchParams]);

    if (questions.length === 0) {
        return <GuideIntro questions={questions} />;
    }

    // Adreste birikmiş cevaplar. Geçersiz harfler sunucuda zaten atılıyor;
    // burada yalnızca uzunluk kırpılır ki uydurulmuş uzun bir `c` API'ye gitmesin.
    const answered = (one(params.c) ?? '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, questions.length);
    const step = Number(one(params.adim)) || 0;

    // Tüm sorular cevaplanmışsa sonuç; aksi halde adım ya da giriş.
    if (answered.length >= questions.length) {
        return (
            <>
                <NoIndex />
                <GuideResult result={await getGuideResults(answered)} />
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
