import { cacheLife, cacheTag } from 'next/cache';
import Link from 'next/link';
import Container from '@/components/Container';
import Logo from '@/components/Logo';
import CookiePreferencesButton from '@/components/consent/CookiePreferencesButton';
import { getMenu, getPagesGrouped, getSettings } from '@/lib/api';
import { routes, safeLink, site } from '@/lib/site';
import type { MenuTree } from '@/lib/types';

interface FooterLink { href: string; label: string; openInNew?: boolean }

/**
 * Panel › Ayarlar › Menüler'deki `footer-alisveris` / `footer-yardim` (S07).
 * Eskiden footer bu menüleri HİÇ okumuyordu: panelde eklenen bağlantılar
 * vitrine yansımıyordu. Sıra ve görünürlük API'den (gizli öğe gelmez), yeni
 * sekme ayarı burada uygulanır. Site dışına çıkan ya da yayımlanmamış bir
 * sayfaya giden öğe çizilmez — gizli sayfa footer'dan herkese açılmasın.
 */
const menuLinks = (menu: MenuTree | null, publishedSlugs: Set<string>): FooterLink[] => (menu?.items ?? [])
    .flatMap((item): FooterLink[] => {
        const href = safeLink(item.url);
        if (!href) return [];
        const page = /^\/sayfa\/([a-z0-9-]+)/.exec(href);
        if (page && !publishedSlugs.has(page[1])) return [];
        return [{ href, label: item.label, openInNew: item.openInNew }];
    });

/**
 * Alt bilgi. Önbelleklenir: içeriğin tamamı panelden yönetilen veriden gelir ve
 * telif yılı için `new Date()` çağrılır — Cache Components'ta deterministik
 * olmayan çağrılar ya istek zamanına ertelenmeli ya da önbelleklenmelidir.
 * Yıl için önbelleklemek doğrusu: herkes aynı değeri görür, yıl dönümünde tazelenir.
 */
export default async function Footer({ showRatingBadges = false }: { showRatingBadges?: boolean }) {
    'use cache';
    cacheTag('pages', 'settings');
    cacheLife('days');

    /*
     * Kolonlar SAYFA GRUBUNDAN üretiliyor, koddaki sabit slug listesinden
     * değil. Eskiden yeni bir sözleşme eklemek `FOOTER_HELP_SLUGS`'a satır
     * eklemek demekti — editör yeni sayfasının hangi kolona düşeceğini
     * seçemiyordu. Artık panelden seçiyor.
     */
    /* `groups ?? []`: `use cache` girdisi dağıtımdan SAĞ ÇIKABİLİYOR. API'ye
       `groups` eklendiğinde eski şekilli bir önbellek kaydı footer'ı çökertti
       (derlemede yakalandı). Alan yoksa yalnız "Alışveriş" kolonu çizilir;
       eksik bir kolon, çöken bir sayfadan iyidir. */
    const [{ items: pages, groups = [] }, settings, shopMenu, helpMenu] = await Promise.all([
        getPagesGrouped(),
        getSettings(),
        // Menü okunamazsa varsayılanlar çizilir; footer düşmez.
        getMenu('footer-alisveris').catch(() => null),
        getMenu('footer-yardim').catch(() => null),
    ]);
    const publishedSlugs = new Set(pages.map((page) => page.slug));
    const shopLinks = menuLinks(shopMenu, publishedSlugs);
    const helpLinks = menuLinks(helpMenu, publishedSlugs);
    // Satıcı künyesi: yalnız girilmiş alanlar (Ayarlar › Şirket bilgileri).
    const company = [
        settings['sirket.unvan'],
        settings['sirket.adres'],
        settings['sirket.mersis'] ? `MERSİS ${settings['sirket.mersis']}` : null,
        settings['sirket.telefon'],
        settings['sirket.eposta'],
    ].filter((part) => String(part ?? '').trim() !== '');
    const columns = groups
        .map((group) => ({
            heading: group.label,
            // Yardım kolonu panel menüsü doluysa onu, boşsa yardım sayfa grubunu
            // gösterir. Kök ürün kategorileri buraya HİÇ düşmez.
            links: group.key === 'yardim' && helpLinks.length > 0
                ? helpLinks
                : pages
                    .filter((page) => page.group === group.key)
                    .map((page): FooterLink => ({ href: routes.page(page.slug), label: page.title })),
        }))
        .filter((column) => column.links.length > 0);

    const allColumns: { heading: string; links: FooterLink[] }[] = [
        {
            heading: 'Alışveriş',
            // Menü boşken anlamlı varsayılan: Alışveriş'in kendi bağlantıları.
            links: shopLinks.length > 0 ? shopLinks : [
                { href: routes.brands, label: 'Tüm markalar' },
                { href: routes.group('firsat-urunleri'), label: 'Fırsat ürünleri' },
                { href: routes.group('yeni-gelenler'), label: 'Yeni gelenler' },
                { href: routes.guide, label: 'Başlangıç rehberi' },
                { href: routes.journal, label: 'Günlük' },
            ],
        },
        ...columns,
    ];

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

                {allColumns.map((column) => (
                    <div key={column.heading}>
                        <h2 className="text-[12px] font-bold uppercase tracking-[0.05em] text-on-dark/45">{column.heading}</h2>
                        <ul className="mt-3.5 space-y-2">
                            {column.links.map((link) => (
                                <li key={`${link.href}-${link.label}`}>
                                    <Link
                                        href={link.href}
                                        {...(link.openInNew ? { target: '_blank', rel: 'noreferrer' } : {})}
                                        className="text-[13.5px] text-on-dark/72 transition-colors hover:text-on-dark-berry"
                                    >
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
                    <p className="flex flex-wrap items-center gap-x-3">
                        <CookiePreferencesButton className="underline underline-offset-2 hover:text-on-dark" />
                        <span>Bu site yalnızca 18 yaşından büyükler içindir.</span>
                    </p>
                    {company.length > 0 && <p className="basis-full">{company.join(' · ')}</p>}
                </Container>
            </div>
        </footer>
    );
}
