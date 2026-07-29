// Merges two photo lists by alternating (a[0], b[0], a[1], b[1], ...) so
// neither list's photos all show up before the other's — used only as part
// of the legacy Tops/Bottoms fallback below. Any leftover once the shorter
// list runs out is tacked on at the end.
function interleave(a, b) {
  const merged = []
  const maxLength = Math.max(a.length, b.length)
  for (let i = 0; i < maxLength; i++) {
    if (a[i]) merged.push(a[i])
    if (b[i]) merged.push(b[i])
  }
  return merged
}

// Given a raw collectionLayout doc (or null/undefined), returns the combined
// gallery photos list. Prefers the single `galleryPhotos` field; falls back
// to interleaving the old separate topsPhotos/bottomsPhotos arrays (with
// bottomsPhoto, singular, as an even older fallback) so photos uploaded
// before Tops/Bottoms were combined into one Gallery Photos manager still
// show up, without needing a one-time data migration script — both
// Catalog.jsx (public page) and AdminCollectionHero.jsx (its editor) share
// this so the two never derive the combined list differently.
export function deriveGalleryPhotos(data) {
  if (!data) return []
  if (data.galleryPhotos) return data.galleryPhotos
  const topsPhotos = data.topsPhotos || []
  const bottomsPhotos = data.bottomsPhotos || (data.bottomsPhoto ? [data.bottomsPhoto] : [])
  return interleave(topsPhotos, bottomsPhotos)
}
