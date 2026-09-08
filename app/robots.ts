import type { MetadataRoute } from 'next';
import { isCanonicalHost, site } from '@/lib/site';

/**
 * Yalnızca gerçek alan adında taramaya izin verilir; önizleme/test ortamları
 * kazara indekslenmez.
 */
export default function robots(): MetadataRoute.Robots {
    const host = new URL(site.url).host;

    if (!isCanonicalHost(host)) {
        return { rules: [{ userAgent: '*', disallow: '/' }] };
    }

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/arama', '/*?q=', '/*?*secim=*&secim=*'],
            },
        ],
        sitemap: `${site.url}/sitemap.xml`,
        host: site.url,
    };
}
