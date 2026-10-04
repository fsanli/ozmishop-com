import 'server-only';
import { headers } from 'next/headers';

/**
 * API'ye giden İSTEK ZAMANLI çağrıların proxy başlıkları.
 *
 * API `x-forwarded-for` başlığını yalnızca `x-bff-secret` doğru olduğunda
 * dikkate alır (bkz. ozmishop-api/server/plugins/rate-limit.js). Anahtar yoksa
 * başlık gönderilmez ve hız sınırı tüm müşterileri tek kovaya toplar — yani
 * tek kötü niyetli ziyaretçi herkesi kilitleyebilir. Üretimde iki depoda da
 * TRUSTED_PROXY_SECRET aynı değerde tanımlı olmalı.
 *
 * ÖNBELLEKLİ okumalarda (lib/api.ts) kullanılmaz: `headers()` okumak o
 * fonksiyonları isteğin arkasına takar, üstelik paylaşılan bir katalog
 * cevabında kişi başına sınır zaten anlamsız.
 */
const SECRET = process.env.TRUSTED_PROXY_SECRET || '';

export async function proxyHeaders(): Promise<Record<string, string>> {
    if (!SECRET) return {};

    const incoming = await headers();
    const forwarded = incoming.get('x-forwarded-for')?.split(',')[0].trim()
        || incoming.get('x-real-ip')
        || '';

    // Tarayıcı bilgisi ayrı başlıkla: API bunu onay kaydına (KVKK/sözleşme
    // kanıtı) yazıyor ve yalnız anahtarlı çağrıcıdan kabul ediyor.
    const userAgent = incoming.get('user-agent')?.slice(0, 400);
    return {
        'x-bff-secret': SECRET,
        ...(forwarded ? { 'x-forwarded-for': forwarded } : {}),
        ...(userAgent ? { 'x-client-user-agent': userAgent } : {}),
    };
}
