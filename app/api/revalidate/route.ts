import { revalidateTag, revalidatePath } from 'next/cache';
import { timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

/**
 * Önbellek geçersiz kılma ucu — ozmishop-api buraya POST atar.
 *
 * Panelde bir ürün/kategori/banner değişince API ilgili etiketleri gönderir ve
 * ziyaretçi bir sonraki istekte güncel içeriği görür. Zaman aşımına (TTL) bağlı
 * beklemek yok; bu yüzden lib/api.ts'teki cacheLife süreleri uzun tutulabiliyor.
 */
const SECRET = process.env.REVALIDATE_SECRET || '';

// `all` gönderildiğinde temizlenen kök etiketler (API'deki CacheService.TAGS ile aynı).
const ROOT_TAGS = ['home', 'products', 'categories', 'brands', 'groups', 'banners', 'pages'];

function isAuthorized(request: NextRequest): boolean {
    const provided = request.headers.get('x-revalidate-secret') || '';
    if (!SECRET || !provided) return false;
    const a = Buffer.from(provided);
    const b = Buffer.from(SECRET);
    // Sabit zamanlı karşılaştırma: uzunluk farkı da sızıntı olmasın diye önce eşitlenir.
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
    if (!isAuthorized(request)) {
        return Response.json({ revalidated: false, message: 'Yetkisiz' }, { status: 401 });
    }

    let body: { tags?: unknown; all?: unknown };
    try {
        body = await request.json();
    } catch {
        return Response.json({ revalidated: false, message: 'Geçersiz gövde' }, { status: 400 });
    }

    const started = Date.now();
    const requested = Array.isArray(body.tags) ? body.tags.filter((tag): tag is string => typeof tag === 'string') : [];
    const wantsAll = body.all === true || requested.includes('all');
    const tags = wantsAll ? [...new Set([...ROOT_TAGS, ...requested.filter((tag) => tag !== 'all')])] : requested;

    if (!tags.length) {
        return Response.json({ revalidated: false, message: 'Etiket verilmedi' }, { status: 400 });
    }

    // Route handler'da updateTag kullanılamaz; revalidateTag {expire: 0} ile anında
    // geçersiz kılar (dış sistemden gelen çağrılar için önerilen biçim).
    tags.forEach((tag) => revalidateTag(tag, { expire: 0 }));
    if (wantsAll) revalidatePath('/', 'layout');

    return Response.json({ revalidated: true, tags, durationMs: Date.now() - started });
}
