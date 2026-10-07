import type { Order } from '@/lib/types';

/** Logo dosyaları `public/carriers/` (panel ile aynı küme; liste API'de). */
const LOGOS: Record<string, string> = {
    aras: 'aras.svg', yurtici: 'yurtici.svg', mng: 'mng.svg', ptt: 'ptt.png', surat: 'surat.png',
    ups: 'ups.svg', dhl: 'dhl.svg', hepsijet: 'hepsijet.png', kolaygelsin: 'kolaygelsin.svg', sendeo: 'sendeo.png',
};

/**
 * Kargo satırı: firma logosu, takip numarası ve takip sayfası. Firmanın
 * otomatik takip bağlantısı yoksa numara ve firmanın sitesi gösterilir —
 * kırık bir bağlantı göstermektense.
 */
export default function TrackingLine({ shipping, className = '' }: { shipping: Order['shipping']; className?: string }) {
    if (!shipping.trackingNumber) return null;
    const logo = shipping.carrierCode ? LOGOS[shipping.carrierCode] : undefined;
    const href = shipping.trackingUrl ?? shipping.carrierWebsite;

    return (
        <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-slate-600 ${className}`}>
            {logo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={`/carriers/${logo}`} alt={shipping.carrier ?? ''} className="h-4 w-auto max-w-14 object-contain" />
                : shipping.carrier && <span>{shipping.carrier}</span>}
            <span className="font-mono">{shipping.trackingNumber}</span>
            {shipping.progress && <span className="font-medium text-slate-700">· {shipping.progress}</span>}
            {href && (
                <a href={href} target="_blank" rel="noopener noreferrer" className="link">
                    {shipping.trackingUrl ? 'Kargom nerede?' : 'Kargo firmasının sitesi'}
                </a>
            )}
        </span>
    );
}
