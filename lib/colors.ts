/**
 * v2 kategori renk kodu. Aynı kategori her ekranda aynı rengi alır.
 *
 * KRİTİK: Tailwind v4 kaynak dosyalarını tarayıp sınıf adını ORADA görmek zorunda.
 * `bg-${key}-dot` gibi çalışma anında birleştirilen bir ad ASLA üretilmez ve
 * sessizce görünmez bir nokta olarak yayınlanır. Bu yüzden harita tam sınıf adı
 * tutar; hiçbir yerde parça birleştirme yapılmaz.
 */

export type ColorKey = 'berry' | 'plum' | 'teal' | 'amber' | 'rose';

export interface ColorClasses {
    /** 5–7px nokta ve 3px şerit dolgusu */
    dot: string;
    /** Küçük metin (başlık, sayı) */
    ink: string;
    /** Rozet zemini */
    tint: string;
    /** Hazır rozet: .badge + renk */
    badge: string;
    /** .card-edge-top ile birlikte */
    edgeTop: string;
    /** .card-edge-left ile birlikte */
    edgeLeft: string;
    /** Koyu blok üstünde metin */
    onDark: string;
    /** Koyu blok üstünde nokta */
    onDarkDot: string;
}

/**
 * Berry'nin -dot/-ink/-tint üçlüsü yok: accent ölçeği odur. Aynı renge ikinci bir
 * isim vermemek için asimetri burada soğurulur, temada değil.
 */
export const CATEGORY_COLOR: Record<ColorKey, ColorClasses> = {
    berry: {
        dot: 'bg-accent-500',
        ink: 'text-accent-500',
        tint: 'bg-accent-200',
        badge: 'badge badge-accent',
        edgeTop: 'border-t-accent-500',
        edgeLeft: 'border-l-accent-500',
        onDark: 'text-on-dark-berry',
        onDarkDot: 'bg-on-dark-berry',
    },
    plum: {
        dot: 'bg-plum-dot',
        ink: 'text-plum-ink',
        tint: 'bg-plum-tint',
        badge: 'badge badge-plum',
        edgeTop: 'border-t-plum-dot',
        edgeLeft: 'border-l-plum-dot',
        onDark: 'text-on-dark-plum',
        onDarkDot: 'bg-on-dark-plum',
    },
    teal: {
        dot: 'bg-teal-dot',
        ink: 'text-teal-ink',
        tint: 'bg-teal-tint',
        badge: 'badge badge-teal',
        edgeTop: 'border-t-teal-dot',
        edgeLeft: 'border-l-teal-dot',
        onDark: 'text-on-dark-teal',
        onDarkDot: 'bg-on-dark-teal',
    },
    amber: {
        dot: 'bg-amber-dot',
        ink: 'text-amber-ink',
        tint: 'bg-amber-tint',
        badge: 'badge badge-amber',
        edgeTop: 'border-t-amber-dot',
        edgeLeft: 'border-l-amber-dot',
        onDark: 'text-on-dark-amber',
        onDarkDot: 'bg-on-dark-amber',
    },
    rose: {
        dot: 'bg-rose-dot',
        ink: 'text-rose-ink',
        tint: 'bg-rose-tint',
        badge: 'badge badge-rose',
        edgeTop: 'border-t-rose-dot',
        edgeLeft: 'border-l-rose-dot',
        onDark: 'text-on-dark-rose',
        onDarkDot: 'bg-on-dark-rose',
    },
};

export const COLOR_KEYS = Object.keys(CATEGORY_COLOR) as ColorKey[];

export const isColorKey = (value: unknown): value is ColorKey =>
    typeof value === 'string' && value in CATEGORY_COLOR;

/**
 * Panelde `category.colorKey` alanı açılana kadarki köprü: HANDOFF'un sabit
 * eşlemesi. Alan API'den gelmeye başladığı gün bu tablo SİLİNİR.
 */
const SLUG_FALLBACK: Record<string, ColorKey> = {
    vibratorler: 'berry',
    'masaj-ve-bakim': 'plum',
    kayganlastiricilar: 'teal',
    'ciftler-icin': 'rose',
    'ic-giyim': 'amber',
    'erkeklere-ozel': 'plum',
    fantezi: 'rose',
};

/** Kategori (ya da ona benzeyen herhangi bir kayıt) için renk anahtarı. */
export function colorKeyOf(source: { colorKey?: string | null; slug?: string | null } | null | undefined): ColorKey {
    if (!source) return 'berry';
    if (isColorKey(source.colorKey)) return source.colorKey;
    // Alt kategoriler kökün rengini sürdürür: "klitoral-vibratorler" → vibratorler.
    const slug = source.slug || '';
    if (SLUG_FALLBACK[slug]) return SLUG_FALLBACK[slug];
    const root = Object.keys(SLUG_FALLBACK).find((key) => slug.endsWith(key.split('-').pop() || '\0'));
    return root ? SLUG_FALLBACK[root] : 'berry';
}

/** Kategori için hazır sınıf demeti. */
export const colorsOf = (source: Parameters<typeof colorKeyOf>[0]): ColorClasses =>
    CATEGORY_COLOR[colorKeyOf(source)];

/**
 * Ürün kartındaki teknik özellik rozetleri. Tasarımda renk, özelliğin TÜRÜNÜ
 * anlatır: ses mor, su geçirmezlik yeşil, malzeme nötr, ölçü kehribar.
 */
export type SpecBadgeKind = 'db' | 'ipx' | 'material' | 'size';

export const SPEC_BADGE: Record<SpecBadgeKind, string> = {
    db: 'badge badge-plum',
    ipx: 'badge badge-teal',
    material: 'badge badge-neutral',
    size: 'badge badge-amber',
};

/** Filtre grubu başlığındaki nokta rengi — 02 Kategori v2'deki eşleme. */
export const FACET_DOT: Record<string, ColorKey> = {
    marka: 'berry',
    malzeme: 'plum',
    'ses-seviyesi': 'rose',
    'su-gecirmezlik': 'teal',
    uzunluk: 'amber',
    renk: 'rose',
    fiyat: 'amber',
};

export const facetColorsOf = (slug: string): ColorClasses => CATEGORY_COLOR[FACET_DOT[slug] || 'berry'];
