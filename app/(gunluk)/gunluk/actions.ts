'use server';

import { redirect } from 'next/navigation';
import { subscribeNewsletter } from '@/lib/api';
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

    try {
        await subscribeNewsletter(email, source);
    } catch {
        redirect(`${back}?bulten=hata`);
    }
    redirect(`${back}?bulten=ok`);
}
