import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AgeGate from '@/components/AgeGate';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import JsonLd from '@/components/JsonLd';
import { organizationSchema, websiteSchema } from '@/lib/schema';
import { site } from '@/lib/site';
import './globals.css';

// latin-ext alt kümesi Türkçe karakterler (ş, ğ, ı, İ, ö, ü, ç) için zorunlu.
const inter = Inter({
    subsets: ['latin', 'latin-ext'],
    variable: '--font-inter',
    display: 'swap',
});

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
        <html lang="tr" className={`${inter.variable} h-full`}>
            <body className="flex min-h-full flex-col">
                <a href="#icerik" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-white focus:p-2">
                    İçeriğe geç
                </a>
                <Header />
                <main id="icerik" className="flex-1">{children}</main>
                <Footer />
                <AgeGate />
                <JsonLd data={[organizationSchema(), websiteSchema()]} />
            </body>
        </html>
    );
}
