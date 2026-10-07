import { NextResponse, type NextRequest } from 'next/server';
import { isListingPath, normalizeListingSearch } from '@/lib/seo-url';
import { isIndexable, site } from '@/lib/site';

/**
 * İstek render'dan ÖNCE: yalnız ucuz, veri gerektirmeyen URL kuralları.
 *
 * 1. `www` → apex (308). Asıl yönlendirme Vercel alan adı ayarında; bu satır
 *    ayar unutulursa ya da başka bir CDN'e geçilirse yedek.
 * 2. Listelemede `sayfa=1` ve geçersiz `sayfa` (1.5, -1, abc, tekrar eden) →
 *    temiz adrese 308. Eskiden API'ye gidip 400 alıyor ve hata sayfası
 *    basıyordu; `sayfa=1` ise filtresiz listenin kopyasıydı.
 * 3. İndekslenebilir derleme kanonik olmayan bir host'tan açılırsa (Vercel'in
 *    `*.vercel.app` takma adı) noindex + kapalı robots.txt. Başlıklar ve
 *    robots.ts derleme anında üretildiği için host'u ancak burada görebiliyoruz.
 *
 * Detay sayfalarının 404/308'i burada DEĞİL: `notFound()` ve
 * `permanentRedirect()` sayfa kabuğu akmadan çalıştığı için gerçek durum kodu
 * üretiyor (dev.ozmishop.com'da ölçüldü, 7 Ekim 2026).
 */
export function proxy(request: NextRequest) {
    const { nextUrl } = request;
    const host = (request.headers.get('host') ?? '').split(':')[0].toLowerCase();

    if (host === `www.${site.canonicalHost}`) {
        return NextResponse.redirect(`https://${site.canonicalHost}${nextUrl.pathname}${nextUrl.search}`, 308);
    }

    if (isListingPath(nextUrl.pathname)) {
        const search = normalizeListingSearch(nextUrl.search);
        if (search !== null) {
            const target = nextUrl.clone();
            target.search = search;
            return NextResponse.redirect(target, 308);
        }
    }

    if (host !== site.canonicalHost && isIndexable()) {
        if (nextUrl.pathname === '/robots.txt') {
            return new NextResponse('User-agent: *\nDisallow: /\n', {
                headers: { 'content-type': 'text/plain; charset=utf-8' },
            });
        }
        const response = NextResponse.next();
        response.headers.set('X-Robots-Tag', 'noindex, nofollow');
        return response;
    }

    return NextResponse.next();
}

/*
 * Kanonik host'ta proxy YALNIZ `sayfa` taşıyan listeleme adreslerinde çalışır;
 * ürün ve diğer sayfalar ek gecikme görmez. Kanonik olmayan host'ta (www,
 * vercel.app, dev, yerel) statik dosyalar hariç her istekte çalışır.
 * Değerler derleme anında okunur: değişken kullanılamaz, `site.canonicalHost`
 * ile aynı tutulmalı.
 */
export const config = {
    matcher: [
        { source: '/(kategori|marka|koleksiyon)/:slug', has: [{ type: 'query', key: 'sayfa' }] },
        { source: '/(gunluk|arama)', has: [{ type: 'query', key: 'sayfa' }] },
        { source: '/((?!_next/|api/).*)', missing: [{ type: 'host', value: 'ozmishop\\.com' }] },
    ],
};
