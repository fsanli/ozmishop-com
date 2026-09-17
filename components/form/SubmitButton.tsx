'use client';

import { useFormStatus } from 'react-dom';

/**
 * Gönderim düğmesi. Tek işi bekleme durumunu göstermek.
 *
 * Sitedeki TEK form istemci bileşeni bu: her form için ayrı bir tane yazmak
 * yerine bu 20 satır paylaşılır. Olmasaydı "Ödemeye geç" düğmesi yanıt gelene
 * kadar ölü görünür ve kullanıcı iki kez basardı.
 */
export default function SubmitButton({
    children,
    className = 'btn-primary',
    pendingLabel,
    disabled,
}: {
    children: React.ReactNode;
    className?: string;
    pendingLabel?: string;
    disabled?: boolean;
}) {
    const { pending } = useFormStatus();

    return (
        <button type="submit" className={className} disabled={pending || disabled} aria-busy={pending}>
            {pending ? (pendingLabel ?? 'Gönderiliyor…') : children}
        </button>
    );
}
