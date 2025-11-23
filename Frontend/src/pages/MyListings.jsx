import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUserListings, addProduct, addToList, removeListing, updateListing, getAllProducts, uploadProductImage, addProductImage, getProductImages, deleteProductImage, getAllCategories, assignCategoryToProduct } from '../services/api'
import './MyListings.css'

const MyListings = () => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStock, setEditingStock] = useState(null)
  const [existingProducts, setExistingProducts] = useState([])
  const [formData, setFormData] = useState({
    PID: '', // Only used when selecting existing product
    ProductName: '',
    Description: '',
    Price: '',
    Stock: '',
    CategoryID: '' // Category selection
  })
  const [categories, setCategories] = useState([])
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [useExisting, setUseExisting] = useState(false)
  const [editingProductImages, setEditingProductImages] = useState(null)
  const [productImages, setProductImages] = useState({})

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchListings()
    fetchExistingProducts()
    fetchCategories()
  }, [isAuthenticated, navigate])

  const fetchCategories = async () => {
    try {
      const data = await getAllCategories()
      setCategories(data)
    } catch (err) {
      console.error('Failed to load categories')
    }
  }

  const fetchListings = async () => {
    try {
      setLoading(true)
      const data = await getUserListings(user.EmailID)
      setListings(data)
      
      // Fetch images for each product
      const imagesMap = {}
      for (const listing of data) {
        try {
          const images = await getProductImages(listing.PID)
          imagesMap[listing.PID] = images
        } catch (err) {
          imagesMap[listing.PID] = []
        }
      }
      setProductImages(imagesMap)
    } catch (err) {
      setError('Failed to load your listings')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchExistingProducts = async () => {
    try {
      const data = await getAllProducts()
      setExistingProducts(data)
    } catch (err) {
      console.error('Failed to load existing products')
    }
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} is too large (max 5MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // Add to existing files
    const newFiles = [...imageFiles, ...validFiles]
    setImageFiles(newFiles)

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, {
          file: file,
          preview: reader.result,
          id: Date.now() + Math.random()
        }])
      }
      reader.readAsDataURL(file)
    })
    setError('')
  }

  const removeImagePreview = (id) => {
    setImagePreviews(prev => {
      const filtered = prev.filter(img => img.id !== id)
      setImageFiles(prevFiles => {
        const index = prev.findIndex(img => img.id === id)
        return prevFiles.filter((_, i) => i !== index)
      })
      return filtered
    })
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (useExisting) {
      // Just add to Lists table
      if (!formData.PID || !formData.Stock) {
        setError('Please select a product and enter stock quantity')
        return
      }

      if (!formData.Stock || formData.Stock <= 0) {
        setError('Stock must be greater than 0')
        return
      }

      try {
        await addToList({
          EmailID: user.EmailID,
          PID: formData.PID,
          Stock: parseInt(formData.Stock)
        })
        setSuccess('Product added to your listings!')
        setFormData({ PID: '', ProductName: '', Description: '', Price: '', Stock: '', CategoryID: '' })
        setShowAddForm(false)
        fetchListings()
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to add product to listings')
      }
    } else {
      // Add to Products table first, then to Lists
      if (!formData.ProductName || !formData.Description || !formData.Price) {
        setError('All product fields are required for new products')
        return
      }

      if (!formData.Stock || formData.Stock <= 0) {
        setError('Stock must be greater than 0')
        return
      }

      try {
        // First add to Products table (PID will be auto-generated)
        const productResponse = await addProduct({
          ProductName: formData.ProductName,
          Description: formData.Description,
          Price: parseFloat(formData.Price)
        })

        // Get the generated PID from response
        const generatedPID = productResponse.PID

        // Upload and add multiple images
        if (imageFiles.length > 0) {
          for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i]
            const uploadResponse = await uploadProductImage(file)
            await addProductImage({
              PID: generatedPID,
              ImageURL: uploadResponse.image_url,
              DisplayOrder: i
            })
          }
        }

        // Assign category if selected
        if (formData.CategoryID) {
          try {
            await assignCategoryToProduct({
              PID: generatedPID,
              CategoryID: parseInt(formData.CategoryID)
            })
          } catch (err) {
            console.error('Failed to assign category:', err)
            // Don't fail the whole operation if category assignment fails
          }
        }

        // Then add to Lists table
        await addToList({
          EmailID: user.EmailID,
          PID: generatedPID,
          Stock: parseInt(formData.Stock)
        })

        setSuccess('Product added successfully!')
        setFormData({ PID: '', ProductName: '', Description: '', Price: '', Stock: '', CategoryID: '' })
        setImageFiles([])
        setImagePreviews([])
        setShowAddForm(false)
        setUseExisting(false)
        fetchListings()
        fetchExistingProducts()
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to add product')
      }
    }
  }

  const handleRemove = async (pid) => {
    if (!window.confirm('Are you sure you want to remove this product from your listings?')) {
      return
    }

    try {
      await removeListing(user.EmailID, pid)
      setSuccess('Product removed from your listings')
      fetchListings()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove product')
    }
  }

  const handleUpdateStock = async (pid, newStock) => {
    if (newStock < 0) {
      setError('Stock cannot be negative')
      return
    }

    try {
      await updateListing({
        EmailID: user.EmailID,
        PID: pid,
        Stock: parseInt(newStock)
      })
      setSuccess('Stock updated successfully!')
      setEditingStock(null)
      fetchListings()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update stock')
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="my-listings-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">My Product Listings</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary"
          >
            {showAddForm ? 'Cancel' : '+ Add Product'}
          </button>
        </div>

        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        {success && (
          <div className="alert alert-success">{success}</div>
        )}

        {showAddForm && (
          <div className="add-product-form card">
            <h2>Add Product to Your Listings</h2>
            <div className="form-toggle" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={useExisting}
                  onChange={(e) => setUseExisting(e.target.checked)}
                />
                <span>Add existing product to my listings</span>
              </label>
            </div>

            <form onSubmit={handleSubmit}>
              {useExisting ? (
                <>
                  <div className="input-group">
                    <label htmlFor="PID">Select Product</label>
                    <select
                      id="PID"
                      name="PID"
                      value={formData.PID}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select a product...</option>
                      {existingProducts
                        .filter(p => !listings.some(l => l.PID === p.PID))
                        .map(product => (
                          <option key={product.PID} value={product.PID}>
                            {product.ProductName} - ₹{product.Price}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="input-group">
                    <label htmlFor="ProductName">Product Name *</label>
                    <input
                      type="text"
                      id="ProductName"
                      name="ProductName"
                      value={formData.ProductName}
                      onChange={handleChange}
                      required
                      placeholder="Enter product name"
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="Description">Description *</label>
                    <textarea
                      id="Description"
                      name="Description"
                      value={formData.Description}
                      onChange={handleChange}
                      required
                      rows="4"
                      placeholder="Enter product description"
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="Price">Price (₹) *</label>
                    <input
                      type="number"
                      id="Price"
                      name="Price"
                      value={formData.Price}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="CategoryID">Category *</label>
                    <select
                      id="CategoryID"
                      name="CategoryID"
                      value={formData.CategoryID}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select a category...</option>
                      {categories.map(category => (
                        <option key={category.CategoryID} value={category.CategoryID}>
                          {category.CategoryName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label htmlFor="images">Product Images (Multiple)</label>
                    <div className="image-upload-area">
                      <input
                        type="file"
                        id="images"
                        name="images"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="images" className="image-upload-label">
                        <span className="upload-icon">📷</span>
                        <span>Click to select images or drag and drop</span>
                        <span className="upload-hint">(Max 5MB per image)</span>
                      </label>
                    </div>
                    {imagePreviews.length > 0 && (
                      <div className="image-previews-grid">
                        {imagePreviews.map((img) => (
                          <div key={img.id} className="image-preview-item">
                            <img
                              src={img.preview}
                              alt="Preview"
                              className="preview-image"
                            />
                            <button
                              type="button"
                              onClick={() => removeImagePreview(img.id)}
                              className="remove-preview-btn"
                              title="Remove image"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="input-group">
                <label htmlFor="Stock">Stock Quantity *</label>
                <input
                  type="number"
                  id="Stock"
                  name="Stock"
                  value={formData.Stock}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="1"
                />
              </div>

              <button type="submit" className="btn btn-primary btn-large" style={{ width: '100%' }}>
                Add to My Listings
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : listings.length === 0 ? (
          <div className="no-listings">
            <div className="no-listings-icon">📦</div>
            <h2>No products listed yet</h2>
            <p>Start selling by adding your first product!</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary"
            >
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="listings-grid">
            {listings.map((listing) => (
              <div key={listing.PID} className="listing-card card">
                <div className="listing-header">
                  <h3 className="listing-name">{listing.ProductName}</h3>
                  <button
                    onClick={() => handleRemove(listing.PID)}
                    className="remove-btn"
                    title="Remove from listings"
                  >
                    🗑️
                  </button>
                </div>
                {productImages[listing.PID] && productImages[listing.PID].length > 0 && (
                  <div className="listing-images" style={{ marginBottom: '12px' }}>
                    <div className="listing-images-gallery">
                      {productImages[listing.PID].slice(0, 3).map((img) => (
                        <img
                          key={img.ImageID}
                          src={`http://127.0.0.1:8000/${img.ImageURL}`}
                          alt={listing.ProductName}
                          className="listing-gallery-image"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      ))}
                      {productImages[listing.PID].length > 3 && (
                        <div className="more-images-indicator">
                          +{productImages[listing.PID].length - 3}
                        </div>
                      )}
                    </div>
                    {editingProductImages === listing.PID ? (
                      <div className="image-management">
                        <div className="product-images-list">
                          {productImages[listing.PID].map((img) => (
                            <div key={img.ImageID} className="manage-image-item">
                              <img
                                src={`http://127.0.0.1:8000/${img.ImageURL}`}
                                alt="Product"
                                className="manage-image-preview"
                              />
                              <button
                                onClick={async () => {
                                  try {
                                    await deleteProductImage(img.ImageID)
                                    setSuccess('Image removed')
                                    fetchListings()
                                  } catch (err) {
                                    setError('Failed to remove image')
                                  }
                                }}
                                className="btn btn-outline btn-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => setEditingProductImages(null)}
                          className="btn btn-outline"
                          style={{ marginTop: '12px' }}
                        >
                          Done
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingProductImages(listing.PID)}
                        className="btn btn-outline btn-sm"
                        style={{ marginTop: '8px', width: '100%' }}
                      >
                        Manage Images
                      </button>
                    )}
                  </div>
                )}
                <p className="listing-description">{listing.Description}</p>
                <div className="listing-details">
                  <div className="listing-price">₹{listing.Price?.toFixed(2)}</div>
                  <div className="listing-stock">
                    {editingStock === listing.PID ? (
                      <div className="stock-editor">
                        <input
                          type="number"
                          min="0"
                          defaultValue={listing.Stock}
                          onBlur={(e) => {
                            if (e.target.value !== listing.Stock.toString()) {
                              handleUpdateStock(listing.PID, e.target.value)
                            } else {
                              setEditingStock(null)
                            }
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.target.blur()
                            }
                          }}
                          autoFocus
                          className="stock-input"
                        />
                        <button
                          onClick={() => setEditingStock(null)}
                          className="btn btn-outline btn-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="stock-display">
                        <span className="stock-label">Stock:</span>
                        <span className="stock-value">{listing.Stock}</span>
                        <button
                          onClick={() => setEditingStock(listing.PID)}
                          className="edit-stock-btn"
                          title="Edit stock"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="listing-footer">
                  <span className="listing-id">ID: {listing.PID}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyListings

