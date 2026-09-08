import type { MetadataRoute } from 'next';
import { getSitemapData } from '@/lib/api';
import { routes, site } from '@/lib/site';

/**
 * lastModified değerleri gerçek updatedAt'ten gelir; uydurma tarih Google'ın
 * sitemap sinyaline olan güvenini düşürür.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const data = await getSitemapData();

    return [
        { url: site.url, changeFrequency: 'daily', priority: 1 },
        { url: `${site.url}${routes.brands}`, changeFrequency: 'weekly', priority: 0.6 },
        ...data.categories.map((category) => ({
            url: `${site.url}${routes.category(category.slug)}`,
            lastModified: new Date(category.updatedAt),
            changeFrequency: 'daily' as const,
            priority: category.productCount > 0 ? 0.8 : 0.4,
        })),
        ...data.groups.map((group) => ({
            url: `${site.url}${routes.group(group.slug)}`,
            lastModified: new Date(group.updatedAt),
            changeFrequency: 'daily' as const,
            priority: 0.7,
        })),
        ...data.brands.map((brand) => ({
            url: `${site.url}${routes.brand(brand.slug)}`,
            lastModified: new Date(brand.updatedAt),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        })),
        ...data.products.map((product) => ({
            url: `${site.url}${routes.product(product.slug)}`,
            lastModified: new Date(product.updatedAt),
            changeFrequency: 'weekly' as const,
            priority: 0.9,
        })),
        ...data.pages.map((page) => ({
            url: `${site.url}${routes.page(page.slug)}`,
            lastModified: new Date(page.updatedAt),
            changeFrequency: 'monthly' as const,
            priority: 0.3,
        })),
    ];
}
