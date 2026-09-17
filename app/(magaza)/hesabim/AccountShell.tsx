import Container from '@/components/Container';
import { requireCustomer } from '@/lib/session';
import AccountNav from './AccountNav';

/**
 * Hesabım kabuğu. Yerleşim değil BİLEŞEN: her segment bunu kendi içinde
 * çağırıyor.
 *
 * Neden layout.tsx değil: oturum okuması yerleşimin tepesinde yapılırsa
 * {children} — yani tüm hesap alanı — istek zamanına takılır ve statik kabuk
 * kaybolur. Segment içinde çağrılınca her sayfa kendi Suspense sınırını kurar.
 */
export default async function AccountShell({
    active, title, description, children, action,
}: {
    active: string;
    title: string;
    description?: string;
    children: React.ReactNode;
    action?: React.ReactNode;
}) {
    const customer = await requireCustomer();

    return (
        <Container className="pt-[clamp(18px,3vw,30px)]">
            <header className="block-dark-soft p-[clamp(22px,3vw,36px)]">
                <span className="kicker text-on-dark-berry">Hesabım</span>
                <h1 className="heading-1 mt-2.5 text-on-dark">Merhaba, {customer.firstname}</h1>
                <p className="mt-2 text-[13.5px] text-on-dark/55">{customer.email}</p>
            </header>

            <div className="mt-5 flex flex-wrap items-start gap-[clamp(14px,2vw,26px)]">
                <aside className="min-w-0 flex-[1_1_200px] lg:sticky lg:top-36 lg:max-w-[255px]">
                    <AccountNav active={active} />
                </aside>

                <div className="min-w-0 flex-[999_1_460px]">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h2 className="heading-2">{title}</h2>
                            {description && <p className="mt-1.5 text-[13.5px] text-slate-600">{description}</p>}
                        </div>
                        {action}
                    </div>
                    {children}
                </div>
            </div>
        </Container>
    );
}
