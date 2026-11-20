'use client';

import {
    useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProductCardView from '@/components/ProductCardView';
import { FavoriteButton } from '@/components/product/ProductActions';
import { ItemListTracker } from '@/components/analytics/TrackEvent';
import { fromCard } from '@/lib/analytics/items';
import { ANALYTICS_ENABLED } from '@/lib/consent-format';
import { pageHref, type SearchParams } from '@/lib/listing';
import type { Pagination, ProductCard, SiteSettings } from '@/lib/types';
import ListingPagination from './ListingPagination';

/**
 * KATEGORİ LİSTESİNDE OTOMATİK YÜKLEME + GERİ DÖNÜŞTE AYNI YERE DÖNME (S02/S03).
 *
 * İlk sayfa SUNUCUDA çizilir ve `children` olarak gelir (sunucu kartları, dolu
 * kalp akışı, JSON-LD). Liste sonuna yaklaşınca sonraki sayfa vekilden
 * (`/api/kategori/[slug]/urunler`) alınır ve AYNI ızgaraya eklenir.
 *
 * Arama motoru ve JavaScript'siz ziyaretçi için gerçek sayfa adresleri durur:
 * sayfalama <a href> bağlantılarıyla görünür kalır, `?sayfa=N` doğrudan
 * açılınca o grup gelir ve üstte "Önceki ürünler" bağlantısı çıkar. Kaydırma
 * sırasında adres DEĞİŞMEZ — geçmiş her grup için yeni kayıtla dolmaz.
 *
 * Geri dönüş iki katmanlı:
 *   1. Next 16 `<Activity>` son rotaları DOM ve state'iyle saklıyor
 *      (node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md).
 *      Bileşen `bfcacheId` ile anahtarlı: yeni gezinme sıfırlar, geri/ileri
 *      korur. Eklenen sayfalar yerinde kalır.
 *   2. Rota tahliye edildiyse (üçten fazla sayfa gezildi), sayfa yenilendiyse
 *      ya da tarayıcı önbelleği kaçtıysa: karta tıklarken / sayfadan çıkarken
 *      yüklü kartlar + çapa kart `sessionStorage`'a yazılır ve o geçmiş girişi
 *      `history.replaceState` ile işaretlenir (yeni kayıt açılmaz). Aynı girişe
 *      dönülünce kartlar yeniden çizilir ve çapa karta kaydırılır. Ürün artık
 *      yoksa aynı sıradaki karta gidilir.
 *
 * Görseller `aspect-square` kabında: geç yüklenen resim konumu kaydırmaz.
 * Global kaydırma geri yüklemesine dokunulmaz.
 */

const SNAPSHOT_PREFIX = 'ozmi_liste:';
/** Eski bir oturumun listesi geri getirilmez: fiyat/stok o arada değişmiş olabilir. */
const SNAPSHOT_TTL_MS = 30 * 60 * 1000;
/** Yapışkan başlığın altında kalan ilk kart "görünen kart" sayılır. */
const HEADER_OFFSET = 96;

interface Chunk { page: number; items: ProductCard[] }

interface Snapshot {
    v: 1;
    startPage: number;
    chunks: Chunk[];
    totalPages: number;
    total: number;
    anchorId: number | null;
    anchorIndex: number;
    anchorTop: number;
    savedAt: number;
}

interface Props {
    children: ReactNode;
    listKey: string;
    /** Sonraki sayfanın vekil adresi (sorgusuz). */
    endpoint: string;
    /** `sayfa` HARİÇ sorgu dizesi; vekile aynen eklenir. */
    query: string;
    pagination: Pagination;
    initialIds: number[];
    basePath: string;
    searchParams: SearchParams;
    settings: SiteSettings;
    siteUrl: string;
}

const readSnapshot = (listKey: string): Snapshot | null => {
    try {
        const raw = window.sessionStorage.getItem(SNAPSHOT_PREFIX + listKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Snapshot;
        if (parsed.v !== 1 || Date.now() - parsed.savedAt > SNAPSHOT_TTL_MS) return null;
        return parsed;
    } catch {
        return null;
    }
};

/**
 * Belge YENİLEME ya da tarayıcı geri/ileri ile mi yüklendi? Yalnız belgenin
 * İLK takılmasında sorulur: sonraki istemci gezinmelerinde belgenin yükleniş
 * türü aynı kalır ve yeni bir gezinmeyi "geri dönüş" sanırdık. Firefox'ta
 * Next'in açılıştaki `replaceState`'i geçmiş işaretini eziyordu; bu sinyal
 * o durumda yenileme/geri dönüşü yine tanır.
 */
let documentChecked = false;
const documentRestored = () => {
    if (documentChecked) return false;
    documentChecked = true;
    try {
        const type = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type;
        return type === 'reload' || type === 'back_forward';
    } catch {
        return false;
    }
};

/** Bu geçmiş girişi bu listeye mi ait? (Yeni bir gezinmede işaret olmaz.) */
const entryIsMarked = (listKey: string) => {
    try {
        return (window.history.state as { ozmiListe?: string } | null)?.ozmiListe === listKey;
    } catch {
        return false;
    }
};

export default function IncrementalGrid(props: Props) {
    // Yeni gezinmede (Link, push/replace) kimlik değişir ve liste sıfırlanır;
    // geri/ileri ve yalnız arama parametresi değişiminde aynı kalır. Filtre ya da
    // sıralama değişimini `listKey` ayırır: eski sonuç yeni listeye karışmaz.
    const { bfcacheId } = useRouter();
    return <Grid key={`${bfcacheId}|${props.listKey}|${props.pagination.page}`} {...props} />;
}

function Grid({
    children, listKey, endpoint, query, pagination, initialIds, basePath, searchParams, settings, siteUrl,
}: Props) {
    const [chunks, setChunks] = useState<Chunk[]>([]);
    const [lastPage, setLastPage] = useState(pagination.page);
    const [totalPages, setTotalPages] = useState(pagination.totalPages);
    const [total, setTotal] = useState(pagination.total);
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
    const [nearEnd, setNearEnd] = useState(false);
    // Otomatik yükleme kullanıcı kaydırınca başlar: ilk çizimde (iskelet → kart
    // geçişinde) sentinel bir an eşiğe girip istenmeyen grupları çekebiliyordu.
    // Sayfa ekranı doldurmuyorsa (kısa liste, büyük ekran) beklemeden başlar.
    const [armed, setArmed] = useState(false);
    const [favoriteIds, setFavoriteIds] = useState<Set<number> | null>(null);

    const gridRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const inflight = useRef<AbortController | null>(null);
    // Çapa yalnız geri dönüş anında geçerli: sonradan (ör. sepete ekleme sonrası
    // sunucu yeniden çizimi, yeni grup yüklemesi) beklenmedik kaydırma olmasın.
    const pendingAnchor = useRef<{ snapshot: Snapshot; at: number } | null>(null);
    const initialIdsRef = useRef(initialIds);
    // Olay dinleyicileri ve yükleyici en güncel değeri okusun diye; render
    // sırasında değil, her çizimden sonra (ilk layout effect) güncellenir.
    const latest = useRef({ chunks, lastPage, totalPages, total });
    useLayoutEffect(() => {
        latest.current = {
            chunks, lastPage, totalPages, total,
        };
        initialIdsRef.current = initialIds;
    });

    const done = lastPage >= totalPages;
    const shown = initialIds.length + chunks.reduce((sum, chunk) => sum + chunk.items.length, 0);

    // --- Sonraki sayfa ----------------------------------------------------------
    const load = useCallback(async () => {
        if (inflight.current || latest.current.lastPage >= latest.current.totalPages) return;
        const next = latest.current.lastPage + 1;
        const controller = new AbortController();
        inflight.current = controller;
        setStatus('loading');
        try {
            const response = await fetch(`${endpoint}?${query ? `${query}&` : ''}sayfa=${next}`, { signal: controller.signal });
            if (!response.ok) throw new Error(String(response.status));
            const data = await response.json() as { items: ProductCard[]; pagination: Pagination };
            if (controller.signal.aborted) return;
            setChunks((previous) => {
                // Aynı ürün iki kez eklenmez: sayfa arası katalog değişirse kayma olabilir.
                const seen = new Set([...initialIdsRef.current, ...previous.flatMap((chunk) => chunk.items.map((item) => item.id))]);
                return [...previous, { page: next, items: data.items.filter((item) => !seen.has(item.id)) }];
            });
            setLastPage(next);
            setTotalPages(data.pagination.totalPages);
            setTotal(data.pagination.total);
            setStatus('idle');
        } catch {
            // Ağ hatası "ürünler bitti" gibi sunulmaz; mevcut liste yerinde kalır.
            if (!controller.signal.aborted) setStatus('error');
        } finally {
            if (inflight.current === controller) inflight.current = null;
        }
    }, [endpoint, query]);

    useEffect(() => () => inflight.current?.abort(), []);

    // Liste sonuna ~800 px kala yükle. Konum her kaydırmada GERÇEK yerleşimden
    // ölçülür: IntersectionObserver'ın ilk çizimdeki (iskelet → kart geçişi)
    // bayat "yakın" bilgisi, Next'in yeni rotaya kendi kaydırmasıyla birleşince
    // kullanıcı hiç kaydırmadan grup çekiyordu (Firefox'ta görüldü).
    const checkNear = useCallback(() => {
        const node = sentinelRef.current;
        // Çizilmemiş (Activity'de gizli, display:none) öğenin konumu 0 ölçülür ve
        // "sona yakın" sanılırdı: o anda karar verilmez.
        if (!node || node.getClientRects().length === 0) return;
        setNearEnd(node.getBoundingClientRect().top < window.innerHeight + 800);
    }, []);

    useEffect(() => {
        let frame = 0;
        const mountedAt = Date.now();
        // Yükleme KULLANICI kaydırınca başlar. Gezinme anında tarayıcı/Next sayfayı
        // programla kaydırabiliyor (Firefox'ta bir an sayfa sonuna gidip dönüyordu);
        // o kaydırma grup çekmesin. Tekerlek/dokunma/tuş hemen, sürükleme gibi
        // yalnız `scroll` üreten hareket ilk saniyeden sonra sayılır.
        const arm = () => setArmed(true);
        const onScroll = () => {
            if (Date.now() - mountedAt > 1000) arm();
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                checkNear();
            });
        };
        const onIntent = () => {
            arm();
            onScroll();
        };
        // Bir saniye sonra: sayfa ekranı doldurmuyorsa (kısa liste, büyük ekran)
        // ya da kullanıcı o arada bir ekrandan fazla indiyse kaydırma beklenmez.
        // Gezinmenin programlı kaydırması o ana kadar tepeye dönmüş oluyor.
        const timer = window.setTimeout(() => {
            if (document.documentElement.scrollHeight <= window.innerHeight + 200 || window.scrollY > window.innerHeight) {
                arm();
                checkNear();
            }
        }, 1000);
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        window.addEventListener('wheel', onIntent, { passive: true });
        window.addEventListener('touchmove', onIntent, { passive: true });
        window.addEventListener('keydown', onIntent);
        return () => {
            cancelAnimationFrame(frame);
            window.clearTimeout(timer);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            window.removeEventListener('wheel', onIntent);
            window.removeEventListener('touchmove', onIntent);
            window.removeEventListener('keydown', onIntent);
        };
    }, [checkNear]);

    // Yeni grup çizildikten sonra yeniden ölç: kısa gruplarda kaydırmadan devam etsin.
    useLayoutEffect(() => {
        if (armed) checkNear();
    }, [armed, chunks, checkNear]);

    useEffect(() => {
        if (armed && nearEnd && status === 'idle' && !done) load();
    }, [armed, nearEnd, status, done, load]);

    // İstemcide çizilen kartların kalbi: favori kimlikleri bir kez alınır.
    useEffect(() => {
        if (!chunks.length || favoriteIds) return;
        let cancelled = false;
        fetch('/api/favoriler')
            .then((response) => response.json())
            .then((data: { ids?: number[] }) => { if (!cancelled) setFavoriteIds(new Set(data.ids ?? [])); })
            .catch(() => { if (!cancelled) setFavoriteIds(new Set()); });
        return () => { cancelled = true; };
    }, [chunks.length, favoriteIds]);

    // --- Geri dönüş kaydı ---------------------------------------------------------
    const save = useCallback((clicked?: Element | null) => {
        const grid = gridRef.current;
        if (!grid) return;
        const cards = [...grid.querySelectorAll<HTMLElement>('[data-product-id]')];
        const anchor = (clicked?.closest('[data-product-id]') as HTMLElement | null)
            ?? cards.find((card) => card.getBoundingClientRect().bottom > HEADER_OFFSET)
            ?? null;
        const snapshot: Snapshot = {
            v: 1,
            startPage: pagination.page,
            chunks: latest.current.chunks,
            totalPages: latest.current.totalPages,
            total: latest.current.total,
            anchorId: anchor ? Number(anchor.dataset.productId) : null,
            anchorIndex: anchor ? cards.indexOf(anchor) : 0,
            anchorTop: anchor ? anchor.getBoundingClientRect().top : 0,
            savedAt: Date.now(),
        };
        try {
            window.sessionStorage.setItem(SNAPSHOT_PREFIX + listKey, JSON.stringify(snapshot));
            // Yeni geçmiş kaydı AÇMAZ; yalnız bulunduğumuz girişi işaretler. Next'in
            // replaceState sarmalayıcısı kendi iç durumunu bu nesneye kopyalar.
            window.history.replaceState({ ...(window.history.state ?? {}), ozmiListe: listKey }, '');
        } catch {
            // Kota dolu / gizli mod: geri dönüş yalnız Activity katmanına kalır.
        }
    }, [listKey, pagination.page]);

    useEffect(() => {
        // Gezinmeden ÖNCE çalışsın diye belge düzeyinde, yakalama evresinde:
        // Next'in <Link>'i yeni geçmiş girişini açmadan mevcut giriş işaretlenir.
        const onClick = (event: MouseEvent) => {
            const link = (event.target as Element | null)?.closest?.('a[href]');
            if (!link) return;
            save(gridRef.current?.contains(link) ? link : null);
        };
        const onPageHide = () => save(null);
        document.addEventListener('click', onClick, true);
        window.addEventListener('pagehide', onPageHide);
        return () => {
            document.removeEventListener('click', onClick, true);
            window.removeEventListener('pagehide', onPageHide);
        };
    }, [save]);

    // --- Geri dönüşte yükleme ----------------------------------------------------
    // Effect, bileşen ilk kez takıldığında VE Activity onu yeniden gösterdiğinde
    // çalışır. Kartlar zaten yerindeyse (Activity) yalnız çapa denetlenir.
    useLayoutEffect(() => {
        const fromDocument = documentRestored();
        if (!entryIsMarked(listKey) && !fromDocument) return;
        const snapshot = readSnapshot(listKey);
        if (!snapshot || snapshot.startPage !== pagination.page) return;
        pendingAnchor.current = { snapshot, at: Date.now() };
        if (latest.current.chunks.length === 0 && snapshot.chunks.length > 0) {
            const seen = new Set(initialIdsRef.current);
            const restored = snapshot.chunks.map((chunk) => ({
                page: chunk.page,
                items: chunk.items.filter((item) => !seen.has(item.id) && seen.add(item.id)),
            }));
            setChunks(restored);
            setLastPage(restored[restored.length - 1].page);
            setTotalPages(snapshot.totalPages);
            setTotal(snapshot.total);
        }
        // Bilinçli olarak yalnız liste kimliğine bağlı: sunucu yeniden çizimi
        // (`refresh()`) yeni `initialIds` dizisi getirir ama geri dönüş değildir.
        // Activity sayfayı yeniden gösterince effect zaten yeniden çalışır.
    }, [listKey, pagination.page]);

    // Kartlar çizildikten sonra çapaya kaydır. İki kare beklenir: Next kendi
    // gezinme kaydırmasını yapmış, tarayıcı yerleşimi bitirmiş olsun.
    useLayoutEffect(() => {
        const pending = pendingAnchor.current;
        if (!pending) return undefined;
        if (Date.now() - pending.at > 2000) {
            pendingAnchor.current = null;
            return undefined;
        }
        const { snapshot } = pending;
        let frame = requestAnimationFrame(() => {
            frame = requestAnimationFrame(() => {
                pendingAnchor.current = null;
                const grid = gridRef.current;
                if (!grid) return;
                const cards = [...grid.querySelectorAll<HTMLElement>('[data-product-id]')];
                const target = cards.find((card) => Number(card.dataset.productId) === snapshot.anchorId)
                    ?? cards[Math.min(snapshot.anchorIndex, cards.length - 1)];
                if (!target) return;
                const drift = target.getBoundingClientRect().top - snapshot.anchorTop;
                // Tarayıcı/Activity zaten doğru yere getirdiyse dokunma.
                if (Math.abs(drift) > 40) window.scrollTo({ top: window.scrollY + drift, behavior: 'auto' });
            });
        });
        return () => cancelAnimationFrame(frame);
    }, [chunks]);

    const favoriteSlot = (product: ProductCard) => (
        <FavoriteButton product={product} back={basePath} filled={favoriteIds?.has(product.id) ?? false} />
    );

    let statusText = `${shown} / ${total} ürün gösteriliyor`;
    if (status === 'loading') statusText = 'Ürünler yükleniyor…';
    else if (done) statusText = total > 0 ? `Tüm ürünleri gördünüz (${total} ürün).` : '';

    return (
        <>
            {pagination.page > 1 && (
                <p className="mb-3 text-[13px]">
                    <Link href={pageHref(basePath, searchParams, pagination.page - 1)} className="link">← Önceki ürünler</Link>
                </p>
            )}

            <div
                ref={gridRef}
                className="grid gap-[clamp(10px,1.4vw,16px)] [grid-template-columns:repeat(auto-fill,minmax(min(50%-6px,205px),1fr))]"
            >
                {children}
                {chunks.flatMap((chunk) => chunk.items).map((product) => (
                    <ProductCardView
                        key={product.id}
                        product={product}
                        back={basePath}
                        settings={settings}
                        siteUrl={siteUrl}
                        favoriteSlot={favoriteSlot(product)}
                    />
                ))}
            </div>

            {ANALYTICS_ENABLED && chunks.map((chunk) => {
                const offset = (chunk.page - 1) * pagination.pageSize;
                return chunk.items.length ? (
                    <ItemListTracker
                        key={chunk.page}
                        listId={basePath}
                        listName={basePath}
                        entries={chunk.items.map((product, index) => ({
                            slug: product.slug, item: fromCard(product, offset + index, { id: basePath, name: basePath }),
                        }))}
                        eventKey={`${basePath}:${offset}:${chunk.items.length}`}
                    />
                ) : null;
            })}

            <div ref={sentinelRef} aria-hidden className="h-px" />

            <div className="mt-6 flex flex-col items-center gap-3 text-center">
                {/* Ekran okuyucuya kısa durum; odak taşınmaz. */}
                <p aria-live="polite" className="text-[13px] text-slate-600">{statusText}</p>
                {status === 'loading' && (
                    <span aria-hidden className="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-accent-500 motion-reduce:animate-none" />
                )}
                {status === 'error' && (
                    <div role="alert" className="flex flex-wrap items-center justify-center gap-3 text-[13px]">
                        <span className="font-semibold text-accent-500">Ürünler yüklenemedi.</span>
                        <button type="button" onClick={() => load()} className="btn-secondary btn-sm">Tekrar dene</button>
                    </div>
                )}
            </div>

            {/* Gerçek sayfa bağlantıları: arama motoru, JavaScript'siz ziyaretçi ve
                "şu sayfaya atla" için. Etkin sayfa son yüklenen grup. */}
            <ListingPagination pagination={{ ...pagination, page: lastPage, totalPages }} basePath={basePath} searchParams={searchParams} />
        </>
    );
}
