import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import { getPage, getPages } from '@/lib/api';
import { redirectIfMoved } from '@/lib/redirects';
import { routes, site } from '@/lib/site';

export async function generateStaticParams() {
    try {
        const pages = await getPages();
        const slugs = pages.map((page) => ({ slug: page.slug }));
        return slugs.length ? slugs : [{ slug: '__ornek__' }];
    } catch {
        return [{ slug: '__ornek__' }];
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
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ name: page.title, href: routes.page(page.slug) }]} />
            <h1 className="heading-1 mb-5">{page.title}</h1>
            <div className="card prose-content p-5 sm:p-8" dangerouslySetInnerHTML={{ __html: page.content ?? '' }} />
        </div>
    );
}
