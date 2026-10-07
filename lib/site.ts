/** Site sabitleri ve rota üreticileri — adresler tek yerden üretilir. */

export const site = {
    name: 'ozmishop',
    title: 'ozmishop — Yetişkin Ürünleri',
    description:
        'Gizli paketleme ve güvenli ödeme ile yetişkinlere özel ürünler. Orijinal, faturalı ve hızlı kargo.',
    url: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3201').replace(/\/$/, ''),
    locale: 'tr_TR',
    /**
     * Tek kanonik host. `www` buraya GİRMEZ: Vercel www'yi apex'e 308 ile
     * yönlendirir; `NEXT_PUBLIC_SITE_URL` www olsaydı her canonical, kendisi
     * yönlenen bir adresi gösterirdi.
     */
    canonicalHost: 'ozmishop.com',
} as const;

/**
 * Boş bir koleksiyonda `generateStaticParams` için yer tutucu.
 *
 * Cache Components dinamik rotalarda en az bir örnek param ister. Değer API'nin
 * slug desenine (`^[a-z0-9-]+$`) UYMAK ZORUNDA: uymayan bir slug 404 değil
 * 400 döner, `tryRequest` onu null'a çeviremez ve `next build` düşer.
 * Eski `__ornek__` alt çizgi içerdiği için tam olarak bu hataya yol açıyordu —
 * Günlük'te yazı yokken üretim derlemesi bu yüzden patladı.
 */
export const PLACEHOLDER_SLUG = 'ornek-yer-tutucu';

export const routes = {
    home: '/',
    product: (slug: string) => `/urun/${slug}`,
    category: (slug: string) => `/kategori/${slug}`,
    brand: (slug: string) => `/marka/${slug}`,
    brands: '/markalar',
    categories: '/kategoriler',
    group: (slug: string) => `/koleksiyon/${slug}`,
    search: (q: string) => `/arama?q=${encodeURIComponent(q)}`,
    searchPage: '/arama',
    page: (slug: string) => `/sayfa/${slug}`,

    // --- v2: alışveriş akışı ---
    cart: '/sepet',
    checkout: '/odeme',
    /** Başarısız kart denemesinden dönüş: form, denemenin hata mesajıyla açılır. */
    checkoutRetry: (attemptId: string) => `/odeme?deneme=${attemptId}`,
    /** PayTR iframe'inin gömüldüğü sayfa. */
    cardPayment: (attemptId: string) => `/odeme/kart/${attemptId}`,
    /** "Ödemen kontrol ediliyor": PayTR dönüşünden sonra sonuç beklenir. */
    paymentPending: (attemptId: string) => `/odeme/sonuc/bekle?a=${attemptId}`,
    /** Onaylanmış denemenin sipariş çerezini yazıp sipariş sayfasına geçiren uç. */
    paymentDone: (attemptId: string) => `/odeme/sonuc/tamam?a=${attemptId}`,
    order: (no: string) => `/siparis/${no}`,

    // --- v2: hesap ---
    login: '/giris',
    register: '/giris?ekran=kayit',
    forgotPassword: '/giris?ekran=sifre-unuttum',
    resetPassword: '/sifre-yenile',
    account: '/hesabim',
    accountOrders: '/hesabim/siparisler',
    accountOrder: (no: string) => `/hesabim/siparisler/${no}`,
    favorites: '/hesabim/favoriler',
    addresses: '/hesabim/adresler',
    accountPoints: '/hesabim/puanlar',
    accountPrivacy: '/hesabim/gizlilik',
    accountReviews: '/hesabim/yorumlar',
    accountReturns: '/hesabim/iadeler',
    accountNotifications: '/hesabim/bildirimler',
    accountSecurity: '/hesabim/guvenlik',

    // --- v2: içerik ---
    journal: '/gunluk',
    newsletterConfirm: '/bulten/onay',
    newsletterLeave: '/bulten/ayril',
    post: (slug: string) => `/gunluk/${slug}`,
    /** Konu filtresi indeks üzerinde çalışır; ayrı bir konu rotası yok. */
    topic: (slug: string) => `/gunluk?konu=${encodeURIComponent(slug)}`,
    guide: '/rehber',
} as const;

/**
 * Hızlı çıkış hedefi. Ziyaretçi tek tuşla nötr bir sayfaya geçer; bu adres
 * geçmişe YAZILMAZ (PanicExit location.replace kullanır).
 */
export const PANIC_EXIT_URL = 'https://www.google.com/search?q=hava+durumu';

/** Panelden gelen link adresini güvenli hale getirir: yalnızca site içi yollar. */
export function safeLink(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('/') && !url.startsWith('//')) return url;
    if (url.startsWith(site.url)) return url.slice(site.url.length) || '/';
    return null;
}

export function isCanonicalHost(host: string | null | undefined): boolean {
    if (!host) return false;
    return host.split(':')[0].toLowerCase() === site.canonicalHost;
}

/**
 * Bu dağıtım arama motoruna açık mı: kanonik alan adı, Vercel'de Production
 * ortamı VE `SITE_INDEXABLE` kapatılmamış. robots.txt, sitemap, layout robots
 * metası ve `X-Robots-Tag` başlığı HEPSİ buradan okur.
 *
 * Yalnız robots.txt yetmiyordu: dev.ozmishop.com taramaya kapalıydı ama her
 * sayfa `index, follow` metası basıyordu. Dışarıdan bağlantı alan bir dev
 * sayfası taranmadan da indekse girebilir; `Disallow` Google'ın noindex'i
 * okumasını bile engeller. Asıl kapı HTTP başlığı (next.config.ts).
 *
 * Karar DERLEME anında verilir: `next.config.ts` başlıkları ve robots.txt
 * build'de üretilir, `NEXT_PUBLIC_SITE_URL` istemci paketine gömülür. Ortam
 * değişkeni değişince yeniden deploy gerekir. Aynı derlemenin başka bir
 * host'tan (ör. `*.vercel.app` takma adı) açılmasını `proxy.ts` kapatır.
 */
export function isIndexable(): boolean {
    // Vercel dışında (Docker) VERCEL_ENV yok; orada karar alan adına kalır.
    const production = (process.env.VERCEL_ENV ?? 'production') === 'production';
    return isCanonicalHost(new URL(site.url).host) && production && process.env.SITE_INDEXABLE !== 'false';
}

