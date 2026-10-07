/**
 * Çerez tercihi — İSTEMCİ tarafında okunur/yazılır.
 *
 * Yerleşimler çerez OKUMAZ (okusa statik kabuk kaybolur, bkz. AGENTS.md);
 * tercih yalnız tarayıcıda `useSyncExternalStore` ile izlenir. Sunucu anlık
 * görüntüsü "karar verilmedi + kapalı": üçüncü parti betik sunucuda hiç basılmaz.
 *
 * Kategoriler ve sürüm kuralı: `lib/consent-format.ts`.
 */
import {
    ANALYTICS_ENABLED, CONSENT_COOKIE, CONSENT_VERSION, UNDECIDED, parseConsent, type ConsentState,
} from './consent-format';

export { ANALYTICS_ENABLED, CONSENT_COOKIE, CONSENT_VERSION, type ConsentState };

const MAX_AGE = 180 * 86400;
export const PREFERENCES_EVENT = 'ozmi:cerez-tercihleri';

let cached: { raw: string; state: ConsentState } | null = null;
let listeners: (() => void)[] = [];

/** Aynı çerez metni için AYNI nesne: useSyncExternalStore her okumada yeni nesne görürse döngüye girer. */
export const readConsent = (): ConsentState => {
    if (typeof document === 'undefined') return UNDECIDED;
    const raw = document.cookie.split('; ').find((part) => part.startsWith(`${CONSENT_COOKIE}=`))?.slice(CONSENT_COOKIE.length + 1) ?? '';
    const decoded = decodeURIComponent(raw);
    if (cached?.raw === decoded) return cached.state;
    cached = { raw: decoded, state: parseConsent(decoded) };
    return cached.state;
};

export const serverConsent = (): ConsentState => UNDECIDED;

export const subscribeConsent = (callback: () => void) => {
    listeners.push(callback);
    return () => { listeners = listeners.filter((item) => item !== callback); };
};

/** `_ga`, `_ga_<ID>` ve kampanya kaynağı çerezi; hem host'ta hem üst alan adında. */
function clearAnalyticsCookies() {
    const names = document.cookie.split('; ').map((part) => part.split('=')[0])
        .filter((name) => name === '_ga' || name.startsWith('_ga_') || name === 'ozmi_kaynak');
    const host = window.location.hostname;
    const domains = ['', host, `.${host.split('.').slice(-2).join('.')}`];
    names.forEach((name) => domains.forEach((domain) => {
        document.cookie = `${name}=; Max-Age=0; Path=/${domain ? `; Domain=${domain}` : ''}`;
    }));
}

export const writeConsent = ({ functional, analytics }: { functional: boolean; analytics: boolean }) => {
    const previous = readConsent();
    const value = new URLSearchParams({
        v: String(CONSENT_VERSION), islevsel: functional ? '1' : '0', analitik: analytics ? '1' : '0', t: String(Math.floor(Date.now() / 1000)),
    }).toString();
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(value)}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
    listeners.forEach((listener) => listener());
    // Analitik izni geri alındı: GA tanımlayıcıları ve kampanya kaynağı silinir.
    // Yalnız yeni betiği durdurmak yetmez; çerezler 2 yıl kalırdı.
    if (previous.analytics && !analytics) clearAnalyticsCookies();
    // Verilmiş bir izin GERİ ALINDIYSA yüklenmiş üçüncü parti betiği sökmenin
    // güvenilir yolu sayfayı yenilemek.
    if ((previous.functional && !functional) || (previous.analytics && !analytics)) window.location.reload();
};

/** Footer'daki "Çerez tercihleri" bağlantısı: bandı ayar görünümüyle açar. */
export const openConsentPreferences = () => window.dispatchEvent(new Event(PREFERENCES_EVENT));
