import { getFavoriteIds } from '@/lib/account';
import { FavoriteButton, type ActionSize } from './ProductActions';

/**
 * Dolu/boş kalp.
 *
 * Oturum okuduğu için ÇAĞIRAN <Suspense> ile sarmak ZORUNDA — CartCount ile
 * birebir aynı kural. Sarılmazsa listeyi barındıran sayfa istek zamanına
 * düşer ve statik kabuğunu kaybeder.
 *
 * Kart başına bir istek DEĞİL: `getFavoriteIds` özel önbellekli, aynı render
 * içindeki yirmi kart tek bir isteği paylaşır.
 *
 * Misafirde boş küme döner; kalp boş çizilir ve tıklanınca girişe yollar.
 */
export default async function FavoriteState({
    product, back, size = 'md',
}: {
    product: { id: number; name: string };
    back: string;
    size?: ActionSize;
}) {
    const ids = await getFavoriteIds();
    return <FavoriteButton product={product} back={back} size={size} filled={ids.has(product.id)} />;
}
