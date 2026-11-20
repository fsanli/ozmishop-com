import Link from 'next/link';
import Container from '@/components/Container';
import { getGuideQuestions, getGuideV2Start, getSettings } from '@/lib/api';
import { routes } from '@/lib/site';

/**
 * "İlk kez alıyorsan" bloğu. Rehberin sorularını PANELDEN okur: sabit bir liste
 * yazsaydık editör beşinci soruyu eklediğinde anasayfa yalan söylemeye başlardı.
 *
 * Başlık/açıklama/buton metni anasayfa blok ayarlarından gelir.
 *
 * V2'de (`rehber.surum = 2`) akış koşullu: sorular sırayla değil cevaba göre
 * geliyor. Blok bu yüzden yalnız İLK soruyu ve yayında karşılığı olan
 * seçeneklerini gösterir — kapalı bir yol anasayfada vaat edilmez.
 */
export default async function GuidePromo({
    headline, body, buttonText,
}: {
    headline?: string;
    body?: string;
    buttonText?: string;
} = {}) {
    const settings = await getSettings();
    let steps: { no: string; question: string; hint: string }[];
    if (String(settings['rehber.surum'] ?? '1') === '2') {
        const start = await getGuideV2Start().catch(() => null);
        const first = start && !start.closed ? start.question : null;
        if (!first || first.options.length === 0) return null;
        steps = first.options.filter((option) => option.key !== 'kararsiz').slice(0, 5).map((option, index) => ({
            no: String(index + 1).padStart(2, '0'),
            question: option.label,
            hint: option.hint ?? '',
        }));
    } else {
        const questions = await getGuideQuestions();
        // Rehberde hiç soru yoksa blok basılmaz: boş bir vaat göstermek yok.
        if (questions.length === 0) return null;
        steps = questions.slice(0, 4).map((question, index) => ({
            no: String(index + 1).padStart(2, '0'),
            question: question.question,
            hint: question.options.map((option) => option.label).join(' · '),
        }));
    }

    return (
        <Container as="section" className="pt-[clamp(30px,4vw,54px)]">
            {/* grid-cols-1 = minmax(0,1fr). Sütun tanımı verilmeyince örtük sütun
                `auto` oluyor ve `truncate`lı ipucunun TAM genişliğine kadar büyüyordu;
                mobilde buton ekranın dışına taşıyordu. */}
            <div className="block-dark-soft grid grid-cols-1 gap-[clamp(20px,3vw,44px)] p-[clamp(24px,4vw,52px)] lg:grid-cols-2">
                <div>
                    <span className="kicker text-on-dark-berry">Başlangıç rehberi</span>
                    <h2 className="heading-2 mt-3 text-on-dark">{headline || 'Sana uygun ürünü birlikte bulalım.'}</h2>
                    <p className="mt-4 max-w-[46ch] text-[14.5px] leading-relaxed text-on-dark/62">
                        {body || 'Birkaç kısa soruyla aradığın kullanım şekline ve bütçene uygun seçenekleri daraltalım.'}
                    </p>
                </div>

                <div>
                    {steps.map((step) => (
                        <div key={step.no} className="flex items-baseline gap-3.5 border-b border-on-dark/10 py-3 last:border-0">
                            <span className="text-[11.5px] font-bold text-on-dark/45">{step.no}</span>
                            <div className="min-w-0 flex-1">
                                <div className="text-[14.5px] font-bold">{step.question}</div>
                                <div className="mt-0.5 truncate text-[12.5px] text-on-dark/55">{step.hint}</div>
                            </div>
                        </div>
                    ))}
                    <Link href={routes.guide} className="btn-primary mt-5 w-full justify-center">
                        {buttonText || 'Başlayalım'}
                    </Link>
                </div>
            </div>
        </Container>
    );
}
