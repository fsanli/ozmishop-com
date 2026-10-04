import type { MetadataRoute } from 'next';
import { isIndexable, site } from '@/lib/site';

/**
 * Yalnızca gerçek alan adında taramaya izin verilir; önizleme/test ortamları
 * kazara indekslenmez.
 */
export default function robots(): MetadataRoute.Robots {
    if (!isIndexable()) {
        return { rules: [{ userAgent: '*', disallow: '/' }] };
    }

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                /*
                 * `/giris` ve `/rehber?*` BİLEREK yok: ikisi de `noindex` ama
                 * `Disallow` Google'ın o etiketi okumasını engeller ve sayfalar
                 * indekste asılı kalır. İşlemsel adresler ise hiç taranmamalı.
                 */
                disallow: [
                    '/api/', '/arama', '/*?q=', '/*?*secim=*&secim=*',
                    '/hesabim/', '/sepet', '/odeme', '/siparis/',
                ],
            },
        ],
        sitemap: `${site.url}/sitemap.xml`,
        host: site.url,
    };
}
