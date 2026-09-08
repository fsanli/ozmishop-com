const currency = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
});

const date = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

export function formatPrice(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return currency.format(value);
}

export function formatDate(value: string | Date | null | undefined): string {
    if (!value) return '—';
    return date.format(new Date(value));
}

/** "1.234,50 ₺'den başlayan fiyatlarla" gibi aralık gösterimi. */
export function formatPriceRange(min: number | null, max: number | null): string | null {
    if (min === null || max === null || min === max) return null;
    return `${formatPrice(min)} – ${formatPrice(max)}`;
}
