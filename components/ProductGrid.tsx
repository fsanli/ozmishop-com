import ProductCard from './ProductCard';
import type { ProductCard as ProductCardType } from '@/lib/types';

export default function ProductGrid({ products, priorityCount = 0 }: { products: ProductCardType[]; priorityCount?: number }) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < priorityCount} />
            ))}
        </div>
    );
}
