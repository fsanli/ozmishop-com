import { LockIcon } from '@/components/icons';
import { getSettings } from '@/lib/api';
import { PACKAGING_SHORT, statementText } from '@/lib/privacy-copy';

/**
 * "Bu siparişte gizlilik" koyu bloğu. Ürün detayda, ödeme özetinde ve sipariş
 * onayında aynı sözleri verir — tasarımın ayırt edici bloğu.
 *
 * Değerler `/ayarlar`dan okunur: gönderici adı değişirse verilen söz beş ayrı
 * dosyada yalan olmasın. Paketleme ve ekstre cümleleri `lib/privacy-copy`
 * (S10): ekstre açıklaması bankaya göre değiştiği için kesin ad sözü yok;
 * gönderici adı ile ekstre adı ayrı şeylerdir.
 */
export default async function PrivacyPanel({ className = '' }: { className?: string }) {
    const settings = await getSettings();

    const rows = [
        {
            dot: 'bg-on-dark-berry',
            label: PACKAGING_SHORT,
            value: settings['gizlilik.gonderici_adi']?.trim()
                ? `Etikette gönderici “${settings['gizlilik.gonderici_adi'].trim()}” ve teslimat bilgilerin yer alır.`
                : 'Etikette gönderici adı ve teslimat bilgilerin yer alır.',
        },
        {
            dot: 'bg-on-dark-plum',
            label: 'Kart ekstresi',
            value: statementText(settings),
        },
        {
            dot: 'bg-on-dark-amber',
            label: 'E-posta konusu nötr',
            value: 'Yalnızca sipariş numarası',
        },
    ];

    return (
        <div className={`block-dark-soft p-[clamp(18px,2.4vw,24px)] ${className}`}>
            <div className="flex items-center gap-2.5">
                <LockIcon className="size-4 text-on-dark-berry" />
                <h2 className="text-[14.5px] font-bold">Bu siparişte gizlilik</h2>
            </div>

            <dl className="mt-3.5">
                {rows.map((row) => (
                    <div key={row.label} className="flex items-start gap-2.5 border-b border-on-dark/10 py-2.5 last:border-0">
                        <span className={`dot-lg dot mt-1.5 ${row.dot}`} />
                        <div className="min-w-0 flex-1">
                            <dt className="text-[13.5px] font-semibold">{row.label}</dt>
                            <dd className="mt-0.5 text-[12.5px] text-on-dark/55">{row.value}</dd>
                        </div>
                    </div>
                ))}
            </dl>
        </div>
    );
}
