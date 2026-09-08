import { routes, site } from './site';
import type { Category, ProductCard, ProductDetail } from './types';

/**
 * schema.org üreticileri. @id çapaları (`/#organization`) düğümlerin birbirine
 * referans vermesini sağlar; Google'ın bilgi grafiğinde tek bir varlık olarak görünür.
 */
export function organizationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${site.url}/#organization`,
        name: site.name,
        url: site.url,
        description: site.description,
    };
}

export function websiteSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${site.url}/#website`,
        url: site.url,
        name: site.name,
        publisher: { '@id': `${site.url}/#organization` },
        inLanguage: 'tr-TR',
        potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: `${site.url}/arama?q={search_term_string}` },
            'query-input': 'required name=search_term_string',
        },
    };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `${site.url}${item.url}`,
        })),
    };
}

export function productSchema(product: ProductDetail) {
    const images = product.images.map((image) => image.url).slice(0, 6);
    const inStock = product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
    const url = `${site.url}${routes.product(product.slug)}`;

    // Tek varyantlı üründe Offer, çok varyantlıda AggregateOffer: fiyat aralığı doğru görünsün.
    const offers = product.variants.length > 1
        ? {
            '@type': 'AggregateOffer',
            priceCurrency: 'TRY',
            lowPrice: product.minPrice ?? product.price ?? 0,
            highPrice: product.maxPrice ?? product.price ?? 0,
            offerCount: product.variants.length,
            availability: inStock,
            url,
        }
        : {
            '@type': 'Offer',
            priceCurrency: 'TRY',
            price: product.price ?? 0,
            availability: inStock,
            url,
            itemCondition: 'https://schema.org/NewCondition',
        };

    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.shortDescription || product.metaDescription || site.description,
        sku: product.variants[0]?.sku,
        ...(images.length ? { image: images } : {}),
        brand: { '@type': 'Brand', name: product.brand.name },
        category: product.category.name,
        offers,
    };
}

export function itemListSchema(items: ProductCard[], { page = 1, pageSize = 24 } = {}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        numberOfItems: items.length,
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: (page - 1) * pageSize + index + 1,
            url: `${site.url}${routes.product(item.slug)}`,
            name: item.name,
        })),
    };
}

export function collectionSchema(category: Category) {
    return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: category.name,
        description: category.metaDescription || category.description || undefined,
        url: `${site.url}${routes.category(category.slug)}`,
    };
}
