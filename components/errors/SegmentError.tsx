'use client';

import Link from 'next/link';
import Container from '@/components/Container';
import { routes } from '@/lib/site';

/**
 * Sayfa gövdesi çöktüğünde (çoğunlukla API'ye ulaşılamadığında) gösterilen
 * kutu. Header ve footer yerinde kalır; ziyaretçi siteden atılmaz.
 *
 * BİLEREK noindex YOK: geçici bir kesinti sırasında Googlebot bu sayfayı
 * görürse sağlam bir adresi indeksten düşürmesin. Kalıcı yokluk `notFound()`
 * ile ayrı bir yoldan gelir.
 */
export default function SegmentError({ retry }: { retry: () => void }) {
    return (
        <Container narrow className="py-[clamp(36px,6vw,80px)]">
            <span className="kicker text-accent-500">Geçici sorun</span>
            <h1 className="heading-1 mt-2.5">Bu sayfa şu an yüklenemedi</h1>
            <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-slate-600">
                Sunucumuza ulaşırken bir aksaklık oldu. Birkaç saniye sonra tekrar denemek çoğu zaman yeter;
                sepetin ve siparişlerin etkilenmez.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
                <button type="button" onClick={() => retry()} className="btn-accent">Tekrar dene</button>
                <Link href={routes.home} className="btn-secondary">Anasayfaya dön</Link>
            </div>
        </Container>
    );
}
