/**
 * TÜRKİYE CEP TELEFONU — biçim ve doğrulama, TEK kaynak.
 *
 * Dört yerde kullanılıyor (kayıt, ödeme, adres, hesap güvenliği) ve hepsi aynı
 * kuralı uygulamalı. Daha önemlisi: aynı kural HEM istemcide (maske) HEM
 * sunucuda (aksiyon doğrulaması) geçerli olmalı — JavaScript kapalıyken form
 * yine gönderilebiliyor ve o yol da denetlenmeli.
 *
 * Her şey TEK bir normalleştirmeden türer (`toLocal`). Biçimlendirme ve
 * doğrulama ayrı ayrı rakam sayarsa tutarsız olurlar: "5551112233" yazan biri
 * maskede tam numara görüp "1 hane eksik" uyarısı alırdı.
 */

export const PHONE_PLACEHOLDER = '0(5__) ___ __ __';
export const PHONE_DIGITS = 11;

/**
 * Girdiyi yerel 11 haneli biçime indirger: `05551112233`.
 *
 * Kabul ettikleri — hepsi müşterilerin gerçekten yazdığı biçimler:
 *   +90 555 111 22 33 · 90 555 111 22 33 · 0555 111 22 33 · 555 111 22 33
 * Ülke kodu SOYULUR: soymazsak "+90…" yapıştıran kullanıcı maskede
 * "0(905) 551 11 22" görür ve numarası sessizce bozulur.
 */
export function toLocal(value: string): string {
    let d = String(value ?? '').replace(/\D/g, '');
    if (d.startsWith('90') && d.length > 10) d = d.slice(2);
    if (d.startsWith('0')) d = d.slice(1);
    return d ? `0${d.slice(0, PHONE_DIGITS - 1)}` : '';
}

/** Görünen biçim: 0(555) 111 22 33 — yarım girdide de kırılmaz. */
export function formatPhone(value: string): string {
    const local = toLocal(value);
    if (!local) return '';

    const rest = local.slice(1);
    const [a, b, c, e] = [rest.slice(0, 3), rest.slice(3, 6), rest.slice(6, 8), rest.slice(8, 10)];

    let out = '0';
    if (a) out += `(${a}`;
    if (a.length === 3) out += ')';
    if (b) out += ` ${b}`;
    if (c) out += ` ${c}`;
    if (e) out += ` ${e}`;
    return out;
}

/** Sunucuya ve API'ye giden hâli. */
export const normalisePhone = (value: string): string => toLocal(value);

/**
 * Doğrulama mesajı; geçerliyse `null`.
 *
 * "Bazı müşteriler telefonunu yanlış yazıyor" sorununun ucuz ve etkili
 * kontrolü: uzunluk VE operatör öneki. Türkiye'de her cep numarası 05 ile
 * başlar; 0212 gibi bir sabit hat yazan müşteriye SMS/WhatsApp ulaşmaz ve
 * bunu sipariş sonrası öğrenmek geç olur.
 */
export function phoneError(value: string): string | null {
    const local = toLocal(value);
    if (!local) return 'Telefon numarası gerekli.';
    if (local.length < PHONE_DIGITS) {
        const missing = PHONE_DIGITS - local.length;
        return `Numara eksik — ${missing} hane daha girin.`;
    }
    if (!local.startsWith('05')) return 'Cep telefonu 05 ile başlamalı (örn. 0532…).';
    return null;
}
