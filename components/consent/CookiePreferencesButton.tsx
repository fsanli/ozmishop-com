'use client';

import { openConsentPreferences } from '@/lib/consent';

export default function CookiePreferencesButton({ className = '' }: { className?: string }) {
    return (
        <button type="button" onClick={openConsentPreferences} className={className}>
            Çerez tercihleri
        </button>
    );
}
