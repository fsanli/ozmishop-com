import { cookies } from 'next/headers';
import { FLASH_COOKIE } from '@/lib/flash';
import CartDock from './CartDock';

/**
 * Bayrağı çerezden okuyup çekmeceye verir.
 *
 * cookies() okuduğu için ÇAĞIRAN <Suspense> ile sarmak ZORUNDA — CartCount ile
 * birebir aynı kural. Sarılmazsa mağaza yerleşimi istek zamanına düşer ve
 * sitenin tamamı statik kabuğunu kaybeder.
 *
 * Neden sunucuda okunuyor: aksiyon çerezi yazıp `refresh()` çağırıyor; bu
 * bileşen yeniden render edilince yeni değer prop olarak akıyor. Adres
 * parametresi kullanılsaydı gezinme olur ve sayfa başa kayardı.
 */
export default async function CartFlash() {
    const flash = (await cookies()).get(FLASH_COOKIE)?.value ?? null;
    return <CartDock flash={flash} />;
}
