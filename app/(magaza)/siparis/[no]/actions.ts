'use server';

import { redirect } from 'next/navigation';
import { getOrder, rememberOrderAccess } from '@/lib/cart';
import { routes } from '@/lib/site';

const ORDER_NO = /^[A-Z0-9-]{6,40}$/;

/**
 * "Siparişimi bul": başka cihazdan ya da çerezi silinmiş tarayıcıdan gelen
 * misafir. E-posta POST gövdesinde kalır; doğrulanırsa erişim jetonu çereze
 * yazılır ve sipariş sayfası E-POSTASIZ adresle açılır (adres geçmişe,
 * Referer'a ve analitiğe kişisel veri taşımasın).
 */
export async function findOrderAction(formData: FormData): Promise<void> {
    // Numara sayfanın adresinden (gizli alan); kullanıcı yalnız e-postayı yazar.
    const no = String(formData.get('no') ?? '');
    const email = String(formData.get('email') ?? '').trim();
    if (!ORDER_NO.test(no)) redirect(routes.home);
    if (!email) redirect(`${routes.order(no)}?hata=1`);

    const order = await getOrder(no, email);
    if (!order?.accessToken) redirect(`${routes.order(no)}?hata=1`);

    await rememberOrderAccess(no, order.accessToken);
    redirect(routes.order(no));
}
