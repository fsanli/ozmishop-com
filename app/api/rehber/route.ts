import { connection } from 'next/server';
import type { NextRequest } from 'next/server';
import { ApiError, guideV2Next } from '@/lib/api';
import { proxyHeaders } from '@/lib/bff';
import type { GuideV2Answer } from '@/lib/types';

/**
 * Rehber V2 vekili (canlıya geçiş S08). Cevaplar POST GÖVDESİNDE gelir ve
 * API'ye öyle gider: adreste, tarayıcı geçmişinde, önbellek anahtarında ve
 * günlüklerde müşterinin cevabı yok. Bu uç bir şey saklamaz.
 *
 * Yanıt: sıradaki soru ya da sonuç. 400 = cevaplar güncel akışla eşleşmiyor
 * (rehber yenilendi) → istemci baştan başlatır. 502 = geçici sorun → "Tekrar dene";
 * "uygun ürün yok" ile karışmaz.
 */
const KEY = /^[a-z0-9_]{1,30}$/;

export async function POST(request: NextRequest) {
    await connection();
    const body = await request.json().catch(() => null) as { answers?: unknown } | null;
    const raw = Array.isArray(body?.answers) ? body.answers.slice(0, 8) : [];
    const answers = raw.filter((item): item is GuideV2Answer => (
        typeof item === 'object' && item !== null
        && typeof (item as GuideV2Answer).q === 'string' && KEY.test((item as GuideV2Answer).q)
        && typeof (item as GuideV2Answer).o === 'string' && KEY.test((item as GuideV2Answer).o)
    ));
    if (answers.length !== raw.length) return Response.json({ error: 'stale' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });

    try {
        const step = await guideV2Next(answers, await proxyHeaders());
        return Response.json(step, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        if (error instanceof ApiError && error.statusCode === 400) {
            return Response.json({ error: 'stale' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
        }
        return Response.json({ error: 'unavailable' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
    }
}
