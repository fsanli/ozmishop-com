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
            title={title || group?.name}
            subtitle={subtitle}
            actionHref={group ? routes.group(group.slug) : undefined}
        >
            {layout === 'grid' ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                    {products.slice(0, limit).map((product, index) => (
                        <ProductCard key={product.id} product={product} priority={priority && index < 4} />
                    ))}
                </div>
            ) : (
                <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:gap-4 sm:px-0">
                    {products.slice(0, limit).map((product, index) => (
                        <div key={product.id} className="w-40 shrink-0 sm:w-52">
                            <ProductCard product={product} priority={priority && index < 4} />
                        </div>
                    ))}
                </div>
            )}
        </SectionShell>
    );
}
