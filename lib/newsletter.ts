import 'server-only';
import { proxyHeaders } from './bff';

const API_BASE = (process.env.API_BASE_URL || 'http://localhost:4200').replace(/\/$/, '');

/**
 * Bülten uçları. `lib/api.ts`'ten AYRI ve yalnız sunucuda: istekler müşterinin
 * gerçek IP'siyle (`proxyHeaders`) gitmeli. Aksi halde hepsi BFF'nin IP'sinden
 * geliyor ve bülten ucunun "dakikada 5" sınırı TÜM ziyaretçileri tek kovaya
 * topluyordu; izin kanıtına da yanlış IP yazılırdı.
 */
async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(await proxyHeaders()) },
        body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || 'İşlem tamamlanamadı');
    return result as T;
}

/** Çift onay: kayıt BEKLEMEDE açılır, onay e-postası gider. */
export const subscribeNewsletter = (email: string, source: string) =>
    post<{ status: string }>('/newsletter', { email, source, consent: true });

export const confirmNewsletter = (token: string) => post<{ ok: true }>('/newsletter/confirm', { token });

export const unsubscribeNewsletter = (token: string) => post<{ ok: true }>('/newsletter/unsubscribe', { token });
