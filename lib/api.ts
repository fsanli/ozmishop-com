import { cacheLife, cacheTag } from 'next/cache';
import type {
    BrandSummary,
    Category,
    CategoryDetail,
    ContentPage,
    HomeSection,
    GuideQuestion,
    GuideResult,
    JournalIndex,
    JournalPostDetail,
    JournalTopic,
    ReviewList,
    SiteSettings,
    MenuTree,
    ProductDetail,
    ProductGroup,
    ProductListing,
    SitemapData,
    Suggestions, PageGroup,
} from './types';

/**
 * API istemcisi ve ÖNBELLEK KATMANI.
 *
 * Her okuma fonksiyonu `use cache` ile önbelleklenir ve `cacheTag` ile etiketlenir.
 * Süreler bilinçli olarak uzun: tazelik zamana değil, panelde bir değişiklik olduğunda
 * API'nin çağırdığı `POST /api/revalidate` ucuna bağlı. Böylece hem sayfa hızlı hem veri
 * anında güncel (bkz. app/api/revalidate/route.ts).
 *
 * Etiketler ozmishop-api'deki CacheService.TAGS ile birebir aynıdır:
 *   home · products · categories · brands · groups · banners · pages
 *   product:{slug} · category:{slug} · brand:{slug} · group:{code} · page:{slug}
 */
const API_BASE = (process.env.API_BASE_URL || 'http://localhost:4200').replace(/\/$/, '');

export class ApiError extends Error {
    readonly statusCode: number;
    readonly code: number;
    readonly requestId?: string;

    constructor(message: string, statusCode: number, code = 0, requestId?: string) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code;
        this.requestId = requestId;
    }

    get isNotFound() {
        return this.statusCode === 404;
    }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
        response = await fetch(`${API_BASE}${path}`, {
            ...init,
            headers: { Accept: 'application/json', ...(init?.headers || {}) },
        });
    } catch (error) {
        // Derleme sırasında API kapalıysa burada durmak, katalogsuz bir siteyi
        // sessizce yayına almaktan iyidir; mesaj sebebi açıkça söyler.
        throw new ApiError(
            `API'ye ulaşılamıyor (${API_BASE}${path}). ozmishop-api çalışıyor mu? — ${(error as Error).message}`,
            503,
        );
    }

    if (!response.ok) {
        let body: { message?: string; code?: number; requestId?: string } = {};
        try {
            body = await response.json();
        } catch {
            /* gövde okunamadı */
        }
        throw new ApiError(body.message || `HTTP ${response.status}`, response.status, body.code ?? 0, body.requestId);
    }

    return response.json() as Promise<T>;
}

/** 404'ü null'a çevirir; diğer hatalar yükselir. */
async function tryRequest<T>(path: string, init?: RequestInit): Promise<T | null> {
    try {
        return await request<T>(path, init);
    } catch (error) {
        if (error instanceof ApiError && error.isNotFound) return null;
        throw error;
    }
}

const query = (params: Record<string, unknown> | object): string => {
    const search = new URLSearchParams();
    Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        if (Array.isArray(value)) {
            value.forEach((item) => search.append(key, String(item)));
        } else {
            search.set(key, String(value));
        }
    });
    const text = search.toString();
    return text ? `?${text}` : '';
};

// --- Anasayfa ---------------------------------------------------------------
export async function getHome(): Promise<{ sections: HomeSection[] }> {
    'use cache';
    cacheTag('home');
    cacheLife('days');
    return request<{ sections: HomeSection[] }>('/home');
}

// --- Kategoriler --------------------------------------------------------------
/**
 * Anasayfa taslağı, panelin ürettiği kısa ömürlü önizleme jetonuyla.
 * ASLA önbelleklenmez: taslak içerik ne müşteriye ne de önbelleğe girer.
 */
export async function getHomePreview(token: string): Promise<{ sections: HomeSection[] } | null> {
    try {
        return await request<{ sections: HomeSection[] }>(
            `/home?preview=${encodeURIComponent(token)}`, { cache: 'no-store' },
        );
    } catch {
        // Süresi dolmuş ya da bozuk jeton: 404'e düşülür, hata sayfası gösterilmez.
        return null;
    }
}

export async function getCategoryTree(): Promise<Category[]> {
    'use cache';
    cacheTag('categories');
    cacheLife('days');
    const data = await request<{ items: Category[] }>('/catalog/categories');
    return data.items;
}

export async function getCategory(slug: string): Promise<CategoryDetail | null> {
    'use cache';
    cacheTag('categories', `category:${slug}`);
    cacheLife('days');
    return tryRequest<CategoryDetail>(`/catalog/categories/${slug}`);
}

// --- Markalar -----------------------------------------------------------------
export async function getBrands(): Promise<BrandSummary[]> {
    'use cache';
    cacheTag('brands');
    cacheLife('days');
    const data = await request<{ items: BrandSummary[] }>('/catalog/brands');
    return data.items;
}

export async function getBrand(slug: string): Promise<BrandSummary | null> {
    'use cache';
    cacheTag('brands', `brand:${slug}`);
    cacheLife('days');
    return tryRequest<BrandSummary>(`/catalog/brands/${slug}`);
}

// --- Ürünler -------------------------------------------------------------------
export interface ProductQuery {
    category?: string;
    brand?: string;
    values?: number[];
    /** "tanim-slug:secenek-slug" — künye seçimleri (varyantlardan ayrı kanal) */
    ozellik?: string[];
    /** "tanim-slug:min:max" — künye aralıkları */
    aralik?: string[];
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    discounted?: boolean;
    sort?: string;
    page?: number;
    pageSize?: number;
    facets?: boolean;
    days?: number;
}

export async function getProducts(params: ProductQuery): Promise<ProductListing> {
    'use cache';
    // Kategori/marka etiketi de eklenir: o kategori değişince liste de tazelenir.
    const tags = ['products'];
    if (params.category) tags.push(`category:${params.category}`);
    if (params.brand) tags.push(`brand:${params.brand}`);
    cacheTag(...tags);
    cacheLife('days');
    return request<ProductListing>(`/catalog/products${query({ ...params })}`);
}

export async function getProduct(slug: string): Promise<ProductDetail | null> {
    'use cache';
    cacheTag('products', `product:${slug}`);
    cacheLife('days');
    return tryRequest<ProductDetail>(`/catalog/products/${slug}`);
}

// --- Ürün grupları -----------------------------------------------------------------
export async function getProductGroups(): Promise<ProductGroup[]> {
    'use cache';
    cacheTag('groups');
    cacheLife('days');
    const data = await request<{ items: ProductGroup[] }>('/catalog/product-groups');
    return data.items;
}

export async function getProductGroup(slug: string, params: { page?: number; pageSize?: number } = {}): Promise<ProductGroup | null> {
    'use cache';
    cacheTag('groups', `group:${slug}`);
    cacheLife('days');
    return tryRequest<ProductGroup>(`/catalog/product-groups/${slug}${query(params)}`);
}

/**
 * Anasayfadaki ürün grubu bloğu. Grup kodu ile etiketlenir ki panelde o grup
 * değişince yalnızca ilgili blok tazelensin.
 */
export async function getGroupByCode(code: string, limit: number): Promise<ProductGroup | null> {
    'use cache';
    cacheTag('groups', `group:${code}`);
    cacheLife('days');
    const groups = await request<{ items: ProductGroup[] }>('/catalog/product-groups');
    const group = groups.items.find((item) => item.code === code);
    if (!group) return null;
    return tryRequest<ProductGroup>(`/catalog/product-groups/${group.slug}${query({ pageSize: limit })}`);
}

// --- İçerik ------------------------------------------------------------------------
export async function getPages(): Promise<ContentPage[]> {
    'use cache';
    cacheTag('pages');
    cacheLife('days');
    const data = await request<{ items: ContentPage[] }>('/pages');
    return data.items;
}

/**
 * Sayfalar + grup etiketleri. Etiketler API'den geliyor: footer kolonları ve
 * sayfa kenar çubuğu aynı sırayı kullanıyor ve vitrin ikinci bir liste
 * tutmuyor. Eskiden footer sabit bir slug listesinden (FOOTER_HELP_SLUGS)
 * besleniyordu; yeni bir sayfa eklemek kod değiştirmek demekti.
 */
export async function getPagesGrouped(): Promise<{ items: ContentPage[]; groups: PageGroup[] }> {
    'use cache';
    cacheTag('pages');
    cacheLife('days');
    return request<{ items: ContentPage[]; groups: PageGroup[] }>('/pages');
}

export async function getPage(slug: string): Promise<ContentPage | null> {
    'use cache';
    cacheTag('pages', `page:${slug}`);
    cacheLife('days');
    return tryRequest<ContentPage>(`/pages/${slug}`);
}

// --- Günlük ------------------------------------------------------------------
/**
 * Günlük indeksi. `posts` etiketiyle önbelleklenir; konu filtresi varsa o konunun
 * etiketi de eklenir, böylece panelde bir yazı değişince yalnız ilgili sayfalar
 * tazelenir.
 *
 * Zamanlanmış yayın burada bir tuzak: API `published_at <= now()` filtreliyor ama
 * önbellek süresi gün mertebesinde. `cacheLife('hours')` bilinçli — zamanı gelen
 * bir yazının en geç bir saat içinde görünmesini garanti eder, panel tetiklemesi
 * beklemeden.
 */
export async function getJournal(params: { topic?: string; page?: number } = {}): Promise<JournalIndex> {
    'use cache';
    cacheTag(...['posts', params.topic && `topic:${params.topic}`].filter(Boolean) as string[]);
    cacheLife('hours');
    return request<JournalIndex>(`/gunluk${query(params)}`);
}

export async function getPost(slug: string): Promise<JournalPostDetail | null> {
    'use cache';
    cacheTag('posts', `post:${slug}`);
    cacheLife('days');
    return tryRequest<JournalPostDetail>(`/gunluk/${slug}`);
}

export async function getJournalTopics(): Promise<JournalTopic[]> {
    'use cache';
    cacheTag('topics', 'posts');
    cacheLife('days');
    const data = await request<{ items: JournalTopic[] }>('/gunluk/konular');
    return data.items;
}

export async function getJournalTopic(slug: string): Promise<JournalTopic | null> {
    'use cache';
    cacheTag('topics', `topic:${slug}`);
    cacheLife('days');
    return tryRequest<JournalTopic>(`/gunluk/konular/${slug}`);
}

// --- Değerlendirmeler ----------------------------------------------------------
/**
 * Ürün değerlendirmeleri. `reviews` etiketi yok — yorum onaylanınca API
 * `product:{slug}` düşürüyor (bkz. cache.js → case 'review'), o yüzden burada
 * ürünün kendi etiketi yeterli.
 */
export async function getReviews(slug: string, page = 1): Promise<ReviewList | null> {
    'use cache';
    cacheTag('products', `product:${slug}`);
    cacheLife('hours');
    return tryRequest<ReviewList>(`/catalog/products/${slug}/reviews${query({ page })}`);
}

// --- Ayarlar ve menü ------------------------------------------------------------
/**
 * Açık ayarlar. Vitrinin HER yerinde okunuyor (kargo eşiği, KDV, 18+ metni,
 * nötr ekstre adı) — bu yüzden uzun ömürlü ve `settings` etiketiyle düşer.
 */
export async function getSettings(): Promise<SiteSettings> {
    'use cache';
    cacheTag('settings');
    cacheLife('days');
    return request<SiteSettings>('/settings');
}

export async function getMenu(code: string): Promise<MenuTree> {
    'use cache';
    cacheTag('settings');
    cacheLife('days');
    return request<MenuTree>(`/menus/${code}`);
}

// --- Başlangıç rehberi --------------------------------------------------------
/** Sorular panelden yönetiliyor; `guide` etiketiyle önbelleklenir. */
export async function getGuideQuestions(): Promise<GuideQuestion[]> {
    'use cache';
    cacheTag('guide');
    cacheLife('days');
    const data = await request<{ items: GuideQuestion[] }>('/guide');
    return data.items;
}

/**
 * Sonuç. `products` etiketi de eklenir: bir ürün tükendiğinde ya da fiyatı
 * değiştiğinde rehberin önerisi de bayatlar.
 *
 * Yol (`path`) argüman olarak `use cache` anahtarına giriyor — içinde kimlik
 * bilgisi YOK, yalnızca dört harf. Cevaplar kaydedilmiyor iddiası korunuyor:
 * hangi ziyaretçinin hangi yolu seçtiği hiçbir yere yazılmıyor.
 */
export async function getGuideResults(path: string): Promise<GuideResult> {
    'use cache';
    cacheTag('guide', 'products');
    cacheLife('hours');
    return request<GuideResult>('/guide/results', {
        method: 'POST',
        body: JSON.stringify({ path }),
        headers: { 'Content-Type': 'application/json' },
    });
}

export async function getSitemapData(): Promise<SitemapData> {
    'use cache';
    cacheTag('products', 'categories', 'brands', 'groups', 'pages');
    cacheLife('hours');
    return request<SitemapData>('/catalog/sitemap');
}

// --- Önbelleklenmeyenler ------------------------------------------------------------
/** Arama sonuçları kullanıcıya özgüdür ve sık değişir; önbelleklenmez. */
export async function search(params: ProductQuery & { q: string }): Promise<ProductListing & { query: string }> {
    return request<ProductListing & { query: string }>(`/catalog/search${query(params)}`, { cache: 'no-store' });
}

export async function suggest(q: string): Promise<Suggestions> {
    return request<Suggestions>(`/catalog/suggest${query({ q })}`, { cache: 'no-store' });
}

export async function resolveRedirect(path: string): Promise<{ redirect: string | null }> {
    return request<{ redirect: string | null }>(`/redirects/resolve${query({ path })}`, { cache: 'no-store' });
}

export async function recordPostView(slug: string): Promise<void> {
    await request('/events/post-view', {
        method: 'POST',
        body: JSON.stringify({ slug }),
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
    });
}

/**
 * Bülten kaydı. Hata mesajı çağırana AYNEN döner: API zaten "zaten kayıtlısınız"
 * demiyor (bilgi sızdırmamak için), yani buradan sızacak bir şey yok.
 */
export async function subscribeNewsletter(email: string, source = 'gunluk'): Promise<void> {
    await request('/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email, source }),
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
    });
}

export async function recordProductView(slug: string): Promise<void> {
    await request('/events/product-view', {
        method: 'POST',
        body: JSON.stringify({ slug }),
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
    });
}
