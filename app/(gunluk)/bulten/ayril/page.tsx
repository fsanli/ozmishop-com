import type { Metadata } from 'next';
import { Suspense } from 'react';
import Container from '@/components/Container';
import type { SearchParams } from '@/lib/listing';
import { unsubscribeNewsletterAction } from '../../gunluk/actions';
import TokenActionPanel, { CARD_SKELETON } from '../TokenActionPanel';

export const metadata: Metadata = {
    title: 'Bültenden ayrıl',
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
};

export default function NewsletterLeavePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    return (
        <Container className="py-[clamp(28px,5vw,60px)]">
            <Suspense fallback={CARD_SKELETON}>
                <TokenActionPanel
                    searchParams={searchParams}
                    action={unsubscribeNewsletterAction}
                    copy={{
                        kicker: 'Günlük bülteni',
                        title: 'Bültenden ayrıl',
                        body: 'Ayrılırsan bu adrese bülten göndermeyiz. Sipariş ve hesap e-postaları bundan etkilenmez.',
                        button: 'Bültenden ayrıl',
                        done: 'Bültenden ayrıldın. Bu adrese artık bülten göndermeyeceğiz.',
                        failed: 'Bağlantı geçersiz. E-postadaki bağlantıyı yeniden açmayı dene.',
                    }}
                />
            </Suspense>
        </Container>
    );
}
