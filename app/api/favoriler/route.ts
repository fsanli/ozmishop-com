import { connection } from 'next/server';
import { accountFetch, getCurrentCustomer } from '@/lib/session';

/**
 * Favori kimlikleri — istemcide sonradan çizilen kartların (kategori listesinin
 * otomatik yüklenen sayfaları) kalbi için. Sunucuda çizilen kartlar bunu
 * `FavoriteState` ile alıyor; istemci ağacı çerez okuyamadığı için vekil.
 *
 * Misafirde boş liste: kalp boş çizilir, tıklanınca girişe yollar.
 */
export async function GET() {
    await connection();
    const empty = Response.json({ ids: [] }, { headers: { 'Cache-Control': 'no-store' } });
    // Oturumsuz istekte accountFetch girişe yönlendirir; önce oturum kontrolü.
    if (!await getCurrentCustomer().catch(() => null)) return empty;
    try {
        const { ids } = await accountFetch<{ ids: number[] }>('/users/me/favorite-ids');
        return Response.json({ ids }, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
        return empty;
    }
}
