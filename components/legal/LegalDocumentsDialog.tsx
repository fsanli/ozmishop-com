'use client';

import { useEffect, useRef } from 'react';

export interface LegalDialogState {
    title: string;
    html: string | null;
    isDraft: boolean;
    error: string | null;
}

/**
 * Ödeme formundaki belge penceresi. İçerik SİPARİŞE ÖZEL (alıcı, ürünler,
 * toplam) — API doldurur ve tüm değerleri kaçırır; burada yalnız gösterilir.
 *
 * Yerel `<dialog>`: odak tuzağı, Esc ve arka plan tarayıcıdan. JavaScript
 * kapalıyken bağlantı doğrudan /sayfa/… adresine gider (çağıranın `href`'i).
 */
export default function LegalDocumentsDialog({ state, onClose }: { state: LegalDialogState; onClose: () => void }) {
    const ref = useRef<HTMLDialogElement>(null);

    // Temizlikte close() ÇAĞRILMAZ: geliştirme modunda efekt iki kez çalışıyor,
    // close() da `onClose`'u tetikleyip pencereyi açılır açılmaz söküyordu.
    // Eleman DOM'dan çıkınca pencere zaten kapanır.
    useEffect(() => {
        const dialog = ref.current;
        if (dialog && !dialog.open) dialog.showModal();
    }, []);

    return (
        <dialog
            ref={ref}
            onClose={onClose}
            aria-label={state.title}
            className="m-auto max-h-[88dvh] w-[min(760px,calc(100%-24px))] overflow-hidden rounded-[var(--radius-xl)] bg-surface p-0 text-slate-900 backdrop:bg-slate-900/50"
        >
            <div className="flex max-h-[88dvh] flex-col">
                <header className="flex items-center justify-between gap-3 border-b border-slate-900/8 px-5 py-3.5">
                    <h2 className="text-[15px] font-bold">{state.title}</h2>
                    <button type="button" onClick={() => ref.current?.close()} className="btn-soft btn-sm">Kapat</button>
                </header>
                <div className="overflow-y-auto px-5 py-4">
                    {state.isDraft && (
                        <p className="mb-3 rounded-[var(--radius-md)] bg-amber-tint px-3.5 py-2.5 text-[12.5px] font-semibold text-amber-ink">
                            Bu metin taslaktır ve hukuk onayı beklemektedir.
                        </p>
                    )}
                    {state.error && <p role="alert" className="text-[13.5px] text-accent-500">{state.error}</p>}
                    {!state.html && !state.error && <p className="text-[13.5px] text-slate-600">Belge hazırlanıyor…</p>}
                    {state.html && (
                        <div className="prose-content text-[14px]" dangerouslySetInnerHTML={{ __html: state.html }} />
                    )}
                </div>
            </div>
        </dialog>
    );
}
