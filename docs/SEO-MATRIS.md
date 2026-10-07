# SEO yanıt matrisi (D02)

Bu dosya kodun değil, **gerçek HTTP yanıtlarının** kaydıdır. Her yayından önce ve
sonra yeniden üretilir; "SEO dosyaları var" yerine burada ölçülen davranış esastır.

```bash
node scripts/smoke-seo.mjs https://ozmishop.com              # canlı
node scripts/smoke-seo.mjs https://ozmishop.com --sitemap    # + site haritasındaki her adres
node scripts/smoke-seo.mjs https://<önizleme>.vercel.app     # her satırda noindex beklenir
```

Kural sözleşmesi `lib/seo-url.ts`'te, birim testi `npm run check:seo`.

## Politika

| Konu | Karar | Nerede |
|---|---|---|
| Kanonik host | Yalnız `https://ozmishop.com`. www → 308 apex (Vercel alan adı ayarı + `proxy.ts` yedeği) | `lib/site.ts`, `proxy.ts` |
| İndekslenebilir ortam | `ozmishop.com` + Vercel Production + `SITE_INDEXABLE` ≠ `false`. Başka host (vercel.app takma adı, dev, önizleme): `X-Robots-Tag: noindex` + `Disallow: /` | `lib/site.ts`, `proxy.ts`, `next.config.ts` |
| Liste sayfaları | Filtresiz sayfa N indekslenir, canonical kendisi. Sıralama/stok/facet/marka/fiyat/arama: `noindex, follow`, canonical yok. `utm_*`, `gclid` yok sayılır | `lib/seo-url.ts` |
| Geçersiz `sayfa` | `sayfa=1`, ondalık, negatif, metin, tekrar → 308 temiz adres. Sınır dışı (`sayfa=9999`) → 404 arayüzü + noindex (akış başladığı için durum 200) | `proxy.ts`, `ProductListing` |
| Blog konusu (`?konu=`) | Yalnız süzgeç: noindex, site haritasında yok. Bilinmeyen konu → 404 arayüzü | `gunluk/page.tsx`, `app/sitemap.ts` |
| Ürünsüz kategori/marka | 200 kalır (stok gelince adres değerli), noindex, site haritası dışı. Stoksuz ama aktif ürün "dolu" sayılır | `lib/seo.ts`, `app/sitemap.ts` |
| Taşınan adres | Eski slug → yeni slug, tek adımda 308 (A→B→C'de A doğrudan C). Yayında olmayan hedefe yönlendirme yok | API `slug-history`, `lib/redirects.ts` |
| robots.txt | Yalnız işlem yolları kapalı (`/api/`, `/hesabim/`, `/sepet`, `/odeme`, `/siparis/`). noindex sayfalar KAPATILMAZ: kapatılırsa Google noindex'i okuyamaz | `app/robots.ts` |
| Yaş katmanı | Yalnız istemcide; sunucu HTML'i içeriği taşır, botlara içerik kapanmaz | `components/AgeGate.tsx` |
| API kesintisi | Sayfa gövdesi `error.tsx` ile markalı hata gösterir, noindex BASILMAZ. Header/footer önbellekten sunulur | `app/(magaza)/error.tsx` |
| Yetişkin işareti | `rating: adult` metası ve RTA başlığı SİTENİN TAMAMINDA, Günlük dahil (işletme kararı, 7 Ekim 2026). Günlük SafeSearch'te filtrelenir; bu bilinçli | `app/layout.tsx`, `next.config.ts` |
| Paylaşım görseli | Ürün sayfası ürün fotoğrafını kullanır (işletme kararı); diğer sayfalar marka kartı (`/og.png`), Günlük yazısı kendi kartı | `lib/seo.ts`, `app/og.png` |
| Marka varlıkları | Simge `public/brand/ozmishop-mark.svg` ("o." monogramı); favicon, Apple simgesi, `public/logo.png` (Organization logosu) ondan üretildi; kartlarda Sora (`assets/fonts`, SIL OFL) | `app/icon.svg`, `lib/og.ts` |

## Son ölçüm

Yerel üretim derlemesi + yerel test API'si (`ozmishop_claude`), 7 Ekim 2026. Kanonik
olmayan host üzerinden ölçüldüğü için her satır noindex; canonical ve indeks satırları
ayrıca `Host: ozmishop.com` ile elle doğrulandı (ana sayfa, kategori, yazı, kurumsal
sayfa ve koleksiyon `index, follow` + kendi canonical'ı; sıralamalı kategori
`noindex, follow`; site haritası 146 adres, konu adresi 0).

**Canlı alan adı açılınca bu bölüm canlı ölçümle değiştirilecek.**

Ölçüm: http://localhost:3201 · 2026-10-06T22:31:53.796Z · ortam indekslenmez (robots.txt Disallow: /)

| Adres | Not | Durum | Location | X-Robots-Tag | robots meta | canonical | Sonuç |
|---|---|---|---|---|---|---|---|
| `/` | ana sayfa | 200 | — | noindex, nofollow | index, follow | — | ✓ |
| `/kategori/vibratorler` | kategori | 200 | — | noindex, nofollow | index, follow | /kategori/vibratorler | ✓ |
| `/kategori/vibratorler?sayfa=1` | sayfa=1 → temiz adres | 308 | /kategori/vibratorler | — | — | — | ✓ |
| `/kategori/vibratorler?sayfa=1.5` | geçersiz sayfa → temiz adres | 308 | /kategori/vibratorler | — | — | — | ✓ |
| `/kategori/vibratorler?sirala=price_asc` | sıralama: noindex, canonical yok | 200 | — | noindex, nofollow | noindex, follow | — | ✓ |
| `/kategori/vibratorler?secim=1` | facet: noindex | 200 | — | noindex, nofollow | noindex, follow | — | ✓ |
| `/kategori/vibratorler?utm_source=test` | takip parametresi yok sayılır | 200 | — | noindex, nofollow | index, follow | /kategori/vibratorler | ✓ |
| `/kategori/vibratorler?sayfa=9999` | sınır dışı sayfa: 404 arayüzü + noindex | 200 | — | noindex, nofollow | index, follow + noindex | /kategori/vibratorler?sayfa=9999 | ✓ |
| `/kategori/yok-boyle-bir-kategori-xyz` | olmayan kategori | 404 | — | noindex, nofollow | noindex | — | ✓ |
| `/urun/ozmi-dantel-bodysuit` | ürün | 200 | — | noindex, nofollow | index, follow | /urun/ozmi-dantel-bodysuit | ✓ |
| `/urun/yok-boyle-bir-urun-xyz` | olmayan ürün | 404 | — | noindex, nofollow | noindex | — | ✓ |
| `/gunluk` | Günlük | 200 | — | noindex, nofollow | index, follow | /gunluk | ✓ |
| `/gunluk?konu=yok-boyle-konu` | bilinmeyen konu: 404 arayüzü | 200 | — | noindex, nofollow | noindex, follow + noindex | — | ✓ |
| `/gunluk/vucut-guvenli-silikon-nasil-anlasilir` | yazı | 200 | — | noindex, nofollow | index, follow | /gunluk/vucut-guvenli-silikon-nasil-anlasilir | ✓ |
| `/arama?q=test` | arama: noindex, taranabilir | 200 | — | noindex, nofollow | noindex, follow | — | ✓ |
| `/sepet` | sepet | 200 | — | noindex, nofollow | noindex, follow | — | ✓ |
| `/giris` | giriş | 200 | — | noindex, nofollow | noindex, follow | — | ✓ |
| `/hesabim` | hesap: girişe yönlenir | 200 | — | noindex, nofollow | index, follow | — | ✓ |
| `/siparis/OZ000000` | sipariş: erişim formu, noindex | 200 | — | noindex, nofollow | noindex, nofollow | — | ✓ |

19/19 satır beklendiği gibi.
