'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import ProductActions from '@/components/product/ProductActions';
import { formatPrice } from '@/lib/format';
import { routes } from '@/lib/site';
import type { SiteSettings, Suggestions } from '@/lib/types';

/**
 * Arama çubuğu — öneriler /api/suggest vekilinden gelir; tarayıcı API adresini görmez.
 * Yazım durunca (250 ms) istek atılır, önceki istek iptal edilir.
 */
export default function SearchBar({
    className = '', settings, siteUrl,
}: {
    className?: string;
    /** Aksiyon ikonları WhatsApp numarasını buradan okur; Header geçiriyor. */
    settings: SiteSettings;
    siteUrl: string;
}) {
    const router = useRouter();
    // Başlıkta iki örnek var (masaüstü ve mobil); sabit bir id ikisinde de tekrarlanır
    // ve <label for> yanlış alana bağlanır.
    const inputId = useId();
    const [term, setTerm] = useState('');
    const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const value = term.trim();
        const controller = new AbortController();

        // Yazım durunca istek atılır; state güncellemesi effect gövdesinde değil
        // zamanlayıcının içinde yapılır (zincirleme render'ı önler).
        const timer = setTimeout(async () => {
            if (value.length < 2) {
                setSuggestions(null);
                return;
            }
            try {
                const response = await fetch(`/api/suggest?q=${encodeURIComponent(value)}`, { signal: controller.signal });
                if (response.ok) {
                    setSuggestions(await response.json());
                    setOpen(true);
                }
            } catch {
                /* iptal edilen istek ya da ağ hatası: öneri göstermemek yeterli */
            }
        }, 250);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [term]);

    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const value = term.trim();
        if (!value) return;
        setOpen(false);
        router.push(routes.search(value));
    };

    const hasResults = Boolean(
        suggestions && (suggestions.products.length || suggestions.categories.length || suggestions.brands.length),
    );

    return (
        // Dış kap yalnızca dolgu/görünürlük taşır. Konumlandırma bağlamı içteki
        // sarmalayıcıdadır: aksi halde ikon, kabın px-4 dolgusuna göre hizalanıp
        // input'un sağ kenarından taşar ve pb-3 yüzünden dikeyde de kayar.
        <div ref={containerRef} className={className}>
            <div className="relative">
                <form onSubmit={submit} role="search" className="relative">
                    <label htmlFor={inputId} className="sr-only">Ürün ara</label>
                    <input
                        id={inputId}
                        type="search"
                        value={term}
                        onChange={(event) => setTerm(event.target.value)}
                        onFocus={() => hasResults && setOpen(true)}
                        placeholder="Ürün, kategori veya marka ara"
                        autoComplete="off"
                        className="field-input rounded-[14px] border-slate-900/9 bg-surface py-[11px] pr-11 text-[14.5px] hover:border-accent-500/35"
                    />
                    <button
                        type="submit"
                        aria-label="Ara"
                        className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-[var(--radius-sm)] text-slate-500 transition-colors hover:text-accent-500"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <circle cx="11" cy="11" r="7" />
                            <path d="m20 20-3.5-3.5" />
                        </svg>
                    </button>
                </form>

                {open && hasResults && suggestions && (
                <div className="absolute left-0 right-0 top-[calc(100%+9px)] z-[70] overflow-hidden rounded-[var(--radius-lg)] border border-slate-900/7 bg-surface shadow-[0_18px_48px_rgba(26,20,24,0.16)]">
                    {suggestions.products.length > 0 && (
                        <ul className="max-h-80 overflow-y-auto">
                            {suggestions.products.map((product) => (
                                // Satır artık tek bir <a> DEĞİL: içinde aksiyon
                                // butonları var ve iç içe etkileşimli öğe geçersiz
                                // HTML. Ürün kartındaki stretched-link kalıbının
                                // aynısı — bağlantı `after:absolute` ile satırı
                                // kaplıyor, ikonlar `relative z-10` ile üstünde.
                                <li key={product.id} className="group relative flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-slate-100">
                                    <span className="relative size-10 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-shelf">
                                        {product.image && (
                                            <Image src={product.image} alt="" fill sizes="40px" className="object-cover" />
                                        )}
                                    </span>

                                    <span className="min-w-0 flex-1">
                                        <span className="brand-line block truncate">{product.brand}</span>
                                        <Link
                                            href={routes.product(product.slug)}
                                            onClick={() => setOpen(false)}
                                            className="block truncate text-[13.5px] text-slate-900 after:absolute after:inset-0"
                                        >
                                            {product.name}
                                        </Link>
                                    </span>

                                    {/* Fiyat ve ikonlar TEK sütunda, sağa yaslı:
                                        ikon şeridi fiyatın genişliğini aşmıyor ve
                                        satırların hizası bozulmuyor. */}
                                    <span className="flex shrink-0 flex-col items-end gap-1">
                                        <span className="price text-[13px]">{formatPrice(product.price)}</span>
                                        <ProductActions
                                            product={product}
                                            settings={settings}
                                            siteUrl={siteUrl}
                                            back={routes.product(product.slug)}
                                            size="sm"
                                        />
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}

                    {(suggestions.categories.length > 0 || suggestions.brands.length > 0) && (
                        <div className="flex flex-wrap gap-1.5 border-t border-slate-900/7 p-2.5">
                            {suggestions.categories.map((category) => (
                                <Link
                                    key={`c-${category.id}`}
                                    href={routes.category(category.slug)}
                                    onClick={() => setOpen(false)}
                                    className="btn-soft btn-sm"
                                >
                                    {category.name}
                                </Link>
                            ))}
                            {suggestions.brands.map((brand) => (
                                <Link
                                    key={`b-${brand.id}`}
                                    href={routes.brand(brand.slug)}
                                    onClick={() => setOpen(false)}
                                    className="btn-secondary btn-sm"
                                >
                                    {brand.name}
                                </Link>
                            ))}
                        </div>
                    )}

                    <Link
                        href={routes.search(term.trim())}
                        onClick={() => setOpen(false)}
                        className="block border-t border-slate-900/7 bg-paper px-3.5 py-2.5 text-[13px] font-bold text-accent-500 transition-colors hover:bg-slate-100"
                    >
                        &ldquo;{term.trim()}&rdquo; için tüm sonuçlar
                    </Link>
                </div>
                )}
            </div>
        </div>
    );
}
