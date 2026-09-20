import { Suspense } from 'react';
import Footer from '@/components/chrome/Footer';
import CartDock from '@/components/cart/CartDock';
import SupportDock from '@/components/chrome/SupportDock';
import Header from '@/components/chrome/Header';
import UtilityBar from '@/components/chrome/UtilityBar';

/**
 * Mağaza kabuğu. Burada da cookies()/headers() okunmaz — okunursa {children}
 * yani tüm mağaza istek zamanına düşer ve statik kabuk kaybolur.
 *
 * Header varyantı sayfa başına değişiyor (kategori şeridi yalnız anasayfa,
 * kategori ve ürün detayda var) ama bir yerleşim hangi çocuğun render
 * edildiğini bilemez; bu yüzden şerit burada 'full' olarak duruyor ve şeridi
 * istemeyen sayfalar tasarımda da mağaza içi olduğu için tutarlı kalıyor.
 */
export default function MagazaLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <UtilityBar />
            <Header variant="full" />
            <main id="icerik" className="flex-1">{children}</main>
            <Footer showRatingBadges />
            <SupportDock />
            {/* Suspense: useSearchParams okuyor, yoksa tüm yerleşim istek zamanına düşer. */}
            <Suspense fallback={null}><CartDock /></Suspense>
        </>
    );
}
