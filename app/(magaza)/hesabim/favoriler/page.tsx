import type { Metadata } from 'next';
import Link from 'next/link';
import EmptyState from '@/components/EmptyState';
import ProductGrid from '@/components/ProductGrid';
import { getMyFavorites } from '@/lib/account';
import { routes } from '@/lib/site';
import AccountShell from '../AccountShell';

export const metadata: Metadata = { title: 'Favorilerim', robots: { index: false, follow: false } };

export default async function FavoritesPage() {
    const { items } = await getMyFavorites();
    const discounted = items.filter((item) => item.discountPercent > 0).length;

    return (
        <AccountShell
            active={routes.favorites}
            title="Favorilerim"
            description={items.length
                ? `${items.length} ürün${discounted ? ` · ${discounted}'si indirimde` : ''}`
                : undefined}
        >
            {items.length === 0 ? (
                <EmptyState
                    where="Favoriler"
                    color="rose"
                    title="Kaydedilmiş ürün yok"
                    description="Beğendiğin ürünleri favorilere ekleyince burada toplanır ve indirime girince görürsün."
                    action={<Link href={routes.group('cok-satanlar')} className="btn-secondary">Çok satanlara bak</Link>}
                />
            ) : (
                <ProductGrid products={items} priorityCount={4} back={routes.favorites} />
            )}
        </AccountShell>
    );
}
