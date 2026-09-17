import { AlertTriangleIcon, CheckIcon } from '@/components/icons';
import type { ProductDetail } from '@/lib/types';

const LUBE_WARNING: Record<string, { title: string; body: string } | null> = {
    water: {
        title: 'Silikon bazlı kayganlaştırıcı kullanmayın',
        body: 'Bu ürünün yüzeyi silikon bazlı ürünlerle kalıcı hasar görebilir. Su bazlı kayganlaştırıcı kullanın.',
    },
    silicone: {
        title: 'Su bazlı kayganlaştırıcı önerilir değildir',
        body: 'Bu ürün silikon bazlı kayganlaştırıcıyla kullanılmak üzere tasarlanmıştır.',
    },
    both: null,
    none: null,
};

/** Kayganlaştırıcı uyarısı ve garanti notu — künyenin altındaki iki kart. */
export default function ProductNotes({ product }: { product: ProductDetail }) {
    const warning = product.lubeCompatibility ? LUBE_WARNING[product.lubeCompatibility] : null;
    if (!warning && !product.warrantyNote) return null;

    return (
        <div className="mt-[clamp(10px,1.4vw,14px)] flex flex-wrap gap-[clamp(10px,1.4vw,14px)]">
            {warning && (
                <div className="min-w-0 flex-[1_1_320px] rounded-[var(--radius-lg)] border border-accent-500/22 bg-accent-50 p-[18px_20px]">
                    <span className="grid size-8 place-items-center rounded-[10px] bg-accent-500 text-white">
                        <AlertTriangleIcon className="size-4" />
                    </span>
                    <h3 className="mt-3 text-[14.5px] font-bold text-accent-500">{warning.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-slate-700">{warning.body}</p>
                </div>
            )}

            {product.warrantyNote && (
                <div className="block-dark-soft min-w-0 flex-[1_1_260px] rounded-[var(--radius-lg)] p-[18px_20px]">
                    <span className="grid size-8 place-items-center rounded-[10px] bg-on-dark/10 text-on-dark-teal">
                        <CheckIcon className="size-4" />
                    </span>
                    <h3 className="mt-3 text-[14.5px] font-bold">{product.warrantyNote}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-on-dark/60">
                        Faturalı ve orijinal ürün. Garanti belgesi kutudan çıkar.
                    </p>
                </div>
            )}
        </div>
    );
}
