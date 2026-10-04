'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { mergeGuestCart } from '@/lib/account';
import { proxyHeaders } from '@/lib/bff';
import {
    CART_COOKIE, CART_COUNT_COOKIE, CART_MAX_AGE, COOKIE_BASE, SESSION_COOKIE, SESSION_MAX_AGE,
} from '@/lib/session';
import { normalisePhone, phoneError } from '@/lib/phone';
import { routes } from '@/lib/site';

const API_BASE = (process.env.API_BASE_URL || 'http://localhost:4200').replace(/\/$/, '');

/** Hata adrese yazılır; sayfa onu basar. Giriş formu istemci bileşeni olmaz. */
const fail = (path: string, message: string, next?: string) => {
    const search = new URLSearchParams({ hata: message });
    if (next) search.set('devam', next);
    return `${path}?${search.toString()}`;
};

/**
 * Giriş ve kayıt aynı akışı paylaşır: API jetonu döner, jeton httpOnly çereze
 * yazılır ve TARAYICIYA HİÇ VERİLMEZ. Ardından misafir sepeti hesaba taşınır.
 */
async function authenticate(path: string, body: Record<string, unknown>, formPath: string, next: string) {
    let token: string;
    try {
        const response = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            cache: 'no-store',
            // Giriş/kayıt "sıkı" hız sınırında (30/dk). Gerçek IP iletilmezse tüm
            // müşteriler tek kovaya düşer ve bir kişi herkesin girişini kilitler.
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(await proxyHeaders()) },
            body: JSON.stringify(body),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.token) throw new Error(result.message || 'İşlem tamamlanamadı');
        token = result.token;
    } catch (error) {
        redirect(fail(formPath, (error as Error).message, next));
    }

    const jar = await cookies();
    jar.set(SESSION_COOKIE, token, { ...COOKIE_BASE, maxAge: SESSION_MAX_AGE });

    // Misafirken doldurulan sepet kaybolmasın.
    const guestCart = jar.get(CART_COOKIE)?.value;
    if (guestCart) {
        try {
            const merged = await mergeGuestCart(guestCart);
            jar.set(CART_COOKIE, merged.token, { ...COOKIE_BASE, maxAge: CART_MAX_AGE });
            jar.set(CART_COUNT_COOKIE, String(merged.itemCount), {
                ...COOKIE_BASE, httpOnly: false, maxAge: CART_MAX_AGE,
            });
        } catch {
            // Birleştirme başarısızsa giriş yine de geçerli; sepet misafirde kalır.
        }
    }

    redirect(next || routes.account);
}

export async function loginAction(formData: FormData) {
    const next = String(formData.get('devam') || routes.account);
    await authenticate('/auth/users/login', {
        email: String(formData.get('email') || '').trim(),
        password: String(formData.get('password') || ''),
    }, routes.login, next);
}

export async function registerAction(formData: FormData) {
    const next = String(formData.get('devam') || routes.account);
    const phone = String(formData.get('phone') || '');

    // Maske istemcide; GERÇEK KAPI burada. JavaScript kapalıyken alan hiç
    // biçimlenmez, o yüzden doğrulama sunucuda tekrarlanmak zorunda.
    const invalid = phoneError(phone);
    if (invalid) redirect(`${routes.register}?hata=${encodeURIComponent(invalid)}&devam=${encodeURIComponent(next)}`);
    // JavaScript kapalıyken `required` çalışmaz: iki zorunlu onay sunucuda da denetlenir.
    if (formData.get('uyelik') !== 'on' || formData.get('yas') !== 'on') {
        redirect(`${routes.register}?hata=${encodeURIComponent('Üyelik sözleşmesini kabul etmen ve 18 yaşından büyük olduğunu onaylaman gerekiyor.')}&devam=${encodeURIComponent(next)}`);
    }

    await authenticate('/auth/users/register', {
        firstname: String(formData.get('firstname') || '').trim(),
        lastname: String(formData.get('lastname') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        phone: normalisePhone(phone),
        password: String(formData.get('password') || ''),
        // Onay KANITI API'de IP ve sürümle yazılır.
        consents: { membership: true, ageConfirmed: true, marketing: formData.get('ticariIleti') === 'on' },
    }, routes.register, next);
}

/** Hata gövdesini okuyup fırlatan sade POST; jeton dönmeyen uçlar için. */
async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(await proxyHeaders()) },
        body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || 'İşlem tamamlanamadı');
    return result as T;
}

/**
 * "Şifremi unuttum". Cevap adres kayıtlı olsa da olmasa da AYNI: ekran hangi
 * adresin müşteri olduğunu ele vermemeli. Yalnız biçim hatası gösterilir.
 */
export async function forgotPasswordAction(formData: FormData) {
    const email = String(formData.get('email') || '').trim();
    try {
        await postJson('/auth/users/password/forgot', { email });
    } catch (error) {
        redirect(fail(routes.forgotPassword, (error as Error).message));
    }
    redirect(`${routes.forgotPassword}&gonderildi=1`);
}

export async function resetPasswordAction(formData: FormData) {
    const token = String(formData.get('t') || '');
    const password = String(formData.get('password') || '');
    const repeat = String(formData.get('passwordRepeat') || '');
    const back = (message: string) => `${routes.resetPassword}?${new URLSearchParams({ t: token, hata: message })}`;

    if (password !== repeat) redirect(back('Parolalar birbirini tutmuyor.'));
    try {
        await postJson('/auth/users/password/reset', { token, password });
    } catch (error) {
        redirect(back((error as Error).message));
    }
    // Oturum AÇILMAZ: yeni parolayla bir kez giriş yapmak, bağlantının yanlış
    // ellere geçtiği durumda bile hesabı doğrudan teslim etmemek demek.
    redirect(`${routes.login}?parola=yenilendi`);
}

export async function logoutAction() {
    const jar = await cookies();
    jar.delete(SESSION_COOKIE);
    redirect(routes.home);
}
