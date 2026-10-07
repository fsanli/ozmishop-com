import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Container from '@/components/Container';
import { getAttempt, isAttemptId } from '@/lib/cart';
import { routes } from '@/lib/site';
import AttemptPoller from '../../AttemptPoller';

export const metadata: Metadata = {
    title: 'Ödeme kontrol ediliyor',
    robots: { index: false, follow: false },
};

const POLL_MS = 2000;
/** Bu süreden sonra yoklama durur; sonuç gelince e-postayla bildirilir. */
const TIMEOUT_MS = 60_000;

const card = 'card card-xl mx-auto max-w-[520px] p-[clamp(24px,4vw,36px)]';

function Lost() {
    return (
        <div className={card}>
            <h1 className="heading-3">Ödeme bilgisi bulunamadı</h1>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                Bu ödemenin durumu bu tarayıcıda görüntülenemiyor. Ödeme onaylandıysa siparişin oluşur ve
                e-postayla bildirilir.
            </p>
            <Link href={routes.home} className="btn-accent mt-5">Anasayfaya dön</Link>
        </div>
    );
}

/**
 * PayTR dönüşünden sonraki bekleme ekranı. Tarayıcının dönüşü (`r=ok`) sonuca
 * karar VERMEZ: sağlayıcının sunucu bildirimi gelene kadar deneme açık kalır
 * ve bu ekran onu yoklar. Sonuç gelince yoklama aksiyonu yönlendirir.
 */
async function PendingContent({ searchParams }: { searchParams: Promise<{ a?: string }> }) {
    const { a } = await searchParams;
    if (!isAttemptId(a)) return <Lost />;

    const attempt = await getAttempt(a);
    if (!attempt) return <Lost />;
    // Bildirim dönüşten önce gelmiş: beklemeye gerek yok.
    if (attempt.status === 'succeeded') redirect(routes.paymentDone(a));
    if (attempt.failure) redirect(routes.checkoutRetry(a));
    if (attempt.status === 'superseded') redirect(routes.checkout);

    return (
        <AttemptPoller
            attemptId={a}
            intervalMs={POLL_MS}
            timeoutMs={TIMEOUT_MS}
            lost={<Lost />}
            pending={(
                <div className={`${card} text-center`} role="status" aria-live="polite">
                    <span className="mx-auto block size-9 animate-spin rounded-full border-[3px] border-slate-900/10 border-t-accent-500" aria-hidden />
                    <h1 className="heading-3 mt-5">Ödemen kontrol ediliyor…</h1>
                    <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                        Bankanın onayı genellikle birkaç saniye içinde gelir. Bu sayfayı kapatma; sonuç gelince
                        kendiliğinden yönlendirileceksin.
                    </p>
                </div>
            )}
            gaveUpClassName={card}
            gaveUp={(
                <>
                    <h1 className="heading-3">Sonuç henüz gelmedi</h1>
                    <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                        Ödemenin sonucu henüz bize ulaşmadı. Sonuç e-postayla bildirilecek; kartından çekim
                        yapıldıysa siparişin otomatik oluşur. Bu sayfayı kapatabilirsin.
                    </p>
                </>
            )}
        />
    );
}

export default function PaymentPendingPage({ searchParams }: { searchParams: Promise<{ a?: string }> }) {
    return (
        <Container className="pt-[clamp(28px,5vw,56px)]">
            <Suspense fallback={<div className={`${card} h-56 animate-pulse bg-slate-100`} />}>
                <PendingContent searchParams={searchParams} />
            </Suspense>
        </Container>
    );
}
