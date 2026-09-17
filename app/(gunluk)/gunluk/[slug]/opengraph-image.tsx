import { ImageResponse } from 'next/og';
import { getPost } from '@/lib/api';

/**
 * Yazı paylaşım görseli. `next/og` `next` paketinin içinde geliyor — üç
 * bağımlılık kuralı bozulmuyor.
 *
 * Kapak görseli kullanılmıyor: paylaşılan kart sosyal akışta ürün görseli
 * göstermemeli (sitenin tüm gizlilik vaadi buna dayanıyor). Bunun yerine
 * tipografik bir kart basılıyor.
 */
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'ozmishop Günlük';

const COLORS: Record<string, string> = {
    berry: '#e0899f',
    plum: '#b79ae0',
    teal: '#7ec4bb',
    amber: '#e3a86a',
    rose: '#e0899f',
};

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = await getPost(slug);

    const accent = COLORS[post?.topic?.colorKey ?? 'berry'] ?? COLORS.berry;

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
                    fontFamily: 'sans-serif',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 99, background: accent }} />
                    <span style={{ fontSize: 24, fontWeight: 700, color: accent }}>
                        {post?.topic?.name ?? 'Günlük'}
                    </span>
                    {post && (
                        <span style={{ fontSize: 22, color: 'rgba(246,241,243,0.5)' }}>
                            · {post.readMinutes} dk okuma
                        </span>
                    )}
                </div>

                <div
                    style={{
                        fontSize: post && post.title.length > 46 ? 62 : 76,
                        fontWeight: 600,
                        lineHeight: 1.1,
                        letterSpacing: '-0.04em',
                        maxWidth: 980,
                        display: 'flex',
                    }}
                >
                    {post?.title ?? 'ozmishop Günlük'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em' }}>
                        ozmishop<span style={{ color: '#d4557a' }}>.</span>
                    </span>
                    <span style={{ fontSize: 22, color: 'rgba(246,241,243,0.5)' }}>
                        {post?.author.name ?? 'Günlük'}
                    </span>
                </div>
            </div>
        ),
        size,
    );
}
