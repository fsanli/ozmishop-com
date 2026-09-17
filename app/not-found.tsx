import Footer from '@/components/chrome/Footer';
import Header from '@/components/chrome/Header';
import NotFoundContent from '@/components/NotFoundContent';
import UtilityBar from '@/components/chrome/UtilityBar';

/**
 * Eşleşmeyen adresler KÖK not-found'a düşer; bu dosya (magaza) yerleşiminin
 * ÜSTÜNDE olduğu için onun kabuğunu miras alamaz ve kabuğu kendisi kurar.
 * Bilinçli, küçük bir tekrar — alternatifi kabuksuz bir 404 sayfası.
 */
export default function NotFound() {
    return (
        <>
            <UtilityBar />
            <Header variant="compact" />
            <main id="icerik" className="flex-1">
                <NotFoundContent />
            </main>
            <Footer showRatingBadges />
        </>
    );
}
