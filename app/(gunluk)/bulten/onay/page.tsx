import type { Metadata } from 'next';
import { Suspense } from 'react';
import Container from '@/components/Container';
import type { SearchParams } from '@/lib/listing';
import { confirmNewsletterAction } from '../../gunluk/actions';
import TokenActionPanel, { CARD_SKELETON } from '../TokenActionPanel';

export const metadata: Metadata = {
    title: 'Bülten kaydını onayla',
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
};

export default function NewsletterConfirmPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    return (
        <Container className="py-[clamp(28px,5vw,60px)]">
            <Suspense fallback={CARD_SKELETON}>
                <TokenActionPanel
                    searchParams={searchParams}
                    action={confirmNewsletterAction}
                    copy={{
                        kicker: 'Günlük bülteni',
                        title: 'Kaydını onayla',
                        body: 'Bu adrese ayda bir Günlük e-postası göndermemiz için onayın gerekiyor. Konu satırı her zaman nötrdür.',
                        button: 'Kaydımı onayla',
                        done: 'Kaydın tamamlandı. İlk yazıyı ayın başında göndeririz.',
                        failed: 'Bağlantı geçersiz ya da süresi dolmuş. Bülten formundan yeniden kaydolabilirsin.',
                    }}
                />
            </Suspense>
        </Container>
    );
}
