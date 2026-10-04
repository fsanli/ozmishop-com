'use client';

import { useSyncExternalStore } from 'react';
import {
    openConsentPreferences, readConsent, serverConsent, subscribeConsent,
} from '@/lib/consent';

/**
 * İşlevsel çerez izni yoksa içini ÇİZMEZ — tawk.to betiği onaysız hiç
 * yüklenmez. `fallback: 'support'` izin yokken küçük bir "Canlı destek"
 * düğmesi gösterir; tıklayınca çerez tercihleri açılır.
 */
export default function ConsentGate({ children, fallback }: { children: React.ReactNode; fallback?: 'support' }) {
    const consent = useSyncExternalStore(subscribeConsent, readConsent, serverConsent);
    if (consent.functional) return <>{children}</>;
    if (fallback !== 'support' || !consent.decided) return null;
    return (
        <button
            type="button"
            onClick={openConsentPreferences}
            className="support-dock fixed bottom-5 right-5 z-40 rounded-full bg-slate-900 px-4 py-3 text-[13px] font-bold text-on-dark shadow-[0_6px_20px_rgba(26,20,24,0.3)]"
        >
            Canlı destek
        </button>
    );
}
