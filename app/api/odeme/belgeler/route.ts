import { cookies } from 'next/headers';
import { proxyHeaders } from '@/lib/bff';
import { CART_COOKIE, SESSION_COOKIE } from '@/lib/session';

const API_BASE = (process.env.API_BASE_URL || 'http://localhost:4200').replace(/\/$/, '');

/**
 * Ödeme formundaki "belgeyi oku" penceresinin vekili. Ön bilgilendirme formu
 * ve mesafeli satış sözleşmesi, o anki sepet ve formdaki bilgilerle (alıcı,
 * adres, ödeme yöntemi) doldurulup döner.
 *
 * Vekil çünkü sepet jetonu httpOnly çerezde; tarayıcı API'ye doğrudan gidemez.
 * Okuma olduğu için Server Action değil route handler (bkz. /api/sepet).
 */
export async function POST(request: Request) {
    const body = await request.json().catch(() => ({}));
    const jar = await cookies();
    const token = jar.get(CART_COOKIE)?.value;
    const session = jar.get(SESSION_COOKIE)?.value;

    const response = await fetch(`${API_BASE}/checkout/documents`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(await proxyHeaders()),
            ...(token ? { 'x-cart-token': token } : {}),
            ...(session ? { Authorization: `Bearer ${session}` } : {}),
        },
        body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));
    return Response.json(result, { status: response.ok ? 200 : response.status, headers: { 'Cache-Control': 'no-store' } });
}
