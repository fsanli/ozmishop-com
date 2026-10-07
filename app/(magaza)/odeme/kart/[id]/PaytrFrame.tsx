'use client';

import Script from 'next/script';
import { useRef, useSyncExternalStore } from 'react';
import { markIframeLoadedAction } from '../../actions';

declare global {
    interface Window {
        iFrameResize?: (options: object, target: string) => void;
    }
}

const PAYTR_ORIGIN = 'https://www.paytr.com/';
const subscribeNothing = () => () => {};

/**
 * PayTR iframe'i — PayTR dokümanındaki gömme kodunun birebir karşılığı:
 * `iframeResizer.min.js`, `#paytriframe` ve yüklenince `iFrameResize`.
 * Yükseklik PayTR sayfasının içindeki eşleniğiyle konuşarak ayarlanır.
 *
 * İframe HİDRASYONDAN SONRA çizilir: sunucu HTML'inde olsaydı React bağlanmadan
 * yüklenebilir ve `onLoad` hiç çalışmazdı — panelin "iframe açıldı" işareti
 * kaybolurdu. İşaret yalnız İLK yüklemede: aynı iframe dönüş sayfasına
 * geçince de `load` tetikleniyor.
 *
 * Geliştirmedeki sahte sağlayıcı sayfasında yeniden boyutlandırıcı yok;
 * orada betik yüklenmez ve iframe sabit yükseklik alır.
 */
export default function PaytrFrame({ attemptId, iframeUrl }: { attemptId: string; iframeUrl: string }) {
    const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
    const marked = useRef(false);
    const isPaytr = iframeUrl.startsWith(PAYTR_ORIGIN);

    if (!hydrated) {
        return <div className="h-[560px] animate-pulse rounded-[var(--radius-md)] bg-slate-100" aria-hidden />;
    }

    return (
        <>
            {isPaytr && (
                <Script
                    id="paytr-iframe-resizer"
                    src="https://www.paytr.com/js/iframeResizer.min.js"
                    onReady={() => window.iFrameResize?.({}, '#paytriframe')}
                />
            )}
            <iframe
                src={iframeUrl}
                id="paytriframe"
                title="PayTR güvenli ödeme"
                frameBorder="0"
                scrolling="no"
                style={{ width: '100%', ...(isPaytr ? {} : { height: 560 }) }}
                onLoad={() => {
                    if (marked.current) return;
                    marked.current = true;
                    markIframeLoadedAction(attemptId).catch(() => {});
                }}
            />
        </>
    );
}
