import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import Container from '@/components/Container';
import PageSidebar from '@/components/page/PageSidebar';
import { getPage, getPages } from '@/lib/api';
import { redirectIfMoved } from '@/lib/redirects';
import { PLACEHOLDER_SLUG, routes, site } from '@/lib/site';

export async function generateStaticParams() {
    try {
        const pages = await getPages();
        const slugs = pages.map((page) => ({ slug: page.slug }));
        return slugs.length ? slugs : [{ slug: PLACEHOLDER_SLUG }];
    } catch {
        return [{ slug: PLACEHOLDER_SLUG }];
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const page = await getPage(slug);
    if (!page) return { title: 'Sayfa bulunamadı' };

    return {
        title: page.metaTitle || page.title,
        description: page.metaDescription || site.description,
        alternates: { canonical: routes.page(page.slug) },
        robots: page.isIndexable ? undefined : { index: false, follow: true },
    };
}

export default async function ContentPageView({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const page = await getPage(slug);

    if (!page) {
        await redirectIfMoved(routes.page(slug));
        notFound();
    }

    return (
        <Container className="py-[clamp(18px,3vw,30px)]">
            <Breadcrumb items={[{ name: page.title, href: routes.page(page.slug) }]} />

            <div className="mt-4 flex flex-wrap items-start gap-[clamp(16px,2.6vw,40px)] lg:flex-nowrap">
                <PageSidebar current={page.slug} />

                <div className="min-w-0 flex-1">
                    <h1 className="heading-1 mb-5">{page.title}</h1>
                    <div className="card prose-content p-5 sm:p-8" dangerouslySetInnerHTML={{ __html: page.content ?? '' }} />
                </div>
            </div>
        </Container>
    );
}
