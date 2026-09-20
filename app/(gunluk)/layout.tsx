import Footer from '@/components/chrome/Footer';
import SupportDock from '@/components/chrome/SupportDock';
import GunlukMasthead from '@/components/gunluk/GunlukMasthead';

/**
 * Günlük kabuğu. Mağaza header'ı ve yardımcı şerit YOK: tasarımda Günlük'ün
 * kendi mastheadı var ve iç içe bir yerleşim bir üstünün kabuğunu kaldıramaz —
 * bu yüzden ayrı rota grubu.
 *
 * Mağaza yerleşimiyle aynı kural burada da geçerli: cookies()/headers()
 * okunmaz, yoksa tüm Günlük istek zamanına düşer.
 */
export default function GunlukLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <GunlukMasthead />
            <main id="icerik" className="flex-1">{children}</main>
            <Footer />
            <SupportDock />
        </>
    );
}
