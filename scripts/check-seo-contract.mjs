/**
 * Listeleme adreslerinin indeks sözleşmesi (lib/seo-url.ts) — düz Node testi.
 * Çalıştırma: `npm run check:seo`. Node 24 TypeScript tiplerini kendisi siler;
 * seo-url.ts bu yüzden Next'ten hiçbir şey import etmez.
 *
 * Bu test fonksiyonları sınar; gerçek HTTP/HTML davranışı smoke-seo.mjs ile
 * deploy üzerinde doğrulanır.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { indexPolicy, isListingPath, normalizeListingSearch, parsePage } from '../lib/seo-url.ts';

const base = '/kategori/ornek';
const params = (query) => {
    const out = {};
    new URLSearchParams(query).forEach((value, key) => {
        out[key] = key in out ? [].concat(out[key], value) : value;
    });
    return out;
};

test('sayfa okuma', () => {
    assert.deepEqual(parsePage(undefined), { kind: 'ok', page: 1 });
    assert.deepEqual(parsePage('2'), { kind: 'ok', page: 2 });
    assert.deepEqual(parsePage('02'), { kind: 'normalize', page: 2 });
    for (const raw of ['1.5', '-1', '0', 'abc', '', '10000', ['2', '3']]) {
        assert.deepEqual(parsePage(raw), { kind: 'invalid' }, `sayfa=${raw}`);
    }
});

// [sorgu, indekslenir mi, canonical]
const table = [
    ['', true, base],
    ['sayfa=2', true, `${base}?sayfa=2`],
    ['utm_source=x&utm_medium=y', true, base],
    ['sayfa=3&gclid=abc', true, `${base}?sayfa=3`],
    ['secim=1', false],
    ['secim=1&secim=2', false],
    ['secim=1&sayfa=2', false],
    ['ozellik=malzeme:silikon', false],
    ['aralik=uzunluk:10:20', false],
    ['min=100', false],
    ['max=500', false],
    ['stokta=1', false],
    ['sirala=price_asc', false],
    ['marka=ornek', false],
    ['q=vibrator', false],
    ['konu=hijyen', false],
    ['bulten=tamam', false],
    ['foo=bar', false],
    ['sayfa=1.5', false],
];

test('indeks kararı ve canonical', () => {
    for (const [query, index, canonical] of table) {
        const policy = indexPolicy(params(query), base);
        assert.equal(policy.index, index, `?${query} index`);
        assert.equal(policy.canonical, canonical, `?${query} canonical`);
    }
});

test('proxy normalizasyonu', () => {
    const cases = [
        ['', null],
        ['?sayfa=2', null],
        ['?sayfa=1', ''],
        ['?sayfa=02', '?sayfa=2'],
        ['?sayfa=01', ''],
        ['?sayfa=1.5', ''],
        ['?sayfa=-1', ''],
        ['?sayfa=abc', ''],
        ['?sayfa=', ''],
        ['?sayfa=2&sayfa=3', ''],
        ['?secim=4&sayfa=1', '?secim=4'],
        ['?sirala=newest&sayfa=0&secim=4', '?sirala=newest&secim=4'],
        ['?q=a+b&sayfa=x', '?q=a+b'],
    ];
    for (const [input, expected] of cases) {
        assert.equal(normalizeListingSearch(input), expected, `'${input}'`);
    }
});

test('normalizasyonun uygulandığı yollar', () => {
    for (const path of ['/kategori/a', '/marka/b', '/koleksiyon/c', '/gunluk', '/arama']) {
        assert.ok(isListingPath(path), path);
    }
    for (const path of ['/urun/a', '/gunluk/yazi', '/kategori/a/b', '/', '/sayfa/x']) {
        assert.ok(!isListingPath(path), path);
    }
});
