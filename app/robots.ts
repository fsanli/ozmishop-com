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
                 * `/giris`, `/rehber?*`, `/arama` ve filtreli listeler BİLEREK
                 * yok: hepsi `noindex` ama `Disallow` Google'ın o etiketi
                 * okumasını engeller ve adresler indekste asılı kalır. Tarama
                 * bütçesi sorun olursa (Search Console > Tarama istatistikleri)
                 * önce indeksten düşmeleri beklenir, sonra Disallow eklenir.
                 * İşlemsel adresler ise hiç taranmamalı.
                 */
                disallow: ['/api/', '/hesabim/', '/sepet', '/odeme', '/siparis/'],
            },
        ],
        sitemap: `${site.url}/sitemap.xml`,
        host: site.url,
    };
}
