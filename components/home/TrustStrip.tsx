import Container from '@/components/Container';
import { getSettings } from '@/lib/api';
import { CATEGORY_COLOR } from '@/lib/colors';
import type { ColorKey } from '@/lib/colors';
import { fillSettings } from '@/lib/settings-text';

/**
 * Güven şeridi. Kısa sözler, her biri kendi renk noktasıyla.
 * İçerik panelden gelir (`trust_strip` bloğu); boş gelirse varsayılanlar kullanılır.
 *
 * Metinlerde ayar değişkeni kullanılabilir (`{{kargo.vaat}}`, `{{kargo.sureler}}`,
 * `{{icerik.iade_suresi_gun}}`): kargo saati ya da iade süresi değişince şerit
 * kendiliğinden doğru yazar. Değişkeni boş kalan kalem (ör. kesim saati yokken
 * "aynı gün kargo") HİÇ gösterilmez.
 */
export interface TrustItem {
    colorKey: ColorKey;
    title: string;
    body: string;
}

const DEFAULTS: TrustItem[] = [
    { colorKey: 'berry', title: 'Gizli paketleme', body: 'Kargo etiketinde içerik bilgisi yer almaz, gönderici nötrdür.' },
    { colorKey: 'plum', title: 'Nötr ekstre adı', body: 'Kart ekstrenizde ürün adı değil, şirket unvanı görünür.' },
    { colorKey: 'amber', title: '{{kargo.vaat}}', body: '{{kargo.sureler}}' },
    { colorKey: 'teal', title: '{{icerik.iade_suresi_gun}} gün içinde iade', body: 'Ambalajı açılmamış ürünlerde cayma hakkı. Hijyen istisnası iade sayfasında.' },
];


export default async function TrustStrip({ items }: { items?: TrustItem[] }) {
    const settings = await getSettings();
    const list = (items && items.length ? items : DEFAULTS)
        .map((item) => ({ ...item, title: fillSettings(item.title, settings), body: fillSettings(item.body, settings) }))
        .filter((item) => item.title && item.body);
    if (list.length === 0) return null;

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
