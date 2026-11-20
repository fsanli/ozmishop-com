'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    useEffect, useMemo, useState, useSyncExternalStore,
} from 'react';
import { formatPrice } from '@/lib/format';
import { routes } from '@/lib/site';
import type { GuideV2Answer, GuideV2Pick, GuideV2Step } from '@/lib/types';

/**
 * BAŞLANGIÇ REHBERİ V2 — koşullu akış (canlıya geçiş S08, Ek A).
 *
 * Akışın kendisi API'de (api/guide/v2/flow.js): her adımda cevap dizisi
 * gönderilir, sunucu sıradaki soruyu YALNIZ AÇIK seçeneklerle ya da sonucu
 * döner. Burada karar yok, yalnız gösterim ve gezinme.
 *
 * GİZLİLİK: cevaplar adrese YAZILMAZ (yalnız `?adim=3`), analitiğe gitmez,
 * hesaba kaydedilmez. Sekme açıkken geri/ileri ve yenileme için bu sekmenin
 * `sessionStorage`'ında durur (`ozmi_rehber`; hızlı çıkış tuşu `ozmi_`
 * önekli her şeyi siler). Önceki bir cevap değişince sonraki cevaplar silinir.
 *
 * Eski V1 bağlantısı (`?c=…`) buraya gelmez: sayfa "Rehber yenilendi" der.
 */
const STORAGE_KEY = 'ozmi_rehber';
const CHANGE_EVENT = 'ozmi:rehber';

const subscribe = (callback: () => void) => {
    window.addEventListener(CHANGE_EVENT, callback);
    window.addEventListener('storage', callback);
    return () => {
        window.removeEventListener(CHANGE_EVENT, callback);
        window.removeEventListener('storage', callback);
    };
};
const readRaw = () => {
    try {
        return window.sessionStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
};
const parse = (raw: string | null): GuideV2Answer[] => {
    try {
        const parsed = raw ? JSON.parse(raw) as { v?: number; answers?: GuideV2Answer[] } : null;
        return parsed?.v === 2 && Array.isArray(parsed.answers) ? parsed.answers : [];
    } catch {
        return [];
    }
};
const write = (answers: GuideV2Answer[] | null) => {
    try {
        if (answers) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 2, answers }));
        else window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
        // Gizli mod / kota: akış yine çalışır, yalnız yenilemede baştan başlar.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
};

type Fetched = { key: string; status: 'ready' | 'stale' | 'error'; step?: GuideV2Step };

export default function GuideV2({
    start, packaging, returnDays,
}: {
    /** İlk soru (önbellekli, sunucuda): ilk adım istek beklemeden çizilir. */
    start: GuideV2Step | null;
    packaging: string;
    returnDays: number;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const adim = searchParams.get('adim');
    const view: 'intro' | 'quiz' | 'result' = !adim ? 'intro' : adim === 'sonuc' ? 'result' : 'quiz';
    const index = view === 'quiz' ? Math.max(1, Math.floor(Number(adim)) || 1) : 0;

    const raw = useSyncExternalStore(subscribe, readRaw, () => null);
    const stored = useMemo(() => parse(raw), [raw]);
    const answers = useMemo(() => {
        if (view === 'result') return stored;
        if (view === 'quiz') return stored.slice(0, index - 1);
        return [];
    }, [view, stored, index]);
    const key = JSON.stringify(answers);

    const [fetched, setFetched] = useState<Fetched | null>(null);
    const [retry, setRetry] = useState(0);
    const needsFetch = view !== 'intro' && !(answers.length === 0 && start);

    useEffect(() => {
        if (!needsFetch) return undefined;
        const controller = new AbortController();
        fetch('/api/rehber', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: JSON.parse(key) }),
            signal: controller.signal,
        })
            .then(async (response) => {
                if (response.status === 400) return setFetched({ key, status: 'stale' });
                if (!response.ok) return setFetched({ key, status: 'error' });
                return setFetched({ key, status: 'ready', step: await response.json() as GuideV2Step });
            })
            .catch(() => {
                if (!controller.signal.aborted) setFetched({ key, status: 'error' });
            });
        return () => controller.abort();
    }, [key, needsFetch, retry]);

    const current: Fetched | null = needsFetch
        ? (fetched?.key === key ? fetched : null)
        : view === 'intro' ? null : { key, status: start ? 'ready' : 'error', step: start ?? undefined };

    // Adres sonuçla uyumlu olsun (geçmiş kaydı eklemeden): son soru cevaplanınca "sonuc".
    useEffect(() => {
        const step = current?.step;
        if (!step) return;
        if (step.done && view === 'quiz') router.replace(`${routes.guide}?adim=sonuc`, { scroll: false });
        if (!step.done && view === 'result') router.replace(`${routes.guide}?adim=${answers.length + 1}`, { scroll: false });
    }, [current?.step, view, answers.length, router]);

    const choose = (question: string, option: string) => {
        // Önceki bir soruya dönülüp cevap değişince sonraki cevaplar SİLİNİR.
        const next = [...answers, { q: question, o: option }];
        write(next);
        router.push(`${routes.guide}?adim=${next.length + 1}`);
    };
    const restart = () => {
        write(null);
        router.push(`${routes.guide}?adim=1`);
    };
    const goTo = (step: number) => router.push(`${routes.guide}?adim=${Math.max(1, step)}`);

    if (view === 'intro') return <Intro />;

    if (!current) {
        return (
            <Shell>
                <div className="h-[clamp(320px,38vw,460px)] animate-pulse rounded-[24px] bg-slate-100" aria-label="Yükleniyor" />
            </Shell>
        );
    }

    if (current.status === 'stale') {
        return (
            <Shell>
                <Notice title="Rehber yenilendi; yeniden başlayalım." body="Daha önceki cevapların güncel sorularla eşleşmiyor. Birkaç kısa soruyla seçenekleri yeniden daraltalım.">
                    <button type="button" onClick={restart} className="btn-accent">Başlayalım</button>
                </Notice>
            </Shell>
        );
    }

    if (current.status === 'error' || !current.step) {
        // Yükleme hatası "uygun ürün yok" diye sunulmaz (Ek A §10).
        return (
            <Shell>
                <Notice title="Rehber şu anda yüklenemedi." body="Bağlantı kaynaklı geçici bir sorun olabilir. Cevapların korunuyor; yeniden deneyebilirsin.">
                    <button type="button" onClick={() => setRetry((value) => value + 1)} className="btn-accent">Tekrar dene</button>
                    <Link href={routes.categories} className="btn-secondary">Kategorileri keşfet</Link>
                </Notice>
            </Shell>
        );
    }

    const { step } = current;

    if (!step.done && step.closed) {
        return (
            <Shell>
                <Notice title="Rehber şu anda hazırlanıyor." body="Önerebileceğimiz ürünleri gözden geçiriyoruz. Bu arada kategorilere göz atabilir ya da bize yazabilirsin.">
                    <Link href={routes.categories} className="btn-accent">Kategorileri keşfet</Link>
                    <Link href={routes.page('iletisim')} className="btn-secondary">Ürün seçimi için destek al</Link>
                </Notice>
            </Shell>
        );
    }

    if (!step.done && step.question) {
        const { question } = step;
        const progress = step.total ? Math.round(((step.step ?? 1) / step.total) * 100) : null;
        return (
            <Shell>
                <div className="flex flex-wrap items-center gap-3.5">
                    <span className="flex-none whitespace-nowrap text-[12px] font-bold text-slate-600">
                        Soru {step.step}{step.total ? ` / ${step.total}` : ''}
                    </span>
                    {progress !== null && (
                        <span
                            className="relative h-[5px] min-w-[120px] flex-1 rounded-full bg-slate-200"
                            role="progressbar"
                            aria-valuenow={step.step}
                            aria-valuemin={1}
                            aria-valuemax={step.total ?? undefined}
                            aria-label="Rehber ilerlemesi"
                        >
                            <span className="absolute inset-y-0 left-0 rounded-full bg-accent-500" style={{ width: `${progress}%` }} />
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => (answers.length ? goTo(answers.length) : router.push(routes.guide))}
                        className="ml-auto text-[12.5px] text-slate-600 hover:text-accent-500"
                    >
                        ← Geri
                    </button>
                </div>

                <h1 className="mt-[26px] max-w-[20ch] font-display text-[clamp(27px,4.4vw,46px)] font-semibold leading-[1.14] tracking-[-0.045em]">
                    {question.question}
                </h1>
                {question.hint && <p className="mt-3.5 max-w-[56ch] text-[14.5px] leading-relaxed text-slate-600">{question.hint}</p>}

                <div className="mt-[26px] flex flex-col gap-2.5">
                    {question.options.map((option) => (
                        <button
                            key={option.key}
                            type="button"
                            onClick={() => choose(question.key, option.key)}
                            className="flex w-full items-center gap-4 rounded-[18px] border border-slate-900/9 bg-surface px-[22px] py-5 text-left transition-colors hover:border-accent-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
                        >
                            <span className="min-w-0 flex-1">
                                <span className="block font-display text-[18px] font-semibold tracking-[-0.03em]">{option.label}</span>
                                {option.hint && <span className="mt-0.5 block text-[13.5px] leading-snug text-slate-600">{option.hint}</span>}
                            </span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="flex-none text-accent-500" aria-hidden>
                                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                            </svg>
                        </button>
                    ))}
                </div>

                {question.explore && (
                    <p className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
                        <Link href={routes.categories} className="link">Kategorileri keşfet</Link>
                        <Link href={routes.page('iletisim')} className="link">Ürün seçimi için destek al</Link>
                    </p>
                )}

                <p className="mt-5 text-[12px] leading-relaxed text-slate-500">
                    Cevapların hesabına ya da bir profile kaydedilmez; yalnızca öneri hesaplamak için kullanılır.
                </p>
            </Shell>
        );
    }

    return (
        <Result
            step={step}
            packaging={packaging}
            returnDays={returnDays}
            onRestart={restart}
            onChangeBudget={() => goTo(answers.length)}
            onChangePreferences={() => goTo(2)}
        />
    );
}

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <div className="mx-auto w-full max-w-[820px] px-[clamp(16px,4vw,44px)] pb-[clamp(40px,6vw,84px)] pt-[clamp(22px,3.4vw,52px)]">
            {children}
            <noscript>
                <p className="mt-6 rounded-[14px] bg-amber-tint px-4 py-3 text-[13px] text-amber-ink">
                    Rehber için JavaScript gerekiyor. <a href={routes.categories} className="link">Doğrudan kategorilere göz atabilirsin.</a>
                </p>
            </noscript>
        </div>
    );
}

function Notice({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
    return (
        <div className="card card-xl p-[clamp(22px,3.4vw,38px)]">
            <h1 className="font-display text-[clamp(23px,3.4vw,34px)] font-semibold leading-[1.15] tracking-[-0.04em]">{title}</h1>
            <p className="mt-3 max-w-[56ch] text-[14.5px] leading-relaxed text-slate-600">{body}</p>
            <div className="mt-5 flex flex-wrap gap-2.5">{children}</div>
        </div>
    );
}

/** Ek A §2: giriş. Metinler onaylı; akış 3–5 soru. */
function Intro() {
    return (
        <div className="mx-auto w-full max-w-[1100px] px-[clamp(16px,4vw,44px)] pt-[clamp(18px,2.6vw,30px)]">
            <div className="relative overflow-hidden rounded-[28px] bg-slate-900 p-[clamp(30px,5vw,76px)] text-on-dark">
                <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-[3px]"
                    style={{ background: 'linear-gradient(180deg, #9b1f47, #6b3fa0 40%, #c77d12 70%, #10726b)' }}
                />
                <span className="kicker text-on-dark-berry">Başlangıç rehberi</span>
                <h1 className="mt-4 max-w-[16ch] font-display text-[clamp(34px,6vw,72px)] font-semibold leading-[1.1] tracking-[-0.05em]">
                    Sana uygun ürünü birlikte bulalım.
                </h1>
                <p className="mt-5 max-w-[52ch] text-[clamp(14.5px,1.6vw,17px)] leading-[1.7] text-on-dark/65">
                    Birkaç kısa soruyla aradığın kullanım şekline ve bütçene uygun seçenekleri daraltalım. İlgini çekmeyen soruları atlayabilirsin.
                </p>
                <p className="mt-2 text-[13px] text-on-dark/50">Genellikle 3–5 soru sürer. Cevapların hesabına ya da bir profile kaydedilmez.</p>
                <div className="mt-7 flex flex-wrap items-center gap-4">
                    <Link href={`${routes.guide}?adim=1`} className="btn-primary rounded-[16px] px-[26px] py-[17px] text-base">Başlayalım</Link>
                    <Link href={routes.categories} className="text-[14px] text-on-dark/75 underline underline-offset-4 hover:text-on-dark">
                        Doğrudan kategorilere göz at
                    </Link>
                </div>
            </div>
        </div>
    );
}

function Result({
    step, packaging, returnDays, onRestart, onChangeBudget, onChangePreferences,
}: {
    step: GuideV2Step;
    packaging: string;
    returnDays: number;
    onRestart: () => void;
    onChangeBudget: () => void;
    onChangePreferences: () => void;
}) {
    const picks = step.picks ?? [];
    const chips = (
        <div className="mt-[18px] flex flex-wrap gap-2">
            {step.answers.map((answer) => (
                <span key={`${answer.q}:${answer.o}`} className="inline-flex items-center rounded-full border border-slate-900/10 bg-surface px-3.5 py-2 text-[12.5px] font-medium">
                    {answer.label}
                </span>
            ))}
            <button type="button" onClick={onRestart} className="rounded-full border border-accent-500 px-3.5 py-2 text-[12.5px] font-bold text-accent-500 transition-colors hover:bg-accent-500 hover:text-white">
                Baştan başla
            </button>
        </div>
    );

    if (!picks.length) {
        // Ek A §6: ilgisiz ürün, taslak/XML ürünü ya da bütçeyi aşan "en yakın" ürün EKLENMEZ.
        return (
            <Shell>
                <Notice
                    title="Bu seçimlerle uygun bir ürün bulamadık."
                    body="Şu anda kullanım amacını ve bütçeni birlikte karşılayan, satışa açık bir seçenek bulunmuyor. Bütçeni veya tercihlerini değiştirerek yeniden bakabilirsin."
                >
                    <button type="button" onClick={onChangeBudget} className="btn-accent">Bütçemi değiştir</button>
                    <button type="button" onClick={onChangePreferences} className="btn-secondary">Tercihlerimi düzenle</button>
                    <Link href={routes.categories} className="btn-secondary">Kategorileri keşfet</Link>
                </Notice>
                {chips}
            </Shell>
        );
    }

    return (
        <div className="mx-auto w-full max-w-[1100px] px-[clamp(16px,4vw,44px)] pb-[clamp(32px,5vw,60px)] pt-[clamp(20px,3vw,40px)]">
            <span className="kicker text-accent-500">Sonuç</span>
            <h1 className="mt-3.5 max-w-[20ch] font-display text-[clamp(28px,4.6vw,52px)] font-semibold leading-[1.12] tracking-[-0.045em]">
                Seçimlerine uygun seçenekler
            </h1>
            <p className="mt-3.5 max-w-[58ch] text-[15px] leading-[1.7] text-slate-600">
                Kullanım amacına, tercihlerine ve bütçene göre bu ürünleri daralttık.
            </p>
            {chips}

            <div className="mt-[clamp(18px,2.6vw,30px)] grid grid-cols-[repeat(auto-fit,minmax(min(100%,275px),1fr))] gap-[clamp(12px,1.8vw,20px)]">
                {picks.map((pick, position) => <PickCard key={pick.id} pick={pick} priority={position < 2} />)}
            </div>

            <div className="mt-[clamp(28px,4vw,52px)] card px-[22px] py-1">
                {[
                    ['Paketin üzerinde ne yazıyor?', packaging],
                    ['Beğenmezsem iade edebilir miyim?', `Hijyen ürünlerinde iade, koruyucu ambalajın açılmamış olması koşuluna bağlıdır ve süre ${returnDays} gündür. Ayrıntılar iade koşulları sayfasında.`],
                ].map(([question, answer]) => (
                    <div key={question} className="border-b border-slate-900/6 py-4 last:border-0">
                        <div className="text-[15px] font-bold tracking-[-0.02em]">{question}</div>
                        <p className="mt-1.5 max-w-[64ch] text-[13.5px] leading-relaxed text-slate-600">{answer}</p>
                    </div>
                ))}
                <p className="pb-4 text-[13px]">
                    <Link href={routes.page('iade-ve-degisim')} className="link">İade ve değişim koşulları</Link>
                    {' · '}
                    <Link href={routes.page('iletisim')} className="link">Ürün seçimi için destek al</Link>
                </p>
            </div>
        </div>
    );
}

function PickCard({ pick, priority }: { pick: GuideV2Pick; priority: boolean }) {
    return (
        <article className="card flex flex-col overflow-hidden">
            <div className="relative aspect-[4/3] border-b border-slate-900/6 bg-paper">
                {pick.image ? (
                    <Image
                        src={pick.image.url}
                        alt={pick.image.alt ?? pick.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 380px"
                        className="object-cover"
                        loading={priority ? 'eager' : undefined}
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
                <p className="flex-1 text-[13.5px] leading-relaxed text-slate-700">{pick.why}</p>
                {pick.familySize > 1 && <p className="text-[12px] text-slate-500">Farklı renk/hacim seçenekleri var.</p>}
                <span className="mt-1 font-display text-[21px] font-semibold tracking-[-0.035em]">{formatPrice(pick.price)}</span>
                <Link href={routes.product(pick.slug)} className="btn-primary mt-1 w-full justify-center rounded-[12px] py-3 text-[13px]">
                    Ürünü incele
                </Link>
            </div>
        </article>
    );
}
