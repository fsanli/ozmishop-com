import { Suspense } from 'react';
import { FavoriteButton } from '@/components/product/ProductActions';
import FavoriteState from '@/components/product/FavoriteState';
import ProductCardView from '@/components/ProductCardView';
import { getSettings } from '@/lib/api';
import { site } from '@/lib/site';
import type { ProductCard as ProductCardType } from '@/lib/types';

/**
 * Ürün kartı — sıfır istemci JS. Gövde `ProductCardView`'da; bu sarmalayıcı
 * ayarları ve kalbin durumunu sunucuda okur.
 *
 * v2 tasarımı kartın İÇİNE favori kalbi ve "sepete ekle" kutucuğu koyuyor. Kartın
 * tamamını <a> yapmak bu durumda geçersiz HTML üretir (iç içe etkileşimli öğe) ve
 * klavye gezinmesini bozar. Çözüm: kart bir <article>, başlıktaki bağlantı
 * `after:absolute after:inset-0` ile tüm karta yayılır; kalp ve + kendi
 * yığın bağlamında (z-10) üstte kalır.
 *
 * `priority` yalnızca listenin ilk satırındaki kartlara verilir (LCP).
 *
 * YÜKSEKLİK: kart `h-full` ile satırının en uzun kartına eşitlenir; sabit bir
 * min-height YOK. Rozet sayısı ve başlık uzunluğu ürüne göre değişiyor, sabit
 * bir sayı (ör. 411px) bugünkü en uzun içeriğe göre seçilmiş olurdu: dört
 * rozetli bir ürün yine taşar, hiç rozeti olmayan bir satır ise o kadar boşluk
 * bırakırdı. Fiyat ve aksiyonlar `mt-auto` ile dibe yaslandığı için kartlar
 * uzayınca da aynı hizada kalıyor.
 *
 * Aksiyon ikonları (favori / sepet / WhatsApp) `ProductActions`'tan geliyor;
 * arama açılırı da aynı bileşeni kullanıyor. Dolu kalp `<Suspense>` içinde
 * akıyor: kartın kendisi statik kalsın, yalnız kalbin durumu istek zamanına
 * düşsün — Header'daki CartCount ile aynı kural.
 */
export default async function ProductCard({
    product, priority = false, back = '/',
}: {
    product: ProductCardType;
    priority?: boolean;
    /** Aksiyon sonrası dönülecek adres. Liste sayfası kendi yolunu geçer. */
    back?: string;
}) {
    const settings = await getSettings();
    return (
        <ProductCardView
            product={product}
            priority={priority}
            back={back}
            settings={settings}
            siteUrl={site.url}
            favoriteSlot={(
                <Suspense fallback={<FavoriteButton product={product} back={back} />}>
                    <FavoriteState product={product} back={back} />
                </Suspense>
            )}
        />
    );
}
