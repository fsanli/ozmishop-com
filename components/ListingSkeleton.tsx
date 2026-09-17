/** Liste akarken gösterilen iskelet; statik kabuğun parçasıdır. */
export default function ListingSkeleton() {
    return (
        <div className="flex flex-wrap items-start gap-[clamp(14px,2vw,24px)]">
            <div className="card card-xl hidden h-96 flex-[1_1_220px] animate-pulse bg-slate-100 lg:block lg:max-w-[275px]" />
            <div className="grid min-w-0 flex-[999_1_460px] gap-[clamp(10px,1.4vw,16px)] [grid-template-columns:repeat(auto-fill,minmax(min(50%-6px,205px),1fr))]">
                {Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="card overflow-hidden">
                        <div className="aspect-square animate-pulse bg-slate-100" />
                        <div className="space-y-2 px-[15px] pb-4 pt-[13px]">
                            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
