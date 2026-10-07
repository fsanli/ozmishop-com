'use client';

import { useEffect, useState, useTransition } from 'react';
import { pollAttemptAction } from './actions';

/**
 * Kart denemesinin sonucunu yoklar. Sonuç belliyse aksiyon kendisi yönlendirir
 * (başarı → sipariş, başarısızlık → ödeme formu); bileşen yalnız süreyi tutar.
 *
 * İki yerde: iframe sayfası (PayTR'nin dönüş sayfası iframe'den çıkamazsa
 * sonuç yine yakalansın) ve "ödemen kontrol ediliyor" ekranı. İstekler üst
 * üste binmez: bir sonraki yoklama öncekinin cevabından sonra kurulur.
 *
 * `timeoutMs` dolunca durur ve `gaveUp`ı gösterir; "Yeniden kontrol et"
 * yoklamayı baştan başlatır. Deneme bu tarayıcıda okunamaz olursa (çerez
 * düştü) `lost` gösterilir.
 */
export default function AttemptPoller({
    attemptId, intervalMs, timeoutMs, pending = null, gaveUp = null, gaveUpClassName, lost = null,
}: {
    attemptId: string;
    intervalMs: number;
    timeoutMs?: number;
    pending?: React.ReactNode;
    gaveUp?: React.ReactNode;
    /** Vazgeçme içeriğiyle "Yeniden kontrol et" düğmesini saran kutu. */
    gaveUpClassName?: string;
    lost?: React.ReactNode;
}) {
    const [, startTransition] = useTransition();
    const [round, setRound] = useState(0);
    const [state, setState] = useState<'polling' | 'gave_up' | 'lost'>('polling');

    useEffect(() => {
        let stopped = false;
        let timer: ReturnType<typeof setTimeout>;
        const deadline = timeoutMs ? Date.now() + timeoutMs : Infinity;

        const tick = () => {
            startTransition(async () => {
                // Yönlendirme olursa aksiyon geri dönmez; sayfa değişir.
                const result = await pollAttemptAction(attemptId).catch(() => null);
                if (stopped) return;
                // Ağ hatası (null) bir sonraki turda yeniden denenir.
                const status = result?.status ?? 'error';
                if (status === 'unknown') {
                    setState('lost');
                    return;
                }
                if (Date.now() + intervalMs > deadline) {
                    setState('gave_up');
                    return;
                }
                timer = setTimeout(tick, intervalMs);
            });
        };
        timer = setTimeout(tick, intervalMs);

        return () => {
            stopped = true;
            clearTimeout(timer);
        };
    }, [attemptId, intervalMs, timeoutMs, round]);

    if (state === 'lost') return lost;
    if (state === 'gave_up') {
        return (
            <div className={gaveUpClassName} role="status">
                {gaveUp}
                <button
                    type="button"
                    className="btn-secondary mt-4"
                    onClick={() => {
                        setState('polling');
                        setRound((value) => value + 1);
                    }}
                >
                    Yeniden kontrol et
                </button>
            </div>
        );
    }
    return pending;
}
