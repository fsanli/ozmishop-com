import JsonLd from '@/components/JsonLd';
import { getSettings } from '@/lib/api';
import { organizationSchema, websiteSchema } from '@/lib/schema';

/**
 * Site geneli yapısal veri: Organization (ayarlardaki iletişim ve sosyal
 * hesaplarla) + WebSite. Ayarlar ÖNBELLEKTEN; API'ye ulaşılamazsa yalın
 * kuruluş bilgisiyle basılır — kök yerleşim hiçbir durumda düşmemeli.
 */
export default async function SiteJsonLd() {
    const settings = await getSettings().catch(() => null);
    return <JsonLd data={[organizationSchema(settings), websiteSchema()]} />;
}
