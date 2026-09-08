import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import { getBrands } from '@/lib/api';
import { routes, site } from '@/lib/site';

export const metadata: Metadata = {
    title: 'Markalar',
    description: `${site.name} mağazasındaki tüm markalar.`,
    alternates: { canonical: routes.brands },
};

export default async function BrandsPage() {
    const brands = await getBrands();

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ name: 'Markalar', href: routes.brands }]} />
            <h1 className="heading-1 mb-6">Markalar</h1>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
                {brands.map((brand) => (
                    <Link key={brand.id} href={routes.brand(brand.slug)} className="card card-hover flex flex-col items-center gap-2 p-5 text-center">
                        {brand.logo ? (
                            <Image src={brand.logo.url} alt={brand.name} width={120} height={40} className="h-10 w-auto object-contain" />
                        ) : (
                            <span className="text-base font-semibold text-slate-800">{brand.name}</span>
                        )}
                        <span className="text-xs text-slate-400">{brand.activeProductCount} ürün</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
