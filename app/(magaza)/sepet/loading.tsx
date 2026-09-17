import Container from '@/components/Container';

/** Sepet uçtan uca istek zamanlı (çerez + canlı stok); ertelenecek statik kabuk yok. */
export default function CartLoading() {
    return (
        <Container className="pt-[clamp(18px,3vw,30px)]">
            <div className="h-8 w-48 animate-pulse rounded bg-slate-100" />
            <div className="mt-5 flex flex-wrap items-start gap-[clamp(14px,2vw,26px)]">
                <div className="min-w-0 flex-[999_1_460px] space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="card h-32 animate-pulse bg-slate-100" />
                    ))}
                </div>
                <div className="card card-xl min-w-0 flex-[1_1_280px] animate-pulse bg-slate-100 p-6 lg:max-w-[340px]">
                    <div className="h-52" />
                </div>
            </div>
        </Container>
    );
}
