import { cacheLife, cacheTag } from 'next/cache';
import Link from 'next/link';
import { getCategoryTree, getPages } from '@/lib/api';
import { routes, site } from '@/lib/site';

/**
 * Alt bilgi önbelleklenir: içeriğin tamamı panelden yönetilen veriden gelir ve
 * telif yılı için `new Date()` çağrılır — Cache Components'ta deterministik olmayan
 * çağrılar ya istek zamanına ertelenmeli ya da önbelleklenmelidir. Yıl için
 * önbelleklemek doğru olan: herkes aynı değeri görür, yıl dönümünde tazelenir.
 */
export default async function Footer() {
    'use cache';
    cacheTag('pages', 'categories');
    cacheLife('days');

    const [pages, categories] = await Promise.all([getPages(), getCategoryTree()]);

    return (
        <footer className="mt-16 border-t border-slate-200 bg-white">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
                <div>
                    <span className="text-lg font-bold text-brand-700">
                        ozmi<span className="text-accent-500">shop</span>
                    </span>
                    <p className="mt-2 text-sm text-slate-500">{site.description}</p>
                </div>

                <div>
                    <h2 className="mb-3 text-sm font-semibold text-slate-900">Kategoriler</h2>
                    <ul className="space-y-1.5 text-sm text-slate-500">
                        {categories.slice(0, 6).map((category) => (
                            <li key={category.id}>
                                <Link href={routes.category(category.slug)} className="hover:text-brand-600">{category.name}</Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h2 className="mb-3 text-sm font-semibold text-slate-900">Kurumsal</h2>
                    <ul className="space-y-1.5 text-sm text-slate-500">
                        {pages.map((page) => (
                            <li key={page.id}>
                                <Link href={routes.page(page.slug)} className="hover:text-brand-600">{page.title}</Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h2 className="mb-3 text-sm font-semibold text-slate-900">Alışveriş</h2>
                    <ul className="space-y-1.5 text-sm text-slate-500">
                        <li><Link href={routes.brands} className="hover:text-brand-600">Tüm markalar</Link></li>
                        <li><Link href="/koleksiyon/firsat-urunleri" className="hover:text-brand-600">Fırsat ürünleri</Link></li>
                        <li><Link href="/koleksiyon/yeni-gelenler" className="hover:text-brand-600">Yeni gelenler</Link></li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-slate-100">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-slate-400 sm:flex-row sm:px-6 lg:px-8">
                    <p>© {new Date().getFullYear()} {site.name}. Tüm hakları saklıdır.</p>
                    <p className="flex items-center gap-2">
                        <span className="badge badge-neutral">18+</span>
                        Bu site yalnızca 18 yaşından büyükler içindir.
                    </p>
                </div>
            </div>
        </footer>
    );
}
