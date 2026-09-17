import SubmitButton from '@/components/form/SubmitButton';
import Container from '@/components/Container';
import { getSettings } from '@/lib/api';
import { routes } from '@/lib/site';
import { subscribeAction } from '@/app/(gunluk)/gunluk/actions';

/**
 * Bülten bloğu. İstemci bileşeni değil: düz `<form action={…}>`, sonuç adrese
 * `?bulten=ok` olarak yazılır. Tasarımın vaadi metinde birebir korunuyor —
 * "nötr konu satırı" iddiası ürün kararı, kopya süsü değil.
 */
export default async function NewsletterBlock({
    state, source = 'gunluk', returnTo = routes.journal,
}: {
    state?: 'ok' | 'hata';
    /** Hangi yerleşimden geldiği — ölçüm için. */
    source?: string;
    returnTo?: string;
}) {
    // Vaat metni `/ayarlar`dan: "nötr konu satırı" bir ürün kararı ve
    // değişirse tek yerden değişmeli.
    const settings = await getSettings();
    const promise = settings['icerik.bulten_vaadi']
        ?? 'E-postanın konu satırı her zaman nötrdür: “Günlük — Eylül”. Ürün adı ya da görsel içermez.';

    return (
        <Container narrow as="section" className="pb-[clamp(32px,5vw,60px)] pt-[clamp(28px,4vw,48px)]">
            <div className="block-dark-soft flex flex-wrap items-center gap-[clamp(20px,4vw,52px)] p-[clamp(26px,4vw,48px)]">
                <div className="min-w-0 flex-[999_1_320px]">
                    <span className="kicker text-on-dark-amber">Ayda bir e-posta</span>
                    <h2 className="mt-3.5 max-w-[20ch] font-display text-[clamp(25px,3.8vw,42px)] font-semibold leading-[1.14] tracking-[-0.04em] text-on-dark">
                        Reklam yok. Ayda bir yazı, o kadar.
                    </h2>
                    <p className="mt-3.5 max-w-[50ch] text-[14.5px] leading-relaxed text-on-dark/60">{promise}</p>
                </div>

                <form action={subscribeAction} className="flex min-w-0 flex-[1_1_280px] flex-wrap gap-2">
                    <input type="hidden" name="kaynak" value={source} />
                    <input type="hidden" name="donus" value={returnTo} />
                    <label className="min-w-0 flex-[1_1_170px]">
                        <span className="sr-only">E-posta adresin</span>
                        <input
                            type="email"
                            name="email"
                            required
                            autoComplete="email"
                            placeholder="ornek@eposta.com"
                            className="w-full rounded-[14px] border border-on-dark/22 bg-on-dark/6 px-4 py-[15px] text-[15px] text-on-dark outline-none transition-colors placeholder:text-on-dark/40 focus:border-on-dark-rose"
                        />
                    </label>
                    <SubmitButton className="btn-primary flex-none rounded-[14px] px-6 py-[15px] text-[15px]" pendingLabel="Kaydediliyor…">
                        Kaydol
                    </SubmitButton>

                    {state === 'ok' && (
                        <p role="status" className="w-full text-[13px] font-semibold text-on-dark-teal">
                            Kaydın alındı. İlk yazıyı ayın başında göndeririz.
                        </p>
                    )}
                    {state === 'hata' && (
                        <p role="alert" className="w-full text-[13px] font-semibold text-on-dark-rose">
                            Kaydedilemedi. E-posta adresini kontrol edip tekrar dener misin?
                        </p>
                    )}
                </form>
            </div>
        </Container>
    );
}
