import type { SiteSettings } from '@/lib/types';

/**
 * Satıcı künyesi — ödeme adımında, sipariş onaylanmadan ÖNCE görünür (ön
 * bilgilendirmenin unsuru). Değerler panelden (Ayarlar › Şirket bilgileri);
 * girilmemişse kart hiç çizilmez, boş bir "Satıcı:" satırı yanlış izlenim verir.
 */
export default function SellerCard({ settings, returnDays }: { settings: SiteSettings; returnDays: number }) {
    const name = settings['sirket.unvan']?.trim();
    if (!name) return null;
    const rows = [
        settings['sirket.adres'],
        settings['sirket.mersis'] ? `MERSİS ${settings['sirket.mersis']}` : null,
        [settings['sirket.telefon'], settings['sirket.eposta']].filter(Boolean).join(' · ') || null,
    ].filter(Boolean);

    return (
        <section className="card mt-3 p-[16px_18px] text-[12.5px] leading-relaxed text-slate-600">
            <h3 className="text-[12.5px] font-bold text-slate-900">Satıcı</h3>
            <p className="mt-1 font-semibold text-slate-900">{name}</p>
            {rows.map((row) => <p key={row}>{row}</p>)}
            <p className="mt-2">
                Teslimattan itibaren {returnDays} gün içinde cayma hakkın var; ambalajı açılmış hijyen ürünleri bu hakkın dışında.
            </p>
        </section>
    );
}
