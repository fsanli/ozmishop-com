/**
 * Canlı/önizleme yanıtlarının SEO matrisi (D02). Gerçek HTTP isteği atar;
 * durum kodu, Location, X-Robots-Tag, robots metası ve canonical'ı ölçer ve
 * beklentiyle karşılaştırır. Çıktı markdown tablosu: docs/SEO-MATRIS.md'ye
 * olduğu gibi yapıştırılır.
 *
 *   node scripts/smoke-seo.mjs https://ozmishop.com
 *   node scripts/smoke-seo.mjs https://ozmishop.com --sitemap   # her <loc> 200 + index + self-canonical
 *
 * Örnek slug'lar sayfadan keşfedilir; sabit slug yok. İndekslenmeyen ortamda
 * (robots.txt "Disallow: /") her satırda noindex beklenir.
 */
const base = (process.argv[2] || 'http://localhost:3201').replace(/\/$/, '');
const checkSitemap = process.argv.includes('--sitemap');

const get = async (path, init = {}) => {
    const response = await fetch(`${base}${path}`, { redirect: 'manual', ...init });
    const html = (response.headers.get('content-type') || '').includes('text/html') ? await response.text() : '';
    const metas = [...html.matchAll(/<meta name="robots" content="([^"]*)"/g)].map((match) => match[1]);
    return {
        status: response.status,
        location: response.headers.get('location') || '',
        header: response.headers.get('x-robots-tag') || '',
        robots: metas.join(' + '),
        noindex: /noindex/.test(response.headers.get('x-robots-tag') || '') || metas.some((meta) => /noindex/.test(meta)),
        canonical: (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '',
        html,
    };
};

const robotsTxt = await (await fetch(`${base}/robots.txt`)).text();
const indexable = !/^Disallow: \/\s*$/m.test(robotsTxt);

const firstHref = (html, prefix) => (html.match(new RegExp(`href="(${prefix}[a-z0-9-]+)"`)) || [])[1];
const home = await get('/');
const listing = await get('/kategoriler');
const category = firstHref(listing.html, '/kategori/');
const product = firstHref(home.html, '/urun/') || firstHref((await get(category || '/')).html, '/urun/');
const journal = await get('/gunluk');
const post = firstHref(journal.html, '/gunluk/');

/*
 * [yol, beklenen durum, indeks (true/false/null=bakma), canonical (string: yol, '' yok, null bakma), not]
 * Canonical beklentisi yalnız indekslenebilir ortamda anlamlı.
 */
const rows = [
    ['/', 200, true, '/', 'ana sayfa'],
    [category, 200, true, category, 'kategori'],
    [`${category}?sayfa=1`, 308, null, null, 'sayfa=1 → temiz adres'],
    [`${category}?sayfa=1.5`, 308, null, null, 'geçersiz sayfa → temiz adres'],
    [`${category}?sirala=price_asc`, 200, false, '', 'sıralama: noindex, canonical yok'],
    [`${category}?secim=1`, 200, false, '', 'facet: noindex'],
    [`${category}?utm_source=test`, 200, true, category, 'takip parametresi yok sayılır'],
    [`${category}?sayfa=9999`, 200, false, null, 'sınır dışı sayfa: 404 arayüzü + noindex'],
    ['/kategori/yok-boyle-bir-kategori-xyz', 404, false, null, 'olmayan kategori'],
    [product, 200, true, product, 'ürün'],
    ['/urun/yok-boyle-bir-urun-xyz', 404, false, null, 'olmayan ürün'],
    ['/gunluk', 200, true, '/gunluk', 'Günlük'],
    ['/gunluk?konu=yok-boyle-konu', 200, false, null, 'bilinmeyen konu: 404 arayüzü'],
    [post, 200, true, post, 'yazı'],
    ['/arama?q=test', 200, false, null, 'arama: noindex, taranabilir'],
    ['/sepet', 200, false, null, 'sepet'],
    ['/giris', 200, false, null, 'giriş'],
    // Yönlendirme akış içinde (meta refresh); durum 200, robots.txt'te kapalı.
    ['/hesabim', 200, false, null, 'hesap: girişe yönlenir'],
    ['/siparis/OZ000000', 200, false, null, 'sipariş: erişim formu, noindex'],
].filter(([path]) => path);

const results = [];
for (const [path, status, index, canonical, note] of rows) {
    const result = await get(path);
    const wantIndex = index === null ? null : index && indexable;
    const problems = [];
    // 307/308: Next ve proxy ikisini de kullanır; ikisi de geçici/kalıcı doğru sınıfta mı ona bakılır.
    if (result.status !== status) problems.push(`durum ${result.status}`);
    if (wantIndex !== null && result.noindex === wantIndex) problems.push(wantIndex ? 'noindex var' : 'noindex yok');
    if (indexable && canonical !== null && result.status === 200) {
        const got = result.canonical.replace(/^https?:\/\/[^/]+/, '');
        if (got !== canonical) problems.push(`canonical "${got || 'yok'}"`);
    }
    results.push({ path, note, result, problems });
}

if (checkSitemap && indexable) {
    const xml = await (await fetch(`${base}/sitemap.xml`)).text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replace(/^https?:\/\/[^/]+/, '') || '/');
    for (const path of locs) {
            const result = await get(path);
        const problems = [];
        if (result.status !== 200) problems.push(`durum ${result.status}`);
        if (result.noindex) problems.push('noindex');
        if (result.canonical.replace(/^https?:\/\/[^/]+/, '') !== path) problems.push(`canonical "${result.canonical}"`);
        if (/konu=/.test(path)) problems.push('konu adresi site haritasında');
        if (problems.length) results.push({ path, note: 'site haritası', result, problems });
    }
    console.log(`<!-- site haritası: ${locs.length} adres tarandı -->`);
}

const cell = (text) => String(text || '—').replace(/\|/g, '\\|');
console.log(`Ölçüm: ${base} · ${new Date().toISOString()} · ortam ${indexable ? 'İNDEKSLENEBİLİR' : 'indekslenmez (robots.txt Disallow: /)'}\n`);
console.log('| Adres | Not | Durum | Location | X-Robots-Tag | robots meta | canonical | Sonuç |');
console.log('|---|---|---|---|---|---|---|---|');
for (const { path, note, result, problems } of results) {
    console.log(`| \`${cell(path)}\` | ${cell(note)} | ${result.status} | ${cell(result.location)} | ${cell(result.header)} | ${cell(result.robots)} | ${cell(result.canonical.replace(/^https?:\/\/[^/]+/, ''))} | ${problems.length ? `✗ ${problems.join(', ')}` : '✓'} |`);
}
const failed = results.filter((row) => row.problems.length).length;
console.log(`\n${results.length - failed}/${results.length} satır beklendiği gibi.`);
process.exit(failed ? 1 : 0);
