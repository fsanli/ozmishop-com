'use server';

import { redirect } from 'next/navigation';
import { getMyAddresses, saveAddress } from '@/lib/account';
import { normalisePhone, phoneError } from '@/lib/phone';
import { placeOrder } from '@/lib/cart';
import { getCurrentCustomer } from '@/lib/session';
import { routes } from '@/lib/site';

export interface CheckoutState {
    error: string | null;
    /**
     * Gönderilen metin alanları. Hata dönünce React formu sıfırlıyor; form bu
     * değerleri varsayılan olarak kullanır ve kullanıcı yazdıklarını kaybetmez.
     */
    values?: Record<string, string>;
}

/** Formdaki yıldızlarla AYNI liste: JavaScript kapalıyken `required` çalışmaz. */
const REQUIRED_ADDRESS: [string, string][] = [
    ['firstname', 'Ad'], ['lastname', 'Soyad'], ['city', 'İl'], ['district', 'İlçe'], ['addressLine', 'Açık adres'],
];

/**
 * Siparişi tamamlar.
 *
 * Kart bilgisi BU AKIŞTAN GEÇMEZ: sağlayıcı kendi 3DS sayfasında toplar. Burada
 * yalnızca iletişim, adres, kargo ve yöntem var.
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
        });
    } catch (error) {
        return fail((error as Error).message);
    }

    // Yeni yazılan adres istenirse hesaba kaydedilir. Sipariş ZATEN oluştu:
    // kayıt başarısız olursa müşteriye hata gösterilmez, sipariş akışı sürer.
    if (!savedId && formData.get('saveAddress') === 'on' && await getCurrentCustomer()) {
        try {
            // İlk kayıtlı adres varsayılan olur: bir sonraki ödemede dolu gelsin.
            const { items } = await getMyAddresses();
            await saveAddress(null, { ...shippingAddress, isDefaultShipping: items.length === 0 });
        } catch {
            // Bilerek yutulur — bkz. yukarı.
        }
    }

    // Kart ödemesinde sağlayıcı 3DS sayfasına yönlendirir; havalede doğrudan onaya.
    if (result.redirectUrl) redirect(result.redirectUrl);
    redirect(`${routes.order(result.orderNumber)}?e=${encodeURIComponent(value('email'))}`);
}
