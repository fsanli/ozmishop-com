import { Fragment } from 'react';

/**
 * Yıldız puanı girişi — beş radyo düğmesi, istemci bileşeni YOK.
 * Boyama tamamen CSS'te (globals.css → .rating-stars); klavyede ok tuşlarıyla
 * gezilir, JavaScript kapalıyken de çalışır.
 */
const LABELS: Record<number, string> = {
    1: 'Hiç memnun kalmadım',
    2: 'Beklediğim gibi değildi',
    3: 'İdare eder',
    4: 'Memnunum',
    5: 'Çok memnunum',
};

export default function RatingInput({ name = 'rating', idPrefix }: { name?: string; idPrefix: string }) {
    return (
        <fieldset>
            <legend className="field-label">Puanın</legend>
            {/* Radyo ve etiket KARDEŞ olmak zorunda: dolum kuralı `~` ile yürüyor. */}
            <div className="rating-stars mt-1.5">
                {/* Fragment: araya bir <div> girerse kardeşlik bozulur ve `~` çalışmaz. */}
                {[5, 4, 3, 2, 1].map((value) => (
                    <Fragment key={value}>
                        <input
                            type="radio"
                            id={`${idPrefix}-${value}`}
                            name={name}
                            value={value}
                            required
                            defaultChecked={value === 5}
                            className="sr-only"
                        />
                        <label htmlFor={`${idPrefix}-${value}`} title={LABELS[value]} className="cursor-pointer">
                            <span className="sr-only">{value} yıldız — {LABELS[value]}</span>
                            <svg viewBox="0 0 24 24" aria-hidden>
                                <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4 6.2 20.4l1.1-6.5L2.6 9.3l6.5-.9z" />
                            </svg>
                        </label>
                    </Fragment>
                ))}
            </div>
        </fieldset>
    );
}
