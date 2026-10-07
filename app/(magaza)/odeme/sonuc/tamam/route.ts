import { redirect } from 'next/navigation';
import { finishAttempt, getAttempt, isAttemptId } from '@/lib/cart';
import { routes } from '@/lib/site';

/**
 * Onaylanmış kart denemesinden sipariş sayfasına geçiş.
 *
 * Neden ayrı bir uç: sipariş erişim çerezi ve sepetin kapanması çerez YAZMAK
 * demek ve Next.js buna sayfa render'ında izin vermez. İframe sayfası ya da
 * ödeme formu denemeyi onaylanmış bulursa buraya yönlendirir; çerez burada
 * yazılır, sonra sipariş sayfasına geçilir.
 *
 * Karar yine API'deki deneme durumundan: adres "tamam" dese de deneme
 * onaylanmamışsa sipariş çerezi yazılmaz.
 */
export async function GET(request: Request) {
    const attemptId = new URL(request.url).searchParams.get('a');
    if (!isAttemptId(attemptId)) redirect(routes.home);

    const attempt = await getAttempt(attemptId);
    if (!attempt) redirect(routes.home);
    if (attempt.status === 'succeeded' && attempt.orderNumber) {
        await finishAttempt(attempt);
        redirect(routes.order(attempt.orderNumber));
    }
    if (attempt.failure) redirect(routes.checkoutRetry(attemptId));
    redirect(routes.paymentPending(attemptId));
}
