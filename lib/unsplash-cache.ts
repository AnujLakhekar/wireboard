export type UnsplashFilterState = {
  color: string | null;
  orientation: "landscape" | "portrait" | "squarish" | null;
};

export type UnsplashPhoto = {
  id: string;
  width: number;
  height: number;
  alt_description: string | null;
  urls: {
    regular: string;
    small: string;
  };
  user?: {
    name: string;
    links?: { html: string };
    profile_image?: { small: string };
  };
};

const MAX_UNSPLASH_RESULTS = 20;
const DEFAULT_UNSPLASH_RESULTS = 12;

const photoCache = new Map<string, UnsplashPhoto[]>();
const requestCache = new Map<string, Promise<UnsplashPhoto[]>>();

function buildCacheKey(search: string, filters: UnsplashFilterState, limit: number) {
  return JSON.stringify({
    search: search.trim().toLowerCase(),
    color: filters.color ?? "",
    orientation: filters.orientation ?? "",
    limit,
  });
}

export async function fetchUnsplashPhotos({
  search = "",
  filters,
  limit = DEFAULT_UNSPLASH_RESULTS,
}: {
  search?: string;
  filters: UnsplashFilterState;
  limit?: number;
}): Promise<UnsplashPhoto[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), MAX_UNSPLASH_RESULTS);
  const cacheKey = buildCacheKey(search, filters, safeLimit);

  if (photoCache.has(cacheKey)) {
    return photoCache.get(cacheKey) ?? [];
  }

  const pendingRequest = requestCache.get(cacheKey);
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = (async () => {
    try {
      const response = await fetch("/api/unplash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          search: search.trim(),
          limit: safeLimit,
          filters: {
            color: filters.color,
            orientation: filters.orientation,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Unsplash request failed with status ${response.status}`);
      }

      const data = await response.json().catch(() => []);
      const normalizedData = Array.isArray(data) ? data.slice(0, safeLimit) : [];
      photoCache.set(cacheKey, normalizedData);
      return normalizedData;
    } catch (error) {
      console.warn("Unsplash fetch skipped; using cached images when available.", error);
      return photoCache.get(cacheKey) ?? [];
    } finally {
      requestCache.delete(cacheKey);
    }
  })();

  requestCache.set(cacheKey, request);
  return request;
}
