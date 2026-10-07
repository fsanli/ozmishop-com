import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import Container from '@/components/Container';
import { getAttempt, isAttemptId } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import { routes } from '@/lib/site';
import AttemptPoller from '../../AttemptPoller';
import PaytrFrame from './PaytrFrame';

export const metadata: Metadata = {
    title: 'Kartla ödeme',
    robots: { index: false, follow: false },
};

/** Kart sayfası açıkken sonuç yoklaması: dönüş sayfası iframe'den çıkamazsa da yakalanır. */
const POLL_MS = 5000;

/**
 * PayTR iframe'inin gömüldüğü sayfa. Deneme bu tarayıcının çerezindeki
 * jetonla okunur; adresteki kimlik tek başına hiçbir şey açmaz.
 *
 * Deneme artık ödenebilir değilse sayfa çizilmez: onaylandıysa sipariş
 * çerezini yazan uca (`/odeme/sonuc/tamam`), başarısızsa hata mesajıyla
 * ödeme formuna, yenisiyle değiştirildiyse forma.
 */
async function CardPaymentContent({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!isAttemptId(id)) notFound();

    const attempt = await getAttempt(id);
    if (!attempt) redirect(routes.checkout);
    if (attempt.status === 'succeeded') redirect(routes.paymentDone(id));
    if (attempt.failure) redirect(routes.checkoutRetry(id));
    if (attempt.status !== 'token_ready' || !attempt.iframeUrl) redirect(routes.checkout);

    return (
        <div className="flex flex-wrap items-start gap-[clamp(14px,2vw,24px)]">
            <section className="card card-xl min-w-0 flex-[999_1_460px] p-[clamp(14px,2.2vw,24px)]">
                <PaytrFrame attemptId={id} iframeUrl={attempt.iframeUrl} />
                <AttemptPoller attemptId={id} intervalMs={POLL_MS} />
            </section>

            <aside className="card card-xl min-w-0 flex-[1_1_280px] p-[clamp(18px,2.4vw,24px)] lg:max-w-[340px]">
                <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13.5px] font-semibold">Ödenecek tutar</span>
                    <span className="price text-[24px]">{formatPrice(attempt.grandTotal)}</span>
                </div>
                <div className="hr" />
                <p className="text-[13px] leading-relaxed text-slate-600">
                    Kart bilgilerin ozmishop&rsquo;a iletilmez; ödeme PayTR&rsquo;nin güvenli sayfasında alınır.
                    Ödeme onaylanınca siparişin oluşur ve sipariş sayfasına geçersin.
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
                    Ödeme tamamlanmazsa kartından çekim yapılmaz, sepetin olduğu gibi kalır.
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
                    Havale/EFT ile ödemek ya da bilgilerini değiştirmek istersen ödeme sayfasına dönebilirsin.
                </p>
                <Link href={routes.checkout} className="btn-secondary mt-4">← Ödeme sayfasına dön</Link>
            </aside>
        </div>
    );
}

export default function CardPaymentPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <Container className="pt-[clamp(18px,3vw,30px)]">
            <h1 className="heading-1">Kartla ödeme</h1>
            <div className="mt-5">
                <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-xl)] bg-slate-100" />}>
                    <CardPaymentContent params={params} />
                </Suspense>
            </div>
        </Container>
    );
}
