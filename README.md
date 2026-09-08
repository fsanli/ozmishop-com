# ozmishop-com

ozmishop.com vitrini. Next.js 16 (App Router) · React 19 · Tailwind 4.
Üretim bağımlılığı yalnızca `next`, `react`, `react-dom` — hazır UI kütüphanesi kullanılmaz.

## Hızlı başlangıç

```bash
# Önce API çalışmalı
cd ../ozmishop-api && npm run dev     # :4000

cp .env.example .env.local
npm install
npm run dev                            # http://localhost:3200
```

> `npm run build` API'ye ihtiyaç duyar: sayfalar derleme sırasında önbelleğe alınır ve örnek
> adresler (`generateStaticParams`) API'den okunur. API kapalıysa derleme açık bir mesajla durur —
> katalogsuz bir siteyi sessizce yayına almaktan iyidir.

| Komut | Ne yapar |
|---|---|
| `npm run dev` / `build` / `start` | Geliştirme (3200) · derleme · üretim |
| `npm run check` | `tsc --noEmit` + ESLint |

## Önbellek mimarisi (bu projenin ana fikri)

`cacheComponents: true` açıktır: sayfalar **statik kabuk + akan içerik** (PPR) olarak render edilir.
`lib/api.ts` içindeki her okuma fonksiyonu `'use cache'` ile önbelleklenir ve `cacheTag` ile
etiketlenir; süreler bilinçli olarak uzundur (`cacheLife('days')`).

Tazelik zamana değil, **panelde bir değişiklik olduğunda API'nin çağırdığı** uca bağlıdır:

```
Panel → ozmishop-api → POST /api/revalidate (x-revalidate-secret) → revalidateTag(...)
```

Etiketler API'deki `CacheService.TAGS` ile birebir aynıdır:
`home · products · categories · brands · groups · banners · pages` ve alt etiketler
`product:{slug}` · `category:{slug}` · `brand:{slug}` · `group:{code}` · `page:{slug}`.

Bir ürünün adını değiştirmek ilgili 5–6 etiketi düşürür; ziyaretçi bir sonraki istekte güncel
içeriği görür, TTL beklenmez. Arama sonuçları ve görüntülenme sayacı önbelleklenmez.

## SEO

| Konu | Uygulama |
|---|---|
| Render | Statik kabuk + akan liste (PPR); katalog verisi etiketle önbellekli |
| URL | Türkçe ve okunabilir: `/urun/lelo-sona-2-klitoral-stimulator` |
| Metadata | `generateMetadata`; panelden girilen meta alanları önceliklidir |
| Yapısal veri | Organization · WebSite (SearchAction) · Product (Offer/AggregateOffer) · BreadcrumbList · ItemList |
| Sitemap | `/sitemap.xml` — `lastModified` gerçek `updatedAt` değerinden |
| Facet URL'leri | Tek facet indekslenir; çoklu kombinasyon, fiyat aralığı ve sayfa 2+ `noindex, follow` |
| Sayfalama | Sayfa 2+ kendine canonical verir |
| Arama | `noindex` (Google'ın "arama içinde arama" kuralı) |
| Slug değişimi | 404 vermeden önce slug geçmişine bakılır, 308 ile yönlendirilir |
| robots.txt | Yalnızca gerçek alan adında taramaya izin verir; test ortamları indekslenmez |
| Yetişkin içerik | `rating: adult` + RTA meta ve `Rating` başlığı |

**18+ kapısı** yalnızca istemcide çizilir (`components/AgeGate.tsx`, onay 30 gün localStorage'da).
Sayfa içeriği sunucudan normal render edilir: arama motoruna farklı içerik göstermek cloaking'dir.

## Tasarım sistemi

`app/globals.css` `@theme` blokunda: **brand** gece moru (`#5b2a86`), **accent** fuşya (`#e11d8f`),
**slate** sıcak nötr gri (Tailwind'inki ezilir). Zemin `bg-slate-50`, kartlar `bg-white`.

Fuşya seyrek kullanılır: bir ekranda birden fazla fuşya buton varsa ikisi de dikkat çekmez —
`btn-accent` yalnızca hero CTA ve indirim rozetleri içindir. Birincil aksiyon `btn-primary` (mor).

> ⚠️ Tailwind v4'te **özel bir sınıf başka bir özel sınıfı `@apply` edemez**; dört buton sınıfı
> ortak tabanı tekrar eder. `@apply btn-primary` yazmayın.

Sayfa kabuğu `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`, bölümler `py-10 sm:py-14`,
ürün ızgarası `grid-cols-2 → sm:3 → lg:4 → xl:5`, listeleme `lg:grid-cols-[240px_1fr]` yapışkan filtre.
Font Inter, `latin-ext` alt kümesiyle (Türkçe karakterler için şart).

## Dizin yapısı

```
app/
  page.tsx                  anasayfa (düzen panelden: /home)
  urun/[slug]/              galeri · varyant seçici · görüntülenme sayacı
  kategori/[slug]/          marka/[slug]/  koleksiyon/[slug]/  markalar/  arama/  sayfa/[slug]/
  api/revalidate/           API'nin çağırdığı önbellek geçersiz kılma ucu
  api/suggest/  api/events/product-view/   BFF vekilleri
  sitemap.ts  robots.ts  not-found.tsx
components/                 Header Footer SearchBar MobileMenu AgeGate ProductCard ProductListing …
components/home/            HeroSlider BannerBlock CategoryGrid BrandStrip ProductGroupSection
lib/
  api.ts                    önbellek katmanı (use cache + cacheTag + cacheLife)
  listing.ts                filtre → URL, canonical ve noindex kuralları
  schema.ts  site.ts  format.ts  redirects.ts  types.ts
```

Filtreler `<Link>`'tir, istemci durumu yoktur: JavaScript kapalıyken de çalışır, adres
paylaşılabilir ve geri tuşu beklendiği gibi davranır. İstemci bileşenleri sayılıdır —
`SearchBar`, `MobileMenu`, `AgeGate`, `ProductGallery`, `ProductPurchasePanel`, `ProductViewPing`.
