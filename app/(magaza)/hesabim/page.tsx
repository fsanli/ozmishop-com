import { redirect } from 'next/navigation';
import { routes } from '@/lib/site';

// Hesabım kökü doğrudan bir şey göstermez; siparişler varsayılan bölüm.
export default function AccountIndex() {
    redirect(routes.accountOrders);
}
