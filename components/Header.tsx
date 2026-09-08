import Link from 'next/link';
import { getCategoryTree } from '@/lib/api';
import { routes } from '@/lib/site';
import MobileMenu from './MobileMenu';
import SearchBar from './SearchBar';

/**
 * Başlık. Kategori menüsü önbellekli veriden gelir (`categories` etiketi), bu yüzden
 * kök yerleşim statik kabukta kalır — burada cookies() gibi istek API'leri ÇAĞRILMAZ.
 */
export default async function Header() {
    const categories = await getCategoryTree();

    return (
        <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
            <div className="bg-brand-900 text-white">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-4 py-1.5 text-center text-xs sm:px-6 lg:px-8">
                    <span>Gizli paketleme</span>
                    <span className="hidden sm:inline text-brand-300">•</span>
                    <span>Aynı gün kargo</span>
                    <span className="hidden sm:inline text-brand-300">•</span>
                    <span>Güvenli ödeme</span>
                </div>
            </div>

            <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:gap-6 lg:px-8">
                <MobileMenu categories={categories} />

                <Link href={routes.home} className="shrink-0 text-xl font-bold tracking-tight text-brand-700">
                    ozmi<span className="text-accent-500">shop</span>
                </Link>

                <SearchBar className="hidden flex-1 lg:block" />

                <nav className="ml-auto hidden items-center gap-4 text-sm lg:flex">
                    <Link href={routes.brands} className="text-slate-600 hover:text-brand-600">Markalar</Link>
                    <Link href={routes.page('kargo-ve-teslimat')} className="text-slate-600 hover:text-brand-600">Kargo</Link>
                </nav>
            </div>

            <SearchBar className="mx-auto max-w-7xl px-4 pb-3 lg:hidden" />

            <nav aria-label="Kategoriler" className="hidden border-t border-slate-100 lg:block">
                <ul className="no-scrollbar mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
                    {categories.map((category) => (
                        <li key={category.id} className="group relative">
                            <Link
                                href={routes.category(category.slug)}
                                className="block whitespace-nowrap px-3 py-2.5 text-sm text-slate-700 hover:text-brand-600"
                            >
                                {category.name}
                            </Link>
                            {category.children && category.children.length > 0 && (
                                <div className="invisible absolute left-0 top-full z-50 min-w-52 rounded-b-xl border border-t-0 border-slate-100 bg-white p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                                    <ul>
                                        {category.children.map((child) => (
                                            <li key={child.id}>
                                                <Link
                                                    href={routes.category(child.slug)}
                                                    className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-600"
                                                >
                                                    {child.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>
        </header>
    );
}
