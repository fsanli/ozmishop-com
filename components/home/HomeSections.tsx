import { getGroupByCode } from '@/lib/api';
import type { HomeSection, ProductCard, ProductGroup } from '@/lib/types';
import BannerBlock from './BannerBlock';
import BrandStrip from './BrandStrip';
import CategoryGrid from './CategoryGrid';
import GuidePromo from './GuidePromo';
import HeroSlider from './HeroSlider';
import ProductGroupSection from './ProductGroupSection';
import SectionShell from './SectionShell';
import TrustStrip, { type TrustItem } from './TrustStrip';

type GroupSettings = { groupCode?: string; limit?: number; skipShown?: boolean };

/**
 * Ürün grubu bloklarının ürünleri, SAYFADAKİ SIRAYLA. Gruplar paralel çekilir
 * (her biri kendi önbelleğiyle); "tekrarlama" açık blokta üstteki bölümlerde
 * zaten görünen ürünler ayıklanır ve yerlerine grubun sıradakiler gelir — bu
 * yüzden o bloklar biraz fazla ister.
 */
async function resolveGroups(sections: HomeSection[]) {
    const blocks = sections
        .filter((section) => section.type === 'product_group')
        .map((section) => {
            const settings = section.settings as GroupSettings;
            const limit = settings.limit ?? 8;
            return {
                id: section.id,
                code: section.group?.code ?? settings.groupCode,
                limit,
                skipShown: settings.skipShown === true,
                fetchLimit: settings.skipShown ? Math.min(24, limit * 2) : limit,
            };
        });
    const groups = await Promise.all(blocks.map((block) => (block.code ? getGroupByCode(block.code, block.fetchLimit) : null)));

    const shown = new Set<number>();
    const resolved = new Map<number, { group: ProductGroup | null; products: ProductCard[] }>();
    blocks.forEach((block, index) => {
        const group = groups[index];
        const items = (group?.items ?? []).filter((product) => !block.skipShown || !shown.has(product.id)).slice(0, block.limit);
        items.forEach((product) => shown.add(product.id));
        resolved.set(block.id, { group, products: items });
    });
    return resolved;
}

/**
 * Panelden yönetilen anasayfa düzeni. Bilinmeyen bir tip `null` döner: panel yeni
 * bir bölüm tipi eklediğinde eski storefront çökmez, o bloğu atlar.
 */
export default async function HomeSections({ sections }: { sections: HomeSection[] }) {
    const groups = await resolveGroups(sections);
    return (
        <>
            {sections.map((section, index) => {
                const settings = section.settings as {
                    columns?: number;
                    groupCode?: string;
                    limit?: number;
                    layout?: 'carousel' | 'grid';
                    html?: string;
                    items?: TrustItem[];
                    headline?: string;
                    body?: string;
                    buttonText?: string;
                };

                switch (section.type) {
                    case 'hero_slider':
                        return <HeroSlider key={section.id} banners={section.banners ?? []} />;

                    case 'banner':
                        return <BannerBlock key={section.id} banners={section.banners ?? []} />;

                    case 'banner_grid':
                        return <BannerBlock key={section.id} banners={section.banners ?? []} columns={settings.columns ?? 3} />;

                    case 'category_grid':
                        return (
                            <CategoryGrid
                                key={section.id}
                                categories={section.categories ?? []}
                                title={section.title}
                                subtitle={section.subtitle}
                            />
                        );

                    case 'brand_strip':
                        return <BrandStrip key={section.id} brands={section.brands ?? []} title={section.title} />;

                    case 'product_group': {
                        const resolved = groups.get(section.id);
                        if (!resolved) return null;
                        return (
                            <ProductGroupSection
                                key={section.id}
                                group={resolved.group}
                                products={resolved.products}
                                title={section.title}
                                subtitle={section.subtitle}
                                limit={settings.limit ?? 8}
                                layout={settings.layout ?? 'carousel'}
                                priority={index <= 2}
                            />
                        );
                    }

                    case 'trust_strip':
                        return <TrustStrip key={section.id} items={settings.items} />;

                    case 'guide_promo':
                        return (
                            <GuidePromo
                                key={section.id}
                                headline={settings.headline}
                                body={settings.body}
                                buttonText={settings.buttonText}
                            />
                        );

                    case 'html':
                        if (!settings.html) return null;
                        return (
                            <SectionShell key={section.id} title={section.title} subtitle={section.subtitle}>
                                <div className="card prose-content p-5 sm:p-6" dangerouslySetInnerHTML={{ __html: settings.html }} />
                            </SectionShell>
                        );

                    default:
                        return null;
                }
            })}
        </>
    );
}
