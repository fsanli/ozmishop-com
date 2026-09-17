'use client';

import { useEffect } from 'react';

/**
 * Görüntülenme sayacı. Oturum başına kayıt başına bir kez sayılır
 * (sessionStorage), böylece sayfa yenilemeleri "en çok ilgi görenler"
 * sıralamasını şişirmez. İstek /api/events/* vekilinden geçer; API adresi
 * tarayıcıya sızmaz.
 *
 * Ürün ve yazı sayaçları AYNI bileşeni kullanır: ikisi için iki ayrı istemci
 * bileşeni yazmak, istemci bütçesini aynı davranışı iki kez yazmak için
 * harcamak olurdu.
 */
export default function ViewPing({ slug, kind }: { slug: string; kind: 'product' | 'post' }) {
    useEffect(() => {
        const key = `ozmi_view_${kind}_${slug}`;
        try {
            if (window.sessionStorage.getItem(key)) return;
            window.sessionStorage.setItem(key, '1');
        } catch {
            /* sessionStorage yoksa yine de bir kez sayalım */
        }

        const timer = setTimeout(() => {
            fetch(`/api/events/${kind}-view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug }),
                keepalive: true,
            }).catch(() => {
                /* sayaç kritik değil; sessizce geç */
            });
        }, 1500); // hemen çıkan ziyaretçiyi saymamak için kısa gecikme

        return () => clearTimeout(timer);
    }, [slug, kind]);

    return null;
}
