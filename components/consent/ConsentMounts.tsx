import AgeGate from '@/components/AgeGate';
import { getLegalStatus, getSettings } from '@/lib/api';
import { routes } from '@/lib/site';
import CookieBanner from './CookieBanner';

/**
 * Kök yerleşimin yaş kapısı ve çerez bandı. Ayar ve belge adresleri ÖNBELLEKTEN
 * (cookies/headers okunmaz → statik kabuk korunur). API'ye ulaşılamazsa
 * varsayılan metin ve adreslerle çizilir: kapı hiçbir durumda kaybolmamalı.
 */
export default async function ConsentMounts() {
    let text: string | null = null;
    let slugs: Record<string, string> = {};
    try {
        const [settings, legal] = await Promise.all([getSettings(), getLegalStatus()]);
        text = settings['magaza.yas_kapisi_metni'] ?? null;
        slugs = Object.fromEntries(legal.documents.map((doc) => [doc.key, doc.slug]));
    } catch {
        // Varsayılanlarla devam.
    }
    const privacyHref = routes.page(slugs.gizlilik ?? 'gizlilik-politikasi');
    const cookieHref = routes.page(slugs.cerez ?? 'cerez-politikasi');
    return (
        <>
            <AgeGate text={text} privacyHref={privacyHref} cookieHref={cookieHref} />
            <CookieBanner policyHref={cookieHref} />
        </>
    );
}
