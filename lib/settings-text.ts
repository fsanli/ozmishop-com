import type { SiteSettings } from './types';

/**
 * Panelden yazılan kısa metinlerde (güven şeridi gibi) ayar değişkenleri:
 * `{{kargo.vaat}}`, `{{kargo.sureler}}`, `{{icerik.iade_suresi_gun}}` …
 * Değer ayarlardan gelir; kargo cümlesi API'de kurulur (`kargo.*` hesaplanmış
 * anahtarları). Bilinmeyen ya da boş değişken BOŞ basılır — çağıran, boş kalan
 * kalemi göstermemeyi seçer.
 */
export function fillSettings(text: string, settings: SiteSettings): string {
    const values = settings as Record<string, unknown>;
    return text.replace(/\{\{\s*([a-z0-9_.]+)\s*\}\}/gi, (_, key: string) => {
        const value = values[key];
        return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
    }).trim();
}
