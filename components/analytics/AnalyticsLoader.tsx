'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import { GA_ID } from '@/lib/consent-format';
import { readConsent, serverConsent, subscribeConsent } from '@/lib/consent';
import { isInternal, rememberInternalTraffic, track } from '@/lib/analytics/gtag';
import {
    ATTRIBUTION_COOKIE, ATTRIBUTION_MAX_AGE, mergeTouch, parseAttribution, touchFrom,
} from '@/lib/analytics/attribution';
import { listItemFor } from '@/lib/analytics/lists';
import { cleanUrl } from '@/lib/analytics/sanitize';

/**
 * Google Analytics 4 — YALNIZ analitik izni varsa ve `NEXT_PUBLIC_GA_ID`
 * tanımlıysa yüklenir. İzin yoksa gtag.js hiç indirilmez: çerez yok, istek yok
 * (Consent Mode'un "temel" uygulaması). GTM kullanılmıyor: her etiket kod
 * incelemesinden geçsin, izin bağlantısı panelden atlanamasın.
 *
 * Reklam sinyalleri KAPALI (`ad_*: denied`, Google Signals kapalı): reklam
 * kategorisi yok, yetişkin ürün için kişiselleştirilmiş reklam varsayılan değil.
 */
export default function AnalyticsLoader() {
    const consent = useSyncExternalStore(subscribeConsent, readConsent, serverConsent);
    if (!GA_ID || !consent.analytics) return null;

    return (
        <>
            <Script id="ga-init" strategy="afterInteractive">
                {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});
gtag('js',new Date());`}
            </Script>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <PageViews />
            <SelectItemListener />
            <AttributionCapture />
        </>
    );
}

/** Son gönderilen (temizlenmiş) adres: StrictMode'un çift effect'i ve aynı adrese dönüş tek sayılır. */
let lastLocation = '';
let configured = false;

/**
 * Sayfa görüntüleme — App Router'da gezinme tam sayfa yüklemesi değil.
 * `page_location` TEMİZLENMİŞ adresle ezilir ve sonraki her olaya da o gider:
 * GA4 ham adresi kendisi eklerdi (eski e-posta bağlantısı `?e=`, jetonlar).
 *
 * GA4 yönetiminde Enhanced Measurement › "Tarayıcı geçmişi olaylarına göre
 * sayfa değişiklikleri" KAPALI olmalı; yoksa her gezinme iki kez sayılır.
 */
function PageViews() {
    const pathname = usePathname();
    const search = useSearchParams().toString();

    useEffect(() => {
        if (typeof window.gtag !== 'function') return;
        rememberInternalTraffic(window.location.search);
        const location = cleanUrl(window.location.href);
        if (!location || location === lastLocation) return;
        const referrer = lastLocation || cleanUrl(document.referrer);
        window.gtag('set', { page_location: location, page_referrer: referrer });
        if (!configured) {
            window.gtag('config', GA_ID, {
                send_page_view: false,
                allow_google_signals: false,
                allow_ad_personalization_signals: false,
                ...(process.env.NEXT_PUBLIC_GA_DEBUG === '1' ? { debug_mode: true } : {}),
            });
            configured = true;
        }
        window.gtag('event', 'page_view', {
            page_location: location,
            page_referrer: referrer,
            page_title: document.title,
            ...(isInternal() ? { traffic_type: 'internal' } : {}),
        });
        lastLocation = location;
    }, [pathname, search]);

    return null;
}

/**
 * Tek delegeli tıklama dinleyicisi (sunucu bileşenlerindeki bağlantılar için):
 *   `select_item`     listedeki bir ürüne tıklama; öğe ItemListTracker kaydından.
 *   `whatsapp_click`  `data-ga-whatsapp` işaretli bağlantı (destek balonu).
 */
function SelectItemListener() {
    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            const target = event.target as Element | null;
            const whatsapp = target?.closest?.('[data-ga-whatsapp]');
            if (whatsapp) {
                track('whatsapp_click', { placement: whatsapp.getAttribute('data-ga-whatsapp') });
                return;
            }
            const link = target?.closest?.('a[href^="/urun/"]');
            if (!link) return;
            const slug = link.getAttribute('href')!.slice('/urun/'.length).split(/[?#]/)[0];
            const item = listItemFor(slug);
            if (item) track('select_item', { item_list_id: item.item_list_id, item_list_name: item.item_list_name, items: [item] });
        };
        document.addEventListener('click', onClick, { capture: true });
        return () => document.removeEventListener('click', onClick, { capture: true });
    }, []);
    return null;
}

/**
 * Kampanya kaynağı: yalnız sayfa İLK açıldığında bakılır (iç gezinme temas
 * değil). Bu bileşen AnalyticsLoader'ın içinde: analitik izni yoksa hiç
 * çalışmaz, çerez yazılmaz.
 */
function AttributionCapture() {
    useEffect(() => {
        const touch = touchFrom(window.location.href, document.referrer, window.location.hostname);
        if (!touch) return;
        const raw = document.cookie.split('; ').find((part) => part.startsWith(`${ATTRIBUTION_COOKIE}=`))?.slice(ATTRIBUTION_COOKIE.length + 1);
        const next = mergeTouch(parseAttribution(raw ? decodeURIComponent(raw) : ''), touch);
        const secure = window.location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `${ATTRIBUTION_COOKIE}=${encodeURIComponent(JSON.stringify(next))}; Max-Age=${ATTRIBUTION_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
    }, []);
    return null;
}
