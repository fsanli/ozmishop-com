import { cookies } from 'next/headers';
import { CART_COUNT_COOKIE } from '@/lib/session';

/**
 * Sepetteki adet. cookies() okur, bu yüzden ÇAĞIRAN <Suspense> ile sarmak
 * ZORUNDA — yoksa header'ı barındıran yerleşim istek zamanına düşer ve
 * sitenin tamamı statik kabuğunu kaybeder.
 *
 * Adet ayrı, okunabilir bir çerezde tutulur (`ozmi_sepet_n`): aksi halde her
 * gezinmede sepet API'sine bir gidiş-dönüş yapmak gerekirdi.
 */
export default async function CartCount() {
    const raw = (await cookies()).get(CART_COUNT_COOKIE)?.value;
    const count = Number.parseInt(raw ?? '0', 10);
    return <span className="text-[13.5px] font-bold tabular-nums">{Number.isFinite(count) ? count : 0}</span>;
}
