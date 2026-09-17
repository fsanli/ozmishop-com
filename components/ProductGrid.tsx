import ProductCard from './ProductCard';
import type { ProductCard as ProductCardType } from '@/lib/types';

export default function ProductGrid({ products, priorityCount = 0 }: { products: ProductCardType[]; priorityCount?: number }) {
    return (
        <div className="grid gap-[clamp(10px,1.4vw,16px)] [grid-template-columns:repeat(auto-fill,minmax(min(50%-6px,205px),1fr))]">
            {products.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < priorityCount} />
            ))}
        </div>
    );
}
