import type { NextRequest } from 'next/server';
import { recordPostView } from '@/lib/api';

/** Yazı görüntülenme sayacı vekili (bkz. ViewPing). */
export async function POST(request: NextRequest) {
    let slug = '';
    try {
        const body = await request.json();
        slug = typeof body?.slug === 'string' ? body.slug : '';
    } catch {
        return Response.json({ ok: false }, { status: 400 });
    }

    if (!/^[a-z0-9-]{1,190}$/.test(slug)) {
        return Response.json({ ok: false }, { status: 400 });
    }

    try {
        await recordPostView(slug);
    } catch {
        /* sayaç kritik değil */
    }

    return Response.json({ ok: true });
}
