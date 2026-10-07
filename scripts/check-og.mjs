/**
 * Paylaşım görselleri (D20): site haritasındaki her adresin `og:image`'ı
 * mutlak adres mi, dönüyor mu, genişliği yeterli mi (600 altı hata, 1200
 * altı uyarı)? Ürün sayfaları ürün fotoğrafını kullanır; boyutu yüklenen
 * görsele bağlı.
 *
 *   node scripts/check-og.mjs https://ozmishop.com
 *
 * Genişlik PNG/JPEG/WebP başlığından okunur; görsel tamamen indirilmez.
 * Sonuç her görsel için bir kez yazılır (çoğu sayfa aynı varsayılan kartı paylaşır).
 */
const base = (process.argv[2] || 'http://localhost:3201').replace(/\/$/, '');

const widthOf = (bytes) => {
    const view = new DataView(bytes.buffer);
    if (bytes[0] === 0x89 && bytes[1] === 0x50) return view.getUint32(16); // PNG IHDR
    if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[12] === 0x56) { // WebP
        const chunk = String.fromCharCode(...bytes.slice(12, 16));
        if (chunk === 'VP8X') return 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
        if (chunk === 'VP8L') return 1 + (((bytes[22] & 0x3f) << 8) | bytes[21]);
        if (chunk === 'VP8 ') return view.getUint16(26, true) & 0x3fff;
    }
    for (let i = 2; i < bytes.length - 9; i += 1) { // JPEG SOF
        if (bytes[i] === 0xff && [0xc0, 0xc1, 0xc2].includes(bytes[i + 1])) return view.getUint16(i + 7);
    }
    return null;
};

const xml = await (await fetch(`${base}/sitemap.xml`)).text();
const pages = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (!pages.length) {
    console.log('Site haritası boş (indekslenmeyen ortam?). Tek sayfa denetleniyor.');
    pages.push(`${base}/`);
}

const images = new Map();
let failures = 0;
for (const page of pages) {
    const html = await (await fetch(page.replace(/^https?:\/\/[^/]+/, base))).text();
    const image = (html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1];
    if (!image) {
        failures += 1;
        console.log(`✗ ${page} — og:image yok`);
        continue;
    }
    if (!/^https?:\/\//.test(image)) {
        failures += 1;
        console.log(`✗ ${page} — og:image mutlak adres değil: ${image}`);
        continue;
    }
    if (!images.has(image)) images.set(image, page);
}

for (const [image, page] of images) {
    // Sitenin kendi görseli denetlenen ortamdan çekilir (canlı adresli derleme yerelde denenirken).
    const origin = new URL(page).origin;
    const target = image.startsWith(origin) ? `${base}${image.slice(origin.length)}` : image;
    const response = await fetch(target, { headers: { Range: 'bytes=0-65535' } });
    const bytes = new Uint8Array(await response.arrayBuffer());
    const width = widthOf(bytes);
    // 1200 px önerilen (büyük kart); 600 altı paylaşımda küçük/bulanık görünür.
    const ok = response.ok && width !== null && width >= 600;
    const mark = !ok ? '✗' : width >= 1200 ? '✓' : '⚠ 1200 px altı';
    if (!ok) failures += 1;
    console.log(`${mark} ${image} — ${response.status}, genişlik ${width ?? '?'} px (ilk: ${page})`);
}
console.log(`\n${pages.length} sayfa, ${images.size} farklı görsel, ${failures} sorun.`);
process.exit(failures ? 1 : 0);
