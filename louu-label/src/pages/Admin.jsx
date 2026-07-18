import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  doc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '../firebase'
import Login from './Login'

function Admin() {
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [products, setProducts] = useState([])
  const [archivedProducts, setArchivedProducts] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [imageFile, setImageFile] = useState(null)

  // null = form is adding a new product; otherwise the Firestore doc ID
  // of the product currently being edited.
  const [editingId, setEditingId] = useState(null)
  const [existingImageURL, setExistingImageURL] = useState('')
  // Whether the "Add product" form is currently revealed. Products are the
  // default view on login now, not the form.
  const [showAddForm, setShowAddForm] = useState(false)

  // Notes live in a separate collection (see fetchNotes), keyed by product
  // ID, so this is a lookup map: { [productId]: notesText }.
  const [notesMap, setNotesMap] = useState({})
  // Which active products' detail panels are currently open — a Set so any
  // number of products can be expanded at once, independently of each other.
  const [expandedIds, setExpandedIds] = useState(new Set())

  // This is what makes the page "auth-gated": we track sign-in state here
  // and render different UI for each case, rather than using a separate
  // route + redirect.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthChecked(true)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (user) {
      fetchProducts()
      fetchArchivedProducts()
      fetchNotes()
    }
  }, [user])

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
    setNotes('')
    setImageFile(null)
    setEditingId(null)
    setExistingImageURL('')
    setShowAddForm(false)
  }

  function handleEditClick(product) {
    setShowAddForm(false)
    setEditingId(product.id)
    setName(product.name)
    setPrice(String(product.price))
    setDescription(product.description)
    setCategory(product.category)
    setNotes(notesMap[product.id] || '')
    setExistingImageURL(product.imageURL)
    setImageFile(null)
    setError('')
  }

  function handleCancelEdit() {
    resetForm()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!editingId && !imageFile) {
      setError('Please choose an image.')
      return
    }
    setUploading(true)
    setError('')
    try {
      // Editing without picking a new file keeps the existing image;
      // picking a new file (or adding a product) uploads a fresh one.
      let imageURL = existingImageURL
      if (imageFile) {
        const imageRef = ref(storage, `products/${Date.now()}-${imageFile.name}`)
        await uploadBytes(imageRef, imageFile)
        imageURL = await getDownloadURL(imageRef)
      }

      let productId = editingId
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), {
          name,
          price: Number(price),
          description,
          category,
          imageURL,
        })
      } else {
        // addDoc generates the ID, so we don't know it until it resolves —
        // needed below to save notes under the same ID as the product.
        const newDoc = await addDoc(collection(db, 'products'), {
          name,
          price: Number(price),
          description,
          category,
          imageURL,
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
      e.target.reset() // clears the file input, which React can't control directly
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

  // Shared by both the "Add product" form (top of page) and the inline
  // edit form (inside a product's expand panel) — only one of the two is
  // ever mounted at a time, since editingId hides the add form while set.
  function renderForm() {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {editingId && (
          <p className="text-sm text-gray-500">
            Leave the image field empty to keep the current photo.
          </p>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
          required={!editingId}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="border border-gray-300 rounded px-3 py-2"
        />
        <input
          type="number"
          step="0.01"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          className="border border-gray-300 rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="border border-gray-300 rounded px-3 py-2"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="border border-gray-300 rounded px-3 py-2"
        />
        <textarea
          placeholder="Notes (admin-only, never shown to customers)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={uploading}
            className="bg-gray-900 text-white rounded px-3 py-2 hover:bg-gray-700 transition-colors disabled:opacity-50"
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
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    )
  }

  if (!authChecked) {
    return <p className="text-center py-12 text-gray-500">Loading...</p>
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          Louu
        </Link>
        <h1 className="text-xl font-semibold">Admin</h1>
        <button
          onClick={() => signOut(auth)}
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          Sign out
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Products</h2>
        {!editingId && (
          <button
            onClick={() => setShowAddForm((prev) => !prev)}
            className="bg-gray-900 text-white rounded px-3 py-2 text-sm hover:bg-gray-700 transition-colors"
          >
            {showAddForm ? 'Cancel' : 'Add product'}
          </button>
        )}
      </div>

      {editingId ? (
        <p className="text-sm text-gray-500 mb-8">
          Finish or cancel editing below before adding a new product.
        </p>
      ) : (
        showAddForm && <div className="mb-8">{renderForm()}</div>
      )}

      <div className="flex flex-col gap-3">
        {products.map((product) => {
          const isEditingThis = editingId === product.id
          const isExpanded = expandedIds.has(product.id) || isEditingThis
          return (
            <div key={product.id} className="border border-gray-200 rounded">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <img
                    src={product.imageURL}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">${product.price}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleExpand(product.id)}
                    aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {isExpanded ? '▲' : '▼'}
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-gray-200 px-4 py-3">
                  {isEditingThis ? (
                    renderForm()
                  ) : (
                    <div className="text-sm text-gray-600 flex flex-col gap-2">
                      <p>
                        <span className="font-medium text-gray-900">Category:</span>{' '}
                        {product.category}
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">Description:</span>{' '}
                        {product.description}
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">Notes:</span>{' '}
                        {notesMap[product.id] || '—'}
                      </p>
                      <div className="self-end flex items-center gap-3">
                        <button
                          onClick={() => handleEditClick(product)}
                          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleArchive(product)}
                          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          Archive
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-sm text-red-600 hover:text-red-800 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {archivedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold mb-4">Archived</h2>
          <div className="flex flex-col gap-3">
            {archivedProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between border border-gray-200 rounded px-4 py-3 opacity-75"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={product.imageURL}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">${product.price}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleRestore(product)}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Move back live
                  </button>
                  <button
                    onClick={() => handleDeleteArchived(product.id)}
                    className="text-sm text-red-600 hover:text-red-800 transition-colors"
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

export default Admin
