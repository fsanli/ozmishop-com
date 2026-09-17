import Container from '@/components/Container';
import { CATEGORY_COLOR } from '@/lib/colors';
import type { ColorKey } from '@/lib/colors';

/**
 * Güven şeridi. Kısa sözler, her biri kendi renk noktasıyla.
 * İçerik panelden gelir (`trust_strip` bloğu); boş gelirse varsayılanlar kullanılır.
 */
export interface TrustItem {
    colorKey: ColorKey;
    title: string;
    body: string;
}

const DEFAULTS: TrustItem[] = [
    { colorKey: 'berry', title: 'Gizli paketleme', body: 'Kargo etiketinde içerik bilgisi yer almaz, gönderici nötrdür.' },
    { colorKey: 'plum', title: 'Nötr ekstre adı', body: 'Kart ekstrenizde ürün adı değil, şirket unvanı görünür.' },
    { colorKey: 'amber', title: 'Aynı gün kargo', body: '16:00’ya kadar verilen siparişler aynı gün yola çıkar.' },
    { colorKey: 'teal', title: '14 gün iade', body: 'Ambalajı açılmamış ürünlerde koşulsuz iade hakkı.' },
];


export default function TrustStrip({ items }: { items?: TrustItem[] }) {
    const list: readonly TrustItem[] = items && items.length ? items : DEFAULTS;

    return (
        <Container as="section" className="pt-[clamp(30px,4vw,54px)]">
            <div className="grid gap-[clamp(10px,1.6vw,16px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,228px),1fr))]">
                {list.map((item) => (
                    <div key={item.title} className="card p-[20px_22px]">
                        <span className={`dot-lg dot ${CATEGORY_COLOR[item.colorKey].dot}`} />
                        <h2 className="mt-2.5 text-[14.5px] font-bold tracking-[-0.02em]">{item.title}</h2>
                        <p className="mt-1.5 text-[13px] leading-[1.6] text-slate-600">{item.body}</p>
                    </div>
                ))}
            </div>
        </Container>
    );
}
