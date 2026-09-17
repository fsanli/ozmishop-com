'use client';

import { PANIC_EXIT_URL } from '@/lib/site';
import { EyeOffIcon } from '@/components/icons';

/**
 * Hızlı çıkış. Tek tuşla nötr bir sayfaya geçer.
 *
 * Neden istemci bileşeni: düz bir <a> geçmişte iz bırakır ve "geri" tuşu
 * ziyaretçiyi buraya döndürür — özelliğin tüm amacı bu. location.replace()
 * mevcut kaydı EZER, geçmişte ozmishop kalmaz.
 *
 * JS kapalıysa <a> normal çalışır: iz bırakır ama çıkış yine de olur.
 * Sepet çerezi TEMİZLENMEZ — ziyaretçi döndüğünde sepetini isteyecek.
 * Yıkıcı temizlik Hesabım → Gizlilik modu → "Geçmişi sil" altında.
 */
export default function PanicExit({ className = '' }: { className?: string }) {
    return (
        <a
            href={PANIC_EXIT_URL}
            rel="noreferrer"
            onClick={(event) => {
                event.preventDefault();
                try {
                    Object.keys(sessionStorage)
                        .filter((key) => key.startsWith('ozmi_'))
                        .forEach((key) => sessionStorage.removeItem(key));
                } catch { /* sessionStorage kapalı olabilir; çıkış yine de yapılır */ }
                window.location.replace(PANIC_EXIT_URL);
            }}
            className={`inline-flex items-center gap-1.5 rounded-full bg-on-dark/[0.09] px-3 py-1.5 text-[11.5px] font-bold text-on-dark transition hover:bg-on-dark/20 ${className}`}
        >
            <EyeOffIcon className="size-[13px]" />
            Hızlı çıkış
        </a>
    );
}
