import SubmitButton from '@/components/form/SubmitButton';
import PhoneField from '@/components/form/PhoneField';
import CityDistrictFields from '@/components/form/CityDistrictFields';
import FieldLabel, { RequiredNote } from '@/components/form/FieldLabel';
import type { Locations } from '@/lib/locations';
import { routes } from '@/lib/site';
import Link from 'next/link';
import type { Address } from '@/lib/types';
import { saveAddressAction } from '../actions';

/**
 * Adres formu. İstemci bileşeni DEĞİL: alanlar `defaultValue` ile dolar,
 * gönderim Server Action'a gider. Düzenleme "?duzenle=3" ile açılır — yani
 * form durumu adreste yaşar, tarayıcı geri tuşu da doğru çalışır.
 *
 * Zorunlu: ad, soyad, telefon, il, ilçe, açık adres. İl/ilçe aranabilir
 * listeden seçilir (yalnız o parça istemci bileşeni).
 */
export default function AddressForm({ address, locations }: { address?: Address; locations: Locations }) {
    const editing = Boolean(address);

    return (
        <form action={saveAddressAction} className="card card-xl card-edge-top border-t-plum-dot mb-4 p-[clamp(20px,3vw,28px)]">
            {editing && <input type="hidden" name="id" value={address!.id} />}

            <h3 className="heading-3">{editing ? 'Adresi düzenle' : 'Yeni adres'}</h3>
            <RequiredNote className="mt-1.5" />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label>
                    <FieldLabel required>Ad</FieldLabel>
                    <input name="firstname" required autoComplete="given-name" defaultValue={address?.firstname} className="field-input" />
                </label>
                <label>
                    <FieldLabel required>Soyad</FieldLabel>
                    <input name="lastname" required autoComplete="family-name" defaultValue={address?.lastname} className="field-input" />
                </label>

                <label>
                    <FieldLabel required>Telefon</FieldLabel>
                    <PhoneField defaultValue={address?.phone ?? ''} className="field-input" />
                </label>
                <label>
                    <FieldLabel>Adres başlığı</FieldLabel>
                    <input name="title" maxLength={40} defaultValue={address?.title}
                        placeholder="Ev, İş… (boşsa ilçe / il)" className="field-input" />
                </label>

                <CityDistrictFields locations={locations} defaultCity={address?.city} defaultDistrict={address?.district} />

                <label>
                    <FieldLabel>Mahalle</FieldLabel>
                    <input name="neighbourhood" autoComplete="address-level3" defaultValue={address?.neighbourhood ?? ''} className="field-input" />
                </label>
                <label>
                    <FieldLabel>Posta kodu</FieldLabel>
                    <input name="postalCode" inputMode="numeric" autoComplete="postal-code" defaultValue={address?.postalCode ?? ''} className="field-input" />
                </label>

                <label className="sm:col-span-2">
                    <FieldLabel required>Açık adres</FieldLabel>
                    <textarea name="addressLine" required minLength={5} rows={3} autoComplete="street-address"
                        placeholder="Sokak, bina ve daire numarası"
                        defaultValue={address?.addressLine} className="field-input resize-y" />
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
