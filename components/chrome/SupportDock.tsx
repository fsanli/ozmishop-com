import Script from 'next/script';
import { WhatsappIcon } from '@/components/icons';
import { getSettings } from '@/lib/api';
import { supportWhatsappLink } from '@/lib/whatsapp';

/**
 * Köşedeki destek kanalları: WhatsApp balonu ve tawk.to canlı desteği.
 *
 * KONUM: WhatsApp SOLDA. tawk.to kendi balonunu sağ alta sabitliyor ve
 * yapılandırmayla taşınamıyor; ikisini de sağa koymak üst üste binmek demekti.
 *
 * İkisi de ayara bağlı ve ayar boşken HİÇ ÇİZİLMEZ — özellikle tawk.to:
 * kimlik yoksa üçüncü parti betik hiç yüklenmiyor, yani yapılandırmayan bir
 * kurulum o JavaScript'in bedelini ödemiyor.
 *
 * WhatsApp tarafı düz bir <a>: sıfır JS, JavaScript kapalıyken de çalışır.
 */
export default async function SupportDock() {
    const settings = await getSettings();
    const whatsapp = supportWhatsappLink(settings);
    // Anahtar kapalıysa kimlik kayıtlı kalır ama betik HİÇ yüklenmez: kapatıp
    // açmak için tawk.to panelinden kimliği yeniden bulmak gerekmiyor.
    const tawk = settings['iletisim.canli_destek_aktif'] === false
        ? null
        : tawkSrc(settings['iletisim.tawkto_kimlik']);

    if (!whatsapp && !tawk) return null;

    return (
        <>
            {whatsapp && (
                <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp ile bize yazın"
                    title="WhatsApp ile bize yazın"
                    className="support-dock fixed bottom-5 left-5 z-40 flex size-12 items-center justify-center rounded-full
                               bg-[#25D366] text-white shadow-[0_6px_20px_rgba(37,211,102,0.4)]
                               transition hover:scale-105 hover:shadow-[0_8px_26px_rgba(37,211,102,0.5)]
                               focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
                >
                    <WhatsappIcon className="size-6" />
                </a>
            )}

            {tawk && (
                // afterInteractive: canlı destek LCP'den sonra yüklensin.
                // Sayfanın kendisi bu betiği beklememeli.
                <Script id="tawkto" src={tawk} strategy="afterInteractive" />
            )}
        </>
    );
}

/**
 * tawk.to embed adresi. Ayar TAM URL değil `property/widget` kimlik çifti
 * tutuyor ve desen burada DOĞRULANIYOR.
 *
 * Sebep güvenlik: ayarı düzenleyebilen biri tam URL yazabilseydi sayfaya
 * istediği <script src>'i enjekte edebilirdi. Kimlikler onaltılık ve
 * alfanümerik; desene uymayan değer sessizce yok sayılır.
 */
function tawkSrc(id: string | undefined): string | null {
    const value = String(id ?? '').trim().replace(/^\/+|\/+$/g, '');
    if (!/^[a-zA-Z0-9]{8,40}\/[a-zA-Z0-9]{4,40}$/.test(value)) return null;
    return `https://embed.tawk.to/${value}`;
}
