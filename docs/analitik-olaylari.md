# Analitik olay sözleşmesi (D13–D17)

Google Analytics 4, **yalnız** `NEXT_PUBLIC_GA_ID` tanımlıysa VE ziyaretçi çerez
bandında **Analitik** iznini verdiyse çalışır. GTM yok: her etiket bu depoda,
kod incelemesinden geçer.

## İzin

| Durum | Ne olur |
|---|---|
| `NEXT_PUBLIC_GA_ID` boş | Bantta analitik seçeneği yok, izin sürümü 1, hiçbir analitik kod yüklenmez |
| GA tanımlı, izin yok / reddedildi | gtag.js **indirilmez**: Google'a istek yok, `_ga` çerezi yok, kaynak çerezi yok |
| GA tanımlı, eski (v1) onay | Bant yeniden çıkar; eski onay analitiğe **genişletilmez**. Canlı destek izni korunur |
| Analitik izni verildi | gtag.js yüklenir. `ad_storage`, `ad_user_data`, `ad_personalization` **denied**; Google Signals ve reklam kişiselleştirmesi kapalı |
| İzin geri alındı | `_ga`, `_ga_<ID>`, `ozmi_kaynak` silinir, sayfa yenilenir |

Tarayıcıda doğrulandı (7 Ekim 2026, Chrome, istekler yakalandı): izinsiz ve v1
onayla Google'a sıfır istek; e-postalı eski sipariş bağlantısında (`?e=`)
`page_location` temiz.

Kaynak: `lib/consent-format.ts` (biçim ve sürüm), `components/analytics/AnalyticsLoader.tsx`.

## Öğe sözleşmesi (vitrin ve API aynı)

| Alan | Değer |
|---|---|
| `item_id` | **ana ürün** kimliği (string). Kartta SKU olmadığı için varyant ayrı alanda |
| `item_name` | ürün adı |
| `item_variant` | varyant etiketi (ör. "Siyah / Küçük") |
| `item_brand`, `item_category` | marka, kategori adı |
| `price` | KDV dahil birim fiyat |
| `quantity` | adet |

Olay düzeyi: `currency: 'TRY'`; `value` = Σ(fiyat × adet) − kupon indirimi,
**kargo hariç**; `shipping` ayrı; `transaction_id` = sipariş numarası.

## Olaylar

| Olay | Nerede tetiklenir | Not |
|---|---|---|
| `page_view` | her gezinmede (`PageViews`) | `page_location`/`page_referrer` **temizlenmiş** adresle; sonraki tüm olaylar da bu adresi taşır |
| `view_item_list` | kategori, marka, koleksiyon, arama, ana sayfa grupları | liste kimliği: yol ya da `anasayfa:<grup kodu>` |
| `select_item` | listedeki ürün bağlantısına tıklama | tek delegeli dinleyici |
| `view_item` | ürün açılınca ve varyant değişince | ürün+varyant kimliğine bağlı; sepete eklemedeki yenileme tekrar saymaz |
| `add_to_cart` / `remove_from_cart` | sepet API'si **başarıyla** döndükten sonra | sunucu aksiyonu `ozmi_olay` çerezine yazar (yalnız izin varsa), `CartDock` gönderir ve siler. Stok hatasında olay yok |
| `view_cart` | sepet sayfası | |
| `begin_checkout` | ödeme sayfası | |
| `add_shipping_info`, `add_payment_info` | ödeme formu **gönderilirken** | NİYET: sipariş başarısız olabilir |
| `search` | arama sonucu | `search_term` 60 karakter, e-posta/telefon temizlenmiş |
| `newsletter_signup` | bülten formu başarısı | `status: 'pending'`: çift onay bekliyor, onaylanmış abone değil |
| `whatsapp_click` | ürün sayfası ve destek balonu | **lead**, satış değil. Telefon ve mesaj metni gönderilmez |
| `purchase` | **API**, tahsilat doğrulanınca | aşağıya bakın |
| `refund` | **API**, başarılı iadede | aşağıya bakın |

## Satın alma ve iade (sunucudan, D15)

`purchase` tarayıcıdan **gönderilmez**: kart sonucu sunucudan sunucuya gelir,
havale günler sonra panelde tahsil edilir, iade yalnız panelde yapılır.

- **Ne zaman:** sipariş ödemesi `paid` olunca ve sipariş kapanmamışsa. Kart =
  sağlayıcı bildirimi; havale = tam tahsilat (eksik tahsilat satış değil).
  Kapanmış siparişe geç gelen ödeme satış sayılmaz.
- **Tekillik:** `analytics_events.dedup_key` (`purchase:<sipariş id>`) tekil; olay
  satışın transaction'ında ve sipariş kilidi altında yazılır. Çift bildirim,
  yenileme, iki cihaz ikinci olay üretemez.
- **İzin:** GA istemci kimliği siparişe yalnız analitik izni varsa yazılır
  (`orders.attribution.ga`). Yoksa olay `skipped / no_consent` — gönderilmez.
- **Gönderim:** `api/services/analytics-dispatch.js`, Measurement Protocol,
  `timestamp_micros` = olay anı (72 saatten eskisi `skipped / stale`).
- **İade:** her başarılı iade bir `refund` (`refund:<iade id>`); toplam iade
  sipariş tutarına ulaşınca `refund_type: 'full'`. İadesiz iptal olay üretmez.
- Panel › Sipariş › "Kanal ve kaynak" kartı olayların durumunu gösterir.

GA4 sipariş sayısı API'deki sipariş sayısına **eşit olmaz**: izin vermeyen
müşterinin satışı gönderilmez. Satış raporu için esas kayıt API'dir.

## Kampanya kaynağı (D16)

`ozmi_kaynak` çerezi (30 gün, yalnız analitik izniyle): ilk temas (`f`, süre
dolana kadar değişmez) ve son temas (`l`). UTM varsa kampanya; yoksa dış site
yönlendirmesi (yalnız alan adı). Kendi sitemiz ve `paytr.com` kaynak sayılmaz.
Değerler küçük harf/uzunluk/e-posta-telefon temizliğinden geçer; API siparişe
yazmadan önce yeniden temizler (`utils/attribution.js`). gclid yakalanmaz
(reklam kategorisi yok).

## GA4 yönetim ayarları (yayın öncesi)

1. **Ayrı property:** Production için bir, test/önizleme için ayrı bir ölçüm
   kimliği. `NEXT_PUBLIC_GA_ID` yalnız Vercel Production ortamında canlı kimlik.
2. **Enhanced Measurement:** "Tarayıcı geçmişi olaylarına göre sayfa değişiklikleri"
   **KAPALI** (sayfa görüntüleme kodda; açık kalırsa çift sayılır). Form
   etkileşimleri ve site içi arama KAPALI (form ve arama terimi kodda temizlenerek
   gönderiliyor).
3. **İstenmeyen yönlendirmeler:** yalnız `paytr.com`. 3DS testinde görülen banka
   alanları tek tek eklenir; toplu hariç tutma yok.
4. **İç trafik:** ofis IP kuralı + `traffic_type = internal` veri filtresi.
   Ekip tarayıcısı `/?_ic=1` ile işaretlenir (`/?_ic=0` kaldırır).
5. **Anahtar olay:** `purchase`. (`newsletter_signup`, `whatsapp_click` karar
   bekliyor.)
6. **Veri saklama:** 2 ay (varsayılan); uzatma hukuk kararıyla.
7. **Measurement Protocol API gizli anahtarı:** Yönetici › Veri akışları › akış ›
   Measurement Protocol → API'de `GA4_MEASUREMENT_ID` + `GA4_API_SECRET`.
   `GA4_DEBUG=1` doğrulama ucuna gönderir (rapora girmez).

## Hukuk kapısı

GA'yı açmadan ÖNCE çerez politikası yeni sürümle yayınlanmalı (Panel ›
Sayfalar › Çerez politikası → "Yayınla…"): `_ga`, `_ga_<ID>`, `ozmi_kaynak`,
süreleri, amacı ve Google'a (yurt dışı) aktarım.

**Kararlar (7 Ekim 2026, işletme):** KVKK yurt dışı aktarım metni ve dayanağı
onaylandı; izin vermeyen müşterinin satışı GA4'e hiç gönderilmez (`skipped /
no_consent`) — sunucu tarafında rastgele kimlik uydurulmaz.
