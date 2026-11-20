import Link from 'next/link';
import Container from '@/components/Container';
import { getPagesGrouped, getSettings } from '@/lib/api';
import { routes } from '@/lib/site';
import PanicExit from './PanicExit';

/**
 * Header'ın üstündeki koyu şerit: sözler + hızlı çıkış. "3D Secure" yalnız
 * kartla ödeme gerçekten açıkken yazılır — açık olmayan bir yöntemi vaat
 * etmek yok. Ayarlar önbellekten; şerit statik kabukta kalır.
 */
export default async function UtilityBar() {
    const [settings, pages] = await Promise.all([getSettings(), getPagesGrouped().catch(() => ({ items: [] }))]);
    // Her sayfadan (kategori listesi dahil, footer'a inmeden) yardıma ulaşılsın.
    // Yalnız yayımlı yardım sayfaları; slug yoksa bağlantı çizilmez.
    const help = (pages.items ?? []).filter((page) => page.group === 'yardim');
    const quickLinks = ['sss', 'iletisim']
        .map((slug) => help.find((page) => page.slug === slug))
        .filter((page): page is NonNullable<typeof page> => Boolean(page));
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
                <span className="ml-auto inline-flex items-center gap-4">
                    {quickLinks.map((page) => (
                        <Link key={page.slug} href={routes.page(page.slug)} className="hidden text-on-dark/75 underline-offset-4 hover:text-on-dark hover:underline sm:inline">
                            {page.slug === 'sss' ? 'Yardım' : page.title}
                        </Link>
                    ))}
                    <PanicExit />
                </span>
            </Container>
        </div>
    );
}
