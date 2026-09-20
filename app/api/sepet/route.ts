import { connection } from 'next/server';
import { getCart } from '@/lib/cart';

/**
 * Sepet çekmecesinin okuduğu vekil.
 *
 * Neden vekil: sepet jetonu httpOnly bir çerezde ve tarayıcı onu göremiyor.
 * Çekmece açıldığında buraya soruyor, sunucu jetonu okuyup API'ye gidiyor.
 *
 * Neden YERLEŞİMDE sunucu bileşeni değil: çekmece nadiren açılıyor. İçeriği
 * her sayfada sunucuda render etmek, hiç açılmayacak bir panel için her
 * gezinmede bir API isteği demekti.
 */
export async function GET() {
    await connection();

    try {
        const cart = await getCart();
        return Response.json(cart, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
        // Sepet okunamadıysa çekmece boş görünsün; hata ekranı açmak abartı.
        return Response.json(
            { token: '', itemCount: 0, items: [], issues: [], coupon: null, shippingOptions: [], selectedShippingRateId: null, totals: { subtotal: 0, discount: 0, shipping: 0, grandTotal: 0 } },
            { status: 200, headers: { 'Cache-Control': 'no-store' } },
        );
    }
}
