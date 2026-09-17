import type { Metadata } from 'next';
import Link from 'next/link';
import EmptyState from '@/components/EmptyState';
import SubmitButton from '@/components/form/SubmitButton';
import { getMyReviews } from '@/lib/account';
import { formatDate } from '@/lib/format';
import { one, type SearchParams } from '@/lib/listing';
import { routes } from '@/lib/site';
import type { MyReview } from '@/lib/types';
import AccountShell from '../AccountShell';
import { createReviewAction } from '../actions';
import RatingInput from './RatingInput';

export const metadata: Metadata = { title: 'Yorumlarım', robots: { index: false, follow: false } };

const STATUS: Record<MyReview['status'], { label: string; badge: string; note?: string }> = {
    pending: { label: 'Onay bekliyor', badge: 'badge-amber', note: 'Genelde bir iş günü içinde yayına alınır.' },
    approved: { label: 'Yayında', badge: 'badge-teal' },
    rejected: { label: 'Yayınlanmadı', badge: 'badge-neutral' },
};

/** Dolu/boş yıldız — salt okunur gösterim. */
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

export default async function MyReviewsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const [{ items, awaiting }, params] = await Promise.all([getMyReviews(), searchParams]);

    const error = one(params.hata);
    const sent = one(params.gonderildi) === '1';
    const writingSlug = one(params.yaz);
    const writing = awaiting.find((product) => product.slug === writingSlug);

    return (
        <AccountShell
            active={routes.accountReviews}
            title="Yorumlarım"
            description="Yalnızca teslim aldığın ürünleri değerlendirebilirsin. Yayında gerçek adın değil, takma adın görünür."
        >
            {error && (
                <p role="alert" className="mb-4 rounded-[var(--radius-md)] bg-accent-200 px-4 py-3 text-[13.5px] font-semibold text-accent-500">
                    {error}
                </p>
            )}
            {sent && (
                <p role="status" className="mb-4 rounded-[var(--radius-md)] bg-teal-tint px-4 py-3 text-[13.5px] font-semibold text-teal-ink">
                    Değerlendirmen alındı. Onaylandıktan sonra ürün sayfasında yayınlanır.
                </p>
            )}

            {/* Yazma formu — "?yaz=urun-slug" ile açılır, yani istemci durumu yok. */}
            {writing && (
                <form action={createReviewAction} className="card card-xl card-edge-top border-t-teal-dot mb-5 p-[clamp(20px,3vw,28px)]">
                    <input type="hidden" name="slug" value={writing.slug} />

                    <span className="text-[11.5px] font-bold text-teal-ink">{writing.orderNumber} siparişinden</span>
                    <h3 className="heading-3 mt-1.5">{writing.name}</h3>

                    <div className="mt-4"><RatingInput idPrefix="yeni" /></div>

                    <label className="mt-4 block">
                        <span className="field-label">Başlık <span className="text-slate-500">(opsiyonel)</span></span>
                        <input name="title" maxLength={120} placeholder="Tek cümleyle özetle" className="field-input" />
                    </label>

                    <label className="mt-3 block">
                        <span className="field-label">Deneyimin</span>
                        <textarea
                            name="body" required minLength={10} maxLength={2000} rows={5}
                            placeholder="Sessizliği, malzemesi, şarj süresi… Sana yardımcı olan neydi?"
                            className="field-input resize-y"
                        />
                    </label>

                    <label className="mt-3 block">
                        <span className="field-label">Yayındaki imzan <span className="text-slate-500">(opsiyonel)</span></span>
                        <input name="pseudonym" maxLength={60} placeholder="Boş bırakırsan “Ad S.” biçiminde görünür" className="field-input" />
                        <span className="mt-1.5 block text-[12px] text-slate-600">
                            Gerçek adın, e-postan ve sipariş numaran hiçbir koşulda yayınlanmaz.
                        </span>
                    </label>

                    <div className="mt-5 flex flex-wrap items-center gap-2.5">
                        <SubmitButton className="btn-accent">Değerlendirmeyi gönder</SubmitButton>
                        <Link href={routes.accountReviews} className="btn-soft">Vazgeç</Link>
                    </div>
                </form>
            )}

            {/* Değerlendirilmeyi bekleyenler */}
            {awaiting.length > 0 && !writing && (
                <section className="card card-edge-left border-l-teal-dot mb-5 p-[18px_20px]">
                    <h3 className="text-[15px] font-bold">Değerlendirilecek ürünler</h3>
                    <p className="mt-1 text-[13px] text-slate-600">
                        Teslim aldığın {awaiting.length} ürün için henüz yorum yazmadın.
                    </p>
                    <ul className="mt-3 space-y-2">
                        {awaiting.map((product) => (
                            <li key={product.slug} className="flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-900/7 pt-2.5 first:border-0 first:pt-0">
                                <div className="min-w-0">
                                    <Link href={routes.product(product.slug)} className="text-[13.5px] font-semibold hover:text-accent-500">
                                        {product.name}
                                    </Link>
                                    <span className="ml-2 text-[12px] text-slate-600">{product.orderNumber}</span>
                                </div>
                                <Link href={`${routes.accountReviews}?yaz=${product.slug}`} className="btn-soft btn-sm">
                                    Değerlendir
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {items.length === 0 ? (
                awaiting.length === 0 && (
                    <EmptyState
                        where="Yorumlar"
                        color="teal"
                        title="Henüz değerlendirme yazmadın"
                        description="Bir siparişin teslim edildiğinde ürünleri burada değerlendirebilirsin. Yorumun yayında takma adınla görünür."
                        action={<Link href={routes.accountOrders} className="btn-secondary">Siparişlerime bak</Link>}
                    />
                )
            ) : (
                <ul className="space-y-3">
                    {items.map((review) => {
                        const status = STATUS[review.status];
                        return (
                            <li key={review.id} className="card p-[18px_20px]">
                                <div className="flex flex-wrap items-center justify-between gap-2.5">
                                    <Link href={routes.product(review.product.slug)} className="text-[14.5px] font-bold hover:text-accent-500">
                                        {review.product.name}
                                    </Link>
                                    <span className={`badge ${status.badge}`}>{status.label}</span>
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-2.5 text-[12.5px] text-slate-600">
                                    <Stars rating={review.rating} />
                                    <span>{formatDate(review.createdAt)}</span>
                                    <span>·</span>
                                    <span>İmza: {review.pseudonym}</span>
                                </div>

                                {review.title && <h4 className="mt-2.5 text-[14px] font-bold">{review.title}</h4>}
                                <p className="mt-1.5 max-w-[68ch] text-[13.5px] leading-relaxed text-slate-700">{review.body}</p>

                                {review.status === 'rejected' && review.rejectReason && (
                                    <p className="mt-3 rounded-[var(--radius-md)] bg-slate-100 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-slate-700">
                                        <strong className="font-bold">Yayınlanmama sebebi:</strong> {review.rejectReason}
                                    </p>
                                )}
                                {review.status === 'pending' && status.note && (
                                    <p className="mt-2.5 text-[12.5px] text-slate-600">{status.note}</p>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </AccountShell>
    );
}
