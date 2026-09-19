import { CheckIcon } from '@/components/icons';
import { formatPrice } from '@/lib/format';
import type { TransferSettlement } from '@/lib/types';

/**
 * Havale / EFT ödeme kutusu. Sipariş onayı ve Hesabım → sipariş detayında
 * AYNI bileşen: müşteri iki ekranda iki farklı rakam görmemeli.
 *
 * Sunucu bileşeni, sıfır JS. Gösterdiği her şey API'nin `order.transfer`
 * alanından geliyor ve o alan panelin gördüğü hesabın aynısı.
 *
 * Dört durumun dördü de AÇIKÇA yazılır — "ödeme bekleniyor" tek başına
 * müşterinin eksik mi gönderdiğini, fazla mı gönderdiğini söylemiyor ve en
 * çok destek çağrısı üreten belirsizlik tam olarak bu.
 */
const STATE_COPY = {
    bekliyor: {
        badge: 'Ödeme bekleniyor',
        tone: 'badge-amber',
        title: 'Havale / EFT bilgileri',
    },
    eksik: {
        badge: 'Ödemenin bir kısmı alındı',
        tone: 'badge-amber',
        title: 'Kalan tutarı bekliyoruz',
    },
    tam: {
        badge: 'Ödemen alındı',
        tone: 'badge-teal',
        title: 'Ödeme tamamlandı',
    },
    fazla: {
        badge: 'Fazla ödeme alındı',
        tone: 'badge-teal',
        title: 'Fazla tutarı iade edeceğiz',
    },
} as const;

/** IBAN'ı dörtlü gruplara ayırır: elle kopyalayan biri için okunabilirlik. */
const groupIban = (iban: string) => iban.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim();

export default function TransferPanel({
    settlement,
    orderNumber,
    className = '',
}: {
    settlement: TransferSettlement;
    orderNumber: string;
    className?: string;
}) {
    const copy = STATE_COPY[settlement.state];
    const settled = settlement.state === 'tam' || settlement.state === 'fazla';

    return (
        <section className={`card p-[18px_20px] ${className}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[14.5px] font-bold">{copy.title}</h2>
                <span className={`badge ${copy.tone}`}>
                    {settled && <CheckIcon className="size-3" />}
                    {copy.badge}
                </span>
            </div>

            {/* Tutar özeti: ödenen her zaman görünür, kalan/fazla duruma göre. */}
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13.5px]">
                <dt className="text-slate-600">Sipariş toplamı</dt>
                <dd className="text-right font-medium tabular-nums text-slate-900">{formatPrice(settlement.grandTotal)}</dd>

                {settlement.paid > 0 && (
                    <>
                        <dt className="text-slate-600">Bugüne kadar alınan</dt>
                        <dd className="text-right font-medium tabular-nums text-slate-900">{formatPrice(settlement.paid)}</dd>
                    </>
                )}

                {settlement.remaining > 0 && (
                    <>
                        <dt className="font-bold text-slate-900">Kalan</dt>
                        <dd className="text-right font-bold tabular-nums text-slate-900">{formatPrice(settlement.remaining)}</dd>
                    </>
                )}

                {settlement.overpaid > 0 && (
                    <>
                        <dt className="font-bold text-slate-900">Fazla gönderilen</dt>
                        <dd className="text-right font-bold tabular-nums text-slate-900">{formatPrice(settlement.overpaid)}</dd>
                    </>
                )}
            </dl>

            {settlement.state === 'fazla' && (
                <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
                    Fazla gönderdiğin tutarı aynı hesaba geri aktaracağız. Siparişin bundan etkilenmiyor.
                </p>
            )}

            {/* Banka bilgileri yalnızca hâlâ ödeme bekleniyorsa; tamamlanmış bir
                ödemede IBAN göstermek "bir daha mı göndereceğim?" sorusu yaratır. */}
            {settlement.remaining > 0 && (
                <>
                    <div className="mt-4 rounded-[12px] bg-paper p-[14px_16px]">
                        <dl className="grid gap-1.5 text-[13.5px]">
                            {settlement.bank.accountName && (
                                <div className="flex justify-between gap-3">
                                    <dt className="text-slate-600">Hesap sahibi</dt>
                                    <dd className="text-right font-medium text-slate-900">{settlement.bank.accountName}</dd>
                                </div>
                            )}
                            {settlement.bank.bankName && (
                                <div className="flex justify-between gap-3">
                                    <dt className="text-slate-600">Banka</dt>
                                    <dd className="text-right font-medium text-slate-900">{settlement.bank.bankName}</dd>
                                </div>
                            )}
                            {settlement.bank.iban && (
                                <div className="flex justify-between gap-3">
                                    <dt className="text-slate-600">IBAN</dt>
                                    <dd className="text-right font-bold tabular-nums text-slate-900">{groupIban(settlement.bank.iban)}</dd>
                                </div>
                            )}
                            <div className="mt-1 flex justify-between gap-3 border-t border-line pt-2">
                                <dt className="text-slate-600">Açıklamaya yaz</dt>
                                <dd className="text-right font-bold text-slate-900">{orderNumber}</dd>
                            </div>
                        </dl>
                    </div>

                    <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
                        Açıklamada sipariş numarası olmayan ödemeleri siparişinle eşleştirmemiz gecikebilir.
                        {settlement.bank.dueDays ? ` Ödeme için ${settlement.bank.dueDays} günün var.` : ''}
                    </p>

                    {!settlement.bank.iban && (
                        // Ayar boşsa sessizce boş bir kutu göstermek yerine ne
                        // yapması gerektiğini söyle: müşteri parayı nereye
                        // göndereceğini bilmiyor.
                        <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                            Banka bilgileri sipariş e-postanda yer alıyor.
                        </p>
                    )}
                </>
            )}

            {settlement.bank.note && settlement.remaining > 0 && (
                <p className="mt-2 text-[12.5px] leading-relaxed text-slate-600">{settlement.bank.note}</p>
            )}
        </section>
    );
}
