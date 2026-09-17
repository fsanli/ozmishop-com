import 'server-only';
import { accountFetch } from './session';
import type {
    AccountOrder, Address, Cart, Customer, MyReview, NotificationPrefs,
    Order, PointsSummary, PrivacySettings, ProductCard, ReturnRequest,
} from './types';

/**
 * Hesabım veri erişim katmanı. Her fonksiyon oturumu KENDİ çözer; çağırandan
 * `customerId` almaz — kimliği parametre olarak taşımak, bir yerde yanlış
 * id geçirildiğinde başkasının verisini döndürme riskidir.
 *
 * Hiçbiri önbelleklenmez: hesap verisi read-your-own-writes.
 */

export const getMyOrders = () => accountFetch<{ items: AccountOrder[] }>('/users/me/orders');
/**
 * Tek siparişin dolu detayı (kalem id'leri, kargo, geçmiş). İade formu kalem
 * id'lerine ihtiyaç duyuyor; liste ucu onları taşımıyor.
 */
export const getMyOrder = (orderNumber: string) =>
    accountFetch<Order>(`/orders/${encodeURIComponent(orderNumber)}`);
export const getMyAddresses = () => accountFetch<{ items: Address[] }>('/users/me/addresses');
export const getMyFavorites = () => accountFetch<{ items: ProductCard[] }>('/users/me/favorites');
export const getMyPoints = () => accountFetch<PointsSummary>('/users/me/points');
export const getMyPrivacy = () => accountFetch<PrivacySettings>('/users/me/privacy');
export const getMyNotifications = () => accountFetch<NotificationPrefs>('/users/me/notifications');
export const getMyReviews = () => accountFetch<{
    items: MyReview[];
    awaiting: { name: string; slug: string; orderNumber: string }[];
}>('/users/me/reviews');
export const getMyReturns = () => accountFetch<{ items: ReturnRequest[] }>('/users/me/returns');

/** Değerlendirme yaz. API yalnızca teslim alınmış ürünlere izin verir. */
export const createReview = (slug: string, payload: Record<string, unknown>) =>
    accountFetch<{ id: number; status: string }>(`/catalog/products/${slug}/reviews`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });

/** İade talebi. Sipariş numarası üzerinden — id vitrinde hiç görünmez. */
export const createReturn = (orderNumber: string, payload: Record<string, unknown>) =>
    accountFetch<ReturnRequest>(`/orders/${encodeURIComponent(orderNumber)}/returns`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });

/** Hesap bilgileri (ad, soyad, telefon). E-posta değiştirilemez. */
export const updateProfile = (payload: Record<string, unknown>) =>
    accountFetch<Customer>('/users/me', { method: 'PATCH', body: JSON.stringify(payload) });

export const changePassword = (currentPassword: string, newPassword: string) =>
    accountFetch<{ ok: true }>('/users/me/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
    });

export const saveAddress = (id: number | null, payload: Record<string, unknown>) =>
    accountFetch<Address>(id ? `/users/me/addresses/${id}` : '/users/me/addresses', {
        method: id ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
    });

export const deleteAddress = (id: number) =>
    accountFetch<{ ok: true }>(`/users/me/addresses/${id}`, { method: 'DELETE' });

export const toggleFavorite = (baseProductId: number) =>
    accountFetch<{ favorited: boolean }>('/users/me/favorites', {
        method: 'POST',
        body: JSON.stringify({ baseProductId }),
    });

export const updatePrivacy = (payload: Record<string, unknown>) =>
    accountFetch<PrivacySettings>('/users/me/privacy', { method: 'PATCH', body: JSON.stringify(payload) });

export const updateNotifications = (payload: Record<string, unknown>) =>
    accountFetch<NotificationPrefs>('/users/me/notifications', { method: 'PATCH', body: JSON.stringify(payload) });

/** Sipariş geçmişini GİZLER. Silmez — e-fatura saklama yükümlülüğü var. */
export const hideOrderHistory = () =>
    accountFetch<{ hidden: number }>('/users/me/orders/hide', { method: 'POST' });

/** Giriş sonrası misafir sepetini hesaba taşır. */
export const mergeGuestCart = (token: string) =>
    accountFetch<Cart>('/cart/merge', { method: 'POST', body: JSON.stringify({ token }) });
