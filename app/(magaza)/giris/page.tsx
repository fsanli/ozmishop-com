import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import Container from '@/components/Container';
import SubmitButton from '@/components/form/SubmitButton';
import { getCurrentCustomer } from '@/lib/session';
import { getLegalStatus, getSettings } from '@/lib/api';
import { one, type SearchParams } from '@/lib/listing';
import PhoneField from '@/components/form/PhoneField';
import { routes } from '@/lib/site';
import { forgotPasswordAction, loginAction, registerAction } from './actions';
import FieldLabel, { RequiredNote } from '@/components/form/FieldLabel';

export const metadata: Metadata = {
    title: 'Giriş yap',
    // Girişe ihtiyacı olan bağlantılar izlensin ama sayfa indekslenmesin.
    robots: { index: false, follow: true },
};

// Yalnızca ÇALIŞAN özellikler vaat edilir. "Tekrar sipariş kısayolu" burada
// yazıyordu ama böyle bir özellik yok; puan maddesi de puan sistemi kapalıyken
// olmayan bir programı vaat ediyordu.
const PERKS = [
    { dot: 'bg-on-dark-berry', title: 'Gizlilik modu', body: 'PIN, nötr ekstre adı ve nötr e-posta konusu hesabından yönetilir.' },
    { dot: 'bg-on-dark-amber', title: 'Puan biriktir', body: 'Her siparişte ve değerlendirmede puan kazanırsın.', needsPoints: true },
    { dot: 'bg-on-dark-teal', title: 'Kayıtlı adresler', body: 'Ödeme adımında adresini yeniden yazmazsın.' },
    { dot: 'bg-on-dark-plum', title: 'Sipariş takibi', body: 'Siparişlerin, kargo durumu ve iade taleplerin tek yerde.' },
] as const;

/** Form akarken duran iskelet; kart ölçüsü aynı kalır, sayfa zıplamaz. */
function LoginPanelSkeleton() {
    return (
        <div className="card card-xl min-w-0 flex-[1_1_320px] p-[clamp(24px,3.4vw,40px)] sm:max-w-[460px]">
            <div className="h-11 animate-pulse rounded-[14px] bg-slate-100" />
            <div className="mt-6 h-7 w-52 animate-pulse rounded bg-slate-100" />
            <div className="mt-3 h-12 animate-pulse rounded bg-slate-100" />
            <div className="mt-5 space-y-3.5">
                <div className="h-[70px] animate-pulse rounded bg-slate-100" />
                <div className="h-[70px] animate-pulse rounded bg-slate-100" />
                <div className="h-[54px] animate-pulse rounded-[14px] bg-slate-100" />
            </div>
        </div>
    );
}

async function LoginPanel({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const [customer, params, settings, legal] = await Promise.all([getCurrentCustomer(), searchParams, getSettings(), getLegalStatus()]);
    const slugOf = (key: string, fallback: string) => legal.documents.find((doc) => doc.key === key)?.slug ?? fallback;
    const pointsOn = settings['puan.aktif'] === true;
    const screen = one(params.ekran);
    const isRegister = screen === 'kayit';
    const error = one(params.hata);
    const next = one(params.devam) ?? routes.account;

    const tab = (href: string, label: string, active: boolean) => (
        <Link
            href={href}
            className={`flex-1 rounded-[10px] px-4 py-2.5 text-center text-[13.5px] font-bold transition-colors ${
                active ? 'bg-slate-900 text-on-dark' : 'text-slate-600 hover:text-slate-900'
            }`}
        >
            {label}
        </Link>
    );

    // Zaten girişliyse form göstermenin anlamı yok. Yönlendirme YAPILMAZ:
    // bu bileşen bir Suspense sınırının içinde akıyor ve akış başladıktan sonra
    // durum kodu değiştirilemez — sessiz bir sıçrama yerine açık bir kart.
    if (customer) {
        return (
            <div className="card card-xl min-w-0 flex-[1_1_320px] p-[clamp(24px,3.4vw,40px)] sm:max-w-[460px]">
                <span className="kicker text-accent-500">Hesabım</span>
                <h1 className="heading-2 mt-2.5">Zaten giriş yaptın</h1>
                <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                    {customer.firstname} olarak oturum açıksın. Siparişlerine ve favorilerine hesabından ulaşabilirsin.
                </p>
                <div className="mt-6 flex flex-wrap gap-2.5">
                    <Link href={routes.account} className="btn-accent">Hesabıma git</Link>
                    <Link href={routes.home} className="btn-soft">Alışverişe devam et</Link>
                </div>
            </div>
        );
    }

    if (screen === 'sifre-unuttum') {
        return <ForgotPasswordPanel error={error} sent={one(params.gonderildi) === '1'} />;
    }

    const passwordReset = one(params.parola) === 'yenilendi';

    return (
        <div className="card card-xl min-w-0 flex-[1_1_320px] p-[clamp(24px,3.4vw,40px)] sm:max-w-[460px]">
            <div className="flex gap-1 rounded-[14px] bg-slate-100 p-[5px]">
                {tab(routes.login, 'Giriş yap', !isRegister)}
                {tab(routes.register, 'Üye ol', isRegister)}
            </div>

            <h1 className="heading-2 mt-6">{isRegister ? 'Hesap oluştur' : 'Tekrar hoş geldin'}</h1>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                {isRegister
                    ? 'Hesabını bir dakikada oluştur. Adresini ilk siparişinde kaydedersin; sonrakilerde yalnızca seçersin.'
                    : `Siparişlerini takip et${pointsOn ? ', favorilerine dön ve puanlarını kullan' : ' ve favorilerine dön'}. Giriş yapmak zorunda değilsin — misafir olarak da alışveriş yapabilirsin.`}
            </p>

            {error && (
                <p role="alert" className="mt-4 rounded-[var(--radius-md)] bg-accent-200 px-4 py-3 text-[13.5px] font-semibold text-accent-500">
                    {error}
                </p>
            )}
            {passwordReset && !isRegister && !error && (
                <p role="status" className="mt-4 rounded-[var(--radius-md)] bg-teal-tint px-4 py-3 text-[13.5px] font-semibold text-teal-ink">
                    Parolan yenilendi. Yeni parolanla giriş yapabilirsin.
                </p>
            )}

            <form action={isRegister ? registerAction : loginAction} className="mt-5 space-y-3.5">
                <input type="hidden" name="devam" value={next} />
                {isRegister && <RequiredNote />}

                {isRegister && (
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                            <FieldLabel required>Ad</FieldLabel>
                            <input name="firstname" required autoComplete="given-name" className="field-input" />
                        </label>
                        <label className="block">
                            <FieldLabel required>Soyad</FieldLabel>
                            <input name="lastname" required autoComplete="family-name" className="field-input" />
                        </label>
                    </div>
                )}

                <label className="block">
                    <FieldLabel required>E-posta</FieldLabel>
                    <input name="email" type="email" required autoComplete="email" placeholder="ornek@eposta.com" className="field-input" />
                </label>

                {isRegister && (
                    <label className="block">
                        <FieldLabel required>Telefon</FieldLabel>
                        <PhoneField />
                    </label>
                )}

                <label className="block">
                    <FieldLabel required>Şifre</FieldLabel>
                    <input
                        name="password"
                        type="password"
                        required
                        minLength={8}
                        autoComplete={isRegister ? 'new-password' : 'current-password'}
                        placeholder={isRegister ? 'En az 8 karakter' : '••••••••'}
                        className="field-input"
                    />
                </label>

                {!isRegister && (
                    <p className="-mt-1.5 text-right text-[12.5px]">
                        <Link href={routes.forgotPassword} className="link">Şifremi unuttum</Link>
                    </p>
                )}

                {/* AYRI kutular: tek kutuda "18 yaş + koşullar" hangisine onay
                    verildiğini belirsiz bırakıyordu. Ticari ileti opsiyonel;
                    KVKK için kutu YOK — aydınlatma bir onay değil, bilgilendirme. */}
                {isRegister && (
                    <div className="space-y-2.5 text-[13px] leading-relaxed">
                        <label className="flex items-start gap-2.5">
                            <input type="checkbox" name="uyelik" required className="field-checkbox mt-0.5 accent-accent-500" />
                            <span>
                                <a href={routes.page(slugOf('uyelik', 'uyelik-sozlesmesi'))} target="_blank" rel="noopener" className="link">Üyelik sözleşmesini</a>
                                {' '}okudum, kabul ediyorum. <span aria-hidden className="text-accent-500">*</span>
                            </span>
                        </label>
                        <label className="flex items-start gap-2.5">
                            <input type="checkbox" name="yas" required className="field-checkbox mt-0.5 accent-accent-500" />
                            <span>18 yaşından büyüğüm. <span aria-hidden className="text-accent-500">*</span></span>
                        </label>
                        <label className="flex items-start gap-2.5">
                            <input type="checkbox" name="ticariIleti" className="field-checkbox mt-0.5 accent-accent-500" />
                            <span>Kampanya ve yeniliklerden e-postayla haberdar olmak istiyorum.</span>
                        </label>
                        <p className="text-[12px] text-slate-600">
                            Kişisel verilerin{' '}
                            <a href={routes.page(slugOf('kvkk', 'kvkk-aydinlatma-metni'))} target="_blank" rel="noopener" className="underline underline-offset-2">KVKK Aydınlatma Metni</a>
                            {' '}kapsamında işlenir.
                        </p>
                    </div>
                )}

                <SubmitButton
                    className="btn-primary min-h-[54px] w-full justify-center rounded-[14px]"
                    pendingLabel={isRegister ? 'Hesap oluşturuluyor…' : 'Giriş yapılıyor…'}
                >
                    {isRegister ? 'Hesabı oluştur' : 'Giriş yap'}
                </SubmitButton>
            </form>

            <div className="my-5 flex items-center gap-3 text-[12px] text-slate-500">
                <span className="h-px flex-1 bg-slate-900/8" />
                veya
                <span className="h-px flex-1 bg-slate-900/8" />
            </div>

            <Link href={routes.checkout} className="btn-secondary w-full justify-center">
                Üye olmadan devam et
            </Link>
            <p className="mt-3 text-[12px] leading-relaxed text-slate-600">
                Misafir olarak da sipariş verebilirsin; sipariş takibi e-postana gelir.
            </p>
        </div>
    );
}

/**
 * "Şifremi unuttum". Gönderildi mesajı adres kayıtlı olsa da olmasa da aynı:
 * ekran hangi adresin müşteri olduğunu ele vermemeli.
 */
function ForgotPasswordPanel({ error, sent }: { error?: string; sent: boolean }) {
    return (
        <div className="card card-xl min-w-0 flex-[1_1_320px] p-[clamp(24px,3.4vw,40px)] sm:max-w-[460px]">
            <span className="kicker text-accent-500">Hesabım</span>
            <h1 className="heading-2 mt-2.5">Şifreni mi unuttun?</h1>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                Hesabının e-posta adresini yaz; parolanı yenilemen için bir bağlantı gönderelim.
            </p>

            {error && (
                <p role="alert" className="mt-4 rounded-[var(--radius-md)] bg-accent-200 px-4 py-3 text-[13.5px] font-semibold text-accent-500">
                    {error}
                </p>
            )}
            {sent ? (
                <div role="status" className="mt-5 rounded-[var(--radius-md)] bg-teal-tint px-4 py-3 text-[13.5px] leading-relaxed text-teal-ink">
                    <strong className="font-bold">Bu adres kayıtlıysa bağlantıyı gönderdik.</strong> Bağlantı 60 dakika
                    geçerli ve yalnız bir kez kullanılabilir. Birkaç dakika içinde gelmezse gereksiz (spam) klasörüne bak.
                </div>
            ) : (
                <form action={forgotPasswordAction} className="mt-5 space-y-3.5">
                    <label className="block">
                        <FieldLabel required>E-posta</FieldLabel>
                        <input name="email" type="email" required autoComplete="email" placeholder="ornek@eposta.com" className="field-input" />
                    </label>
                    <SubmitButton className="btn-primary min-h-[54px] w-full justify-center rounded-[14px]" pendingLabel="Gönderiliyor…">
                        Bağlantı gönder
                    </SubmitButton>
                </form>
            )}

            <p className="mt-5 text-[13px]">
                <Link href={routes.login} className="link">← Girişe dön</Link>
            </p>
        </div>
    );
}

/** Koyu vaat paneli. Ayarlar önbellekten okunur; sayfanın statik kabuğunda kalır. */
async function MembershipPerks() {
    const settings = await getSettings();
    const pointsOn = settings['puan.aktif'] === true;
    const perks = PERKS.filter((perk) => !('needsPoints' in perk) || pointsOn);

    return (
        <div className="block-dark-soft min-w-0 flex-[1_1_300px] p-[clamp(24px,3.4vw,40px)] sm:max-w-[420px]">
            <h2 className="heading-3 text-on-dark">Üyeliğin ne işine yarar?</h2>
            <ul className="mt-5 space-y-4">
                {perks.map((perk) => (
                    <li key={perk.title} className="flex items-start gap-3">
                        <span className={`dot-lg dot mt-1.5 ${perk.dot}`} />
                        <span className="min-w-0">
                            <span className="block text-[14px] font-bold">{perk.title}</span>
                            <span className="mt-0.5 block text-[13px] leading-relaxed text-on-dark/60">{perk.body}</span>
                        </span>
                    </li>
                ))}
            </ul>
            <p className="mt-6 border-t border-on-dark/10 pt-4 text-[12.5px] leading-relaxed text-on-dark/55">
                Hesabını istediğin zaman silebilirsin. Sipariş geçmişin fatura yükümlülüğü gereği
                saklanır ama hesabından gizlenir.
            </p>
        </div>
    );
}

export default function LoginPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    return (
        <Container className="pt-[clamp(18px,3vw,30px)]">
            <div className="flex flex-wrap items-start gap-[clamp(18px,3vw,44px)]">
                {/* Form oturuma ve adrese bakar; koyu vaat paneli STATİK kalsın diye
                    sınır burada. Böylece sayfanın kabuğu prerender edilebiliyor. */}
                <Suspense fallback={<LoginPanelSkeleton />}>
                    <LoginPanel searchParams={searchParams} />
                </Suspense>

                <MembershipPerks />
            </div>
        </Container>
    );
}
