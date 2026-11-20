'use client';

import Link from 'next/link';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { OVERLAY_EVENT, type OverlayDetail } from '@/lib/overlay';

/**
 * tawk.to yükleyici (S12). Yalnız işlevsel çerez izni verilmişse çizilir
 * (`ConsentGate` içinde). Yaptıkları:
 *
 *   - Resmî `Tawk_API` geri çağrıları betikten ÖNCE kurulur (modül düzeyi).
 *   - Ödeme rotalarında (PayTR iframe'i dahil) ve sepet çekmecesi / mobil menü
 *     açıkken balon resmî `hideWidget()` ile gizlenir; kapanınca geri gelir.
 *     Kritik düğmeler (ödemeye geç, sepete ekle, menü) kapanmaz.
 *   - Sağlayıcı yanıt vermezse (betik hatası ya da 15 sn içinde `onLoad` yok —
 *     görülen hata: embed.tawk.to 520 + HTML içerik) site bozulmaz, yeniden
 *     yükleme döngüsü yok; küçük bir "Canlı destek" bağlantısı İletişim
 *     sayfasına gider. WhatsApp balonu zaten solda duruyor.
 *   - Çift yükleme yok: `next/script` kimlikle tekilleştirir; yerleşimde bir kez.
 *
 * Dikkat çeken görsel ve temsilci adı ("Ozmi") tawk.to panelindeki ayarlardır;
 * burada değiştirilmez. Konumlandırma `globals.css`'teki dış kap kuralında
 * (ürün sayfası satın alma çubuğu); iframe'in İÇİNE dokunulmaz.
 */
interface TawkApi {
    onLoad?: () => void;
    hideWidget?: () => void;
    showWidget?: () => void;
}

declare global {
    interface Window {
        Tawk_API?: TawkApi;
        Tawk_LoadStart?: Date;
    }
}

const READY_EVENT = 'ozmi:tawk-hazir';
const LOAD_TIMEOUT_MS = 15_000;
/** Balonun gizlendiği rotalar: ödeme formu, kart iframe'i, dönüş sayfası. */
const HIDDEN_PREFIXES = ['/odeme'];

if (typeof window !== 'undefined') {
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = window.Tawk_LoadStart || new Date();
    const previous = window.Tawk_API.onLoad;
    window.Tawk_API.onLoad = () => {
        previous?.();
        window.dispatchEvent(new Event(READY_EVENT));
    };
}

export default function TawkLoader({ src, contactHref }: { src: string; contactHref: string }) {
    const pathname = usePathname();
    const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
    const overlays = useRef(new Set<string>());
    const [overlayCount, setOverlayCount] = useState(0);

    useEffect(() => {
        const onReady = () => setStatus('ready');
        window.addEventListener(READY_EVENT, onReady);
        const timer = window.setTimeout(() => setStatus((current) => (current === 'loading' ? 'failed' : current)), LOAD_TIMEOUT_MS);
        return () => {
            window.removeEventListener(READY_EVENT, onReady);
            window.clearTimeout(timer);
        };
    }, []);

    useEffect(() => {
        const onOverlay = (event: Event) => {
            const { id, open } = (event as CustomEvent<OverlayDetail>).detail;
            if (open) overlays.current.add(id);
            else overlays.current.delete(id);
            setOverlayCount(overlays.current.size);
        };
        window.addEventListener(OVERLAY_EVENT, onOverlay);
        return () => window.removeEventListener(OVERLAY_EVENT, onOverlay);
    }, []);

    const hidden = overlayCount > 0 || HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

    useEffect(() => {
        if (status !== 'ready') return;
        const api = window.Tawk_API;
        try {
            if (hidden) api?.hideWidget?.();
            else api?.showWidget?.();
        } catch {
            // Sağlayıcı API'si değiştiyse balon olduğu gibi kalır; site bozulmaz.
        }
    }, [status, hidden]);

    return (
        <>
            <Script id="tawkto" src={src} strategy="afterInteractive" onError={() => setStatus('failed')} />
            {status === 'failed' && !hidden && (
                <Link
                    href={contactHref}
                    className="support-dock fixed bottom-5 right-5 z-40 rounded-full bg-slate-900 px-4 py-3 text-[13px] font-bold text-on-dark shadow-[0_6px_20px_rgba(26,20,24,0.3)]"
                    title="Canlı destek şu anda açılamıyor; İletişim sayfasından bize ulaşabilirsin."
                >
                    Canlı destek açılamadı — İletişim
                </Link>
            )}
        </>
    );
}
