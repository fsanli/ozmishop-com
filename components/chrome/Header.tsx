import Container from '@/components/Container';
import Logo from '@/components/Logo';
import MobileMenu from '@/components/MobileMenu';
import SearchBar from '@/components/SearchBar';
import { getCategoryTree } from '@/lib/api';
import CategoryNav from './CategoryNav';
import HeaderActions from './HeaderActions';

/**
 * Başlık. Üç varyant (tasarımda üçü de var):
 *   full    — arama + kategori şeridi (anasayfa, kategori, ürün detay)
 *   compact — arama var, şerit yok (arama, sepet, ödeme, hesabım, giriş)
 *   minimal — yalnız logo + aksiyonlar (başlangıç rehberi)
 *
 * BURADA cookies() / headers() ÇAĞRILMAZ. Cache Components altında yerleşimin
 * tepesinde bir istek API'si okumak {children}'ı — yani tüm siteyi — istek
 * zamanına çeker ve statik kabuk kaybolur. Oturuma bağlı tek parça sepet adedi
 * ve o CartCount'un kendi Suspense sınırında.
 */
export default async function Header({ variant = 'full' }: { variant?: 'full' | 'compact' | 'minimal' }) {
    const categories = variant === 'full' ? await getCategoryTree() : [];

    return (
        <header className="sticky top-0 z-30 border-b border-slate-900/8 bg-paper/92 backdrop-blur-[14px]">
            <Container className="flex items-center gap-[clamp(14px,3vw,36px)] py-[15px]">
                {variant === 'full' && <MobileMenu categories={categories} />}

                <Logo className="shrink-0 text-[clamp(20px,2.4vw,25px)]" />

                {variant !== 'minimal' && <SearchBar className="hidden flex-1 md:block" />}

                <div className="ml-auto">
                    <HeaderActions />
                </div>
            </Container>

            {variant !== 'minimal' && (
                <Container className="pb-3 md:hidden">
                    <SearchBar />
                </Container>
            )}

            {variant === 'full' && <CategoryNav categories={categories} />}
        </header>
    );
}
