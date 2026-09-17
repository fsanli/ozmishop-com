import type { Metadata } from 'next';
import Link from 'next/link';
import EmptyState from '@/components/EmptyState';
import { getMyAddresses } from '@/lib/account';
import { CATEGORY_COLOR, type ColorKey } from '@/lib/colors';
import { one, type SearchParams } from '@/lib/listing';
import { routes } from '@/lib/site';
import AccountShell from '../AccountShell';
import { deleteAddressAction } from '../actions';
import AddressForm from './AddressForm';

export const metadata: Metadata = { title: 'Adreslerim', robots: { index: false, follow: false } };

/** Kart kenarları sırayla renklenir — tasarımın üç renkli adres şeridi. */
const EDGE: ColorKey[] = ['plum', 'teal', 'amber', 'rose'];

export default async function AddressesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const [{ items }, params] = await Promise.all([getMyAddresses(), searchParams]);

    const error = one(params.hata);
    const editingId = Number(one(params.duzenle)) || null;
    const editing = editingId ? items.find((item) => item.id === editingId) : undefined;
    const showForm = Boolean(editing) || one(params.yeni) === '1' || items.length === 0;

    return (
        <AccountShell
            active={routes.addresses}
            title="Adreslerim"
            description={items.length ? `${items.length} kayıtlı adres` : undefined}
            action={!showForm && (
                <Link href={`${routes.addresses}?yeni=1`} className="btn-accent btn-sm">+ Yeni adres</Link>
            )}
        >
            {error && (
                <p role="alert" className="mb-4 rounded-[var(--radius-md)] bg-accent-200 px-4 py-3 text-[13.5px] font-semibold text-accent-500">
                    {error}
                </p>
            )}

            {showForm && items.length > 0 && <AddressForm address={editing} />}

            {items.length === 0 ? (
                <>
                    <EmptyState
                        where="Adresler"
                        color="plum"
                        title="Kayıtlı adresin yok"
                        description="Bir adres eklersen ödeme adımında tek tıkla seçebilirsin. Paket üzerinde ürün bilgisi yer almaz."
                    />
                    <div className="mt-4">
                        <AddressForm />
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,275px),1fr))] gap-3">
                    {items.map((address, index) => {
                        const colors = CATEGORY_COLOR[EDGE[index % EDGE.length]];
                        return (
                            <article key={address.id} className={`card card-edge-left ${colors.edgeLeft} flex flex-col gap-2 p-[18px_20px]`}>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <span className="text-[12px] font-bold">{address.title}</span>
                                    {address.isDefaultShipping && (
                                        <span className="rounded-full bg-slate-900 px-2.5 py-[3px] text-[10.5px] font-bold text-on-dark">
                                            Varsayılan
                                        </span>
                                    )}
                                </div>

                                <div className="text-[14px] font-bold tracking-[-0.015em]">
                                    {address.firstname} {address.lastname}
                                </div>

                                <p className="text-[13px] leading-relaxed text-slate-600">
                                    {address.addressLine}
                                    {address.neighbourhood && <>, {address.neighbourhood}</>}
                                    <br />
                                    {address.district} / {address.city}
                                    {address.postalCode && <> · {address.postalCode}</>}
                                    <br />
                                    {address.phone}
                                </p>

                                <div className="mt-auto flex items-center gap-3.5 pt-2 text-[12.5px] text-slate-600">
                                    <Link
                                        href={`${routes.addresses}?duzenle=${address.id}`}
                                        className="border-b border-slate-900/18 transition-colors hover:border-accent-500 hover:text-accent-500"
                                    >
                                        Düzenle
                                    </Link>
                                    <form action={deleteAddressAction}>
                                        <input type="hidden" name="id" value={address.id} />
                                        <button type="submit" className="cursor-pointer border-b border-slate-900/18 transition-colors hover:border-accent-500 hover:text-accent-500">
                                            Sil
                                        </button>
                                    </form>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </AccountShell>
    );
}
