import { permanentRedirect, redirect } from 'next/navigation';
import { resolveRedirect } from './api';

/**
 * Ürün/kategori adı değişince slug de değişir. 404 vermeden önce slug geçmişine
 * bakılır ve eski adres 308 ile yenisine yönlendirilir — Google sıralaması kaybolmasın.
 */
export async function redirectIfMoved(path: string): Promise<void> {
    try {
        const result = await resolveRedirect(path);
        if (!result.redirect) return;
        if (result.redirect === path) return;
        permanentRedirect(result.redirect);
    } catch (error) {
        // redirect() içeride bir hata fırlatarak çalışır; onu yutmamak gerekir.
        if (error && typeof error === 'object' && 'digest' in error) throw error;
        // API'ye ulaşılamadıysa yönlendirme yapılamaz; sayfa normal 404'e düşer.
    }
}

export { redirect };
