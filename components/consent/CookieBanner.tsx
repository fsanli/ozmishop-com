'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useAgeAccepted } from '@/components/AgeGate';
import {
    PREFERENCES_EVENT, readConsent, serverConsent, subscribeConsent, writeConsent,
} from '@/lib/consent';

/**
 * Çerez onay bandı — 18 yaş kapısından AYRI ve ondan SONRA çıkar.
 *
 * "Tümünü kabul et" ile "Yalnızca zorunlu" EŞİT ağırlıkta: reddetmeyi
 * zorlaştıran bir tasarım geçerli onay sayılmaz. İşlevsel çerezler (canlı
 * destek) onay verilmeden yüklenmez — `ConsentGate`.
 */
export default function CookieBanner({ policyHref }: { policyHref: string }) {
    const consent = useSyncExternalStore(subscribeConsent, readConsent, serverConsent);
    const ageAccepted = useAgeAccepted();
    const [managing, setManaging] = useState(false);
    const [reopened, setReopened] = useState(false);
    const [functional, setFunctional] = useState(consent.functional);

    // Footer'daki bağlantı bandı ayar görünümüyle yeniden açar.
    useEffect(() => {
        const open = () => {
            setFunctional(readConsent().functional);
            setManaging(true);
            setReopened(true);
        };
        window.addEventListener(PREFERENCES_EVENT, open);
        return () => window.removeEventListener(PREFERENCES_EVENT, open);
    }, []);

    if (!ageAccepted || (consent.decided && !reopened)) return null;

    const save = (next: { functional: boolean }) => {
        writeConsent({ functional: next.functional, analytics: false });
        setManaging(false);
        setReopened(false);
    };

    return (
        <section
            role="dialog"
            aria-label="Çerez tercihleri"
            className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-[680px] rounded-[var(--radius-xl)] border border-slate-900/10 bg-surface p-[18px_20px] shadow-[0_18px_48px_-12px_rgba(26,20,24,0.4)] sm:inset-x-6 sm:bottom-6"
        >
            <h2 className="text-[14.5px] font-bold">Çerezler</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">
                Siteyi çalıştırmak için zorunlu çerezler kullanıyoruz (oturum, sepet). Canlı destek gibi işlevsel çerezler
                yalnızca izin verirsen çalışır. Ayrıntılar: <a href={policyHref} className="link">Çerez Politikası</a>.
            </p>

            {managing && (
                <div className="mt-3 space-y-2 rounded-[var(--radius-md)] bg-paper p-3 text-[13px]">
                    <label className="flex items-start justify-between gap-3">
                        <span><strong className="font-bold">Zorunlu</strong><span className="block text-slate-600">Oturum, sepet, tercihlerin. Kapatılamaz.</span></span>
                        <input type="checkbox" checked disabled className="field-checkbox mt-1" />
                    </label>
                    <label className="flex items-start justify-between gap-3">
                        <span><strong className="font-bold">İşlevsel</strong><span className="block text-slate-600">Canlı destek penceresi (tawk.to).</span></span>
                        <input type="checkbox" checked={functional} onChange={(event) => setFunctional(event.target.checked)} className="field-checkbox mt-1 accent-accent-500" />
                    </label>
                </div>
            )}

            <div className="mt-3.5 flex flex-wrap gap-2">
                <button type="button" onClick={() => save({ functional: true })} className="btn-secondary btn-sm flex-[1_1_150px] justify-center">Tümünü kabul et</button>
                <button type="button" onClick={() => save({ functional: false })} className="btn-secondary btn-sm flex-[1_1_150px] justify-center">Yalnızca zorunlu</button>
                {managing ? (
                    <button type="button" onClick={() => save({ functional })} className="btn-accent btn-sm flex-[1_1_150px] justify-center">Seçimi kaydet</button>
                ) : (
                    <button type="button" onClick={() => setManaging(true)} className="btn-soft btn-sm flex-[1_1_150px] justify-center">Tercihleri yönet</button>
                )}
            </div>
        </section>
    );
}
