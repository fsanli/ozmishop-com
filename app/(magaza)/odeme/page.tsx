import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Container from '@/components/Container';
import { getMyAddresses } from '@/lib/account';
import { getLegalStatus, getLocations, getSettings } from '@/lib/api';
import { getCart, getInstallments } from '@/lib/cart';
import { getCurrentCustomer } from '@/lib/session';
import { routes } from '@/lib/site';
import CheckoutForm from './CheckoutForm';
import { TrackCart } from '@/components/analytics/Track';

export const metadata: Metadata = {
    title: 'Ödeme',
    robots: { index: false, follow: false },
};

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
            />
        </>
    );
}

export default function CheckoutPage() {
    return (
        <Container className="pt-[clamp(18px,3vw,30px)]">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h1 className="heading-1">Ödeme</h1>
                <Link href={routes.cart} className="text-[13px] font-bold text-accent-500">← Sepeti düzenle</Link>
            </div>

            <div className="mt-5">
                <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-xl)] bg-slate-100" />}>
                    <CheckoutContent />
                </Suspense>
            </div>
        </Container>
    );
}
