'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Toaster, toast } from 'sonner';
import { BagIcon, XIcon } from '@/components/icons';
import { formatPrice } from '@/lib/format';
import { routes } from '@/lib/site';
import type { Cart } from '@/lib/types';

/**
 * SEPETE EKLEME GERİ BİLDİRİMİ: toast + masaüstünde sepet çekmecesi.
 *
 * Eskiden "sepete ekle" kullanıcıyı /sepet sayfasına atıyordu; alışverişi
 * bölen en pahalı davranış buydu. Artık sayfada kalınıyor.
 *
 * DURUM URL'DEN TÜRETİLİYOR, state'te tutulmuyor. İki sebep:
 *   1. Sunucu aksiyonu `?sepet=eklendi` ile geri dönüyor; istemcinin ayrıca
 *      haberleşmesi gerekmiyor.
 *   2. Effect içinde setState çağırmak zincirleme render üretiyor ve React
 *      lint'i haklı olarak reddediyor. URL zaten bu bilginin doğru yeri.
 *
 * JavaScript kapalıyken: aksiyon yine çalışır, sayfa `?sepet=eklendi` ile
 * yeniden yüklenir, yalnızca toast ve çekmece görünmez — başlıktaki sepet
 * sayacı yine de güncellenir.
 */

/** Çekmece yalnızca masaüstünde; mobilde alt çubuk ve toast var. */
const subscribeDesktop = (callback: () => void) => {
    const query = window.matchMedia('(min-width: 1024px)');
    query.addEventListener('change', callback);
    return () => query.removeEventListener('change', callback);
};

/**
 * "Hidrasyon bitti mi" — sunucuda false, istemcide true.
 *
 * Buna İHTİYAÇ VAR çünkü `isDesktop`in sunucu anlık görüntüsü zorunlu olarak
 * `false`. O ilk render'da temizlik effect'i çalışırsa `?sepet=eklendi`yi
 * çekmece daha açılmadan siler ve çekmece MASAÜSTÜNDE DE hiç görünmez.
 * (Bu hata gerçekten oluştu; DOM taramasında yakalandı.)
 */
const subscribeNever = () => () => {};

export default function CartDock() {
    const params = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
    const isDesktop = useSyncExternalStore(
        subscribeDesktop,
        () => window.matchMedia('(min-width: 1024px)').matches,
        () => false, // sunucuda çekmece hiç çizilmez
    );

    const added = params.get('sepet') === 'eklendi';
    const favourite = params.get('favori');
    const error = params.get('hata');
    const open = added && isDesktop;

    const [cart, setCart] = useState<Cart | null>(null);

    // Bildirimler. YALNIZCA yan etki — setState yok, zincirleme render yok.
    useEffect(() => {
        if (added) toast.success('Ürün sepete eklendi');
    }, [added]);

    useEffect(() => {
        if (favourite === 'eklendi') toast.success('Favorilere eklendi');
        if (favourite === 'cikarildi') toast('Favorilerden çıkarıldı');
    }, [favourite]);

    useEffect(() => {
        if (error) toast.error(error);
    }, [error]);

    /** Bayrakları adresten siler; kalırsa yenilemede toast tekrar çıkar. */
    const clearFlags = () => {
        const clean = new URLSearchParams(params);
        ['sepet', 'favori', 'hata'].forEach((key) => clean.delete(key));
        const query = clean.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    // Çekmece açıkken temizlik BEKLETİLİR: açık olması `?sepet=eklendi`ye bağlı.
    // `hydrated` kontrolü şart — bkz. subscribeNever.
    useEffect(() => {
        if (!hydrated || open || (!added && !favourite && !error)) return;
        const clean = new URLSearchParams(params);
        ['sepet', 'favori', 'hata'].forEach((key) => clean.delete(key));
        const query = clean.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, [hydrated, added, favourite, error, open, params, pathname, router]);

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
                        onClick={clearFlags}
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
                            <button type="button" onClick={clearFlags} aria-label="Kapat" className="ml-auto text-slate-500 transition hover:text-accent-500">
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
                                    <Link href={routes.cart} onClick={clearFlags} className="btn-secondary flex-1 justify-center">Sepete git</Link>
                                    <Link href={routes.checkout} onClick={clearFlags} className="btn-primary flex-1 justify-center">Ödemeye geç</Link>
                                </div>
                            </footer>
                        )}
                    </aside>
                </>
            )}
        </>
    );
}
