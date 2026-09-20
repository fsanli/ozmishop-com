'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Toaster, toast } from 'sonner';
import { BagIcon, XIcon } from '@/components/icons';
import { formatPrice } from '@/lib/format';
import { FLASH_COOKIE } from '@/lib/flash';
import { routes } from '@/lib/site';
import type { Cart } from '@/lib/types';

/**
 * SEPETE EKLEME GERİ BİLDİRİMİ: toast + masaüstünde sepet çekmecesi.
 *
 * Eskiden "sepete ekle" kullanıcıyı /sepet sayfasına atıyordu; alışverişi
 * bölen en pahalı davranış buydu. Artık sayfada kalınıyor.
 *
 * BAYRAK ÇEREZDEN GELİR, adresten değil. Aksiyon `redirect()` ile dönseydi
 * tarayıcı gezinme yapar ve SAYFA BAŞA KAYARDI — mobilde ürünü inceleyip
 * "Sepete ekle"ye basan kullanıcı tepeye fırlıyordu. Şimdi aksiyon çerezi
 * yazıp `refresh()` çağırıyor; `CartFlash` yeni değeri prop olarak veriyor
 * ve kullanıcı baktığı yerde kalıyor.
 *
 * JavaScript kapalıyken: aksiyon yine çalışır ve sepet sayacı güncellenir,
 * yalnızca toast ve çekmece görünmez.
 */

/** Çekmece yalnızca masaüstünde; mobilde alt çubuk ve toast var. */
const subscribeDesktop = (callback: () => void) => {
    const query = window.matchMedia('(min-width: 1024px)');
    query.addEventListener('change', callback);
    return () => query.removeEventListener('change', callback);
};

export default function CartDock({ flash }: { flash: string | null }) {
    const isDesktop = useSyncExternalStore(
        subscribeDesktop,
        () => window.matchMedia('(min-width: 1024px)').matches,
        () => false, // sunucuda çekmece hiç çizilmez
    );

    // "sepet:eklendi" / "hata:Stok yetersiz" — ilk iki nokta üst üsteden böl;
    // hata mesajı iki nokta içerebilir, o yüzden split(':') kullanılmıyor.
    const raw = flash ?? '';
    const cut = raw.indexOf(':');
    const kind = cut < 0 ? raw : raw.slice(0, cut);
    const detail = cut < 0 ? '' : raw.slice(cut + 1);
    const added = kind === 'sepet';

    /* Çekmece kapandığında bayrak hâlâ prop'ta duruyor (çerez silinse de
       sunucu yeniden render edilmedi). Kapanışı ayrı tutuyoruz; yeni bir
       bayrak gelince render sırasında sıfırlanıyor — React'in belgelediği
       kalıp, effect içinde setState değil. */
    const [dismissed, setDismissed] = useState<string | null>(null);
    if (dismissed !== null && dismissed !== flash) setDismissed(null);

    const open = added && isDesktop && dismissed !== flash;

    const [cart, setCart] = useState<Cart | null>(null);

    /*
     * Bildirim + çerez temizliği. YALNIZCA yan etki, setState yok.
     * Çerez silinmezse sonraki gezinmede toast tekrar çıkardı.
     */
    useEffect(() => {
        if (!flash) return;
        if (kind === 'sepet') toast.success('Ürün sepete eklendi');
        else if (kind === 'favori') {
            if (detail === 'eklendi') toast.success('Favorilere eklendi');
            else toast('Favorilerden çıkarıldı');
        } else if (kind === 'hata') toast.error(detail || 'İşlem tamamlanamadı');

        document.cookie = `${FLASH_COOKIE}=; path=/; max-age=0`;
    }, [flash, kind, detail]);

    // İçerik AÇILINCA çekilir: hiç açılmayacak bir panel için her gezinmede
    // sepet isteği atmak israf olurdu.
    useEffect(() => {
        if (!open) return undefined;
        const controller = new AbortController();
        fetch('/api/sepet', { signal: controller.signal })
            .then((response) => (response.ok ? response.json() : null))
            .then((data: Cart | null) => setCart(data))
            .catch(() => { /* iptal ya da ağ hatası: çekmece boş görünür */ });
        return () => controller.abort();
    }, [open]);

    return (
        <>
            <Toaster
                position="bottom-center"
                // Mobilde altta (başparmağa yakın, başlığı örtmez).
                // Masaüstünde sağ üst: sol altta WhatsApp balonu, sağ altta
                // tawk.to var — alt köşelerin ikisi de dolu.
                className="lg:![inset:84px_20px_auto_auto]"
                toastOptions={{
                    classNames: {
                        toast: 'rounded-[14px] border border-slate-900/8 bg-surface text-slate-900 shadow-[0_10px_34px_rgba(26,20,24,0.16)]',
                        title: 'text-[13.5px] font-bold',
                        description: 'text-[12.5px] text-slate-600',
                    },
                }}
            />

            {open && (
                <>
                    <button
                        type="button"
                        aria-label="Sepeti kapat"
                        onClick={() => setDismissed(flash)}
                        className="fixed inset-0 z-50 cursor-default bg-ink-block/35 backdrop-blur-[2px]"
                    />
                    <aside
                        role="dialog"
                        aria-label="Sepetim"
                        className="fixed right-0 top-0 z-50 flex h-dvh w-[380px] max-w-[92vw] flex-col border-l border-slate-900/10 bg-surface shadow-[-18px_0_48px_rgba(26,20,24,0.18)]"
                    >
                        <header className="flex items-center gap-2 border-b border-slate-900/8 px-5 py-4">
                            <BagIcon className="size-[18px] text-slate-700" />
                            <h2 className="text-[15px] font-bold">Sepetim</h2>
                            {cart && <span className="text-[12.5px] text-slate-600">{cart.itemCount} ürün</span>}
                            <button type="button" onClick={() => setDismissed(flash)} aria-label="Kapat" className="ml-auto text-slate-500 transition hover:text-accent-500">
                                <XIcon className="size-[18px]" />
                            </button>
                        </header>

                        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
                            {!cart ? (
                                <p className="py-8 text-center text-[13.5px] text-slate-600">Sepet yükleniyor…</p>
                            ) : cart.items.length === 0 ? (
                                <p className="py-8 text-center text-[13.5px] text-slate-600">Sepetin boş.</p>
                            ) : (
                                <ul className="divide-y divide-slate-900/7">
                                    {cart.items.map((item) => (
                                        <li key={item.id} className="flex gap-3 py-3">
                                            <span className="relative size-14 shrink-0 overflow-hidden rounded-[10px] bg-shelf">
                                                {item.image && <Image src={item.image.url} alt="" fill sizes="56px" className="object-cover" />}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-[13px] font-medium text-slate-900">{item.name}</span>
                                                {item.variantLabel && (
                                                    <span className="block truncate text-[11.5px] text-slate-600">{item.variantLabel}</span>
                                                )}
                                                <span className="mt-0.5 block text-[12px] text-slate-600">
                                                    {item.quantity} × {formatPrice(item.price)}
                                                </span>
                                            </span>
                                            <span className="shrink-0 text-[13px] font-bold tabular-nums">{formatPrice(item.lineTotal)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {cart && cart.items.length > 0 && (
                            <footer className="border-t border-slate-900/8 px-5 py-4">
                                <div className="mb-3 flex items-baseline justify-between">
                                    <span className="text-[13px] text-slate-600">Ara toplam</span>
                                    <span className="price text-[17px]">{formatPrice(cart.totals.subtotal)}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Link href={routes.cart} onClick={() => setDismissed(flash)} className="btn-secondary flex-1 justify-center">Sepete git</Link>
                                    <Link href={routes.checkout} onClick={() => setDismissed(flash)} className="btn-primary flex-1 justify-center">Ödemeye geç</Link>
                                </div>
                            </footer>
                        )}
                    </aside>
                </>
            )}
        </>
    );
}
