import { routes } from '@/lib/site';
import type { ProductCard as ProductCardData, ProductGroup } from '@/lib/types';
import ProductCard from '../ProductCard';
import ScrollArrows from '../ui/ScrollArrows';
import SectionShell from './SectionShell';
import { TrackList } from '@/components/analytics/Track';

/**
 * Ürün grubu bloğu. Ürünler `HomeSections`'ta çekilir (grup başına ayrı
 * `group:{code}` önbelleği) ve önceki bölümlerde görünenler istenirse ayıklanır;
 * bu bileşen yalnız çizer.
 *
 * Yatay yerleşimde başlığın yanında sağ/sol oklar (S05): fare kullanıcısı için.
 * Ürün sayısı paneldeki limitle SINIRLI kalır; oklar yeni ürün yüklemez,
 * "Tümünü gör" koleksiyon sayfasına gider. Anasayfada sonsuz liste yok.
 */
export default function ProductGroupSection({
    sectionId,
    group,
    products,
    title,
    subtitle,
    limit = 8,
    layout = 'carousel',
    priority = false,
}: {
    /** Şerit kabının kimliği için (aynı grup iki bölümde olabilir). */
    sectionId?: number | string;
    group: ProductGroup | null;
    products: ProductCardData[];
    title?: string | null;
    subtitle?: string | null;
    limit?: number;
    layout?: 'carousel' | 'grid';
    priority?: boolean;
}) {
    if (!products.length) return null;
    const stripId = `serit-${String(sectionId ?? group?.code ?? 'grup').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const stripLabel = title || group?.name || 'Ürünler';

    return (
        <SectionShell
            // Kicker yalnızca panelde ayrı bir başlık girilmişse anlamlı; yoksa
            // grup adını iki kez yazdırırdı.
            kicker={title && group?.name && title !== group.name ? group.name : undefined}
            title={title || group?.name}
            subtitle={subtitle}
            actionHref={group ? routes.group(group.slug) : undefined}
            actions={layout === 'grid' ? undefined : <ScrollArrows targetId={stripId} label={stripLabel} className="hidden sm:flex" />}
        >
            <TrackList id={`anasayfa:${group?.code ?? title ?? 'grup'}`} name={title || group?.name || 'Anasayfa'} products={products.slice(0, limit)} />
            {layout === 'grid' ? (
                <div className="grid gap-[clamp(10px,1.4vw,16px)] [grid-template-columns:repeat(auto-fill,minmax(min(50%-6px,210px),1fr))]">
                    {products.slice(0, limit).map((product, index) => (
                        <ProductCard key={product.id} product={product} priority={priority && index < 2} />
                    ))}
                </div>
            ) : (
                <div
                    id={stripId}
                    role="list"
                    aria-label={stripLabel}
                    className="no-scrollbar -mx-[clamp(16px,4vw,44px)] flex gap-[clamp(10px,1.4vw,16px)] overflow-x-auto overscroll-x-contain px-[clamp(16px,4vw,44px)] pb-1 sm:mx-0 sm:px-0"
                >
                    {products.slice(0, limit).map((product, index) => (
                        <div key={product.id} role="listitem" className="w-44 shrink-0 sm:w-[210px]">
                            <ProductCard product={product} priority={priority && index < 2} />
                        </div>
                    ))}
                </div>
            )}
        </SectionShell>
    );
}
