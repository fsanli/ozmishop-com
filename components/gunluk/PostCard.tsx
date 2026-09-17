import Image from 'next/image';
import Link from 'next/link';
import { CATEGORY_COLOR } from '@/lib/colors';
import { formatDate } from '@/lib/format';
import { routes } from '@/lib/site';
import type { JournalPost } from '@/lib/types';

/**
 * Yazı kartı. Tasarımda kart tıklanabilir bir blok; burada stretched link
 * kullanılıyor — kartın tamamını `<a>` yapmak başlığı ekran okuyucuda
 * kaybettirir, `<button onClick>` ise bağlantıyı yeni sekmede açtırmaz.
 */
export default function PostCard({ post, priority = false }: { post: JournalPost; priority?: boolean }) {
    const colors = CATEGORY_COLOR[post.topic?.colorKey ?? 'berry'];

    return (
        <article className="card card-hover group relative flex flex-col overflow-hidden">
            <div className="relative aspect-[16/10] w-full bg-slate-100">
                {post.cover ? (
                    <Image
                        src={post.cover.url}
                        alt={post.cover.alt ?? post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 320px"
                        className="object-cover"
                        priority={priority}
                    />
                ) : (
                    <span className="absolute inset-0 grid place-items-center text-[11px] font-medium text-slate-400">
                        Yazı görseli
                    </span>
                )}
                <span className={`absolute bottom-0 left-0 h-[3px] w-12 ${colors.dot}`} aria-hidden />
            </div>

            <div className="flex flex-1 flex-col gap-2 px-[19px] pb-5 pt-[17px]">
                <div className="flex flex-wrap items-center gap-2.5">
                    {post.topic && <span className={`text-[11.5px] font-bold ${colors.ink}`}>{post.topic.name}</span>}
                    <span className="text-[11.5px] text-slate-500">{post.readMinutes} dk okuma</span>
                </div>

                <h3 className="font-display text-[18px] font-semibold leading-[1.25] tracking-[-0.03em]">
                    <Link href={routes.post(post.slug)} className="after:absolute after:inset-0 hover:text-accent-500">
                        {post.title}
                    </Link>
                </h3>

                <p className="flex-1 text-[13px] leading-relaxed text-slate-600">{post.excerpt}</p>
                {post.publishedAt && <span className="mt-0.5 text-[11.5px] text-slate-500">{formatDate(post.publishedAt)}</span>}
            </div>
        </article>
    );
}
