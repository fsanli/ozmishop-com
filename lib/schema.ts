import { routes, site } from './site';
import type {
    Category, JournalPost, JournalPostDetail, ProductCard, ProductDetail, ReviewList,
} from './types';

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

/**
 * Ürün. `reviews` verilirse `aggregateRating` ve ilk üç yorum eklenir.
 *
 * DİKKAT: `reviewCount: 0` olan bir `aggregateRating` Google'da doğrulama
 * hatası verir — bu yüzden yalnız gerçekten yorum varken basılır.
 */
export function productSchema(product: ProductDetail, reviews?: ReviewList | null) {
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
        ...(reviews && reviews.summary.count > 0 && reviews.summary.average !== null ? {
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: Number(reviews.summary.average.toFixed(1)),
                reviewCount: reviews.summary.count,
                bestRating: 5,
                worstRating: 1,
            },
            review: reviews.items.slice(0, 3).map((item) => ({
                '@type': 'Review',
                reviewRating: { '@type': 'Rating', ratingValue: item.rating, bestRating: 5, worstRating: 1 },
                // Yayında takma ad görünür; yapısal veride de gerçek ad YOK.
                author: { '@type': 'Person', name: item.author },
                datePublished: item.createdAt,
                ...(item.title ? { name: item.title } : {}),
                reviewBody: item.body,
            })),
        } : {}),
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


// --- Günlük ------------------------------------------------------------------
/**
 * Yazı detayı. `author` bir Person: Günlük'ün tüm değeri yazıların bir kişiye
 * bağlı olmasında, `Organization` yazmak o iddiayı silerdi.
 */
export function postSchema(post: JournalPostDetail) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        '@id': `${site.url}${routes.post(post.slug)}#post`,
        headline: post.title,
        description: post.excerpt,
        ...(post.cover ? { image: [post.cover.url] } : {}),
        ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
        ...(post.author.name ? {
            author: {
                '@type': 'Person',
                name: post.author.name,
                ...(post.author.title ? { jobTitle: post.author.title } : {}),
            },
        } : {}),
        publisher: { '@id': `${site.url}/#organization` },
        inLanguage: 'tr-TR',
        isAccessibleForFree: true,
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${site.url}${routes.post(post.slug)}` },
        ...(post.topic ? { articleSection: post.topic.name } : {}),
        timeRequired: `PT${post.readMinutes}M`,
    };
}

export function journalSchema(posts: JournalPost[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': `${site.url}${routes.journal}#collection`,
        name: 'ozmishop Günlük',
        url: `${site.url}${routes.journal}`,
        isPartOf: { '@id': `${site.url}/#website` },
        inLanguage: 'tr-TR',
        mainEntity: {
            '@type': 'ItemList',
            numberOfItems: posts.length,
            itemListElement: posts.map((post, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                url: `${site.url}${routes.post(post.slug)}`,
                name: post.title,
            })),
        },
    };
}
