import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Paylaşım kartlarının (ImageResponse) ortak varlıkları: marka fontu Sora
 * (assets/fonts, SIL OFL) ve marka simgesi. Satori sistem fontu bilmez;
 * verilmezse kart genel bir sans-serif ile çizilir ve marka kaybolur.
 * Next dokümanındaki kalıp: `readFile(join(process.cwd(), 'assets/…'))`.
 */
export async function ogFonts() {
    const [semibold, bold] = await Promise.all([
        readFile(join(process.cwd(), 'assets/fonts/Sora-600.ttf')),
        readFile(join(process.cwd(), 'assets/fonts/Sora-700.ttf')),
    ]);
    return [
        { name: 'Sora', data: semibold, weight: 600 as const, style: 'normal' as const },
        { name: 'Sora', data: bold, weight: 700 as const, style: 'normal' as const },
    ];
}

/** Marka simgesi (public/brand/ozmishop-mark.svg) — `<img src>` için veri adresi. */
export async function ogMark() {
    const svg = await readFile(join(process.cwd(), 'public/brand/ozmishop-mark.svg'), 'base64');
    return `data:image/svg+xml;base64,${svg}`;
}
