import { cleanUrl, cleanUtm } from './sanitize';

/**
 * Kampanya kaynağı (D16). Çerez `ozmi_kaynak`, 30 gün, YALNIZ analitik izni
 * varken yazılır (AnalyticsLoader içinde çalışır) ve izin geri alınınca
 * silinir (lib/consent.ts). İzin vermeyen ziyaretçinin siparişinde kaynak yok.
 *
 *   f  ilk temas — süre dolana kadar değişmez
 *   l  son temas — yeni kampanya bağlantısı ya da dış yönlendirmede güncellenir
 *
 * Next import'u YOK: düz Node testi doğrudan alır.
 */
export const ATTRIBUTION_COOKIE = 'ozmi_kaynak';
export const ATTRIBUTION_MAX_AGE = 30 * 86400;

export interface Touch {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
    /** Giriş sayfası (temizlenmiş yol, parametresiz). */
    landing?: string;
    /** Yönlendiren sitenin YALNIZ alan adı. */
    referrer?: string;
    /** Unix saniye. */
    at: number;
}

export interface Attribution {
    f?: Touch;
    l?: Touch;
}

/** Kendi sitemiz ve ödeme sağlayıcısı dönüşü kaynak sayılmaz (kartla ödeyen herkes "paytr" olurdu). */
const IGNORED_REFERRERS = /(^|\.)(ozmishop\.com|paytr\.com)$/;

/**
 * Bu sayfa açılışından bir temas çıkar mı? UTM varsa kampanya; yoksa dış bir
 * siteden gelindiyse yönlendirme. İç gezinme ve doğrudan giriş temas değildir.
 */
export function touchFrom(href: string, referrer: string, ownHost: string, now = Math.floor(Date.now() / 1000)): Touch | null {
    let url: URL;
    try {
        url = new URL(href);
    } catch {
        return null;
    }
    const param = (name: string) => url.searchParams.get(name);
    const landing = new URL(cleanUrl(href) || href).pathname;
    if (param('utm_source') || param('utm_medium') || param('utm_campaign')) {
        return {
            source: cleanUtm(param('utm_source'), { lower: true }),
            medium: cleanUtm(param('utm_medium'), { lower: true }),
            campaign: cleanUtm(param('utm_campaign')),
            term: cleanUtm(param('utm_term')),
            content: cleanUtm(param('utm_content')),
            landing,
            at: now,
        };
    }
    let host = '';
    try {
        host = referrer ? new URL(referrer).hostname.toLowerCase() : '';
    } catch {
        host = '';
    }
    if (!host || host === ownHost || IGNORED_REFERRERS.test(host)) return null;
    return { source: host, medium: 'referral', referrer: host, landing, at: now };
}

export function mergeTouch(current: Attribution, touch: Touch | null): Attribution {
    if (!touch) return current;
    return { f: current.f ?? touch, l: touch };
}

export function parseAttribution(raw: string | undefined | null): Attribution {
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? { f: parsed.f, l: parsed.l } : {};
    } catch {
        return {};
    }
}

/**
 * GA istemci ve oturum kimliği — sunucudan giden satın alma (D15) tarayıcı
 * oturumuna bağlansın. `_ga`: GA1.1.<rastgele>.<zaman>; `_ga_<ID>`: GS1.1.<oturum>…
 * ya da GS2.1.s<oturum>$… Yalnız analitik izni varken okunur.
 */
export function gaIdsFrom(cookies: Record<string, string | undefined>, measurementId: string): { clientId?: string; sessionId?: string } {
    const clientId = /^GA\d\.\d\.(\d+\.\d+)$/.exec(cookies._ga ?? '')?.[1];
    const sessionCookie = cookies[`_ga_${measurementId.replace(/^G-/, '')}`] ?? '';
    const sessionId = /^GS1\.\d\.(\d+)\./.exec(sessionCookie)?.[1] ?? /^GS2\.\d\.s(\d+)/.exec(sessionCookie)?.[1];
    return { ...(clientId ? { clientId } : {}), ...(sessionId ? { sessionId } : {}) };
}
