/**
 * İzin biçimi ve analitik temizleyicileri — düz Node testi (`npm run check:seo`).
 * GA tanımlıymış gibi çalışır (NEXT_PUBLIC_GA_ID package.json'da verilir):
 * izin sürümü 2, v1 onayı analitiği KAPSAMAZ.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { CONSENT_VERSION, parseConsent } from '../lib/consent-format.ts';
import { cleanSearchTerm, cleanUrl, cleanUtm } from '../lib/analytics/sanitize.ts';

test('izin sürümü: GA tanımlıyken 2', () => {
    assert.equal(CONSENT_VERSION, 2);
});

test('v1 onayı analitiğe genişlemez, bant yeniden çıkar, canlı destek korunur', () => {
    assert.deepEqual(parseConsent('v=1&islevsel=1&analitik=1'), { decided: false, functional: true, analytics: false });
});

test('v2 kararları', () => {
    assert.deepEqual(parseConsent('v=2&islevsel=0&analitik=1'), { decided: true, functional: false, analytics: true });
    assert.deepEqual(parseConsent('v=2&islevsel=1&analitik=0'), { decided: true, functional: true, analytics: false });
});

test('bozuk ya da boş çerez: karar yok, her şey kapalı', () => {
    for (const raw of ['', null, 'çöp', 'v=abc&analitik=1']) {
        assert.deepEqual(parseConsent(raw), { decided: false, functional: false, analytics: false }, String(raw));
    }
});

test('page_location: e-posta, jeton ve arama terimi atılır; liste parametreleri kalır', () => {
    assert.equal(cleanUrl('https://ozmishop.com/siparis/OZ1?e=ali%40ornek.com&odeme=ok'), 'https://ozmishop.com/siparis/OZ1');
    assert.equal(cleanUrl('https://ozmishop.com/sifre-yenile?t=abc123'), 'https://ozmishop.com/sifre-yenile');
    assert.equal(cleanUrl('https://ozmishop.com/arama?q=ali@ornek.com'), 'https://ozmishop.com/arama');
    assert.equal(cleanUrl('https://ozmishop.com/kategori/x?sayfa=2&sirala=newest&utm_source=ig#top'), 'https://ozmishop.com/kategori/x?sayfa=2&sirala=newest&utm_source=ig');
    assert.equal(cleanUrl('https://ozmishop.com/kategori/x?utm_campaign=veli@ornek.com'), 'https://ozmishop.com/kategori/x?utm_campaign=%5Bredacted%5D');
    assert.equal(cleanUrl('bozuk adres'), '');
});

test('arama terimi ve UTM: kişisel veri temizlenir', () => {
    assert.equal(cleanSearchTerm('  0532 123 45 67 vibratör '), '[redacted] vibratör');
    assert.equal(cleanUtm('Instagram', { lower: true }), 'instagram');
    assert.equal(cleanUtm('kampanya<script>'), 'kampanyascript');
    assert.equal(cleanUtm('mail ali@ornek.com'), 'mail [redacted]');
    assert.equal(cleanUtm(''), undefined);
    assert.equal(cleanUtm('x'.repeat(300)).length, 100);
});

test('kaynak: UTM, dış yönlendirme, iç gezinme, ödeme dönüşü', async () => {
    const { touchFrom, mergeTouch, gaIdsFrom } = await import('../lib/analytics/attribution.ts');
    const utm = touchFrom('https://ozmishop.com/kategori/x?utm_source=Instagram&utm_medium=Social&utm_campaign=Ekim%20ali@ornek.com&e=gizli', '', 'ozmishop.com', 100);
    assert.deepEqual(utm, { source: 'instagram', medium: 'social', campaign: 'Ekim [redacted]', term: undefined, content: undefined, landing: '/kategori/x', at: 100 });
    assert.equal(touchFrom('https://ozmishop.com/', 'https://www.google.com/', 'ozmishop.com', 1).source, 'www.google.com');
    assert.equal(touchFrom('https://ozmishop.com/sepet', 'https://ozmishop.com/urun/a', 'ozmishop.com'), null);
    assert.equal(touchFrom('https://ozmishop.com/siparis/OZ1', 'https://www.paytr.com/odeme', 'ozmishop.com'), null);
    assert.equal(touchFrom('https://ozmishop.com/', '', 'ozmishop.com'), null);

    const first = { source: 'a', at: 1 };
    const second = { source: 'b', at: 2 };
    assert.deepEqual(mergeTouch(mergeTouch({}, first), second), { f: first, l: second });
    assert.deepEqual(mergeTouch({ f: first, l: first }, null), { f: first, l: first });

    assert.deepEqual(gaIdsFrom({ _ga: 'GA1.1.123456.789', _ga_ABC123: 'GS1.1.1700000000.1.1.1700000100.0.0.0' }, 'G-ABC123'), { clientId: '123456.789', sessionId: '1700000000' });
    assert.deepEqual(gaIdsFrom({ _ga: 'GA1.1.1.2', _ga_ABC123: 'GS2.1.s1700000000$o1$g1' }, 'G-ABC123'), { clientId: '1.2', sessionId: '1700000000' });
    assert.deepEqual(gaIdsFrom({}, 'G-ABC123'), {});
});
