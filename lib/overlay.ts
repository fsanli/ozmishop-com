/**
 * EKRANI KAPLAYAN KATMANLAR — sepet çekmecesi, mobil menü (S12).
 *
 * tawk.to balonu kendi iframe'inde ve çok yüksek z-index'le duruyor; çekmece
 * ya da menü açıkken "Ödemeye geç" gibi düğmelerin üstüne binebiliyordu. CSS
 * ile iframe'i zorlamak yerine katman açılınca tawk.to'nun resmî API'siyle
 * gizlenir (`TawkLoader`). Bileşenler birbirini tanımaz; bu olayla konuşur.
 */
export const OVERLAY_EVENT = 'ozmi:katman';

export interface OverlayDetail { id: string; open: boolean }

export function announceOverlay(id: string, open: boolean) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent<OverlayDetail>(OVERLAY_EVENT, { detail: { id, open } }));
}
