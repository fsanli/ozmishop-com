import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import Container from '@/components/Container';
import EmptyState from '@/components/EmptyState';
import JsonLd from '@/components/JsonLd';
import NewsletterBlock from '@/components/gunluk/NewsletterBlock';
import PostCard from '@/components/gunluk/PostCard';
import { getJournal, getJournalTopics } from '@/lib/api';
import { CATEGORY_COLOR } from '@/lib/colors';
import { formatDate } from '@/lib/format';
import { one, type SearchParams } from '@/lib/listing';
import { journalSchema } from '@/lib/schema';
import { routes, site } from '@/lib/site';
import type { JournalPost } from '@/lib/types';

export const metadata: Metadata = {
    title: 'Günlük — malzeme, hijyen ve güvenlik yazıları',
    description: 'Malzeme, hijyen, güvenlik ve ilişki üzerine kısa yazılar. Ürün satmak için değil, doğru bilgi vermek için yazılır.',
    alternates: { canonical: `${site.url}${routes.journal}` },
};

export default function JournalPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    return (
        <>
            {/* Kabuk statik: liste ve bülten durumu adrese bağlı olduğu için
                sınır burada. Masthead ve konu şeridi yerleşimde, zaten ayrı. */}
            <Suspense fallback={<JournalSkeleton />}>
                <JournalBody searchParams={searchParams} />
            </Suspense>
        </>
    );
}

async function JournalBody({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const params = await searchParams;
    const topicSlug = one(params.konu);
    const page = Number(one(params.sayfa)) || 1;
    const newsletter = one(params.bulten);

    const [journal, topics] = await Promise.all([
        getJournal({ topic: topicSlug, page }),
        topicSlug ? getJournalTopics() : Promise.resolve([]),
    ]);

    const activeTopic = topicSlug ? topics.find((topic) => topic.slug === topicSlug) : undefined;
    const all = [journal.featured, ...journal.items].filter(Boolean) as JournalPost[];

    if (all.length === 0) {
        return (
            <Container narrow className="py-[clamp(24px,4vw,44px)]">
                <EmptyState
                    where="Günlük"
                    color={activeTopic?.colorKey ?? 'berry'}
                    title={activeTopic ? `${activeTopic.name} konusunda henüz yazı yok` : 'Henüz yazı yok'}
                    description="Yeni yazılar ayda birkaç kez yayımlanır. Bülten kaydı yaparsan ilkini kaçırmazsın."
                    action={<Link href={routes.journal} className="btn-secondary">Tüm yazılar</Link>}
                />
                <NewsletterBlock state={newsletter === 'ok' ? 'ok' : newsletter === 'hata' ? 'hata' : undefined} />
            </Container>
        );
    }

    return (
        <>
            <JsonLd data={journalSchema(all)} />

            {/* Konu filtresi açıkken öne çıkan kart yok: API zaten featured
                döndürmüyor, liste tek parça akar. */}
            {journal.featured && (
                <Container narrow as="section" className="pt-[clamp(20px,3vw,36px)]">
                    <div className="flex flex-wrap gap-[clamp(14px,2.4vw,28px)]">
                        <FeaturedCard post={journal.featured} />
                        <SidebarList posts={journal.items.slice(0, 4)} />
                    </div>
                </Container>
            )}

            <Container narrow as="section" className="pt-[clamp(28px,4vw,48px)]">
                <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-[12.5px] font-bold text-slate-600">
                        {activeTopic ? activeTopic.name : 'Tüm yazılar'}
                        <span className="ml-2 font-normal">{journal.pagination.total} yazı</span>
                    </h2>
                    {activeTopic && (
                        <Link href={routes.journal} className="text-[12.5px] text-slate-600 underline underline-offset-4 hover:text-accent-500">
                            Filtreyi kaldır
                        </Link>
                    )}
                </div>

                {activeTopic?.description && (
                    <p className="mb-5 max-w-[60ch] text-[14px] leading-relaxed text-slate-600">{activeTopic.description}</p>
                )}

                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,275px),1fr))] gap-[clamp(12px,1.8vw,20px)]">
                    {journal.items.map((post, index) => (
                        <PostCard key={post.slug} post={post} priority={index < 3 && !journal.featured} />
                    ))}
                </div>

                {journal.pagination.totalPages > 1 && (
                    <nav className="mt-7 flex items-center justify-center gap-2" aria-label="Sayfalar">
                        {Array.from({ length: journal.pagination.totalPages }).map((_, index) => {
                            const target = index + 1;
                            const search = new URLSearchParams();
                            if (topicSlug) search.set('konu', topicSlug);
                            if (target > 1) search.set('sayfa', String(target));
                            const href = search.toString() ? `${routes.journal}?${search}` : routes.journal;
                            return (
                                <Link
                                    key={target}
                                    href={href}
                                    aria-current={target === journal.pagination.page ? 'page' : undefined}
                                    className={`min-w-9 rounded-[var(--radius-md)] px-3 py-2 text-center text-[13px] font-semibold transition-colors ${
                                        target === journal.pagination.page
                                            ? 'bg-slate-900 text-on-dark'
                                            : 'border border-slate-900/12 text-slate-700 hover:border-slate-900/30'
                                    }`}
                                >
                                    {target}
                                </Link>
                            );
                        })}
                    </nav>
                )}
            </Container>

            <NewsletterBlock state={newsletter === 'ok' ? 'ok' : newsletter === 'hata' ? 'hata' : undefined} />
        </>
    );
}

/** İndeksin büyük kartı. Başlık `<h1>`: sayfadaki tek birinci seviye başlık. */
function FeaturedCard({ post }: { post: JournalPost }) {
    const colors = CATEGORY_COLOR[post.topic?.colorKey ?? 'berry'];

    return (
        <article className="card card-hover group relative min-w-0 flex-[999_1_400px] p-[clamp(22px,3vw,38px)]">
            <span className={`inline-flex items-center gap-2 text-[12.5px] font-bold ${colors.ink}`}>
                <span className={`h-0.5 w-4 ${colors.dot}`} aria-hidden />
                {post.topic?.name ?? 'Günlük'} · {post.readMinutes} dk okuma
            </span>

            <h1 className="mt-4 max-w-[20ch] text-balance font-display text-[clamp(28px,4.6vw,52px)] font-semibold leading-[1.12] tracking-[-0.045em]">
                <Link href={routes.post(post.slug)} className="after:absolute after:inset-0 hover:text-accent-500">
                    {post.title}
                </Link>
            </h1>

            <p className="mt-4 max-w-[56ch] text-[15px] leading-[1.7] text-slate-600">{post.excerpt}</p>

            <div className="relative mt-[22px] aspect-video overflow-hidden rounded-[18px] bg-slate-100">
                {post.cover ? (
                    <Image
                        src={post.cover.url}
                        alt={post.cover.alt ?? post.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 780px"
                        className="object-cover"
                        priority
                    />
                ) : (
                    <span className="absolute inset-0 grid place-items-center text-[11.5px] font-medium text-slate-400">
                        Kapak görseli
                    </span>
                )}
                <span className={`absolute bottom-0 left-0 h-[3px] w-[60px] ${colors.dot}`} aria-hidden />
            </div>
        </article>
    );
}

/** "Bu hafta" şeridi — öne çıkanın yanındaki dar sütun. */
function SidebarList({ posts }: { posts: JournalPost[] }) {
    if (posts.length === 0) return null;

    return (
        <div className="card min-w-0 flex-[1_1_250px] px-[22px] pb-3 pt-1.5 sm:max-w-[350px]">
            <h2 className="mt-[18px] text-[12.5px] font-bold text-slate-600">Bu hafta</h2>
            {posts.map((post) => {
                const colors = CATEGORY_COLOR[post.topic?.colorKey ?? 'berry'];
                return (
                    <article key={post.slug} className="group relative border-b border-slate-900/6 py-4 last:border-0">
                        {post.topic && (
                            <span className={`inline-flex items-center gap-[7px] text-[11.5px] font-bold ${colors.ink}`}>
                                <span className={`dot ${colors.dot}`} />
                                {post.topic.name}
                            </span>
                        )}
                        <h3 className="mt-[7px] font-display text-[16.5px] font-semibold leading-[1.28] tracking-[-0.03em]">
                            <Link href={routes.post(post.slug)} className="after:absolute after:inset-0 hover:text-accent-500">
                                {post.title}
                            </Link>
                        </h3>
                        <span className="mt-1.5 block text-[11.5px] text-slate-500">
                            {post.readMinutes} dk okuma
                            {post.publishedAt && ` · ${formatDate(post.publishedAt)}`}
                        </span>
                    </article>
                );
            })}
        </div>
    );
}

function JournalSkeleton() {
    return (
        <Container narrow className="pt-[clamp(20px,3vw,36px)]">
            <div className="flex flex-wrap gap-[clamp(14px,2.4vw,28px)]">
                <div className="card min-w-0 flex-[999_1_400px] animate-pulse bg-slate-100 p-[clamp(22px,3vw,38px)]">
                    <div className="h-[380px]" />
                </div>
                <div className="card min-w-0 flex-[1_1_250px] animate-pulse bg-slate-100 sm:max-w-[350px]">
                    <div className="h-[380px]" />
                </div>
            </div>
        </Container>
    );
}
