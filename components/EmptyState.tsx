export default function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
    return (
        <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
            <h2 className="heading-3">{title}</h2>
            {description && <p className="max-w-md text-sm text-slate-500">{description}</p>}
            {action && <div className="mt-3">{action}</div>}
        </div>
    );
}
