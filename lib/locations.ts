/** İl/ilçe listesi — API `GET /locations` (migrasyon 020). İl kimliği plakadır. */
export interface LocationDistrict {
    id: number;
    name: string;
}

export interface LocationCity {
    id: number;
    name: string;
    districts: LocationDistrict[];
}

export interface Locations {
    cities: LocationCity[];
}

const ASCII: Record<string, string> = {
    ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u',
};

/**
 * Aramada kullanılan katlama: Türkçe küçük harf + ASCII. "kadikoy" Kadıköy'ü,
 * "IZMIR" İzmir'i bulsun. API'deki `LocationService` ile AYNI kural — seçicinin
 * kabul ettiği yazımı sunucu da kabul etmeli.
 */
export const foldTr = (value: string): string =>
    value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr').replace(/[çğıöşüâîû]/g, (char) => ASCII[char]);
