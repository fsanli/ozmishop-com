import { connection } from 'next/server';
import type { NextRequest } from 'next/server';
import { suggest } from '@/lib/api';

/**
 * Arama önerisi vekili. Tarayıcı API adresini hiç görmez (BFF); istemci yalnızca
 * kendi kaynağına istek atar.
 */
export async function GET(request: NextRequest) {
    await connection();

    const q = (request.nextUrl.searchParams.get('q') || '').trim();
    if (q.length < 2) {
        return Response.json({ products: [], categories: [], brands: [] });
    }

    try {
        return Response.json(await suggest(q));
    } catch {
        // Öneri kritik değil: hata yerine boş sonuç dönmek arama kutusunu kırmaz.
        return Response.json({ products: [], categories: [], brands: [] });
    }
}
