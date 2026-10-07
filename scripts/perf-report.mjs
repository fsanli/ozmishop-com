/**
 * Lighthouse JSON çıktılarını medyan tablosuna çevirir (D10, docs/PERFORMANS.md).
 *
 *   node scripts/perf-report.mjs <klasör>
 *
 * Dosya adı kalıbı: <sayfa>_<mobile|desktop>_<koşu>.json. Her sayfa × cihaz
 * için koşuların MEDYANI alınır; tek koşu ağ gürültüsüne açık.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) {
    console.error('kullanım: node scripts/perf-report.mjs <klasör>');
    process.exit(1);
}

const median = (values) => {
    const sorted = values.filter((value) => typeof value === 'number').sort((a, b) => a - b);
    if (!sorted.length) return null;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const groups = new Map();
let meta = null;
for (const file of readdirSync(dir).filter((name) => name.endsWith('.json'))) {
    const match = /^(.+)_(mobile|desktop)_\d+\.json$/.exec(file);
    if (!match) continue;
    const report = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    if (!report.audits) continue;
    meta ??= { version: report.lighthouseVersion, fetchTime: report.fetchTime };
    const key = `${match[1]}|${match[2]}`;
    if (!groups.has(key)) groups.set(key, { url: report.finalDisplayedUrl || report.requestedUrl, runs: [] });
    const audit = (id) => report.audits[id]?.numericValue;
    groups.get(key).runs.push({
        score: report.categories.performance.score * 100,
        lcp: audit('largest-contentful-paint'),
        fcp: audit('first-contentful-paint'),
        tbt: audit('total-blocking-time'),
        cls: audit('cumulative-layout-shift'),
        si: audit('speed-index'),
        ttfb: audit('server-response-time'),
        bytes: audit('total-byte-weight'),
        // Lighthouse 13: LCP öğesi ve alt bileşenleri `lcp-breakdown-insight` içinde.
        lcpElement: (report.audits['lcp-breakdown-insight']?.details?.items ?? []).find((item) => item.type === 'node')?.snippet ?? '',
        lcpParts: Object.fromEntries(((report.audits['lcp-breakdown-insight']?.details?.items ?? [])
            .find((item) => item.type === 'table')?.items ?? []).map((part) => [part.subpart, part.duration])),
        opportunities: Object.values(report.audits)
            .filter((item) => item.details?.type === 'opportunity' && (item.details.overallSavingsMs ?? 0) > 0)
            .sort((a, b) => b.details.overallSavingsMs - a.details.overallSavingsMs)
            .slice(0, 3)
            .map((item) => `${item.title} (~${Math.round(item.details.overallSavingsMs)} ms)`),
    });
}

const ms = (value) => (value == null ? '—' : `${(value / 1000).toFixed(2)} sn`);
console.log(`Lighthouse ${meta?.version ?? '?'} · ilk koşu ${meta?.fetchTime ?? '?'} · her satır ${[...groups.values()][0]?.runs.length ?? 0} koşunun medyanı\n`);
console.log('| Sayfa | Cihaz | Skor | LCP | LCP: TTFB / yükleme gecikmesi / yükleme / render gecikmesi | FCP | TBT | CLS | SI | Toplam KB | LCP öğesi | İlk fırsatlar (son koşu) |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const [key, { url, runs }] of [...groups.entries()].sort()) {
    const [, device] = key.split('|');
    const pick = (field) => median(runs.map((run) => run[field]));
    const last = runs[runs.length - 1];
    const element = (last.lcpElement || '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').slice(0, 70);
    const part = (name) => Math.round(median(runs.map((run) => run.lcpParts[name])) ?? 0);
    const parts = `${part('timeToFirstByte')} / ${part('resourceLoadDelay')} / ${part('resourceLoadDuration')} / ${part('elementRenderDelay')} ms`;
    console.log(`| ${new URL(url).pathname} | ${device} | ${Math.round(pick('score'))} | ${ms(pick('lcp'))} | ${parts} | ${ms(pick('fcp'))} | ${Math.round(pick('tbt'))} ms | ${pick('cls')?.toFixed(3)} | ${ms(pick('si'))} | ${Math.round(pick('bytes') / 1024)} | \`${element}\` | ${last.opportunities.join('; ') || '—'} |`);
}
