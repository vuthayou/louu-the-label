import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import {
  collection,
  addDoc,
  deleteDoc,
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
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [imageFile, setImageFile] = useState(null)

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
    if (user) fetchProducts()
  }, [user])

  async function fetchProducts() {
    const snapshot = await getDocs(collection(db, 'products'))
    setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!imageFile) {
      setError('Please choose an image.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const imageRef = ref(storage, `products/${Date.now()}-${imageFile.name}`)
      await uploadBytes(imageRef, imageFile)
      const imageURL = await getDownloadURL(imageRef)

      await addDoc(collection(db, 'products'), {
        name,
        price: Number(price),
        description,
        category,
        imageURL,
        createdAt: serverTimestamp(),
      })

      setName('')
      setPrice('')
      setDescription('')
      setCategory('')
      setImageFile(null)
      e.target.reset() // clears the file input, which React can't control directly
      await fetchProducts()
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product? This cannot be undone.')) return
    await deleteDoc(doc(db, 'products', id))
    setProducts((prev) => prev.filter((p) => p.id !== id))
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

      <form onSubmit={handleUpload} className="flex flex-col gap-4 mb-12">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
          required
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={uploading}
          className="bg-gray-900 text-white rounded px-3 py-2 hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Add product'}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between border border-gray-200 rounded px-4 py-3"
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
            <button
              onClick={() => handleDelete(product.id)}
              className="text-sm text-red-600 hover:text-red-800 transition-colors"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Admin
