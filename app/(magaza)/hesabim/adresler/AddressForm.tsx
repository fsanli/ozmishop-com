import SubmitButton from '@/components/form/SubmitButton';
import PhoneField from '@/components/form/PhoneField';
import { routes } from '@/lib/site';
import Link from 'next/link';
import type { Address } from '@/lib/types';
import { saveAddressAction } from '../actions';

/**
 * Adres formu. İstemci bileşeni DEĞİL: alanlar `defaultValue` ile dolar,
 * gönderim Server Action'a gider. Düzenleme "?duzenle=3" ile açılır — yani
 * form durumu adreste yaşar, tarayıcı geri tuşu da doğru çalışır.
 */
export default function AddressForm({ address }: { address?: Address }) {
    const editing = Boolean(address);

    return (
        <form action={saveAddressAction} className="card card-xl card-edge-top border-t-plum-dot mb-4 p-[clamp(20px,3vw,28px)]">
            {editing && <input type="hidden" name="id" value={address!.id} />}

            <h3 className="heading-3">{editing ? 'Adresi düzenle' : 'Yeni adres'}</h3>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2">
                    <span className="field-label">Adres başlığı</span>
                    <input name="title" required maxLength={40} defaultValue={address?.title}
                        placeholder="Ev, İş…" className="field-input mt-1.5" />
                </label>

                <label>
                    <span className="field-label">Ad</span>
                    <input name="firstname" required autoComplete="given-name" defaultValue={address?.firstname} className="field-input mt-1.5" />
                </label>
                <label>
                    <span className="field-label">Soyad</span>
                    <input name="lastname" required autoComplete="family-name" defaultValue={address?.lastname} className="field-input mt-1.5" />
                </label>

                <label>
                    <span className="field-label">Telefon</span>
                    <PhoneField defaultValue={address?.phone ?? ''} className="field-input mt-1.5" />
                </label>
                <label>
                    <span className="field-label">Posta kodu <span className="text-slate-500">(opsiyonel)</span></span>
                    <input name="postalCode" inputMode="numeric" autoComplete="postal-code" defaultValue={address?.postalCode ?? ''} className="field-input mt-1.5" />
                </label>

                <label>
                    <span className="field-label">İl</span>
                    <input name="city" required autoComplete="address-level1" defaultValue={address?.city} className="field-input mt-1.5" />
                </label>
                <label>
                    <span className="field-label">İlçe</span>
                    <input name="district" required autoComplete="address-level2" defaultValue={address?.district} className="field-input mt-1.5" />
                </label>

                <label className="sm:col-span-2">
                    <span className="field-label">Mahalle <span className="text-slate-500">(opsiyonel)</span></span>
                    <input name="neighbourhood" autoComplete="address-level3" defaultValue={address?.neighbourhood ?? ''} className="field-input mt-1.5" />
                </label>

                <label className="sm:col-span-2">
                    <span className="field-label">Açık adres</span>
                    <textarea name="addressLine" required rows={3} autoComplete="street-address"
                        defaultValue={address?.addressLine} className="field-input mt-1.5 resize-y" />
                </label>
            </div>

            <label className="mt-3.5 flex items-center gap-2.5 text-[13.5px]">
                <input type="checkbox" name="isDefaultShipping" defaultChecked={address?.isDefaultShipping ?? true} className="field-checkbox" />
                Teslimat adresi olarak varsayılan yap
            </label>

            {/* Kuryenin kapıda ne taşıdığını bilmediğini burada söylemek, ödeme
                sayfasına kadar beklemekten iyi: adres girerken tereddüt burada. */}
            <p className="mt-3 text-[12.5px] leading-relaxed text-slate-600">
                Paketin üzerinde ürün adı ya da kategori yazmaz; yalnızca gönderici olarak şirket unvanı görünür.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <SubmitButton className="btn-accent">{editing ? 'Değişiklikleri kaydet' : 'Adresi kaydet'}</SubmitButton>
                <Link href={routes.addresses} className="btn-soft">Vazgeç</Link>
            </div>
        </form>
    );
}
