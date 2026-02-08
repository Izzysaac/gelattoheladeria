// src/lib/cmsCache.ts
type Cache = Map<string, any>;

const isDev = import.meta.env.DEV;
const isCacheEnabled = isDev && import.meta.env.DEV_CACHE === "true";

const g = globalThis as any;

function createCache(): Cache {
    return new Map<string, any>();
}

export const CMS_CACHE: Cache = isCacheEnabled
	? (g.__CMS_CACHE__ ??= createCache())
    : createCache();

export function clearCMSCache() {
    CMS_CACHE.clear();
}
