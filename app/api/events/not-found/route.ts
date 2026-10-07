import type { NextRequest } from 'next/server';
import { recordNotFound } from '@/lib/api';

/** 404 bildirimi vekili (bkz. NotFoundBeacon). Kişisel veri taşımaz: sorgu dizisi alınmaz. */
export async function POST(request: NextRequest) {
    let path = '';
    let referrerHost = '';
    try {
        const body = await request.json();
        path = typeof body?.path === 'string' ? body.path.split(/[?#]/)[0] : '';
        referrerHost = typeof body?.referrerHost === 'string' ? body.referrerHost : '';
    } catch {
        return Response.json({ ok: false }, { status: 400 });
    }
    if (!/^\/[^\s]{0,299}$/.test(path) || !/^[a-z0-9.-]{0,200}$/i.test(referrerHost)) {
        return Response.json({ ok: false }, { status: 400 });
    }
    try {
        await recordNotFound(path, referrerHost);
    } catch {
        /* sayaç kritik değil */
    }
    return Response.json({ ok: true });
}
