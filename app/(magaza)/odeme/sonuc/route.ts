import { after } from 'next/server';
import { isAttemptId, sendAttemptEvent } from '@/lib/cart';
import { routes, site } from '@/lib/site';

const ORDER_NO = /^[A-Z0-9-]{6,40}$/;

/**
 * PayTR dönüşü (`merchant_ok_url` / `merchant_fail_url`):
 * `/odeme/sonuc?a=<denemeKimliği>&r=ok|fail`. Ödemeyi KESİNLEŞTİRMEZ: sonuç
 * sunucudan sunucuya bildirimle API'ye gelir. `r` yalnız panelin zaman
 * çizelgesi işaretidir; başka hiçbir karara girmez.
 *
 * PayTR bu adresi çoğunlukla iframe'in İÇİNDE açar (sahte sağlayıcının test
 * sayfası da öyle). Yönlendirme bu yüzden 303 değil küçük bir sayfa: betik
 * iframe'deyse üst pencereyi, değilse kendini "ödemen kontrol ediliyor"
 * ekranına taşır. Sayfa dış kaynak yüklemez.
 *
 * Route handler, sayfa değil: PayTR form POST'uyla da dönebilir. Siteler arası
 * POST'ta `SameSite=Lax` deneme çerezi GİTMEZ; o zaman işaret sessizce atlanır.
 * Bekleme ekranı aynı kökenden açıldığı için çerez orada yine gelir. PayTR'nin
 * gönderdiği alanlar hiçbir sayfaya basılmaz.
 *
 * `no` parametresi eski akış (sipariş önce açılırdı): o dönüşler hâlâ sipariş
 * sayfasına 303 ile gider.
 */
function handle(request: Request) {
    const url = new URL(request.url);

    const no = url.searchParams.get('no');
    if (no !== null) {
        const outcome = url.searchParams.get('r') === 'ok' ? 'ok' : 'fail';
        const target = ORDER_NO.test(no) ? `${routes.order(no)}?odeme=${outcome}` : routes.home;
        return Response.redirect(`${site.url}${target}`, 303);
    }

    const attemptId = url.searchParams.get('a');
    if (!isAttemptId(attemptId)) return Response.redirect(`${site.url}${routes.home}`, 303);

    // Yanıtı bekletmez; çerez yoksa (siteler arası POST) istek hiç atılmaz.
    const type = url.searchParams.get('r') === 'ok' ? 'return_ok' : 'return_fail';
    after(() => sendAttemptEvent(attemptId, type));

    const target = `${site.url}${routes.paymentPending(attemptId)}`;
    // Kimlik UUID deseninden geçti; yine de betiğe JSON olarak ve `<` kaçışlı girer.
    const targetJs = JSON.stringify(target).replace(/</g, '\\u003c');
    const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ödeme kontrol ediliyor</title>
</head>
<body style="font-family:system-ui,sans-serif;padding:24px;text-align:center;color:#334155">
<p>Ödemen kontrol ediliyor…</p>
<p><a href="${target}" target="_top">Devam et</a></p>
<script>
(function () {
  var target = ${targetJs};
  if (window.top !== window.self) window.top.location.href = target;
  else window.location.replace(target);
})();
</script>
</body>
</html>`;

    return new Response(html, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store',
        },
    });
}

export const GET = handle;
export const POST = handle;
