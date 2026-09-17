import Container from '@/components/Container';

/**
 * Hesabım iskeleti.
 *
 * Buradaki `loading.tsx` bilinçli bir istisna: site genelinde kural "sayfa
 * içinde açık <Suspense>", çünkü loading.tsx tüm segmenti örtük Suspense'e alıp
 * prerender edilebilecek statik kabuğu da erteler. Hesabım'da ertelenecek statik
 * kabuk YOK — her baytı oturuma bağlı. Bu yüzden segmentin tamamını tek sınırın
 * arkasına almak hem doğru hem de build'in kabuğu prerender edebilmesini sağlar.
 */
export default function AccountLoading() {
    return (
        <Container className="pt-[clamp(18px,3vw,30px)]">
            <div className="block-dark-soft p-[clamp(22px,3vw,36px)]">
                <div className="h-3 w-20 animate-pulse rounded bg-on-dark/15" />
                <div className="mt-3.5 h-8 w-64 max-w-full animate-pulse rounded bg-on-dark/15" />
                <div className="mt-3 h-3 w-44 animate-pulse rounded bg-on-dark/10" />
            </div>

            <div className="mt-5 flex flex-wrap items-start gap-[clamp(14px,2vw,26px)]">
                <div className="card card-xl min-w-0 flex-[1_1_200px] space-y-1 p-3 lg:max-w-[255px]">
                    {Array.from({ length: 9 }).map((_, index) => (
                        <div key={index} className="h-10 animate-pulse rounded-[var(--radius-md)] bg-slate-100" />
                    ))}
                </div>

                <div className="min-w-0 flex-[999_1_460px]">
                    <div className="mb-4 h-7 w-52 animate-pulse rounded bg-slate-100" />
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="card h-28 animate-pulse bg-slate-100" />
                        ))}
                    </div>
                </div>
            </div>
        </Container>
    );
}
