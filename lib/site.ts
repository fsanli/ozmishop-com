/** Site sabitleri ve rota üreticileri — adresler tek yerden üretilir. */

export const site = {
    name: 'ozmishop',
    title: 'ozmishop — Yetişkin Ürünleri',
    description:
        'Gizli paketleme ve güvenli ödeme ile yetişkinlere özel ürünler. Orijinal, faturalı ve hızlı kargo.',
    url: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3201').replace(/\/$/, ''),
    locale: 'tr_TR',
    // robots.ts yalnızca bu alan adlarında taramaya izin verir; test ortamları indekslenmez.
    canonicalHosts: ['ozmishop.com', 'www.ozmishop.com'],
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
    group: (slug: string) => `/koleksiyon/${slug}`,
    search: (q: string) => `/arama?q=${encodeURIComponent(q)}`,
    searchPage: '/arama',
    page: (slug: string) => `/sayfa/${slug}`,

    // --- v2: alışveriş akışı ---
    cart: '/sepet',
    checkout: '/odeme',
    order: (no: string) => `/siparis/${no}`,

    // --- v2: hesap ---
    login: '/giris',
    register: '/giris?ekran=kayit',
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

/** Footer'da "Yardım" sütununa düşecek kurumsal sayfalar; kalanı "Kurumsal". */
export const FOOTER_HELP_SLUGS = [
    'kargo-ve-teslimat',
    'iade-ve-degisim',
    'siparis-takibi',
    'sikca-sorulan-sorular',
    'iletisim',
];

/** Panelden gelen link adresini güvenli hale getirir: yalnızca site içi yollar. */
export function safeLink(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('/') && !url.startsWith('//')) return url;
    if (url.startsWith(site.url)) return url.slice(site.url.length) || '/';
    return null;
}

export function isCanonicalHost(host: string | null | undefined): boolean {
    if (!host) return false;
    return site.canonicalHosts.includes(host.split(':')[0] as (typeof site.canonicalHosts)[number]);
}
