import { useCallback, useEffect, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  doc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore/lite'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db } from '../firebase'
import { storage } from '../firebaseAdmin'
import {
  getCroppedImageBlob,
  SMALL_PHOTO_MAX_SIZE,
  LARGE_PHOTO_MAX_SIZE,
  LONG_CACHE_METADATA,
} from '../utils/cropImage'
import useModalA11y from '../hooks/useModalA11y'
import PhotoGridManager from '../components/PhotoGridManager'
import { formatSize } from '../utils/formatSize'

const MAX_GALLERY_PHOTOS = 8

// For elements that already declare their own `rounded`/`rounded-lg` class.
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2'
// For plain text links/buttons with no border-radius of their own.
const focusRingText = `${focusRing} rounded-sm`
const inputFocus = 'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900'

// A visible label with a red asterisk for required fields — every field in
// the product form is required except Notes (and Subcategory, which is
// only required when Category is Bottoms).
function FieldLabel({ text, required }) {
  return (
    <label className="text-sm font-medium text-gray-700 mb-2 block">
      {text}
      {required && <span className="text-red-600"> *</span>}
    </label>
  )
}

// Small uppercase divider heading between groups of related fields in the
// product form, same visual language as the category label already used
// elsewhere (e.g. product list rows).
function SectionHeading({ text }) {
  return <h4 className="text-xs font-medium uppercase tracking-wide text-gray-400">{text}</h4>
}

// A row of toggle buttons for a single-choice field (Category, Subcategory)
// — same active/inactive visual language as the category filter buttons
// further down this file, just reused here for the form itself instead of
// a <select>. selected is a plain string, not an array.
function ChoiceButtons({ options, selected, onSelect, disabled }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(option)}
          className={`text-sm rounded-lg px-4 py-2 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed ${focusRing} ${
            selected === option
              ? 'bg-gray-900 text-white'
              : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

function AdminProducts() {
  const [products, setProducts] = useState([])
  const [archivedProducts, setArchivedProducts] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  // Filters the main products list only — Add/Edit and Archived are
  // unaffected.
  const [categoryFilter, setCategoryFilter] = useState('All')

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  // Only meaningful when category is "Bottoms" — cleared automatically if
  // the category changes away from Bottoms (see the category select below).
  const [subcategory, setSubcategory] = useState('')
  const [color, setColor] = useState('')
  // Multi-select — a product can be offered in more than one size.
  const [size, setSize] = useState([])
  const [modelDetail, setModelDetail] = useState('')
  const [sizeGuide, setSizeGuide] = useState('')
  const [notes, setNotes] = useState('')

  // The cropped, ready-to-upload photo for the form currently in use — set
  // once the crop popup below is confirmed. Upload itself is deferred to
  // handleSubmit (see there for why), not done immediately like the other
  // crop popups elsewhere in Admin.
  const [croppedPhoto, setCroppedPhoto] = useState(null) // { small: Blob, large: Blob, fileName: string } | null
  const [croppedPreviewURL, setCroppedPreviewURL] = useState('')
  const fileInputRef = useRef(null)

  // null = form is adding a new product; otherwise the Firestore doc ID
  // of the product currently being edited.
  const [editingId, setEditingId] = useState(null)
  const [existingImageURL, setExistingImageURL] = useState('')
  const [existingSmallImageURL, setExistingSmallImageURL] = useState('')
  // Whether the "Add product" form is currently revealed. Products are the
  // default view, not the form.
  const [showAddForm, setShowAddForm] = useState(false)

  // Notes live in a separate collection (see fetchNotes), keyed by product
  // ID, so this is a lookup map: { [productId]: notesText }.
  const [notesMap, setNotesMap] = useState({})
  // Which active products' detail panels are currently open — a Set so any
  // number of products can be expanded at once, independently of each other.
  const [expandedIds, setExpandedIds] = useState(new Set())

  // Crop popup state — opens right after a photo is picked. Fixed 4:5
  // aspect (unlike Tops/Bottoms/Hero, which use each photo's own ratio),
  // since product cards sit in a uniform grid and need a consistent shape.
  const [cropFile, setCropFile] = useState(null)
  const [cropPreviewURL, setCropPreviewURL] = useState('')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  // Gallery photo crop popup state — separate from the main product-photo
  // crop above. Gallery photos belong to an already-saved product (managed
  // from the expanded row panel, not the Add/Edit form), so each upload
  // saves immediately on confirm rather than deferring to a form submit —
  // same immediate-upload pattern as Tops/Bottoms photos elsewhere in Admin.
  const [galleryCropTarget, setGalleryCropTarget] = useState(null) // { productId, index } | null
  const [galleryCropFile, setGalleryCropFile] = useState(null)
  const [galleryCropPreviewURL, setGalleryCropPreviewURL] = useState('')
  const [galleryCrop, setGalleryCrop] = useState({ x: 0, y: 0 })
  const [galleryZoom, setGalleryZoom] = useState(1)
  const [galleryCroppedAreaPixels, setGalleryCroppedAreaPixels] = useState(null)
  const [galleryUploadingSlot, setGalleryUploadingSlot] = useState(null) // `gallery-{productId}-{index}` | null

  // No auth check here — Admin.jsx only renders this component once a user
  // is already signed in, so it's safe to fetch immediately on mount.
  useEffect(() => {
    fetchProducts()
    fetchArchivedProducts()
    fetchNotes()
  }, [])

  useEffect(() => {
    if (!cropFile) {
      setCropPreviewURL('')
      return
    }
    const objectURL = URL.createObjectURL(cropFile)
    setCropPreviewURL(objectURL)
    return () => URL.revokeObjectURL(objectURL)
  }, [cropFile])

  useEffect(() => {
    if (!galleryCropFile) {
      setGalleryCropPreviewURL('')
      return
    }
    const objectURL = URL.createObjectURL(galleryCropFile)
    setGalleryCropPreviewURL(objectURL)
    return () => URL.revokeObjectURL(objectURL)
  }, [galleryCropFile])

  useEffect(() => {
    if (!croppedPhoto) {
      setCroppedPreviewURL('')
      return
    }
    const objectURL = URL.createObjectURL(croppedPhoto.large)
    setCroppedPreviewURL(objectURL)
    return () => URL.revokeObjectURL(objectURL)
  }, [croppedPhoto])

  async function fetchProducts() {
    const snapshot = await getDocs(collection(db, 'products'))
    setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
  }

  async function fetchArchivedProducts() {
    const snapshot = await getDocs(collection(db, 'archivedProducts'))
    setArchivedProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
  }

  async function fetchNotes() {
    const snapshot = await getDocs(collection(db, 'productNotes'))
    const map = {}
    snapshot.docs.forEach((d) => {
      map[d.id] = d.data().notes
    })
    setNotesMap(map)
  }

  function resetForm() {
    setName('')
    setPrice('')
    setDescription('')
    setCategory('')
    setSubcategory('')
    setColor('')
    setSize([])
    setModelDetail('')
    setSizeGuide('')
    setNotes('')
    setCroppedPhoto(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setEditingId(null)
    setExistingImageURL('')
    setExistingSmallImageURL('')
    setShowAddForm(false)
  }

  function handleEditClick(product) {
    setShowAddForm(false)
    setEditingId(product.id)
    setName(product.name)
    setPrice(String(product.price))
    setDescription(product.description)
    setCategory(product.category)
    setSubcategory(product.subcategory || '')
    setColor(product.color || '')
    // Old products may still have size saved as a single string — fold it
    // into the new array shape rather than losing it.
    setSize(Array.isArray(product.size) ? product.size : product.size ? [product.size] : [])
    setModelDetail(product.modelDetail || '')
    setSizeGuide(product.sizeGuide || '')
    setNotes(notesMap[product.id] || '')
    setExistingImageURL(product.imageURL)
    setExistingSmallImageURL(product.smallImageURL || product.imageURL || '')
    setCroppedPhoto(null)
    setError('')
  }

  const handleCancelEdit = useCallback(() => {
    resetForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const editModalRef = useModalA11y(Boolean(editingId), handleCancelEdit)

  function handlePhotoSelected(e) {
    const file = e.target.files[0]
    if (!file) return
    setCropFile(file)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
  }

  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const closeCropModal = useCallback(() => {
    setCropFile(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const cropModalRef = useModalA11y(Boolean(cropFile), closeCropModal)

  async function handleConfirmPhotoCrop() {
    if (!cropFile || !croppedAreaPixels) return
    const [large, small] = await Promise.all([
      getCroppedImageBlob(cropPreviewURL, croppedAreaPixels, LARGE_PHOTO_MAX_SIZE),
      getCroppedImageBlob(cropPreviewURL, croppedAreaPixels, SMALL_PHOTO_MAX_SIZE),
    ])
    setCroppedPhoto({ small, large, fileName: cropFile.name })
    closeCropModal()
  }

  function openGalleryCrop(productId, index, file) {
    if (!file) return
    setGalleryCropTarget({ productId, index })
    setGalleryCropFile(file)
    setGalleryCrop({ x: 0, y: 0 })
    setGalleryZoom(1)
    setGalleryCroppedAreaPixels(null)
  }

  const onGalleryCropComplete = useCallback((_croppedArea, pixels) => {
    setGalleryCroppedAreaPixels(pixels)
  }, [])

  const closeGalleryCropModal = useCallback(() => {
    setGalleryCropTarget(null)
    setGalleryCropFile(null)
    setGalleryCrop({ x: 0, y: 0 })
    setGalleryZoom(1)
    setGalleryCroppedAreaPixels(null)
  }, [])

  const galleryCropModalRef = useModalA11y(Boolean(galleryCropTarget), closeGalleryCropModal)

  async function handleConfirmGalleryCrop() {
    if (!galleryCropFile || !galleryCroppedAreaPixels || !galleryCropTarget) return
    const { productId, index } = galleryCropTarget
    const slotKey = `gallery-${productId}-${index}`
    setGalleryUploadingSlot(slotKey)
    try {
      const [large, small] = await Promise.all([
        getCroppedImageBlob(galleryCropPreviewURL, galleryCroppedAreaPixels, LARGE_PHOTO_MAX_SIZE),
        getCroppedImageBlob(galleryCropPreviewURL, galleryCroppedAreaPixels, SMALL_PHOTO_MAX_SIZE),
      ])
      const largeRef = ref(
        storage,
        `products/${productId}-gallery-${index}-${Date.now()}-large-${galleryCropFile.name}`,
      )
      const smallRef = ref(
        storage,
        `products/${productId}-gallery-${index}-${Date.now()}-small-${galleryCropFile.name}`,
      )
      await Promise.all([
        uploadBytes(largeRef, large, LONG_CACHE_METADATA),
        uploadBytes(smallRef, small, LONG_CACHE_METADATA),
      ])
      const [largeURL, smallURL] = await Promise.all([getDownloadURL(largeRef), getDownloadURL(smallRef)])
      const product = products.find((p) => p.id === productId)
      const nextGallery = [...(product.galleryPhotos || [])]
      nextGallery[index] = { small: smallURL, large: largeURL }
      await updateDoc(doc(db, 'products', productId), { galleryPhotos: nextGallery })
      await fetchProducts()
      closeGalleryCropModal()
    } finally {
      setGalleryUploadingSlot(null)
    }
  }

  async function handleRemoveGalleryPhoto(productId, index) {
    if (!window.confirm('Remove this photo? This cannot be undone.')) return
    const product = products.find((p) => p.id === productId)
    const nextGallery = (product.galleryPhotos || []).filter((_, i) => i !== index)
    await updateDoc(doc(db, 'products', productId), { galleryPhotos: nextGallery })
    await fetchProducts()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!editingId && !croppedPhoto) {
      setError('Please choose an image.')
      return
    }
    // Category, Subcategory, and Size are button/checkbox groups, not
    // native <select>/<input required> elements, so they need their own
    // validation instead of relying on browser form validation.
    if (!category) {
      setError('Please select a category.')
      return
    }
    if (category === 'Bottoms' && !subcategory) {
      setError('Please select a subcategory.')
      return
    }
    if (size.length === 0) {
      setError('Please select at least one size.')
      return
    }
    setUploading(true)
    setError('')
    try {
      // Editing without picking a new photo keeps the existing images;
      // picking a new one (or adding a product) uploads a fresh pair.
      let imageURL = existingImageURL
      let smallImageURL = existingSmallImageURL
      if (croppedPhoto) {
        const largeRef = ref(storage, `products/${Date.now()}-large-${croppedPhoto.fileName}`)
        const smallRef = ref(storage, `products/${Date.now()}-small-${croppedPhoto.fileName}`)
        await Promise.all([
          uploadBytes(largeRef, croppedPhoto.large, LONG_CACHE_METADATA),
          uploadBytes(smallRef, croppedPhoto.small, LONG_CACHE_METADATA),
        ])
        ;[imageURL, smallImageURL] = await Promise.all([getDownloadURL(largeRef), getDownloadURL(smallRef)])
      }

      let productId = editingId
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), {
          name,
          price: Number(price),
          description,
          category,
          subcategory,
          color,
          size,
          modelDetail,
          sizeGuide,
          imageURL,
          smallImageURL,
        })
      } else {
        // addDoc generates the ID, so we don't know it until it resolves —
        // needed below to save notes under the same ID as the product.
        const newDoc = await addDoc(collection(db, 'products'), {
          name,
          price: Number(price),
          description,
          category,
          subcategory,
          color,
          size,
          modelDetail,
          sizeGuide,
          imageURL,
          smallImageURL,
          createdAt: serverTimestamp(),
        })
        productId = newDoc.id
      }

      // Notes live in their own auth-only collection (see the "why" note
      // in fetchNotes) — keeping it in sync with the form here. An empty
      // notes field deletes any existing notes doc rather than leaving one.
      if (notes.trim()) {
        await setDoc(doc(db, 'productNotes', productId), { notes })
      } else {
        await deleteDoc(doc(db, 'productNotes', productId))
      }

      resetForm()
      await fetchProducts()
      await fetchNotes()
    } catch {
      setError(editingId ? 'Update failed. Please try again.' : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product? This cannot be undone.')) return
    await deleteDoc(doc(db, 'products', id))
    await deleteDoc(doc(db, 'productNotes', id)) // no-op if no notes exist
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  // Archiving/restoring "moves" a product between collections: write its
  // data to the destination (keeping the same doc ID via setDoc, rather
  // than addDoc which would generate a new one), then delete the original.
  async function handleArchive(product) {
    if (!window.confirm('Archive this product? It will be hidden from the live site until restored.'))
      return
    const { id, ...data } = product
    await setDoc(doc(db, 'archivedProducts', id), data)
    await deleteDoc(doc(db, 'products', id))
    await fetchProducts()
    await fetchArchivedProducts()
  }

  async function handleRestore(product) {
    const { id, ...data } = product
    await setDoc(doc(db, 'products', id), data)
    await deleteDoc(doc(db, 'archivedProducts', id))
    await fetchProducts()
    await fetchArchivedProducts()
  }

  async function handleDeleteArchived(id) {
    if (!window.confirm('Permanently delete this archived product? This cannot be undone.'))
      return
    await deleteDoc(doc(db, 'archivedProducts', id))
    await deleteDoc(doc(db, 'productNotes', id)) // no-op if no notes exist
    setArchivedProducts((prev) => prev.filter((p) => p.id !== id))
  }

  function toggleExpand(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Shared by both the "Add product" form (top of page, inline) and the
  // edit form (rendered inside a popup modal, see editingId below) — only
  // one of the two is ever visible at a time, since editingId hides the
  // add form while set.
  function renderForm() {
    const previewToShow = croppedPreviewURL || existingImageURL
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <SectionHeading text="Photo" />
          {editingId && (
            <p className="text-sm text-gray-500">
              Leave the image field empty to keep the current photo.
            </p>
          )}
          <div className="flex items-start gap-4 border border-gray-200 rounded-lg p-4">
            {previewToShow ? (
              <img
                src={previewToShow}
                alt="Product preview"
                className="w-24 aspect-[4/5] object-cover rounded-lg flex-shrink-0"
              />
            ) : (
              <div className="w-24 aspect-[4/5] rounded-lg bg-gray-100 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <FieldLabel text="Photo" required={!editingId} />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelected}
                className={`w-full border border-gray-300 rounded-lg px-4 py-2 transition-all duration-300 ease-in-out ${inputFocus}`}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SectionHeading text="Basic info" />
          <div>
            <FieldLabel text="Name" required />
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={`w-full border border-gray-300 rounded-lg px-4 py-2 transition-all duration-300 ease-in-out ${inputFocus}`}
            />
          </div>
          <div>
            <FieldLabel text="Price" required />
            <input
              type="number"
              step="0.01"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className={`w-full max-w-xs border border-gray-300 rounded-lg px-4 py-2 transition-all duration-300 ease-in-out ${inputFocus}`}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              <FieldLabel text="Category" required />
              <ChoiceButtons
                options={['Tops', 'Bottoms', 'Others']}
                selected={category}
                onSelect={(option) => {
                  setCategory(option)
                  if (option !== 'Bottoms') setSubcategory('')
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <FieldLabel text="Subcategory" required={category === 'Bottoms'} />
              <ChoiceButtons
                options={['Skirts', 'Trousers']}
                selected={subcategory}
                onSelect={setSubcategory}
                disabled={category !== 'Bottoms'}
              />
              <p className="text-xs text-gray-400 mt-2">If Bottoms is selected</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              <FieldLabel text="Color" required />
              <input
                type="text"
                placeholder="Color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                required
                className={`w-full border border-gray-300 rounded-lg px-4 py-2 transition-all duration-300 ease-in-out ${inputFocus}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <FieldLabel text="Size" required />
              <div className="flex flex-wrap gap-4 py-2">
                {['S', 'M', 'L'].map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={size.includes(option)}
                      onChange={() =>
                        setSize((prev) =>
                          prev.includes(option) ? prev.filter((s) => s !== option) : [...prev, option],
                        )
                      }
                      className={`rounded-sm ${inputFocus}`}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SectionHeading text="Content" />
          <div>
            <FieldLabel text="Description" required />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className={`w-full border border-gray-300 rounded-lg px-4 py-2 transition-all duration-300 ease-in-out ${inputFocus}`}
            />
          </div>
          <div>
            <FieldLabel text="Model detail" required />
            <textarea
              placeholder="Model detail"
              value={modelDetail}
              onChange={(e) => setModelDetail(e.target.value)}
              required
              rows={2}
              className={`w-full border border-gray-300 rounded-lg px-4 py-2 transition-all duration-300 ease-in-out ${inputFocus}`}
            />
          </div>
          <div>
            <FieldLabel text="Size guide" required />
            <textarea
              placeholder="Size guide"
              value={sizeGuide}
              onChange={(e) => setSizeGuide(e.target.value)}
              required
              rows={3}
              className={`w-full border border-gray-300 rounded-lg px-4 py-2 transition-all duration-300 ease-in-out ${inputFocus}`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <SectionHeading text="Admin only — never shown to customers" />
          <div>
            <FieldLabel text="Notes" required={false} />
            <textarea
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={`w-full border border-gray-300 rounded-lg px-4 py-2 bg-white transition-all duration-300 ease-in-out ${inputFocus}`}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-4 border-t border-gray-200 pt-6">
          <button
            type="submit"
            disabled={uploading}
            className={`bg-gray-900 text-white rounded-lg px-4 py-2 hover:bg-gray-700 transition-all duration-300 ease-in-out disabled:opacity-50 ${focusRing}`}
          >
            {uploading
              ? editingId
                ? 'Saving...'
                : 'Uploading...'
              : editingId
                ? 'Save changes'
                : 'Add product'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className={`text-sm text-gray-500 hover:text-gray-900 transition-all duration-300 ease-in-out ${focusRingText}`}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Products</h2>
        {!editingId && (
          <button
            onClick={() => setShowAddForm((prev) => !prev)}
            className={`bg-gray-900 text-white rounded px-4 py-2 text-sm hover:bg-gray-700 transition-all duration-300 ease-in-out ${focusRing}`}
          >
            {showAddForm ? 'Cancel' : 'Add product'}
          </button>
        )}
      </div>

      {showAddForm && <div className="mb-8">{renderForm()}</div>}

      <div className="flex items-center gap-2 mb-4">
        {['All', 'Tops', 'Bottoms', 'Others'].map((option) => (
          <button
            key={option}
            onClick={() => setCategoryFilter(option)}
            className={`text-sm rounded px-4 py-2 transition-all duration-300 ease-in-out ${focusRing} ${
              categoryFilter === option
                ? 'bg-gray-900 text-white'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {products
          .filter((product) => categoryFilter === 'All' || product.category === categoryFilter)
          .map((product) => {
          const isEditingThis = editingId === product.id
          const isExpanded = expandedIds.has(product.id) || isEditingThis
          return (
            <div key={product.id} className="border border-gray-200 rounded">
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-2">
                  <img
                    src={product.imageURL}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      {[product.category, product.subcategory].filter(Boolean).join(' · ')}
                    </p>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">${product.price}</p>
                    {(product.color || formatSize(product.size)) && (
                      <p className="text-xs text-gray-400">
                        {[product.color, formatSize(product.size)].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleExpand(product.id)}
                    aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                    className={`text-sm text-gray-600 hover:text-gray-900 transition-all duration-300 ease-in-out ${focusRingText}`}
                  >
                    {isExpanded ? '▲' : '▼'}
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-gray-200 px-4 py-4">
                  <div className="text-sm text-gray-600 flex flex-col gap-2">
                    <p>
                      <span className="font-medium text-gray-900">Category:</span>{' '}
                      {product.category}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">Subcategory:</span>{' '}
                      {product.subcategory || '—'}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">Color:</span>{' '}
                      {product.color || '—'}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">Size:</span>{' '}
                      {formatSize(product.size) || '—'}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">Description:</span>{' '}
                      {product.description}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">Model Detail:</span>{' '}
                      {product.modelDetail || '—'}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">Size Guide:</span>{' '}
                      {product.sizeGuide || '—'}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">Notes:</span>{' '}
                      {notesMap[product.id] || '—'}
                    </p>
                    <div>
                      <p className="font-medium text-gray-900 mb-2">Gallery Photos</p>
                      <PhotoGridManager
                        photos={product.galleryPhotos || []}
                        maxPhotos={MAX_GALLERY_PHOTOS}
                        keyPrefix={`gallery-${product.id}`}
                        uploadingSlot={galleryUploadingSlot}
                        onSelectFile={(index, file) => openGalleryCrop(product.id, index, file)}
                        onRemove={(index) => handleRemoveGalleryPhoto(product.id, index)}
                      />
                    </div>
                    <div className="self-end flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(product)}
                        className={`text-sm text-gray-600 hover:text-gray-900 transition-all duration-300 ease-in-out ${focusRingText}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleArchive(product)}
                        className={`text-sm text-gray-600 hover:text-gray-900 transition-all duration-300 ease-in-out ${focusRingText}`}
                      >
                        Archive
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className={`text-sm text-red-600 hover:text-red-800 transition-all duration-300 ease-in-out ${focusRingText}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            ref={editModalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Edit product"
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Edit product</h3>
            {renderForm()}
          </div>
        </div>
      )}

      {cropFile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div
            ref={cropModalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Crop product photo"
            className="w-full max-w-lg bg-white rounded shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Crop product photo</h3>
            <p className="text-sm text-gray-500 mb-2">
              Drag to move, scroll or pinch to zoom — cropped to a 4:5 ratio to match the product
              grid.
            </p>
            <div className="relative w-full aspect-[4/5] bg-gray-100 rounded overflow-hidden">
              <Cropper
                image={cropPreviewURL}
                crop={crop}
                zoom={zoom}
                aspect={4 / 5}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-500 mt-2">
              Zoom
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 rounded-sm"
              />
            </label>
            <div className="flex items-center gap-4 mt-4">
              <button
                type="button"
                onClick={handleConfirmPhotoCrop}
                disabled={!croppedAreaPixels}
                className={`bg-gray-900 text-white rounded px-4 py-2 text-sm hover:bg-gray-700 transition-all duration-300 ease-in-out disabled:opacity-50 ${focusRing}`}
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={closeCropModal}
                className={`text-sm text-gray-500 hover:text-gray-900 transition-all duration-300 ease-in-out ${focusRingText}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {galleryCropTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div
            ref={galleryCropModalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Crop gallery photo"
            className="w-full max-w-lg bg-white rounded shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Crop gallery photo</h3>
            <p className="text-sm text-gray-500 mb-2">
              Drag to move, scroll or pinch to zoom — cropped to a 4:5 ratio to match the product
              photo.
            </p>
            <div className="relative w-full aspect-[4/5] bg-gray-100 rounded overflow-hidden">
              <Cropper
                image={galleryCropPreviewURL}
                crop={galleryCrop}
                zoom={galleryZoom}
                aspect={4 / 5}
                onCropChange={setGalleryCrop}
                onZoomChange={setGalleryZoom}
                onCropComplete={onGalleryCropComplete}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-500 mt-2">
              Zoom
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={galleryZoom}
                onChange={(e) => setGalleryZoom(Number(e.target.value))}
                className="flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 rounded-sm"
              />
            </label>
            <div className="flex items-center gap-4 mt-4">
              <button
                type="button"
                onClick={handleConfirmGalleryCrop}
                disabled={
                  !galleryCroppedAreaPixels ||
                  galleryUploadingSlot === `gallery-${galleryCropTarget.productId}-${galleryCropTarget.index}`
                }
                className={`bg-gray-900 text-white rounded px-4 py-2 text-sm hover:bg-gray-700 transition-all duration-300 ease-in-out disabled:opacity-50 ${focusRing}`}
              >
                {galleryUploadingSlot === `gallery-${galleryCropTarget.productId}-${galleryCropTarget.index}`
                  ? 'Uploading...'
                  : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={closeGalleryCropModal}
                className={`text-sm text-gray-500 hover:text-gray-900 transition-all duration-300 ease-in-out ${focusRingText}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {archivedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold mb-4">Archived</h2>
          <div className="flex flex-col gap-2">
            {archivedProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between border border-gray-200 rounded px-4 py-4 opacity-75"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={product.imageURL}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      {[product.category, product.subcategory].filter(Boolean).join(' · ')}
                    </p>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">${product.price}</p>
                    {(product.color || formatSize(product.size)) && (
                      <p className="text-xs text-gray-400">
                        {[product.color, formatSize(product.size)].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRestore(product)}
                    className={`text-sm text-gray-600 hover:text-gray-900 transition-all duration-300 ease-in-out ${focusRingText}`}
                  >
                    Move back live
                  </button>
                  <button
                    onClick={() => handleDeleteArchived(product.id)}
                    className={`text-sm text-red-600 hover:text-red-800 transition-all duration-300 ease-in-out ${focusRingText}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminProducts
