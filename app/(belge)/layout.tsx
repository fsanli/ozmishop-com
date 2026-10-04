/**
 * Belge kabuğu: başlık, menü ve footer YOK. Sayfa yazdırılınca (PDF) yalnız
 * belge çıksın; yaş kapısı ve çerez bandı kök yerleşimde kalıyor.
 */
export default function BelgeLayout({ children }: { children: React.ReactNode }) {
    return <main id="icerik" className="flex-1 bg-surface">{children}</main>;
}
