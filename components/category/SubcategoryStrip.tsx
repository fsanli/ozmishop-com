import Image from 'next/image';
import Link from 'next/link';
import ScrollArrows from '@/components/ui/ScrollArrows';
import { routes } from '@/lib/site';
import type { Category } from '@/lib/types';

/**
 * ALT KATEGORİ ŞERİDİ (S04) — bütün kategori sayfalarında aynı şablon.
 *
 * Eskiden alt kategoriler başlık kartının sağında dikey yığılıyor, kart
 * uzuyor ve ürünler aşağı itiliyordu. Artık tek yatay sıra: satır sayısı alt
 * kategori adediyle büyümez; fazlası yana kaydırılır (oklar, dokunma, touchpad).
 *
 * Veri panelden: gerçek hiyerarşi, panel sırası (`display_order`, API sıralı
 * döner), aktiflik. Görünürlük kuralı kategoriler sayfası ve anasayfa ızgarasıyla
 * AYNI: aktif ürünü olmayan alt kategori gösterilmez. Sayaç, listenin
 * gösterdiği küme: alt ağaç dahil yayındaki ürün sayısı.
 *
 * Görsel yoksa aynı ölçüde sade yer tutucu + baş harf; başka bir ürünün görseli
 * atanmaz. Resim yüklenmese de ad ve bağlantı çalışır.
 */
export default function SubcategoryStrip({ items, parentName }: { items: Category[]; parentName: string }) {
    const visible = items.filter((child) => child.activeProductCount > 0);
    if (!visible.length) return null;
    const stripId = 'alt-kategori-seridi';

    return (
        <nav aria-label={`${parentName} alt kategorileri`} className="mt-5 flex items-center gap-3">
            <ul id={stripId} className="no-scrollbar flex min-w-0 flex-1 gap-2.5 overflow-x-auto overscroll-x-contain py-0.5">
                {visible.map((child) => (
                    <li key={child.id} className="shrink-0">
                        <Link
                            href={routes.category(child.slug)}
                            className="flex h-full w-[112px] flex-col items-center gap-2 rounded-[14px] border border-slate-900/10 bg-surface px-2 pb-2.5 pt-2 text-center transition-colors hover:border-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
                        >
                            <span className="relative grid size-14 place-items-center overflow-hidden rounded-[12px] bg-shelf">
                                {child.image ? (
                                    <Image src={child.image.url} alt="" fill sizes="56px" className="object-cover" />
                                ) : (
                                    <span aria-hidden className="font-display text-[19px] font-semibold text-slate-400">
                                        {child.name.slice(0, 1).toLocaleUpperCase('tr')}
                                    </span>
                                )}
                            </span>
                            <span className="line-clamp-2 text-[12.5px] font-semibold leading-[1.25] text-slate-900">{child.name}</span>
                            <span className="text-[11px] text-slate-500">{child.activeProductCount} ürün</span>
                        </Link>
                    </li>
                ))}
            </ul>
            <ScrollArrows targetId={stripId} label="Alt kategoriler" className="hidden sm:flex" />
        </nav>
    );
}
