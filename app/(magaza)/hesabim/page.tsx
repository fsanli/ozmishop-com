import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { routes } from '@/lib/site';

// Yönlendirme akışın içinde (PPR) yapıldığı için yanıt 200 döner; noindex
// burada açıkça verilmezse kök düzenin "index, follow"u basılıyordu.
export const metadata: Metadata = { robots: { index: false, follow: false } };

// Hesabım kökü doğrudan bir şey göstermez; siparişler varsayılan bölüm.
export default function AccountIndex() {
    redirect(routes.accountOrders);
}
