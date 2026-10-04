/**
 * Form alanı etiketi. Zorunlu alanın yanına `*` koyar; `aria-hidden` çünkü
 * ekran okuyucu zorunluluğu input'un `required` özniteliğinden zaten duyuyor.
 *
 * TEK işaret dili: zorunlu alanlar yıldızlı, gerisi işaretsiz. "(opsiyonel)"
 * notları kaldırıldı — iki ayrı işaret aynı formda kullanıcıyı neyin şart
 * olduğunu ikinci kez düşünmeye zorluyordu. Formun başında `RequiredNote`
 * yıldızın ne demek olduğunu söyler.
 *
 * İstemci bileşeni DEĞİL: sunucu formlarında da kullanılıyor.
 */
export default function FieldLabel({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
    return (
        <span className="field-label">
            {children}
            {required && <span aria-hidden className="ml-0.5 text-accent-500">*</span>}
        </span>
    );
}

export function RequiredNote({ className = '' }: { className?: string }) {
    return (
        <p className={`text-[12px] text-slate-600 ${className}`}>
            <span aria-hidden className="text-accent-500">*</span> ile işaretli alanlar zorunlu.
        </p>
    );
}
