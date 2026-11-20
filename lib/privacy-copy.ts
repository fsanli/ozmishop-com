import { fillSettings } from './settings-text';
import type { SiteSettings } from './types';

/**
 * PAKETLEME VE KART EKSTRESİ — tek kaynak (canlıya geçiş S10).
 *
 * Ürün sayfası, sepet, ödeme, rehber sonucu, hesap ekranları ve anasayfa güven
 * şeridi bu iki cümleyi buradan alır; bileşenlerde ayrı ayrı "kutu düz
 * kahverengi", "ekstrede yalnızca şirket unvanı" gibi farklı iddialar kalmasın.
 *
 * Metinler panelden (`/ayarlar` › Gizlilik) düzenlenebilir; boşsa aşağıdaki
 * onaylı varsayılan kullanılır. Gerçekler (Ozan, 14 Kasım 2026): koruyucu
 * ambalaj + gri kargo poşeti, etikette gönderici ve alıcının teslimat bilgisi,
 * ürün/içerik bilgisi yok. Banka ekstresindeki açıklama DOĞRULANMADI: hiçbir
 * bankada "yalnız şu ad görünür" sözü verilmez. Gönderici adı ile ekstre adı
 * ayrı şeylerdir — `gizlilik.notr_ekstre_adi` burada KULLANILMAZ.
 */

const SENDER_TOKEN = '{{gizlilik.gonderici_adi}}';

export const DEFAULT_PACKAGING_TEXT = 'Siparişiniz koruyucu ambalaj ve kargo poşetiyle gönderilir. Dış ambalajda ürün bilgisi '
    + `bulunmaz. Etikette gönderici ${SENDER_TOKEN} ve alıcının teslimat bilgileri yer alır.`;

export const DEFAULT_STATEMENT_TEXT = 'Ekstredeki işlem açıklaması bankanıza ve ödeme kuruluşuna göre değişebilir.';

/** Dar alanlar (sepet satırı, ödeme maddesi, ürün güven satırı) için aynı gerçeğin kısa hâli. */
export const PACKAGING_SHORT = 'Dış ambalajda ürün bilgisi bulunmaz.';

/** Tam paketleme metni; gönderici adı ayardan. Ad boşsa cümle adsız kurulur, boşluk kalmaz. */
export function packagingText(settings: SiteSettings): string {
    const template = String(settings['gizlilik.paketleme_metni'] ?? '').trim() || DEFAULT_PACKAGING_TEXT;
    const sender = String(settings['gizlilik.gonderici_adi'] ?? '').trim();
    const named = sender ? template : template.replace(/gönderici\s*\{\{\s*gizlilik\.gonderici_adi\s*\}\}/gi, 'gönderici adı');
    return fillSettings(named, settings);
}

export function statementText(settings: SiteSettings): string {
    return String(settings['gizlilik.ekstre_metni'] ?? '').trim() || DEFAULT_STATEMENT_TEXT;
}
