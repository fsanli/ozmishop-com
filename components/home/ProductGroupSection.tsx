import { getGroupByCode } from '@/lib/api';
import { routes } from '@/lib/site';
import ProductCard from '../ProductCard';
import SectionShell from './SectionShell';

/**
 * Ürün grubu bloğu. Veri /home ile birlikte GELMEZ; ayrı ve kendi `group:{code}`
 * etiketiyle önbelleklenir — böylece panelde tek bir grup değişince yalnızca o blok
 * tazelenir, anasayfanın geri kalanı önbellekte kalır.
 */
export default async function ProductGroupSection({
    code,
    title,
    subtitle,
    limit = 8,
    layout = 'carousel',
    priority = false,
}: {
    code: string;
    title?: string | null;
    subtitle?: string | null;
    limit?: number;
    layout?: 'carousel' | 'grid';
    priority?: boolean;
}) {
    const group = await getGroupByCode(code, limit);
    const products = group?.items ?? [];
    if (!products.length) return null;

    return (
        <SectionShell
            // Kicker yalnızca panelde ayrı bir başlık girilmişse anlamlı; yoksa
            // grup adını iki kez yazdırırdı.
            kicker={title && group?.name && title !== group.name ? group.name : undefined}
            title={title || group?.name}
            subtitle={subtitle}
            actionHref={group ? routes.group(group.slug) : undefined}
        >
            {layout === 'grid' ? (
                <div className="grid gap-[clamp(10px,1.4vw,16px)] [grid-template-columns:repeat(auto-fill,minmax(min(50%-6px,210px),1fr))]">
                    {products.slice(0, limit).map((product, index) => (
                        <ProductCard key={product.id} product={product} priority={priority && index < 4} />
                    ))}
                </div>
            ) : (
                <div className="no-scrollbar -mx-[clamp(16px,4vw,44px)] flex gap-[clamp(10px,1.4vw,16px)] overflow-x-auto px-[clamp(16px,4vw,44px)] pb-1 sm:mx-0 sm:px-0">
                    {products.slice(0, limit).map((product, index) => (
                        <div key={product.id} className="w-44 shrink-0 sm:w-[210px]">
                            <ProductCard product={product} priority={priority && index < 4} />
                        </div>
                    ))}
                </div>
            )}
        </SectionShell>
    );
}
