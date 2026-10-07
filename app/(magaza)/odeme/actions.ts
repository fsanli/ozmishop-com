'use server';

import { after } from 'next/server';
import { redirect, RedirectType } from 'next/navigation';
import { getMyAddresses, saveAddress } from '@/lib/account';
import { normalisePhone, phoneError } from '@/lib/phone';
import { orderAttribution } from '@/lib/analytics/server';
import {
    finishAttempt, getAttempt, isAttemptId, placeOrder, sendAttemptEvent,
} from '@/lib/cart';
import { getCurrentCustomer } from '@/lib/session';
import { routes } from '@/lib/site';

export interface CheckoutState {
    error: string | null;
    /**
     * Gönderilen metin alanları. Hata dönünce React formu sıfırlıyor; form bu
     * değerleri varsayılan olarak kullanır ve kullanıcı yazdıklarını kaybetmez.
     */
    values?: Record<string, string>;
    /**
     * Yeni tekrar anahtarı. API'ye ulaşıp başarısız olan gönderimden sonra
     * anahtar DEĞİŞMELİ: aynı anahtar API'de aynı (başarısız) denemeyi döndürür
     * ve müşteri bir daha deneyemez.
     */
    idempotencyKey?: string;
}

/** Tekrar anahtarı biçimi (API ile aynı); bozuk değer gönderilmez, API 400 verirdi. */
const IDEMPOTENCY_KEY = /^[A-Za-z0-9-]{8,80}$/;

/** Formdaki yıldızlarla AYNI liste: JavaScript kapalıyken `required` çalışmaz. */
const REQUIRED_ADDRESS: [string, string][] = [
    ['firstname', 'Ad'], ['lastname', 'Soyad'], ['city', 'İl'], ['district', 'İlçe'], ['addressLine', 'Açık adres'],
];

/**
 * Siparişi tamamlar.
 *
 * Kart bilgisi BU AKIŞTAN GEÇMEZ: PayTR kendi iframe'inde toplar. Burada
 * yalnızca iletişim, adres, kargo ve yöntem var. Kartta sipariş burada AÇILMAZ:
 * bir ödeme denemesi açılır ve müşteri iframe sayfasına geçer; sipariş ancak
 * PayTR'nin sunucu bildirimiyle oluşur. Başarısızlıkta sepet olduğu gibi kalır.
 *
 * `useActionState` ile çağrılır — sitedeki tek yer. Alan bazlı hatayı formda
 * göstermek için istemci durumu gerekiyor; diğer formlar `?hata=` ile idare
 * ediyor ama ödeme formunda girilen onca alanı kaybettirmek olmaz.
 */
export async function placeOrderAction(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
    const value = (name: string) => String(formData.get(name) ?? '').trim();
    const values = Object.fromEntries(
        [...formData.entries()].filter(([, entry]) => typeof entry === 'string').map(([key, entry]) => [key, String(entry)]),
    );
    const fail = (error: string): CheckoutState => ({ error, values });
    // API'ye ulaşmış bir başarısızlık: sonraki gönderim YENİ deneme açmalı.
    const failAndRotate = (error: string): CheckoutState => ({ error, values, idempotencyKey: crypto.randomUUID() });

    // Yanlış telefon siparişten SONRA fark edilir ve kargo ulaşmaz; sunucuda
    // da kontrol ediliyor çünkü maske JavaScript kapalıyken çalışmaz.
    const phoneInvalid = phoneError(value('phone'));
    if (phoneInvalid) return fail(phoneInvalid);

    // İki belge AYRI AYRI onaylanmalı. Prod'da API Joi ayrıntısını döndürmüyor;
    // anlaşılır Türkçe mesaj burada üretilir.
    if (formData.get('onBilgilendirme') !== 'on' || formData.get('mesafeliSatis') !== 'on') {
        return fail('Siparişi tamamlamak için ön bilgilendirme formunu ve mesafeli satış sözleşmesini onaylaman gerekiyor.');
    }
    const phone = normalisePhone(value('phone'));

    const addressFrom = (prefix: '' | 'billing') => {
        const key = (base: string) => (prefix ? `${prefix}${base[0].toUpperCase()}${base.slice(1)}` : base);
        return {
            firstname: value(key('firstname')),
            lastname: value(key('lastname')),
            phone,
            city: value(key('city')),
            district: value(key('district')),
            neighbourhood: value(key('neighbourhood')) || null,
            addressLine: value(key('addressLine')),
            postalCode: value(key('postalCode')) || null,
        };
    };
    const missingIn = (address: Record<string, unknown>, label: string) => {
        const missing = REQUIRED_ADDRESS.filter(([name]) => !address[name]).map(([, title]) => title);
        return missing.length ? `${label}: ${missing.join(', ')} zorunlu.` : null;
    };

    // Kayıtlı adres KİMLİKTEN okunur; formdaki gizli alanlara güvenilmez.
    const savedId = Number(value('addressId')) || null;
    let shippingAddress: ReturnType<typeof addressFrom>;
    if (savedId) {
        const { items } = await getMyAddresses();
        const saved = items.find((item) => item.id === savedId);
        if (!saved) return fail('Seçilen adres bulunamadı; sayfayı yenileyip yeniden seçin.');
        shippingAddress = {
            firstname: saved.firstname,
            lastname: saved.lastname,
            phone: saved.phone || phone,
            city: saved.city,
            district: saved.district,
            neighbourhood: saved.neighbourhood,
            addressLine: saved.addressLine,
            postalCode: saved.postalCode,
        };
    } else {
        shippingAddress = addressFrom('');
        const missing = missingIn(shippingAddress, 'Teslimat adresi');
        if (missing) return fail(missing);
    }

    // "Fatura adresim aynı" işaretliyse ayrı adres gönderilmez.
    const billingAddress = formData.get('billingSame') === 'on' ? null : addressFrom('billing');
    if (billingAddress) {
        const missing = missingIn(billingAddress, 'Fatura adresi');
        if (missing) return fail(missing);
    }

    const idempotencyKey = value('idempotencyKey');
    let result: Awaited<ReturnType<typeof placeOrder>>;
    try {
        result = await placeOrder({
            email: value('email'),
            phone,
            shippingAddress,
            billingAddress,
            shippingRateId: Number(formData.get('shippingRateId')),
            paymentMethod: value('paymentMethod') === 'transfer' ? 'transfer' : 'card',
            installment: Number(formData.get('installment') || 1),
            note: value('note') || null,
            legal: { preliminaryInfo: true, distanceSales: true },
            // Kampanya kaynağı ve GA kimliği — yalnız analitik izni varsa (D16, D15).
            attribution: await orderAttribution(),
        }, IDEMPOTENCY_KEY.test(idempotencyKey) ? idempotencyKey : undefined);
    } catch (error) {
        return failAndRotate((error as Error).message);
    }

    // Kart: deneme açıldı ama ödeme henüz yok. Başarısızlık formda gösterilir,
    // sepet ve girilen alanlar yerinde kalır.
    if (result.paymentMethod === 'card') {
        if (result.failure) return failAndRotate(result.failure.message);
        // Eski bir denemenin anahtarı (geri tuşuyla dönülmüş form).
        if (result.status === 'superseded') return failAndRotate('Ödeme oturumu yenilendi. Lütfen tekrar dene.');
        // Aynı anahtarla ilk istek hâlâ sürüyor: anahtar DEĞİŞMEZ ki yeniden
        // gönderim o denemeye bağlansın.
        if (result.status === 'created') return fail('Ödeme sayfası hazırlanıyor. Birkaç saniye sonra yeniden dene.');
    }

    // Yeni yazılan adres istenirse hesaba kaydedilir. Sipariş (ya da ödeme
    // denemesi) ZATEN oluştu: kayıt başarısız olursa müşteriye hata
    // gösterilmez, akış sürer.
    if (!savedId && formData.get('saveAddress') === 'on' && await getCurrentCustomer()) {
        try {
            // İlk kayıtlı adres varsayılan olur: bir sonraki ödemede dolu gelsin.
            const { items } = await getMyAddresses();
            await saveAddress(null, { ...shippingAddress, isDefaultShipping: items.length === 0 });
        } catch {
            // Bilerek yutulur — bkz. yukarı.
        }
    }

    // Kartta iframe sayfasına; havalede (ve sahte sağlayıcının anında onayında)
    // doğrudan sipariş sayfasına. Sipariş sayfası erişim jetonuyla açılır
    // (placeOrder çereze yazdı): e-posta adresi URL'ye, tarayıcı geçmişine ve
    // analitiğe girmez.
    if (result.paymentMethod === 'card' && result.status === 'token_ready') redirect(routes.cardPayment(result.attemptId));
    if (!result.orderNumber) return failAndRotate('Ödeme başlatılamadı. Lütfen tekrar dene.');
    redirect(routes.order(result.orderNumber));
}

/**
 * Kart denemesinin sonucunu yoklar (iframe sayfası ve "ödemen kontrol
 * ediliyor" ekranı). Sonuç belliyse YÖNLENDİRİR: başarıda sipariş çerezi
 * yazılıp sipariş sayfasına, başarısızlıkta hata mesajıyla ödeme formuna.
 * Tarayıcı dönüşü (`?r=ok`) sonuca karar vermez; karar API'deki deneme durumu.
 *
 * Jeton istemciye hiç verilmez; aksiyon çerezden okur. Başka denemenin
 * kimliği gönderilirse çerez eşleşmez ve `unknown` döner.
 */
export async function pollAttemptAction(attemptId: string): Promise<{ status: string }> {
    if (!isAttemptId(attemptId)) return { status: 'unknown' };
    const attempt = await getAttempt(attemptId);
    if (!attempt) return { status: 'unknown' };

    if (attempt.status === 'succeeded' && attempt.orderNumber) {
        await finishAttempt(attempt);
        redirect(routes.order(attempt.orderNumber), RedirectType.replace);
    }
    if (attempt.failure) redirect(routes.checkoutRetry(attemptId), RedirectType.replace);
    // Aynı sepetten daha yeni bir deneme açılmış: bu pencere artık geçersiz.
    if (attempt.status === 'superseded') redirect(routes.checkout, RedirectType.replace);
    return { status: attempt.status };
}

/** İframe ilk kez yüklendi — panelin "iframe açıldı mı" işareti. Yanıtı bekletmez. */
export async function markIframeLoadedAction(attemptId: string): Promise<void> {
    if (!isAttemptId(attemptId)) return;
    after(() => sendAttemptEvent(attemptId, 'iframe_loaded'));
}
