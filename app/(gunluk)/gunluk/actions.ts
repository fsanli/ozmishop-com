'use server';

import { redirect } from 'next/navigation';
import { confirmNewsletter, subscribeNewsletter, unsubscribeNewsletter } from '@/lib/newsletter';
import { routes } from '@/lib/site';

/**
 * Bülten kaydı. Sonuç adrese yazılır (`?bulten=ok|hata`) — istemci bileşeni
 * gerekmiyor ve JavaScript kapalıyken de çalışıyor.
 *
 * `kaynak` alanı bloğun hangi sayfada olduğunu taşır; hepsi tek bir "gunluk"
 * kaynağına düşerse hangi yerleşimin işe yaradığı ölçülemez.
 */
export async function subscribeAction(formData: FormData) {
    const email = String(formData.get('email') ?? '').trim();
    const source = String(formData.get('kaynak') ?? 'gunluk');
    const back = String(formData.get('donus') ?? routes.journal);

    // JavaScript kapalıyken `required` çalışmaz: izin kutusu sunucuda da denetlenir.
    if (formData.get('izin') !== 'on') redirect(`${back}?bulten=izin`);
    try {
        await subscribeNewsletter(email, source);
    } catch {
        redirect(`${back}?bulten=hata`);
    }
    redirect(`${back}?bulten=ok`);
}

/**
 * Onay ve çıkış bir BUTONLA yapılır, bağlantıyı açmakla değil: e-posta
 * güvenlik tarayıcıları bağlantıları önceden açar (GET) ve kimse basmadan
 * kayıt onaylanmış ya da abonelik silinmiş olurdu.
 */
export async function confirmNewsletterAction(formData: FormData) {
    const token = String(formData.get('t') ?? '');
    try {
        await confirmNewsletter(token);
    } catch {
        redirect(`${routes.newsletterConfirm}?${new URLSearchParams({ t: token, durum: 'hata' })}`);
    }
    redirect(`${routes.newsletterConfirm}?durum=ok`);
}

export async function unsubscribeNewsletterAction(formData: FormData) {
    const token = String(formData.get('t') ?? '');
    try {
        await unsubscribeNewsletter(token);
    } catch {
        redirect(`${routes.newsletterLeave}?${new URLSearchParams({ t: token, durum: 'hata' })}`);
    }
    redirect(`${routes.newsletterLeave}?durum=ok`);
}
