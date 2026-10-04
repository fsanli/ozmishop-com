'use client';

/** Tarayıcının yazdırma penceresi — oradan "PDF olarak kaydet" de seçilebilir. */
export default function PrintButton() {
    return (
        <button type="button" onClick={() => window.print()} className="btn-secondary btn-sm print:hidden">
            Yazdır / PDF olarak kaydet
        </button>
    );
}
