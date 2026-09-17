import { cacheLife, cacheTag } from 'next/cache';
import Link from 'next/link';
import Container from '@/components/Container';
import Logo from '@/components/Logo';
import { getPages } from '@/lib/api';
import { FOOTER_HELP_SLUGS, routes, site } from '@/lib/site';

/**
 * Alt bilgi. Önbelleklenir: içeriğin tamamı panelden yönetilen veriden gelir ve
 * telif yılı için `new Date()` çağrılır — Cache Components'ta deterministik
 * olmayan çağrılar ya istek zamanına ertelenmeli ya da önbelleklenmelidir.
 * Yıl için önbelleklemek doğrusu: herkes aynı değeri görür, yıl dönümünde tazelenir.
 */
export default async function Footer({ showRatingBadges = false }: { showRatingBadges?: boolean }) {
    'use cache';
    cacheTag('pages');
    cacheLife('days');

    const pages = await getPages();
    const help = FOOTER_HELP_SLUGS
        .map((slug) => pages.find((page) => page.slug === slug))
        .filter((page): page is NonNullable<typeof page> => Boolean(page));
    const corporate = pages.filter((page) => !FOOTER_HELP_SLUGS.includes(page.slug));

    const columns = [
        {
            heading: 'Alışveriş',
            links: [
                { href: routes.brands, label: 'Tüm markalar' },
                { href: routes.group('firsat-urunleri'), label: 'Fırsat ürünleri' },
                { href: routes.group('yeni-gelenler'), label: 'Yeni gelenler' },
                { href: routes.guide, label: 'Başlangıç rehberi' },
                { href: routes.journal, label: 'Günlük' },
            ],
        },
        { heading: 'Yardım', links: help.map((page) => ({ href: routes.page(page.slug), label: page.title })) },
        { heading: 'Kurumsal', links: corporate.map((page) => ({ href: routes.page(page.slug), label: page.title })) },
    ].filter((column) => column.links.length > 0);

    return (
        <footer className="mt-[clamp(40px,6vw,88px)] bg-ink-block text-on-dark">
            <Container className="grid gap-[clamp(20px,3vw,40px)] py-[clamp(32px,4.5vw,58px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,158px),1fr))]">
                <div>
                    <Logo onDark className="text-[22px]" href={null} />
                    <p className="mt-3 max-w-[34ch] text-[13px] leading-relaxed text-on-dark/55">{site.description}</p>
                    {showRatingBadges && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="badge border border-on-dark/22 text-on-dark/85">18+</span>
                            <span className="badge border border-on-dark/22 text-on-dark/85">RTA etiketli</span>
                        </div>
                    )}
                </div>

                {columns.map((column) => (
                    <div key={column.heading}>
                        <h2 className="text-[12px] font-bold uppercase tracking-[0.05em] text-on-dark/45">{column.heading}</h2>
                        <ul className="mt-3.5 space-y-2">
                            {column.links.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-[13.5px] text-on-dark/72 transition-colors hover:text-on-dark-berry">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </Container>

            <div className="border-t border-on-dark/10">
                <Container className="flex flex-wrap items-center justify-between gap-2 py-4 text-[11.5px] text-on-dark/42">
                    <p>© {new Date().getFullYear()} {site.name}. Tüm hakları saklıdır.</p>
                    <p>Bu site yalnızca 18 yaşından büyükler içindir.</p>
                </Container>
            </div>
        </footer>
    );
}
