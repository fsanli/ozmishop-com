import Link from 'next/link';
import SubmitButton from '@/components/form/SubmitButton';
import { one, type SearchParams } from '@/lib/listing';
import { routes } from '@/lib/site';

const CARD = 'card card-xl mx-auto max-w-[480px] p-[clamp(24px,3.4vw,40px)]';

type Copy = { kicker: string; title: string; body: string; button: string; done: string; failed: string };

/**
 * Bülten onayı ve çıkışının ortak kartı. İşlem bağlantıyı AÇMAKLA değil
 * butona BASMAKLA yapılır: e-posta güvenlik tarayıcıları bağlantıları önceden
 * açtığı için GET'te iş yapmak "kimse basmadan onaylandı" demek olurdu.
 */
export default async function TokenActionPanel({
    searchParams, action, copy,
}: {
    searchParams: Promise<SearchParams>;
    action: (formData: FormData) => Promise<void>;
    copy: Copy;
}) {
    const params = await searchParams;
    const token = one(params.t) ?? '';
    const status = one(params.durum);

    if (status === 'ok') {
        return (
            <div className={CARD}>
                <span className="kicker text-accent-500">{copy.kicker}</span>
                <h1 className="heading-2 mt-2.5">{copy.done}</h1>
                <Link href={routes.journal} className="btn-secondary mt-6 w-full justify-center">Günlük&apos;e dön</Link>
            </div>
        );
    }

    return (
        <div className={CARD}>
            <span className="kicker text-accent-500">{copy.kicker}</span>
            <h1 className="heading-2 mt-2.5">{copy.title}</h1>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-600">{copy.body}</p>
            {status === 'hata' && (
                <p role="alert" className="mt-4 rounded-[var(--radius-md)] bg-accent-200 px-4 py-3 text-[13.5px] font-semibold text-accent-500">
                    {copy.failed}
                </p>
            )}
            {token ? (
                <form action={action} className="mt-6">
                    <input type="hidden" name="t" value={token} />
                    <SubmitButton className="btn-primary min-h-[52px] w-full justify-center rounded-[14px]" pendingLabel="İşleniyor…">
                        {copy.button}
                    </SubmitButton>
                </form>
            ) : (
                <p role="alert" className="mt-4 text-[13.5px] font-semibold text-accent-500">Bağlantı eksik. E-postadaki bağlantıyı yeniden aç.</p>
            )}
        </div>
    );
}

export const CARD_SKELETON = <div className={`${CARD} h-[300px] animate-pulse`} />;
