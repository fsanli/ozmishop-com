import type { Metadata } from 'next';
import { getMyPrivacy } from '@/lib/account';
import { formatDate } from '@/lib/format';
import { one, type SearchParams } from '@/lib/listing';
import { routes } from '@/lib/site';
import AccountShell from '../AccountShell';
import Switch from '../Switch';
import { hideHistoryAction, setPinAction, togglePrivacyAction } from '../actions';

export const metadata: Metadata = { title: 'Gizlilik modu', robots: { index: false, follow: false } };

const ROWS = [
    {
        key: 'neutralStatement',
        dot: 'bg-accent-500',
        title: 'Nötr ekstre adı',
        body: 'Kart ekstrenizde ürün adı değil, şirket unvanı görünür.',
    },
    {
        key: 'neutralEmailSubject',
        dot: 'bg-teal-dot',
        title: 'Nötr e-posta konusu',
        body: 'Sipariş e-postalarının konu satırında yalnızca sipariş numarası yazar.',
    },
    {
        key: 'marketingEmails',
        dot: 'bg-amber-dot',
        title: 'Kampanya e-postaları',
        body: 'Kapalıyken yalnızca sipariş bilgilendirmesi gönderilir.',
    },
    {
        key: 'panicExitEnabled',
        dot: 'bg-rose-dot',
        title: 'Hızlı çıkış tuşu',
        body: 'Sayfanın üstünde tek tıkla nötr bir sayfaya geçen çıkış tuşu görünür.',
    },
] as const;

export default async function PrivacyPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const [privacy, params] = await Promise.all([getMyPrivacy(), searchParams]);
    const error = one(params.hata);

    return (
        <AccountShell
            active={routes.accountPrivacy}
            title="Gizlilik modu"
            description="Siparişinin hiçbir adımında ne aldığın görünmez. Buradan hangi korumaların açık olduğunu yönetirsin."
        >
            {error && (
                <p role="alert" className="mb-4 rounded-[var(--radius-md)] bg-accent-200 px-4 py-3 text-[13.5px] font-semibold text-accent-500">
                    {error}
                </p>
            )}

            <div className="card px-[22px] py-1.5">
                {/* PIN satırı: anahtar + PIN alanı bir arada. */}
                <div className="border-b border-slate-900/7 py-4">
                    <div className="flex items-start gap-3">
                        <span className="dot-lg dot mt-1.5 bg-accent-500" />
                        <div className="min-w-0 flex-1">
                            <h3 className="text-[15px] font-bold">Sipariş geçmişini PIN ile koru</h3>
                            <p className="mt-1 max-w-[64ch] text-[13px] leading-relaxed text-slate-600">
                                PIN açıkken sipariş geçmişin sunucuda da korunur: yalnızca PIN girildikten sonra okunur.
                                {privacy.pinUpdatedAt && ` Son değişiklik ${formatDate(privacy.pinUpdatedAt)}.`}
                            </p>
                        </div>
                    </div>

                    <form action={setPinAction} className="mt-3 flex flex-wrap items-center gap-2 pl-[22px]">
                        <input
                            name="pin"
                            inputMode="numeric"
                            pattern="\d{4,6}"
                            placeholder={privacy.pinEnabled ? '••••' : '4 haneli PIN'}
                            aria-label="Gizlilik PIN'i"
                            className="field-input w-[120px] text-center tracking-[0.4em]"
                        />
                        <button type="submit" className="btn-soft btn-sm">
                            {privacy.pinEnabled ? 'PIN\'i değiştir' : 'PIN oluştur'}
                        </button>
                        {privacy.pinEnabled && (
                            <button type="submit" name="pin" value="" className="text-[12.5px] text-slate-600 underline underline-offset-4">
                                PIN korumasını kaldır
                            </button>
                        )}
                    </form>
                </div>

                {ROWS.map((row) => (
                    <div key={row.key} className="flex items-start gap-3 border-b border-slate-900/7 py-4 last:border-0">
                        <span className={`dot-lg dot mt-1.5 ${row.dot}`} />
                        <div className="min-w-0 flex-1">
                            <h3 className="text-[15px] font-bold">{row.title}</h3>
                            <p className="mt-1 max-w-[64ch] text-[13px] leading-relaxed text-slate-600">{row.body}</p>
                        </div>
                        <Switch action={togglePrivacyAction} name={row.key} on={privacy[row.key]} label={row.title} />
                    </div>
                ))}
            </div>

            {/* Metin bilerek "sil" değil "gizle": e-fatura saklama yükümlülüğü
                fatura kayıtlarının gerçekten silinmesini engelliyor. */}
            <div className="card mt-4 p-[20px_22px]">
                <h3 className="text-[15px] font-bold text-accent-500">Sipariş geçmişini hesabımdan gizle</h3>
                <p className="mt-1.5 max-w-[64ch] text-[13px] leading-relaxed text-slate-600">
                    Geçmiş siparişlerin hesabında görünmez olur. Fatura kayıtları yasal saklama yükümlülüğü
                    gereği silinemez; bu işlem onları yalnızca senden gizler.
                </p>
                <form action={hideHistoryAction} className="mt-4">
                    <button type="submit" className="btn-danger btn-sm">Geçmişi gizle</button>
                </form>
            </div>
        </AccountShell>
    );
}
