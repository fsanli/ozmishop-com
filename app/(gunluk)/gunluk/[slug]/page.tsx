import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Container from '@/components/Container';
import JsonLd from '@/components/JsonLd';
import NewsletterBlock from '@/components/gunluk/NewsletterBlock';
import { getPost, getSitemapData } from '@/lib/api';
import { CATEGORY_COLOR } from '@/lib/colors';
import { formatDate, formatPrice } from '@/lib/format';
import { one, type SearchParams } from '@/lib/listing';
import { breadcrumbSchema, postSchema } from '@/lib/schema';
import { PLACEHOLDER_SLUG, routes, site } from '@/lib/site';
import ViewPing from '@/components/ViewPing';
import type { JournalPost, JournalPostDetail } from '@/lib/types';

/**
 * Cache Components altında dinamik rota en az bir örnek param döndürmek zorunda;
 * aksi halde `await params` önbelleklenmemiş veri sayılır ve prerender durur.
 * API kapalıysa yer tutucu döner, o adres istendiğinde notFound() çalışır.
 */
export async function generateStaticParams() {
    try {
        const data = await getSitemapData();
        const slugs = data.posts.slice(0, 50).map((post) => ({ slug: post.slug }));
        return slugs.length ? slugs : [{ slug: PLACEHOLDER_SLUG }];
    } catch {
        return [{ slug: PLACEHOLDER_SLUG }];
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPost(slug);
    if (!post) return { title: 'Yazı bulunamadı' };

    const title = post.metaTitle || post.title;
    const description = post.metaDescription || post.excerpt || site.description;

    return {
        title,
        description,
        alternates: { canonical: routes.post(post.slug) },
        robots: post.isIndexable ? undefined : { index: false, follow: true },
        openGraph: {
            type: 'article',
            title,
            description,
            url: `${site.url}${routes.post(post.slug)}`,
            publishedTime: post.publishedAt ?? undefined,
            authors: post.author.name ? [post.author.name] : undefined,
            images: post.cover ? [{ url: post.cover.url, alt: post.cover.alt || post.title }] : undefined,
        },
    };
}

export default async function PostPage({
    params, searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<SearchParams>;
}) {
    const { slug } = await params;
    const post = await getPost(slug);
    if (!post) notFound();

    const colors = CATEGORY_COLOR[post.topic?.colorKey ?? 'berry'];

    return (
        <article>
            <JsonLd data={[
                postSchema(post),
                breadcrumbSchema([
                    { name: 'Günlük', url: routes.journal },
                    ...(post.topic ? [{ name: post.topic.name, url: routes.topic(post.topic.slug) }] : []),
                    { name: post.title, url: routes.post(post.slug) },
                ]),
            ]} />

            <Container narrow className="pt-4">
                <Link href={routes.journal} className="text-[12.5px] text-slate-600 hover:text-accent-500">← Günlük</Link>
            </Container>

            <Container narrow as="header" className="pt-[clamp(16px,2.4vw,28px)]">
                {post.topic && (
                    <Link href={routes.topic(post.topic.slug)} className={`inline-flex items-center gap-2 text-[12.5px] font-bold ${colors.ink}`}>
                        <span className={`h-0.5 w-4 ${colors.dot}`} aria-hidden />
                        {post.topic.name}
                    </Link>
                )}

                <h1 className="mt-4 max-w-[18ch] text-balance font-display text-[clamp(30px,5.4vw,64px)] font-semibold leading-[1.1] tracking-[-0.05em]">
                    {post.title}
                </h1>

                <div className="mt-[22px] flex flex-wrap items-center gap-4 text-[12.5px] text-slate-600">
                    {post.author.name && (
                        <span>
                            <strong className="font-bold text-slate-900">{post.author.name}</strong>
                            {post.author.title && ` · ${post.author.title}`}
                        </span>
                    )}
                    {post.publishedAt && (
                        <>
                            <span className="text-slate-300" aria-hidden>/</span>
                            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                        </>
                    )}
                    <span className="text-slate-300" aria-hidden>/</span>
                    <span>{post.readMinutes} dk okuma</span>
                </div>
            </Container>

            <Container narrow className="pt-[clamp(18px,2.6vw,30px)]">
                <div className="relative aspect-[21/9] overflow-hidden rounded-[22px] bg-slate-100">
                    {post.cover ? (
                        <Image
                            src={post.cover.url}
                            alt={post.cover.alt ?? post.title}
                            fill
                            sizes="(max-width: 1240px) 100vw, 1160px"
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <span className="absolute inset-0 grid place-items-center text-[11.5px] font-medium text-slate-400">
                            Kapak görseli
                        </span>
                    )}
                    <span className={`absolute bottom-0 left-0 h-[3px] w-20 ${colors.dot}`} aria-hidden />
                </div>
            </Container>

            <Container narrow className="flex flex-wrap items-start gap-[clamp(22px,3.6vw,56px)] pb-[clamp(32px,5vw,60px)] pt-[clamp(22px,3.4vw,44px)]">
                <div className="min-w-0 flex-[999_1_400px] lg:max-w-[680px]">
                    {/* Gövde panelden HTML olarak geliyor; .prose-content v2 tipografisini
                        (Sora başlıklar, 1.8 satır yüksekliği, bordo kenarlı alıntı) verir. */}
                    <div className="prose-content" dangerouslySetInnerHTML={{ __html: post.body }} />

                    {post.author.name && post.author.bio && <AuthorCard post={post} />}
                </div>

                <aside className="flex min-w-0 flex-[1_1_250px] flex-col gap-3.5 lg:max-w-[330px]">
                    {post.products.length > 0 && <MentionedProducts post={post} />}
                    {post.related.length > 0 && <RelatedPosts posts={post.related} />}
                </aside>
            </Container>

            <Suspense fallback={null}>
                <NewsletterSlot searchParams={searchParams} slug={post.slug} />
            </Suspense>

            {/* Sayaç okumayı bloklamaz: istemci tarafında 1.5 sn sonra atılır. */}
            <ViewPing slug={post.slug} kind="post" />
        </article>
    );
}

async function NewsletterSlot({ searchParams, slug }: { searchParams: Promise<SearchParams>; slug: string }) {
    const params = await searchParams;
    const state = one(params.bulten);
    return (
        <NewsletterBlock
            state={state === 'ok' ? 'ok' : state === 'hata' ? 'hata' : undefined}
            source="gunluk-yazi"
            returnTo={routes.post(slug)}
        />
    );
}

function AuthorCard({ post }: { post: JournalPostDetail }) {
    return (
        <div className="mt-9 flex flex-wrap items-center gap-4 border-t border-slate-900/8 pt-6">
            <div className="relative size-[58px] flex-none overflow-hidden rounded-full bg-slate-100">
                {post.author.image && (
                    <Image src={post.author.image.url} alt={post.author.name} fill sizes="58px" className="object-cover" />
                )}
            </div>
            <div className="min-w-0 flex-[1_1_220px]">
                <div className="text-[15px] font-bold tracking-[-0.02em]">{post.author.name}</div>
                <p className="mt-1 text-[13px] leading-snug text-slate-600">{post.author.bio}</p>
            </div>
        </div>
    );
}

/**
 * Yazıda geçen ürünler. Tasarımdaki kenar çubuğu kartı — Günlük'ün "ürün satmak
 * için değil" vaadini bozmadan bağlam veriyor, o yüzden fiyat var ama sepet
 * butonu yok.
 */
function MentionedProducts({ post }: { post: JournalPostDetail }) {
    return (
        <section className="card overflow-hidden">
            <h2 className="flex items-center gap-[9px] border-b border-slate-900/6 px-[18px] py-3.5 text-[12.5px] font-bold">
                <span className="dot bg-accent-500" />
                Yazıda geçen ürünler
            </h2>
            {post.products.map((product) => (
                <Link
                    key={product.slug}
                    href={routes.product(product.slug)}
                    className="flex items-center gap-3 border-b border-slate-900/5 px-[18px] py-3.5 transition-colors last:border-0 hover:bg-paper"
                >
                    <div className="relative size-[46px] flex-none overflow-hidden rounded-[11px] border border-slate-900/6 bg-paper">
                        {product.image && (
                            <Image src={product.image.url} alt={product.image.alt ?? product.name} fill sizes="46px" className="object-cover" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-slate-600">{product.brand.name}</div>
                        <div className="text-[13.5px] font-semibold leading-[1.3] tracking-[-0.015em]">{product.name}</div>
                    </div>
                    <span className="font-display text-[13px] font-semibold">{formatPrice(product.price ?? product.minPrice)}</span>
                </Link>
            ))}
        </section>
    );
}

function RelatedPosts({ posts }: { posts: JournalPost[] }) {
    return (
        <section className="card px-5 pb-3 pt-1.5">
            <h2 className="mt-4 text-[12.5px] font-bold text-slate-600">İlgili yazılar</h2>
            {posts.map((post) => {
                const colors = CATEGORY_COLOR[post.topic?.colorKey ?? 'berry'];
                return (
                    <article key={post.slug} className="group relative border-b border-slate-900/6 py-3.5 last:border-0">
                        <h3 className="font-display text-[15.5px] font-semibold leading-[1.3] tracking-[-0.028em]">
                            <Link href={routes.post(post.slug)} className="after:absolute after:inset-0 hover:text-accent-500">
                                {post.title}
                            </Link>
                        </h3>
                        <span className="mt-1.5 inline-flex items-center gap-[7px] text-[11.5px] text-slate-500">
                            <span className={`dot ${colors.dot}`} />
                            {post.topic?.name ?? 'Günlük'} · {post.readMinutes} dk
                        </span>
                    </article>
                );
            })}
        </section>
    );
}
