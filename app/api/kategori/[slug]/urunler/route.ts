import { connection } from 'next/server';
import type { NextRequest } from 'next/server';
import { getProducts } from '@/lib/api';
import { readListingParams } from '@/lib/listing';
import { listingQuery, toSearchParams } from '@/lib/listing-query';

/**
 * Kategori listesinin "sonraki sayfa" vekili (S02). Sayfa sunucuda nasıl
 * okuyorsa aynı sorguyu kurar (`listingQuery`) ve önbellekten döner; tarayıcı
 * API adresini görmez.
 *
 * Bu uç yalnız JavaScript'in otomatik yüklemesi içindir. Keşfin asıl yolu
 * gerçek sayfa adresleri (`?sayfa=N`) ve sayfadaki <a href> bağlantıları;
 * `/api/` robots.txt'de kapalı, arama motoru buraya gelmez.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    await connection();
    const { slug } = await params;
    if (!/^[a-z0-9-]+$/.test(slug)) return Response.json({ error: 'Geçersiz kategori' }, { status: 400 });

    const searchParams = toSearchParams(request.nextUrl.searchParams);
    const state = readListingParams(searchParams);

    try {
        const listing = await getProducts(listingQuery({ category: slug }, state, state.page));
        // Yalnız kartlar ve sayfalama: facet'ler ilk sayfada zaten çizildi.
        return Response.json(
            { items: listing.items, pagination: listing.pagination },
            { headers: { 'Cache-Control': 'no-store' } },
        );
    } catch {
        // "Ürünler bitti" ile karışmasın diye hata açıkça 502: istemci "Tekrar dene" gösterir.
        return Response.json({ error: 'Ürünler yüklenemedi' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
    }
}
