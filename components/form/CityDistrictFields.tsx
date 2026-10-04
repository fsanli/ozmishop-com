'use client';

import { useId, useMemo, useState } from 'react';
import { foldTr, type Locations } from '@/lib/locations';
import Combobox from './Combobox';
import FieldLabel from './FieldLabel';

/**
 * İl + ilçe çifti. İlçe listesi seçilen ile göre süzülür; il seçilmeden ilçe
 * kutusu pasif. İl DEĞİŞİNCE ilçe sıfırlanır — eski ilçe yeni ile ait değildir.
 *
 * İki `<div>` döner; yerleşimi (yan yana / alt alta) çağıranın ızgarası verir.
 * `names` fatura adresi gibi ikinci bir blok için alan adlarını değiştirir.
 */
export default function CityDistrictFields({
    locations,
    defaultCity = '',
    defaultDistrict = '',
    names = { city: 'city', district: 'district' },
    required = true,
}: {
    locations: Locations;
    defaultCity?: string;
    defaultDistrict?: string;
    names?: { city: string; district: string };
    required?: boolean;
}) {
    const idBase = useId();
    const [city, setCity] = useState(defaultCity);
    const [district, setDistrict] = useState(defaultDistrict);

    const findCity = (name: string) => locations.cities.find((item) => foldTr(item.name) === foldTr(name));
    const matchedCity = findCity(city);

    const cityOptions = useMemo(() => locations.cities.map((item) => item.name), [locations]);
    const districtOptions = useMemo(
        () => matchedCity?.districts.map((item) => item.name) ?? [],
        [matchedCity],
    );

    return (
        <>
            <div>
                <label htmlFor={`${idBase}-il`}><FieldLabel required={required}>İl</FieldLabel></label>
                <Combobox
                    id={`${idBase}-il`}
                    name={names.city}
                    value={city}
                    onChange={(next) => {
                        if (findCity(next)?.id !== matchedCity?.id) setDistrict('');
                        setCity(next);
                    }}
                    options={cityOptions}
                    placeholder="İl ara"
                    required={required}
                    autoComplete="address-level1"
                    invalidMessage="İli listeden seçin."
                />
            </div>
            <div>
                <label htmlFor={`${idBase}-ilce`}><FieldLabel required={required}>İlçe</FieldLabel></label>
                <Combobox
                    id={`${idBase}-ilce`}
                    name={names.district}
                    value={district}
                    onChange={setDistrict}
                    options={districtOptions}
                    placeholder={matchedCity ? 'İlçe ara' : 'Önce il seçin'}
                    disabled={!matchedCity}
                    required={required}
                    autoComplete="address-level2"
                    invalidMessage={matchedCity ? `İlçeyi ${matchedCity.name} listesinden seçin.` : 'Önce il seçin.'}
                />
            </div>
        </>
    );
}
