'use client';

import SegmentError from '@/components/errors/SegmentError';

/**
 * Sayfa gövdesinin hata sınırı. Bu segmentin layout'unu (header/footer)
 * KAPSAMAZ — onlar `'use cache'` ile önbellekte; API kesintisinde Next son
 * sağlam sürümü sunmaya devam eder. Hata yutulup boş bir header önbelleğe
 * yazılsaydı kesinti geçtikten sonra da günlerce kalırdı.
 */
export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
    return <SegmentError retry={retry} />;
}
