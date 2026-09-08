/** API cevap tipleri. Kaynak: ozmishop-api formatters (snake_case → camelCase). */

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
    inStock: boolean;
    totalStock: number;
    image: ApiImage | null;
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
    attributes: { id: number; name: string; value: string }[];
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
    updatedAt: string;
}

export interface Suggestions {
    products: { id: number; name: string; slug: string; price: number; compareAtPrice: number | null; image: string | null; brand: string }[];
    categories: { id: number; name: string; slug: string }[];
    brands: { id: number; name: string; slug: string }[];
}

export interface SitemapData {
    products: { slug: string; updatedAt: string }[];
    categories: { slug: string; updatedAt: string; productCount: number }[];
    brands: { slug: string; updatedAt: string; productCount: number }[];
    groups: { slug: string; updatedAt: string }[];
    pages: { slug: string; updatedAt: string }[];
}
