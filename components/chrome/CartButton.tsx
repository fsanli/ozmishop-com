import Link from 'next/link';
import { Suspense } from 'react';
import { routes } from '@/lib/site';
import { BagIcon } from '@/components/icons';
import CartCount from './CartCount';

/** Koyu hap buton; hover'da bordoya döner. Adet Suspense içinde akar. */
export default function CartButton() {
    return (
        <Link
            href={routes.cart}
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-slate-900 px-[17px] py-[11px] text-on-dark transition-colors hover:bg-accent-500"
        >
            <BagIcon className="size-[17px]" />
            <span className="sr-only">Sepetim</span>
            <Suspense fallback={<span className="inline-block w-3" />}>
                <CartCount />
            </Suspense>
        </Link>
    );
}
