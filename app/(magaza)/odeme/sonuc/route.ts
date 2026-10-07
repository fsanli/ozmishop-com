import { routes, site } from '@/lib/site';

const ORDER_NO = /^[A-Z0-9-]{6,40}$/;

/**
 * PayTR 3DS dönüşü (`merchant_ok_url` / `merchant_fail_url`). Ödemeyi
 * KESİNLEŞTİRMEZ: sonuç sunucudan sunucuya bildirimle API'ye gelir. Bu uç
 * yalnız tarayıcıyı sipariş sayfasına taşır; sayfa durumu API'den okur.
 *
 * Route handler, sayfa değil: PayTR form POST'uyla dönebilir. Siteler arası
 * POST'ta `SameSite=Lax` çerezler GİTMEZ; 303 isteği üst düzey bir GET'e
 * çevirir ve sipariş jetonu çerezi o istekte gelir. PayTR'nin gönderdiği
 * alanlar hiçbir sayfaya basılmaz.
 */
function handle(request: Request) {
    const url = new URL(request.url);
    const no = url.searchParams.get('no') ?? '';
    const outcome = url.searchParams.get('r') === 'ok' ? 'ok' : 'fail';
    const target = ORDER_NO.test(no) ? `${routes.order(no)}?odeme=${outcome}` : routes.home;
    return Response.redirect(`${site.url}${target}`, 303);
}

export const GET = handle;
export const POST = handle;
