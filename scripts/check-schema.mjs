/**
 * Ürün yapısal verisi (lib/schema.ts) — düz Node testi, `npm run check:seo`.
 * Kural: şema görünür teklifle AYNI veriden çıkar; fiyatsız üründe teklif yok,
 * sahte "ücretsiz" fiyat yok, GTIN yalnız geçerli barkodla.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidGtin, productSchema } from '../lib/schema.ts';

const variant = (over = {}) => ({
    id: 1, sku: 'SKU-1', barcode: null, name: 'V', price: 100, compareAtPrice: null, discountPercent: 0,
    stockQuantity: 5, trackStock: true, inStock: true, isDefault: true, isActive: true, options: [], images: [],
    ...over,
});
const product = (variants, over = {}) => ({
    slug: 'ornek', name: 'Örnek', shortDescription: 'Kısa', metaDescription: null, images: [],
    brand: { name: 'Marka' }, category: { name: 'Kategori' },
    price: variants[0]?.price ?? null, minPrice: null, maxPrice: null, inStock: true, variants,
    ...over,
});

test('GTIN sağlama hanesi', () => {
    assert.ok(isValidGtin('4006381333931'));
    assert.ok(isValidGtin('96385074'));
    assert.ok(!isValidGtin('4006381333932'));
    assert.ok(!isValidGtin('ABC123'));
    assert.ok(!isValidGtin(null));
});

test('tek varyant: Offer, SKU ve geçerli GTIN', () => {
    const schema = productSchema(product([variant({ barcode: '4006381333931' })]));
    assert.equal(schema.offers['@type'], 'Offer');
    assert.equal(schema.offers.price, 100);
    assert.equal(schema.sku, 'SKU-1');
    assert.equal(schema.gtin, '4006381333931');
    assert.equal(schema.hasAdultConsideration, 'https://schema.org/SexualContentConsideration');
});

test('geçersiz barkod gtin olarak basılmaz', () => {
    assert.equal(productSchema(product([variant({ barcode: '123' })])).gtin, undefined);
});

test('çok varyant: aralık aktif varyantlardan, SKU varsayılandan', () => {
    const schema = productSchema(product([
        variant({ id: 1, sku: 'A', price: 120, isDefault: false }),
        variant({ id: 2, sku: 'B', price: 90, isDefault: true }),
        variant({ id: 3, sku: 'C', price: 10, isActive: false }),
    ]));
    assert.equal(schema.offers['@type'], 'AggregateOffer');
    assert.equal(schema.offers.lowPrice, 90);
    assert.equal(schema.offers.highPrice, 120);
    assert.equal(schema.offers.offerCount, 2);
    assert.equal(schema.sku, 'B');
    assert.equal(schema.gtin, undefined);
});

test('kısmen stoklu: herhangi biri stoktaysa InStock; hepsi stoksuzsa OutOfStock', () => {
    const partial = productSchema(product([variant({ inStock: false }), variant({ id: 2, price: 150, inStock: true, isDefault: false })]));
    assert.equal(partial.offers.availability, 'https://schema.org/InStock');
    const none = productSchema(product([variant({ inStock: false })], { inStock: false }));
    assert.equal(none.offers.availability, 'https://schema.org/OutOfStock');
});

test('fiyatsız ürün: teklif HİÇ basılmaz (eskiden 0 TL)', () => {
    const schema = productSchema(product([variant({ price: 0 })], { price: null }));
    assert.equal(schema.offers, undefined);
});

test('yorumsuz üründe aggregateRating yok; gerçek yorumda var', () => {
    const base = product([variant()]);
    assert.equal(productSchema(base, { summary: { count: 0, average: null }, items: [] }).aggregateRating, undefined);
    const rated = productSchema(base, {
        summary: { count: 2, average: 4.5 },
        items: [{ rating: 5, author: 'A.', createdAt: '2026-10-01', title: null, body: 'İyi' }],
    });
    assert.equal(rated.aggregateRating.reviewCount, 2);
    assert.equal(rated.review.length, 1);
});

test('Organization: logo her zaman; iletişim ve sosyal hesaplar ayardan', async () => {
    const { organizationSchema } = await import('../lib/schema.ts');
    const bare = organizationSchema(null);
    assert.equal(bare.logo.url.endsWith('/logo.png'), true);
    assert.equal(bare.contactPoint, undefined);
    assert.equal(bare.sameAs, undefined);
    const full = organizationSchema({
        'sirket.telefon': '0850 000 00 00', 'sirket.eposta': 'destek@ozmishop.com', 'sirket.unvan': 'Ozmi Ltd.',
        'sirket.adres': 'Gizli Sok. 1', 'sosyal.instagram': 'https://www.instagram.com/ozmishop', 'sosyal.x': 'x.com/eksik-https',
    });
    assert.deepEqual(full.sameAs, ['https://www.instagram.com/ozmishop']);
    assert.equal(full.contactPoint[0].telephone, '0850 000 00 00');
    assert.equal(full.legalName, 'Ozmi Ltd.');
    assert.equal(JSON.stringify(full).includes('Gizli Sok'), false, 'açık adres şemaya girmez');
});
