'use client';

import { CONSENT_COOKIE, GA_ID, parseConsent } from '../consent-format';

type GtagFn = (...args: unknown[]) => void;
declare global {
    interface Window {
        gtag?: GtagFn;
        dataLayer?: unknown[];
    }
}

/** Ekip içi ziyaret: `/?_ic=1` ile açılınca işaretlenir, GA4'te "internal" filtrelenir. */
const INTERNAL_KEY = 'ozmi_ic';

function analyticsAllowed(): boolean {
    if (!GA_ID || typeof document === 'undefined') return false;
    const raw = document.cookie.split('; ').find((part) => part.startsWith(`${CONSENT_COOKIE}=`))?.slice(CONSENT_COOKIE.length + 1);
    return parseConsent(raw ? decodeURIComponent(raw) : '').analytics;
}

/**
 * GA4 olayı. GA tanımlı değilse, analitik izni yoksa ya da gtag.js henüz
 * yüklenmediyse HİÇBİR ŞEY yapmaz — sessiz, hata vermez.
 *
 * Olay ancak işlem BAŞARILI olduktan sonra çağrılır (sepete ekleme API'den
 * döndükten sonra); tıklama niyeti başarı diye kaydedilmez. `purchase` ve
 * `refund` burada YOK: sunucudan gider (API, D15).
 */
export function track(name: string, params: Record<string, unknown> = {}): void {
    if (!analyticsAllowed() || typeof window.gtag !== 'function') return;
    const internal = window.localStorage?.getItem(INTERNAL_KEY) === '1';
    window.gtag('event', name, { ...params, ...(internal ? { traffic_type: 'internal' } : {}) });
}

/** `/?_ic=1` → bu tarayıcı ekip içi sayılır; `/?_ic=0` kaldırır. */
export function rememberInternalTraffic(search: string): void {
    const flag = new URLSearchParams(search).get('_ic');
    if (flag === '1') window.localStorage?.setItem(INTERNAL_KEY, '1');
    if (flag === '0') window.localStorage?.removeItem(INTERNAL_KEY);
}

export function isInternal(): boolean {
    return typeof window !== 'undefined' && window.localStorage?.getItem(INTERNAL_KEY) === '1';
}
