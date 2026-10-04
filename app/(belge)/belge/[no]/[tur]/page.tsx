import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import PrintButton from '@/components/legal/PrintButton';
import { getOrderDocument } from '@/lib/cart';
import { routes } from '@/lib/site';

export const metadata: Metadata = {
    title: 'Sipariş belgesi',
    robots: { index: false, follow: false },
    // Adreste müşterinin e-postası var: başka siteye gidilen bağlantıda sızmasın.
    referrer: 'no-referrer',
};

const KINDS = ['on-bilgilendirme', 'mesafeli-satis'];

async function DocumentView({
    params, searchParams,
}: {
    params: Promise<{ no: string; tur: string }>;
    searchParams: Promise<{ e?: string }>;
}) {
    const [{ no, tur }, { e }] = await Promise.all([params, searchParams]);
    const document = KINDS.includes(tur) ? await getOrderDocument(decodeURIComponent(no), tur, e) : null;

    if (!document) {
        return (
            <div className="mx-auto max-w-[520px] p-8 text-center">
                <h1 className="heading-3">Belge bulunamadı</h1>
                <p className="mt-3 text-[14px] text-slate-600">
                    Bağlantı eksik ya da belge bu siparişe ait değil. Sipariş e-postandaki bağlantıyı kullanabilir ya da
                    hesabından siparişine ulaşabilirsin.
                </p>
                <Link href={routes.home} className="btn-secondary mt-5">Mağazaya dön</Link>
            </div>
        );
    }

    const other = tur === 'on-bilgilendirme' ? 'mesafeli-satis' : 'on-bilgilendirme';
    const accepted = new Date(document.acceptedAt).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Istanbul' });

    return (
        <article className="mx-auto max-w-[820px] px-5 py-8 print:p-0">
            <header className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-slate-900/10 pb-4">
                <div>
                    <h1 className="heading-2">{document.title}</h1>
                    <p className="mt-1.5 text-[13px] text-slate-600">
                        Sipariş {document.orderNumber} · Onay tarihi {accepted}
                        {document.version ? ` · Metin sürümü ${document.version}` : ''}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 print:hidden">
                    <PrintButton />
                    <Link href={`/belge/${document.orderNumber}/${other}${e ? `?e=${encodeURIComponent(e)}` : ''}`} className="btn-soft btn-sm">
                        {other === 'mesafeli-satis' ? 'Mesafeli satış sözleşmesi' : 'Ön bilgilendirme formu'}
                    </Link>
                </div>
            </header>
            {document.isDraft && (
                <p className="mb-4 rounded-[var(--radius-md)] bg-amber-tint px-4 py-3 text-[13px] font-semibold text-amber-ink">
                    Bu sipariş verildiğinde metin taslak durumdaydı.
                </p>
            )}
            {/* İçerik sipariş anında DONDURULMUŞ kopya; değerler API'de kaçırıldı. */}
            <div className="prose-content text-[14.5px]" dangerouslySetInnerHTML={{ __html: document.html }} />
        </article>
    );
}

export default function OrderDocumentPage(props: {
    params: Promise<{ no: string; tur: string }>;
    searchParams: Promise<{ e?: string }>;
}) {
    return (
        <Suspense fallback={<div className="mx-auto h-96 max-w-[820px] animate-pulse rounded-[var(--radius-xl)] bg-slate-100" />}>
            <DocumentView {...props} />
        </Suspense>
    );
}
