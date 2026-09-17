import Link from 'next/link';
import Container from '@/components/Container';
import { colorsOf } from '@/lib/colors';
import { getCategoryTree } from '@/lib/api';
import { routes } from '@/lib/site';

/**
 * 404 gövdesi. Kök `not-found.tsx` ile grup içi `not-found.tsx` dosyalarının
 * ortak parçası — kök dosya grup yerleşimini miras ALAMADIĞI için kabuğu kendisi
 * kurar ve bu bileşeni içine koyar.
 */
export default async function NotFoundContent() {
    const categories = await getCategoryTree();
    const popular = categories.slice(0, 5);

    return (
        <Container className="flex flex-wrap items-start gap-[clamp(18px,3vw,44px)] pt-[clamp(30px,5vw,72px)]">
            <div className="min-w-0 flex-[999_1_340px]">
                <p className="font-display font-bold leading-[0.85] tracking-[-0.07em] text-accent-500 text-[clamp(78px,15vw,180px)]">
                    404
                </p>
                <h1 className="heading-1 mt-4">Bu sayfa taşınmış olabilir</h1>
                <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-slate-600">
                    Adresi değişen sayfaları otomatik yönlendiriyoruz; bu adres için bir kayıt bulunamadı.
                    Aramayı kullanarak ya da kategorilerden ilerleyerek aradığın ürüne ulaşabilirsin.
                </p>
                <div className="mt-6 flex flex-wrap gap-2.5">
                    <Link href={routes.home} className="btn-accent">Anasayfaya dön</Link>
                    <Link href={routes.searchPage} className="btn-secondary">Arama yap</Link>
                </div>
            </div>

            {popular.length > 0 && (
                <div className="card card-xl min-w-0 flex-[1_1_270px] p-[22px] sm:max-w-[360px]">
                    <h2 className="text-[12px] font-bold uppercase tracking-[0.05em] text-slate-600">Çok bakılan kategoriler</h2>
                    <ul className="mt-3.5 space-y-0.5">
                        {popular.map((category) => (
                            <li key={category.id}>
                                <Link
                                    href={routes.category(category.slug)}
                                    className="flex items-center gap-2.5 rounded-[var(--radius-sm)] py-2.5 text-sm transition-colors hover:text-accent-500"
                                >
                                    <span className={`dot-lg dot ${colorsOf(category).dot}`} />
                                    <span className="flex-1 font-medium">{category.name}</span>
                                    <span className="text-[12.5px] text-slate-600">{category.activeProductCount}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </Container>
    );
}
