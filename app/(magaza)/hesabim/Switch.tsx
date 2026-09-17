/**
 * Sıfır JS anahtar. İki durum da bir `<form>` gönderimi; istemci bileşeni yok,
 * JavaScript kapalıyken de çalışır. `deger` yeni değeri taşır — sunucu mevcut
 * durumu okuyup tersine çevirmez, böylece çift tıklama iki kez dönmez.
 */
export default function Switch({
    action, name, on, label,
}: {
    action: (formData: FormData) => void | Promise<void>;
    name: string;
    on: boolean;
    label: string;
}) {
    return (
        <form action={action}>
            <input type="hidden" name="anahtar" value={name} />
            <input type="hidden" name="deger" value={on ? '0' : '1'} />
            <button
                type="submit"
                role="switch"
                aria-checked={on}
                aria-label={label}
                className={`relative block h-[26px] w-[46px] shrink-0 cursor-pointer rounded-full border border-slate-900/12 transition-colors ${on ? 'bg-accent-500' : 'bg-slate-200'}`}
            >
                <span
                    aria-hidden
                    className={`absolute top-0.5 size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(26,20,24,0.2)] transition-all ${on ? 'left-[22px]' : 'left-0.5'}`}
                />
            </button>
        </form>
    );
}
