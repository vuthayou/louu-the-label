// Tops/Bottoms photo entries are either a plain URL string (uploaded before
// responsive small/large sizing existed) or a { small, large } object. This
// reads whichever size is requested, falling back gracefully so an old,
// not-yet-re-uploaded photo still shows up instead of breaking.
export function getPhotoURL(photo, size = 'large') {
  if (!photo) return ''
  if (typeof photo === 'string') return photo
  return photo[size] || photo.large || photo.small || ''
}
