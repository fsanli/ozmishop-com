/** API cevap tipleri. Kaynak: ozmishop-api formatters (snake_case → camelCase). */

import type { ColorKey, SpecBadgeKind } from './colors';

export interface ApiImage {
    id: number | null;
    url: string;
    width: number | null;
    height: number | null;
    alt: string | null;
}

export interface Pagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface BrandSummary {
    id: number;
    name: string;
    slug: string;
    logo: ApiImage | null;
    description: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    productCount: number;
    activeProductCount: number;
}

export interface Category {
    id: number;
    parentId: number | null;
    name: string;
    slug: string;
    description: string | null;
    image: ApiImage | null;
    banner: ApiImage | null;
    path: string;
    depth: number;
    metaTitle: string | null;
    metaDescription: string | null;
    activeProductCount: number;
    /** v2 renk kodu. Panelde alan açılana kadar null gelir; lib/colors.ts slug'a düşer. */
    colorKey?: ColorKey | null;
    children?: Category[];
}

export interface CategoryDetail extends Category {
    breadcrumb: { id: number; name: string; slug: string }[];
    children: Category[];
}

export interface ProductCard {
    id: number;
    name: string;
    slug: string;
    status: string;
    isFeatured: boolean;
    shortDescription: string | null;
    brand: { id: number; name: string; slug: string };
    category: { id: number; name: string; slug: string; path: string };
    price: number | null;
    compareAtPrice: number | null;
    discountPercent: number;
    minPrice: number | null;
    maxPrice: number | null;
    variantCount: number;
    hasVariants: boolean;
    /**
     * Varsayılan varyantın (satın alınabilir ürünün) kimliği. Karttaki "sepete
     * ekle" bunu kullanır; `hasVariants` ise kullanıcı seçim yapmalı ve buton
     * ürün sayfasına bağlanır.
     */
    defaultProductId: number | null;
    inStock: boolean;
    totalStock: number;
    image: ApiImage | null;
    /** Karttaki teknik özellik rozetleri (dB, IPX, malzeme, ölçü). API gelene kadar boş. */
    specs?: { kind: SpecBadgeKind; label: string }[];
    rating?: { average: number; count: number } | null;
    isNew: boolean;
    views?: number;
    publishedAt: string | null;
}

export interface VariantOption {
    variantKeyId: number;
    variantValueId: number;
    keyName: string;
    keySlug: string;
    inputType: 'select' | 'color';
    valueName: string;
    valueSlug: string;
    hexCode: string | null;
}

export interface ProductVariant {
    id: number;
    sku: string;
    name: string;
    price: number;
    compareAtPrice: number | null;
    discountPercent: number;
    stockQuantity: number;
    trackStock: boolean;
    inStock: boolean;
    isDefault: boolean;
    isActive: boolean;
    options: VariantOption[];
    images: ProductImage[];
}

export interface ProductImage {
    id: number;
    productId: number | null;
    mediaId: number;
    url: string;
    width: number | null;
    height: number | null;
    alt: string | null;
    isPrimary: boolean;
    displayOrder: number;
}

export interface VariantAxis {
    id: number;
    name: string;
    slug: string;
    inputType: 'select' | 'color';
    values: { id: number; name: string; slug: string; hexCode: string | null; image: ApiImage | null }[];
}

export interface ProductDetail extends ProductCard {
    description: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    breadcrumb: { id: number; name: string; slug: string }[];
    images: ProductImage[];
    variantAxes: VariantAxis[];
    variants: ProductVariant[];
    specSheet: SpecSheet;
    /** "Bu ürün sana uygun mu?" — artı/eksi ayrımı yapısal olduğu için spec değil. */
    fitNotes: { positive: string[]; negative: string[] } | null;
    /** "Kutunun içinde ne var?" — anahtarsız liste. */
    boxContents: string[] | null;
    lubeCompatibility: 'water' | 'silicone' | 'both' | 'none' | null;
    warrantyNote: string | null;
    typicalRepurchaseDays: number | null;
    related: ProductCard[];
}

export interface Facets {
    brands: { id: number; name: string; slug: string; count: number }[];
    variantKeys: {
        id: number;
        name: string;
        slug: string;
        inputType: 'select' | 'color';
        values: { id: number; name: string; slug: string; hexCode: string | null; count: number }[];
    }[];
    price: { min: number; max: number };
    categories: { id: number; name: string; slug: string; path: string; parentId: number | null; count: number }[];
    /** Teknik künyeden üretilen filtreler. Seçimli tanımlar `options`, sayısal olanlar `range` taşır. */
    specs?: SpecFacet[];
}

export interface SpecFacet {
    id: number;
    name: string;
    slug: string;
    dataType: 'select' | 'multi_select' | 'number' | 'boolean' | 'text';
    unit: string | null;
    colorKey: ColorKey;
    /**
     * Seçilebilir değerler. Sayısal tanımlarda bunlar KOVA'dır ("38 – 44 dB") ve
     * slug'ı "min:max" biçimindedir; seçimli tanımlarda seçeneğin kendi slug'ı.
     */
    options: { id?: number; name: string; slug: string; count: number; min?: number; max?: number }[];
    /** Sayısal tanımın genel sınırları (kova etiketleri için değil, bilgi amaçlı). */
    range: { min: number; max: number } | null;
}

/** Ürün detaydaki teknik künye: ölçüm kartları + renk kodlu gruplar. */
/** Künyenin çizilen kısmı. Varyant başına ayrı ayrı üretilebilir. */
export interface SpecSheetContent {
    keyMetrics: {
        name: string;
        value: string;
        unit: string | null;
        colorKey: ColorKey;
        note: string | null;
        rangeMin: number | null;
        rangeMax: number | null;
        percent: number | null;
    }[];
    groups: { id: number; name: string; slug: string; colorKey: ColorKey; rows: { name: string; value: string }[] }[];
}

export interface SpecSheet extends SpecSheetContent {
    badges: { kind: SpecBadgeKind; label: string }[];
    /**
     * Varyanta göre değişen başlık varsa varyant id'si → o varyantın TAM künyesi.
     * Yoksa alan hiç gelmez ve üstteki künye herkes için geçerlidir. Üst seviye
     * künye varsayılan varyantınkidir; seçim yapılmadan görünen de odur.
     */
    byVariant?: Record<number, SpecSheetContent>;
}

export interface ProductListing {
    items: ProductCard[];
    pagination: Pagination;
    facets?: Facets;
}

export interface ProductGroup {
    id: number;
    code: string;
    name: string;
    slug: string;
    description: string | null;
    image: ApiImage | null;
    type: 'manual' | 'dynamic';
    metaTitle: string | null;
    metaDescription: string | null;
    items?: ProductCard[];
    pagination?: Pagination;
}

export interface Banner {
    id: number;
    placement: string;
    title: string | null;
    subtitle: string | null;
    image: ApiImage;
    mobileImage: ApiImage | null;
    alt: string;
    linkUrl: string | null;
    buttonText: string | null;
}

export type HomeSectionType =
    | 'hero_slider'
    | 'banner'
    | 'banner_grid'
    | 'product_group'
    | 'category_grid'
    | 'brand_strip'
    | 'trust_strip'
    | 'guide_promo'
    | 'html';

export interface HomeSection {
    id: number;
    type: HomeSectionType;
    title: string | null;
    subtitle: string | null;
    settings: Record<string, unknown>;
    displayOrder: number;
    banners?: Banner[];
    categories?: Category[];
    brands?: BrandSummary[];
    group?: { id: number; code: string; name: string; slug: string };
}

export interface ContentPage {
    id: number;
    slug: string;
    title: string;
    content?: string;
    metaTitle: string | null;
    metaDescription: string | null;
    isIndexable: boolean;
    /** Footer kolonu ve sayfa kenar çubuğu buna göre gruplanır. */
    group: string;
    updatedAt: string;
}

/** API'nin döndürdüğü grup etiketleri; vitrin kendi listesini tutmaz. */
export interface PageGroup {
    key: string;
    label: string;
}

export interface Suggestions {
    products: {
        id: number; name: string; slug: string; price: number; compareAtPrice: number | null;
        image: string | null; brand: string;
        defaultProductId: number | null; hasVariants: boolean; inStock: boolean;
    }[];
    categories: { id: number; name: string; slug: string }[];
    brands: { id: number; name: string; slug: string }[];
}

export interface SitemapData {
    products: { slug: string; updatedAt: string }[];
    categories: { slug: string; updatedAt: string; productCount: number }[];
    brands: { slug: string; updatedAt: string; productCount: number }[];
    groups: { slug: string; updatedAt: string }[];
    pages: { slug: string; updatedAt: string }[];
    posts: { slug: string; updatedAt: string }[];
    topics: { slug: string; updatedAt: string; postCount: number }[];
}

// --- Sepet ------------------------------------------------------------------

export interface CartItem {
    id: number;
    productId: number;
    baseProductId: number;
    sku: string;
    name: string;
    slug: string;
    variantLabel: string | null;
    brand: { name: string; slug: string };
    categorySlug: string;
    image: ApiImage | null;
    price: number;
    compareAtPrice: number | null;
    quantity: number;
    lineTotal: number;
    /** Ürün satıştan kalkmışsa false; satır silinmez, işaretlenir. */
    available: boolean;
    maxQuantity: number | null;
}

export interface ShippingOption {
    id: number;
    name: string;
    carrier: string;
    description: string | null;
    price: number;
    basePrice: number;
    isFree: boolean;
    freeOver: number | null;
    /** "X TL daha ekle, kargo bedava" mesajı için. */
    remainingForFree: number | null;
    estimatedDays: { min: number; max: number } | null;
}

export interface CartCoupon {
    code: string;
    valid: boolean;
    reason?: string;
    type?: 'percent' | 'amount' | 'free_shipping';
    description?: string | null;
    minSubtotal?: number;
    discount: number;
}

export interface Cart {
    token: string;
    itemCount: number;
    items: CartItem[];
    /** Stoğu yetmeyen ya da satıştan kalkan satırlar. */
    issues: { itemId: number; kind: 'unavailable' | 'stock'; name: string; available?: number }[];
    coupon: CartCoupon | null;
    shippingOptions: ShippingOption[];
    selectedShippingRateId: number | null;
    totals: { subtotal: number; discount: number; shipping: number; grandTotal: number };
}

// --- Sipariş ----------------------------------------------------------------

export interface OrderAddress {
    firstname: string;
    lastname: string;
    phone: string;
    city: string;
    district: string;
    neighbourhood?: string | null;
    addressLine: string;
    postalCode?: string | null;
}

export type OrderStatus =
    | 'payment_pending' | 'confirmed' | 'preparing' | 'shipped'
    | 'delivered' | 'cancelled' | 'refunded';

export interface Order {
    orderNumber: string;
    status: OrderStatus;
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
    paymentMethod: 'card' | 'transfer';
    email: string;
    phone: string;
    placedAt: string;
    totals: { subtotal: number; discount: number; shipping: number; grandTotal: number };
    couponCode: string | null;
    shippingAddress: OrderAddress;
    billingAddress: OrderAddress | null;
    shipping: {
        name: string | null;
        carrier: string | null;
        trackingNumber: string | null;
        trackingUrl: string | null;
        shippedAt: string | null;
        deliveredAt: string | null;
    };
    discreetPackaging: boolean;
    itemCount: number;
    items: {
        id: number;
        productId: number | null;
        slug: string | null;
        name: string;
        sku: string;
        variantLabel: string | null;
        brandName: string | null;
        imageUrl: string | null;
        unitPrice: number;
        quantity: number;
        lineTotal: number;
    }[];
    history: { status: OrderStatus; note: string | null; createdAt: string }[];
    allowedTransitions: OrderStatus[];
    /**
     * Yalnızca havale/EFT siparişlerinde dolu. Kart siparişinde alan hiç gelmez,
     * yani `transfer &&` kontrolü ödeme yöntemini ayrıca sormayı gereksiz kılar.
     */
    transfer?: TransferSettlement;
}

/** Havale bakiyesi. Yönetici panelinin gördüğü hesabın müşteriye açık kısmı. */
export interface TransferSettlement {
    state: 'bekliyor' | 'eksik' | 'tam' | 'fazla';
    paid: number;
    remaining: number;
    overpaid: number;
    grandTotal: number;
    receipts: { amount: number; receivedAt: string }[];
    bank: {
        accountName: string;
        bankName: string;
        iban: string;
        note: string;
        dueDays: number | null;
    };
}

export interface InstallmentOption {
    count: number;
    monthly: number;
    total: number;
    extraCost: number;
}

// --- Müşteri hesabı ---------------------------------------------------------

export interface Customer {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    phone: string | null;
    isVerified: boolean;
    lastLoginAt: string | null;
    createdAt: string;
}

export interface Address {
    id: number;
    title: string;
    firstname: string;
    lastname: string;
    phone: string;
    city: string;
    district: string;
    neighbourhood: string | null;
    addressLine: string;
    postalCode: string | null;
    isDefaultShipping: boolean;
    isDefaultBilling: boolean;
}

export interface AccountOrder {
    orderNumber: string;
    status: OrderStatus;
    paymentStatus: string;
    placedAt: string;
    itemCount: number;
    grandTotal: number;
    trackingNumber: string | null;
    carrier: string | null;
}

export interface PointsSummary {
    balance: number;
    expiringSoon: number;
    nextExpiry: string | null;
    valueInLira: number;
    entries: {
        id: number;
        points: number;
        reason: 'order' | 'review' | 'refund' | 'redeem' | 'expire' | 'manual';
        note: string | null;
        orderNumber: string | null;
        expiresAt: string | null;
        createdAt: string;
    }[];
}

export interface PrivacySettings {
    pinEnabled: boolean;
    pinUpdatedAt: string | null;
    neutralStatement: boolean;
    neutralEmailSubject: boolean;
    marketingEmails: boolean;
    panicExitEnabled: boolean;
}

export interface NotificationPrefs {
    orderUpdates: boolean;
    backInStock: boolean;
    priceDrop: boolean;
    journalDigest: boolean;
}

export interface MyReview {
    id: number;
    rating: number;
    title: string | null;
    body: string;
    pseudonym: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectReason: string | null;
    product: { name: string; slug: string };
    createdAt: string;
}

export interface ReturnRequest {
    id: number;
    orderNumber: string;
    status: 'requested' | 'approved' | 'rejected' | 'shipped' | 'received' | 'refunded';
    reason: string;
    note: string | null;
    decisionNote: string | null;
    returnCode: string | null;
    createdAt: string;
    items: { orderItemId: number; name: string; variantLabel: string | null; quantity: number }[];
}

/** Ürün detayındaki değerlendirme bloğu. */
export interface ReviewList {
    summary: {
        count: number;
        average: number | null;
        distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
    };
    items: {
        id: number;
        rating: number;
        title: string | null;
        body: string;
        /** Yayında yalnızca takma ad görünür. */
        author: string;
        variantLabel: string | null;
        verifiedBuyer: boolean;
        helpfulCount: number;
        isEdited: boolean;
        createdAt: string;
    }[];
    pagination: Pagination;
}


// --- Günlük (blog) -------------------------------------------------------------
export interface JournalTopic {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    colorKey: ColorKey;
    postCount?: number;
    metaTitle: string | null;
    metaDescription: string | null;
}

/** Liste kartı. Gövde HTML'i taşımaz — API liste uçlarında `body` göndermiyor. */
export interface JournalPost {
    id: number;
    slug: string;
    title: string;
    excerpt: string;
    cover: ApiImage | null;
    topic: { id: number; name: string; slug: string; colorKey: ColorKey } | null;
    author: { name: string; title: string | null; bio: string | null; image: ApiImage | null };
    publishedAt: string | null;
    readMinutes: number;
    isFeatured: boolean;
    metaTitle: string | null;
    metaDescription: string | null;
    isIndexable: boolean;
}

export interface JournalPostDetail extends JournalPost {
    body: string;
    /** Yazıda geçen ürünler — detayın sağ sütunu. */
    products: ProductCard[];
    related: JournalPost[];
}

export interface JournalIndex {
    featured: JournalPost | null;
    items: JournalPost[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
}


// --- Başlangıç rehberi ----------------------------------------------------------
export interface GuideQuestion {
    id: number;
    question: string;
    hint: string | null;
    options: {
        id: number;
        /** Adres kısayolundaki harf: /rehber?c=AABC */
        optionKey: string;
        label: string;
        hint: string | null;
        colorKey: ColorKey;
    }[];
}

export interface GuideResult {
    answers: {
        questionId: number;
        question: string;
        optionId: number;
        optionKey: string;
        label: string;
        colorKey: ColorKey;
    }[];
    path: string;
    picks: (ProductCard & {
        /** Kartın üstündeki şerit: "En uygun eşleşme", "Bütçe dostu"… */
        rankLabel: string | null;
        why: string;
        isPinned: boolean;
    })[];
    totalMatched: number;
}


// --- Ayarlar ve menü ------------------------------------------------------------
/**
 * Vitrine açık ayarlar. Anahtarlar API'deki `settings` tablosuyla birebir;
 * eksik anahtar için her okuma yerinde varsayılan verilir — panelde bir ayar
 * silinirse sayfa çökmemeli.
 */
export interface SiteSettings {
    'puan.aktif'?: boolean;
    'iletisim.whatsapp_numarasi'?: string;
    'iletisim.whatsapp_mesaji'?: string;
    'iletisim.whatsapp_destek_mesaji'?: string;
    'iletisim.whatsapp_destek_aktif'?: boolean;
    'iletisim.canli_destek_aktif'?: boolean;
    'iletisim.tawkto_kimlik'?: string;
    'magaza.kdv_orani'?: number;
    'magaza.yas_kapisi_metni'?: string;
    'kargo.ucretsiz_esigi'?: number;
    'kargo.hazirlik_suresi'?: string;
    'gizlilik.notr_ekstre_adi'?: string;
    'gizlilik.gonderici_adi'?: string;
    'gizlilik.notr_eposta_konusu'?: string;
    'gizlilik.kvkk_sayfa_slug'?: string;
    'gizlilik.gizlilik_sayfa_slug'?: string;
    'puan.lira_karsiligi'?: number;
    'puan.gecerlilik_gun'?: number;
    'icerik.rehber_giris_baslik'?: string;
    'icerik.rehber_giris_metni'?: string;
    'icerik.bulten_vaadi'?: string;
    'icerik.iade_suresi_gun'?: number;
}

export interface MenuItem {
    id: number;
    label: string;
    url: string;
    colorKey: ColorKey | null;
    badge: string | null;
    openInNew: boolean;
    children?: MenuItem[];
}

export interface MenuTree {
    code: string;
    name: string | null;
    items: MenuItem[];
}
