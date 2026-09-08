import Link from 'next/link';
import { routes } from '@/lib/site';

export default function NotFound() {
    return (
        <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-accent-500">404</p>
            <h1 className="heading-1 mb-3">Aradığınız sayfa bulunamadı</h1>
            <p className="mb-6 text-sm text-slate-500">
                Sayfa kaldırılmış ya da adresi değişmiş olabilir. Aramayı kullanarak ürüne ulaşabilirsiniz.
            </p>
            <div className="flex gap-2">
                <Link href={routes.home} className="btn-primary">Anasayfa</Link>
                <Link href={routes.brands} className="btn-secondary">Markalar</Link>
            </div>
        </div>
    );
}
