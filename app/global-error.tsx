'use client';

/**
 * Kök yerleşimin kendisi çöktüğünde devreye giren tek sınır. Kendi <html>/<body>
 * etiketlerini basmak ZORUNDA, çünkü kök yerleşim render edilememiş demektir —
 * dolayısıyla tema sınıfları da yok; stiller satır içi.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <html lang="tr">
            <body style={{ margin: 0, background: '#faf8f8', color: '#1a1418', fontFamily: 'system-ui, sans-serif' }}>
                <div style={{ maxWidth: 520, margin: '0 auto', padding: '15vh 24px 0' }}>
                    <h1 style={{ fontSize: 28, letterSpacing: '-0.04em', margin: 0 }}>Bir şeyler ters gitti</h1>
                    <p style={{ color: '#635a60', lineHeight: 1.7, marginTop: 12 }}>
                        Sayfa yüklenemedi. Tekrar denemek sorunu çoğu zaman çözer.
                    </p>
                    <button
                        type="button"
                        onClick={reset}
                        style={{
                            marginTop: 20, background: '#9b1f47', color: '#fff', border: 0, cursor: 'pointer',
                            borderRadius: 12, padding: '13px 20px', fontSize: 14, fontWeight: 700,
                        }}
                    >
                        Yeniden dene
                    </button>
                </div>
            </body>
        </html>
    );
}
