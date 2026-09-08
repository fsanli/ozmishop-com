'use client';

import { useEffect } from 'react';

/**
 * Görüntülenme sayacı. Oturum başına ürün başına bir kez sayılır (sessionStorage),
 * böylece sayfa yenilemeleri "en çok ilgi görenler" sıralamasını şişirmez.
 * İstek /api/events/product-view vekilinden geçer; API adresi tarayıcıya sızmaz.
 */
export default function ProductViewPing({ slug }: { slug: string }) {
    useEffect(() => {
        const key = `ozmi_view_${slug}`;
        try {
            if (window.sessionStorage.getItem(key)) return;
            window.sessionStorage.setItem(key, '1');
        } catch {
            /* sessionStorage yoksa yine de bir kez sayalım */
        }

        const timer = setTimeout(() => {
            fetch('/api/events/product-view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug }),
                keepalive: true,
            }).catch(() => {
                /* sayaç kritik değil; sessizce geç */
            });
        }, 1500); // hemen çıkan ziyaretçiyi saymamak için kısa gecikme

        return () => clearTimeout(timer);
    }, [slug]);

    return null;
}
