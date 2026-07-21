// Size is stored as an array (a product can be offered in multiple sizes).
// Formats it for display, staying backward-compatible with the old
// single-string shape from before sizes became multi-select.
export function formatSize(size) {
  if (Array.isArray(size)) return size.join(', ')
  return size || ''
}
