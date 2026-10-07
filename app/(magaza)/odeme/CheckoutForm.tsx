'use client';

import { useActionState, useRef, useState } from 'react';
import CityDistrictFields from '@/components/form/CityDistrictFields';
import FieldLabel, { RequiredNote } from '@/components/form/FieldLabel';
import PhoneField from '@/components/form/PhoneField';
import SubmitButton from '@/components/form/SubmitButton';
import LegalDocumentsDialog, { type LegalDialogState } from '@/components/legal/LegalDocumentsDialog';
import SellerCard from '@/components/legal/SellerCard';
import { track } from '@/lib/analytics/gtag';
import { CURRENCY, fromCartItem, valueOf } from '@/lib/analytics/items';
import { formatPrice } from '@/lib/format';
import type { Locations } from '@/lib/locations';
import { routes } from '@/lib/site';
import type {
    Address, Cart, InstallmentOption, LegalDocumentStatus, SiteSettings,
} from '@/lib/types';
import { placeOrderAction, type CheckoutState } from './actions';

/**
 * Tek sayfa ödeme. Sitedeki TEK `useActionState` kullanımı.
 *
 * Neden istemci bileşeni: kart/havale sekmesi, taksit seçimi, "fatura adresim
 * aynı" katlaması ve hata sonrası girilen onca alanı koruma. Diğer formlar
 * `?hata=` ile idare ediyor; burada kullanıcıya adresini yeniden yazdırmak olmaz.
 *
 * Kart bilgisi BURADA TOPLANMAZ — bir sonraki adımda PayTR'nin iframe'ine girilir.
 */
const step = (no: string, title: string, children: React.ReactNode) => (
    <section className="card card-xl p-[clamp(18px,2.6vw,28px)]">
        <div className="flex items-center gap-2.5">
            <span className="grid size-6 place-items-center rounded-full bg-accent-200 text-[12px] font-extrabold text-accent-500">
                {no}
            </span>
            <h2 className="font-display text-[17px] font-semibold tracking-[-0.025em]">{title}</h2>
        </div>
        <div className="mt-4 space-y-3.5">{children}</div>
    </section>
);

const field = (label: string, input: React.ReactNode, required = false) => (
    <label className="block">
        <FieldLabel required={required}>{label}</FieldLabel>
        {input}
    </label>
);

/**
 * Kayıtlı adres seçilmezse (ya da misafirse) yazılan adres. Fatura bloğu aynı
 * alanları `billing` önekiyle kullanır.
 */
function AddressFields({
    locations, prefix = '', values,
}: {
    locations: Locations;
    prefix?: '' | 'billing';
    values: (name: string) => string | undefined;
}) {
    const name = (base: string) => (prefix ? `${prefix}${base[0].toUpperCase()}${base.slice(1)}` : base);
    return (
        <>
            <div className="grid gap-3 sm:grid-cols-2">
                {field('Ad', <input name={name('firstname')} required autoComplete="given-name" defaultValue={values(name('firstname'))} className="field-input" />, true)}
                {field('Soyad', <input name={name('lastname')} required autoComplete="family-name" defaultValue={values(name('lastname'))} className="field-input" />, true)}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                <CityDistrictFields
                    locations={locations}
                    names={{ city: name('city'), district: name('district') }}
                    defaultCity={values(name('city'))}
                    defaultDistrict={values(name('district'))}
                />
            </div>
            {field('Açık adres', (
                <textarea
                    name={name('addressLine')} required minLength={5} rows={3} autoComplete="street-address"
                    placeholder="Mahalle, sokak, bina ve daire numarası"
                    defaultValue={values(name('addressLine'))}
                    className="field-input min-h-[76px]"
                />
            ), true)}
        </>
    );
}

type OrderDocKey = 'on_bilgilendirme' | 'mesafeli_satis';

export default function CheckoutForm({
    cart, installments, locations, customer, addresses, methods, legalDocuments, settings, idempotencyKey,
}: {
    cart: Cart;
    installments: InstallmentOption[];
    locations: Locations;
    /** Giriş yapmış müşteri: iletişim alanları onunla dolar. Misafirde `null`. */
    customer: { email: string; phone: string | null } | null;
    /** Kayıtlı adresler; misafirde boş. */
    addresses: Address[];
    /** Şu an seçilebilen yöntemler (API hesaplıyor). Kapalı yöntem hiç çizilmez. */
    methods: { card: boolean; transfer: boolean };
    /** Ön bilgilendirme, mesafeli satış ve KVKK'nın yayın durumu/adresi. */
    legalDocuments: LegalDocumentStatus[];
    /** Satıcı künyesi ve iade süresi için ayarlar. */
    settings: SiteSettings;
    /**
     * Sunucunun bu çizim için ürettiği tekrar anahtarı. İstemcide üretilseydi
     * sunucu ve istemci farklı değer basar, hidrasyon uyuşmazdı.
     */
    idempotencyKey: string;
}) {
    const formRef = useRef<HTMLFormElement>(null);
    const [legalDialog, setLegalDialog] = useState<LegalDialogState | null>(null);
    const docOf = (key: string) => legalDocuments.find((doc) => doc.key === key);
    const statementName = settings['gizlilik.notr_ekstre_adi']?.trim();
    const anyDraft = ['on_bilgilendirme', 'mesafeli_satis'].some((key) => !docOf(key)?.isPublished);

    /**
     * Belgeyi SİPARİŞE ÖZEL açar: formdaki o anki alıcı, adres ve yöntemle
     * doldurulur (yarım olabilir). Olay işleyicisinde: effect içinde istek ve
     * setState zincirleme render üretiyor.
     */
    const openDocument = async (key: OrderDocKey, title: string) => {
        setLegalDialog({ title, html: null, isDraft: !docOf(key)?.isPublished, error: null });
        const data = new FormData(formRef.current ?? undefined);
        const value = (name: string) => String(data.get(name) ?? '').trim();
        const saved = addresses.find((item) => item.id === Number(value('addressId')));
        const typed = (prefix: '' | 'billing') => {
            const key2 = (base: string) => (prefix ? `${prefix}${base[0].toUpperCase()}${base.slice(1)}` : base);
            return {
                firstname: value(key2('firstname')), lastname: value(key2('lastname')), phone: value('phone'),
                city: value(key2('city')), district: value(key2('district')), addressLine: value(key2('addressLine')),
            };
        };
        try {
            const response = await fetch('/api/odeme/belgeler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: value('email'),
                    shippingAddress: saved ?? typed(''),
                    billingAddress: data.get('billingSame') === 'on' ? null : typed('billing'),
                    shippingRateId: Number(value('shippingRateId')) || null,
                    paymentMethod: value('paymentMethod') === 'transfer' ? 'transfer' : 'card',
                }),
            });
            const result = await response.json();
            const document = result?.[key];
            if (!response.ok || !document) throw new Error(result?.message || 'Belge şu anda açılamadı.');
            setLegalDialog({ title: document.title, html: document.html, isDraft: document.isDraft, error: null });
        } catch (error) {
            setLegalDialog({ title, html: null, isDraft: false, error: (error as Error).message });
        }
    };

    const docLink = (key: OrderDocKey, label: string) => {
        const doc = docOf(key);
        return (
            <a
                href={routes.page(doc?.slug ?? '')}
                target="_blank"
                rel="noopener"
                className="font-semibold text-accent-500 underline underline-offset-2"
                onClick={(event) => { event.preventDefault(); openDocument(key, doc?.title ?? label); }}
            >
                {label}
            </a>
        );
    };
    const [state, action] = useActionState<CheckoutState, FormData>(placeOrderAction, { error: null });
    // Hata sonrası React formu sıfırlıyor: kontrolsüz alanlar varsayılan değerine
    // döner. Aksiyon gönderileni geri veriyor, varsayılan o oluyor — kullanıcı
    // adresini yeniden yazmak zorunda kalmıyor.
    const values = (name: string) => state.values?.[name];
    const [addressId, setAddressId] = useState<number | 'new'>(() => {
        const fromState = Number(state.values?.addressId);
        if (fromState) return fromState;
        return (addresses.find((item) => item.isDefaultShipping) ?? addresses[0])?.id ?? 'new';
    });
    const [billingSame, setBillingSame] = useState(true);
    const [method, setMethod] = useState<'card' | 'transfer'>(methods.card ? 'card' : 'transfer');
    const noMethod = !methods.card && !methods.transfer;
    const [shippingRateId, setShippingRateId] = useState(cart.selectedShippingRateId ?? cart.shippingOptions[0]?.id);
    const [installment, setInstallment] = useState(1);

    const selected = cart.shippingOptions.find((option) => option.id === shippingRateId);
    const shippingPrice = selected?.price ?? 0;
    const grandTotal = cart.totals.subtotal - cart.totals.discount + shippingPrice;

    /*
     * Kargo ve ödeme bilgisi olayları GÖNDERİMDE: iki seçimin de varsayılanı
     * var, kullanıcı hiç değiştirmeden ödeyebilir. Bunlar NİYET olayıdır;
     * sipariş başarısız olabilir. Satın alma sunucudan, tahsilat
     * doğrulanınca gider (API, D15). Form verisi (ad, adres, e-posta) olaya girmez.
     */
    const trackCheckoutSteps = () => {
        const items = cart.items.map((item) => fromCartItem(item));
        const common = { currency: CURRENCY, value: valueOf(items, cart.totals.discount), items };
        track('add_shipping_info', { ...common, shipping_tier: selected?.name });
        track('add_payment_info', { ...common, payment_type: method === 'transfer' ? 'havale' : 'kart' });
    };

    return (
        <form ref={formRef} action={action} onSubmit={trackCheckoutSteps} className="flex flex-wrap items-start gap-[clamp(14px,2vw,24px)]">
            <input type="hidden" name="shippingRateId" value={shippingRateId ?? ''} />
            <input type="hidden" name="paymentMethod" value={method} />
            <input type="hidden" name="installment" value={installment} />
            {/* Çift tıklama aynı ödeme denemesine bağlanır; başarısızlıktan sonra aksiyon yenisini verir. */}
            <input type="hidden" name="idempotencyKey" value={state.idempotencyKey ?? idempotencyKey} />

            <div className="min-w-0 flex-[999_1_420px] space-y-3">
                {state.error && (
                    <p role="alert" className="rounded-[var(--radius-md)] bg-accent-200 px-4 py-3 text-[13.5px] font-semibold text-accent-500">
                        {state.error}
                    </p>
                )}

                <RequiredNote />

                {step('1', 'İletişim', (
                    <>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {field('E-posta', (
                                <input
                                    name="email" type="email" required autoComplete="email" placeholder="ornek@eposta.com"
                                    defaultValue={values('email') ?? customer?.email ?? ''}
                                    className="field-input"
                                />
                            ), true)}
                            {field('Telefon', <PhoneField defaultValue={values('phone') ?? customer?.phone ?? ''} />, true)}
                        </div>
                        <p className="text-[12px] leading-relaxed text-slate-600">
                            Sipariş bilgileri bu adrese gönderilir. Konu satırı her zaman nötrdür.
                        </p>
                    </>
                ))}

                {step('2', 'Teslimat adresi', (
                    <>
                        {/* Kayıtlı adres: kart olarak seçilir, alanları yeniden yazılmaz.
                            Sunucu adresi KİMLİKTEN okur — gizli alanlara güvenmez. */}
                        {addresses.length > 0 && (
                            <div className="grid gap-2.5 sm:grid-cols-2">
                                {addresses.map((item) => (
                                    <label
                                        key={item.id}
                                        className={`flex cursor-pointer items-start gap-3 rounded-[14px] border p-3.5 transition-colors ${
                                            addressId === item.id
                                                ? 'border-[1.5px] border-accent-500 bg-accent-50'
                                                : 'border-slate-900/13 hover:border-slate-900/30'
                                        }`}
                                    >
                                        <input
                                            type="radio" name="adresSecimi" checked={addressId === item.id}
                                            onChange={() => setAddressId(item.id)}
                                            className="field-radio mt-0.5 accent-accent-500"
                                        />
                                        <span className="min-w-0 text-[13px] leading-relaxed">
                                            <span className="block font-bold">{item.title}</span>
                                            <span className="block text-slate-600">
                                                {item.firstname} {item.lastname} · {item.district} / {item.city}
                                            </span>
                                            <span className="block truncate text-slate-600">{item.addressLine}</span>
                                        </span>
                                    </label>
                                ))}
                                <label
                                    className={`flex cursor-pointer items-center gap-3 rounded-[14px] border p-3.5 text-[13px] font-bold transition-colors ${
                                        addressId === 'new'
                                            ? 'border-[1.5px] border-accent-500 bg-accent-50'
                                            : 'border-dashed border-slate-900/20 hover:border-slate-900/40'
                                    }`}
                                >
                                    <input
                                        type="radio" name="adresSecimi" checked={addressId === 'new'}
                                        onChange={() => setAddressId('new')}
                                        className="field-radio accent-accent-500"
                                    />
                                    + Yeni adres gir
                                </label>
                            </div>
                        )}

                        {addressId === 'new' ? (
                            <>
                                <AddressFields locations={locations} values={values} />
                                {customer && (
                                    <label className="flex items-center gap-2.5 text-[13.5px]">
                                        <input type="checkbox" name="saveAddress" defaultChecked className="field-checkbox accent-accent-500" />
                                        Bu adresi adreslerime kaydet
                                    </label>
                                )}
                            </>
                        ) : (
                            <input type="hidden" name="addressId" value={addressId} />
                        )}

                        <label className="flex items-center gap-2.5 text-[13.5px]">
                            <input
                                type="checkbox" name="billingSame" checked={billingSame}
                                onChange={(event) => setBillingSame(event.target.checked)}
                                className="field-checkbox accent-accent-500"
                            />
                            Fatura adresim aynı olsun
                        </label>

                        {!billingSame && (
                            <div className="space-y-3.5 rounded-[14px] border border-slate-900/10 p-4">
                                <p className="text-[13px] font-bold">Fatura adresi</p>
                                <AddressFields locations={locations} prefix="billing" values={values} />
                            </div>
                        )}
                    </>
                ))}

                {step('3', 'Kargo', (
                    <div className="space-y-2.5">
                        {cart.shippingOptions.map((option) => (
                            <label
                                key={option.id}
                                className={`flex cursor-pointer items-start gap-3.5 rounded-[14px] border p-4 transition-colors ${
                                    option.id === shippingRateId
                                        ? 'border-[1.5px] border-accent-500 bg-accent-50'
                                        : 'border-slate-900/13 hover:border-slate-900/30'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="kargo"
                                    checked={option.id === shippingRateId}
                                    onChange={() => setShippingRateId(option.id)}
                                    className="field-radio mt-0.5 accent-accent-500"
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[14px] font-bold">{option.name}</span>
                                    {option.description && (
                                        <span className="mt-0.5 block text-[12.5px] text-slate-600">{option.description}</span>
                                    )}
                                    {option.estimatedDays && (
                                        <span className="mt-0.5 block text-[12.5px] text-slate-600">
                                            Tahmini teslim {option.estimatedDays.min}
                                            {option.estimatedDays.max !== option.estimatedDays.min ? `–${option.estimatedDays.max}` : ''} iş günü
                                        </span>
                                    )}
                                </span>
                                <span className={`shrink-0 text-[14px] font-bold ${option.isFree ? 'text-teal-ink' : ''}`}>
                                    {option.isFree ? 'Ücretsiz' : formatPrice(option.price)}
                                </span>
                            </label>
                        ))}
                    </div>
                ))}

                {step('4', 'Ödeme', (
                    <>
                        {noMethod && (
                            <p role="alert" className="rounded-[var(--radius-md)] bg-accent-200 px-3.5 py-3 text-[13px] font-semibold text-accent-500">
                                Şu anda çevrim içi ödeme alınamıyor. Siparişin için bize WhatsApp ya da canlı destekten yazabilirsin.
                            </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                            {([
                                ['card', 'Kredi / banka kartı'],
                                ['transfer', 'Havale / EFT'],
                            ] as const).filter(([value]) => methods[value]).map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setMethod(value)}
                                    aria-pressed={method === value}
                                    className={`btn-pill px-4 py-2.5 text-[13px] font-bold transition-colors ${
                                        method === value
                                            ? 'bg-slate-900 text-on-dark'
                                            : 'border border-slate-900/12 hover:border-slate-900'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                            {/* Rozet yöntemin kendisini anlatır: havale seçiliyken
                                "3D Secure" yazmak olmayan bir korumayı vaat ediyordu. */}
                            {method === 'card' && (
                                <span className="badge badge-teal ml-auto">
                                    <span className="dot-lg dot bg-teal-dot" />
                                    3D Secure
                                </span>
                            )}
                        </div>

                        {method === 'card' ? (
                            <>
                                <p className="text-[13px] leading-relaxed text-slate-600">
                                    Kart bilgileri bu sayfada istenmez. Onayladığında PayTR&rsquo;nin güvenli ödeme
                                    alanı açılır; kart bilgilerin ozmishop&rsquo;a iletilmez. Ödeme tamamlanmadan
                                    sipariş oluşmaz, sepetin olduğu gibi kalır.
                                </p>

                                {installments.length > 0 && (
                                    <div className="rounded-[var(--radius-md)] border border-slate-900/8">
                                        <div className="flex items-center gap-2 border-b border-slate-900/8 px-3.5 py-2.5">
                                            <span className="dot-lg dot bg-amber-dot" />
                                            <span className="text-[12.5px] font-bold text-amber-ink">Taksit seçenekleri</span>
                                        </div>
                                        <div className="divide-y divide-slate-900/5">
                                            {installments.map((option) => (
                                                <label key={option.count} className="flex cursor-pointer items-center gap-3 px-3.5 py-2.5">
                                                    <input
                                                        type="radio"
                                                        name="taksit"
                                                        checked={installment === option.count}
                                                        onChange={() => setInstallment(option.count)}
                                                        className="field-radio accent-accent-500"
                                                    />
                                                    <span className="flex-1 text-[13.5px] font-semibold">
                                                        {option.count === 1 ? 'Tek çekim' : `${option.count} taksit`}
                                                    </span>
                                                    <span className="text-[13px] text-slate-600">
                                                        {option.count === 1 ? formatPrice(option.total) : `${formatPrice(option.monthly)} × ${option.count}`}
                                                    </span>
                                                    <span className="w-24 text-right text-[13px] font-bold">
                                                        {option.extraCost > 0 ? formatPrice(option.total) : 'Ek maliyet yok'}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="rounded-[var(--radius-md)] bg-slate-100 px-3.5 py-3 text-[13px] leading-relaxed text-slate-700">
                                Siparişini oluşturduktan sonra banka bilgilerimizi göreceksin. Ödemen ulaştığında
                                sipariş hazırlanmaya başlar. Açıklamaya yalnızca sipariş numaranı yazman yeterli.
                            </p>
                        )}

                        {field('Sipariş notu', (
                            <textarea name="note" rows={2} className="field-input" placeholder="Kapıcıya bırakılabilir gibi notlar" />
                        ))}
                    </>
                ))}
            </div>

            <aside className="min-w-0 flex-[1_1_300px] lg:sticky lg:top-36 lg:max-w-[380px]">
                <div className="card card-xl p-[clamp(18px,2.4vw,24px)]">
                    <h2 className="heading-3">Sepetin</h2>

                    <ul className="mt-3.5 space-y-2.5">
                        {cart.items.map((item) => (
                            <li key={item.id} className="flex items-baseline justify-between gap-3 text-[13px]">
                                <span className="min-w-0">
                                    <span className="block truncate font-semibold">{item.name}</span>
                                    <span className="text-slate-600">
                                        {item.variantLabel ? `${item.variantLabel} · ` : ''}{item.quantity} adet
                                    </span>
                                </span>
                                <span className="price shrink-0 text-[13.5px]">{formatPrice(item.lineTotal)}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="hr" />

                    <dl className="space-y-2.5 text-[13.5px]">
                        <div className="flex justify-between gap-3">
                            <dt className="text-slate-600">Ara toplam</dt>
                            <dd className="font-semibold">{formatPrice(cart.totals.subtotal)}</dd>
                        </div>
                        {cart.totals.discount > 0 && (
                            <div className="flex justify-between gap-3">
                                <dt className="text-slate-600">İndirim</dt>
                                <dd className="font-semibold text-accent-500">−{formatPrice(cart.totals.discount)}</dd>
                            </div>
                        )}
                        <div className="flex justify-between gap-3">
                            <dt className="text-slate-600">Kargo</dt>
                            <dd className={`font-semibold ${shippingPrice === 0 ? 'text-teal-ink' : ''}`}>
                                {shippingPrice === 0 ? 'Ücretsiz' : formatPrice(shippingPrice)}
                            </dd>
                        </div>
                    </dl>

                    <div className="hr" />

                    <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[13.5px] font-semibold">Toplam</span>
                        <span className="price text-[26px]">{formatPrice(grandTotal)}</span>
                    </div>

                    {/* İki AYRI ve İSİMLİ onay: sunucu ikisini de denetler ve siparişe
                        belgelerin doldurulmuş kopyasıyla birlikte yazar. */}
                    <div className="mt-4 space-y-2.5 text-[12.5px] leading-relaxed">
                        <label className="flex items-start gap-2.5">
                            <input type="checkbox" name="onBilgilendirme" required defaultChecked={values('onBilgilendirme') === 'on'} className="field-checkbox mt-0.5 accent-accent-500" />
                            <span>{docLink('on_bilgilendirme', 'Ön bilgilendirme formunu')} okudum, onaylıyorum.</span>
                        </label>
                        <label className="flex items-start gap-2.5">
                            <input type="checkbox" name="mesafeliSatis" required defaultChecked={values('mesafeliSatis') === 'on'} className="field-checkbox mt-0.5 accent-accent-500" />
                            <span>{docLink('mesafeli_satis', 'Mesafeli satış sözleşmesini')} okudum, onaylıyorum.</span>
                        </label>
                        <p className="text-[12px] text-slate-600">
                            Kişisel verilerin{' '}
                            <a href={routes.page(docOf('kvkk')?.slug ?? 'kvkk-aydinlatma-metni')} target="_blank" rel="noopener" className="underline underline-offset-2">KVKK Aydınlatma Metni</a>
                            {' '}kapsamında işlenir. Belgelerin kopyası e-postana gönderilir.
                        </p>
                        {anyDraft && (
                            <p className="rounded-[var(--radius-md)] bg-amber-tint px-3 py-2 text-[12px] font-semibold text-amber-ink">
                                Sözleşme metinleri taslaktır; hukuk onayından sonra güncellenecek.
                            </p>
                        )}
                    </div>

                    <SubmitButton
                        className="btn-primary mt-4 min-h-[54px] w-full justify-center rounded-[14px]"
                        pendingLabel={method === 'card' ? 'Ödeme sayfası hazırlanıyor…' : 'Sipariş oluşturuluyor…'}
                        disabled={!shippingRateId || noMethod}
                    >
                        Siparişi onayla ve öde
                    </SubmitButton>

                    <ul className="mt-4 space-y-2">
                        {(method === 'card'
                            ? [
                                ['bg-on-dark-berry', 'Kargo etiketinde içerik bilgisi yok'],
                                // Unvan ayardan; doğrulanıp girilmemişse söz verilmez.
                                ...(statementName ? [['bg-plum-dot', `Ekstrede ${statementName} yazar`]] : []),
                                ['bg-teal-dot', '3D Secure ile korunan ödeme'],
                            ]
                            : [
                                ['bg-on-dark-berry', 'Kargo etiketinde içerik bilgisi yok'],
                                ['bg-teal-dot', 'Banka bilgileri sipariş sonrası ekranda ve e-postada'],
                            ]
                        ).map(([dot, text]) => (
                            <li key={text} className="flex items-start gap-2.5 text-[12px] text-slate-600">
                                <span className={`dot mt-1.5 ${dot}`} />
                                {text}
                            </li>
                        ))}
                    </ul>
                </div>

                <SellerCard settings={settings} returnDays={Number(settings['icerik.iade_suresi_gun']) || 14} />
            </aside>

            {legalDialog && <LegalDocumentsDialog state={legalDialog} onClose={() => setLegalDialog(null)} />}
        </form>
    );
}
