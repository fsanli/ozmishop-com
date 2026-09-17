# ozmishop — tasarım teslimi

Bu klasör `ozmishop-com` (Next.js 16 · React 19 · Tailwind 4) projesinin **yeni arayüz tasarımıdır**.
Tasarım dosyaları tarayıcıda açılıp gezilebilen çalışan HTML ekranlarıdır; ekran görüntüsü değildir.

**`00 Ekranlar.dc.html` ile başla** — tüm ekranların dizini oradadır.

---

## İki versiyon var

| | **v2 — Karanlık Oda** (güncel) | **v1 — Modernist** |
|---|---|---|
| Dosyalar | `… v2.dc.html` | `01 Anasayfa.dc.html` vb. |
| Tema dosyası | `uygulama/globals-v2.css` | `uygulama/globals.css` |
| Zemin | `#faf8f8` sıcak nötr | `#f3f2f2` kağıt |
| Mürekkep | `#1a1418` şarap-siyah | `#201e1d` |
| Aksiyon rengi | `#9b1f47` bordo | `#ec3013` kırmızı |
| Köşe yarıçapı | 12–28px | **0px** |
| Ayrım | 1px kenarlık, hover'da koyulaşır | 2px kural çizgisi |
| Font | Sora (başlık) + Manrope (metin) | Archivo |
| Renk kullanımı | Kategori kodlu 4 renk, yalnızca ince detaylarda | Tek kırmızı, seyrek |

İkisi de tamdır — aynı 10 ekranı, aynı içerikle, iki farklı dilde anlatır.
Uygulamaya geçerken **birini seç**; ikisini karıştırma.

---

## v2 — Karanlık Oda (önerilen)

Piyasadaki sex shop siteleri koyu mor–neon pembe kalıbında sıkışmış durumda. v2 sade açık
bir zemin kurar, yetişkin hissini **koyu şarap-siyah bloklardan** ve tek bordo aksiyondan
alır; renk büyük alanlara değil **ince detaylara** dağılır.

### Palet

| Rol | Değer |
|---|---|
| Zemin | `#faf8f8` |
| Yüzey (kart) | `#ffffff` |
| Ürün görseli zemini | `#fbf9fa` |
| Mürekkep / koyu blok | `#1a1418` · yumuşak koyu `#241a20` |
| Gövde metni | `#3d353a` · ikincil `#635a60` · üçüncül `#7a7076` |
| Aksiyon (bordo) | `#9b1f47` · hover `#821a3b` |

**Kategori renkleri** — yalnızca 5–7px noktalarda, 3px kenar şeritlerinde ve küçük rozetlerde:

| Rol | Nokta / şerit | Küçük metin | Rozet zemini | Koyu blokta |
|---|---|---|---|---|
| Bordo | `#9b1f47` | `#9b1f47` | `#f4eef0` | `#e0899f` |
| Mor | `#6b3fa0` | `#5b4180` | `#f0ebf7` | `#b79ae0` |
| Yeşil | `#10726b` | `#0d6159` | `#e4f2f0` | `#7ec4bb` |
| Kehribar | `#c77d12` | `#8a5509` | `#faf0e0` | `#e3a86a` |
| Gül | `#c2506e` | `#a53d5c` | `#faecf0` | `#e0899f` |

Kategori renkleri sabittir: Vibratörler bordo, Masaj mor, Kayganlaştırıcı yeşil,
Çiftlere özel gül, İç giyim kehribar. Aynı renk her ekranda aynı kategoriyi gösterir.

### Kurallar

- **Sayfa başına tek bordo buton.** Diğer aksiyonlar koyu mürekkep ya da 1px çerçeveli.
- **Koyu blok sayfada 1–2 tane** — hero, gizlilik paneli veya CTA. Fazlası ağırlaştırır.
- **Gölge yok.** Kartlar 1px `rgba(26,20,24,.07)` kenarlıkla ayrılır; hover'da `.28`'e koyulaşır.
- **Kontrast tabanı `#635a60`.** İçerik metninde bundan açık gri kullanma
  (`#8f858a` yalnızca görsel yer tutucu yazılarında).
- Koyu blokta bordo okunmaz — `#e0899f` kullan.
- Köşe yarıçapı tutarlı: kart 18px, büyük panel 20–28px, buton/alan 12–14px, rozet 999px.
- Fiyatlar ve büyük sayılar **Sora**; gövde metni **Manrope**.

---

## Ekran → dosya haritası

| # | Ekran | v2 dosyası | v1 dosyası | Uygulanacağı kod yolu |
|---|---|---|---|---|
| 00 | Ekran dizini | `00 Ekranlar.dc.html` | — | — |
| 01 | Anasayfa | `01 Anasayfa v2.dc.html` | `01 Anasayfa.dc.html` | `app/page.tsx` + `components/home/*` |
| 02 | Kategori / listeleme | `02 Kategori v2.dc.html` | `02 Kategori.dc.html` | `app/kategori/[slug]/page.tsx` + `components/ProductListing.tsx` |
| 03 | Arama · öneri · marka | `03 Arama ve Marka v2.dc.html` | `03 Arama ve Marka.dc.html` | `app/arama/page.tsx`, `components/SearchBar.tsx`, `app/marka/[slug]/page.tsx` |
| 04 | Ürün detay | `04 Urun Detay v2.dc.html` | `04 Urun Detay.dc.html` | `app/urun/[slug]/page.tsx` + `ProductGallery` + `ProductPurchasePanel` |
| 05 | Sepet · çekmece · ödeme · onay | `05 Sepet ve Odeme v2.dc.html` | `05 Sepet ve Odeme.dc.html` | **YENİ** `app/sepet/`, `app/odeme/`, `app/siparis/[no]/` |
| 06 | Hesabım (9 bölüm) | `06 Hesabim v2.dc.html` | `06 Hesabim.dc.html` | **YENİ** `app/hesabim/**` |
| 07 | Giriş · 18+ · 404 · boş durumlar | `07 Giris ve Durumlar v2.dc.html` | `07 Giris ve Durumlar.dc.html` | **YENİ** `app/giris/` · mevcut `components/AgeGate.tsx`, `app/not-found.tsx` |
| 08 | Günlük (blog, kendi layout'u) | `08 Blog v2.dc.html` | `08 Blog.dc.html` | **YENİ** `app/gunluk/` + `app/gunluk/[slug]/` |
| 09 | Başlangıç rehberi | `09 Baslangic Rehberi v2.dc.html` | `09 Baslangic Rehberi.dc.html` | **YENİ** `app/rehber/` |

Header ve footer her ekranın içine gömülüdür (dosyalar tek başına açılabilsin diye).
`components/Header.tsx` / `Footer.tsx` için herhangi bir v2 ekranındaki bloğu referans al.

---

## Claude Code'a ilk adım

1. **Tema dosyası** — `uygulama/globals-v2.css` dosyasını `app/globals.css` ile değiştir.
   Sınıf isimleri aynı (`btn-primary`, `card`, `badge`, `heading-1`, `price`, `field-input`,
   `prose-content` …), yalnızca token'lar ve stiller değişti. Tek dosyayı değiştirince site
   büyük ölçüde yeni görünüme geçer.
   v2'de eklenen yardımcı sınıflar: `.block-dark`, `.card-edge-top`, `.card-edge-left`,
   `.dot`, `.kicker`, `.badge-plum/-teal/-amber/-rose`, `.brand-line`, `.btn-pill`.

2. **Font** — `app/layout.tsx` içinde `Inter` yerine:
   ```
   import { Sora, Manrope } from 'next/font/google';
   const sora    = Sora({ subsets:['latin','latin-ext'], weight:['400','500','600','700'],
                          variable:'--font-sora', display:'swap' });
   const manrope = Manrope({ subsets:['latin','latin-ext'], weight:['400','500','600','700'],
                             variable:'--font-manrope', display:'swap' });
   ```
   `latin-ext` Türkçe karakterler için zorunlu.

3. **Header / Footer** — v2 ekranlarındaki bloğu birebir uygula. Yeni olan tek şey sağ üstteki
   **Hızlı çıkış** düğmesi ve nav'daki kategori renk noktaları.

4. **ProductCard** — 18px köşe, 1px kenarlık, gölgesiz. Yeni alanlar: `specs` rozetleri
   (malzeme / dB / IPX, kategori renkleriyle) ve puan satırı.

5. **ProductListing** — filtre kenar çubuğu beyaz kart içinde. Yeni facet grupları:
   **Malzeme, Ses seviyesi (dB), Su geçirmezlik (IPX), Uzunluk** — her grubun başlığında
   kendi renk noktası var. Bunlar API'de variant key olarak tanımlanmalı.

6. **Ürün detay** — “Teknik künye” ızgarası (her hücrede 3px renkli sol şerit) ve
   “Bu ürün sana uygun mu?” bloğu yeni.

7. **Yeni rotalar** (Faz 2): sepet, ödeme, hesabım, günlük, rehber.

---

## API'de açılması gereken yeni alanlar

- `product.soundDb` — ses seviyesi (sayı, dB)
- `product.waterproof` — `IPX7 | IPX4 | none`
- `product.material` — malzeme etiketi
- `product.lengthCm`, `product.widthCm`, `product.weightG`
- `product.lubeCompatibility` — su bazlı / silikon bazlı uyumu
- `product.fitNotes` — `{ positive: string[]; negative: string[] }` (“sana uygun mu” maddeleri)
- `product.boxContents` — kutu içeriği listesi
- `category.colorKey` — `berry | plum | teal | amber | rose` (v2'nin renk kodlaması buna bağlı)
- Yorum: `review.pseudonym`, `review.verifiedBuyer`, `review.variantLabel`, `review.helpfulCount`
- Sadakat: `customer.points`, `order.reorderable`, `product.typicalRepurchaseDays`
- Gizlilik: `customer.privacy = { pinEnabled, neutralStatementName, neutralEmailSubject, marketingEmails, panicExit }`

Alanlar gelene kadar ilgili parçalar gizlenebilir; layout bozulmaz.

---

## Farklılaştırıcılar — tasarımda nerede

| Konu | Nerede |
|---|---|
| Gizlilik hissi | Header'da “Hızlı çıkış” · ürün detayda “Bu siparişte gizlilik” koyu bloğu · ödeme özetinde nötr ekstre notu · sipariş onayında gizlilik künyesi · Hesabım → Gizlilik modu (PIN, nötr ekstre, nötr e-posta, geçmişi sil) |
| Başlangıç rehberi | `09` — 4 soru, üç öneri, her öneri için “neden bu” gerekçesi. Anasayfada koyu blok, kategoride şerit, arama sonuçlarında sonuç altı çağrısı |
| Ürün detay derinliği | 12 hücrelik teknik künye + artı/eksi uygunluk listesi + kartlardaki dB/IPX/malzeme rozetleri |
| Hızlı checkout | Tek sayfa ödeme, misafir alışveriş vurgulu, sağda yapışkan özet, taksit tablosu |
| Yorum sistemi | Puan dağılımı + doğrulanmış alıcı rozeti + **takma adla yayın** notu |
| Tekrar sipariş | Siparişlerim listesinde her satırda “Tekrar sipariş ver” · Puanlar ekranında “bitmek üzere olanlar” kartı |

---

## Görseller

Ürün görselleri **açık gri kutular** olarak duruyor; gerçek paket-shot'lar geldiğinde yerine konur.
Gereken çekim standardı: **beyaz fon, nötr stüdyo ışığı, kare (1:1) kadraj, ürün ortalanmış, gölge yok**.
v1'de editoryal görseller siyah beyaza dönüştürülür; **v2'de renkli kalır**.

## Bilinen boşluklar

- Mobil hamburger çekmecesi ayrı ekran olarak çizilmedi (kategori şeridi dar ekranda yatay kayıyor).
- Markalar dizini (`/markalar`) çizilmedi; marka sayfası (`03`) referans alınabilir.
- Kurumsal sayfa şablonu çizilmedi; `prose-content` stilleri tema dosyasında güncel.
