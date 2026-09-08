/** Site sabitleri ve rota üreticileri — adresler tek yerden üretilir. */

export const site = {
    name: 'ozmishop',
    title: 'ozmishop — Yetişkin Ürünleri',
    description:
        'Gizli paketleme ve güvenli ödeme ile yetişkinlere özel ürünler. Orijinal, faturalı ve hızlı kargo.',
    url: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3200').replace(/\/$/, ''),
    locale: 'tr_TR',
    // robots.ts yalnızca bu alan adlarında taramaya izin verir; test ortamları indekslenmez.
    canonicalHosts: ['ozmishop.com', 'www.ozmishop.com'],
} as const;

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
} as const;

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
