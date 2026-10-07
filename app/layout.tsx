import type { Metadata } from 'next';
import { Manrope, Sora } from 'next/font/google';
import ConsentMounts from '@/components/consent/ConsentMounts';
import { isIndexable, site } from '@/lib/site';
import { og } from '@/lib/seo';
import './globals.css';
import SiteJsonLd from '@/components/SiteJsonLd';

/**
 * Kök yerleşim KABUK İÇERMEZ. Header/Footer grup yerleşimlerinde:
 *   (magaza) → UtilityBar + Header + Footer
 *   (gunluk) → Günlük mastheadı + Footer
 * İç içe bir yerleşim üstündekinin kabuğunu KALDIRAMAZ; blogun kendi başlığı
 * olduğu için tek doğru çözüm rota grupları.
 *
 * latin-ext Türkçe karakterler (ş ğ ı İ ö ü ç) için zorunlu. weight dizisi
 * verilmiyor: iki font da variable eksen taşıyor, tek dosyada 400–700 gelir.
 */
const sora = Sora({ subsets: ['latin', 'latin-ext'], variable: '--font-sora', display: 'swap' });
const manrope = Manrope({ subsets: ['latin', 'latin-ext'], variable: '--font-manrope', display: 'swap' });

export const metadata: Metadata = {
    metadataBase: new URL(site.url),
    title: { default: site.title, template: `%s | ${site.name}` },
    description: site.description,
    applicationName: site.name,
    // Yetişkin içerik işaretleri: aile filtreleri ve arama motorları bunu okur.
    other: { rating: 'adult', RATING: 'RTA-5042-1996-1400-1577-RTA' },
    openGraph: og({ title: site.title, description: site.description, url: site.url }),
    // Yalnız kart tipi: başlık ve açıklama verilirse alt sayfalar ana sayfanınkini
    // miras alır. Verilmeyince X/Twitter og:title ve og:description'a düşer.
    twitter: { card: 'summary_large_image' },
    // Sayfa düzeyindeki `robots` bunu EZER; indekslenmeyen ortamın asıl kapısı
    // next.config.ts'teki `X-Robots-Tag` başlığı.
    robots: isIndexable()
        ? {
            index: true,
            follow: true,
            googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
        }
        : { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="tr" className={`${sora.variable} ${manrope.variable} h-full`}>
            <body className="flex min-h-full flex-col">
                <a
                    href="#icerik"
                    className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-[var(--radius-md)] focus:bg-surface focus:p-2 focus:font-bold"
                >
                    İçeriğe geç
                </a>
                {children}
                <ConsentMounts />
                <SiteJsonLd />
            </body>
        </html>
    );
}
