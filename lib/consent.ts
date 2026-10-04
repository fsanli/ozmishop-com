/**
 * Çerez tercihi — İSTEMCİ tarafında okunur/yazılır.
 *
 * Yerleşimler çerez OKUMAZ (okusa statik kabuk kaybolur, bkz. AGENTS.md);
 * tercih yalnız tarayıcıda `useSyncExternalStore` ile izlenir. Sunucu anlık
 * görüntüsü "karar verilmedi + kapalı": üçüncü parti betik sunucuda hiç basılmaz.
 *
 * Kategoriler:
 *   zorunlu    — oturum, sepet, bu tercih, 18+ beyanı. Kapatılamaz.
 *   islevsel   — canlı destek (tawk.to). Onaysız YÜKLENMEZ.
 *   analitik   — şu an yok; eklenirse sürüm artırılır ve onay yeniden istenir.
 */
export const CONSENT_COOKIE = 'ozmi_cerez';
/** Kategori eklenince artırılır: eski onaylı ziyaretçiye bant yeniden çıkar. */
export const CONSENT_VERSION = 1;
const MAX_AGE = 180 * 86400;
export const PREFERENCES_EVENT = 'ozmi:cerez-tercihleri';

export interface ConsentState {
    decided: boolean;
    functional: boolean;
    analytics: boolean;
}

const UNDECIDED: ConsentState = { decided: false, functional: false, analytics: false };

let cached: { raw: string; state: ConsentState } | null = null;
let listeners: (() => void)[] = [];

const parse = (raw: string): ConsentState => {
    const params = new URLSearchParams(raw);
    if (Number(params.get('v')) < CONSENT_VERSION) return UNDECIDED;
    return { decided: true, functional: params.get('islevsel') === '1', analytics: params.get('analitik') === '1' };
};

/** Aynı çerez metni için AYNI nesne: useSyncExternalStore her okumada yeni nesne görürse döngüye girer. */
export const readConsent = (): ConsentState => {
    if (typeof document === 'undefined') return UNDECIDED;
    const raw = document.cookie.split('; ').find((part) => part.startsWith(`${CONSENT_COOKIE}=`))?.slice(CONSENT_COOKIE.length + 1) ?? '';
    const decoded = decodeURIComponent(raw);
    if (cached?.raw === decoded) return cached.state;
    cached = { raw: decoded, state: decoded ? parse(decoded) : UNDECIDED };
    return cached.state;
};

export const serverConsent = (): ConsentState => UNDECIDED;

export const subscribeConsent = (callback: () => void) => {
    listeners.push(callback);
    return () => { listeners = listeners.filter((item) => item !== callback); };
};

export const writeConsent = ({ functional, analytics }: { functional: boolean; analytics: boolean }) => {
    const previous = readConsent();
    const value = new URLSearchParams({
        v: String(CONSENT_VERSION), islevsel: functional ? '1' : '0', analitik: analytics ? '1' : '0', t: String(Math.floor(Date.now() / 1000)),
    }).toString();
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(value)}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
    listeners.forEach((listener) => listener());
    // Verilmiş bir izin GERİ ALINDIYSA yüklenmiş üçüncü parti betiği sökmenin
    // güvenilir yolu sayfayı yenilemek.
    if ((previous.functional && !functional) || (previous.analytics && !analytics)) window.location.reload();
};

/** Footer'daki "Çerez tercihleri" bağlantısı: bandı ayar görünümüyle açar. */
export const openConsentPreferences = () => window.dispatchEvent(new Event(PREFERENCES_EVENT));
