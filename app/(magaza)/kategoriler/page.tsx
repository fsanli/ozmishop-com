import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import { getCategoryTree } from '@/lib/api';
import { og } from '@/lib/seo';
import { routes, site } from '@/lib/site';
import type { Category } from '@/lib/types';

export const metadata: Metadata = {
    title: 'Kategoriler',
    description: `${site.name} mağazasındaki tüm kategoriler.`,
    alternates: { canonical: routes.categories },
    openGraph: og({ title: 'Kategoriler', url: routes.categories }),
};

/** Ürünsüz kategori listelenmez: boş bir sayfaya götürürdü (anasayfa ızgarasıyla aynı kural). */
const withProducts = (category: Category) => category.activeProductCount > 0;

/**
 * Tüm kategoriler. Anasayfadaki "Tüm kategoriler" bağlantısı eskiden yine
 * anasayfaya dönüyordu; bu sayfa kök kategorileri ve alt kategorilerini
 * ürün sayılarıyla listeler.
 */
export default async function CategoriesPage() {
    const roots = (await getCategoryTree()).filter(withProducts);

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ name: 'Kategoriler', href: routes.categories }]} />
            <h1 className="heading-1 mb-6">Kategoriler</h1>

            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {roots.map((root) => {
                    const children = (root.children ?? []).filter(withProducts);
                    return (
                        <section key={root.id} className="card p-5">
                            <h2 className="text-[17px] font-bold tracking-[-0.02em]">
                                <Link href={routes.category(root.slug)} className="hover:text-accent-500">{root.name}</Link>
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-600">{root.activeProductCount} ürün</p>
                            {children.length > 0 && (
                                <ul className="mt-3 space-y-1.5 border-t border-slate-900/6 pt-3 text-[14px]">
                                    {children.map((child) => (
                                        <li key={child.id} className="flex items-baseline justify-between gap-3">
                                            <Link href={routes.category(child.slug)} className="text-slate-800 hover:text-accent-500">{child.name}</Link>
                                            <span className="shrink-0 text-xs text-slate-500">{child.activeProductCount}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
