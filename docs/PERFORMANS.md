# Hız ölçümü (D10)

Laboratuvar ölçümü (Lighthouse) ile saha verisi (CrUX, gerçek kullanıcılar) aynı
şey değildir. Yeni sitede CrUX olmadığı için "Core Web Vitals geçti" iddiası
YOK; bu dosya laboratuvar riskini ve düzeltmelerin etkisini kaydeder. TBT, INP'nin
yerine sayılmaz. Hedef saha eşikleri (75. yüzdelik): LCP ≤ 2,5 sn, INP ≤ 200 ms,
CLS ≤ 0,1.

## Protokol

Aynı koşul, aynı sürüm, her satır en az 3 koşunun medyanı:

```bash
mkdir -p /tmp/lh
for i in 1 2 3; do
  npx -y lighthouse@13.5.0 "$URL" --only-categories=performance --output=json \
    --output-path="/tmp/lh/<sayfa>_mobile_$i.json" --quiet --chrome-flags="--headless=new"
  npx -y lighthouse@13.5.0 "$URL" --preset=desktop --only-categories=performance --output=json \
    --output-path="/tmp/lh/<sayfa>_desktop_$i.json" --quiet --chrome-flags="--headless=new"
done
node scripts/perf-report.mjs /tmp/lh      # medyan tablosu (markdown)
```

- **Sıcak önbellek:** ölçümden önce sayfaya iki istek atılır.
- **Soğuk önbellek:** deploy'dan hemen sonra ya da Panel › Önbellek › "Tümünü
  temizle" sonrası ilk ölçüm; ayrıca `curl -o /dev/null -w '%{time_starttransfer}'`.
- **Kayıt:** tarih, deploy commit'i, Lighthouse sürümü, `x-vercel-id` (kenar ::
  fonksiyon bölgesi).
- **Sayfalar:** ana sayfa, yoğun kategori (sayfa 1 ve varsa 2), tek ve çok
  varyantlı ürün, görselli yazı, mobil ödeme (sepet dolu; Lighthouse CLI sepet
  kuramaz — DevTools Performance paneliyle elle).
- Lighthouse 100 için ürün veya ödeme akışı bozulmaz; her düzeltmeden sonra
  özel akışlar (sepete ekle, ödeme, yaş katmanı) elle denenir.

## Düzeltmeler

| # | Bulgu | Düzeltme | Durum |
|---|---|---|---|
| 1 | Sayfayı render eden Vercel fonksiyonu **iad1 (ABD)**, API **Frankfurt**: önbellek ıskasında her API çağrısı Atlantik'i iki kez geçiyor (`x-vercel-id: fra1::iad1::…`, 7 Ekim 2026) | `vercel.json` → `"regions": ["fra1"]` | Kodda; deploy sonrası `x-vercel-id` `fra1::fra1` olmalı |
| 2 | Hero'da mobil ve masaüstü görseli ikisi de `priority`: her ekranda İKİ görsel ön yükleniyordu (`<link rel=preload>` × 2) | Tek `<picture>` (`getImageProps`), ilk slayt `loading="eager"` + `fetchPriority="high"`, preload yok | Kodda; ana sayfa HTML'inde preload 2 → 0 |
| 3 | Ürün sayfası ürün → yorum → ayarlar okumalarını SIRAYLA bekliyordu; yorum bloğu aynı veriyi farklı önbellek anahtarıyla ikinci kez çekiyordu | `Promise.all` + `getReviews(slug, 1)` açık sayfa | Kodda |
| 4 | Liste ve ana sayfada 4–12 kart görseli öncelikli (ana sayfada üç bölüm × 4 kart), hero ile bant genişliği yarışı; `priority` Next 16'da kalktı | Liste 2 kart; ana sayfada yalnız ilk blok; `priority` → `loading="eager"` + `fetchPriority="high"` | Kodda |

## Başlangıç ölçümü (değişikliklerden ÖNCE)

Ölçülen: `https://dev.ozmishop.com` (değişikliklerden önceki kod, master `67f6271`),
7 Ekim 2026, sıcak önbellek (`x-vercel-cache: HIT`), `x-vercel-id: fra1::iad1`.
Görselli yazı dev'de yok; yazı satırı görselsiz. Kategori sayfası 2 yok (katalog
25 ürün). Mobil ödeme ölçülmedi (sepet gerekiyor).

Lighthouse 13.5.0 · ilk koşu 2026-10-06T22:40:40.207Z · her satır 3 koşunun medyanı

| Sayfa | Cihaz | Skor | LCP | LCP: TTFB / yükleme gecikmesi / yükleme / render gecikmesi | FCP | TBT | CLS | SI | Toplam KB | LCP öğesi | İlk fırsatlar (son koşu) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| /gunluk/vucut-guvenli-silikon-nasil-anlasilir | desktop | 100 | 0.55 sn | 210 / 0 / 0 / 205 ms | 0.35 sn | 0 ms | 0.000 | 0.46 sn | 342 | `<h1 class="mt-4 max-w-[18ch] text-balance font-display text-[clamp(30p` | Reduce unused JavaScript (~40 ms) |
| /gunluk/vucut-guvenli-silikon-nasil-anlasilir | mobile | 98 | 2.48 sn | 210 / 0 / 0 / 260 ms | 1.03 sn | 12 ms | 0.000 | 1.16 sn | 342 | `<p>` | Reduce unused JavaScript (~150 ms) |
| / | desktop | 100 | 0.60 sn | 232 / 30 / 115 / 56 ms | 0.36 sn | 0 ms | 0.000 | 0.60 sn | 553 | `<img alt="Yeni sezon ürünleri" draggable="false" decoding="async" data` | Reduce unused JavaScript (~40 ms) |
| / | mobile | 94 | 3.01 sn | 229 / 35 / 155 / 479 ms | 1.28 sn | 7 ms | 0.000 | 1.62 sn | 482 | `<img alt="" draggable="false" decoding="async" data-nimg="fill" class=` | Reduce unused JavaScript (~150 ms) |
| /kategori/vibratorler | desktop | 100 | 0.64 sn | 232 / 467 / 73 / 86 ms | 0.32 sn | 0 ms | 0.000 | 0.55 sn | 526 | `<img alt="Diamond 10 Modlu Şarjlı Uzaktan Kumandalı Yumurta Vibratör" ` | Reduce unused JavaScript (~40 ms) |
| /kategori/vibratorler | mobile | 98 | 2.32 sn | 219 / 0 / 0 / 272 ms | 1.02 sn | 5 ms | 0.000 | 1.37 sn | 462 | `<p class="mt-3.5 text-[14px] leading-relaxed text-slate-600">` | Reduce unused JavaScript (~150 ms) |
| /urun/paslanmaz-celik-mucevherli-anal-plug | desktop | 100 | 0.56 sn | 212 / 48 / 138 / 52 ms | 0.33 sn | 0 ms | 0.000 | 0.51 sn | 411 | `<img alt="Paslanmaz Çelik Mücevherli Anal Plug" draggable="false" aria` | Reduce unused JavaScript (~40 ms) |
| /urun/paslanmaz-celik-mucevherli-anal-plug | mobile | 97 | 2.47 sn | 216 / 28 / 166 / 22 ms | 1.07 sn | 4 ms | 0.000 | 1.20 sn | 398 | `<img alt="Paslanmaz Çelik Mücevherli Anal Plug" draggable="false" aria` | — |
| /urun/uzaktan-kumandali-g-noktasi-yumurta-vibrator | desktop | 100 | 0.59 sn | 222 / 18 / 167 / 18 ms | 0.35 sn | 0 ms | 0.000 | 0.47 sn | 554 | `<img alt="Uzaktan Kumandalı G Noktası Yumurta Vibratör" draggable="fal` | Reduce unused JavaScript (~40 ms) |
| /urun/uzaktan-kumandali-g-noktasi-yumurta-vibrator | mobile | 97 | 2.62 sn | 226 / 20 / 117 / 140 ms | 1.27 sn | 0 ms | 0.000 | 1.38 sn | 505 | `<img alt="Uzaktan Kumandalı G Noktası Yumurta Vibratör" draggable="fal` | Reduce unused JavaScript (~150 ms) |

**Okuma:**

- Masaüstünde her sayfa 100. Mobil laboratuvar LCP'si 2,3–3,0 sn (Lighthouse'un
  yavaş 4G simülasyonu); en zayıfı **ana sayfa (3,0 sn)**. LCP öğesi hero'nun mobil
  görseli; ölçülen gecikmenin en büyük parçası render gecikmesi (~480 ms).
  Masaüstü görselinin de ön yüklenmesi bant genişliğini paylaştırıyordu → düzeltme #2.
- Sıcak önbellekte TTFB ~55 ms: CDN önbelleği çalışıyor. Bölge sorunu (#1) yalnız
  önbellek ıskasında (deploy sonrası, tazeleme sonrası, ilk ziyaret) görünür;
  ıskada her API çağrısı Atlantik'i iki kez geçiyor.
- TBT ≈ 0, CLS = 0: etkileşim ve yerleşim kayması riski düşük görünüyor (INP saha
  verisiyle doğrulanacak).
- Tek tekrarlayan fırsat "kullanılmayan JavaScript" (~150 ms, mobil): ilk iş değil.

## Sonra

Düzeltmeler deploy edilince aynı protokolle buraya eklenecek.
