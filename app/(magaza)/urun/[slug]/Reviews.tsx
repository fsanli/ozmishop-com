import Link from 'next/link';
import { getReviews } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { getCurrentCustomer } from '@/lib/session';
import { routes } from '@/lib/site';

/**
 * Ürün değerlendirmeleri. Kendi Suspense'inde akar: yorumlar yavaş dönse bile
 * ürün bilgisi ve sepete ekle paneli bekletilmez.
 *
 * Yayında YALNIZCA takma ad görünür (`author`); gerçek kimlik API'nin panel
 * uçlarında kalıyor. Bu, kataloğun tamamındaki gizlilik vaadinin parçası.
 */
export default async function Reviews({ slug, page }: { slug: string; page: number }) {
    const data = await getReviews(slug, page);
    if (!data) return null;

    const { summary, items, pagination } = data;

    return (
        <section id="degerlendirmeler" className="pt-[clamp(30px,4vw,54px)]">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="heading-2">Değerlendirmeler</h2>
                <WriteLink slug={slug} />
            </div>

            {summary.count === 0 ? (
                <p className="mt-4 max-w-[60ch] text-[14.5px] leading-relaxed text-slate-600">
                    Bu ürün için henüz değerlendirme yok. Satın alıp teslim aldıysan ilk yorumu sen yazabilirsin —
                    yayında gerçek adın değil, seçtiğin takma ad görünür.
                </p>
            ) : (
                <div className="mt-5 flex flex-wrap items-start gap-[clamp(18px,3vw,44px)]">
                    <div className="min-w-0 flex-[1_1_240px] sm:max-w-[300px]">
                        <Summary summary={summary} />
                    </div>

                    <div className="min-w-0 flex-[999_1_400px]">
                        <ul className="space-y-3">
                            {items.map((review) => (
                                <li key={review.id} className="card p-[18px_20px]">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <Stars rating={review.rating} />
                                        <span className="text-[13.5px] font-bold">{review.author}</span>
                                        {review.verifiedBuyer && (
                                            <span className="badge badge-teal">Doğrulanmış alıcı</span>
                                        )}
                                        <span className="ml-auto text-[12px] text-slate-500">
                                            {formatDate(review.createdAt)}
                                            {review.isEdited && ' · düzenlendi'}
                                        </span>
                                    </div>

                                    {review.title && <h3 className="mt-2.5 text-[14.5px] font-bold">{review.title}</h3>}
                                    <p className="mt-1.5 max-w-[68ch] text-[13.5px] leading-relaxed text-slate-700">{review.body}</p>

                                    {review.variantLabel && (
                                        <p className="mt-2 text-[12px] text-slate-600">Seçilen: {review.variantLabel}</p>
                                    )}
                                </li>
                            ))}
                        </ul>

                        {pagination.totalPages > 1 && (
                            <nav className="mt-5 flex flex-wrap items-center gap-2" aria-label="Değerlendirme sayfaları">
                                {Array.from({ length: pagination.totalPages }).map((_, index) => {
                                    const target = index + 1;
                                    return (
                                        <Link
                                            key={target}
                                            href={`${routes.product(slug)}${target > 1 ? `?yorum=${target}` : ''}#degerlendirmeler`}
                                            aria-current={target === pagination.page ? 'page' : undefined}
                                            className={`min-w-9 rounded-[var(--radius-md)] px-3 py-2 text-center text-[13px] font-semibold transition-colors ${
                                                target === pagination.page
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
                    </div>
                </div>
            )}
        </section>
    );
}

/**
 * Yorum yazma bağlantısı. Form Hesabım'da: API yalnızca TESLİM ALINMIŞ ürünlere
 * izin veriyor ve o listeyi zaten orada gösteriyoruz. Ürün sayfasına ikinci bir
 * form koymak, çoğu ziyaretçiye "yalnızca teslim aldığın ürünleri
 * değerlendirebilirsin" hatası göstermek olurdu.
 */
async function WriteLink({ slug }: { slug: string }) {
    const customer = await getCurrentCustomer();
    return (
        <Link
            href={customer ? `${routes.accountReviews}?yaz=${slug}` : `${routes.login}?devam=${encodeURIComponent(routes.accountReviews)}`}
            className="btn-soft btn-sm"
        >
            Değerlendirme yaz
        </Link>
    );
}

function Summary({ summary }: { summary: { count: number; average: number | null; distribution: Record<string, number> } }) {
    const average = summary.average ?? 0;

    return (
        <div className="card card-edge-top border-t-amber-dot p-[20px_22px]">
            <div className="flex items-baseline gap-2.5">
                <span className="font-display text-[38px] font-semibold leading-none tracking-[-0.04em]">
                    {average.toFixed(1).replace('.', ',')}
                </span>
                <span className="text-[13px] text-slate-600">{summary.count} değerlendirme</span>
            </div>

            <div className="mt-2"><Stars rating={Math.round(average)} /></div>

            <div className="mt-4 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                    const count = summary.distribution[String(star)] ?? 0;
                    const percent = summary.count ? Math.round((count / summary.count) * 100) : 0;
                    return (
                        <div key={star} className="flex items-center gap-2.5 text-[12px] text-slate-600">
                            <span className="w-3 tabular-nums">{star}</span>
                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                                <span className="block h-full rounded-full bg-amber-dot" style={{ width: `${percent}%` }} />
                            </span>
                            <span className="w-7 text-right tabular-nums">{count}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Stars({ rating }: { rating: number }) {
    return (
        <span className="inline-flex gap-0.5" aria-label={`${rating} yıldız`}>
            {[1, 2, 3, 4, 5].map((value) => (
                <svg key={value} viewBox="0 0 24 24" aria-hidden className={`size-3.5 ${value <= rating ? 'fill-amber-dot' : 'fill-slate-200'}`}>
                    <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4 6.2 20.4l1.1-6.5L2.6 9.3l6.5-.9z" />
                </svg>
            ))}
        </span>
    );
}
