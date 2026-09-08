import type { NextConfig } from 'next';

const r2Host = process.env.R2_PUBLIC_HOSTNAME || '';

const nextConfig: NextConfig = {
    // Cache Components: veri varsayılan olarak dinamik, `use cache` ile önbelleklenir ve
    // sayfa statik kabuk + akan içerik (PPR) olarak render edilir. Tazelik zamana değil,
    // API'nin tetiklediği /api/revalidate çağrısına bağlı.
    cacheComponents: true,

    // Kendi sunucumuzda (Docker) çalışırken bağımlılıkları toplayan standalone çıktısı
    // gerekiyor; Vercel'de bu çıktı kendi dosya izleme manifestiyle çakışıyor.
    ...(process.env.VERCEL ? {} : { output: 'standalone' as const }),

    poweredByHeader: false,
    // Sondaki eğik çizgi tutarsızlığı çift URL üretir; SEO'da kopya içerik demektir.
    trailingSlash: false,

    images: {
        remotePatterns: [
            ...(r2Host ? [{ protocol: 'https' as const, hostname: r2Host }] : []),
            // Yerel geliştirmede medya API'nin /uploads klasöründen gelir.
            { protocol: 'http' as const, hostname: 'localhost', port: '4000' },
            // Seed verisindeki yer tutucu görseller.
            { protocol: 'https' as const, hostname: 'placehold.co' },
        ],
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 86400,
    },

    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                    // Yetişkin içerik: aile filtreleri ve tarayıcı eklentileri bu başlığı okur.
                    { key: 'Rating', value: 'RTA-5042-1996-1400-1577-RTA' },
                ],
            },
        ];
    },
};

export default nextConfig;
