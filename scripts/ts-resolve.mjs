/**
 * Düz Node testleri için: `lib/` dosyaları Next kuralıyla uzantısız import
 * ediyor (`./site`). Node ESM uzantı istediği için bulunamayan göreli
 * adreslere `.ts` eklenir. Yalnız `npm run check:seo` yükler.
 */
import { registerHooks } from 'node:module';

registerHooks({
    resolve(specifier, context, nextResolve) {
        try {
            return nextResolve(specifier, context);
        } catch (error) {
            if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
                return nextResolve(`${specifier}.ts`, context);
            }
            throw error;
        }
    },
});
