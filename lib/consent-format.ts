/**
 * Çerez tercihinin BİÇİMİ — hem tarayıcı (lib/consent.ts) hem sunucu
 * aksiyonları (ödeme, sepet olayları) aynı ayrıştırıcıyı kullanır. Tek kaynak:
 * sunucu "izin var" derken tarayıcı "yok" diyemez.
 *
 * Kategoriler:
 *   zorunlu   — oturum, sepet, bu tercih, 18+ beyanı. Kapatılamaz.
 *   islevsel  — canlı destek (tawk.to). Onaysız YÜKLENMEZ.
 *   analitik  — Google Analytics 4. YALNIZ `NEXT_PUBLIC_GA_ID` tanımlıysa
 *               sorulur; tanımlı değilken var olmayan bir şeye izin istenmez.
 */
export const CONSENT_COOKIE = 'ozmi_cerez';

/** GA4 ölçüm kimliği derlemeye gömülür; boşsa hiçbir analitik kod yüklenmez. */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';
export const ANALYTICS_ENABLED = Boolean(GA_ID);

/**
 * Analitik açılınca sürüm 2: v1 onayı analitiği KAPSAMAZ, bant yeniden çıkar.
 * Eski onay hiçbir zaman yeni bir amaca otomatik genişletilmez.
 */
export const CONSENT_VERSION = ANALYTICS_ENABLED ? 2 : 1;

export interface ConsentState {
    decided: boolean;
    functional: boolean;
    analytics: boolean;
}

export const UNDECIDED: ConsentState = { decided: false, functional: false, analytics: false };

export function parseConsent(raw: string | undefined | null): ConsentState {
    if (!raw) return UNDECIDED;
    const params = new URLSearchParams(raw);
    const functional = params.get('islevsel') === '1';
    // Eski sürüm: karar yeniden sorulur. İşlevsel izin (canlı destek) aynı
    // amaç için verildiği için korunur; analitik ASLA eski onaydan türetilmez.
    // `!(v >= …)`: sürümü bozuk çerezde Number() NaN döner ve `NaN < 2` false
    // olduğu için eski kontrol atlanıp karar "verilmiş" sayılıyordu.
    if (!(Number(params.get('v')) >= CONSENT_VERSION)) return { decided: false, functional, analytics: false };
    return { decided: true, functional, analytics: ANALYTICS_ENABLED && params.get('analitik') === '1' };
}
