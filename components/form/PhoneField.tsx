'use client';

import { useState } from 'react';
import { formatPhone, phoneError, PHONE_PLACEHOLDER } from '@/lib/phone';

/**
 * Maskeli telefon alanı: 0(555) 111 22 33
 *
 * Neden istemci bileşeni: maske her tuşta biçimlendirme ister. Tek bir bileşen
 * dört yerde kullanılıyor (kayıt, ödeme, adres, hesap güvenliği) — tek istemci
 * bileşeni karşılığında hepsi aynı kuralı uyguluyor.
 *
 * JAVASCRIPT KAPALIYKEN DE ÇALIŞIR: alan sıradan bir `<input name="phone">`.
 * Maske yoksa kullanıcı düz rakam yazar, sunucu aksiyonu `normalisePhone` ile
 * temizler. Doğrulama sunucuda TEKRARLANIR — istemcideki uyarı kolaylık, kapı
 * değil.
 *
 * Fazla yazma ENGELLENİR: `toLocal` 11 haneden fazlasını atıyor, yani 12.
 * rakama basmak hiçbir şey yapmıyor.
 */
export default function PhoneField({
    name = 'phone',
    defaultValue = '',
    required = true,
    autoComplete = 'tel',
    className = 'field-input',
    id,
}: {
    name?: string;
    defaultValue?: string;
    required?: boolean;
    autoComplete?: string;
    className?: string;
    id?: string;
}) {
    const [value, setValue] = useState(() => formatPhone(defaultValue));
    // Uyarı yalnızca alandan ÇIKINCA gösterilir: her tuşta "eksik" yazmak,
    // numarasını yazmaya yeni başlamış birini azarlamak olur.
    const [touched, setTouched] = useState(false);

    const error = touched ? phoneError(value) : null;

    return (
        <>
            <input
                id={id}
                name={name}
                type="tel"
                inputMode="numeric"
                autoComplete={autoComplete}
                required={required}
                placeholder={PHONE_PLACEHOLDER}
                value={value}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${name}-hata` : undefined}
                onChange={(event) => {
                    setValue(formatPhone(event.target.value));
                    if (touched) setTouched(false);
                }}
                onBlur={() => setTouched(true)}
                className={`${className} ${error ? 'border-accent-500' : ''}`}
            />
            {error && (
                <p id={`${name}-hata`} role="alert" className="mt-1 text-[12px] font-medium text-accent-500">
                    {error}
                </p>
            )}
        </>
    );
}
