import { routes, site } from './site';
import type {
    Category, JournalPost, JournalPostDetail, ProductCard, ProductDetail, ReviewList, SiteSettings,
} from './types';

/**
 * schema.org üreticileri. @id çapaları (`/#organization`) düğümlerin birbirine
 * referans vermesini sağlar; Google'ın bilgi grafiğinde tek bir varlık olarak görünür.
 */
/** Ayarlardaki sosyal hesaplar (`sosyal.*`); yalnız https adresleri. */
const SOCIAL_KEYS = ['sosyal.instagram', 'sosyal.x', 'sosyal.tiktok', 'sosyal.youtube', 'sosyal.facebook'] as const;

/**
 * Kuruluş. Logo, destek iletişimi ve sosyal hesaplar ayarlardan; ayar
 * okunamazsa yalın sürüm. Açık adres BİLEREK yok: resmi tebligat adresi
 * fiziksel mağaza gibi sunulmaz (ziyaret edilebilir bir mağaza yok).
 */
export function organizationSchema(settings?: SiteSettings | null) {
    const text = (key: string) => {
        const value = (settings as Record<string, unknown> | null | undefined)?.[key];
        return typeof value === 'string' ? value.trim() : '';
    };
    const phone = text('sirket.telefon');
    const email = text('sirket.eposta');
    const legalName = text('sirket.unvan');
    const sameAs = SOCIAL_KEYS.map(text).filter((url) => /^https:\/\/\S+$/.test(url));
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${site.url}/#organization`,
        name: site.name,
        url: site.url,
        description: site.description,
        // public/logo.png: simge + kelime markası, 512×512 (Google en az 112×112 ister).
        logo: { '@type': 'ImageObject', url: `${site.url}/logo.png`, width: 512, height: 512 },
        ...(legalName ? { legalName } : {}),
        ...(phone || email ? {
            contactPoint: [{
                '@type': 'ContactPoint',
                contactType: 'customer service',
                areaServed: 'TR',
                availableLanguage: 'tr',
                ...(phone ? { telephone: phone } : {}),
                ...(email ? { email } : {}),
            }],
        } : {}),
        ...(sameAs.length ? { sameAs } : {}),
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

/** GTIN-8/12/13/14 sağlama hanesi doğru mu? Panelde serbest metin girildiği için şart. */
export function isValidGtin(code: string | null | undefined): code is string {
    if (!code || !/^(\d{8}|\d{12,14})$/.test(code)) return false;
    const digits = [...code].map(Number);
    const check = digits.pop()!;
    const sum = digits.reverse().reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
    return (10 - (sum % 10)) % 10 === check;
}

const ADULT = 'https://schema.org/SexualContentConsideration';
const IN_STOCK = 'https://schema.org/InStock';
const OUT_OF_STOCK = 'https://schema.org/OutOfStock';

/**
 * Ürün. `reviews` verilirse `aggregateRating` ve ilk üç yorum eklenir.
 *
 * Teklif yalnız AKTİF varyantlardan ve görünür fiyatla aynı kaynaktan üretilir.
 * Fiyatı olmayan üründe `offers` HİÇ basılmaz: eskiden `?? 0` "ücretsiz ürün"
 * teklifi üretiyordu. SKU varsayılan varyanttan; GTIN yalnız tek varyantta ve
 * sağlama hanesi tutuyorsa (ürün düzeyinde birden çok barkod olmaz).
 *
 * DİKKAT: `reviewCount: 0` olan bir `aggregateRating` Google'da doğrulama
 * hatası verir — bu yüzden yalnız gerçekten yorum varken basılır.
 */
export function productSchema(product: ProductDetail, reviews?: ReviewList | null) {
    const images = product.images.map((image) => image.url).slice(0, 6);
    const url = `${site.url}${routes.product(product.slug)}`;

    const active = product.variants.filter((variant) => variant.isActive);
    const priced = active.filter((variant) => variant.price > 0);
    const defaultVariant = active.find((variant) => variant.isDefault) ?? active[0];
    const single = active.length === 1 ? active[0] : null;
    const availability = (priced.length ? priced.some((variant) => variant.inStock) : product.inStock) ? IN_STOCK : OUT_OF_STOCK;

    const prices = priced.map((variant) => variant.price);
    const fallbackPrice = product.price && product.price > 0 ? product.price : null;
    let offers: Record<string, unknown> | null = null;
    if (prices.length > 1 && Math.min(...prices) !== Math.max(...prices)) {
        // Çok varyantlı ve fiyatları farklı: aralık, görünür fiyatın kapsadığı küme.
        offers = {
            '@type': 'AggregateOffer',
            priceCurrency: 'TRY',
            lowPrice: Math.min(...prices),
            highPrice: Math.max(...prices),
            offerCount: priced.length,
            availability,
            url,
            hasAdultConsideration: ADULT,
        };
    } else if (prices.length || fallbackPrice) {
        offers = {
            '@type': 'Offer',
            priceCurrency: 'TRY',
            price: prices.length ? prices[0] : fallbackPrice,
            availability,
            url,
            itemCondition: 'https://schema.org/NewCondition',
            hasAdultConsideration: ADULT,
        };
    }

    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.shortDescription || product.metaDescription || site.description,
        ...(defaultVariant?.sku ? { sku: defaultVariant.sku } : {}),
        ...(single && isValidGtin(single.barcode) ? { gtin: single.barcode } : {}),
        ...(images.length ? { image: images } : {}),
        brand: { '@type': 'Brand', name: product.brand.name },
        category: product.category.name,
        hasAdultConsideration: ADULT,
        ...(offers ? { offers } : {}),
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
        // Yayından önce yapılan düzenleme "değişiklik" sayılmaz: tarih yayından eskiyse basılmaz.
        ...(post.updatedAt && post.publishedAt && post.updatedAt > post.publishedAt ? { dateModified: post.updatedAt } : {}),
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
