import type { HomeSection } from '@/lib/types';
import BannerBlock from './BannerBlock';
import BrandStrip from './BrandStrip';
import CategoryGrid from './CategoryGrid';
import HeroSlider from './HeroSlider';
import ProductGroupSection from './ProductGroupSection';
import SectionShell from './SectionShell';

/**
 * Panelden yönetilen anasayfa düzeni. Bilinmeyen bir tip `null` döner: panel yeni
 * bir bölüm tipi eklediğinde eski storefront çökmez, o bloğu atlar.
 */
export default function HomeSections({ sections }: { sections: HomeSection[] }) {
    return (
        <>
            {sections.map((section, index) => {
                const settings = section.settings as { columns?: number; groupCode?: string; limit?: number; layout?: 'carousel' | 'grid'; html?: string };

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
                        const code = section.group?.code ?? settings.groupCode;
                        if (!code) return null;
                        return (
                            <ProductGroupSection
                                key={section.id}
                                code={code}
                                title={section.title}
                                subtitle={section.subtitle}
                                limit={settings.limit ?? 8}
                                layout={settings.layout ?? 'carousel'}
                                priority={index <= 2}
                            />
                        );
                    }

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
