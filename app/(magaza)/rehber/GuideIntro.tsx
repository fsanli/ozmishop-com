import Link from 'next/link';
import Container from '@/components/Container';
import { getSettings } from '@/lib/api';
import { CATEGORY_COLOR, type ColorKey } from '@/lib/colors';
import { routes } from '@/lib/site';
import type { GuideQuestion } from '@/lib/types';

/**
 * Rehber girişi.
 *
 * Başlık ve giriş metni `/ayarlar`dan gelir (`icerik.rehber_giris_*`); ayar
 * silinirse Ek A'nın onaylı metni basılır. Soru sayısı metne otomatik eklenir —
 * editör "dört soru" yazıp beşinciyi ekleyince sayfa yalan söylemesin.
 *
 * Kartlar ürün sayfasında NEREYE bakılacağını anlatır; ürün hakkında genel
 * vaat vermez. "45 dB altı duyulmaz", "IPX7 tercih edilir", "ilk üründe küçük
 * olan iyidir" gibi doğrulanmamış genellemeler çıkarıldı (canlıya geçiş S08).
 */
const BASICS: [string, ColorKey, string, string][] = [
    ['01', 'plum', 'Malzeme', 'Gövde malzemesi ürün sayfasındaki teknik künyede yazar. Kayganlaştırıcı seçerken bu bilgiye bak.'],
    ['02', 'teal', 'Su koruması', 'IPX4 sıçramaya, IPX7 suya batırılmaya dayanıklı demektir. Ürünün değeri künyede ayrı bir satırdır.'],
    ['03', 'amber', 'Ölçüler', 'Uzunluk ve çap santimetre olarak yazar. Gövde ölçüsü ile kullanılabilir uzunluk farklı olabilir.'],
];

/**
 * Soru sayısı ve iade süresi sabit YAZILMAZ. Her söz gerçek davranışa dayanır:
 * öneriler satışta + stokta + bütçe içi ürünlerden gelir ve koşullar
 * kendiliğinden esnetilmez (S08). İade, koruyucu ambalajı açılmamış ürün için.
 */
const promises = (questionCount: number, returnDays: number): [ColorKey, string][] => [
    ['rose', `${questionCount} kısa soru, her birinde tek seçim.`],
    ['plum', 'Üyelik ve e-posta istenmez; cevapların hesabına kaydedilmez.'],
    ['amber', 'Yalnızca satışta olan ve bütçene giren ürünler gösterilir.'],
    ['teal', `Koruyucu ambalajı açılmamış üründe ${returnDays} gün içinde cayma hakkı.`],
];

export default async function GuideIntro({ questions }: { questions: GuideQuestion[] }) {
    const settings = await getSettings();
    const headline = settings['icerik.rehber_giris_baslik'] ?? 'Sana uygun ürünü birlikte bulalım.';
    const body = settings['icerik.rehber_giris_metni']
        ?? 'Birkaç kısa soruyla aradığın kullanım şekline ve bütçene uygun seçenekleri daraltalım.';
    const returnDays = Number(settings['icerik.iade_suresi_gun']) || 14;

    return (
        <>
            <Container narrow as="section" className="pt-[clamp(18px,2.6vw,30px)]">
                <div className="relative overflow-hidden rounded-[28px] bg-slate-900 p-[clamp(30px,5vw,76px)] text-on-dark">
                    {/* Tasarımın sol kenarındaki renk geçişi: dört paletin şeridi. */}
                    <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 w-[3px]"
                        style={{ background: 'linear-gradient(180deg, #9b1f47, #6b3fa0 40%, #c77d12 70%, #10726b)' }}
                    />

                    <div className="flex flex-wrap items-end gap-[clamp(22px,4vw,60px)]">
                        <div className="min-w-0 flex-[999_1_340px]">
                            <span className="kicker text-on-dark-berry">Başlangıç rehberi</span>
                            <h1 className="mt-4 max-w-[14ch] font-display text-[clamp(36px,6.6vw,80px)] font-semibold leading-[1.1] tracking-[-0.05em]">
                                {headline}
                            </h1>
                            <p className="mt-5 max-w-[52ch] text-[clamp(14.5px,1.6vw,17px)] leading-[1.7] text-on-dark/65">
                                {questions.length} soru soracağız. {body}
                            </p>
                            <Link
                                href={`${routes.guide}?adim=1`}
                                className="btn-primary mt-7 rounded-[16px] px-[26px] py-[17px] text-base"
                            >
                                Başlayalım
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                                    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                                </svg>
                            </Link>
                        </div>

                        <ul className="min-w-0 flex-[1_1_250px] rounded-[20px] bg-on-dark/6 px-5 py-2">
                            {promises(questions.length, returnDays).map(([color, text]) => (
                                <li key={text} className="flex items-start gap-3 border-b border-on-dark/9 py-3.5 last:border-0">
                                    <span className={`dot-lg dot mt-1.5 ${CATEGORY_COLOR[color].onDarkDot}`} />
                                    <span className="text-[13.5px] leading-snug text-on-dark/85">{text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </Container>

            <Container narrow as="section" className="pb-[clamp(32px,5vw,60px)] pt-[clamp(28px,4vw,52px)]">
                <h2 className="font-display text-[clamp(24px,3vw,34px)] font-semibold leading-[1.12] tracking-[-0.04em]">
                    Önce şunları bilmek işini kolaylaştırır
                </h2>
                <p className="mb-[22px] mt-2 max-w-[58ch] text-[14.5px] leading-relaxed text-slate-600">
                    Testi atlamak istersen ürün sayfalarında bu başlıklara bakman yeterli.{' '}
                    <Link href={routes.categories} className="link">Doğrudan kategorilere göz at</Link>
                </p>

                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,245px),1fr))] gap-[clamp(10px,1.6vw,16px)]">
                    {BASICS.map(([no, color, title, body]) => {
                        const colors = CATEGORY_COLOR[color];
                        return (
                            <article key={no} className={`card card-edge-top ${colors.edgeTop} p-[22px]`}>
                                <span className={`text-[12px] font-bold ${colors.ink}`}>{no}</span>
                                <h3 className="mt-2.5 font-display text-[18px] font-semibold leading-[1.2] tracking-[-0.03em]">{title}</h3>
                                <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">{body}</p>
                            </article>
                        );
                    })}
                </div>
            </Container>
        </>
    );
}
