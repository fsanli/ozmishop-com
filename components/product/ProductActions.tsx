import Link from 'next/link';
import type { ReactNode } from 'react';
import { quickAddToCartAction, toggleFavoriteAction } from '@/app/(magaza)/actions';
import { BagIcon, HeartIcon, WhatsappIcon } from '@/components/icons';
import { routes } from '@/lib/site';
import type { SiteSettings } from '@/lib/types';
import { productWhatsappLink } from '@/lib/whatsapp';

/**
 * ÜRÜN AKSİYON İKONLARI — favori, sepete ekle, WhatsApp ile satın al.
 *
 * Ürün kartında, arama açılırında ve eklenecek her listede aynı bileşen. Tek
 * yerde durmasının sebebi görsel tutarlılık değil DAVRANIŞ tutarlılığı:
 * varyantlı ürünün doğrudan sepete eklenememesi, stoksuzun pasifleşmesi ve
 * misafirin girişe yollanması üç ekranda da aynı olmalı.
 *
 * `'use client'` YOK ve OLMAMALI: bileşen hem sunucu ağacından (ProductCard)
 * hem istemci ağacından (SearchBar açılırı) kullanılıyor. Yönergesiz bir
 * bileşen ikisinde de çalışır; formlar sunucu aksiyonuna gider ve JavaScript
 * kapalıyken de çalışırlar.
 *
 * Aynı sebeple ÇEREZ OKUYAN HİÇBİR ŞEY BURAYA GİREMEZ — istemci ağacına
 * düştüğünde derleme patlar. Dolu kalp `favoriteSlot` ile DIŞARIDAN veriliyor
 * (bkz. FavoriteState); sunucu tarafındaki çağıran onu Suspense içinde
 * geçiyor, istemci tarafındaki çağıran hiç geçmiyor ve durumsuz kalbi alıyor.
 *
 * İKİ YERLEŞİM:
 *   'icons'  üç küçük ikon yan yana — arama açılırı. Fiyat sütununun
 *            genişliğini aşmamalı, o yüzden etiket yok.
 *   'bar'    kart genişliğinde etiketli "Sepete ekle" + WhatsApp ikonu.
 *            Favori BURADA DEĞİL: kartta görselin üstünde duruyor.
 *
 * Tailwind v4 sınıf adını ÇALIŞMA ANINDA ÜRETEMEZ: ölçüler tam sınıf adı
 * taşıyan bir haritadan geliyor, `size-${n}` gibi bir şablon asla derlenmez.
 */
export const ACTION_SIZES = {
    sm: { button: 'size-[22px] rounded-[7px]', icon: 'size-[12px]', gap: 'gap-1' },
    md: { button: 'size-[30px] rounded-[9px]', icon: 'size-[15px]', gap: 'gap-1.5' },
} as const;

export type ActionSize = keyof typeof ACTION_SIZES;

/** Üç aksiyonun da paylaştığı kabuk: aynı ölçü, aynı odak halkası. */
export const actionShell = (size: ActionSize) =>
    `${ACTION_SIZES[size].button} inline-flex items-center justify-center border border-slate-900/8 bg-surface `
    + 'text-slate-600 transition-colors hover:border-accent-500/40 hover:text-accent-500 '
    + 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-500';

export interface ActionProduct {
    id: number;
    name: string;
    slug: string;
    price?: number | null;
    /** Satın alınabilir varyantın kimliği; yoksa doğrudan sepete eklenemez. */
    defaultProductId: number | null;
    hasVariants: boolean;
    inStock: boolean;
}

/** Favori düğmesi. Durumu çağıran bilir; bu bileşen yalnızca çizer. */
export function FavoriteButton({
    product, back, filled = false, size = 'md',
}: {
    product: Pick<ActionProduct, 'id' | 'name'>;
    back: string;
    filled?: boolean;
    size?: ActionSize;
}) {
    return (
        <form action={toggleFavoriteAction}>
            <input type="hidden" name="baseProductId" value={product.id} />
            <input type="hidden" name="back" value={back} />
            <button
                type="submit"
                className={`${actionShell(size)} ${filled ? 'border-accent-500/40 text-accent-500' : ''}`}
                aria-pressed={filled}
                aria-label={`${product.name} — ${filled ? 'favorilerden çıkar' : 'favorilere ekle'}`}
                title={filled ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            >
                <HeartIcon className={ACTION_SIZES[size].icon} filled={filled} />
            </button>
        </form>
    );
}

export default function ProductActions({
    product,
    settings,
    siteUrl,
    back,
    size = 'md',
    variant = 'icons',
    favoriteSlot,
    className = '',
}: {
    product: ActionProduct;
    settings: SiteSettings;
    siteUrl: string;
    /**
     * Misafir favoriye basınca girişten SONRA dönülecek adres. Sepete ekleme
     * artık hiç yönlendirmiyor (çerez + refresh), bu yüzden yalnız favori
     * yolunda kullanılıyor.
     */
    back: string;
    size?: ActionSize;
    variant?: 'icons' | 'bar';
    /**
     * Dolu/boş durumu bilen favori düğmesi. Verilmezse durumsuz olan çizilir —
     * arama açılırı gibi istemci bağlamlarında oturum okunamaz.
     */
    favoriteSlot?: ReactNode;
    className?: string;
}) {
    const whatsapp = productWhatsappLink(settings, product, siteUrl);
    const button = actionShell(size);
    const icon = ACTION_SIZES[size].icon;

    // Varyantlı ürün doğrudan sepete eklenemez: hangi renk, hangi boy? Buton
    // kaybolmuyor, ürün sayfasına BAĞLANIYOR — kullanıcı seçimini orada yapar.
    const needsChoice = product.hasVariants || !product.defaultProductId;

    if (variant === 'bar') {
        const bar = 'flex h-[34px] flex-1 items-center justify-center gap-1.5 rounded-[10px] '
            + 'border border-slate-900/10 bg-surface text-[12.5px] font-bold text-slate-800 transition '
            + 'hover:border-accent-500/45 hover:bg-accent-500 hover:text-white '
            + 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-500';

        return (
            <div className={`relative z-10 flex items-stretch gap-1.5 ${className}`}>
                {!product.inStock ? (
                    <span className={`${bar} pointer-events-none opacity-45`}>Tükendi</span>
                ) : needsChoice ? (
                    <Link href={routes.product(product.slug)} className={bar} title="Seçenek seçmek için ürüne git">
                        <BagIcon className="size-[14px]" /> Seçenekler
                    </Link>
                ) : (
                    <form action={quickAddToCartAction} className="flex flex-1">
                        <input type="hidden" name="productId" value={product.defaultProductId ?? ''} />
                        <button type="submit" className={bar}>
                            <BagIcon className="size-[14px]" /> Sepete ekle
                        </button>
                    </form>
                )}

                {whatsapp && (
                    <a
                        href={whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] border border-teal-ink/20 bg-teal-tint text-teal-ink transition hover:border-teal-ink/45"
                        aria-label={`${product.name} — WhatsApp ile satın al`}
                        title="WhatsApp ile satın al"
                    >
                        <WhatsappIcon className="size-[15px]" />
                    </a>
                )}
            </div>
        );
    }

    return (
        // relative z-10: kart ve açılır satırı stretched-link kullanıyor
        // (`after:absolute after:inset-0`); bu öğeler onun ÜSTÜNDE kalmalı,
        // yoksa ikona basmak ürün sayfasına gider.
        <div className={`relative z-10 flex items-center ${ACTION_SIZES[size].gap} ${className}`}>
            {favoriteSlot ?? <FavoriteButton product={product} back={back} size={size} />}

            {!product.inStock ? (
                <span className={`${button} pointer-events-none opacity-40`} aria-hidden>
                    <BagIcon className={icon} />
                </span>
            ) : needsChoice ? (
                <Link
                    href={routes.product(product.slug)}
                    className={button}
                    aria-label={`${product.name} — seçenekleri gör`}
                    title="Seçenek seçmek için ürüne git"
                >
                    <BagIcon className={icon} />
                </Link>
            ) : (
                <form action={quickAddToCartAction}>
                    <input type="hidden" name="productId" value={product.defaultProductId ?? ''} />
                    <button type="submit" className={button} aria-label={`${product.name} — sepete ekle`} title="Sepete ekle">
                        <BagIcon className={icon} />
                    </button>
                </form>
            )}

            {/* Numara tanımsızsa buton HİÇ çizilmez: tıklanınca bir şey
                yapmayan bir ikon, ikon olmamasından kötü. */}
            {whatsapp && (
                <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${button} hover:border-teal-ink/40 hover:text-teal-ink`}
                    aria-label={`${product.name} — WhatsApp ile satın al`}
                    title="WhatsApp ile satın al"
                >
                    <WhatsappIcon className={icon} />
                </a>
            )}
        </div>
    );
}
