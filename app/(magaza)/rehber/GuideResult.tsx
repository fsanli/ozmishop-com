import Image from 'next/image';
import Link from 'next/link';
import Container from '@/components/Container';
import EmptyState from '@/components/EmptyState';
import { getSettings } from '@/lib/api';
import { CATEGORY_COLOR, SPEC_BADGE, type ColorKey } from '@/lib/colors';
import { formatPrice } from '@/lib/format';
import { routes } from '@/lib/site';
import type { GuideResult as Result } from '@/lib/types';

/**
 * İlk sipariş ipuçları. Metinler sabit ama içlerindeki SAYILAR ve ADLAR
 * `/ayarlar`dan geliyor (iade süresi, gönderici adı) — iki yerde farklı gün
 * sayısı yazmasın.
 */
const tipsFor = (returnDays: number, senderName: string): [ColorKey, string, string][] => [
    ['teal', 'Yanında kayganlaştırıcı almalı mıyım?',
        'Silikon ürünlerde yalnızca su bazlı kayganlaştırıcı kullanılır; ürün künyesinde bu bilgi ayrı bir satır olarak yazar.'],
    ['berry', 'Kargo kutusunda ne yazıyor?',
        `Kutu düz kahverengi, üzerinde yalnızca adres etiketi var. Gönderici olarak “${senderName}” görünür; kargo görevlisi içeriği görmez.`],
    ['plum', 'Beğenmezsem iade edebilir miyim?',
        `Hijyen ürünlerinde iade, ambalajın açılmamış olması koşuluna bağlıdır ve süre ${returnDays} gündür. Kutuyu açmadan önce ürün sayfasındaki ölçülere bakmanı öneririz.`],
    ['amber', 'Şarj adaptörü kutudan çıkıyor mu?',
        'Çoğu üründe hayır — USB kablosu vardır, adaptör yoktur. Kutu içeriği ürün sayfasında listelenir.'],
];

export default async function GuideResult({ result }: { result: Result }) {
    const settings = await getSettings();
    const tips = tipsFor(
        settings['icerik.iade_suresi_gun'] ?? 14,
        settings['gizlilik.gonderici_adi'] ?? 'OZM Lojistik',
    );

    if (result.picks.length === 0) {
        return (
            <Container narrow className="py-[clamp(24px,4vw,44px)]">
                <EmptyState
                    where="Rehber"
                    color="berry"
                    title="Bu cevaplara uyan ürün bulamadık"
                    description="Koşulların birlikte fazla dar kalmış olabilir. Bir soruyu değiştirip tekrar dene ya da tüm kataloğa göz at."
                    action={(
                        <div className="flex flex-wrap gap-2.5">
                            <Link href={routes.guide} className="btn-accent">Baştan başla</Link>
                            <Link href={routes.home} className="btn-secondary">Kataloğa git</Link>
                        </div>
                    )}
                />
            </Container>
        );
    }

    return (
        <>
            <Container narrow as="section" className="pt-[clamp(20px,3vw,40px)]">
                <span className="kicker text-accent-500">Sonuç</span>
                <h1 className="mt-3.5 max-w-[20ch] font-display text-[clamp(28px,4.6vw,52px)] font-semibold leading-[1.12] tracking-[-0.045em]">
                    Sana {result.picks.length === 1 ? 'bir ürün' : `${result.picks.length} ürün`} ayırdık
                </h1>
                <p className="mt-3.5 max-w-[58ch] text-[15px] leading-[1.7] text-slate-600">
                    Cevaplarına göre: {result.answers.map((answer) => answer.label.toLocaleLowerCase('tr')).join(', ')}.
                    {' '}Bu {result.picks.length === 1 ? 'ürün' : 'ürünler'} o koşulları karşılıyor.
                </p>

                <div className="mt-[18px] flex flex-wrap gap-2">
                    {result.answers.map((answer) => (
                        <span
                            key={answer.questionId}
                            className="inline-flex items-center gap-[7px] rounded-full border border-slate-900/10 bg-surface px-3.5 py-2 text-[12.5px] font-medium"
                        >
                            <span className={`dot ${CATEGORY_COLOR[answer.colorKey].dot}`} />
                            {answer.label}
                        </span>
                    ))}
                    <Link
                        href={routes.guide}
                        className="rounded-full border border-accent-500 px-3.5 py-2 text-[12.5px] font-bold text-accent-500 transition-colors hover:bg-accent-500 hover:text-white"
                    >
                        Baştan başla
                    </Link>
                </div>
            </Container>

            <Container narrow as="section" className="pt-[clamp(18px,2.6vw,30px)]">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,275px),1fr))] gap-[clamp(12px,1.8vw,20px)]">
                    {result.picks.map((pick, index) => (
                        <PickCard key={pick.id} pick={pick} highlight={index === 0} priority={index < 2} />
                    ))}
                </div>
                {result.totalMatched > result.picks.length && (
                    <p className="mt-4 text-[13px] text-slate-600">
                        Bu koşullara uyan toplam {result.totalMatched} ürün var.{' '}
                        <Link href={routes.home} className="link">Hepsini gör</Link>
                    </p>
                )}
            </Container>

            <Container narrow as="section" className="pb-[clamp(32px,5vw,60px)] pt-[clamp(28px,4vw,52px)]">
                <div className="flex flex-wrap gap-[clamp(18px,3vw,44px)]">
                    <div className="min-w-0 flex-[999_1_320px]">
                        <h2 className="mb-4 font-display text-[clamp(21px,2.8vw,30px)] font-semibold leading-[1.15] tracking-[-0.035em]">
                            İlk siparişte bunları da bilmek iyi olur
                        </h2>
                        <div className="card px-[22px] py-1">
                            {tips.map(([color, question, answer]) => (
                                <div key={question} className="flex gap-3 border-b border-slate-900/6 py-4 last:border-0">
                                    <span className={`dot-lg dot mt-1.5 ${CATEGORY_COLOR[color].dot}`} />
                                    <div>
                                        <div className="text-[15px] font-bold tracking-[-0.02em]">{question}</div>
                                        <p className="mt-1.5 max-w-[64ch] text-[13.5px] leading-relaxed text-slate-600">{answer}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="min-w-0 flex-[1_1_250px] lg:max-w-[350px]">
                        <div className="block-dark-soft p-[26px]">
                            <span className="kicker text-on-dark-berry">Hâlâ emin değil misin?</span>
                            <h3 className="mt-3.5 font-display text-[21px] font-semibold leading-[1.2] tracking-[-0.035em] text-on-dark">
                                Yazarak sor, aynı gün yanıtlayalım
                            </h3>
                            <p className="mb-[18px] mt-2.5 text-[13.5px] leading-relaxed text-on-dark/60">
                                Sorular bir danışman tarafından okunur, otomatik yanıt gönderilmez. Ürün önerisi istemiyorsan da yazabilirsin.
                            </p>
                            <Link href={routes.page('iletisim')} className="btn-primary rounded-[13px] px-[19px] py-[13px] text-sm">
                                Danışmana yaz
                            </Link>
                        </div>
                    </div>
                </div>
            </Container>
        </>
    );
}

function PickCard({
    pick, highlight, priority,
}: {
    pick: Result['picks'][number];
    highlight: boolean;
    priority: boolean;
}) {
    return (
        <article className={`card flex flex-col overflow-hidden ${highlight ? 'border-accent-500' : ''}`}>
            {pick.rankLabel && (
                <div className={`px-[18px] py-3 text-[12px] font-bold ${highlight ? 'bg-accent-500 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {pick.rankLabel}
                </div>
            )}

            <div className="relative aspect-[4/3] border-b border-slate-900/6 bg-paper">
                {pick.image ? (
                    <Image
                        src={pick.image.url}
                        alt={pick.image.alt ?? pick.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 380px"
                        className="object-cover"
                        priority={priority}
                    />
                ) : (
                    <span className="absolute inset-0 grid place-items-center text-[11px] font-medium text-slate-400">Ürün görseli</span>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-2.5 p-[18px]">
                <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-600">{pick.brand.name}</span>
                <h2 className="font-display text-[18px] font-semibold leading-[1.25] tracking-[-0.03em]">
                    <Link href={routes.product(pick.slug)} className="hover:text-accent-500">{pick.name}</Link>
                </h2>

                {pick.specs && pick.specs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {pick.specs.map((spec) => (
                            <span key={spec.label} className={`rounded-full px-2.5 py-[3px] text-[10.5px] font-semibold ${SPEC_BADGE[spec.kind]}`}>
                                {spec.label}
                            </span>
                        ))}
                    </div>
                )}

                <p className="flex-1 text-[13.5px] leading-relaxed text-slate-700">
                    <strong className="font-bold text-slate-900">Neden bu:</strong> {pick.why}
                </p>

                <span className="mt-1 font-display text-[21px] font-semibold tracking-[-0.035em]">
                    {formatPrice(pick.price ?? pick.minPrice)}
                </span>

                <Link href={routes.product(pick.slug)} className="btn-primary mt-1 w-full justify-center rounded-[12px] py-3 text-[13px]">
                    İncele
                </Link>
            </div>
        </article>
    );
}
