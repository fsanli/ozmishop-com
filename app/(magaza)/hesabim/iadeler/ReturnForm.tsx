import SubmitButton from '@/components/form/SubmitButton';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import { routes } from '@/lib/site';
import type { Order } from '@/lib/types';
import { createReturnAction } from '../actions';

/** İade sebepleri — serbest metin yerine liste; panelin triyajı buna dayanıyor. */
const REASONS = [
    'Ürün hasarlı/ayıplı geldi',
    'Yanlış ürün gönderildi',
    'Ürün açıklamasıyla uyuşmuyor',
    'Beklentimi karşılamadı',
    'Fikrimi değiştirdim',
];

/**
 * İade talebi formu. Kalem seçimi tek bir kutucuk alanında toplanır: değer
 * "orderItemId:quantity" — böylece sunucu aksiyonu ek bir eşleme yapmadan
 * doğru satırları okur ve istemci durumu gerekmez.
 */
export default function ReturnForm({ order }: { order: Order }) {
    return (
        <form action={createReturnAction} className="card card-xl card-edge-top border-t-plum-dot mb-5 p-[clamp(20px,3vw,28px)]">
            <input type="hidden" name="orderNumber" value={order.orderNumber} />

            <span className="text-[11.5px] font-bold text-plum-ink">{order.orderNumber}</span>
            <h3 className="heading-3 mt-1.5">İade talebi oluştur</h3>

            <fieldset className="mt-4">
                <legend className="field-label">İade edilecek ürünler</legend>
                <ul className="mt-1.5 space-y-1.5">
                    {order.items.map((item) => (
                        <li key={item.id}>
                            <label className="flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-md)] border border-slate-900/10 p-3 transition-colors hover:border-slate-900/25">
                                <input type="checkbox" name="kalem" value={`${item.id}:${item.quantity}`} className="field-checkbox mt-0.5" />
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[13.5px] font-semibold">{item.name}</span>
                                    <span className="mt-0.5 block text-[12.5px] text-slate-600">
                                        {item.variantLabel && <>{item.variantLabel} · </>}
                                        {item.quantity} adet · {formatPrice(item.lineTotal)}
                                    </span>
                                </span>
                            </label>
                        </li>
                    ))}
                </ul>
            </fieldset>

            <label className="mt-4 block">
                <span className="field-label">İade sebebi</span>
                <select name="reason" required defaultValue="" className="field-input">
                    <option value="" disabled>Seçiniz</option>
                    {REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
                </select>
            </label>

            <label className="mt-3 block">
                <span className="field-label">Eklemek istediğin not <span className="text-slate-500">(opsiyonel)</span></span>
                <textarea name="note" rows={3} maxLength={500} className="field-input resize-y" />
            </label>

            {/* Hijyen kuralı iade politikasının en çok sorulan kısmı; talebi
                göndermeden ÖNCE söylemek, reddedilmiş bir talepten iyi. */}
            <p className="mt-4 rounded-[var(--radius-md)] bg-slate-100 px-3.5 py-3 text-[12.5px] leading-relaxed text-slate-700">
                Hijyen gereği kişisel kullanım ürünleri yalnızca <strong className="font-bold">ambalajı açılmamış</strong> hâlde
                iade alınır. Hasarlı ya da yanlış gönderilen ürünlerde bu koşul aranmaz.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <SubmitButton className="btn-accent">Talebi gönder</SubmitButton>
                <Link href={routes.accountReturns} className="btn-soft">Vazgeç</Link>
            </div>
        </form>
    );
}
