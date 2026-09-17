import Container from '@/components/Container';
import PanicExit from './PanicExit';

/** Header'ın üstündeki koyu şerit: üç söz + hızlı çıkış. */
const PROMISES = [
    { label: 'Gizli paketleme', dot: 'bg-on-dark-berry' },
    { label: 'Aynı gün kargo', dot: 'bg-on-dark-amber' },
    { label: '3D Secure ödeme', dot: 'bg-on-dark-teal' },
] as const;

export default function UtilityBar() {
    return (
        <div className="bg-ink-block text-on-dark">
            <Container className="flex min-h-10 flex-wrap items-center gap-x-5 gap-y-1 py-1.5 text-[12px]">
                {PROMISES.map((promise) => (
                    <span key={promise.label} className="inline-flex items-center gap-2">
                        <span className={`dot ${promise.dot}`} />
                        {promise.label}
                    </span>
                ))}
                <PanicExit className="ml-auto" />
            </Container>
        </div>
    );
}
