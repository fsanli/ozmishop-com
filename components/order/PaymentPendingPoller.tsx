'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const INTERVAL_MS = 3000;
const MAX_TRIES = 20;

/**
 * Kart ödemesi bankadan döndü ama sağlayıcının sunucu bildirimi henüz
 * gelmedi. Sonuç birkaç saniye içinde gelir; sayfa sunucudan yeniden okunur
 * (`router.refresh`), sipariş onaylanınca bu bileşen kendiliğinden kaybolur.
 * ~1 dakika sonra durur: bildirim çok gecikirse sonuç e-postayla gider.
 */
export default function PaymentPendingPoller() {
    const router = useRouter();
    const [gaveUp, setGaveUp] = useState(false);

    useEffect(() => {
        let tries = 0;
        const timer = setInterval(() => {
            tries += 1;
            if (tries > MAX_TRIES) {
                clearInterval(timer);
                setGaveUp(true);
                return;
            }
            router.refresh();
        }, INTERVAL_MS);
        return () => clearInterval(timer);
    }, [router]);

    return (
        <p className="mt-3 text-[13px] text-slate-600" role="status" aria-live="polite">
            {gaveUp
                ? 'Sonuç bankadan henüz gelmedi. Ödeme kesinleşince e-postayla haber vereceğiz; bu sayfayı daha sonra yenileyebilirsin.'
                : 'Bankadan sonuç bekleniyor, sayfa kendiliğinden güncellenecek.'}
        </p>
    );
}
