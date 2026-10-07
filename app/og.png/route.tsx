import { ImageResponse } from 'next/og';
import { ogFonts, ogMark } from '@/lib/og';
import { site } from '@/lib/site';


/**
 * Varsayılan paylaşım görseli (1200×630). Kendi görseli olmayan her sayfa
 * bunu kullanır (lib/seo.ts `og()`): kategori, marka, koleksiyon, kurumsal
 * sayfalar. Günlük kartıyla aynı kural — sosyal akışta ürün görseli yok,
 * tipografik kart; sitenin gizlilik vaadi paylaşılan bağlantıda da geçerli.
 *
 * Veri okumaz: derlemede bir kez üretilir, statik dosya gibi sunulur.
 */
export async function GET() {
    const [fonts, mark] = await Promise.all([ogFonts(), ogMark()]);
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: '#1a1418',
                    color: '#f6f1f3',
                    padding: '72px 80px',
                    fontFamily: 'Sora',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 99, background: '#e0899f' }} />
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#e0899f' }}>Yetişkinlere özel</span>
                </div>
                <div style={{ display: 'flex', fontSize: 76, fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.04em', maxWidth: 980 }}>
                    Gizli paketleme, güvenli ödeme, orijinal ürün.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse (satori) yalnız düz img tanır */}
                    <img src={mark} width={56} height={56} alt="" />
                    <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em' }}>
                        {site.name}<span style={{ color: '#d4557a' }}>.</span>
                    </span>
                </div>
            </div>
        ),
        { width: 1200, height: 630, fonts },
    );
}
