import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Container from '@/components/Container';
import { getMyAddresses } from '@/lib/account';
import { getLegalStatus, getLocations, getSettings } from '@/lib/api';
import { getAttempt, getCart, getInstallments, isAttemptId } from '@/lib/cart';
import { getCurrentCustomer } from '@/lib/session';
import { routes } from '@/lib/site';
import CheckoutForm from './CheckoutForm';
import { TrackCart } from '@/components/analytics/Track';

export const metadata: Metadata = {
    title: 'Ödeme',
    robots: { index: false, follow: false },
};

/**
 * Başarısız kart denemesinden dönüş (`?deneme=`). Mesaj API'den gelir ve
 * olduğu gibi basılır; deneme bu tarayıcının değilse (çerez yok) hiçbir şey
 * çizilmez — adresteki kimlik tek başına bir şey göstermez. Sepet denemeden
 * etkilenmediği için form her zamanki gibi çalışır.
 */
async function AttemptNotice({ searchParams }: { searchParams: Promise<{ deneme?: string }> }) {
    const { deneme } = await searchParams;
    if (!isAttemptId(deneme)) return null;
    const attempt = await getAttempt(deneme);
    // Geç gelen başarı: ödeme sonradan onaylanmış, sipariş zaten var.
    if (attempt?.status === 'succeeded') redirect(routes.paymentDone(deneme));
    if (!attempt?.failure) return null;

    return (
        <div role="alert" className="mb-4 rounded-[var(--radius-md)] bg-accent-200 px-4 py-3 text-[13.5px] leading-relaxed text-accent-500">
            <p className="font-bold">{attempt.failure.message}</p>
            <p className="mt-1 font-semibold">
                Kartından çekim yapılmadı. Bilgilerini kontrol edip tekrar deneyebilir ya da havale/EFT seçebilirsin.
            </p>
        </div>
    );
}

async function CheckoutContent() {
    const cart = await getCart();
    // Boş sepetle ödeme sayfasında durmanın anlamı yok.
    if (cart.items.length === 0) redirect(routes.cart);

    const [{ options }, locations, customer, settings, legal] = await Promise.all([
        getInstallments(), getLocations(), getCurrentCustomer(), getSettings(), getLegalStatus(),
    ]);
    // Kayıtlı adresler yalnız üyede; misafirde istek hiç atılmaz (accountFetch
    // oturumsuz isteği girişe yönlendirirdi).
    const addresses = customer ? (await getMyAddresses().catch(() => ({ items: [] }))).items : [];

    return (
        <>
            <TrackCart name="begin_checkout" cart={cart} />
            <CheckoutForm
                cart={cart}
                installments={options}
                locations={locations}
                customer={customer ? { email: customer.email, phone: customer.phone } : null}
                addresses={addresses}
                methods={{
                    card: settings['odeme.kart_kullanilabilir'] !== false,
                    transfer: settings['odeme.havale_kullanilabilir'] === true,
                }}
                legalDocuments={legal.documents}
                settings={settings}
                // Sepet okunduktan sonra: istek zamanlı, her çizimde yeni.
                idempotencyKey={crypto.randomUUID()}
            />
        </>
    );
}

export default function CheckoutPage({ searchParams }: { searchParams: Promise<{ deneme?: string }> }) {
    return (
        <Container className="pt-[clamp(18px,3vw,30px)]">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h1 className="heading-1">Ödeme</h1>
                <Link href={routes.cart} className="text-[13px] font-bold text-accent-500">← Sepeti düzenle</Link>
            </div>

            <div className="mt-5">
                <Suspense fallback={null}>
                    <AttemptNotice searchParams={searchParams} />
                </Suspense>
                <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-xl)] bg-slate-100" />}>
                    <CheckoutContent />
                </Suspense>
            </div>
        </Container>
    );
}
