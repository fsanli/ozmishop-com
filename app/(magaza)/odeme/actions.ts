'use server';

import { redirect } from 'next/navigation';
import { placeOrder } from '@/lib/cart';
import { routes } from '@/lib/site';

export interface CheckoutState {
    error: string | null;
}

/**
 * Siparişi tamamlar.
 *
 * Kart bilgisi BU AKIŞTAN GEÇMEZ: sağlayıcı kendi 3DS sayfasında toplar. Burada
 * yalnızca iletişim, adres, kargo ve yöntem var.
 *
 * `useActionState` ile çağrılır — sitedeki tek yer. Alan bazlı hatayı formda
 * göstermek için istemci durumu gerekiyor; diğer formlar `?hata=` ile idare
 * ediyor ama ödeme formunda girilen onca alanı kaybettirmek olmaz.
 */
export async function placeOrderAction(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
    const value = (name: string) => String(formData.get(name) ?? '').trim();

    const shippingAddress = {
        firstname: value('firstname'),
        lastname: value('lastname'),
        phone: value('phone'),
        city: value('city'),
        district: value('district'),
        neighbourhood: value('neighbourhood') || null,
        addressLine: value('addressLine'),
        postalCode: value('postalCode') || null,
    };

    let result: Awaited<ReturnType<typeof placeOrder>>;
    try {
        result = await placeOrder({
            email: value('email'),
            phone: value('phone'),
            shippingAddress,
            // "Fatura adresim aynı" işaretliyse ayrı adres gönderilmez.
            billingAddress: null,
            shippingRateId: Number(formData.get('shippingRateId')),
            paymentMethod: value('paymentMethod') === 'transfer' ? 'transfer' : 'card',
            installment: Number(formData.get('installment') || 1),
            note: value('note') || null,
        });
    } catch (error) {
        return { error: (error as Error).message };
    }

    // Kart ödemesinde sağlayıcı 3DS sayfasına yönlendirir; havalede doğrudan onaya.
    if (result.redirectUrl) redirect(result.redirectUrl);
    redirect(`${routes.order(result.orderNumber)}?e=${encodeURIComponent(value('email'))}`);
}
