import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Container from '@/components/Container';
import { getCart, getInstallments } from '@/lib/cart';
import { routes } from '@/lib/site';
import CheckoutForm from './CheckoutForm';

export const metadata: Metadata = {
    title: 'Ödeme',
    robots: { index: false, follow: false },
};

async function CheckoutContent() {
    const cart = await getCart();
    // Boş sepetle ödeme sayfasında durmanın anlamı yok.
    if (cart.items.length === 0) redirect(routes.cart);

    const { options } = await getInstallments();
    return <CheckoutForm cart={cart} installments={options} />;
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
