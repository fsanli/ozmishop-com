'use client';

import { useEffect } from 'react';

/**
 * 404'ü görülen yolla birlikte bildirir (izleme, D23): panel "en çok görülen
 * 404'ler" listesinden kırık bağlantıları ve eski kampanya adreslerini bulur.
 * YALNIZ yol (sorgu dizisi ve parça yok) ve yönlendiren sitenin alan adı;
 * çerez ya da kimlik yok. Aynı sekmede aynı yol bir kez sayılır.
 */
export default function NotFoundBeacon() {
    useEffect(() => {
        const path = window.location.pathname;
        const key = `ozmi_404_${path}`;
        try {
            if (sessionStorage.getItem(key)) return;
            sessionStorage.setItem(key, '1');
        } catch {
            /* sessionStorage kapalı: yine de bildir */
        }
        let referrerHost = '';
        try {
            referrerHost = document.referrer ? new URL(document.referrer).hostname : '';
        } catch {
            referrerHost = '';
        }
        fetch('/api/events/not-found', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, referrerHost }),
            keepalive: true,
        }).catch(() => {});
    }, []);
    return null;
}
