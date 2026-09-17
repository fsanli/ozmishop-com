'use client';

import { useEffect, useSyncExternalStore } from 'react';
import Logo from '@/components/Logo';
import { PANIC_EXIT_URL } from '@/lib/site';

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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-block/72 p-4 backdrop-blur-[3px]"
        >
            <div className="w-full max-w-[470px] overflow-hidden rounded-[var(--radius-xl)] bg-paper shadow-[0_24px_60px_rgba(26,20,24,0.35)]">
                <div className="flex items-center justify-between bg-ink-block px-6 py-4">
                    <Logo onDark href={null} className="text-[19px]" />
                    <span className="badge border border-on-dark/22 text-on-dark/85">18+</span>
                </div>

                <div className="p-[clamp(22px,4vw,32px)]">
                    <h2 id="age-gate-title" className="heading-2">
                        18 yaşından<br />büyük müsün?
                    </h2>
                    <p className="mt-3.5 text-[14px] leading-relaxed text-slate-600">
                        Bu site yetişkinlere yönelik ürünler içerir. Devam edebilmek için 18 yaşından büyük
                        olduğunu onaylaman gerekir. Tüm siparişler{' '}
                        <strong className="font-bold text-slate-900">gizli paketleme</strong> ile gönderilir.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2.5">
                        <button
                            type="button"
                            onClick={accept}
                            className="btn-primary min-h-[52px] flex-[1_1_170px] justify-center rounded-[14px]"
                        >
                            Evet, 18 yaşından büyüğüm
                        </button>
                        <a
                            href={PANIC_EXIT_URL}
                            rel="noreferrer"
                            className="btn-secondary min-h-[52px] flex-[1_1_110px] justify-center rounded-[14px]"
                        >
                            Hayır, çık
                        </a>
                    </div>

                    <p className="mt-4 text-[12px] leading-relaxed text-slate-600">
                        Onayın bu cihazda 30 gün saklanır. Devam ederek Gizlilik politikası ve Çerez
                        politikasını kabul etmiş olursun. Site RTA etiketlidir.
                    </p>
                </div>
            </div>
        </div>
    );
}
