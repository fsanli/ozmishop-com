import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import Container from '@/components/Container';
import FieldLabel from '@/components/form/FieldLabel';
import SubmitButton from '@/components/form/SubmitButton';
import { proxyHeaders } from '@/lib/bff';
import { one, type SearchParams } from '@/lib/listing';
import { routes } from '@/lib/site';
import { resetPasswordAction } from '../giris/actions';

export const metadata: Metadata = {
    title: 'Parolanı yenile',
    robots: { index: false, follow: false },
    // Adresteki tek kullanımlık anahtar, sayfadan çıkan isteklerde Referer
    // başlığıyla başka sitelere gitmesin.
    referrer: 'no-referrer',
};

const API_BASE = (process.env.API_BASE_URL || 'http://localhost:4200').replace(/\/$/, '');
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,100}$/;

/** Formu açmadan önce bağlantıyı denetler: süresi dolmuş bağlantıya parola yazdırmayalım. */
async function isValidToken(token: string): Promise<boolean> {
    if (!TOKEN_PATTERN.test(token)) return false;
    try {
        const response = await fetch(`${API_BASE}/auth/users/password/reset/check`, {
            method: 'POST',
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(await proxyHeaders()) },
            body: JSON.stringify({ token }),
        });
        const result = await response.json().catch(() => ({}));
        return response.ok && result.valid === true;
    } catch {
        return false;
    }
}

const CARD = 'card card-xl mx-auto max-w-[460px] p-[clamp(24px,3.4vw,40px)]';

async function ResetPanel({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const params = await searchParams;
    const token = one(params.t) ?? '';
    const error = one(params.hata);

    if (!(await isValidToken(token))) {
        return (
            <div className={CARD}>
                <span className="kicker text-accent-500">Parola</span>
                <h1 className="heading-2 mt-2.5">Bağlantı geçersiz</h1>
                <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                    Bu bağlantının süresi dolmuş ya da daha önce kullanılmış. Yeni bir bağlantı istediğinde
                    öncekiler de geçersiz olur — en son gelen e-postadaki bağlantıyı kullan.
                </p>
                <Link href={routes.forgotPassword} className="btn-primary mt-6 min-h-[50px] w-full justify-center rounded-[14px]">
                    Yeni bağlantı iste
                </Link>
            </div>
        );
    }

    return (
        <div className={CARD}>
            <span className="kicker text-accent-500">Parola</span>
            <h1 className="heading-2 mt-2.5">Yeni parolanı belirle</h1>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                Parolan değişince diğer cihazlardaki oturumların kapanır.
            </p>

            {error && (
                <p role="alert" className="mt-4 rounded-[var(--radius-md)] bg-accent-200 px-4 py-3 text-[13.5px] font-semibold text-accent-500">
                    {error}
                </p>
            )}

            <form action={resetPasswordAction} className="mt-5 space-y-3.5">
                <input type="hidden" name="t" value={token} />
                <label className="block">
                    <FieldLabel required>Yeni parola</FieldLabel>
                    <input name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" placeholder="En az 8 karakter" className="field-input" />
                </label>
                <label className="block">
                    <FieldLabel required>Yeni parola (tekrar)</FieldLabel>
                    <input name="passwordRepeat" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className="field-input" />
                </label>
                <SubmitButton className="btn-primary min-h-[54px] w-full justify-center rounded-[14px]" pendingLabel="Kaydediliyor…">
                    Parolayı yenile
                </SubmitButton>
            </form>
        </div>
    );
}

export default function ResetPasswordPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    return (
        <Container className="pt-[clamp(18px,3vw,30px)]">
            <Suspense fallback={<div className={`${CARD} h-[380px] animate-pulse`} />}>
                <ResetPanel searchParams={searchParams} />
            </Suspense>
        </Container>
    );
}
