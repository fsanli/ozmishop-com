import type { MetadataRoute } from 'next';
import { getSitemapData } from '@/lib/api';
import { isIndexable, routes, site } from '@/lib/site';

/**
 * lastModified değerleri gerçek updatedAt'ten gelir; uydurma tarih Google'ın
 * sitemap sinyaline olan güvenini düşürür.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // İndekslenmeyen ortamda (dev/önizleme) adres listesi yayınlanmaz.
    if (!isIndexable()) return [];
    const data = await getSitemapData();

    /*
     * Yalnız indekslenmesi istenen, kendine canonical veren adresler.
     * `priority`/`changeFrequency` yok: Google ikisini de kullanmıyor.
     * Konu adresleri (`/gunluk?konu=`) YOK: konu bir süzgeç, noindex alıyor.
     * Ürünsüz kategori ve marka YOK: sayfaları noindex (boş liste ince içerik).
     * API hatası yutulmaz — boş bir 200 site haritası, hatalı bir 5xx'ten kötü.
     */
    return [
        { url: site.url },
        { url: `${site.url}${routes.brands}` },
        { url: `${site.url}${routes.categories}` },
        ...data.categories.filter((category) => category.productCount > 0).map((category) => ({
            url: `${site.url}${routes.category(category.slug)}`,
            lastModified: new Date(category.updatedAt),
        })),
        ...data.groups.map((group) => ({
            url: `${site.url}${routes.group(group.slug)}`,
            lastModified: new Date(group.updatedAt),
        })),
        ...data.brands.filter((brand) => brand.productCount > 0).map((brand) => ({
            url: `${site.url}${routes.brand(brand.slug)}`,
            lastModified: new Date(brand.updatedAt),
        })),
        ...data.products.map((product) => ({
            url: `${site.url}${routes.product(product.slug)}`,
            lastModified: new Date(product.updatedAt),
        })),
        ...data.pages.map((page) => ({
            url: `${site.url}${routes.page(page.slug)}`,
            lastModified: new Date(page.updatedAt),
        })),
        { url: `${site.url}${routes.journal}` },
        ...data.posts.map((post) => ({
            url: `${site.url}${routes.post(post.slug)}`,
            lastModified: new Date(post.updatedAt),
        })),
    ];
}
