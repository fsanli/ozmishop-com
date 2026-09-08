/** Liste akarken gösterilen iskelet; statik kabuğun parçasıdır. */
export default function ListingSkeleton() {
    return (
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <div className="card hidden h-96 animate-pulse bg-slate-100 lg:block" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="card overflow-hidden">
                        <div className="aspect-square animate-pulse bg-slate-100" />
                        <div className="space-y-2 p-3">
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
