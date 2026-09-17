import Link from 'next/link';
import { routes } from '@/lib/site';
import { HeartIcon, UserIcon } from '@/components/icons';
import CartButton from './CartButton';

const iconButton =
    'grid size-[42px] place-items-center rounded-[var(--radius-md)] text-slate-900 transition-colors hover:bg-slate-200';

/**
 * Hesap · favoriler · sepet. Hiçbiri cookies() okumaz; oturuma bağlı tek şey
 * sepet adedi ve o CartCount içinde, kendi Suspense sınırında kalıyor.
 */
export default function HeaderActions() {
    return (
        <div className="flex items-center gap-1.5">
            <Link href={routes.account} className={iconButton} aria-label="Hesabım">
                <UserIcon className="size-5" />
            </Link>
            <Link href={routes.favorites} className={`${iconButton} relative`} aria-label="Favorilerim">
                <HeartIcon className="size-5" />
            </Link>
            <CartButton />
        </div>
    );
}
