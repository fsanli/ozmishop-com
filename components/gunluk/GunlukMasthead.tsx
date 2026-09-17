import Link from 'next/link';
import { Suspense } from 'react';
import Container from '@/components/Container';
import { getJournalTopics } from '@/lib/api';
import { CATEGORY_COLOR } from '@/lib/colors';
import { routes } from '@/lib/site';

/**
 * Günlük mastheadı. Mağaza header'ı BURADA YOK — tasarımın kuralı bu ve iç içe
 * bir yerleşim üstündeki kabuğu kaldıramadığı için Günlük kendi rota grubunda.
 *
 * Konu şeridi kendi Suspense'inde: masthead'in geri kalanı (logo, tanım, mağaza
 * bağlantısı) statik kabukta kalır.
 */
export default function GunlukMasthead() {
    return (
        <header className="border-b border-slate-900/8 bg-paper">
            <div className="bg-slate-900 text-on-dark">
                <Container narrow className="flex min-h-10 flex-wrap items-center gap-4">
                    <span className="text-[12px] text-on-dark/65">ozmishop Günlük — reklamsız, editör onaylı</span>
                    <Link
                        href={routes.home}
                        className="ml-auto inline-flex items-center gap-[7px] text-[12px] font-semibold text-on-dark transition-colors hover:text-on-dark-rose"
                    >
                        Mağazaya dön
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                        </svg>
                    </Link>
                </Container>
            </div>

            <Container narrow className="flex flex-wrap items-end justify-between gap-5 pb-5 pt-[clamp(22px,3.2vw,38px)]">
                <Link href={routes.journal} className="group">
                    <span className="block text-[11.5px] font-bold uppercase tracking-[0.22em] text-slate-600">ozmishop</span>
                    <span className="mt-1.5 block font-display text-[clamp(32px,5.4vw,56px)] font-bold leading-[1.12] tracking-[-0.05em]">
                        Günlük<span className="text-accent-500">.</span>
                    </span>
                </Link>
                <p className="max-w-[34ch] text-[13px] leading-relaxed text-slate-600 sm:text-right">
                    Malzeme, hijyen, güvenlik ve ilişki üzerine kısa yazılar. Ürün satmak için değil, doğru bilgi vermek için yazılır.
                </p>
            </Container>

            <Suspense fallback={<TopicStripSkeleton />}>
                <TopicStrip />
            </Suspense>
        </header>
    );
}

async function TopicStrip() {
    const topics = await getJournalTopics();
    if (topics.length === 0) return null;

    return (
        <nav className="no-scrollbar overflow-x-auto" aria-label="Konular">
            <Container narrow className="flex gap-2 whitespace-nowrap pb-3.5">
                <Link
                    href={routes.journal}
                    className="inline-flex items-center rounded-full border border-slate-900/12 bg-slate-900 px-3.5 py-2 text-[13px] font-medium text-on-dark"
                >
                    Tümü
                </Link>
                {topics.map((topic) => {
                    const colors = CATEGORY_COLOR[topic.colorKey];
                    return (
                        <Link
                            key={topic.slug}
                            href={routes.topic(topic.slug)}
                            className={`inline-flex items-center gap-[7px] rounded-full border border-slate-900/10 ${colors.tint} px-3.5 py-2 text-[13px] font-medium ${colors.ink} transition-colors hover:border-slate-900/30`}
                        >
                            <span className={`dot ${colors.dot}`} />
                            {topic.name}
                        </Link>
                    );
                })}
            </Container>
        </nav>
    );
}

function TopicStripSkeleton() {
    return (
        <Container narrow className="flex gap-2 pb-3.5">
            {Array.from({ length: 5 }).map((_, index) => (
                <span key={index} className="h-[34px] w-24 animate-pulse rounded-full bg-slate-100" />
            ))}
        </Container>
    );
}
