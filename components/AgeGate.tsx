'use client';

import { useEffect, useSyncExternalStore } from 'react';

const KEY = 'ozmi_18_ok';
const DAYS = 30;

/**
 * 18 yaş kapısı.
 *
 * Sayfa içeriği sunucudan normal şekilde render edilir; kapı yalnızca istemcide
 * çizilir. Böylece arama motorlarına farklı içerik gösterilmez (cloaking) ve SSR
 * ile hidrasyon arasında uyuşmazlık oluşmaz.
 *
 * Onay durumu localStorage'da tutulduğu için React durumu yerine harici depo
 * (`useSyncExternalStore`) ile okunur: effect içinde setState çağırmaya gerek kalmaz.
 */
let listeners: (() => void)[] = [];

const subscribe = (callback: () => void) => {
    listeners.push(callback);
    return () => {
        listeners = listeners.filter((item) => item !== callback);
    };
};

const isAccepted = (): boolean => {
    try {
        const raw = window.localStorage.getItem(KEY);
        return Boolean(raw) && Number(raw) > Date.now();
    } catch {
        // localStorage kapalıysa (gizli sekme kısıtları) kapı gösterilir, engel olunmaz.
        return false;
    }
};

const accept = () => {
    try {
        window.localStorage.setItem(KEY, String(Date.now() + DAYS * 86400 * 1000));
    } catch {
        /* yazılamadıysa da kapı kapanır: her sayfada tekrar sormak ziyaretçiyi kaçırır */
    }
    listeners.forEach((listener) => listener());
};

export default function AgeGate() {
    // Sunucuda "onaylanmış" varsayılır: HTML'e kapı basılmaz, yalnızca istemcide belirir.
    const accepted = useSyncExternalStore(subscribe, isAccepted, () => true);

    useEffect(() => {
        if (accepted) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, [accepted]);

    if (accepted) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="age-gate-title"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-900/95 p-4 backdrop-blur-sm"
        >
            <div className="card w-full max-w-md p-6 text-center sm:p-8">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent-500">18+</p>
                <h2 id="age-gate-title" className="heading-2 mb-3">Yaş doğrulama</h2>
                <p className="mb-6 text-sm text-slate-600">
                    Bu site yetişkinlere yönelik ürünler içerir. Devam edebilmek için 18 yaşından büyük olduğunuzu
                    onaylamanız gerekir. Tüm siparişler <strong className="font-semibold text-slate-900">gizli paketleme</strong> ile gönderilir.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row-reverse">
                    <button type="button" onClick={accept} className="btn-primary btn-lg flex-1">
                        18 yaşından büyüğüm
                    </button>
                    <a href="https://www.google.com" className="btn-secondary btn-lg flex-1">
                        Siteden ayrıl
                    </a>
                </div>
                <p className="mt-4 text-xs text-slate-400">Onayınız bu cihazda 30 gün saklanır.</p>
            </div>
        </div>
    );
}
