<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Ürün aksiyonları (favori / sepet / WhatsApp)

`components/product/ProductActions.tsx` TEK kaynak. Ürün kartı, arama açılırı
ve eklenecek her liste onu kullanır; kopyalamayın. Sebep görsel tutarlılık
değil DAVRANIŞ tutarlılığı: varyantlı ürünün doğrudan sepete eklenememesi,
stoksuzun pasifleşmesi ve misafirin girişe yollanması üç ekranda da aynı olmalı.

Bileşende **`'use client'` yoktur ve olmamalıdır**: hem sunucu ağacından
(`ProductCard`) hem istemci ağacından (`SearchBar` açılırı) kullanılıyor.
Aynı sebeple **çerez okuyan hiçbir şey içine giremez** — istemci ağacına
düştüğünde derleme patlar. Dolu kalp `favoriteSlot` ile dışarıdan veriliyor:
sunucu tarafındaki çağıran `<Suspense><FavoriteState/></Suspense>` geçiyor,
istemci tarafındaki geçmiyor ve durumsuz kalbi alıyor.

Ölçüler `ACTION_SIZES` haritasından TAM SINIF ADI olarak geliyor. Tailwind v4
çalışma anında sınıf üretemez: `size-${n}` asla derlenmez.

Aksiyonlar `app/(magaza)/actions.ts`'te — sayfa segmentinde değil mağaza
grubunun kökünde, çünkü kartı basan onlarca sayfa var. `sepet/actions.ts`
sepet SAYFASININ aksiyonlarıdır, bunlar kartın.

`back` prop'u çağırandan gelir. Sunucu bileşeni bulunduğu yolu kendi
okuyamaz — okusa `headers()` çağırır ve sayfa statik kabuğunu kaybederdi.

## WhatsApp ve canlı destek

Bağlantılar `lib/whatsapp.ts`'te kurulur; numara ve mesaj kalıbı `/ayarlar`
> İletişim'den gelir. Numara boşsa buton HİÇ çizilmez — tıklanınca bir şey
yapmayan bir buton, butonsuzluktan kötü.

tawk.to ayarı **tam URL değil `property/widget` kimlik çifti** tutar ve desen
`SupportDock`'ta doğrulanır. Tam URL'e izin vermek, ayarları düzenleyebilen
herkese sayfaya istediği `<script src>`'i enjekte etme yetkisi vermek olurdu.

WhatsApp balonu SOLDA: tawk.to kendi balonunu sağ alta sabitliyor ve
yapılandırmayla taşınamıyor.

## Sepete ekleme geri bildirimi

Aksiyonlar `/sepet`e YÖNLENDİRMEZ. Sunucu aksiyonu bulunduğu adrese
`?sepet=eklendi` (ya da `?favori=…`, `?hata=…`) ekleyerek döner;
`components/cart/CartDock.tsx` bunu görüp toast basar ve masaüstünde sepet
çekmecesini açar. Adres üzerinden gitmesinin sebebi, aksiyonun dönüş
değerinin düz bir `<form action>`'da kaybolması.

Çekmecenin açık olması URL'den TÜRETİLİR, state'te tutulmaz: effect içinde
setState zincirleme render üretiyor ve React lint'i reddediyor.

`hydrated` kontrolü kaldırılmamalı. `isDesktop`in sunucu anlık görüntüsü
zorunlu olarak `false`; o ilk render'da temizlik effect'i çalışırsa bayrak
çekmece açılmadan silinir ve çekmece masaüstünde de hiç görünmez.

Çekmece içeriği `/api/sepet` vekilinden AÇILINCA çekilir. Yerleşimde sunucu
bileşeni olarak render etmek, hiç açılmayacak bir panel için her gezinmede
sepet isteği demekti.

## Telefon alanı

`lib/phone.ts` tek kaynak; maske, normalleştirme ve doğrulama oradan gelir ve
aynı kural HEM istemcide (`PhoneField`) HEM sunucu aksiyonlarında uygulanır —
JavaScript kapalıyken form yine gönderiliyor.

Her şey tek bir `toLocal()`'dan türer. Biçimlendirme ve doğrulama ayrı ayrı
rakam sayarsa tutarsız olurlar; `+90` soyulmazsa maskede numara sessizce
bozulur.
