'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { UMAMI_ID } from '@/lib/consent-format';
import { readConsent, serverConsent, subscribeConsent } from '@/lib/consent';
import { isInternal, rememberInternalTraffic } from '@/lib/analytics/gtag';
import { analyticsPath, cleanUrl } from '@/lib/analytics/sanitize';

type UmamiPayload = Record<string, unknown> & { url?: string; referrer?: string; title?: string };
declare global {
    interface Window {
        umami?: { track: (payload?: UmamiPayload | ((props: UmamiPayload) => UmamiPayload)) => void };
    }
}

/**
 * Umami Cloud — çerezsiz ziyaret istatistiği. GA4 ile aynı kurallar:
 *   - YALNIZ analitik izni varsa yüklenir (betik indirilmez bile).
 *   - Otomatik izleme KAPALI (`data-auto-track="false"`): Umami ham adresi
 *     gönderirdi (eski e-posta bağlantısı `?e=`, jetonlar, sipariş numarası).
 *     Her gezinmede adres `analyticsPath` ile temizlenip ELLE gönderilir.
 *   - `data-domains`: yalnız canlı alan sayılır (önizleme, yerel geliştirme değil).
 *   - Ekip içi trafik (`?_ic=1`) hiç gönderilmez.
 */
export default function UmamiLoader() {
    const consent = useSyncExternalStore(subscribeConsent, readConsent, serverConsent);
    const [ready, setReady] = useState(false);
    if (!UMAMI_ID || !consent.analytics) return null;

    return (
        <>
            {/* id "umami" OLAMAZ: tarayıcı id'li öğeyi `window.umami` olarak açar,
                Umami de dolu sanıp kendi `track`'ini kurmaz (canlıda yaşandı). */}
            <Script
                id="umami-tracker"
                src="https://cloud.umami.is/script.js"
                strategy="afterInteractive"
                data-website-id={UMAMI_ID}
                data-auto-track="false"
                data-domains="ozmishop.com"
                onReady={() => setReady(true)}
            />
            {ready && <UmamiPageViews />}
        </>
    );
}

/** Son gönderilen adres: StrictMode'un çift effect'i ve aynı adrese dönüş tek sayılır. */
let lastPath = '';

function UmamiPageViews() {
    const pathname = usePathname();
    const search = useSearchParams().toString();

    useEffect(() => {
        if (typeof window.umami?.track !== 'function') return;
        rememberInternalTraffic(window.location.search);
        if (isInternal()) return;
        const url = analyticsPath(window.location.href);
        if (!url || url === lastPath) return;
        // Geliş adresi yalnız ilk sayfada ve TAM adres (dış site); parametreleri
        // temizlenmiş. Site içi gezinmede Umami zaten kendi alanını saymaz.
        const referrer = lastPath ? '' : cleanUrl(document.referrer);
        lastPath = url;
        // Fonksiyon biçimi: Umami'nin varsayılan alanları (ekran, dil, alan adı)
        // korunur, yalnız adres/başlık/geliş temizlenmiş değerle ezilir.
        window.umami.track((props) => ({ ...props, url, referrer, title: document.title }));
    }, [pathname, search]);

    return null;
}
