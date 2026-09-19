import type { NextConfig } from 'next';

const r2Host = process.env.R2_PUBLIC_HOSTNAME || '';

/**
 * R2 kapalıyken görseller API'nin /uploads klasöründen gelir; izin verilen host
 * o zaman API'nin kendi hostudur. Sabit 'localhost' yazmak yerine API_BASE_URL'den
 * TÜRETİLİYOR — aksi halde API Render'a taşındığında next/image sessizce 400 döner
 * ve seed verisi placehold.co kullandığı için bu ancak ilk gerçek yüklemede fark edilir.
 */
const apiPattern = (() => {
    try {
        const url = new URL(process.env.API_BASE_URL || 'http://localhost:4200');
        return [
            {
                protocol: url.protocol.replace(':', '') as 'http' | 'https',
                hostname: url.hostname,
                ...(url.port ? { port: url.port } : {}),
            },
        ];
    } catch {
        return [];
    }
})();

/**
 * Panelin adresi. Anasayfa önizleme rotası YALNIZCA bu kaynaktan iframe'e
 * alınabilir; tanımlı değilse hiçbir yerden alınamaz ('none').
 */
const adminOrigin = process.env.ADMIN_BASE_URL || '';

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
            ...apiPattern,
            // Seed verisindeki yer tutucu görseller.
            { protocol: 'https' as const, hostname: 'placehold.co' },
        ],
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 86400,
    },

    async headers() {
        return [
            {
                /*
                 * Önizleme rotası: panelin taslak anasayfayı görebildiği tek yer.
                 * `frame-ancestors` yalnız panele izin verir; adres tanımsızsa
                 * hiçbir yere. `X-Frame-Options` BURAYA KOYULMAZ — aşağıdaki
                 * genel kural da bu yolu dışlıyor, çünkü XFO'nun "yalnız şu
                 * kaynak" diye bir değeri yok ve SAMEORIGIN paneli engellerdi.
                 *
                 * Cache-Control verilmiyor: rota zaten dinamik ve Next kendi
                 * `no-cache, must-revalidate` başlığını basıyor; buraya `no-store`
                 * yazmak override edilip yanlış bir vaat bırakıyordu.
                 */
                source: '/onizleme/:path*',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: `frame-ancestors ${adminOrigin || "'none'"}`,
                    },
                    { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
                ],
            },
            {
                // `/onizleme` HARİÇ her yol: oraya SAMEORIGIN uygulanmamalı.
                source: '/((?!onizleme).*)',
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
