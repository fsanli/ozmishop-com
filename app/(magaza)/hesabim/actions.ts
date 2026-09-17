'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import {
    changePassword, createReturn, createReview, deleteAddress, hideOrderHistory,
    saveAddress, toggleFavorite, updateNotifications, updatePrivacy, updateProfile,
} from '@/lib/account';
import { routes } from '@/lib/site';

/**
 * Hesabım aksiyonları. Hepsi düz `<form action={...}>` ile çağrılır:
 * gizlilik toggle'ları dahil sıfır istemci JS, JavaScript kapalıyken de çalışır.
 */
const withError = (path: string, message: string) => `${path}?hata=${encodeURIComponent(message)}`;

export async function saveAddressAction(formData: FormData) {
    const value = (name: string) => String(formData.get(name) ?? '').trim();
    const id = Number(formData.get('id')) || null;

    try {
        await saveAddress(id, {
            title: value('title'),
            firstname: value('firstname'),
            lastname: value('lastname'),
            phone: value('phone'),
            city: value('city'),
            district: value('district'),
            neighbourhood: value('neighbourhood') || null,
            addressLine: value('addressLine'),
            postalCode: value('postalCode') || null,
            isDefaultShipping: formData.get('isDefaultShipping') === 'on',
        });
    } catch (error) {
        redirect(withError(routes.addresses, (error as Error).message));
    }
    redirect(routes.addresses);
}

export async function deleteAddressAction(formData: FormData) {
    try {
        await deleteAddress(Number(formData.get('id')));
    } catch (error) {
        redirect(withError(routes.addresses, (error as Error).message));
    }
    refresh();
}

/**
 * Gizlilik anahtarı. Her satır kendi formunda; `anahtar` hangi ayarın
 * değiştiğini, `deger` yeni değeri söyler. İstemci durumu yok.
 */
export async function togglePrivacyAction(formData: FormData) {
    const key = String(formData.get('anahtar'));
    const next = formData.get('deger') === '1';
    try {
        await updatePrivacy({ [key]: next });
    } catch (error) {
        redirect(withError(routes.accountPrivacy, (error as Error).message));
    }
    refresh();
}

export async function setPinAction(formData: FormData) {
    const pin = String(formData.get('pin') ?? '').trim();
    try {
        await updatePrivacy({ pin: pin === '' ? null : pin });
    } catch (error) {
        redirect(withError(routes.accountPrivacy, (error as Error).message));
    }
    refresh();
}

export async function toggleNotificationAction(formData: FormData) {
    const key = String(formData.get('anahtar'));
    const next = formData.get('deger') === '1';
    try {
        await updateNotifications({ [key]: next });
    } catch (error) {
        redirect(withError(routes.accountNotifications, (error as Error).message));
    }
    refresh();
}

/** Geçmişi GİZLER, silmez. Metin de böyle: fatura kayıtları saklanmak zorunda. */
export async function hideHistoryAction() {
    await hideOrderHistory();
    redirect(routes.accountOrders);
}

export async function createReviewAction(formData: FormData) {
    const slug = String(formData.get('slug'));
    const value = (name: string) => String(formData.get(name) ?? '').trim();

    try {
        await createReview(slug, {
            rating: Number(formData.get('rating')),
            title: value('title') || null,
            body: value('body'),
            // Boş bırakılırsa API "Ad S." biçiminde üretir; yayında gerçek ad
            // hiçbir koşulda görünmez.
            pseudonym: value('pseudonym') || null,
        });
    } catch (error) {
        redirect(withError(routes.accountReviews, (error as Error).message));
    }
    redirect(`${routes.accountReviews}?gonderildi=1`);
}

export async function createReturnAction(formData: FormData) {
    const orderNumber = String(formData.get('orderNumber'));
    // Kullanıcı hangi satırları iade edeceğini kutucuklarla seçer; her kutucuğun
    // değeri "orderItemId:quantity".
    const items = formData.getAll('kalem')
        .map((raw) => String(raw).split(':'))
        .map(([orderItemId, quantity]) => ({
            orderItemId: Number(orderItemId),
            quantity: Number(quantity),
        }))
        .filter((item) => item.orderItemId > 0 && item.quantity > 0);

    if (items.length === 0) {
        redirect(withError(routes.accountReturns, 'İade etmek istediğin ürünü seç.'));
    }

    try {
        await createReturn(orderNumber, {
            reason: String(formData.get('reason') ?? '').trim(),
            note: String(formData.get('note') ?? '').trim() || null,
            items,
        });
    } catch (error) {
        redirect(withError(routes.accountReturns, (error as Error).message));
    }
    redirect(`${routes.accountReturns}?olusturuldu=1`);
}

export async function updateProfileAction(formData: FormData) {
    const value = (name: string) => String(formData.get(name) ?? '').trim();

    try {
        await updateProfile({ firstname: value('firstname'), lastname: value('lastname'), phone: value('phone') });
    } catch (error) {
        redirect(withError(routes.accountSecurity, (error as Error).message));
    }
    redirect(`${routes.accountSecurity}?kaydedildi=bilgiler`);
}

export async function changePasswordAction(formData: FormData) {
    const current = String(formData.get('currentPassword') ?? '');
    const next = String(formData.get('newPassword') ?? '');
    const repeat = String(formData.get('newPasswordRepeat') ?? '');

    if (next !== repeat) {
        redirect(withError(routes.accountSecurity, 'Yeni parolalar birbirini tutmuyor.'));
    }

    try {
        await changePassword(current, next);
    } catch (error) {
        redirect(withError(routes.accountSecurity, (error as Error).message));
    }
    redirect(`${routes.accountSecurity}?kaydedildi=parola`);
}

export async function toggleFavoriteAction(formData: FormData) {
    await toggleFavorite(Number(formData.get('baseProductId')));
    refresh();
}
