import type { Metadata } from 'next';
import Link from 'next/link';
import SubmitButton from '@/components/form/SubmitButton';
import { formatDate } from '@/lib/format';
import { one, type SearchParams } from '@/lib/listing';
import { requireCustomer } from '@/lib/session';
import { routes } from '@/lib/site';
import AccountShell from '../AccountShell';
import { changePasswordAction, updateProfileAction } from '../actions';

export const metadata: Metadata = { title: 'Hesap güvenliği', robots: { index: false, follow: false } };

const SAVED: Record<string, string> = {
    bilgiler: 'Hesap bilgilerin güncellendi.',
    parola: 'Parolan değiştirildi. Açık oturumların etkilenmedi.',
};

export default async function SecurityPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const [customer, params] = await Promise.all([requireCustomer(), searchParams]);

    const error = one(params.hata);
    const saved = SAVED[one(params.kaydedildi) ?? ''];

    return (
        <AccountShell
            active={routes.accountSecurity}
            title="Hesap güvenliği"
            description="Giriş bilgilerin ve iletişim bilgilerin. Sipariş geçmişini PIN ile kapatmak istersen Gizlilik modu sayfasında."
        >
            {error && (
                <p role="alert" className="mb-4 rounded-[var(--radius-md)] bg-accent-200 px-4 py-3 text-[13.5px] font-semibold text-accent-500">
                    {error}
                </p>
            )}
            {saved && (
                <p role="status" className="mb-4 rounded-[var(--radius-md)] bg-teal-tint px-4 py-3 text-[13.5px] font-semibold text-teal-ink">
                    {saved}
                </p>
            )}

            <form action={updateProfileAction} className="card card-xl card-edge-top border-t-amber-dot p-[clamp(20px,3vw,28px)]">
                <h3 className="heading-3">Hesap bilgilerim</h3>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label>
                        <span className="field-label">Ad</span>
                        <input name="firstname" required minLength={2} maxLength={60} autoComplete="given-name"
                            defaultValue={customer.firstname} className="field-input" />
                    </label>
                    <label>
                        <span className="field-label">Soyad</span>
                        <input name="lastname" required minLength={2} maxLength={60} autoComplete="family-name"
                            defaultValue={customer.lastname} className="field-input" />
                    </label>
                    <label className="sm:col-span-2">
                        <span className="field-label">Telefon</span>
                        <input name="phone" required inputMode="tel" maxLength={20} autoComplete="tel"
                            defaultValue={customer.phone ?? ''} className="field-input" />
                    </label>
                </div>

                {/* E-posta alanı bilerek kilitli: oturum jetonunun içinde duruyor
                    ve misafir siparişlerinin hesaba bağlanması da ona bakıyor.
                    Değiştirmek ayrı bir doğrulama akışı ister. */}
                <label className="mt-3 block">
                    <span className="field-label">E-posta</span>
                    <input value={customer.email} readOnly disabled className="field-input" />
                    <span className="mt-1.5 block text-[12px] text-slate-600">
                        E-posta adresi değiştirilemez. Değiştirmen gerekiyorsa destek hattından yazabilirsin.
                    </span>
                </label>

                <div className="mt-5">
                    <SubmitButton className="btn-accent">Bilgileri kaydet</SubmitButton>
                </div>
            </form>

            <form action={changePasswordAction} className="card card-xl mt-4 p-[clamp(20px,3vw,28px)]">
                <h3 className="heading-3">Parolamı değiştir</h3>
                <p className="mt-1.5 max-w-[60ch] text-[13px] leading-relaxed text-slate-600">
                    Mevcut parolan her zaman sorulur: birisi açık bir oturumu ele geçirmiş olsa bile parolayı değiştiremesin.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                        <span className="field-label">Mevcut parola</span>
                        <input type="password" name="currentPassword" required autoComplete="current-password" className="field-input" />
                    </label>
                    <label>
                        <span className="field-label">Yeni parola</span>
                        <input type="password" name="newPassword" required minLength={6} maxLength={72} autoComplete="new-password" className="field-input" />
                    </label>
                    <label>
                        <span className="field-label">Yeni parola (tekrar)</span>
                        <input type="password" name="newPasswordRepeat" required minLength={6} maxLength={72} autoComplete="new-password" className="field-input" />
                    </label>
                </div>

                <div className="mt-5">
                    <SubmitButton className="btn-accent">Parolayı değiştir</SubmitButton>
                </div>
            </form>

            <div className="card mt-4 p-[20px_22px]">
                <h3 className="text-[15px] font-bold">Hesap durumu</h3>
                <dl className="mt-3 grid gap-2.5 text-[13px] sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                        <span className="dot bg-teal-dot" />
                        <dt className="text-slate-600">Üyelik başlangıcı:</dt>
                        <dd className="font-semibold">{formatDate(customer.createdAt)}</dd>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="dot bg-amber-dot" />
                        <dt className="text-slate-600">Son giriş:</dt>
                        <dd className="font-semibold">{customer.lastLoginAt ? formatDate(customer.lastLoginAt) : 'İlk oturum'}</dd>
                    </div>
                </dl>
                <p className="mt-4 text-[12.5px] leading-relaxed text-slate-600">
                    Sipariş geçmişini PIN ile kapatmak, nötr ekstre adını ya da hızlı çıkış tuşunu yönetmek için{' '}
                    <Link href={routes.accountPrivacy} className="link">Gizlilik modu</Link> sayfasına bak.
                </p>
            </div>
        </AccountShell>
    );
}
