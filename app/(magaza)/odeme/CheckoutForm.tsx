'use client';

import { useActionState, useState } from 'react';
import SubmitButton from '@/components/form/SubmitButton';
import { formatPrice } from '@/lib/format';
import type { Cart, InstallmentOption } from '@/lib/types';
import { placeOrderAction, type CheckoutState } from './actions';

/**
 * Tek sayfa ödeme. Sitedeki TEK `useActionState` kullanımı.
 *
 * Neden istemci bileşeni: kart/havale sekmesi, taksit seçimi, "fatura adresim
 * aynı" katlaması ve hata sonrası girilen onca alanı koruma. Diğer formlar
 * `?hata=` ile idare ediyor; burada kullanıcıya adresini yeniden yazdırmak olmaz.
 *
 * Kart bilgisi BURADA TOPLANMAZ — sağlayıcının 3DS sayfasında girilir.
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

const field = (label: string, input: React.ReactNode) => (
    <label className="block">
        <span className="field-label">{label}</span>
        {input}
    </label>
);

export default function CheckoutForm({
    cart, installments,
}: {
    cart: Cart;
    installments: InstallmentOption[];
}) {
    const [state, action] = useActionState<CheckoutState, FormData>(placeOrderAction, { error: null });
    const [method, setMethod] = useState<'card' | 'transfer'>('card');
    const [shippingRateId, setShippingRateId] = useState(cart.selectedShippingRateId ?? cart.shippingOptions[0]?.id);
    const [installment, setInstallment] = useState(1);

    const selected = cart.shippingOptions.find((option) => option.id === shippingRateId);
    const shippingPrice = selected?.price ?? 0;
    const grandTotal = cart.totals.subtotal - cart.totals.discount + shippingPrice;

    return (
        <form action={action} className="flex flex-wrap items-start gap-[clamp(14px,2vw,24px)]">
            <input type="hidden" name="shippingRateId" value={shippingRateId ?? ''} />
            <input type="hidden" name="paymentMethod" value={method} />
            <input type="hidden" name="installment" value={installment} />

            <div className="min-w-0 flex-[999_1_420px] space-y-3">
                {state.error && (
                    <p role="alert" className="rounded-[var(--radius-md)] bg-accent-200 px-4 py-3 text-[13.5px] font-semibold text-accent-500">
                        {state.error}
                    </p>
                )}

                {step('1', 'İletişim', (
                    <>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {field('E-posta', <input name="email" type="email" required autoComplete="email" className="field-input" placeholder="ornek@eposta.com" />)}
                            {field('Telefon', <input name="phone" required autoComplete="tel" className="field-input" placeholder="05XX XXX XX XX" />)}
                        </div>
                        <p className="text-[12px] leading-relaxed text-slate-600">
                            Sipariş bilgileri bu adrese gönderilir. Konu satırı her zaman nötrdür.
                        </p>
                    </>
                ))}

                {step('2', 'Teslimat adresi', (
                    <>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {field('Ad', <input name="firstname" required autoComplete="given-name" className="field-input" />)}
                            {field('Soyad', <input name="lastname" required autoComplete="family-name" className="field-input" />)}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {field('İl', <input name="city" required autoComplete="address-level1" className="field-input" />)}
                            {field('İlçe', <input name="district" required autoComplete="address-level2" className="field-input" />)}
                        </div>
                        {field('Açık adres', (
                            <textarea name="addressLine" required rows={3} autoComplete="street-address" className="field-input min-h-[76px]" />
                        ))}
                        <label className="flex items-center gap-2.5 text-[13.5px]">
                            <input type="checkbox" defaultChecked className="field-checkbox accent-accent-500" />
                            Fatura adresim aynı olsun
                        </label>
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
                                            Tahmini {option.estimatedDays.min}
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
                        <div className="flex flex-wrap gap-2">
                            {([
                                ['card', 'Kredi / banka kartı'],
                                ['transfer', 'Havale / EFT'],
                            ] as const).map(([value, label]) => (
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
                            <span className="badge badge-teal ml-auto">
                                <span className="dot-lg dot bg-teal-dot" />
                                3D Secure
                            </span>
                        </div>

                        {method === 'card' ? (
                            <>
                                <p className="text-[13px] leading-relaxed text-slate-600">
                                    Kart bilgileri bu sayfada istenmez. &ldquo;Siparişi tamamla&rdquo; dediğinde bankanın
                                    güvenli 3D Secure sayfasına yönlendirilirsin.
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

                        {field('Sipariş notu (isteğe bağlı)', (
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

                    <label className="mt-4 flex items-start gap-2.5 text-[12.5px] leading-relaxed">
                        <input type="checkbox" required className="field-checkbox mt-0.5 accent-accent-500" />
                        <span>Ön bilgilendirme formunu ve mesafeli satış sözleşmesini okudum, onaylıyorum.</span>
                    </label>

                    <SubmitButton
                        className="btn-primary mt-4 min-h-[54px] w-full justify-center rounded-[14px]"
                        pendingLabel="Sipariş oluşturuluyor…"
                        disabled={!shippingRateId}
                    >
                        Siparişi tamamla
                    </SubmitButton>

                    <ul className="mt-4 space-y-2">
                        {[
                            ['bg-on-dark-berry', 'Kargo etiketinde içerik bilgisi yok'],
                            ['bg-plum-dot', 'Ekstrede OZM DIŞ TİC. yazar'],
                            ['bg-teal-dot', '3D Secure ile korunan ödeme'],
                        ].map(([dot, text]) => (
                            <li key={text} className="flex items-start gap-2.5 text-[12px] text-slate-600">
                                <span className={`dot mt-1.5 ${dot}`} />
                                {text}
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>
        </form>
    );
}
