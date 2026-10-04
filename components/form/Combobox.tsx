'use client';

import { useId, useMemo, useState } from 'react';
import { foldTr } from '@/lib/locations';

/**
 * Aranabilir seçim kutusu (ARIA 1.2 combobox). Bağımlılık yok: vitrinin
 * istemci paketi küçük tutuluyor ve listeler en fazla 81 kalem.
 *
 * Görünen input form alanının KENDİSİ (`name` onda): JavaScript kapalıyken düz
 * bir metin kutusu olarak çalışır ve sunucu yazılanı listeyle doğrular. Açıkken
 * yazdıkça liste süzülür; Türkçe katlama sayesinde "kadikoy" Kadıköy'ü bulur.
 *
 * Alandan çıkınca yazılan listedeki bir kalemle (katlanmış hâliyle) tam
 * eşleşiyorsa kanonik yazıma oturtulur; eşleşmiyorsa form gönderilemez
 * (`setCustomValidity`). Böylece "İstanbl" gibi bir yazım sunucuya hiç gitmez.
 */
export default function Combobox({
    id,
    name,
    value,
    onChange,
    options,
    placeholder,
    disabled = false,
    required = false,
    autoComplete,
    invalidMessage = 'Listeden bir seçenek seçin.',
    className = 'field-input',
}: {
    id?: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    autoComplete?: string;
    invalidMessage?: string;
    className?: string;
}) {
    const fallbackId = useId();
    const inputId = id ?? fallbackId;
    const listId = `${inputId}-liste`;
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    // Kullanıcı yazmaya başlamadıkça (ör. kayıtlı değerle açılınca) TÜM liste
    // gösterilir; yoksa "İstanbul" yazılı kutuyu açan tek kalem görürdü.
    const [typed, setTyped] = useState(false);

    const filtered = useMemo(() => {
        const query = foldTr(value);
        if (!typed || !query) return options;
        const starts: string[] = [];
        const contains: string[] = [];
        options.forEach((option) => {
            const folded = foldTr(option);
            if (folded.startsWith(query)) starts.push(option);
            else if (folded.includes(query)) contains.push(option);
        });
        return [...starts, ...contains];
    }, [options, value, typed]);

    const commit = (input: HTMLInputElement, option: string) => {
        input.setCustomValidity('');
        onChange(option);
        setTyped(false);
        setOpen(false);
    };

    const validate = (input: HTMLInputElement) => {
        const text = input.value;
        if (!text.trim()) {
            input.setCustomValidity('');
            return;
        }
        const exact = options.find((option) => foldTr(option) === foldTr(text));
        if (exact) {
            input.setCustomValidity('');
            if (exact !== text) onChange(exact);
        } else {
            input.setCustomValidity(invalidMessage);
        }
    };

    const activeOption = open ? filtered[Math.min(active, filtered.length - 1)] : undefined;

    return (
        <div className="relative">
            <input
                id={inputId}
                name={name}
                type="text"
                role="combobox"
                aria-expanded={open}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={activeOption ? `${listId}-${filtered.indexOf(activeOption)}` : undefined}
                autoComplete={autoComplete ?? 'off'}
                required={required}
                disabled={disabled}
                placeholder={placeholder}
                value={value}
                onChange={(event) => {
                    event.target.setCustomValidity('');
                    onChange(event.target.value);
                    setTyped(true);
                    setActive(0);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onClick={() => setOpen(true)}
                onBlur={(event) => {
                    setOpen(false);
                    validate(event.target);
                }}
                onKeyDown={(event) => {
                    const input = event.currentTarget;
                    if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        setOpen(true);
                        setActive((index) => Math.min(index + 1, filtered.length - 1));
                    } else if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        setActive((index) => Math.max(index - 1, 0));
                    } else if (event.key === 'Enter' && open && activeOption) {
                        // Listeden seçerken formu GÖNDERME.
                        event.preventDefault();
                        commit(input, activeOption);
                    } else if (event.key === 'Escape') {
                        setOpen(false);
                    }
                }}
                className={className}
            />
            {open && !disabled && filtered.length > 0 && (
                <ul
                    id={listId}
                    role="listbox"
                    className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-[var(--radius-md)] border border-slate-900/12 bg-surface p-1 shadow-[0_12px_32px_-12px_rgba(26,20,24,0.35)]"
                >
                    {filtered.map((option, index) => (
                        <li
                            key={option}
                            id={`${listId}-${index}`}
                            role="option"
                            aria-selected={option === activeOption}
                            // mousedown + preventDefault: tıklama input'un odağını
                            // düşürmesin, yoksa blur listeyi tıklamadan önce kapatır.
                            onMouseDown={(event) => {
                                event.preventDefault();
                                const input = document.getElementById(inputId) as HTMLInputElement | null;
                                if (input) commit(input, option);
                            }}
                            onMouseEnter={() => setActive(index)}
                            className={`cursor-pointer rounded-[8px] px-3 py-2 text-[13.5px] ${
                                option === activeOption ? 'bg-slate-100 font-semibold' : ''
                            }`}
                        >
                            {option}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
