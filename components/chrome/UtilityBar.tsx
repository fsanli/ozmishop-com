import Container from '@/components/Container';
import { getSettings } from '@/lib/api';
import PanicExit from './PanicExit';

/**
 * Header'ın üstündeki koyu şerit: sözler + hızlı çıkış. "3D Secure" yalnız
 * kartla ödeme gerçekten açıkken yazılır — açık olmayan bir yöntemi vaat
 * etmek yok. Ayarlar önbellekten; şerit statik kabukta kalır.
 */
export default async function UtilityBar() {
    const settings = await getSettings();
    // Kargo sözü API'de ayarlardan kurulur; kesim saati girilmemişse "aynı gün" yazmaz.
    const shippingPromise = settings['kargo.vaat']?.trim();
    const promises = [
        { label: 'Gizli paketleme', dot: 'bg-on-dark-berry' },
        ...(shippingPromise ? [{ label: shippingPromise, dot: 'bg-on-dark-amber' }] : []),
        ...(settings['odeme.kart_kullanilabilir'] !== false ? [{ label: '3D Secure ödeme', dot: 'bg-on-dark-teal' }] : []),
    ];

    return (
        <div className="bg-ink-block text-on-dark">
            <Container className="flex min-h-10 flex-wrap items-center gap-x-5 gap-y-1 py-1.5 text-[12px]">
                {promises.map((promise) => (
                    <span key={promise.label} className="inline-flex items-center gap-2">
                        <span className={`dot ${promise.dot}`} />
                        {promise.label}
                    </span>
                ))}
                <PanicExit className="ml-auto" />
            </Container>
        </div>
    );
}
