import type { Metadata } from 'next';
import { Manrope, Sora } from 'next/font/google';
import AgeGate from '@/components/AgeGate';
import JsonLd from '@/components/JsonLd';
import { organizationSchema, websiteSchema } from '@/lib/schema';
import { site } from '@/lib/site';
import './globals.css';

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
    openGraph: {
        type: 'website',
        locale: site.locale,
        siteName: site.name,
        title: site.title,
        description: site.description,
        url: site.url,
    },
    twitter: { card: 'summary_large_image', title: site.title, description: site.description },
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
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
                <AgeGate />
                <JsonLd data={[organizationSchema(), websiteSchema()]} />
            </body>
        </html>
    );
}
