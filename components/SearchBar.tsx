'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { formatPrice } from '@/lib/format';
import { routes } from '@/lib/site';
import type { Suggestions } from '@/lib/types';

/**
 * Arama çubuğu — öneriler /api/suggest vekilinden gelir; tarayıcı API adresini görmez.
 * Yazım durunca (250 ms) istek atılır, önceki istek iptal edilir.
 */
export default function SearchBar({ className = '' }: { className?: string }) {
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
                        className="field-input pr-11"
                    />
                    <button
                        type="submit"
                        aria-label="Ara"
                        className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:text-brand-600"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <circle cx="11" cy="11" r="7" />
                            <path d="m20 20-3.5-3.5" />
                        </svg>
                    </button>
                </form>

                {open && hasResults && suggestions && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    {suggestions.products.length > 0 && (
                        <ul className="max-h-80 overflow-y-auto">
                            {suggestions.products.map((product) => (
                                <li key={product.id}>
                                    <Link
                                        href={routes.product(product.slug)}
                                        onClick={() => setOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50"
                                    >
                                        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-slate-100">
                                            {product.image && (
                                                <Image src={product.image} alt="" fill sizes="40px" className="object-cover" />
                                            )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm text-slate-900">{product.name}</span>
                                            <span className="block text-xs text-slate-400">{product.brand}</span>
                                        </span>
                                        <span className="price text-sm">{formatPrice(product.price)}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}

                    {(suggestions.categories.length > 0 || suggestions.brands.length > 0) && (
                        <div className="flex flex-wrap gap-1 border-t border-slate-100 p-2">
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
                        className="block border-t border-slate-100 px-3 py-2 text-center text-sm font-medium text-brand-600 hover:bg-slate-50"
                    >
                        &ldquo;{term.trim()}&rdquo; için tüm sonuçlar
                    </Link>
                </div>
                )}
            </div>
        </div>
    );
}
