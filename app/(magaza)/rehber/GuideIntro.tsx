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
 * silinirse varsayılan basılır ve sayfa boş kalmaz. Soru sayısı metne otomatik
 * eklenir — editör "dört soru" yazıp beşinciyi ekleyince sayfa yalan söylemesin.
 *
 * "Önce şunları bilmek işini kolaylaştırır" kartları sabit: dört kart, her biri
 * kendi rengiyle tasarımın parçası. Serbest metne açmak düzeni bozardı; içerik
 * değişikliği gerekirse kartlar bir sonraki turda `settings`e taşınır.
 */
const BASICS: [string, ColorKey, string, string][] = [
    ['01', 'plum', 'Malzeme', 'Tıbbi sınıf silikon gözeneksizdir: hijyeniktir, koku yapmaz. Jelly ve TPE ürünlerden uzak dur.'],
    ['02', 'berry', 'Ses seviyesi', '45 dB altı fısıltı düzeyidir. Ev arkadaşın ya da ince duvar varsa tek belirleyici kriter budur.'],
    ['03', 'teal', 'Su geçirmezlik', 'IPX4 sıçramaya dayanır, IPX7 tamamen suya batırılabilir. Temizlik kolaylığı için IPX7 tercih edilir.'],
    ['04', 'amber', 'Boyut', 'İlk üründe küçük olan daha iyidir. Ürün sayfalarında uzunluk ve genişlik santimetre olarak yazar.'],
];

const PROMISES: [ColorKey, string][] = [
    ['rose', 'Dört soru, tek seçim — atlanabilir.'],
    ['plum', 'Cevaplar kaydedilmez, e-posta istenmez.'],
    ['amber', 'Öneriler stoktan ve fiyat sırasına göre değil, uygunluğa göre.'],
    ['teal', 'Beğenmezsen 14 gün koşulsuz iade.'],
];

export default async function GuideIntro({ questions }: { questions: GuideQuestion[] }) {
    const settings = await getSettings();
    const headline = settings['icerik.rehber_giris_baslik'] ?? 'İlk kez alıyorsan.';
    const body = settings['icerik.rehber_giris_metni']
        ?? 'Hiçbiri kişisel değil, hiçbir cevap kaydedilmiyor. Sonunda üç ürünlük kısa bir liste ve her biri için neden önerdiğimizin açıklaması var.';

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
                                Başla — 60 saniye
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                                    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                                </svg>
                            </Link>
                        </div>

                        <ul className="min-w-0 flex-[1_1_250px] rounded-[20px] bg-on-dark/6 px-5 py-2">
                            {PROMISES.map(([color, text]) => (
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
                    Testi atlamak istersen dört başlık zaten cevabın büyük kısmını veriyor.
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
