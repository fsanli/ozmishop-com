import type { Metadata } from 'next';
import HomeSections from '@/components/home/HomeSections';
import { getHome } from '@/lib/api';
import { site } from '@/lib/site';

export const metadata: Metadata = {
    title: site.title,
    description: site.description,
    alternates: { canonical: '/' },
};

/**
 * Anasayfa. Düzenin TAMAMI panelden gelir (`/home`) — kodda sabit blok YOK.
 *
 * Eskiden burada kod içinde bir koyu hero duruyordu ve panelden yönetilen
 * banner slider'ının ÖNÜNE geçiyordu: editör anasayfanın ilk ekranını
 * değiştiremiyordu. Kaldırıldı; ilk içerik artık `hero_slider` bloğu.
 *
 * H1 GÖRÜNMEZ AMA VAR. Sayfanın tek H1'i olmalı ve ilk blok bir görsel;
 * banner'ın alt metni H1 olamaz (blok tipi değişebilir, o zaman sayfa H1'siz
 * kalırdı). `sr-only` bir H1 hem aramayı hem ekran okuyucuyu doğru besliyor
 * ve hangi blok başta olursa olsun bozulmuyor.
 */
export default async function HomePage() {
    const { sections } = await getHome();

    return (
        <>
            <h1 className="sr-only">{site.title}</h1>
            <HomeSections sections={sections} />
        </>
    );
}
