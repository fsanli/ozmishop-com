'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Seçili varyant, ürün sayfasının İKİ ayrı yerini birden ilgilendiriyor:
 * satın alma paneli (fiyat, stok, sepete giden id) ve teknik künye (varyanta
 * göre değişen ölçüler). Durum panelin içinde kalsaydı künye onu göremezdi;
 * yukarı taşımak yerine buraya, ikisinin ortak atasına konuldu.
 *
 * Sağlayıcı yalnızca SEÇİM için gereken en az veriyi alır (id, varsayılan,
 * eksen değerleri) — panelin elindeki tam varyant listesini ikinci kez
 * istemciye göndermemek için.
 */
export interface VariantChoice {
    id: number;
    isDefault: boolean;
    options: { variantKeyId: number; variantValueId: number }[];
}

interface VariantSelectionValue {
    /** Eksen id'si → seçili değer id'si. */
    selection: Record<number, number>;
    select: (axisId: number, valueId: number) => void;
    /** Seçim var olan bir varyanta denk gelmiyorsa null. */
    selectedVariantId: number | null;
}

const VariantSelectionContext = createContext<VariantSelectionValue | null>(null);

export function VariantSelectionProvider({
    variants, hasAxes, children,
}: {
    variants: VariantChoice[];
    /** Eksensiz üründe seçim diye bir şey yoktur: tek varyant hep seçilidir. */
    hasAxes: boolean;
    children: React.ReactNode;
}) {
    const defaultVariant = variants.find((variant) => variant.isDefault) ?? variants[0];

    const [selection, setSelection] = useState<Record<number, number>>(() =>
        Object.fromEntries((defaultVariant?.options ?? []).map((option) => [option.variantKeyId, option.variantValueId])),
    );

    const select = useCallback(
        (axisId: number, valueId: number) => setSelection((current) => ({ ...current, [axisId]: valueId })),
        [],
    );

    const selectedVariantId = useMemo(() => {
        if (!hasAxes) return defaultVariant?.id ?? null;
        const match = variants.find((variant) =>
            variant.options.every((option) => selection[option.variantKeyId] === option.variantValueId),
        );
        return match?.id ?? null;
    }, [variants, hasAxes, selection, defaultVariant]);

    const value = useMemo(
        () => ({ selection, select, selectedVariantId }),
        [selection, select, selectedVariantId],
    );

    return <VariantSelectionContext.Provider value={value}>{children}</VariantSelectionContext.Provider>;
}

export function useVariantSelection() {
    const context = useContext(VariantSelectionContext);
    if (!context) throw new Error('useVariantSelection, VariantSelectionProvider içinde çağrılmalı');
    return context;
}
