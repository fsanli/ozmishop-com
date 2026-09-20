/**
 * "Az önce ne oldu" bayrağı — sunucu aksiyonu yazar, istemci okur ve siler.
 *
 * AYRI DOSYA çünkü `lib/session.ts` `server-only` işaretli: oradan bir sabit
 * almak, istemci paketine sunucu kodu sokmaya çalışmak demek ve derleme patlar.
 * Burada yalnızca iki sabit var, ikisinin de sırrı yok.
 *
 * Neden çerez, neden adres parametresi DEĞİL: aksiyon `redirect()` ile
 * dönseydi tarayıcı gezinme yapar ve SAYFA BAŞA KAYARDI — mobilde ürünü
 * inceleyip "Sepete ekle"ye basan kullanıcı tepeye fırlıyordu.
 *
 * httpOnly DEĞİL: toast basıldıktan sonra istemci kendisi siliyor, yoksa
 * sonraki gezinmede tekrar çıkardı.
 */
export const FLASH_COOKIE = 'ozmi_flash';

/** Kısa: yalnız bir sonraki render'a yetişmesi gerekiyor. */
export const FLASH_MAX_AGE = 15;
