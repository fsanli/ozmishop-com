import ProductCard from './ProductCard';
import type { ProductCard as ProductCardType } from '@/lib/types';

/**
 * `back`: kart aksiyonlarından (favori, sepete ekle) sonra dönülecek adres.
 * Sunucu bileşeni bulunduğu yolu kendi okuyamaz — okusa `headers()` çağırır ve
 * sayfa statik kabuğunu kaybederdi — bu yüzden çağıran geçiyor. Yalnız hata ve
 * "önce giriş yap" yollarında kullanılıyor; başarılı işlem sayfada kalıyor.
 */
export default function ProductGrid({
    products, priorityCount = 0, back = '/',
}: {
    products: ProductCardType[];
    priorityCount?: number;
    back?: string;
}) {
    return (
        <div className="grid gap-[clamp(10px,1.4vw,16px)] [grid-template-columns:repeat(auto-fill,minmax(min(50%-6px,205px),1fr))]">
            {products.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < priorityCount} back={back} />
            ))}
        </div>
    );
}
